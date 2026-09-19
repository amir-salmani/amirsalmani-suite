/* verify/ proves the component tier builds. It is not shipped.
 *
 * The aliases are the consumer's components.json, spelled for Vite: upstream
 * writes @ui/, @components/, @lib/ and @hooks/ into its registry targets, and
 * @/ into its own imports. tools/stage.mjs lays the files out to match.
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

const suite = path.resolve(import.meta.dirname, 'src/suite');

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: '@ui', replacement: path.join(suite, 'components/ui') },
      { find: '@components', replacement: path.join(suite, 'components') },
      { find: '@hooks', replacement: path.join(suite, 'hooks') },
      // token-colour is ours, but it is staged into lib/ exactly where a
      // consumer's install would put it, so one alias covers both tiers.
      { find: '@lib', replacement: path.join(suite, 'lib') },
      { find: '@suite', replacement: suite },
      { find: '@', replacement: suite },
    ],
  },
  build: { outDir: 'dist', emptyOutDir: true },
});
