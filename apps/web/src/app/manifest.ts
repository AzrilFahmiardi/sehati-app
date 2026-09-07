import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SEHATI: AI-Assisted Early Anemia Screening',
    short_name: 'SEHATI',
    description: 'Screening Support System for Healthcare Workers and Patients',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF8FF',
    theme_color: '#004AC6',
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
