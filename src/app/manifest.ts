import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ateliê da Re - Precificação',
    short_name: 'Precificação',
    description: 'Ferramenta de precificação para artesanato',
    start_url: '/precificacao',
    scope: '/precificacao',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#fdf2f8',
    icons: [
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
