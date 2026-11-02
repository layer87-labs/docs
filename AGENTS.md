# AGENTS.md

Instructions for AI coding agents working in this repository (public documentation site). `CLAUDE.md` points here.

## Public repository — hard rules

This repository is public. Everything committed, and everything written to issues,
pull requests, comments, commit messages and release notes, is world-readable.

- Never include internal information from private projects of the owning organisation:
  no private repository names or links, no internal hostnames, URLs or addresses, no
  customer or tenant names, no ticket or issue references into private systems, no
  secrets, tokens or credentials, no internal process names or standards.
- Issues may be *motivated* by internal needs, but must be written generically:
  describe the problem and the proposal, not where it came from. Use neutral
  examples (`example-org/example-repo`).
- If in doubt, leave it out. If something internal slipped in, remove it from the
  text and tell a maintainer — edit history on GitHub may still show it.
- Write all text in English (code, comments, docs, commits, issues, PRs).
- Commits carry no AI attribution: no `Co-Authored-By` trailers for tools, no session IDs or
  session links, no tool names in commit messages, PR bodies or comments. Commit as the
  maintainer who requested the change.

## Notes

- Docs are Markdown under `docs/<product>/`. Keep them in sync with the code of the product they describe.
- `docs/relctl/changelog.md` is synced automatically; do not edit it by hand.
- Develop on a descriptively named branch (`feat/…`, `fix/…`, `docs/…`, `chore/…`); do not use tool-generated branch names. Open pull requests only when asked.
