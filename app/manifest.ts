import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'YumIA CRM',
    short_name: 'YumIA',
    description: 'CRM Inteligente para Gestão de Vendas — YumIA',
    start_url: '/boards',
    display: 'standalone',
    background_color: '#0a0a0b',
    theme_color: '#d4af37',
    icons: [
      // SVG icons keep the repo text-only. If you need iOS splash/touch icons later,
      // add PNGs in a follow-up.
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/maskable.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}

