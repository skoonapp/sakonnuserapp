

import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    // FIX: Replaced process.cwd() with '.' to avoid TypeScript type error.
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [
        VitePWA({
          registerType: 'autoUpdate',
          // Define the manifest here to let the plugin generate and manage it
          manifest: {
            name: "SakoonApp",
            short_name: "Sakoon",
            description: "Talk to trained listeners and find emotional support. A safe space for your feelings.",
            start_url: "/",
            scope: "/",
            display: "standalone",
            background_color: "#f1f5f9",
            theme_color: "#0891B2",
            icons: [
              {
                src: 'https://listenerimages.netlify.app/images/listener8.webp',
                sizes: '192x192',
                type: 'image/webp',
                purpose: 'any',
              },
              {
                src: 'https://listenerimages.netlify.app/images/listener8.webp',
                sizes: '512x512',
                type: 'image/webp',
                purpose: 'any',
              },
              {
                src: 'https://listenerimages.netlify.app/images/listener8.webp',
                sizes: '512x512',
                type: 'image/webp',
                purpose: 'maskable',
              },
            ],
          },
          workbox: {
            importScripts: ['firebase-messaging-sw.js'],
            globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          },
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          // FIX: Replaced process.cwd() with '.' to resolve from the project root.
          '@': path.resolve('.'),
        }
      },
    };
});