import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import type * as Mermaid from '@docusaurus/theme-mermaid';

const config: Config = {
  title: 'layer87-labs',
  tagline: 'Open source tools by Layer87',
  favicon: 'img/layer87.png',

  headTags: [
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'layer87-labs docs',
        url: 'https://labs.layer87.de',
        description: 'Open source tools and documentation by Layer87 — relctl and more.',
        publisher: {
          '@type': 'Organization',
          name: 'Layer87',
          url: 'https://layer87.de',
        },
      }),
    },
  ],

  future: {
    v4: true,
  },

  url: 'https://labs.layer87.de',
  baseUrl: '/',

  organizationName: 'layer87-labs',
  projectName: 'docs',

  onBrokenLinks: 'throw',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  scripts: [
    {
      src: 'https://analytics.mgt.layer87.de/js/script.js',
      defer: true,
      'data-domain': 'labs.layer87.de',
    },
  ],

  themes: ['@docusaurus/theme-mermaid'],
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/layer87-labs/docs/tree/main/',
        },
        blog: false,
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
          ignorePatterns: ['/tags/**'],
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    metadata: [
      { name: 'description', content: 'Open source tools and documentation by Layer87 — relctl and more.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'layer87-labs docs' },
      { property: 'og:image', content: 'https://labs.layer87.de/img/layer87.png' },
      { property: 'og:image:width', content: '512' },
      { property: 'og:image:height', content: '512' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:site', content: '@layer87de' },
      { name: 'twitter:image', content: 'https://labs.layer87.de/img/layer87.png' },
    ],
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'layer87-labs',
      logo: {
        alt: 'layer87 logo',
        src: 'img/layer87.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'mainSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://github.com/layer87-labs',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://layer87.de',
          label: 'layer87.de',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Overview',
              to: '/docs/',
            },
            {
              label: 'relctl',
              to: '/docs/relctl/intro',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/layer87-labs',
            },
            {
              label: 'layer87.de',
              href: 'https://layer87.de',
            },
          ],
        },
      ],
      copyright: `Maintained by Layer87 · <a href="https://layer87.de">layer87.de</a>`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'yaml'],
    },
    mermaid: {
      theme: { dark: 'dark', light: 'neutral' },
      options: {
        darkMode: true,
        theme: 'dark',
        themeVariables: {
          darkMode: true,
          background: '#13162e',
          mainBkg: '#1a1f3a',
          nodeBorder: '#a855f7',
          lineColor: '#94a3b8',
          textColor: '#f1f5f9',
          edgeLabelBackground: '#13162e',
          clusterBkg: '#1a1f3a',
          titleColor: '#f1f5f9',
          attributeBackgroundColorEven: '#13162e',
          attributeBackgroundColorOdd: '#1a1f3a',
        },
      },
    },
  } satisfies Preset.ThemeConfig & Mermaid.ThemeConfig,
};

export default config;
