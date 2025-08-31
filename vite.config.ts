import path from 'path';
// FIX: Import `process` to provide correct type definitions for `process.cwd()` as the global type was not available.
import process from 'process';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
// FIX: Replaced `__dirname` with `process.cwd()` to resolve the "Cannot find name '__dirname'" error in an ES module context.
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