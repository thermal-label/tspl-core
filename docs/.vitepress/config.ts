import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'tspl-core',
  description:
    "Pure TSPL II protocol encoder — directive byte builders + status line shape, anchored on TSC's TSPL II Programming Manual.",
  base: '/tspl-core/',
  cleanUrls: true,
  ignoreDeadLinks: true,

  markdown: {
    // Disable raw HTML interpretation — protocol docs use
    // placeholder tag-shaped notation in inline code spans
    // (`<header>`, `<mode>`, etc.) which Vue's template
    // compiler would otherwise try to parse.
    html: false,
  },

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/getting-started' },
      { text: 'Protocol', link: '/protocol/tspl' },
      { text: 'API', link: '/api/' },
      {
        text: 'GitHub',
        link: 'https://github.com/thermal-label/tspl-core',
      },
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting started', link: '/getting-started' },
          { text: 'Hardware', link: '/hardware' },
          { text: 'Interoperability', link: '/interoperability' },
        ],
      },
      {
        text: 'Wire protocol',
        items: [{ text: 'TSPL II', link: '/protocol/tspl' }],
      },
      {
        text: 'API reference',
        items: [{ text: 'core', link: '/api/' }],
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/thermal-label/tspl-core' }],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Mannes Brak',
    },
  },
});
