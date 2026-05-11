---
sidebar_position: 2
title: Installation
---

# Installation

## GitHub Actions (recommended)

Use [`layer87-labs/relctl-action`](https://github.com/layer87-labs/relctl-action) to install `relctl` on your runner. The action resolves the version, verifies the SHA-256 checksum, and adds the binary to `PATH`.

```yaml
- uses: layer87-labs/relctl-action@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

Pin to a specific version:

```yaml
- uses: layer87-labs/relctl-action@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    relctl-version: "1.2.3"
```

### Inputs

| Input            | Required | Default    | Description                                                      |
| ---------------- | :------: | ---------- | ---------------------------------------------------------------- |
| `github-token`   | yes      | —          | Used for release API calls (`${{ secrets.GITHUB_TOKEN }}`)       |
| `relctl-version` | no       | `"latest"` | Version to install. Semver tag (e.g. `"1.2.3"`) or `"latest"`.  |

### Supported platforms

| OS      | Architecture |
| ------- | ------------ |
| Linux   | amd64        |
| Linux   | arm64        |
| macOS   | amd64        |
| macOS   | arm64 (M1+)  |
| Windows | amd64        |

---

## Manual download

```bash
# Linux amd64
curl -fsSL -o relctl \
  https://github.com/layer87-labs/relctl/releases/latest/download/relctl_linux-amd64
chmod +x relctl
sudo mv relctl /usr/local/bin/relctl
```

Available suffixes:

| Platform       | Suffix               |
| -------------- | -------------------- |
| Linux x86_64   | `linux-amd64`        |
| Linux ARM64    | `linux-arm64`        |
| macOS x86_64   | `darwin-amd64`       |
| macOS M1+      | `darwin-arm64`       |
| Windows x86_64 | `windows-amd64.exe`  |

### Verify checksum

```bash
curl -fsSL -o sha256sum.txt \
  https://github.com/layer87-labs/relctl/releases/latest/download/sha256sum.txt
sha256sum --check --ignore-missing sha256sum.txt
```

### Smoke test

```bash
relctl --version
```

---

## Required environment variables

### GitHub Actions

Set automatically by the runner. `GITHUB_TOKEN` must be passed explicitly via `env:`.

| Variable            | Description                             | Required |
| ------------------- | --------------------------------------- | :------: |
| `CI`                | Set to `true` by the runner             | yes      |
| `GITHUB_SERVER_URL` | GitHub server URL                       | yes      |
| `GITHUB_REPOSITORY` | `owner/repo`                            | yes      |
| `GITHUB_TOKEN`      | Pass via `env:` in the step             | yes      |

### Jenkins Pipeline

| Variable            | Description                                   | Required |
| ------------------- | --------------------------------------------- | :------: |
| `CI`                | Set automatically by Jenkins                  | yes      |
| `JENKINS_URL`       | Set automatically by Jenkins                  | yes      |
| `GIT_URL`           | Set by the GitHub Plugin                      | yes      |
| `GITHUB_REPOSITORY` | Must be set manually (`owner/repo`)           | yes      |
| `GITHUB_TOKEN`      | Must be set via credentials binding           | yes      |

:::tip
Jenkins environment variables are listed at `${YOUR_JENKINS_HOST}/env-vars.html`
:::

---

## Persistent connection (non-CI use)

For local use or Jenkins pipelines without environment variable support, use `relctl connect` to create an encrypted `.rc` file:

```bash
relctl connect github \
  --repository my-org/my-repo \
  --token ghp_your_token
```

Verify the connection:

```bash
relctl connect check
```

Remove stored credentials:

```bash
relctl connect remove
```
