import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SEHATI: Sistem Skrining Dini Anemia Berbantuan AI',
    short_name: 'SEHATI',
    description: 'Platform CDSS Pra-Skrining Anemia Non-Invasif Berbasis AI',
    start_url: '/',
    display: 'standalone',
    background_color: '#F9F9FF',
    theme_color: '#0D5C75',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/maskable-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['medical', 'health', 'screening'],
  }
}
