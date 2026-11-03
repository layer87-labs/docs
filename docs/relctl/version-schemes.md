---
sidebar_position: 3.1
title: Version schemes
---

# Version schemes

relctl derives the next version of a release from one of four schemes. Pick the one that matches how your team works — the scheme only decides *how the version is calculated*, everything else (draft release, assets, publishing) stays the same.

| Scheme | Version comes from | Typical use |
| --- | --- | --- |
| [`semver`](#semver-default) (default) | Branch prefix of the merged pull request | Teams that name branches `feature/…`, `fix/…` |
| [`conventional-commits`](#conventional-commits) | Commit messages since the last release | Teams that squash-merge with Conventional Commit titles |
| [`calver`](#calver) | The current date | Services and apps where "which build is live" matters more than API compatibility |
| [`changelog`](#changelog) | A heading in `CHANGELOG.md` | Reviewed releases: the version is written down by a human and merged like any other change |

Select the scheme in `.relctl.yaml` (repository root) or with a flag. The flag wins over the file.

```yaml
# .relctl.yaml
version_scheme: semver   # semver | conventional-commits | calver | changelog
```

```bash
relctl release create --version-scheme calver
```

An explicit `--version` always overrides the calculated version.

`relctl pr info` uses the same scheme. For `calver`, `conventional-commits` and `changelog` it prints the version the pull request would release, not a SemVer version derived from the branch prefix, and exports `RELCTL_VERSION_SCHEME`. The help comment relctl posts on the pull request says what decides the version of the scheme: only `semver` offers the comment commands below.

## SemVer (default)

The bump level comes from the prefix of the merged branch. The trailing `/` is required.

| Bump | Branch prefixes | Example |
| --- | --- | --- |
| MAJOR | `major/`, or any prefix ending in `!` (`feat!/`, `fix!/`) | 1.2.3 → 2.0.0 |
| MINOR | `minor/`, `feature/`, `feat/` | 1.2.3 → 1.3.0 |
| PATCH | `patch/`, `fix/`, `bugfix/`, `dependabot/` | 1.2.3 → 1.2.4 |

Branches with an unknown prefix produce a PATCH bump and a warning.

**Overrides.** Before merging, comment on the pull request. The comment must *start* with the command:

| Comment | Effect |
| --- | --- |
| `relctl_patch_level: major` | Force a bump level regardless of the branch name |
| `relctl_version_override: 2.1.0` | Pin the release to an exact version (takes precedence) |

relctl posts a help comment with these commands on the pull request. It needs the `pull-requests: write` permission and can be switched off with `RELCTL_SILENT=true`.

## Conventional Commits

The bump level comes from the commit messages between the last *published* release (not draft, not pre-release) and the target commit.

| Commit | Bump |
| --- | --- |
| `!` after type/scope (`feat!:`, `fix(api)!:`) or a `BREAKING CHANGE:` footer | MAJOR |
| at least one `feat` | MINOR |
| `fix`, `perf`, `refactor`, `docs`, `style`, `test`, `chore`, `ci`, `build`, `revert` | PATCH |

Only squash-merged history is supported: relctl refuses to walk past a merge commit, because the type must be in the commit subject. If no commit carries a recognised type, the release is refused rather than guessed.

## CalVer

Format `YYYYMM.D.N`, for example `202606.1.3`: year and month, the day of the month without a leading zero, and the number of the release on that day. `N` is calculated from local git tags only, so no API call is needed. This requires a full clone (`fetch-depth: 0`).

## Changelog

The version is the topmost level-2 heading of a changelog file (default `CHANGELOG.md`, configurable with `changelog_file`).

```markdown
# Changelog

## 1.4.0                    <- upcoming: only the version

## 1.3.0 — 2026-09-20       <- released: version, dash, ISO date
```

Rules, enforced strictly:

- Version is `MAJOR.MINOR.PATCH`, no `v` prefix, no leading zeros, **no pre-release suffix**.
- The date is a real calendar date (`YYYY-MM-DD`). Separator is an em dash; an en dash or ` - ` is accepted.
- Anything else in the topmost heading (`## Unreleased`, `## v1.2.3`, `## 1.2.3 (2026-10-02)`) is an **error**, not "nothing to do" — so a heading you take for a version but the tool does not can never silently skip a release.
- Headings inside code blocks and `###` headings are ignored.

`relctl release create` with this scheme:

1. refuses an **undated** heading (only released versions are released),
2. uses the section below the heading as the release notes, unless `--body` is given,
3. is **idempotent**: if a release (draft or published) or a tag for that version already exists, it exits successfully and creates nothing. An existing draft is reused and its id exported as `RELCTL_RELEASE_ID`.

The check reads GitHub's list of releases, which can lag by a few seconds after a release is created or published. A rerun within seconds of the first run (for example *Re-run failed jobs*) may therefore not see it yet; reruns a minute later are safe.

`--prerelease` creates release candidates from the heading, see [Release flows](./release-flows.md#release-candidates).

An explicit `--version` overrides the heading; the release notes are then only taken from the changelog if the topmost heading is that same version.

:::note
The `changelog` scheme is available from relctl 2.6.0; `--prerelease` from 2.7.0 and `relctl release gate` from 2.8.0.
:::

## Tag prefix and components

`tag_prefix` in [`.relctl.yaml`](./configuration.md) puts a prefix in front of every tag and release (`v` gives `v1.2.3`); the version itself stays `1.2.3`, and the prefixed form is exported as `RELCTL_TAG`. relctl finds the latest release by the prefixed tags.

A repository with independently released parts declares them as [components](./configuration.md#components). A component has its own tag prefix (default `<name>/`), its own latest release and its own CalVer counter, so `whisper/202611.3.1` and `router-v202611.3.1` do not interfere. Components use the `calver` or `changelog` scheme.

:::note
`tag_prefix`, components, `relctl release changed` and the per-scheme `pr info` are available from relctl 2.11.0.
:::
