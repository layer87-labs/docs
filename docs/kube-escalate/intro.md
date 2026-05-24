---
sidebar_position: 1
title: Introduction
---

# kube-escalate

Just-in-Time privilege escalation for Kubernetes. Grant temporary, time-limited cluster
access with automatic expiry, a full audit trail via Kubernetes Events,
and Prometheus metrics — no CRDs, no database, no external dependencies.

## Is this for you?

| ✅ Good fit | ❌ Not a fit |
| --- | --- |
| You need temporary `cluster-admin` access without a permanent binding | You need multi-person approval workflows |
| Your cluster uses OIDC (Okta, Zitadel, Google, …) | You want a Web UI or dashboard |
| You want automatic expiry enforced by the cluster, not a calendar reminder | You need Kubernetes < 1.26 |
| You want a full audit trail without an external log store | You need GitLab or Azure DevOps integration |
| You run Kubernetes on any distribution (RKE2, EKS, GKE, AKS, …) | |

## Quickstart

```bash
# 1. Install the operator
helm install kube-escalate oci://ghcr.io/layer87-labs/charts/kube-escalate \
  --namespace kube-escalate --create-namespace

# 2. Install the plugin (Linux amd64)
curl -Lo kubectl-escalate.tar.gz \
  https://github.com/layer87-labs/kube-escalate/releases/latest/download/kubectl-escalate_linux_amd64.tar.gz
tar xf kubectl-escalate.tar.gz kubectl-escalate
chmod +x kubectl-escalate && sudo mv kubectl-escalate /usr/local/bin/

# 3. Escalate for 1 hour
kubectl escalate \
  --to cluster-admin \
  --duration 1h \
  --reason "Deploying CNPG update"
```

Merge the window when you are done — or wait for automatic expiry.

## How it works

The plugin creates a standard `ClusterRoleBinding` annotated with an expiry timestamp
and your verified OIDC identity. The operator watches these bindings and deletes them
once the TTL elapses.

Your identity comes from the Kubernetes `SelfSubjectReview` API — the API server
populates it from your validated token. **It cannot be forged via CLI arguments.**

```
kubectl escalate ──► SelfSubjectReview ──► ClusterRoleBinding
                      (verified OIDC)         expires-at annotation
                                                       │
                                              operator reconciler
                                              deletes on TTL expiry
                                              emits Kubernetes Event
```

## Feature overview

| Feature | Details |
| --- | --- |
| **Tamper-proof identity** | Caller resolved via `SelfSubjectReview` — API server verifies the OIDC token |
| **Automatic expiry** | Operator requeues at exactly `expiresAt + 1 s`; no polling gap |
| **Finalizer lifecycle** | Distinguishes TTL expiry from manual revocation; correct metrics and events in both cases |
| **Kubernetes Events** | `Warning/EscalationExpired` and `Normal/EscalationRevoked` emitted on every lifecycle change |
| **Prometheus metrics** | `active_escalations`, `escalations_total`, `expired_total`, `revoked_total`, `duration_seconds` |
| **No CRD** | Uses standard `ClusterRoleBinding` / `RoleBinding` — works on any CNCF-conformant cluster |
| **No database** | All state lives in Kubernetes etcd |
| **HA operator** | Leader election, `PodDisruptionBudget`, configurable replica count |
| **Namespace-scoped** | `--namespace <ns>` creates a `RoleBinding` instead of a `ClusterRoleBinding` |

## Components

| Component | Description |
| --- | --- |
| **Operator** | controller-runtime `Deployment` — watches managed bindings, enforces TTL |
| **`kubectl-escalate`** | kubectl plugin — `escalate`, `status`, `revoke` subcommands |
| **Helm chart** | Installs the operator with RBAC, probes, metrics, PDB, NetworkPolicy |

## Links

- [GitHub Repository](https://github.com/layer87-labs/kube-escalate)
- [Releases](https://github.com/layer87-labs/kube-escalate/releases)
- [Helm chart (OCI)](https://github.com/layer87-labs/kube-escalate/pkgs/container/charts%2Fkube-escalate)
