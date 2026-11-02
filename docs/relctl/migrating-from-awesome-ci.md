---
sidebar_position: 3.3
title: Migrating from awesome-ci
---

# Migrating from awesome-ci

relctl is the successor of [awesome-ci](https://github.com/fullstack-devops/awesome-ci). The command tree is the same (`pr info`, `release create`, `release publish`, `parse`, `connect`, `transform`), branch prefixes work unchanged, and a pipeline can usually be migrated in a few minutes.

## What stays the same

- Commands and the SemVer-from-branch-prefix model.
- GitHub, GitHub Enterprise, GitHub Actions and Jenkins as supported environments.
- Required environment: `CI`, `GITHUB_SERVER_URL`, `GITHUB_REPOSITORY`, `GITHUB_TOKEN`.
- The `.awesomerc.yaml` file written by awesome-ci `connect` is still read (its token is used when `GITHUB_TOKEN` is not set). relctl `connect` writes `.relctl-connection.yaml` instead and stores no token; the old file is deleted on the next `relctl connect github`. The file for exported variables in a local shell is now `relctl.env` (was `awesomeci.env`).

## What changes

| awesome-ci | relctl |
| --- | --- |
| binary `awesome-ci` | binary `relctl` |
| action `fullstack-devops/awesome-ci-action` | `layer87-labs/relctl-action@v1` |
| reusable workflows in `fullstack-devops/git-workflows` | `layer87-labs/relctl-action/.github/workflows/generate-build-infos.yml@v1` and `create-release.yml@v1` |
| outputs / variables `ACI_*` (`ACI_NEXT_VERSION`, `ACI_RELEASE_ID`, …) | `RELCTL_*` (`RELCTL_NEXT_VERSION`, `RELCTL_RELEASE_ID`, …) |
| `ACI_SILENT` | `RELCTL_SILENT` |
| PR comment commands `aci_patch_level:`, `aci_version_override:` | `relctl_patch_level:`, `relctl_version_override:` |
| — | optional `.relctl.yaml` for the version scheme |

The variable names map one to one: replace the prefix `ACI_` with `RELCTL_`.

## Compatibility mode

To migrate in two steps instead of one, relctl accepts the old names for a transition period:

- `aci_patch_level:` / `aci_version_override:` comments still work (with a deprecation warning).
- `ACI_SILENT` is honoured next to `RELCTL_SILENT`.
- Set `RELCTL_LEGACY_ACI_ENV=true` and relctl additionally exports an `ACI_*` alias for every `RELCTL_*` variable, so workflow steps that read `steps.<id>.outputs.ACI_NEXT_VERSION` keep working.

:::note
Compatibility mode is available from relctl 2.6.0. It is meant for the transition — remove it when your pipelines use the new names.
:::

## Step by step

1. **Replace the setup step.**
   ```yaml
   # before
   - uses: fullstack-devops/awesome-ci-action@main
   # after
   - uses: layer87-labs/relctl-action@v1
     with:
       github-token: ${{ secrets.GITHUB_TOKEN }}
   ```
2. **Rename the command.** `awesome-ci release create --merge-sha …` → `relctl release create --merge-sha …`.
3. **Rename variables and outputs** (`ACI_` → `RELCTL_`), or enable compatibility mode for now.
4. **Check permissions.** The help comment on pull requests needs `pull-requests: write`; creating releases needs `contents: write`. Without write permission relctl logs a warning and continues. Pull requests from forks have a read-only token and cannot receive the comment.
5. **Use a full clone** (`fetch-depth: 0`) if you use CalVer.
6. **Update team habits.** PR comment commands start with `relctl_`. Breaking changes can also be expressed as `feat!/…`.
7. **Run once with `--dry-run`** (`relctl release create --dry-run`) and compare the version with what awesome-ci would have produced.
8. **Switch reusable workflows**, if you used `git-workflows`, to the `relctl-action` ones. They are drop-in replacements; the calling workflow must grant `contents: read` and `pull-requests: write`.

## Direct downloads

If you downloaded the binary from a release page instead of using the action, point the download at the relctl releases instead. Assets are named `relctl_<version>_<os>-<arch>`. Prefer `relctl-action`, which also verifies the SHA-256 checksum.

## What you gain

- Three more version schemes besides SemVer: Conventional Commits, CalVer, and a reviewed, changelog-driven flow.
- Breaking-change branches (`feat!/…`) and Conventional Commit markers produce a MAJOR bump.
- Checksum-verified installation through one maintained action.
- A tested code base with up-to-date dependencies and security fixes.

## Rolling back

relctl changes nothing in your repository except the releases it creates. To roll back, point the workflow at the old action again.
