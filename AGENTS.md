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

## Quality gates

Only the Markdown under `docs/` is edited by hand by maintainers. Everything below is automated.

- **CI** (`.github/workflows/ci.yml`, workflow `CI`) runs on every pull request to `main`, on demand
  and weekly on `main`. It runs `pnpm install --frozen-lockfile`, `pnpm run typecheck`,
  `pnpm run lint:md` (markdownlint, rules in `.markdownlint-cli2.jsonc`), a production build and the
  browser tests. The build fails on broken links, broken anchors, broken Markdown links or images and
  duplicate routes, and the job fails if the build log contains `[WARNING]`.
- **Browser tests** (Playwright, `tests/`) run against the production build served by
  `docusaurus serve`. They check every page of `sitemap.xml` (HTTP 200, one `h1`, content, no script or
  console errors, no failed same-origin requests), the stylesheet at 1280px and 375px, horizontal
  overflow, the theme, Mermaid diagrams, axe accessibility (critical and serious) on key pages and the
  navigation. Requests to other hosts (for example analytics) are blocked.
- **Run them locally:** `pnpm install`, `pnpm exec playwright install chromium`, `pnpm run build`,
  then `pnpm test` (everything) or `pnpm run test:smoke` (quick subset). Set `PW_CHROMIUM_PATH` to use an
  existing Chromium binary. Set `BASE_URL` to test an already running site instead of a local server.
  Accepted accessibility exceptions belong in the allowlist in `tests/a11y.spec.ts`, each with a reason.
- **Deploy** (`deploy.yaml`) publishes to GitHub Pages on every push to `main`, then runs the smoke
  tests against the live site. A failing check turns the run red.
- **Dependabot** opens weekly pull requests for npm and GitHub Actions. Docusaurus packages form one
  group, React packages another, all other minor and patch updates are grouped, and every other major
  update (for example TypeScript) is its own pull request. After `CI` succeeds,
  `.github/workflows/dependabot-automerge.yml` squash-merges patch and minor updates. Major updates get
  a comment and wait for a human review.
