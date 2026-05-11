---
sidebar_position: 3
title: Common commands
---

# Common commands

The most frequently used `relctl` commands. See [CLI Reference](./cli/index.md) for all flags and subcommands.

## Create a release

```bash
relctl release create --merge-sha <sha>
```

Reads the current PR's branch name, computes the next SemVer version, and creates a draft GitHub Release. Run this as the first step after a merge.

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
relctl connect github \
  --repository my-org/my-repo \
  --token ghp_your_token
```

Persists an encrypted `.rc` file for local use or Jenkins pipelines without runner-injected credentials.

## Get PR info

```bash
relctl pr info
relctl pr info --merge-commit-sha <sha>
```

## Check version

```bash
relctl --version
```

## Dry run

Most commands accept `--dry-run` to simulate without writing to GitHub:

```bash
relctl release create --dry-run --merge-sha <sha>
```


### relctl connect remove

Remove all persisted connection files and secrets.

```
relctl connect remove
```

---

## relctl pr

Manage GitHub pull requests.

```
relctl pr [flags]
```

### relctl pr info

Get pull request information for a given merge commit or PR number.

```
relctl pr info [flags]
```

| Flag                            | Description                      |
| ------------------------------- | -------------------------------- |
| `-c, --merge-commit-sha string` | Specify a merge commit SHA        |
| `-n, --number int`              | Override the pull request number  |

---

## relctl release

Manage GitHub releases.

```
relctl release [flags]
```

**Shared flags** (available on `release`, `release create`, and `release publish`):

| Flag                          | Description                                                      |
| ----------------------------- | ---------------------------------------------------------------- |
| `-b, --body string`           | Custom release message — markdown string or path to a file      |
| `--dry-run`                   | Simulate without writing to Git                                  |
| `--hotfix`                    | Create a hotfix release                                          |
| `--merge-sha string`          | Override the merge commit SHA                                    |
| `-l, --patch-level string`    | Override the SemVer bump: `major`, `minor`, or `patch`          |
| `--prnumber int`              | Override the pull request number                                 |
| `--release-branch string`     | Override the release branch (default: repo default branch)       |
| `--release-prefix string`     | Custom release title prefix (default: `Release` / `Hotfix`)     |
| `--version string`            | Override the computed version                                    |
| `-v, --verbose`               | Verbose output                                                   |

### relctl release create

Compute the next SemVer version from the branch name and PR metadata, then create a GitHub release draft.

```
relctl release create [flags]
```

All shared `release` flags apply.

**Step outputs** (written to `$GITHUB_OUTPUT` in GitHub Actions):

| Variable              | Description                       |
| --------------------- | --------------------------------- |
| `RELCTL_NEXT_VERSION` | Computed next version             |
| `RELCTL_RELEASE_ID`   | GitHub release ID of the draft    |
| `RELCTL_PR_SHA`       | Full merge commit SHA             |
| `RELCTL_PR_SHA_SHORT` | Short (7-char) merge commit SHA   |

### relctl release publish

Publish a previously created draft release and upload assets.

```
relctl release publish [flags]
```

| Flag                      | Description                                                                      |
| ------------------------- | -------------------------------------------------------------------------------- |
| `-a, --asset stringArray` | Asset to upload. Repeatable. See formats below.                                  |
| `--release-id int`        | Release ID to publish. Falls back to `RELCTL_RELEASE_ID` env var.               |

**Asset formats:**

| Format        | Description                                              |
| ------------- | -------------------------------------------------------- |
| `file=<path>` | Upload a single file                                     |
| `zip=<dir>`   | Zip a directory, upload as `<dirname>.zip`               |
| `tgz=<dir>`   | Tar+gzip a directory, upload as `<dirname>.tgz`          |

**Examples:**

```bash
# Upload individual files
relctl release publish \
  --release-id 12345 \
  --asset "file=out/relctl_v1.2.0_linux-amd64" \
  --asset "file=out/relctl_v1.2.0_darwin-arm64"

# Use env var for release ID
export RELCTL_RELEASE_ID=12345
relctl release publish \
  --asset "file=out/relctl_v1.2.0_linux-amd64" \
  --asset "zip=out/dist"
```

---

## relctl parse

Inspect and parse JSON or YAML input. Similar to `jq` with additional features.

```
relctl parse [flags]
```

### relctl parse json

```
relctl parse json [flags]
```

| Flag                  | Description                            |
| --------------------- | -------------------------------------- |
| `-f, --file string`   | File to parse                          |
| `-s, --string string` | Inline JSON string to parse            |
| `-q, --query string`  | **(required)** Query expression        |

### relctl parse yaml

```
relctl parse yaml [flags]
```

| Flag                  | Description                            |
| --------------------- | -------------------------------------- |
| `-f, --file string`   | File to parse                          |
| `-s, --string string` | Inline YAML string to parse            |
| `-q, --query string`  | **(required)** Query expression        |

### relctl parse version

Validate a version string against SemVer syntax.

```
relctl parse version [flags]
```

---

## relctl transform

Transform input data to JSON.

```
relctl transform [flags]
```

### relctl transform group-by

Group a string array by a common prefix into a JSON object.

```
relctl transform group-by [flags]
```

| Flag                  | Description                                                                            |
| --------------------- | -------------------------------------------------------------------------------------- |
| `-p, --prefix int`    | Group by prefix until this character index (default: `3`)                              |
| `--sub-prefix int`    | Strip prefix characters up to this index from each item value                         |

**Example:**

```bash
relctl transform group-by -p 3 --sub-prefix 4 \
  st1_infrastructure-base st2_ubi9-openjdk-11 st2_ubi9-openjdk-17
# → {"st1":["infrastructure-base"],"st2":["ubi9-openjdk-11","ubi9-openjdk-17"]}
```
