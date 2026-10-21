// Phase 2 mobile/motion regression. Run against the Astro preview with Playwright.
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.BASE_URL || 'http://127.0.0.1:4321';
const output = path.resolve('output/playwright/browser-smoke/phase2');
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const cases = [
  { name: 'default-320', width: 320, motion: 'no-preference' },
  { name: 'default-390', width: 390, motion: 'no-preference' },
  { name: 'default-1440', width: 1440, motion: 'no-preference' },
  { name: 'reduced-390', width: 390, motion: 'reduce' },
  { name: 'save-data-390', width: 390, motion: 'no-preference', saveData: true },
  { name: 'no-js-390', width: 390, motion: 'no-preference', noJs: true },
];
let assertions = 0;
const failures = [];
function check(ok, message) {
  assertions++;
  if (!ok) failures.push(message);
}

function inspectPage(page) {
  return page.evaluate(() => {
    const targets = [...document.querySelectorAll('.home-page [data-reveal]')];
    const cutoff = innerHeight + 28;
    return {
      width: document.documentElement.scrollWidth,
      viewport: innerWidth,
      scroll: scrollY,
      enabled: document.querySelector('.home-page')?.classList.contains('motion-enabled'),
      ready: document.querySelector('.home-page')?.classList.contains('motion-ready'),
      saver: document.querySelector('.home-page')?.classList.contains('motion-saver'),
      total: targets.length,
      passed: targets.filter(el => el.getBoundingClientRect().top < cutoff).length,
      hiddenPassed: targets.filter(el => el.getBoundingClientRect().top < cutoff &&
        (Number(getComputedStyle(el).opacity) < 0.98 || getComputedStyle(el).visibility === 'hidden')).length,
      notRevealed: targets.filter(el => el.getBoundingClientRect().top < cutoff && !el.classList.contains('is-visible')).length,
    };
  });
}

async function exercise(config) {
  const context = await browser.newContext({
    viewport: { width: config.width, height: 850 },
    reducedMotion: config.motion,
    locale: 'pt-BR',
    javaScriptEnabled: !config.noJs,
  });
  if (config.saveData) {
    await context.addInitScript(() => {
      try {
        Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true } });
      } catch {}
    });
  }
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  try {
    const response = await page.goto(new URL('/', base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    check(response?.ok(), `${config.name}: home responds successfully`);
    await page.locator('.home-page [data-reveal]').first().waitFor();
    if (!config.noJs) {
      const reject = page.locator('[data-privacy-reject]');
      if (await reject.isVisible()) await reject.click();
    }
    const before = await inspectPage(page);
    check(before.total >= 12, `${config.name}: reveal sections are present (${before.total})`);
    check(before.width <= before.viewport + 3, `${config.name}: initial horizontal overflow ${before.width}/${before.viewport}`);
    if (config.motion === 'reduce' || config.saveData || config.noJs) {
      check(!before.ready, `${config.name}: entrance effects disabled with preference or no JS`);
    } else {
      check(before.enabled && before.ready, `${config.name}: entrance effects enabled`);
    }

    // A single instant jump skips IntersectionObserver intersections on some engines.
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
    });
    await page.waitForFunction(() => window.scrollY > 100, null, { timeout: 3000 });
    if (!config.noJs && !config.saveData && config.motion !== 'reduce') {
      await page.waitForFunction(() => {
        const cutoff = innerHeight + 28;
        return [...document.querySelectorAll('.home-page [data-reveal]')]
          .filter(el => el.getBoundingClientRect().top < cutoff)
          .every(el => el.classList.contains('is-visible'));
      }, null, { timeout: 3000 });
      // Let opacity transitions complete before measuring computed visibility.
      await page.waitForFunction(() => {
        const cutoff = innerHeight + 28;
        return [...document.querySelectorAll('.home-page [data-reveal]')]
          .filter(el => el.getBoundingClientRect().top < cutoff)
          .every(el => Number(getComputedStyle(el).opacity) >= 0.98);
      }, null, { timeout: 3000 });
    }
    const after = await inspectPage(page);
    check(after.scroll > 100, `${config.name}: instant scroll reached lower content`);
    check(after.passed > 0 && after.hiddenPassed === 0,
      `${config.name}: invisible passed content after instant scroll (${after.hiddenPassed}/${after.passed})`);
    if (!config.noJs && !config.saveData && config.motion !== 'reduce') {
      check(after.notRevealed === 0, `${config.name}: sections missed by observer (${after.notRevealed})`);
    }
    check(after.width <= after.viewport + 3,
      `${config.name}: horizontal overflow after instant scroll ${after.width}/${after.viewport}`);

    if (!config.noJs) {
      // The carousel must keep navigation state correct after scrolling and resizing.
      const rail = page.locator('#ajn-instagram-posts');
      await rail.scrollIntoViewIfNeeded();
      await page.waitForFunction(() =>
        document.querySelector('[data-ig-scroll="previous"]')?.disabled === true);
      const next = page.locator('[data-ig-scroll="next"]');
      check(!(await next.isDisabled()), `${config.name}: Instagram next is enabled initially`);
      await rail.evaluate(el => { el.scrollLeft = el.scrollWidth; });
      await page.waitForFunction(() =>
        document.querySelector('[data-ig-scroll="next"]')?.disabled === true,
        null, { timeout: 3000 });
      check(!(await page.locator('[data-ig-scroll="previous"]').isDisabled()),
        `${config.name}: previous control updates after rapid rail scroll`);
      check(!await page.evaluate(() => Boolean(window.gtag)),
        `${config.name}: rail interaction does not initialize GA4`);
    }
    check(pageErrors.length === 0, `${config.name}: no JavaScript errors (${pageErrors.join('; ')})`);
    if (['default-320', 'default-390', 'default-1440', 'reduced-390'].includes(config.name)) {
      await page.screenshot({ path: path.join(output, `${config.name}.png`),
        fullPage: true, animations: 'disabled' });
    }
  } finally {
    await context.close();
  }
}

try {
  for (const config of cases) await exercise(config);
} finally {
  await browser.close();
}
if (failures.length) {
  for (const failure of failures) console.error('[phase2][FAIL]', failure);
  console.error(`Phase 2 FAILED: ${failures.length} failures / ${assertions} assertions`);
  process.exitCode = 1;
} else {
  console.log(`Phase 2 PASS: ${assertions} assertions across ${cases.length} mobile/desktop, reduced-motion, saveData and no-JS scenarios`);
}
