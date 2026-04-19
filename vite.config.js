import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: '/finio-app/',
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'icon.svg'],
        manifest: {
          name: 'finio — centro de control',
          short_name: 'finio',
          description: 'Tu centro de control financiero personal',
          start_url: '/finio-app/',
          display: 'standalone',
          background_color: '#0D1F16',
          theme_color: '#2EB87A',
          icons: [
            { src: '/finio-app/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          navigateFallback: '/finio-app/index.html',
          // Take control immediately when a new SW is installed (no waiting for tabs to close)
          skipWaiting: true,
          clientsClaim: true,
          // Never cache Supabase API calls — always go to network
          navigateFallbackDenylist: [/^\/rest\//, /^\/auth\//],
          runtimeCaching: [
            {
              // Supabase REST API — NetworkOnly (never cache DB data)
              urlPattern: /^https:\/\/[a-z]+\.supabase\.co\//,
              handler: 'NetworkOnly',
            },
          ],
          // Clean up old caches automatically
          cleanupOutdatedCaches: true,
        }
      })
    ],
    server: {
      port: parseInt(process.env.PORT || '5174'),
      proxy: {
        '/api/claude': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/claude/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('x-api-key', env.VITE_ANTHROPIC_API_KEY || '')
              proxyReq.setHeader('anthropic-version', '2023-06-01')
              proxyReq.removeHeader('origin')
            })
          },
        },
      },
    },
  }
})
