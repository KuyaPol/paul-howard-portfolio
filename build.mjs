import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('.', import.meta.url));
const output = resolve(root, 'public');

// Rebuild the deployable site from the unchanged GitHub Pages source files.
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
mkdirSync(resolve(output, 'js'), { recursive: true });

// Phase 14 publishes the approved prototype at the portfolio's root routes.
// Keep this list explicit so review captures, logs, and local tooling stay out.
for (const entry of [
  'index.html',
  'about',
  'beyond-the-portfolio',
  'projects',
  'css',
  'fonts',
  'favicon.svg',
  'assets',
  'docs',
  'js/prototype.js',
  'js/prototype-scene.js',
  'js/site-fade.js',
  'js/site-reload.js',
  'js/project.js',
  'js/experiments.js',
  'js/vendor'
]) {
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
