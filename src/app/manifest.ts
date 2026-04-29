import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/precificacao',
    name: 'Ateliê da Re - Precificação',
    short_name: 'Apreço',
    description: 'Ferramenta profissional de precificação para artesanato',
    start_url: '/precificacao',
    scope: '/precificacao',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#121212',
    theme_color: '#c084fc',
    icons: [
      {
        src: '/icon-512.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
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
