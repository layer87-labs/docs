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
# Assets are named relctl_<version>_<os>-<arch>
VERSION=$(curl -fsSL -o /dev/null -w '%{url_effective}' \
  https://github.com/layer87-labs/relctl/releases/latest | sed 's|.*/||')
ASSET="relctl_${VERSION}_linux-amd64"
curl -fsSLO "https://github.com/layer87-labs/relctl/releases/download/${VERSION}/${ASSET}"
curl -fsSLO "https://github.com/layer87-labs/relctl/releases/download/${VERSION}/sha256sum.txt"
grep " ${ASSET}\$" sha256sum.txt | sha256sum --check -
chmod +x "${ASSET}"
sudo mv "${ASSET}" /usr/local/bin/relctl
```

Available suffixes (the asset is `relctl_<version>_<suffix>`):

| Platform       | Suffix               |
| -------------- | -------------------- |
| Linux x86_64   | `linux-amd64`        |
| Linux ARM64    | `linux-arm64`        |
| macOS x86_64   | `darwin-amd64`       |
| macOS M1+      | `darwin-arm64`       |
| Windows x86_64 | `windows-amd64.exe`  |

### Verify checksum

The commands above already check the download against `sha256sum.txt` of the release. For another platform, replace `linux-amd64` in `ASSET` and keep the check.

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

For local use, or for pipelines relctl cannot detect (for example GitLab CI with a GitHub repository), use `relctl connect` once. It verifies the connection and writes `.relctl-connection.yaml` with the server and the repository. The token is not stored; set `GITHUB_TOKEN` on every call.

```bash
export GITHUB_TOKEN=ghp_your_token
relctl connect github --repository my-org/my-repo
```

Verify the connection:

```bash
relctl connect check
```

Remove the connection file:

```bash
relctl connect remove
```
