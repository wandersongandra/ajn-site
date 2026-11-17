export const NON_DEPLOYABLE_MARKER: '.ajn-non-deployable';

export function isCiSeoSmokeModeEnabled(env: {
  AJN_CI_SEO_SMOKE?: string | undefined;
  GITHUB_ACTIONS?: string | undefined;
  [key: string]: string | undefined;
}): boolean;
