// Regressão de browser para os P1 AJN-001/002/003.
// Rodar com o preview local: BASE_URL=http://127.0.0.1:4337 node scripts/browser-phase0.mjs
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.BASE_URL || 'http://127.0.0.1:4321';
const baseline = process.argv.includes('--baseline');
const capture = process.env.CAPTURE_PHASE0 === '1';
const output = path.resolve(process.env.PHASE0_OUTPUT || 'output/playwright/phase0');
if (capture) await fs.mkdir(output, { recursive: true });

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

async function newPage(context) {
  const page = await context.newPage();
  const response = await page.goto(new URL('/', base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
  assert(response?.ok(), `Home HTTP: ${response?.status() ?? 'offline'}`);
  await page.locator('main').waitFor({ timeout: 15000 });
  return page;
}

const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: 'reduce',
  deviceScaleFactor: 1,
  locale: 'pt-BR',
});
const page = await newPage(context);

const initial = await page.evaluate(() => {
  const notice = document.querySelector('#ajn-privacy-notice');
  const active = document.activeElement;
  const links = [...document.querySelectorAll('.instagram-highlights__link')];
  return {
    noticeHidden: notice?.hidden ?? true,
    active: active ? {
      tag: active.tagName,
      id: active.id,
      privacyControl: active.getAttribute('data-privacy-reject') !== null ? 'reject' :
        active.getAttribute('data-privacy-customize') !== null ? 'customize' :
        active.getAttribute('data-privacy-accept') !== null ? 'accept' : null,
    } : null,
    instagram: links.map((link) => ({
      ariaLabel: link.getAttribute('aria-label'),
      title: link.querySelector('h3')?.textContent?.trim() || '',
      text: link.innerText.trim(),
    })),
  };
});

if (baseline) {
  let tabsToReject = null;
  for (let index = 1; index <= 80; index += 1) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-privacy-reject') !== null);
    if (focused) {
      tabsToReject = index;
      break;
    }
  }
  console.log(JSON.stringify({
    mode: 'baseline',
    initial,
    tabsToReject,
    legal: await (async () => {
      const legalPage = await context.newPage();
      await legalPage.goto(new URL('/politica-de-privacidade/', base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await legalPage.locator('main').waitFor({ timeout: 15000 });
      const links = await legalPage.locator('.legal-document .content-section p a, .legal-document .content-section li a').evaluateAll((nodes) => nodes.map((link) => {
        const style = getComputedStyle(link);
        return { text: link.textContent?.trim() || '', decoration: style.textDecorationLine, color: style.color };
      }));
      if (capture) await legalPage.screenshot({ path: path.join(output, 'before-privacy-mobile.png'), fullPage: true, animations: 'disabled' });
      await legalPage.close();
      return links;
    })(),
  }, null, 2));
  if (capture) await page.screenshot({ path: path.join(output, 'before-home-mobile.png'), fullPage: true, animations: 'disabled' });
  await page.close();
  await context.close();
  await browser.close();
  process.exit(0);
}

assert(initial.noticeHidden === false, 'AJN-001: privacy notice is visible without a stored choice');
assert(initial.active?.privacyControl === 'reject', 'AJN-001: initial focus lands on the first privacy action');
assert(await isFocused(page.locator('[data-privacy-reject]')), 'AJN-001: reject action is focused in the browser');

const reject = page.locator('[data-privacy-reject]');
await reject.click();
assert(await page.locator('#ajn-privacy-notice').isHidden(), 'AJN-001: initial decision hides the notice');
assert(await page.evaluate(() => !window.gtag), 'AJN-001: rejecting does not initialize analytics');

const instagram = await page.locator('.instagram-highlights__link').evaluateAll((links) => links.map((link) => ({
  ariaLabel: link.getAttribute('aria-label'),
  text: link.innerText.trim(),
  title: link.querySelector('h3')?.textContent?.trim() || '',
})));
assert(instagram.length === 6, 'AJN-002: six Instagram cards are present');
assert(instagram.every(({ ariaLabel }) => ariaLabel === null), 'AJN-002: card links do not override their visible accessible name');
assert(instagram.every(({ text, title }) => title && text.includes(title)), 'AJN-002: each accessible name contains its visible title');

const footerPreferences = page.locator('[data-privacy-open]').first();
assert(await footerPreferences.count() === 1, 'AJN-001: footer preference control is available');
await footerPreferences.click();
assert(await isFocused(page.locator('[data-privacy-save]')), 'AJN-001: preferences focus lands on save');
await page.keyboard.press('Escape');
assert(await isFocused(footerPreferences), 'AJN-001: Escape returns focus to the preferences trigger');
assert(await page.locator('[data-privacy-options]').isHidden(), 'AJN-001: Escape collapses granular options without changing consent');
assert(await page.locator('#ajn-privacy-notice').isHidden(), 'AJN-001: Escape closes a reopened notice when a choice already exists');
await footerPreferences.click();
await page.locator('[data-privacy-reject]').click();
assert(await isFocused(footerPreferences), 'AJN-001: closing reopened preferences restores focus to the trigger');

const legalPage = await context.newPage();
const legalResponse = await legalPage.goto(new URL('/politica-de-privacidade/', base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
assert(legalResponse?.ok(), `AJN-003: privacy policy HTTP: ${legalResponse?.status() ?? 'offline'}`);
await legalPage.locator('main').waitFor({ timeout: 15000 });
const legalLinks = await legalPage.locator('.legal-document .content-section p a, .legal-document .content-section li a').evaluateAll((links) => links.map((link) => {
  const style = getComputedStyle(link);
  return {
    text: link.textContent?.trim() || '',
    decoration: style.textDecorationLine,
    color: style.color,
  };
}));
assert(legalLinks.length >= 3, 'AJN-003: inline legal links are present');
assert(legalLinks.every(({ decoration }) => decoration.includes('underline')), 'AJN-003: inline legal links have a persistent underline');
assert(legalLinks.every(({ color }) => color && color !== 'rgb(27, 48, 34)'), 'AJN-003: inline legal links use the explicit action color');

if (capture) {
  await page.screenshot({ path: path.join(output, 'after-home-mobile.png'), fullPage: true, animations: 'disabled' });
  await legalPage.screenshot({ path: path.join(output, 'after-privacy-mobile.png'), fullPage: true, animations: 'disabled' });
}

await legalPage.close();
await page.close();
await context.close();
await browser.close();

if (failures.length) {
  for (const failure of failures) console.error('[phase0][FAIL]', failure);
  console.error(`Phase 0 browser regression FAILED: ${failures.length} issue(s) / ${assertions} assertions.`);
  process.exitCode = 1;
} else {
  console.log(`Phase 0 browser regression PASS: ${assertions} assertions.`);
}
