---
sidebar_position: 5
title: release
---

:::note
This page is generated from the command line of relctl. Do not edit it by hand.
:::

# relctl release

Manage GitHub releases with ease

```text
The release command is used to manage GitHub releases. It provides subcommands to create and publish releases, allowing you to automate the release process and integrate it into CI/CD workflows. Use this command to streamline the release tagging and deployment of your software projects.
```

```text
relctl release
```

Flags of this command and of its subcommands:

```text
  -b, --body string             custom release message (markdown string or file)
      --component string        release one component of the repository (key components in .relctl.yaml): own tags, own latest release, own counter
      --config string           path to .relctl.yaml config file
      --dry-run                 make dry-run before writing version to Git by calling it
      --hotfix                  create a hotfix release
      --merge-sha string        set the merge sha
  -l, --patch-level string      predefine patch level of version to Update
      --prerelease              create a release candidate (X.Y.Z-rc.N, marked as prerelease) for the computed version
      --prnumber int            overwrite the issue number
      --release-branch string   set release branch (default: git default)
      --release-prefix string   set a custom release prefix (default -> Release or Hotfix)
      --version string          override version to Update
      --version-scheme string   versioning scheme to use: semver (default), calver, conventional-commits or changelog (overrides .relctl.yaml)
```


## relctl release changed

Report whether a component changed since its latest release

```text
Report whether a file that belongs to a component changed since the component's
latest release.

The paths of a component are listed under components.<name>.paths in .relctl.yaml
(glob patterns; "**" matches any number of directories). The latest release is the
highest release tag of the component that is reachable from HEAD; release candidates
do not count. A component without a release counts as changed.

The command needs the full history and the tags (fetch-depth: 0) and no access to
GitHub. It exports RELCTL_CHANGED (true or false), RELCTL_CHANGED_FILES,
RELCTL_COMPONENT and RELCTL_LATEST_VERSION, so a pipeline builds only what changed:

    relctl release changed --component whisper
    relctl release changed --component whisper --since 202611.2.4
```

```text
relctl release changed [flags]
```

Flags:

```text
      --since string   compare with this commit or tag instead of the latest release of the component
```


## relctl release create

Create a new GitHub release

```text
relctl release create
```


## relctl release forward

Bring the production branch back into the development branch after a release

```text
Bring the released state of the production branch back into the development branch.

The branches come from .relctl.yaml (production_branch, default "main", and
development_branch, default: the default branch of the repository) or from the
flags --from and --to.

relctl fast-forwards the development branch if that is possible. If the
development branch has moved on, or the token may not push to it (branch rules),
relctl opens a pull request instead. Merge that pull request with a merge commit,
do not squash it. The command is idempotent: nothing happens if the development
branch already contains the production branch or if the pull request is open.

    relctl release forward
    relctl release forward --from main --to dev --dry-run
```

```text
relctl release forward [flags]
```

Flags:

```text
      --from string   production branch (default: production_branch of .relctl.yaml, or main)
      --to string     development branch (default: development_branch of .relctl.yaml, or the repository's default branch)
```


## relctl release gate

Check that the changelog may be released

```text
Check that the topmost changelog heading may be released.

The gate passes only if
  1. the topmost heading is a valid, dated version with release notes,
  2. that version has not been released yet (no published release, no tag), and
  3. (with --require-candidate, the default) a release candidate tag
     X.Y.Z-rc.N points to the commit given with --sha (default: HEAD).

All checks are reported even if an earlier one fails. The command exits with a
non-zero status if any check fails, so it can be used as a required check on the
pull request that releases.

    relctl release gate --sha "$PR_HEAD_SHA"
    relctl release gate --require-candidate=false
```

```text
relctl release gate [flags]
```

Flags:

```text
      --require-candidate   require a release candidate tag for the commit (default true)
      --sha string          commit that must have a release candidate (default: HEAD)
```


## relctl release publish

Publish a recently created GitHub release

```text
Publish a recently created GitHub release

Publish will publish a previously created release to GitHub. The release body
can be written in markdown and will be rendered as such on GitHub. Additionally,
any number of assets can be uploaded, including but not limited to zip and tgz
files. The assets will be uploaded to GitHub and linked to the release.

The assets can be specified as a list of local file paths.

The zip and tgz mechanisms can be used by specifying the path to a directory
containing the files to be uploaded. The directory will be zipped or tarred and
gzipped and uploaded to GitHub as a single asset. The name of the asset will be
the name of the directory with the appropriate extension appended. For example,
if the directory is named "myfiles", the asset will be named "myfiles.zip" or "myfiles.tgz".

Example of using the release publish command

To publish a release with a specific release ID and assets, use the following command:

    relctl release publish --release-id 12345 \
        --asset "file=out/relctl_v1.0.0_amd64" \
        --asset "file=out/relctl_v1.0.0_arm64"

If the release ID is not provided, the command will look for the 'RELCTL_RELEASE_ID' environment variable:

    export RELCTL_RELEASE_ID=12345
    relctl release publish \
        --asset "file=out/relctl_v1.0.0_amd64" \
        --asset "file=out/relctl_v1.0.0_arm64"

You can also publish a release with a directory as a zip asset:

    relctl release publish --release-id 12345 \
        --asset "zip=out/myfiles"

The assets should be specified as local file paths to be uploaded to the GitHub release.
```

```text
relctl release publish [flags]
```

Flags:

```text
  -a, --asset stringArray   add an asset to the release, can be specified multiple times.
      --release-id int      publish an early defined release (also looking for env RELCTL_RELEASE_ID)
```

