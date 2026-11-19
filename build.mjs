import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('.', import.meta.url));
const output = resolve(root, 'public');

// Rebuild the deployable site from the unchanged GitHub Pages source files.
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

for (const entry of ['index.html', 'beyond-the-portfolio', 'css', 'js', 'fonts']) {
  cpSync(resolve(root, entry), resolve(output, entry), { recursive: true });
}

await build({
  entryPoints: [resolve(root, 'js/app.js')],
  outfile: resolve(output, 'js/app.js'),
  bundle: true,
  format: 'iife',
  target: ['es2020'],
  minify: true,
});

console.log('Built static site into public/');
