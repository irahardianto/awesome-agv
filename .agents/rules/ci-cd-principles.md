---
trigger: model_decision
description: When configuring CI/CD pipelines, deployment processes, release strategies, or build configurations
---

## CI/CD Principles

> **Agent scope:** This rule applies when writing CI/CD manifests
> (Dockerfile, docker-compose, GitHub Actions, GitLab CI, etc.).
> It is layered by deployment complexity — apply only the levels relevant to the project.

---

### Deployment Complexity Levels

| Level | Applies When | Key Additions |
|-------|-------------|---------------|
| **0 — All projects** | Always | Lint, test, security scan, secrets management |
| **1 — Containerized** | Docker image is the artifact | Multi-stage build, image scan, SBOM attestation |
| **2 — Orchestrated** | Kubernetes or managed container platform | Deployment strategies, GitOps |

Load supplementary rules when reaching Level 2:
- Deployment strategies + GitOps → **@ci-cd-gitops-kubernetes.md**

---

### Level 0 — Universal Pipeline Design

**Pipeline Stages (in order):**

1. **Lint** — static analysis, formatting checks
2. **Build** — compile, bundle, generate artifacts
3. **Unit Test** — fast tests with mocked dependencies
4. **Integration Test** — tests against real dependencies (Testcontainers)
5. **Security Scan** — dependency audit, SAST, secrets detection
6. **Deploy** — push to target environment

**Rules:**

- **Fail fast** — run cheapest checks first (lint before build, build before test)
- **Pipeline must be deterministic** — same input = same output, every time
- **Keep pipelines under 15 minutes** — optimize slow stages
- **Never skip failing steps** — fix the pipeline, don't bypass it
- **Build once, deploy many** — same artifact promotes through all environments

---

### Level 0 — Deploy Target Examples

The deploy stage varies by target. The pipeline stages before it are identical.

**Docker Compose (local / staging):**
```bash
docker compose up --build
```

**Cloud Run:**
```bash
gcloud run deploy myapp \
  --image gcr.io/project/myapp:$GIT_SHA \
  --region us-central1
```

**Vercel (frontend SPA):**
```bash
vercel deploy --prod
```

**Kubernetes:**
Use GitOps — see **@ci-cd-gitops-kubernetes.md**.

---

### Level 0 — Manifest Patterns

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
        uses: trufflesecurity/trufflehog@v3   # Pin to release tag
      - name: Audit dependencies
        run: go run golang.org/x/vuln/cmd/govulncheck@latest ./...
```

**Rules:**

- Pin action versions (`@v4`, not `@latest` or `@main`)
- Use `needs:` to enforce stage ordering
- Cache dependencies (`cache: true` in setup actions)
- Use `go-version-file` / `node-version-file` instead of hardcoding versions
- Never put secrets in workflow files — use `${{ secrets.NAME }}`

---

### Level 1 — Containerized Projects

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

#### Image Scan + SBOM Attestation

After building and pushing a container image, scan it and attach a signed SBOM attestation.

**Preferred approach: Cosign keyless signing (no key management required)**

Cosign integrates with your CI provider's OIDC token (GitHub Actions, GitLab CI) to sign
images and attestations without storing or rotating cryptographic keys. The signature is
anchored to a transparency log (Rekor), making it auditable and policy-enforceable.

```yaml
  build:
    needs: security
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      id-token: write              # Required for Cosign keyless signing

    steps:
      - uses: actions/checkout@v4

      - name: Install Cosign
        uses: sigstore/cosign-installer@v3

      - name: Build and push image
        id: build
        run: |
          docker build -t ghcr.io/${{ github.repository }}:${{ github.sha }} .
          docker push ghcr.io/${{ github.repository }}:${{ github.sha }}

      - name: Scan container image
        run: |
          trivy image \
            --severity HIGH,CRITICAL \
            --exit-code 1 \
            ghcr.io/${{ github.repository }}:${{ github.sha }}

      - name: Generate SBOM
        run: |
          syft ghcr.io/${{ github.repository }}:${{ github.sha }} \
            -o cyclonedx-json > sbom.json

      - name: Attest SBOM to image (keyless, OIDC-backed)
        run: |
          cosign attest \
            --predicate sbom.json \
            --type cyclonedx \
            ghcr.io/${{ github.repository }}:${{ github.sha }}
        # Cosign uses the GitHub Actions OIDC token automatically.
        # No COSIGN_PASSWORD or secret keys required.
```

**How the SBOM travels with the image:**

The SBOM attestation is stored as an OCI reference in the same container registry alongside
the image digest. It requires no additional infrastructure — any registry that supports OCI
artifacts (ghcr.io, Google Artifact Registry, AWS ECR, Docker Hub) works out of the box.

To verify the attestation at any time:
```bash
cosign verify-attestation \
  --type cyclonedx \
  ghcr.io/org/app@sha256:<digest>
```

**Use ORAS instead of Cosign when:**
- You need to attach arbitrary supply chain artifacts (scan reports, provenance JSON, build logs)
  that go beyond what Cosign's attestation model covers.
- `oras attach ghcr.io/org/app@sha256:<digest> scan-report.json`

**Rules:**

- Prefer Cosign keyless signing — eliminates secret key management overhead
- SBOM is attached to the image in the OCI registry — not stored as a CI artifact
- Scan BEFORE attesting — the SBOM reflects the scanned image
- For non-containerized apps (Vercel, Netlify frontend), use `npm audit`/`yarn audit` instead;
  no SBOM attachment applies

---

### Deployment vs Release (Feature Flags)

Code deployment and feature release are separate concerns. When the PRD or technical
architecture explicitly requires gradual rollout, A/B testing, or kill switches, feature
flags can decouple them.

> **Agent rule:** Do NOT implement feature flags unless explicitly required by the
> PRD or technical architecture document. See **@feature-flags-principles.md** for
> implementation guidance when they are required.

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

### CI/CD Checklist

**Always (all projects):**
- [ ] Pipeline stages run in correct order (lint → build → test → security → deploy)?
- [ ] All versions pinned (base images, CI actions, tool versions)?
- [ ] Dependency caching enabled?
- [ ] No secrets in config files (use env vars or secrets manager)?
- [ ] Secret scanning in CI?
- [ ] Health checks defined for all service dependencies?
- [ ] Pipeline completes in under 15 minutes?

**If building container images (Level 1):**
- [ ] Multi-stage Docker builds used?
- [ ] Container image scanned for HIGH/CRITICAL CVEs?
- [ ] SBOM generated and attested to image via Cosign (keyless)?

**If deploying to Kubernetes (Level 2):**
- [ ] Deployment strategy defined (blue-green, canary, or rolling)?
- [ ] GitOps in place — no direct `kubectl apply` in production?
- [ ] Secrets reference external store, not plaintext in git?
- See **@ci-cd-gitops-kubernetes.md** for full checklist

**If feature flags are required by PRD/architecture:**
- [ ] Flag infrastructure specified in tech architecture document?
- [ ] Every flag has an owner and expiry date?
- See **@feature-flags-principles.md** for full checklist

---

### Related Principles

- Code Completion Mandate @code-completion-mandate.md (validation before ship)
- Security Mandate @security-mandate.md (secrets management)
- Security Principles @security-principles.md (image scanning, SBOM)
- Git Workflow Principles @git-workflow-principles.md (branch strategy)
- Project Structure @project-structure.md (service paths)
- Testing Strategy @testing-strategy.md (unit and integration test stages)
- GitOps + Kubernetes Deployment @ci-cd-gitops-kubernetes.md
- Feature Flags @feature-flags-principles.md
