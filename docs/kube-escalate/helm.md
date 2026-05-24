---
sidebar_position: 5
title: Helm Chart
---

# Helm Chart

The operator is distributed as a Helm chart published to GHCR.

```bash
helm install kube-escalate oci://ghcr.io/layer87-labs/charts/kube-escalate \
  --namespace kube-escalate \
  --create-namespace \
  --version <version>
```

## Values reference

### Image

| Value | Default | Description |
| --- | --- | --- |
| `image.repository` | `ghcr.io/layer87-labs/kube-escalate` | Container image repository |
| `image.tag` | Chart `appVersion` | Override the image tag |
| `image.pullPolicy` | `IfNotPresent` | Image pull policy |
| `imagePullSecrets` | `[]` | Pull secrets for private registries |

### Deployment

| Value | Default | Description |
| --- | --- | --- |
| `replicaCount` | `1` | Number of operator replicas |
| `strategy.type` | `RollingUpdate` | Deployment rollout strategy |
| `strategy.rollingUpdate.maxUnavailable` | `0` | Max unavailable during rollout |
| `strategy.rollingUpdate.maxSurge` | `1` | Max surge during rollout |
| `terminationGracePeriodSeconds` | `10` | Grace period for in-flight reconciles |
| `leaderElection.enabled` | `true` | Enable leader election (required when `replicaCount > 1`) |

### Security

| Value | Default | Description |
| --- | --- | --- |
| `securityContext.runAsNonRoot` | `true` | Run as non-root |
| `securityContext.runAsUser` | `65532` | User ID (Chainguard `nonroot`) |
| `securityContext.runAsGroup` | `65532` | Group ID |
| `securityContext.seccompProfile.type` | `RuntimeDefault` | Seccomp profile |
| `containerSecurityContext.allowPrivilegeEscalation` | `false` | Deny privilege escalation |
| `containerSecurityContext.readOnlyRootFilesystem` | `true` | Read-only root filesystem |
| `containerSecurityContext.capabilities.drop` | `["ALL"]` | Drop all capabilities |

### Resources

| Value | Default | Description |
| --- | --- | --- |
| `resources.requests.cpu` | `10m` | CPU request |
| `resources.requests.memory` | `32Mi` | Memory request |
| `resources.limits.cpu` | `100m` | CPU limit |
| `resources.limits.memory` | `128Mi` | Memory limit |

### Probes

| Value | Default | Description |
| --- | --- | --- |
| `livenessProbe.httpGet.path` | `/healthz` | Liveness path |
| `livenessProbe.initialDelaySeconds` | `15` | Liveness initial delay |
| `readinessProbe.httpGet.path` | `/readyz` | Readiness path |
| `readinessProbe.initialDelaySeconds` | `5` | Readiness initial delay |

### Metrics

| Value | Default | Description |
| --- | --- | --- |
| `metrics.enabled` | `true` | Expose Prometheus metrics endpoint |
| `metrics.port` | `8080` | Metrics port |
| `metrics.serviceMonitor.enabled` | `false` | Create a Prometheus Operator `ServiceMonitor` |
| `metrics.serviceMonitor.interval` | `30s` | Scrape interval |
| `metrics.serviceMonitor.labels` | `{}` | Extra labels for label-based discovery |

### High availability

| Value | Default | Description |
| --- | --- | --- |
| `podDisruptionBudget.enabled` | `false` | Enable PDB (recommended with `replicaCount > 1`) |
| `podDisruptionBudget.minAvailable` | `1` | Minimum available replicas |

### Network policy

| Value | Default | Description |
| --- | --- | --- |
| `networkPolicy.enabled` | `false` | Create a `NetworkPolicy` for the operator pods |
| `networkPolicy.apiServerPort` | `443` | API server port (pre-DNAT service port) |
| `networkPolicy.apiServerCIDR` | `0.0.0.0/0` | API server CIDR (leave open if CIDR unknown) |
| `networkPolicy.additionalEgress` | `[]` | Extra egress rules — see [Cilium note](/docs/kube-escalate/installation#cilium-note) |

### Scheduling

| Value | Default | Description |
| --- | --- | --- |
| `nodeSelector` | `{}` | Node selector for operator pods |
| `tolerations` | `[]` | Tolerations for operator pods |
| `affinity` | `{}` | Affinity rules for operator pods |

### Misc

| Value | Default | Description |
| --- | --- | --- |
| `serviceAccount.create` | `true` | Create a dedicated ServiceAccount |
| `serviceAccount.annotations` | `{}` | Annotations (e.g. for IRSA / Workload Identity) |
| `extraEnv` | `[]` | Extra environment variables for the operator container |
| `extraArgs` | `[]` | Extra CLI arguments passed to the operator binary |

## Example: HA production deployment

```yaml
# values-prod.yaml
replicaCount: 2

podDisruptionBudget:
  enabled: true
  minAvailable: 1

metrics:
  serviceMonitor:
    enabled: true
    labels:
      prometheus: kube-prometheus

affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchLabels:
              app.kubernetes.io/name: kube-escalate
          topologyKey: kubernetes.io/hostname
```

```bash
helm upgrade --install kube-escalate \
  oci://ghcr.io/layer87-labs/charts/kube-escalate \
  --namespace kube-escalate \
  --create-namespace \
  --values values-prod.yaml
```
