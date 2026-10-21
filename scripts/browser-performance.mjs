// AJN Phase 3: first-paint and resource-priority regression checks.
// LCP timings are informational lab samples, NOT field p75 nor hard SLA.
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.BASE_URL || 'http://127.0.0.1:4321';
const browser = await chromium.launch({ headless: true });
const reportPath = path.resolve('output/playwright/browser-smoke/performance-lab.json');
await fs.mkdir(path.dirname(reportPath), { recursive: true });
const scenarios = [
  { name: 'mobile', width: 390, reducedMotion: 'no-preference', saveData: false },
  { name: 'mobile-reduced', width: 390, reducedMotion: 'reduce', saveData: false },
  { name: 'mobile-saveData', width: 390, reducedMotion: 'no-preference', saveData: true },
  { name: 'desktop', width: 1440, reducedMotion: 'no-preference', saveData: false },
];
const routes = [
  { route: '/', kind: 'home' },
  { route: '/servicos/gestao-ambiental/', kind: 'service-detail' },
  { route: '/blog/', kind: 'blog' },
];
const samples = [], failures = [];
let assertions = 0;
function assert(condition, message) {
  assertions++;
  if (!condition) failures.push(message);
}

async function inspect(scenario, { route, kind }) {
  const context = await browser.newContext({
    viewport: { width: scenario.width, height: 850 },
    reducedMotion: scenario.reducedMotion,
    locale: 'pt-BR',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript((saveData) => {
    if (saveData) {
      try {
        Object.defineProperty(navigator, 'connection', {
          configurable: true, value: { saveData: true },
        });
      } catch {}
    }
    window.__ajnPerfLcp = [];
    if ('PerformanceObserver' in window) {
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            window.__ajnPerfLcp.push({
              startTime: Math.round(entry.startTime),
              tagName: entry.element?.tagName ?? null,
              id: entry.element?.id ?? null,
              url: entry.url || null,
            });
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {}
    }
  }, scenario.saveData);
  try {
    const response = await page.goto(new URL(route, base).href, {
      waitUntil: 'domcontentloaded', timeout: 45000,
    });
    assert(response?.ok(), scenario.name + ' ' + route + ': page loads successfully');
    await page.locator('main').waitFor({ timeout: 10000 });
    if (kind === 'home') {
      const hero = await page.locator('.home-page .hero__content h1').evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          text: el.textContent?.trim() || '',
          opacity: Number(s.opacity),
          animationName: s.animationName,
          bounds: el.getBoundingClientRect().toJSON(),
        };
      });
      assert(hero.text.length > 12, scenario.name + ': critical H1 is rendered');
      if (scenario.width <= 768) {
        assert(hero.animationName === 'none',
          scenario.name + ': mobile critical heading is not delayed by an entrance animation');
        assert(hero.opacity >= 0.98, scenario.name + ': mobile H1 is immediately visible');
      }
      const hints = await page.locator('head link[rel="preload"][as="image"]').evaluateAll(links =>
        links.map(el => ({ href: el.getAttribute('href'), priority: el.getAttribute('fetchpriority') })));
      assert(hints.length === 1 && hints[0].href === '/images/hero/banner.webp' &&
        hints[0].priority === 'high',
        scenario.name + ': homepage hero has exactly one high-priority image preload');
    }
    if (kind === 'service-detail') {
      const priority = await page.locator('.service-detail-wp__image img').evaluate(img => ({
        priority: img.getAttribute('fetchpriority'),
        loading: img.getAttribute('loading'),
        decoding: img.getAttribute('decoding'),
        width: Number(img.getAttribute('width')),
        height: Number(img.getAttribute('height')),
        src: img.getAttribute('src'),
      }));
      assert(priority.priority === 'high' && priority.loading === 'eager' &&
        priority.decoding === 'async', scenario.name + ': above-fold service image is high priority');
      assert(priority.width > 0 && priority.height > 0 && Boolean(priority.src),
        scenario.name + ': service image reserves its dimensions and has a source');
    }
    await page.waitForLoadState('load', { timeout: 15000 });
    await page.waitForTimeout(400);
    const performance = await page.evaluate(() => {
      const lcp = window.__ajnPerfLcp?.at(-1) ?? null;
      const nav = performance.getEntriesByType('navigation')[0];
      const firstPaint = performance.getEntriesByType('paint')
        .find(entry => entry.name === 'first-contentful-paint')?.startTime ?? null;
      return {
        lcp,
        fcpMs: firstPaint == null ? null : Math.round(firstPaint),
        domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
        transferSizeBytes: performance.getEntriesByType('resource')
          .reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
      };
    });
    assert(errors.length === 0, scenario.name + ' ' + route + ': no JavaScript exceptions (' +
      errors.join('; ') + ')');
    samples.push({ scenario: scenario.name, route, ...performance });
  } finally {
    await context.close();
  }
}

try {
  for (const scenario of scenarios) {
    for (const route of routes) await inspect(scenario, route);
  }
} finally {
  await browser.close();
}

await fs.writeFile(reportPath, JSON.stringify({
  note: 'Chromium preview single-run laboratory samples; not real-user LCP p75.',
  generatedAt: new Date().toISOString(), assertions, failures, samples,
}, null, 2) + '\n');

if (failures.length) {
  for (const failure of failures) console.error('[performance][FAIL]', failure);
  console.error('Performance regression FAILED: ' + failures.length + '/' + assertions);
  process.exitCode = 1;
} else {
  console.log('Performance regression PASS: ' + assertions + ' assertions, ' +
    samples.length + ' lab samples. Report: ' + reportPath);
}
