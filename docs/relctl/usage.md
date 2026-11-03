---
sidebar_position: 3
title: Common commands
---

# Common commands

The most frequently used `relctl` commands. The [CLI reference](./cli/index.md) lists every command and flag; it is generated from the released binary.

## Create a release

### SemVer (default)

```bash
relctl release create --merge-sha <sha>
```

Reads the merged PR's branch name, computes the next SemVer version, and creates a draft GitHub Release.

### CalVer

```bash
# Via flag
relctl release create --version-scheme calver

# Via .relctl.yaml in the repo root
# version_scheme: calver
relctl release create
```

No branch prefix or PR context required. The version is derived from today's date (UTC) and local git tags: `YYYYMM.D.N`, for example `202611.3.1` for the first release on 3 November 2026. The day has no leading zero, and N increments automatically each time you release on the same day.

### Dry run

```bash
relctl release create --dry-run --merge-sha <sha>
relctl release create --version-scheme calver --dry-run
```

## Publish a release with assets

```bash
relctl release publish \
  --release-id "$RELCTL_RELEASE_ID" \
  --asset "file=out/myapp_linux-amd64" \
  --asset "file=out/myapp_darwin-arm64"
```

`RELCTL_RELEASE_ID` is written to `$GITHUB_OUTPUT` by `release create` and can be passed between jobs.

## Connect to GitHub (non-CI)

```bash
export GITHUB_TOKEN=ghp_your_token
relctl connect github --repository my-org/my-repo
```

Verifies the connection and stores server and repository in `.relctl-connection.yaml`, for local use or pipelines relctl cannot detect. The token is never stored: every later call reads `GITHUB_TOKEN`.

## Get PR info

```bash
relctl pr info
relctl pr info --merge-commit-sha <sha>
relctl pr info --version-scheme calver
```

`pr info` prints the version the pull request would release, using the version scheme of the repository (`--version-scheme`, or `version_scheme` in `.relctl.yaml`):

| Scheme | The version comes from |
| --- | --- |
| `semver` | the branch prefix and the comment commands of the pull request |
| `calver` | the date of the release |
| `conventional-commits` | the commit messages since the last published release |
| `changelog` | the topmost heading of the changelog (it may not be dated yet) |

It also exports `RELCTL_VERSION_SCHEME`. The help comment on the pull request matches the scheme: only `semver` offers `relctl_patch_level` and `relctl_version_override`.

## Components

A repository with independently released parts declares them in `.relctl.yaml` (see [Configuration](./configuration.md#components)). Pass `--component NAME` to `release create`, `release publish`, `release gate` and `pr info`.

```bash
# Build and release only what changed since the component's latest release
relctl release changed --component whisper
if [ "$RELCTL_CHANGED" = "true" ]; then
  relctl release create --component whisper
fi
```

`release changed` needs no access to GitHub. It compares the files that match the `paths` of the component with its latest release (or with `--since <commit-or-tag>`).

## Version variables

`relctl release create` exports these variables (GitHub Actions: `$GITHUB_ENV` and step outputs; other systems: `relctl.env`). Each has one meaning:

| Variable | Meaning |
| --- | --- |
| `RELCTL_VERSION` | what was created: `X.Y.Z`, or `X.Y.Z-rc.N` for a release candidate |
| `RELCTL_NEXT_VERSION` | the release itself, so `X.Y.Z` also for a candidate |
| `RELCTL_LATEST_VERSION` | the latest published release, never a candidate |
| `RELCTL_PRERELEASE` | whether the created release is a candidate |
| `RELCTL_TAG` | the version with the tag prefix (`v1.2.3` with `tag_prefix: v`) |
| `RELCTL_COMPONENT` | the component, if `--component` was used |
| `RELCTL_RELEASE_ID` | the ID of the draft release |

`release changed` exports `RELCTL_CHANGED`, `RELCTL_CHANGED_FILES`, `RELCTL_COMPONENT` and `RELCTL_LATEST_VERSION`.

## Check version

```bash
relctl --version
```

## Dry run

Most commands accept `--dry-run` to simulate without writing to GitHub:

```bash
relctl release create --dry-run --merge-sha <sha>
```
