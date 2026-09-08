---
sidebar_position: 4
title: Designing the base tier
---

# Designing the base tier

kube-escalate only pays off if everyday credentials are **small enough that
escalating is actually necessary**. If your normal role already carries broad
write access, adding time-limited escalation on top changes nothing — the tool
becomes decoration.

This page is about the half you have to build yourself. Nothing here is
specific to kube-escalate; it is ordinary RBAC design, and it is the part most
often skipped.

## A three-tier model

The split that transfers to most organisations:

| Tier | Holds | How you get it |
| --- | --- | --- |
| `cluster-reader` | Read everywhere, **no Secrets** | Standing |
| `cluster-operator` | Plus workloads and Secrets | Standing |
| `cluster-admin` | Everything | **Only time-limited, via kube-escalate** |

The important line is the last one. Nobody holds `cluster-admin` standing —
not the platform team, not the person on call. It exists only as an escalation
target.

## RBAC has no "deny"

"Read everything except Secrets" cannot be expressed as one rule. RBAC is
purely additive: there is no way to subtract a resource from a wildcard.

The mistake is to write `apiGroups: ["*"], resources: ["*"], verbs: ["get",
"list", "watch"]` and assume Secrets are somehow excluded. They are not — that
rule grants cluster-wide Secret reading, which is close to cluster-admin in
practice.

The approach that works is to compose from the built-in `view` role, which
already omits Secrets and is maintained by the API server as new resource types
appear:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: example:cluster-reader
aggregationRule:
  clusterRoleSelectors:
    - matchLabels:
        rbac.authorization.k8s.io/aggregate-to-view: "true"
rules: []          # filled in by the aggregation controller
---
# Cluster-scoped objects that `view` does not cover, added deliberately.
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: example:cluster-reader-clusterscoped
  labels:
    rbac.authorization.k8s.io/aggregate-to-view: "true"
rules:
  - apiGroups: [""]
    resources: ["nodes", "persistentvolumes", "namespaces"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["storage.k8s.io"]
    resources: ["storageclasses", "volumeattachments"]
    verbs: ["get", "list", "watch"]
```

Letting `view` do the work means the role keeps up with Kubernetes instead of
drifting as resources are added.

:::tip Verify rather than assume
```bash
kubectl auth can-i list secrets --as-group=example:cluster-reader --all-namespaces
```
Expect `no`. Check this whenever the role changes — an accidental wildcard is
easy to add and invisible afterwards.
:::

## Prefix ClusterRoles meant for humans

Give roles bound to people a prefixed name — `example:cluster-reader`, not
`cluster-reader`.

The reason is concrete. A Helm chart once created a `ClusterRole` named
`platform-operator` for its own ServiceAccount, in a cluster where a role of
that name already existed for a group of people. The chart adopted the existing
object and replaced its rules. Humans silently received the operator's
permissions, the operator lost its own, and the two systems managing that name
then fought over it on every sync.

Helm derives object names from the release and chart name, and neither can
contain a colon. A `:` in the name makes that class of collision impossible.

Cluster-scoped names live in one flat namespace shared with every chart you
will ever install. Namespaced objects do not have this problem — a
`ServiceAccount` named `platform-operator` inside its own namespace collides
with nothing.

## Where escalation fits

With the tiers in place:

- Day to day, people work as `cluster-reader` or `cluster-operator`. Most work
  never needs more.
- When something genuinely requires admin, they escalate — with a reason, for a
  bounded time, and it is recorded.
- The escalation group should be **small**. Membership is equivalent to holding
  a permanent admin credential plus an audit trail; see
  [Hardening](./hardening#what-this-does-not-protect-against).

Prefer narrower escalation targets than `cluster-admin` wherever a task allows
it. A role that cannot edit RBAC or admission configuration is genuinely
bounded by its TTL — `cluster-admin` is not, because during the window its
holder can remove the controls that bound them.
