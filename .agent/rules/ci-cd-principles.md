---
trigger: model_decision
description: When configuring CI/CD pipelines, deployment processes, release strategies, or build configurations
---

## CI/CD Principles

> **Agent scope:** This rule is most useful when writing CI/CD manifests
> (Dockerfile, docker-compose, GitHub Actions, GitLab CI, etc.).
> Use these principles to generate correct, production-grade pipeline configurations.

### Pipeline Design

**Pipeline Stages (in order):**

1. **Lint** — static analysis, formatting checks
2. **Build** — compile, bundle, generate artifacts
3. **Unit Test** — fast tests with mocked dependencies
4. **Integration Test** — tests against real dependencies (Testcontainers)
5. **Security Scan** — dependency audit, SAST, secrets detection, container image scan
6. **Build & Publish Image** — multi-stage Docker build, tag with git sha + semver
7. **Deploy** — push to target environment

**Rules:**

- **Fail fast** — run cheapest checks first (lint before build, build before test)
- **Pipeline must be deterministic** — same input = same output, every time
- **Keep pipelines under 15 minutes** — optimize slow stages
- **Never skip failing steps** — fix the pipeline, don't bypass it
- **Build once, deploy many** — same image artifact promotes through all environments

### Manifest Patterns

#### Dockerfile (Multi-Stage Build)

```dockerfile
# Stage 1: Build
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download               # Cache dependencies
COPY . .
RUN CGO_ENABLED=0 go build -o /bin/api ./cmd/api

# Stage 2: Runtime (minimal image)
FROM gcr.io/distroless/static-debian12
COPY --from=builder /bin/api /bin/api
EXPOSE 8080
CMD ["/bin/api"]
```

**Rules:**

- Always use multi-stage builds (build → runtime)
- Pin base image versions (never use `:latest`)
- Copy dependency files first, then source (layer caching)
- Use minimal runtime images (distroless, alpine, scratch)
- Never copy `.env`, secrets, or `.git` into images

#### Docker Compose (Local Development)

```yaml
services:
  backend:
    build:
      context: ./apps/backend      # Path per project-structure.md
    ports:
      - "8080:8080"
    env_file: .env                  # Environment config
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine      # Pin versions
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

**Rules:**

- Always define health checks for dependencies
- Use `depends_on` with `condition: service_healthy`
- Pin all image versions
- Use volumes for persistent data
- Never hardcode credentials — use env_file or environment variables

#### GitHub Actions

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version-file: go.mod   # Pin via go.mod
          cache: true               # Cache dependencies
      - run: gofumpt -l -e -d .
      - run: go vet ./...
      - run: staticcheck ./...

  test:
    needs: lint                     # Fail fast: lint before test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version-file: go.mod
          cache: true
      - run: go test -race -cover ./...

  security:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Scan for secrets
        uses: trufflesecurity/trufflehog@main
      - name: Audit dependencies
        run: go run golang.org/x/vuln/cmd/govulncheck@latest ./...

  build:
    needs: security
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and push image
        run: docker build -t app:${{ github.sha }} .
      - name: Scan container image
        run: trivy image --severity HIGH,CRITICAL --exit-code 1 app:${{ github.sha }}
      - name: Generate SBOM
        run: syft app:${{ github.sha }} -o cyclonedx-json > sbom.json
      - uses: actions/upload-artifact@v4
        with: { name: sbom, path: sbom.json }
```

**Rules:**

- Pin action versions (`@v4`, not `@latest` or `@main`)
- Use `needs:` to enforce stage ordering
- Cache dependencies (`cache: true` in setup actions)
- Use `go-version-file` / `node-version-file` instead of hardcoding versions
- Never put secrets in workflow files — use `${{ secrets.NAME }}`

---

### Deployment Strategies

#### Blue-Green Deployment

**When:** Zero-downtime deployments where rollback must be instant and clean.

```
┌──────────────┐     ┌──────────────┐
│   Blue (v1)  │     │  Green (v2)  │
│  [LIVE 100%] │────→│  [STANDBY]   │
└──────────────┘     └──────────────┘
         ↕ Switch load balancer
┌──────────────┐     ┌──────────────┐
│   Blue (v1)  │     │  Green (v2)  │
│  [STANDBY]   │     │  [LIVE 100%] │
└──────────────┘     └──────────────┘
```

**Rules:**

- Both environments must be identical in infrastructure
- Run smoke tests against green before switching traffic
- Keep blue alive for at least 30 minutes post-switch (fast rollback window)
- Database migrations must be backward-compatible (blue still runs against same DB)

#### Canary Deployment

**When:** Risk-reducing incremental rollout; A/B testing deployment variants.

```
Traffic split during rollout:
  5% → canary (v2)
 95% → stable (v1)
         ↓ metrics look good
 25% → canary
 75% → stable
         ↓ bake time passes
100% → canary (now stable)
```

**Rules:**

- Define success metrics before starting rollout (error rate, latency SLO)
- Set automatic rollback threshold: if canary error rate > 2× baseline → auto-rollback
- Minimum bake time per traffic increment: 15–30 minutes
- Use feature flags (not just traffic routing) for functional canary tests

#### Rolling Deployment (Kubernetes)

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 25% # Max pods above desired count during update
    maxUnavailable: 0% # Zero-downtime: don't remove pods before new ones ready
```

**Rules:**

- Always set `maxUnavailable: 0` for production services with SLO requirements
- Set `minReadySeconds` to let pods stabilize before proceeding
- Configure `terminationGracePeriodSeconds` to finish in-flight requests

---

### Feature Flags

Use feature flags to decouple **deployment** from **release**. Code can be deployed without being enabled.

**When to use:**

- Risky features that need gradual rollout
- A/B testing and experimentation
- Kill switches for problematic code paths
- Database migrations (enable new code path only after data migration complete)

**Types:**
| Flag Type | Use | Example |
|-----------|-----|---------|
| **Release flag** | Enable feature for % of users | `new-checkout-flow: 0→5→25→100%` |
| **Ops flag** | Emergency kill switch | `use-legacy-payment-provider` |
| **Experiment flag** | A/B test | `button-color-test` |
| **Permission flag** | Feature entitlement | `pro-tier-analytics` |

**Rules:**

- Every flag has an **owner** and an **expiry date** (maximum 90 days for release flags)
- Remove flags after 100% rollout — flag debt is real tech debt
- Flags are evaluated server-side (not client-side) for security-sensitive features
- Store flag config in a dedicated service (LaunchDarkly, Unleash, Flagsmith) — not hardcoded

---

### Environment Promotion

```
dev → staging → production
```

- **Dev:** Deployed on every push to feature branch
- **Staging:** Deployed on merge to main/develop
- **Production:** Deployed via manual approval or automated release

**Rules:**

- Same artifacts promote through environments (build once, deploy many)
- Environment-specific config via environment variables, not build flags
- Never deploy directly to production without staging validation

---

### GitOps (Kubernetes / Infrastructure)

For Kubernetes-based environments, use **declarative GitOps** instead of imperative `kubectl apply`.

**Pattern:**

```
Application Repo (code) → CI builds image → pushes tag to Config Repo
Config Repo (K8s manifests) → ArgoCD/Flux syncs to cluster automatically
```

**Rules:**

- Git is the **single source of truth** for cluster state
- All changes to production go through PRs on the config repo — no direct `kubectl` in prod
- ArgoCD/Flux continuously reconciles — any manual drift is auto-corrected
- Secrets reference external secret stores (External Secrets Operator, Sealed Secrets) — never plaintext in git

```yaml
# Example ArgoCD Application
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp-production
spec:
  source:
    repoURL: https://github.com/org/config-repo
    path: environments/production/myapp
    targetRevision: HEAD
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true # Remove resources deleted from git
      selfHeal: true # Reconcile manual drift
```

---

### CI/CD Checklist

- [ ] Pipeline stages run in correct order (lint → build → test → security → deploy)?
- [ ] All versions pinned (base images, CI actions, tool versions)?
- [ ] Dependency caching enabled?
- [ ] Multi-stage Docker builds used?
- [ ] No secrets in config files (use env vars or secrets manager)?
- [ ] Health checks defined for all dependencies?
- [ ] Secret scanning + container image scanning in CI?
- [ ] SBOM generated on every production build?
- [ ] Deployment strategy defined (blue-green, canary, or rolling)?
- [ ] Feature flags in use for risky/incremental releases?
- [ ] GitOps in place for infrastructure (no manual kubectl in prod)?
- [ ] Pipeline completes in under 15 minutes?

### Related Principles

- Code Completion Mandate @code-completion-mandate.md (validation before ship)
- Security Mandate @security-mandate.md (secrets management)
- Security Principles @security-principles.md (SBOM, image scanning)
- Git Workflow Principles @git-workflow-principles.md (branch strategy)
- Project Structure @project-structure.md (service paths)
