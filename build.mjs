import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('.', import.meta.url));
const output = resolve(root, 'public');

// Rebuild the deployable site from the unchanged GitHub Pages source files.
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

for (const entry of ['index.html', 'beyond-the-portfolio', 'css', 'fonts', 'favicon.svg']) {
  cpSync(resolve(root, entry), resolve(output, entry), { recursive: true });
}

await build({
  entryPoints: [resolve(root, 'js/app.js')],
  outdir: resolve(output, 'js'),
  bundle: true,
  format: 'esm',
  splitting: true,
  target: ['es2020'],
  minify: true,
  entryNames: 'app',
  chunkNames: 'chunk-[name]-[hash]',
});

console.log('Built static site into public/');
