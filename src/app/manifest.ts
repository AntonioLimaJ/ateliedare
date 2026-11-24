import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/precificacao',
    name: 'Ateliê da Rê · Precificação',
    short_name: 'PrecificaRê',
    description: 'Ferramenta profissional de precificação',
    start_url: '/precificacao',
    scope: '/precificacao',
    display: 'standalone',
    background_color: '#faf6ef',
    theme_color: '#faf6ef',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
