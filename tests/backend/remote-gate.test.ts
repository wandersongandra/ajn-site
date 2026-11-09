import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

function runGate(env: Record<string, string | undefined>) {
  return spawnSync(process.execPath, ['scripts/test-remote-carreiras.mjs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

describe('gate remoto — sem falsos positivos', () => {
  it('permanece BLOCKED sem endpoint mesmo com a flag histórica', () => {
    const result = runGate({
      AJN_CARREIRAS_REMOTE_ORIGIN: undefined,
      AJN_CARREIRAS_STAGING_ORIGIN: undefined,
      AJN_CARREIRAS_HOMOLOGATION_READY: 'true',
    });
    expect(result.status).toBe(2);
    const report = JSON.parse(result.stdout);
    expect(report.status).toBe('BLOCKED');
    expect(report.checks.every((check: { status: string }) => check.status === 'BLOCKED')).toBe(true);
    expect(result.stdout).not.toContain('PASS');
  });

  it('rejeita domínio de produção antes de executar rede', () => {
    const result = runGate({
      AJN_CARREIRAS_REMOTE_ORIGIN: 'https://carreiras.ajnengenharia.com.br',
      AJN_CARREIRAS_STAGING_ORIGIN: undefined,
      AJN_CARREIRAS_HOMOLOGATION_READY: 'true',
    });
    expect(result.status).toBe(1);
    const report = JSON.parse(result.stdout);
    expect(report.status).toBe('FAIL');
    expect(report.checks.find((check: { id: string }) => check.id === 'a.endpoint_https').status).toBe('FAIL');
  });
});
