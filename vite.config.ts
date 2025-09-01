import path from 'path';
// FIX: Import 'process' from 'process' to ensure the correct Node.js built-in module is used, resolving errors where 'cwd' is not found.
import process from 'process';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    // FIX: Explicitly use `process.cwd()` to ensure the correct directory is passed to loadEnv.
    const env = loadEnv(mode, process.cwd(), '');
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
                src: 'icon.svg',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
              },
              {
                src: 'icon.svg',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
              },
              {
                src: 'icon.svg',
                sizes: '512x512',
                type: 'image/png',
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
// FIX: Replaced `__dirname` with `process.cwd()` to resolve errors in an ES module context.
          '@': path.resolve(process.cwd(), '.'),
        }
      },
      build: {
        rollupOptions: {
          external: ['@google/genai']
        }
      }
    };
});