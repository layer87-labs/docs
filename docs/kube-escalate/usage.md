---
sidebar_position: 5
title: Usage
---

# Usage

## Targets

Before escalating, see what you are allowed to escalate to:

```bash
kubectl escalate targets
```

```
TARGET          SCOPE     MAX DURATION   DESCRIPTION
cluster-admin   cluster   8h0m0s         full cluster access — use sparingly
```

The list is the API server's own evaluation of your permissions, so it is
correct however your cluster's RBAC is arranged. Full details, including what
to do when it reports no targets, are in the
[CLI reference](./cli/targets).

---

## Escalate (default action)

Create a time-limited privilege escalation. Your identity is resolved from
your OIDC token via `SelfSubjectReview` — it cannot be supplied or forged via flags.

```bash
# Cluster-wide ClusterRoleBinding
kubectl escalate \
  --to cluster-admin \
  --duration 1h \
  --reason "Deploying CNPG update"

# Namespace-scoped RoleBinding
kubectl escalate \
  --to editor \
  --namespace tenant-acme \
  --duration 30m \
  --reason "Fixing broken deployment"
```

### Flags

| Flag | Required | Description |
| --- | --- | --- |
| `--to` | ✓ | ClusterRole (cluster-wide) or Role (namespace-scoped) to bind |
| `--duration` | ✓ | TTL, e.g. `1h`, `30m`, `90m` |
| `--reason` | ✓ | Human-readable justification (stored in annotation, auditable) |
| `--namespace` / `-n` | — | Scope to a `RoleBinding`; omit for a cluster-wide `ClusterRoleBinding` |
| `--kubeconfig` | — | Path to kubeconfig; default: `$KUBECONFIG` → `~/.kube/config` |

---

## Status

List active escalations.

```bash
# Your own escalations only
kubectl escalate status

# All users (requires list permission on ClusterRoleBindings)
kubectl escalate status --all
```

Example output:

```
REQUESTER               ROLE            SCOPE              EXPIRES AT            REMAINING
eike@layer87.de         cluster-admin   cluster            2026-05-24T16:00:00Z  55m0s
eike@layer87.de         editor          ns/tenant-acme     2026-05-24T15:30:00Z  25m0s
```

:::info[EXPIRES AT may not be the real expiry]
`status` reads the `kube-escalate/expires-at` annotation as originally
written by the plugin. If your request exceeded the operator's `maxDuration`
ceiling, the operator clamps the *effective* expiry but deliberately never
rewrites this annotation (see [Known limitations](#known-limitations)) — so
`status` can show a later time than the binding will actually live to. Check
for an `EscalationClamped` event to see the real effective expiry.
:::

---

## Revoke

Delete active escalations before their TTL elapses.

```bash
# Revoke your own escalations
kubectl escalate revoke

# Revoke all users' escalations (requires delete on ClusterRoleBindings)
kubectl escalate revoke --all
```

When you revoke an escalation the operator emits an `EscalationRevoked`
Kubernetes Event. `kube_escalate_active_escalations` is computed from live
cluster state at scrape time, so it reflects the revocation on the next
scrape without any explicit increment/decrement bookkeeping.

---

## Common workflows

### Daily operations

```bash
# Check whether you have any active escalations
kubectl escalate status

# Escalate for 30 minutes to debug a pod
kubectl escalate \
  --to cluster-admin \
  --duration 30m \
  --reason "Debugging CrashLoopBackOff in prod"

# Do your work …

# Revoke early once done — don't wait for the TTL
kubectl escalate revoke
```

### Incident response

```bash
# Escalate for 2 hours during a P0 incident
kubectl escalate \
  --to cluster-admin \
  --duration 2h \
  --reason "P0: database failover JIRA-4821"

# During the incident — see who else has active escalations
kubectl escalate status --all

# After the incident — revoke everything
kubectl escalate revoke --all
```

---

## Observability & audit

### Kubernetes Events

The operator emits an event for every lifecycle transition:

| Reason | Type | Emitted when |
| --- | --- | --- |
| `EscalationExpired` | Warning | The TTL elapsed and the operator deleted the binding |
| `EscalationRevoked` | Normal | The binding was deleted before its TTL (`kubectl escalate revoke`) |
| `EscalationClamped` | Warning | The requested TTL exceeded `maxDuration`; the effective expiry was capped |

```bash
# Escalations expired by TTL
kubectl get events.events.k8s.io -A \
  --field-selector reason=EscalationExpired \
  --sort-by='.eventTime'

# Manually revoked escalations
kubectl get events.events.k8s.io -A \
  --field-selector reason=EscalationRevoked \
  --sort-by='.eventTime'

# Requests that were clamped to the maxDuration ceiling
kubectl get events.events.k8s.io -A \
  --field-selector reason=EscalationClamped \
  --sort-by='.eventTime'
```

:::danger[Kubernetes Events expire in about an hour]
Kubernetes retains Events for roughly one hour (the exact TTL is controlled
by the API server's `--event-ttl` flag) before garbage-collecting them. They
are useful for real-time / near-real-time troubleshooting, but they are
**not** a retrospective audit log. If you need to answer "who escalated to
what, and when" beyond that window, you must ship and retain the operator's
structured logs (`logr`/zap JSON on stdout) to a log store — e.g. Loki, or
whatever your cluster already forwards Pod logs to — and query that instead.
Prometheus counters (below) tell you *how many* transitions occurred, not
*who* or *why*; only the logs or Events carry that detail.
:::

### Prometheus metrics

Exposed on `:8080/metrics` by the operator and labelled `{user, role,
namespace}`.

| Metric | Type | Description |
| --- | --- | --- |
| `kube_escalate_active_escalations` | Gauge | Currently active (unexpired) escalations, counted from live cluster state at scrape time |
| `kube_escalate_escalations_total` | Counter | Total escalations created |
| `kube_escalate_expired_total` | Counter | Escalations deleted by TTL |
| `kube_escalate_revoked_total` | Counter | Escalations manually revoked |
| `kube_escalate_duration_seconds` | Histogram | Duration of completed escalations |

Enable scraping with `metrics.serviceMonitor.enabled=true` in the Helm chart
(requires the Prometheus Operator CRDs) — without it, `/metrics` is served
but nothing scrapes it. See [Helm Chart](./helm) for the full values
reference.

### Raw annotation inspection

```bash
# List all managed bindings with expiry and requester
kubectl get clusterrolebindings \
  -l kube-escalate/managed=true \
  -o custom-columns=\
NAME:.metadata.name,\
REQUESTER:.metadata.annotations.kube-escalate/requester,\
EXPIRES:.metadata.annotations.kube-escalate/expires-at,\
REASON:.metadata.annotations.kube-escalate/reason
```

### Prometheus queries

```promql
# Active escalations right now
kube_escalate_active_escalations

# Rate of new escalations per minute
rate(kube_escalate_escalations_total[5m]) * 60

# Escalations expired by TTL in the last hour
increase(kube_escalate_expired_total[1h])

# Escalations manually revoked in the last hour
increase(kube_escalate_revoked_total[1h])

# Average escalation duration in minutes
rate(kube_escalate_duration_seconds_sum[1h])
  / rate(kube_escalate_duration_seconds_count[1h]) / 60
```

---

## Two things that surprise people

### Expiry gives no warning

Access ends silently — the next `kubectl` call simply returns `Forbidden`. In
the middle of a repair that is genuinely disorienting.

```bash
kubectl escalate status    # remaining time
```

There is no renew command by design. Request a new escalation with a fresh
reason, so the trail records a decision rather than a drift.

### Even while escalated, you may not be able to create ordinary RBAC

If you deployed the [hardening](./hardening) policy, it matches on your
**group**, not on your role. Escalating grants you `cluster-admin` but does not
change the groups in your token — so you remain constrained: every binding you
create must be kube-escalate-managed, carry an expiry, and name you as its
subject.

This is deliberate. That policy is exactly what stops an escalation from being
converted into permanent access; exempting escalated users would defeat it.

Change RBAC through your infrastructure-as-code instead, which runs as
`system:masters` and is exempt from the policy. Somebody who does not know this
will look in the wrong place at three in the morning.

---

## Known limitations

- **No multi-person approval workflow.** `kubectl escalate` is a single-step,
  self-service grant — there is no request/approve step. If you need that,
  put it in front of the RBAC/policy layer (e.g. a ticketing system that
  temporarily adds a user to the escalation group).
- **One global TTL ceiling, not per-role or per-user.** `maxDuration` applies
  cluster-wide to every managed binding. There is no way to give one role a
  shorter cap than another within kube-escalate itself; that would need to be
  layered on separately (e.g. multiple operator deployments each watching a
  different label value, or a custom admission check).
- **`status` can display a stale (unclamped) TTL.** When a request exceeds
  `maxDuration`, the operator computes the effective (clamped) expiry from
  `CreationTimestamp + maxDuration` on every reconcile, but it deliberately
  never rewrites the `kube-escalate/expires-at` annotation on the binding.
  This is not an oversight: any non-finalizer-only `Update` to a managed
  binding — even one only touching an unrelated annotation — is validated by
  the Kubernetes API server's RBAC privilege-escalation check as if it were
  granting the binding's `RoleRef`. An operator ServiceAccount that (by
  design, for least privilege) doesn't hold the target role's own
  permissions would have that `Update` rejected, permanently breaking the
  reconcile for that binding. So `kubectl escalate status` may show the
  originally requested TTL rather than the real, shorter, enforced one. The
  `EscalationClamped` event always carries the true effective expiry — treat
  it as authoritative over the annotation whenever the two might disagree.
