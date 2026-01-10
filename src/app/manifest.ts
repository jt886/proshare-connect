import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'ProShare Connect',
        short_name: 'ProShare',
        description: 'AI-powered collective intelligence platform.',
        start_url: '/',
        display: 'standalone',
        background_color: '#09090b', // Zinc-950
        theme_color: '#09090b',
        icons: [
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
