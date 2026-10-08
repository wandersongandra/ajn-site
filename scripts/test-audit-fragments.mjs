// Regressão de A-005: diferencia âncoras válidas de fragmentos inexistentes.
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = await mkdtemp(join(tmpdir(), 'ajn-fragment-test-'));
const target = join(root, 'blog', 'post');
try {
  await mkdir(target, { recursive: true });
  const writeHome = (href) => writeFile(join(root, 'index.html'),
    `<!doctype html><html><body><main id="inicio"><a href="#inicio">Home</a><a href="${href}">Artigo</a></main></body></html>`);
  await writeFile(join(target, 'index.html'),
    '<!doctype html><html><body><main id="parte-1"></main><a href="https://example.com/#externo">Externo</a></body></html>');
  const command = resolve('scripts/audit-fragments.mjs');
  const check = () => spawnSync(process.execPath, [command], {
    encoding: 'utf8',
    env: { ...process.env, AJN_DIST_DIR: root, PUBLIC_SITE_ORIGIN: 'https://ajn.invalid' },
  });

  await writeHome('/blog/post#parte-1');
  const valid = check();
  assert.equal(valid.status, 0, valid.stderr);
  assert.match(valid.stdout, /PASS: 2 páginas e 2 referências/);

  await writeHome('/blog/post#parte-inexistente');
  const invalid = check();
  assert.equal(invalid.status, 1, 'O script deveria rejeitar fragmentos sem id de destino');
  assert.match(invalid.stderr, /sem âncora.*parte-inexistente/);
  console.log('[fragments:test] PASS: fragmentos locais e entre páginas, cenário inválido detectado.');
} finally {
  await rm(root, { recursive: true, force: true });
}
