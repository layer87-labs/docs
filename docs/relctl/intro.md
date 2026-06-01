---
sidebar_position: 1
title: Introduction
---

# relctl

Provider-agnostic release management CLI — SemVer driven by branch names, or CalVer driven by the date. One binary, zero release boilerplate.

## Is this for you?

| ✅ Good fit | ❌ Not a fit |
| --- | --- |
| Your team uses branch prefixes like `feature/`, `fix/`, `major/` | You need GitLab, Bitbucket, or Azure DevOps |
| You release via GitHub Releases | You want a fully managed SaaS release tool |
| You build multi-arch binaries in a CI matrix | |
| You need calendar versioning (`YYYY.MM.DD.N`) | |
| You want zero release boilerplate in your pipelines | |

## Quickstart

```yaml
# .github/workflows/release.yaml
on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      - uses: layer87-labs/relctl-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}

      - run: relctl release create --merge-sha ${{ github.sha }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Merge a `feature/my-thing` branch → `relctl` creates a **MINOR** GitHub Release draft. Done.

## Branch → version mapping

The SemVer bump is derived from the merged branch prefix. The trailing `/` is required.

| Bump | Branch prefixes | Example |
| --- | --- | --- |
| MAJOR | `major/` | 1.2.3 → 2.0.0 |
| MINOR | `minor/`, `feature/`, `feat/` | 1.2.3 → 1.3.0 |
| PATCH | `patch/`, `fix/`, `bugfix/`, `dependabot/` | 1.2.3 → 1.2.4 |

## Override version via PR comment

Post a comment on the pull request before merging to override the derived bump:

| Comment | Effect |
| --- | --- |
| `relctl_patch_level: major` | Force a major bump regardless of branch name |
| `relctl_version_override: 2.1.0` | Pin the release to an exact semver value |

## Versioning schemes

### SemVer (default)

The bump level is derived from the merged branch prefix:

| Bump | Branch prefixes | Example |
| --- | --- | --- |
| MAJOR | `major/` | 1.2.3 → 2.0.0 |
| MINOR | `minor/`, `feature/`, `feat/` | 1.2.3 → 1.3.0 |
| PATCH | `patch/`, `fix/`, `bugfix/`, `dependabot/` | 1.2.3 → 1.2.4 |

### CalVer

Format: **`YYYY.MM.DD.N`** (e.g. `2026.06.01.3`). No branch prefix or PR context required.

N is calculated from local git tags only — no SCM API call, fully provider-agnostic.
Requires `fetch-depth: 0` (already a general relctl prerequisite).

Enable via `.relctl.yaml` or the `--version-scheme` flag:

```yaml
# .relctl.yaml
version_scheme: calver
```

```bash
relctl release create --version-scheme calver --dry-run
# → Would create new release with version: 2026.06.01.1
```

## Supported environments

| Environment | Status |
| --- | --- |
| GitHub Actions | ✅ Full |
| GitHub Enterprise | ✅ Full |
| Jenkins Pipelines | ✅ Full |
| Local CLI | ✅ Full |

## Links

- [GitHub Repository](https://github.com/layer87-labs/relctl)
- [relctl-action](https://github.com/layer87-labs/relctl-action)
- [Releases](https://github.com/layer87-labs/relctl/releases)
