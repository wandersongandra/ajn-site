// Browser validation of the AJN Home social showcase and three engineering service routes.
// Run with Playwright installed: BASE_URL=http://127.0.0.1:4321 node scripts/browser-smoke.mjs
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.BASE_URL || 'http://127.0.0.1:4321';
const output = path.resolve('artifacts/browser-smoke');
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const widths = [320, 390, 768, 1440];
const routes = ['/', '/servicos/', '/projetos-spda/', '/projetos-cabeamento-estruturado/', '/projetos-eletricos-prediais/', '/medicoes-ambientais-ocupacionais/'];
const failures = [];
let assertions = 0;

function assert(ok, description) {
  assertions += 1;
  if (!ok) failures.push(description);
}

for (const width of widths) {
  const context = await browser.newContext({
    viewport: { width, height: 850 },
    reducedMotion: 'reduce',
    deviceScaleFactor: 1,
    locale: 'pt-BR',
  });
  for (const route of routes) {
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    const response = await page.goto(new URL(route, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    assert(response?.ok(), `HTTP ${route} at ${width}px: ${response?.status() ?? 'offline'}`);
    await page.locator('main').waitFor({ timeout: 15000 });
    const measurements = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
      h1: document.querySelectorAll('h1').length,
      main: Boolean(document.querySelector('main')),
    }));
    assert(measurements.width <= measurements.viewport + 3,
      `Overflow ${route} at ${width}px: doc ${measurements.width}px > viewport ${measurements.viewport}px`);
    assert(measurements.h1 === 1, `H1 count ${route} at ${width}px: ${measurements.h1}`);
    assert(pageErrors.length === 0, `JS errors ${route} at ${width}px: ${pageErrors.join('; ')}`);

    if (route === '/medicoes-ambientais-ocupacionais/') {
      // Trigger lazy images during normal scrolling before screenshots.
      const instruments = page.locator('.ajn-measure__card img, .ajn-measure__custom img');
      assert(await instruments.count() === 4, `Medições: quatro fotos de modalidade em ${width}px`);
      for (const img of await instruments.all()) {
        await img.scrollIntoViewIfNeeded();
        const loaded = await img.evaluate(async (el) => {
          try { await el.decode(); return el.naturalWidth > 0 && el.naturalHeight > 0; }
          catch { return false; }
        });
        assert(loaded, `Medições: imagem de modalidade não carregou em ${width}px`);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
    }
    if (route === '/medicoes-ambientais-ocupacionais/') {
      assert(await page.locator('.ajn-measure__card').count() === 3, `Medições: cartões de avaliação em ${width}px`);
      assert(await page.locator('.ajn-measure__faq-list details').count() === 4, `Medições: FAQ em ${width}px`);
      assert(await page.getByRole('link', { name: /Solicitar orçamento/ }).count() >= 1, `Medições: CTA em ${width}px`);
    }
    if (route === '/') {
      // O painel de privacidade é fixo e corretamente intercepta cliques até a escolha;
      // testar o feed depois de rejeitar opcionais, sem iniciar rastreamento.
      const reject = page.locator('[data-privacy-reject]');
      if (await reject.isVisible()) await reject.click();
      const section = page.locator('.instagram-highlights');
      assert(await section.count() === 1, `Instagram showcase missing at ${width}px`);
      assert(await section.locator('article.instagram-highlights__card').count() === 6, `Six original posts expected at ${width}px`);
      const links = await section.locator('article a').evaluateAll(nodes =>
        nodes.map(n => ({ href: n.href, rel: n.rel, target: n.target })));
      assert(links.length === 6 && links.every(l => l.href.startsWith('https://www.instagram.com/') &&
        l.target === '_blank' && l.rel.includes('noopener')), `Instagram external link safety at ${width}px`);
      const rail = section.locator('#ajn-instagram-posts');
      assert(await rail.getAttribute('tabindex') === '0', `Keyboard scroll area missing at ${width}px`);
      const controls = section.locator('[data-ig-scroll]');
      assert(await controls.count() === 2, `Scroll controls missing at ${width}px`);
      await rail.scrollIntoViewIfNeeded();
      await section.screenshot({ path: path.join(output, `instagram-${width}.png`), animations: 'disabled' });
      const before = await rail.evaluate(el => el.scrollLeft);
      await section.locator('[data-ig-scroll="next"]').click();
      await page.waitForTimeout(120);
      const after = await rail.evaluate(el => el.scrollLeft);
      assert(after > before, `Next button does not move the feed at ${width}px (before=${before}, after=${after})`);
      const afterPrevious = await section.locator('[data-ig-scroll="previous"]').isDisabled();
      assert(!afterPrevious, `Previous control did not enable at ${width}px`);
      const trackerPresent = await page.evaluate(() => Boolean(window.gtag));
      assert(!trackerPresent, `Analytics loaded before cookie consent at ${width}px`);
    } else if (width === 390 || width === 1440) {
      const name = route.replace(/\W+/g, '-').replace(/^-|-$/g, '');
      await page.screenshot({ path: path.join(output, `${name}-${width}.png`), fullPage: true, animations: 'disabled' });
    }
    await page.close();
  }
  await context.close();
}
await browser.close();
if (failures.length) {
  for (const f of failures) console.error('[browser][FAIL]', f);
  console.error(`Browser smoke FAILED: ${failures.length} issue(s) / ${assertions} assertions.`);
  process.exitCode = 1;
} else console.log(`Browser smoke PASS: ${assertions} assertions, ${routes.length} routes x 4 viewports. Screenshots at ${output}`);
