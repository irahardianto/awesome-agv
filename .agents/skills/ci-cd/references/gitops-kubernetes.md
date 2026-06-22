## CI/CD — GitOps and Kubernetes Deployment

> **Agent scope:** This is a supplement to `../SKILL.md` (Level 2).
> Apply only when the project targets Kubernetes or a Kubernetes-based managed platform.
> Do not apply rolling/canary/blue-green patterns to Docker Compose or serverless deployments.

---

### Choosing a Deployment Strategy

| Strategy | When to use | Trade-off |
|----------|-------------|-----------|
| **Rolling** | Default for most services; SLO requirements | Simple, but mixes versions briefly |
| **Blue-Green** | Zero-downtime with instant rollback | Doubles infrastructure cost during switch |
| **Canary** | Risk-reducing incremental rollout; A/B variants | Requires traffic splitting capability |

---

### Rolling Deployment (Default)

Kubernetes native. Suitable for most stateless services.

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 25%        # Max pods above desired count during update
    maxUnavailable: 0%   # Zero-downtime: don't remove pods before new ones ready
```

**Rules:**

- Set `maxUnavailable: 0` for production services with SLO requirements
- Set `minReadySeconds` to let pods stabilize before proceeding
- Configure `terminationGracePeriodSeconds` to finish in-flight requests before shutdown

---

### Blue-Green Deployment

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
- Database migrations must be backward-compatible (blue still runs against the same DB)

---

### Canary Deployment

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
- Feature flags complement canary routing for functional (not just traffic) testing

---

### GitOps Pattern

For Kubernetes environments, use **declarative GitOps** instead of imperative `kubectl apply`.

**Pattern:**

```
Application Repo (code) → CI builds image → updates tag in Config Repo
Config Repo (K8s manifests) → ArgoCD/Flux syncs to cluster automatically
```

**Rules:**

- Git is the **single source of truth** for cluster state
- All changes to production go through PRs on the config repo — no direct `kubectl` in prod
- ArgoCD/Flux continuously reconciles — any manual drift is auto-corrected
- Secrets reference external secret stores — **never plaintext in git**

#### Example ArgoCD Application

```yaml
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
      prune: true      # Remove resources deleted from git
      selfHeal: true   # Reconcile manual drift
```

---

### Secrets Management in Kubernetes

Never store plaintext secrets in git — even in private repositories.

| Tool | Pattern |
|------|---------|
| **External Secrets Operator** | Syncs secrets from AWS Secrets Manager, GCP Secret Manager, Vault into K8s Secrets |
| **Sealed Secrets** | Encrypts secrets with a cluster-held key; safe to commit encrypted form |
| **Vault Agent Injector** | Sidecars inject secrets directly into pods at runtime |

Choose based on your cloud provider or existing tooling. Document the choice in your
technical architecture document.

---

### Kubernetes CI/CD Checklist

- [ ] Deployment strategy defined and documented (rolling / blue-green / canary)?
- [ ] `maxUnavailable: 0` set for production services with SLO?
- [ ] `terminationGracePeriodSeconds` configured for graceful shutdown?
- [ ] GitOps in place — no direct `kubectl apply` commands in production CI pipeline?
- [ ] Config repo exists, separate from application repo?
- [ ] All PRs to config repo require review before ArgoCD/Flux sync?
- [ ] Secrets stored in external secret store, not plaintext in git?
- [ ] Rollback procedure tested and documented?

---

### Related Principles

- CI/CD Principles ../SKILL.md (core pipeline — read first)
- Security Principles @security-principles.md (secrets management)
- Monitoring and Alerting Principles @monitoring-and-alerting-principles.md (canary success metrics)
- Feature Flags @.agents/skills/feature-flags/SKILL.md (canary + feature flag interaction)
- Rule Priority @.agents/rules/rule-priority.md
