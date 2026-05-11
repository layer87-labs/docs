---
sidebar_position: 3
title: release
---

# relctl release

Manage GitHub releases — create draft releases from branch name conventions and publish them with assets.

```bash
relctl release [flags]
```

## Flags

```
  -b, --body string             custom release message (markdown string or file path)
      --dry-run                 dry-run without writing version to Git
  -h, --help                    help for release
      --hotfix                  create a hotfix release
      --merge-sha string        set the merge commit SHA
  -l, --patch-level string      predefine SemVer bump level
      --prnumber int            overwrite the pull request number
      --release-branch string   set release branch (default: repo default branch)
      --release-prefix string   custom release title prefix (default: "Release" or "Hotfix")
      --version string          override the calculated version
  -v, --verbose                 verbose output
```

## release create

Create a new GitHub draft release from the merged PR context.

```bash
relctl release create [flags]
```

Inherits all flags from `relctl release`.

**Output env vars** (available as step outputs in GitHub Actions):

| Variable | Description |
| --- | --- |
| `RELCTL_RELEASE_ID` | ID of the created release |
| `RELCTL_NEXT_VERSION` | Calculated next SemVer version |

## release publish

Publish a previously created draft release and upload assets.

```bash
relctl release publish [flags]
```

```
  -a, --asset stringArray   asset to upload, repeatable. Formats: file=path, zip=dir, tgz=dir
  -h, --help                help for publish
      --release-id int      release ID (also reads env RELCTL_RELEASE_ID)
```

### Asset formats

| Format | Example | Description |
| --- | --- | --- |
| `file=` | `file=out/relctl_v1.0.0_amd64` | Upload a single file |
| `zip=` | `zip=out/myfiles` | Zip a directory and upload |
| `tgz=` | `tgz=out/myfiles` | Tar+gzip a directory and upload |

### Example

```bash
relctl release publish \
  --release-id 12345 \
  --asset "file=out/relctl_v1.0.0_amd64" \
  --asset "file=out/relctl_v1.0.0_arm64"
```

![Asset upload overview](/img/release-assets-readme.png)
