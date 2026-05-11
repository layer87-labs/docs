# layer87-labs docs

Central documentation site for layer87-labs open source projects, built with [Docusaurus v3](https://docusaurus.io/).

Published at: **https://labs.layer87.de**

## Local Development

```bash
pnpm install
pnpm start
```

Opens a local dev server at `http://localhost:3000`. Most changes are reflected live.

## Build

```bash
pnpm build
```

Generates static output into the `build/` directory.

## Deployment

Deployment is handled automatically via GitHub Actions on every push to `main`.  
The site is published to GitHub Pages with the custom domain `labs.layer87.de`.

To trigger a manual deploy, run the `deploy` workflow in the Actions tab.
