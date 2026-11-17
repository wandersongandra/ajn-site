import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const MAX_CSP_HEADER_BYTES = 4096;

// Valores de atributo style aplicados dinamicamente pelos scripts public/scripts/carreiras.js e admin-carreiras.js
const DYNAMIC_DOM_STYLE_VALUES = [
  'display: none;',
  'display: block;',
  'display: flex;',
  'display: grid;',
  'display:none',
  'display:block',
  'letter-spacing: 0.15em; font-weight: bold; text-align: center; font-size: 1.25rem;',
];

function walkHtmlFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkHtmlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results.sort();
}

const STYLE_HTML_ENTITY_MAP = new Map([
  ['&quot;', '"'],
  ['&#34;', '"'],
  ['&#39;', "'"],
  ['&apos;', "'"],
  ['&amp;', '&'],
  ['&lt;', '<'],
  ['&gt;', '>'],
]);

const STYLE_HTML_ENTITY_REGEX = /&(quot|#34|#39|apos|amp|lt|gt);/g;

export function decodeHtmlEntitiesInStyle(raw) {
  return raw.replace(
    STYLE_HTML_ENTITY_REGEX,
    (entity) => STYLE_HTML_ENTITY_MAP.get(entity) ?? entity
  );
}

export function extractInlineStyleAttributes(html) {
  const values = [];
  const regex = /\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const rawVal = match[1] ?? match[2] ?? '';
    if (rawVal !== '') {
      values.push(decodeHtmlEntitiesInStyle(rawVal));
    }
  }
  return values;
}

export function extractInlineStyleElements(html) {
  const values = [];
  const regex = /<style(?:\s+[^>]*)?>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const rawCss = match[1] ?? '';
    if (rawCss !== '') {
      values.push(rawCss);
    }
  }
  return values;
}

export function sha256CspToken(styleContent) {
  const digest = createHash('sha256').update(styleContent, 'utf8').digest('base64');
  return `'sha256-${digest}'`;
}

function isEnoentError(error) {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT');
}

export function collectDistStyleHashes(distDir = resolve(process.cwd(), 'dist')) {
  let htmlFiles;
  try {
    htmlFiles = walkHtmlFiles(distDir);
  } catch (error) {
    if (isEnoentError(error)) {
      throw new Error(`Diretório dist não encontrado em ${distDir}. Execute npm run build antes.`);
    }
    throw error;
  }
  const styleSet = new Set();
  const perFileStyles = new Map();

  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    const styles = [
      ...extractInlineStyleAttributes(html),
      ...extractInlineStyleElements(html),
    ];
    perFileStyles.set(file, styles);
    for (const styleValue of styles) {
      styleSet.add(styleValue);
    }
  }

  for (const dyn of DYNAMIC_DOM_STYLE_VALUES) {
    styleSet.add(dyn);
  }

  const hashTokens = Array.from(styleSet).map((s) => sha256CspToken(s));
  return {
    htmlFileCount: htmlFiles.length,
    uniqueStyleCount: styleSet.size,
    hashTokens,
    perFileStyles,
  };
}

export function buildEnforcedCspHeader(hashTokens) {
  const styleHashes = hashTokens.join(' ');
  return [
    "default-src 'self'",
    "script-src 'self' https://challenges.cloudflare.com",
    `style-src 'self' 'unsafe-hashes' ${styleHashes}`,
    "font-src 'self' data:",
    "img-src 'self' data:",
    "connect-src 'self' https://api.opengscgandra.tech https://challenges.cloudflare.com",
    "frame-src https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

export function syncCspStyleHashes({
  rootDir = process.cwd(),
  distDir = resolve(rootDir, 'dist'),
  publicHtaccessPath = resolve(rootDir, 'public', '.htaccess'),
  distHtaccessPath = resolve(distDir, '.htaccess'),
} = {}) {
  const { htmlFileCount, uniqueStyleCount, hashTokens, perFileStyles } = collectDistStyleHashes(distDir);
  const cspHeaderValue = buildEnforcedCspHeader(hashTokens);
  const cspByteLength = Buffer.byteLength(cspHeaderValue, 'utf8');

  if (cspByteLength > MAX_CSP_HEADER_BYTES) {
    throw new Error(
      `[CSP SYNC FAIL] Header Content-Security-Policy excede o limite de ${MAX_CSP_HEADER_BYTES} bytes (${cspByteLength} bytes com ${hashTokens.length} hashes).`
    );
  }

  const updateHtaccess = (htaccessFile) => {
    let current;
    try {
      current = readFileSync(htaccessFile, 'utf8');
    } catch (error) {
      if (isEnoentError(error)) return false;
      throw error;
    }
    const cspLineRegex = /^(\s*Header always set Content-Security-Policy\s+)"[^"]*"/m;
    if (!cspLineRegex.test(current)) {
      throw new Error(`Diretiva Content-Security-Policy não encontrada em ${htaccessFile}`);
    }
    const updated = current.replace(cspLineRegex, `$1"${cspHeaderValue}"`);
    if (updated !== current) {
      writeFileSync(htaccessFile, updated, 'utf8');
    }
    return true;
  };

  updateHtaccess(publicHtaccessPath);
  updateHtaccess(distHtaccessPath);

  const verification = verifyCspStyleHashes({
    distDir,
    htaccessPath: publicHtaccessPath,
    perFileStyles,
  });
  if (!verification.ok) {
    throw new Error(`[CSP SYNC FAIL] ${verification.errors.join('; ')}`);
  }

  return {
    htmlFileCount,
    uniqueStyleCount,
    hashCount: hashTokens.length,
    cspByteLength,
    cspHeaderValue,
  };
}

export function verifyCspStyleHashes({
  distDir = resolve(process.cwd(), 'dist'),
  htaccessPath = resolve(process.cwd(), 'public', '.htaccess'),
  perFileStyles = null,
} = {}) {
  const errors = [];
  let htaccessContent;
  try {
    htaccessContent = readFileSync(htaccessPath, 'utf8');
  } catch (error) {
    if (isEnoentError(error)) {
      return { ok: false, errors: [`Arquivo .htaccess ausente: ${htaccessPath}`] };
    }
    throw error;
  }
  const match = htaccessContent.match(/^\s*Header always set Content-Security-Policy\s+"([^"]+)"/m);
  if (!match) {
    return { ok: false, errors: ['Header Content-Security-Policy não encontrado no .htaccess'] };
  }

  const cspHeaderValue = match[1];
  const cspByteLength = Buffer.byteLength(cspHeaderValue, 'utf8');
  if (cspByteLength > MAX_CSP_HEADER_BYTES) {
    errors.push(
      `Header Content-Security-Policy (${cspByteLength} bytes) ultrapassa o limite máximo de ${MAX_CSP_HEADER_BYTES} bytes`
    );
  }

  const styleSrcMatch = cspHeaderValue
    .split(';')
    .map((d) => d.trim())
    .find((d) => d.toLowerCase().startsWith('style-src '));
  if (!styleSrcMatch) {
    errors.push('Diretiva style-src ausente na CSP');
    return { ok: false, errors, cspByteLength, htmlFileCount: 0 };
  }

  const allowedHashes = new Set(
    styleSrcMatch
      .split(/\s+/)
      .slice(1)
      .filter((token) => token.startsWith("'sha256-"))
  );

  const fileMap = perFileStyles ?? collectDistStyleHashes(distDir).perFileStyles;
  for (const [file, styles] of fileMap.entries()) {
    for (const styleVal of styles) {
      const token = sha256CspToken(styleVal);
      if (!allowedHashes.has(token)) {
        errors.push(`Estilo inline sem hash em ${file}: style="${styleVal}" (${token})`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    cspByteLength,
    htmlFileCount: fileMap.size,
    hashCount: allowedHashes.size,
  };
}

export function extractCspHeaderFromHtaccess(htaccessPath) {
  const content = readFileSync(htaccessPath, 'utf8');
  const match = content.match(/^\s*Header always set Content-Security-Policy\s+"([^"]+)"/m);
  return {
    content,
    cspHeaderValue: match ? match[1] : null,
  };
}

export function verifyHtaccessCspSync(htaccessPaths, { requireByteMatch = true } = {}) {
  const resolved = htaccessPaths.filter(Boolean);
  if (resolved.length < 2) {
    throw new Error('verifyHtaccessCspSync exige ao menos 2 arquivos .htaccess.');
  }
  const errors = [];
  const entries = [];

  for (const htaccessPath of resolved) {
    let extracted;
    try {
      extracted = extractCspHeaderFromHtaccess(htaccessPath);
    } catch (error) {
      if (isEnoentError(error)) {
        errors.push(`Arquivo .htaccess ausente para validação de sincronia: ${htaccessPath}`);
        continue;
      }
      throw error;
    }
    const { content, cspHeaderValue } = extracted;
    if (!cspHeaderValue) {
      errors.push(`Header Content-Security-Policy ausente em ${htaccessPath}`);
      continue;
    }
    const cspSha256 = createHash('sha256').update(cspHeaderValue, 'utf8').digest('hex');
    const fileSha256 = createHash('sha256').update(content, 'utf8').digest('hex');
    entries.push({
      path: htaccessPath,
      cspSha256,
      fileSha256,
      cspByteLength: Buffer.byteLength(cspHeaderValue, 'utf8'),
    });
  }

  if (entries.length >= 2) {
    const baseline = entries[0];
    for (const entry of entries.slice(1)) {
      if (entry.cspSha256 !== baseline.cspSha256) {
        errors.push(
          `CSP divergiu entre ${baseline.path} (${baseline.cspSha256}) e ${entry.path} (${entry.cspSha256})`
        );
      }
      if (requireByteMatch && entry.fileSha256 !== baseline.fileSha256) {
        errors.push(
          `Conteúdo .htaccess divergiu entre ${baseline.path} (${entry.fileSha256}) e ${entry.path} (${entry.fileSha256})`
        );
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    cspSha256: entries[0]?.cspSha256 ?? null,
    entries,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = syncCspStyleHashes();
  console.log(
    `[csp-sync] PASS: ${result.htmlFileCount} páginas HTML verificadas | ${result.hashCount} hashes em style-src | CSP = ${result.cspByteLength}/${MAX_CSP_HEADER_BYTES} bytes`
  );
}
