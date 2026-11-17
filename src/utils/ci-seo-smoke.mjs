export const NON_DEPLOYABLE_MARKER = '.ajn-non-deployable';

export function isCiSeoSmokeModeEnabled(env) {
  const ciSeoSmoke = (env?.AJN_CI_SEO_SMOKE ?? '').trim() === '1';
  if (!ciSeoSmoke) {
    return false;
  }
  const isGitHubActions = (env?.GITHUB_ACTIONS ?? '').trim().toLowerCase() === 'true';
  if (!isGitHubActions) {
    throw new Error(
      '[SECURITY GATE] Build bloqueado: AJN_CI_SEO_SMOKE=1 só é permitido em execução real no GitHub Actions (GITHUB_ACTIONS=true).'
    );
  }
  return true;
}
