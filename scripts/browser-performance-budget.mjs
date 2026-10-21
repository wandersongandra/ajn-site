// Regression gate for layout stability and image loading hints; not a field CWV measurement.
import { chromium } from 'playwright';

const base = process.env.BASE_URL || 'http://127.0.0.1:4321';
const browser = await chromium.launch({ headless: true });
const failures = [];
let assertions = 0;
function assert(ok, message) { assertions++; if (!ok) failures.push(message); }

try {
  for (const width of [320, 390, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 850 }, reducedMotion: 'reduce',
    });
    for (const route of ['/', '/blog/', '/servicos/']) {
      const page = await context.newPage();
      const response = await page.goto(new URL(route, base).href, { waitUntil: 'domcontentloaded' });
      assert(response?.ok(), route + ' at ' + width + ': HTTP OK');
      const data = await page.evaluate(() => {
        const imgs = [...document.images];
        const missingDimensions = imgs.filter(img => {
          const width = Number(img.getAttribute('width'));
          const height = Number(img.getAttribute('height'));
          const css = getComputedStyle(img);
          return !(width > 0 && height > 0) && css.aspectRatio === 'auto';
        }).map(img => img.outerHTML.slice(0, 180));
        const eagerBelowFold = imgs.filter(img =>
          img.getBoundingClientRect().top > innerHeight * 2 &&
          img.getAttribute('loading') !== 'lazy').map(img => img.currentSrc);
        const externalFontHosts = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);
        const fontLinks = [...document.querySelectorAll('link[rel="preload"][as="style"][href]')]
          .filter(link => {
            try {
              const url = new URL(link.href);
              return url.protocol === 'https:' && externalFontHosts.has(url.hostname);
            } catch {
              return false;
            }
          }).length;
        return { missingDimensions, eagerBelowFold, fontLinks,
          overflow: document.documentElement.scrollWidth > innerWidth + 3 };
      });
      assert(!data.overflow, route + ' at ' + width + ': no horizontal overflow');
      assert(data.missingDimensions.length === 0,
        route + ' at ' + width + ': all images reserve aspect ratio: ' + data.missingDimensions.join(' | '));
      assert(data.eagerBelowFold.length === 0,
        route + ' at ' + width + ': distant images are lazy: ' + data.eagerBelowFold.join(' | '));
      assert(data.fontLinks === 0,
        route + ' at ' + width + ': no redundant preload of blocking Google Fonts CSS');
      await page.close();
    }
    await context.close();
  }
} finally {
  await browser.close();
}
if (failures.length) {
  for (const f of failures) console.error('[performance][FAIL]', f);
  console.error('Performance regression FAILED: ' + failures.length + '/' + assertions);
  process.exitCode = 1;
} else {
  console.log('Performance regression PASS: ' + assertions + ' assertions');
}
