import path from 'path';
// FIX: Changed to use `cwd` from 'node:process' to ensure the correct Node.js built-in module and its types are imported, resolving the type error on `process.cwd()`.
import { cwd } from 'node:process';
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
// FIX: Switched to `cwd()` to resolve "Property 'cwd' does not exist on type 'Process'".
          '@': path.resolve(cwd(), '.'),
        }
      },
      build: {
        rollupOptions: {
          external: ['@google/genai']
        }
      }
    };
});