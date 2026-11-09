import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const destination = resolve(root, 'dist', 'styles');

await mkdir(destination, { recursive: true });
await Promise.all([
  copyFile(resolve(root, 'src', 'styles', 'global.css'), resolve(destination, 'global.css')),
  copyFile(resolve(root, 'src', 'styles', 'carreiras.css'), resolve(destination, 'carreiras.css')),
]);

console.log('[worker-assets] PASS: estilos compartilhados copiados para dist/styles.');
