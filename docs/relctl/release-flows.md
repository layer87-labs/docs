---
sidebar_position: 3.2
title: Release flows
---

# Release flows

A *flow* is the way changes travel from a branch to a published release. relctl supports three; the version scheme you pick (see [Version schemes](./version-schemes.md)) follows from the flow.

| | Flow 1 — continuous, branch-driven | Flow 2 — continuous, automatic version | Flow 3 — reviewed release |
| --- | --- | --- | --- |
| Release trigger | every merge to `main` | every merge to `main` | merging a release pull request |
| Version from | branch prefix | commit messages or date | `CHANGELOG.md` heading |
| Scheme | `semver` | `conventional-commits`, `calver` | `changelog` |
| Human decides the version | when naming the branch | when writing the commit title | in the release pull request |
| Good for | libraries, CLIs, small teams | services, apps | products with deliberate releases, customer-facing versions |

## Flow 1 — continuous, branch-driven (SemVer)

```
feature/x ──PR──▶ main ──▶ relctl release create ──▶ draft release ──▶ build ──▶ publish
```

This is the classic awesome-ci flow. Name the branch `feature/…`, `fix/…` or `major/…` (or `feat!/…` for a breaking change), merge it, and the release job calculates the version.

```yaml
on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 }
      - uses: layer87-labs/relctl-action@v1
        with: { github-token: "${{ secrets.GITHUB_TOKEN }}" }
      - id: release
        run: relctl release create --merge-sha ${{ github.sha }}
        env: { GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}" }
      # build your artifacts with ${{ steps.release.outputs.RELCTL_VERSION }},
      # then: relctl release publish --release-id … --asset file=…
```

On pull requests, `relctl pr info` shows the version the PR would produce.

## Flow 2 — continuous, automatic version

Same shape as flow 1, but nobody names a branch for the version:

- **Conventional Commits** — squash-merge with titles such as `feat: …`, `fix: …`, `feat!: …`. Set `version_scheme: conventional-commits`.
- **CalVer** — the date is the version. Set `version_scheme: calver`.

## Flow 3 — reviewed release (changelog-driven)

```
feature/* ──PR──▶ dev ──release PR──▶ main ──▶ tag + published release
                   │                    (changelog heading dated)
                   └── release candidates (optional)
```

The release is a deliberate act: a pull request dates the topmost `CHANGELOG.md` heading (`## 1.4.0` → `## 1.4.0 — 2026-10-02`). Merging it to `main` *is* the release. Nothing is published by a stray push, and the version is visible in review.

- Work lands on `dev`; `main` only receives release pull requests.
- **Merge the release pull request with a merge commit**, not a squash. A squash puts a commit on `main` that `dev` never had and makes every later merge back conflict.
- Set `version_scheme: changelog`. On `main`, `relctl release create` reads the heading, uses the section as release notes and does nothing if the tag already exists.
- Keep `## ` headings in `CHANGELOG.md` strictly in the format described in [Version schemes](./version-schemes.md#changelog); the file is machine-read.

:::note Roadmap
Computed release-candidate numbers (`X.Y.Z-rc.N` from pushes to `dev`), a merge gate that requires a verified candidate, and forward-merging `main` into `dev` are planned as relctl commands. Until then, combine the `changelog` scheme with your own pipeline steps for those parts.
:::

## Choosing

- Start with **flow 1** if you are coming from awesome-ci — nothing changes except the tool name (see the [migration guide](./migrating-from-awesome-ci.md)).
- Choose **flow 2** if you do not want branch-name conventions to carry meaning.
- Choose **flow 3** when a release needs a decision, a review, or a curated changelog.
