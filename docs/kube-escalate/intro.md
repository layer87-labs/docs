---
sidebar_position: 1
title: Introduction
---

# kube-escalate

Just-in-Time privilege escalation for Kubernetes. Grant temporary, time-limited cluster
access with automatic expiry, a full audit trail via Kubernetes Events,
and Prometheus metrics — no CRDs, no database, no external dependencies.

Instead of standing `cluster-admin` for anyone who might occasionally need it,
users request an elevated role for a bounded window. The role is removed
automatically when the window closes.

## Is this for you?

| ✅ Good fit | ❌ Not a fit |
| --- | --- |
| You need temporary `cluster-admin` access without a permanent binding | You need multi-person approval workflows |
| Your cluster's API server trusts OIDC, X.509 client certs, or any other authenticator | You want a Web UI or dashboard |
| You want automatic expiry enforced by the cluster, not a calendar reminder | You need per-role or per-user TTL policy (v1 enforces one global ceiling) |
| You want a full audit trail without an external log store *for events alone* | You need Kubernetes < 1.26 |
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

Revoke the escalation when you are done — or wait for automatic expiry.

:::warning Installing the operator alone grants nothing
The operator only enforces the TTL on bindings that already exist — it never
grants anyone the ability to create one. Before anyone can run
`kubectl escalate`, you must give them RBAC to do so, and you should install
the hardening `ValidatingAdmissionPolicy` alongside it. Both are covered in
[RBAC prerequisites](./installation#rbac-prerequisites) and
[Hardening](./hardening) — read those before rolling this out to real users.
:::

## How it works

1. The plugin calls the Kubernetes `SelfSubjectReview` API to resolve your
   identity. The API server populates the response from your validated
   token — **it cannot be forged via CLI arguments.**
2. The plugin creates a standard `ClusterRoleBinding` (cluster-wide) or
   `RoleBinding` (with `--namespace`), labelled `kube-escalate/managed=true`
   and annotated with the expiry timestamp, your identity, and your reason.
   The binding grants the role immediately.
3. The operator watches every object carrying that label, enforces a TTL
   ceiling, deletes the binding on expiry, and emits Kubernetes Events and
   Prometheus metrics for every lifecycle transition.

```
kubectl escalate ──► SelfSubjectReview ──► ClusterRoleBinding / RoleBinding
                      (verified identity)     kube-escalate/managed=true
                                               expires-at annotation
                                                       │
                                              operator reconciler
                                              enforces the TTL ceiling
                                              deletes on expiry
                                              emits Kubernetes Events
```

## Feature overview

| Feature | Details |
| --- | --- |
| **Tamper-proof identity** | Caller resolved via `SelfSubjectReview` — API server verifies the token, identity can't be supplied by the caller |
| **Automatic expiry** | Operator requeues at exactly the effective expiry instant; no polling gap |
| **TTL ceiling** | Operator clamps any requested expiry beyond `maxDuration` (default `24h`), cluster-wide |
| **Finalizer lifecycle** | Distinguishes TTL expiry from manual revocation; correct metrics and events in both cases |
| **Kubernetes Events** | `EscalationExpired`, `EscalationRevoked`, `EscalationClamped` emitted on every lifecycle change |
| **Prometheus metrics** | `active_escalations` gauge, `escalations_total`, `expired_total`, `revoked_total`, `duration_seconds` |
| **No CRD** | Uses standard `ClusterRoleBinding` / `RoleBinding` — works on any CNCF-conformant cluster |
| **No database** | All state lives in Kubernetes etcd |
| **Provider-agnostic identity** | Works with any OIDC provider, or X.509 client certs, trusted by the API server |
| **HA operator** | Leader election, `PodDisruptionBudget`, configurable replica count |
| **Namespace-scoped** | `--namespace <ns>` creates a `RoleBinding` instead of a `ClusterRoleBinding` |

## Components

| Component | Description |
| --- | --- |
| **Operator** | controller-runtime `Deployment` — watches managed bindings, enforces the TTL ceiling |
| **`kubectl-escalate`** | kubectl plugin — `escalate`, `status`, `revoke` subcommands |
| **Helm chart** | Installs the operator with RBAC, probes, metrics, PDB, NetworkPolicy |

kube-escalate ships no admission webhook, CRD, or database. The security
boundary is native Kubernetes RBAC, optionally hardened with a
`ValidatingAdmissionPolicy` — see [Hardening](./hardening).

## Links

- [GitHub Repository](https://github.com/layer87-labs/kube-escalate)
- [Releases](https://github.com/layer87-labs/kube-escalate/releases)
- [Helm chart (OCI)](https://github.com/layer87-labs/kube-escalate/pkgs/container/charts%2Fkube-escalate)
