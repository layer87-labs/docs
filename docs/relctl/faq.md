---
sidebar_position: 6
title: FAQ
---

# Frequently Asked Questions

## Why is no version bump happening?

The merged branch name must start with one of the supported prefixes followed by a `/`. Examples: `feature/my-change`, `fix/bug-123`, `major/breaking`.

If the branch does not match any prefix, relctl cannot determine the bump and will not proceed.

## Can I override the computed version?

Yes. Post a comment on the pull request before merging:

```
relctl_version_override: 2.1.0
```

Or force a specific bump level:

```
relctl_patch_level: major
```

## Can I use relctl without GitHub Actions?

Yes. Download the binary manually and set the required environment variables:

- `GITHUB_TOKEN`
- `GITHUB_REPOSITORY` (format: `owner/repo`)
- `GITHUB_SERVER_URL` (default: `https://github.com`)

For persistent local use, store credentials with `relctl connect github`.

## Does relctl work with GitHub Enterprise?

Yes. Set `GITHUB_SERVER_URL` to your GitHub Enterprise instance URL, e.g. `https://github.example.com`.

For `relctl connect`:

```bash
relctl connect github \
  --server https://github.example.com \
  --repository my-org/my-repo \
  --token ghp_your_token
```

## What happens if I run relctl release create on a push that has no PR?

relctl requires a merged pull request to determine the version bump. Without a PR, the command will error.

## How do I create a hotfix release?

Use the `--hotfix` flag:

```bash
relctl release create --hotfix --merge-sha ${{ github.sha }}
```

The release title prefix changes from `Release` to `Hotfix`. The version bump rules still apply based on the branch name.

## What branch naming convention does relctl expect?

The branch must start with an alias followed by a `/`:

| Bump  | Valid examples                          |
| ----- | --------------------------------------- |
| MAJOR | `major/my-breaking-change`              |
| MINOR | `feature/new-flag`, `feat/something`    |
| PATCH | `fix/null-ptr`, `bugfix/crash`, `dependabot/...` |

## Can I upload multiple assets to a release?

Yes. Use `--asset` multiple times in `relctl release publish`:

```bash
relctl release publish \
  --release-id 12345 \
  --asset "file=out/binary_linux-amd64" \
  --asset "file=out/binary_darwin-arm64" \
  --asset "zip=out/extras"
```
