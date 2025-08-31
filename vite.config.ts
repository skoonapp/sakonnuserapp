

import path from 'path';
// FIX: Changed to use `process` from 'node:process' to ensure the correct Node.js built-in module and its types are imported, resolving the module export error on `cwd`.
// FIX: Use an aliased import for 'node:process' to avoid a likely type collision that was causing an error on `process.cwd()`.
import p from 'node:process';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
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
// FIX: Replaced `__dirname` with `process.cwd()` to resolve the "Cannot find name '__dirname'" error in an ES module context.
// FIX: Switched to `process.cwd()` to resolve module export errors.
          '@': path.resolve(p.cwd(), '.'),
        }
      },
      build: {
        rollupOptions: {
          external: ['@google/genai']
        }
      }
    };
});