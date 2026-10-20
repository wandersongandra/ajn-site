// Regressão de browser para acessibilidade, foco e privacidade da Fase 0.
// Rodar com o preview local: BASE_URL=http://127.0.0.1:4337 node scripts/browser-phase0.mjs
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.BASE_URL || 'http://127.0.0.1:4321';
const baseline = process.argv.includes('--baseline');
const capture = process.env.CAPTURE_PHASE0 === '1';
const output = path.resolve(process.env.PHASE0_OUTPUT || 'output/playwright/phase0');
if (capture) await fs.mkdir(output, { recursive: true });

const profiles = [
  { name: 'mobile-reduced', viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' },
  { name: 'desktop-default', viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' },
];

const browser = await chromium.launch({ headless: true });
const failures = [];
let assertions = 0;

function assert(ok, description) {
  assertions += 1;
  if (!ok) failures.push(description);
}

async function isFocused(locator) {
  return locator.evaluate((element) => document.activeElement === element);
}

async function newPage(context, routeGoogle = true) {
  if (routeGoogle) {
    await context.route('**/*googletagmanager.com/**', (route) => route.abort());
  }
  const page = await context.newPage();
  const response = await page.goto(new URL('/', base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
  assert(response?.ok(), `Home HTTP: ${response?.status() ?? 'offline'}`);
  await page.locator('main').waitFor({ timeout: 15000 });
  return page;
}

async function activeState(page) {
  return page.evaluate(() => {
    const active = document.activeElement;
    return {
      tag: active?.tagName || null,
      id: active?.id || null,
      privacyControl: active?.getAttribute('data-privacy-reject') !== null ? 'reject' :
        active?.getAttribute('data-privacy-customize') !== null ? 'customize' :
        active?.getAttribute('data-privacy-accept') !== null ? 'accept' :
        active?.getAttribute('data-privacy-save') !== null ? 'save' : null,
    };
  });
}

async function inspectInstagram(page, profile) {
  const instagram = await page.locator('.instagram-highlights__link').evaluateAll((links) => links.map((link) => ({
    ariaLabel: link.getAttribute('aria-label'),
    text: link.innerText.trim(),
    title: link.querySelector('h3')?.textContent?.trim() || '',
  })));
  assert(instagram.length === 6, `AJN-002 ${profile}: six Instagram cards are present`);
  assert(instagram.every(({ ariaLabel }) => ariaLabel === null), `AJN-002 ${profile}: card links do not override their visible accessible name`);
  assert(instagram.every(({ text, title }) => title && text.includes(title)), `AJN-002 ${profile}: each accessible name contains its visible title`);
}

async function inspectLegalLinks(context, profile) {
  const legalPage = await context.newPage();
  const legalResponse = await legalPage.goto(new URL('/politica-de-privacidade/', base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
  assert(legalResponse?.ok(), `AJN-003 ${profile}: privacy policy HTTP: ${legalResponse?.status() ?? 'offline'}`);
  await legalPage.locator('main').waitFor({ timeout: 15000 });
  const legalLinks = await legalPage.locator('.legal-document .content-section p a, .legal-document .content-section li a').evaluateAll((links) => links.map((link) => {
    const style = getComputedStyle(link);
    return {
      text: link.textContent?.trim() || '',
      decoration: style.textDecorationLine,
      color: style.color,
    };
  }));
  assert(legalLinks.length >= 3, `AJN-003 ${profile}: inline legal links are present`);
  assert(legalLinks.every(({ decoration }) => decoration.includes('underline')), `AJN-003 ${profile}: inline legal links have a persistent underline`);
  assert(legalLinks.every(({ color }) => color && color !== 'rgb(27, 48, 34)'), `AJN-003 ${profile}: inline legal links use the explicit action color`);
  if (capture) await legalPage.screenshot({ path: path.join(output, `after-focus-privacy-${profile}.png`), fullPage: true, animations: 'disabled' });
  await legalPage.close();
}

async function verifyDecision(profile, decision) {
  const context = await browser.newContext({
    viewport: profile.viewport,
    reducedMotion: profile.reducedMotion,
    deviceScaleFactor: 1,
    locale: 'pt-BR',
  });
  const page = await newPage(context);
  const action = page.locator(decision === 'accept' ? '[data-privacy-accept]' : '[data-privacy-reject]');
  await action.click();
  assert(await page.locator('#ajn-privacy-notice').isHidden(), `AJN-001 ${profile}: ${decision} hides the notice`);
  assert(await isFocused(page.locator('#conteudo-principal')), `AJN-001 ${profile}: ${decision} moves focus to the main content landmark`);
  if (decision === 'accept') {
    assert(await page.evaluate(() => typeof window.gtag === 'function'), `privacy ${profile}: accept initializes the existing GA4 queue`);
  } else {
    assert(await page.evaluate(() => !window.gtag), `privacy ${profile}: reject does not initialize GA4`);
  }
  await page.close();
  await context.close();
}

async function verifyBlockedStorage(profile) {
  const context = await browser.newContext({
    viewport: profile.viewport,
    reducedMotion: profile.reducedMotion,
    deviceScaleFactor: 1,
    locale: 'pt-BR',
  });
  await context.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: false,
      get() { throw new DOMException('Storage disabled', 'SecurityError'); },
    });
  });
  const page = await newPage(context);
  assert(await isFocused(page.locator('[data-privacy-reject]')), `privacy ${profile}: blocked storage still focuses the first privacy action`);
  await page.locator('[data-privacy-reject]').click();
  assert(await isFocused(page.locator('#conteudo-principal')), `privacy ${profile}: blocked storage keeps a visible focus target after reject`);
  assert(await page.evaluate(() => !window.gtag), `privacy ${profile}: blocked storage does not initialize GA4`);
  await page.close();
  await context.close();
}

async function verifyProfile(profile) {
  const context = await browser.newContext({
    viewport: profile.viewport,
    reducedMotion: profile.reducedMotion,
    deviceScaleFactor: 1,
    locale: 'pt-BR',
  });
  const page = await newPage(context);

  assert(await page.evaluate((expected) => window.matchMedia('(prefers-reduced-motion: reduce)').matches === expected, profile.reducedMotion === 'reduce'), `browser ${profile}: reduced-motion media state is correct`);
  assert(await page.locator('#ajn-privacy-notice').isVisible(), `AJN-001 ${profile}: privacy notice is visible without a stored choice`);
  assert(await isFocused(page.locator('[data-privacy-reject]')), `AJN-001 ${profile}: initial focus lands on the first privacy action`);

  const customize = page.locator('[data-privacy-customize]');
  const reject = page.locator('[data-privacy-reject]');
  const accept = page.locator('[data-privacy-accept]');
  const save = page.locator('[data-privacy-save]');
  const analytics = page.locator('[data-privacy-analytics]');
  const notice = page.locator('#ajn-privacy-notice');
  const options = page.locator('[data-privacy-options]');
  const footerPreferences = page.locator('[data-privacy-open]').first();

  await customize.click();
  assert(await isFocused(save), `AJN-001 ${profile}: initial personalization focuses save`);
  await page.keyboard.press('Escape');
  assert(await isFocused(customize), `AJN-001 ${profile}: initial Escape returns focus to Personalizar`);
  assert(await notice.isVisible(), `AJN-001 ${profile}: initial Escape keeps the notice visible`);
  assert(await options.isHidden(), `AJN-001 ${profile}: initial Escape collapses granular options`);

  await page.keyboard.press('Tab');
  assert(await isFocused(reject), `AJN-001 ${profile}: keyboard navigation reaches reject after Personalizar`);
  await page.keyboard.press('Tab');
  assert(await isFocused(accept), `AJN-001 ${profile}: keyboard navigation reaches accept after reject`);
  await reject.click();
  assert(await notice.isHidden(), `AJN-001 ${profile}: rejection hides the notice`);
  assert(await isFocused(page.locator('#conteudo-principal')), `AJN-001 ${profile}: rejection leaves focus on main content`);
  assert(await page.evaluate(() => !window.gtag), `privacy ${profile}: rejection leaves GA4 unloaded`);

  await inspectInstagram(page, profile);
  assert(await footerPreferences.count() === 1, `AJN-001 ${profile}: footer preference control is available`);
  await footerPreferences.click();
  assert(await isFocused(save), `AJN-001 ${profile}: footer re-opening focuses save`);
  await page.keyboard.press('Escape');
  assert(await isFocused(footerPreferences), `AJN-001 ${profile}: footer Escape restores focus to its trigger`);
  assert(await notice.isHidden(), `AJN-001 ${profile}: footer Escape closes already-decided preferences`);
  await footerPreferences.click();
  await reject.click();
  assert(await notice.isHidden(), `AJN-001 ${profile}: footer reject hides the notice`);
  assert(await isFocused(footerPreferences), `AJN-001 ${profile}: footer reject restores focus to its trigger`);
  assert(await page.evaluate(() => !window.gtag), `privacy ${profile}: footer reject leaves GA4 unloaded`);
  await footerPreferences.click();
  await analytics.check();
  await save.click();
  assert(await notice.isHidden(), `AJN-001 ${profile}: footer save hides the notice`);
  assert(await isFocused(footerPreferences), `AJN-001 ${profile}: footer accept restores focus to its trigger`);
  assert(await page.evaluate(() => typeof window.gtag === 'function'), `privacy ${profile}: footer accept initializes the existing GA4 queue`);

  if (capture) await page.screenshot({ path: path.join(output, `after-focus-home-${profile.name}.png`), fullPage: true, animations: 'disabled' });
  await inspectLegalLinks(context, profile.name);
  await page.close();
  await context.close();

  await verifyDecision(profile, 'accept');
  await verifyDecision(profile, 'reject');
  await verifyBlockedStorage(profile);
}

async function runBaseline() {
  const profile = profiles[0];
  const context = await browser.newContext({
    viewport: profile.viewport,
    reducedMotion: profile.reducedMotion,
    deviceScaleFactor: 1,
    locale: 'pt-BR',
  });
  const page = await newPage(context);
  const before = await activeState(page);
  await page.locator('[data-privacy-customize]').click();
  await page.keyboard.press('Escape');
  const after = await activeState(page);
  const result = {
    mode: 'baseline',
    initial: before,
    afterInitialPersonalizeEscape: after,
    noticeHidden: await page.locator('#ajn-privacy-notice').isHidden(),
  };
  if (capture) await page.screenshot({ path: path.join(output, 'baseline-focus-initial-personalize-escape.png'), fullPage: true, animations: 'disabled' });
  console.log(JSON.stringify(result, null, 2));
  await page.close();
  await context.close();
}

try {
  if (baseline) {
    await runBaseline();
  } else {
    for (const profile of profiles) await verifyProfile(profile);
    if (failures.length) {
      for (const failure of failures) console.error('[phase0][FAIL]', failure);
      console.error(`Phase 0 browser regression FAILED: ${failures.length} issue(s) / ${assertions} assertions.`);
      process.exitCode = 1;
    } else {
      console.log(`Phase 0 browser regression PASS: ${assertions} assertions.`);
    }
  }
} finally {
  await browser.close();
}
