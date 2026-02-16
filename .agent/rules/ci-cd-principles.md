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
5. **Security Scan** — dependency audit, SAST, secrets detection
6. **Deploy** — push to target environment

**Rules:**
- **Fail fast** — run cheapest checks first (lint before build, build before test)
- **Pipeline must be deterministic** — same input = same output, every time
- **Keep pipelines under 15 minutes** — optimize slow stages
- **Never skip failing steps** — fix the pipeline, don't bypass it

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

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t app:${{ github.sha }} .
```

**Rules:**
- Pin action versions (`@v4`, not `@latest` or `@main`)
- Use `needs:` to enforce stage ordering
- Cache dependencies (`cache: true` in setup actions)
- Use `go-version-file` / `node-version-file` instead of hardcoding versions
- Never put secrets in workflow files — use `${{ secrets.NAME }}`

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

### CI/CD Checklist

- [ ] Pipeline stages run in correct order (lint → build → test → deploy)?
- [ ] All versions pinned (base images, CI actions, tool versions)?
- [ ] Dependency caching enabled?
- [ ] Multi-stage Docker builds used?
- [ ] No secrets in config files (use env vars or secrets manager)?
- [ ] Health checks defined for all dependencies?
- [ ] Pipeline completes in under 15 minutes?

### Related Principles
- Code Completion Mandate @code-completion-mandate.md (validation before ship)
- Security Mandate @security-mandate.md (secrets management)
- Git Workflow Principles @git-workflow-principles.md (branch strategy)
- Project Structure @project-structure.md (service paths)
