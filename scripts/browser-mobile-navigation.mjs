// Fase 2 / Lote 2: comportamento mobile de menu, blog e controles responsivos.
// BASE_URL=http://127.0.0.1:4321 node scripts/browser-mobile-navigation.mjs
import { chromium } from 'playwright';

const origin = process.env.BASE_URL || 'http://127.0.0.1:4321';
const widths = [320, 390, 620, 768, 1024, 1440];
const routes = ['/', '/blog/', '/servicos/', '/contato/'];
const article = '/blog/laudo-tecnico-das-condicoes-ambientais-de-trabalho-ltcat/';
const browser = await chromium.launch({ headless: true });
const failures = [];
let assertions = 0;

function check(condition, description) {
  assertions += 1;
  if (!condition) failures.push(description);
}
async function load(context, route, errors = []) {
  const page = await context.newPage();
  // Deferred startup scripts run before DOMContentLoaded: subscribe first.
  page.on('pageerror', error => errors.push(error.message));
  const response = await page.goto(new URL(route, origin).href, {
    waitUntil: 'domcontentloaded', timeout: 45000,
  });
  check(Boolean(response && response.ok()), route + ': HTTP ' + (response?.status() ?? 'offline'));
  await page.locator('main').waitFor({ timeout: 15000 });
  const reject = page.locator('[data-privacy-reject]');
  if (await reject.isVisible()) await reject.click();
  return page;
}
async function widthMeasurements(page) {
  return page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
}
async function focusIs(page, selector) {
  return page.evaluate((s) => document.activeElement?.matches(s) ?? false, selector);
}

try {
  for (const width of widths) {
    const context = await browser.newContext({
      viewport: { width, height: 850 }, locale: 'pt-BR', reducedMotion: 'reduce',
    });
    for (const route of routes) {
      const errors = [];
      const page = await load(context, route, errors);
      const m = await widthMeasurements(page);
      check(m.documentWidth <= m.viewportWidth + 3,
        route + ' at ' + width + ': horizontal overflow ' + m.documentWidth + '/' + m.viewportWidth);
      check(errors.length === 0, route + ' at ' + width + ': no JS errors');

      if (route === '/blog/') {
        const input = page.locator('[data-blog-search]');
        const fontSize = await input.evaluate(el => Number.parseFloat(getComputedStyle(el).fontSize));
        if (width <= 620) check(fontSize >= 16,
          'Blog archive at ' + width + ': input must not trigger mobile focus zoom (' + fontSize + 'px)');
        if (width <= 800) {
          const chipSizes = await page.locator('.blog-hub .blog-sidebar__topic-list a')
            .evaluateAll(links => links.map(link => {
              const box = link.getBoundingClientRect();
              return { height: box.height, width: box.width };
            }));
          check(chipSizes.length > 1 && chipSizes.every(dim => dim.height >= 44 && dim.width >= 24),
            'Blog at ' + width + ': topic targets should have sufficient height and width');
          const topicRail = await page.locator('.blog-hub .blog-sidebar__topic-list')
            .evaluate(el => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth,
              overflow: getComputedStyle(el).overflowX }));
          check(topicRail.overflow === 'auto' && topicRail.clientWidth > 0,
            'Blog at ' + width + ': category strip remains contained and scrollable');
        }
      }

      if (width <= 1100) {
        const menu = page.locator('[data-menu-toggle]');
        await menu.click();
        check(await menu.getAttribute('aria-expanded') === 'true',
          route + ' at ' + width + ': menu opens');
        check(await page.locator('#primary-navigation').isVisible(),
          route + ' at ' + width + ': menu is visible');
        await page.keyboard.press('Escape');
        check(await menu.getAttribute('aria-expanded') === 'false',
          route + ' at ' + width + ': Escape closes menu');
        check(await focusIs(page, '[data-menu-toggle]'),
          route + ' at ' + width + ': Escape restores focus to toggle');
      }
      await page.close();
    }
    if (width <= 620) {
      const articlePage = await load(context, article);
      const input = articlePage.locator('.blog-reading .blog-sidebar__search input');
      check(await input.count() === 1, 'Blog article at ' + width + ': sidebar search exists');
      const fontSize = await input.evaluate(el => Number.parseFloat(getComputedStyle(el).fontSize));
      check(fontSize >= 16,
        'Blog article at ' + width + ': 16px input prevents iOS focus zoom (' + fontSize + 'px)');
      const m = await widthMeasurements(articlePage);
      check(m.documentWidth <= m.viewportWidth + 3,
        'Blog article at ' + width + ': no horizontal overflow');
      await articlePage.close();
    }
    await context.close();
  }

  // Orientation/resizing can turn a focused menu item into display:none.
  // Test both directions, keeping keyboard focus visible after the breakpoint.
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', locale: 'pt-BR',
  });
  const page = await load(context, '/blog/');
  const menu = page.locator('[data-menu-toggle]');
  const firstLink = page.locator('#primary-navigation a[href]').first();

  await menu.click();
  await firstLink.focus();
  check(await focusIs(page, '#primary-navigation a[href]'),
    'Mobile: keyboard focus inside open navigation');
  await page.setViewportSize({ width: 1440, height: 900 });
  check(await focusIs(page, '#primary-navigation a[href]'),
    'Wide viewport: focused navigation link stays visible');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => document.activeElement?.matches('[data-menu-toggle]') === true);
  check(await focusIs(page, '[data-menu-toggle]'),
    'Wide-to-mobile breakpoint: hidden link focus moves to visible menu toggle');
  // Regress the browser ordering where CSS blur occurs before matchMedia change.
  await page.setViewportSize({ width: 1440, height: 900 });
  await firstLink.focus();
  await page.evaluate(() => document.activeElement?.blur());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => document.activeElement?.matches('[data-menu-toggle]') === true);
  check(await focusIs(page, '[data-menu-toggle]'),
    'Wide-to-mobile breakpoint: remembered navigation focus survives early blur');
  check(await menu.getAttribute('aria-expanded') === 'false',
    'Wide-to-mobile breakpoint: navigation is collapsed');

  await menu.focus();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForFunction(() => document.activeElement?.matches('#primary-navigation a[href]') === true);
  check(await focusIs(page, '#primary-navigation a[href]'),
    'Mobile-to-wide breakpoint: hidden toggle focus moves to visible navigation');
  await context.close();
} finally {
  await browser.close();
}

if (failures.length) {
  for (const failure of failures) console.error('[mobile-nav][FAIL]', failure);
  console.error('Mobile navigation FAILED: ' + failures.length + '/' + assertions);
  process.exitCode = 1;
} else {
  console.log('Mobile navigation PASS: ' + assertions + ' assertions across ' +
    widths.length + ' widths and four routes plus article/breakpoint regressions.');
}
