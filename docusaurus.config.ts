import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import type * as Mermaid from '@docusaurus/theme-mermaid';

const config: Config = {
  title: 'layer87-labs',
  tagline: 'Open source tools by Layer87',
  favicon: 'img/layer87.png',

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
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
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
