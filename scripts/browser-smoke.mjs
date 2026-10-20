// Browser validation of the AJN Home social showcase and three engineering service routes.
// Run with Playwright installed: BASE_URL=http://127.0.0.1:4321 node scripts/browser-smoke.mjs
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.BASE_URL || 'http://127.0.0.1:4321';
const output = path.resolve('output/playwright/browser-smoke');
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const widths = [320, 360, 375, 390, 430, 768, 1024, 1440, 1536, 1920];
const routes = [
  '/',
  '/sobre-nos/',
  '/servicos/',
  '/blog/',
  '/contato/',
  '/projetos-spda/',
  '/projetos-cabeamento-estruturado/',
  '/projetos-eletricos-prediais/',
  '/medicoes-ambientais-ocupacionais/',
];
const scenarios = [
	{
		name: 'reduced',
		reducedMotion: 'reduce',
		saveData: false,
		widths,
		routes,
	},
	{
		name: 'default',
		reducedMotion: 'no-preference',
		saveData: false,
		widths: [390, 1440],
		routes: ['/', '/servicos/', '/contato/', '/medicoes-ambientais-ocupacionais/'],
	},
	{
		name: 'save-data',
		reducedMotion: 'no-preference',
		saveData: true,
		widths: [390, 1440],
		routes: ['/', '/servicos/', '/contato/', '/medicoes-ambientais-ocupacionais/'],
	},
];
const failures = [];
let assertions = 0;

function assert(ok, description) {
  assertions += 1;
  if (!ok) failures.push(description);
}

async function waitForRailScroll(page, before) {
	await page.waitForFunction((previous) => {
		const rail = document.querySelector('#ajn-instagram-posts');
		return Boolean(rail && rail.scrollLeft > previous);
	}, before, { timeout: 2000 });
}

for (const scenario of scenarios) {
	const context = await browser.newContext({
		viewport: { width: scenario.widths[0], height: 850 },
		reducedMotion: scenario.reducedMotion,
		deviceScaleFactor: 1,
		locale: 'pt-BR',
	});
	if (scenario.saveData) {
		await context.addInitScript(() => {
			const connection = navigator.connection;
			if (connection) {
				try {
					Object.defineProperty(connection, 'saveData', { configurable: true, get: () => true });
					return;
				} catch {}
			}
			try {
				Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true } });
			} catch {}
		});
	}
	for (const width of scenario.widths) {
		for (const route of scenario.routes) {
    const page = await context.newPage();
    await page.setViewportSize({ width, height: 850 });
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

    // Use text Range geometry, not the h2 element box: overflowing glyphs may
    // overlap the next grid column without changing document.scrollWidth.
    const footerGeometry = await page.evaluate(() => {
      const selectors = ['.footer__menu h2', '.footer__contact h2', '.footer__social-column h2'];
      const headings = selectors.map(selector => {
        const heading = document.querySelector('.site-footer ' + selector);
        if (!heading) return { label: selector, missing: true, inColumn: false, lines: [] };
        const column = heading.parentElement.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(heading);
        const lines = [...range.getClientRects()].filter(r => r.width > 0 && r.height > 0)
          .map(r => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom }));
        return {
          label: selector,
          missing: false,
          inColumn: lines.length > 0 && lines.every(r => r.left >= column.left - 2 && r.right <= column.right + 2),
          lines,
        };
      });
      const collisions = [];
      for (let i = 0; i < headings.length; i++) {
        for (let j = i + 1; j < headings.length; j++) {
          for (const a of headings[i].lines) {
            for (const b of headings[j].lines) {
              if (a.left < b.right + 4 && a.right + 4 > b.left &&
                  a.top < b.bottom && a.bottom > b.top) {
                collisions.push(headings[i].label + ' / ' + headings[j].label);
              }
            }
          }
        }
      }
      return {
        outside: headings.filter(h => h.missing || !h.inColumn).map(h => h.label),
        collisions,
      };
    });
    assert(footerGeometry.outside.length === 0,
      `Footer titles escape grid columns ${route} at ${width}px (${scenario.name}): ${footerGeometry.outside.join(', ')}`);
    assert(footerGeometry.collisions.length === 0,
      `Footer heading text overlaps ${route} at ${width}px (${scenario.name}): ${footerGeometry.collisions.join(', ')}`);
    if (route === '/' && scenario.name === 'reduced' && [390, 1440, 1536].includes(width)) {
      await page.locator('.site-footer').screenshot({
        path: path.join(output, `footer-${scenario.name}-${width}.png`),
        animations: 'disabled',
      });
    }

		if (route === '/') {
			const motion = await page.evaluate(() => {
				const home = document.querySelector('.home-page');
				const hero = document.querySelector('.hero');
				const heroElements = document.querySelectorAll('.hero__eyebrow, .hero__content h1, .hero__lead, .hero__actions, .hero__panel');
				return {
					saver: home?.classList.contains('motion-saver') ?? false,
					enabled: home?.classList.contains('motion-enabled') ?? false,
					revealsReady: home?.classList.contains('motion-ready') ?? false,
					animations: [...heroElements].map(element => {
						const style = getComputedStyle(element);
						return { name: style.animationName, duration: style.animationDuration };
					}),
					backgroundAnimation: hero ? getComputedStyle(hero, '::before').animationName : 'missing',
				};
			});
			if (scenario.saveData) {
				assert(motion.saver && !motion.enabled, `saveData class state at ${width}px`);
				assert(motion.animations.every(({ name }) => name === 'none') && motion.backgroundAnimation === 'none',
					`Decorative hero animation not disabled for saveData at ${width}px`);
			} else if (scenario.reducedMotion === 'reduce') {
				assert(!motion.enabled && motion.animations.every(({ name }) => name === 'none') && motion.backgroundAnimation === 'none',
					`Reduced-motion hero animation not disabled at ${width}px`);
			} else {
				assert(motion.enabled && !motion.saver, `Default motion class state at ${width}px`);
				assert(motion.animations.some(({ name, duration }) => name === 'hero-rise' && duration !== '0s') && motion.backgroundAnimation === 'ajn-hero-image-enter',
					`Default hero animation not enabled at ${width}px`);
			}
			const preload = page.locator('link[rel="preload"][as="image"][fetchpriority="high"]');
			assert(await preload.count() === 1, `Critical hero image preload missing at ${width}px`);
			const heroLoaded = await page.evaluate(async () => {
				const href = document.querySelector('link[rel="preload"][as="image"]')?.getAttribute('href');
				if (!href) return false;
				const image = new Image();
				image.src = href;
				try { await image.decode(); return image.naturalWidth > 0 && image.naturalHeight > 0; }
				catch { return false; }
			});
			assert(heroLoaded, `Critical hero image did not decode at ${width}px`);
		}

    const skipLink = page.locator('.skip-link');
    await skipLink.focus();
    assert(await page.evaluate(() => document.activeElement?.classList.contains('skip-link')),
      `Skip link cannot receive focus ${route} at ${width}px`);

    const menu = page.locator('[data-menu-toggle]');
    if (width <= 1100) {
      await menu.click();
      assert(await menu.getAttribute('aria-expanded') === 'true',
        `Mobile menu did not open ${route} at ${width}px`);
      assert(await page.locator('#primary-navigation.is-open').isVisible(),
        `Mobile navigation is not visible ${route} at ${width}px`);
      await page.keyboard.press('Escape');
      assert(await menu.getAttribute('aria-expanded') === 'false',
        `Escape did not close mobile menu ${route} at ${width}px`);
      assert(await page.evaluate(() => document.activeElement?.matches('[data-menu-toggle]')),
        `Escape did not return focus to menu toggle ${route} at ${width}px`);
    } else {
      const submenuToggle = page.locator('[data-submenu-toggle]').first();
      await submenuToggle.click();
      assert(await submenuToggle.getAttribute('aria-expanded') === 'true',
        `Desktop submenu did not open ${route} at ${width}px`);
      await page.keyboard.press('Escape');
      assert(await submenuToggle.getAttribute('aria-expanded') === 'false',
        `Escape did not close desktop submenu ${route} at ${width}px`);
      assert(await page.evaluate(() => document.activeElement?.matches('[data-submenu-toggle]')),
        `Escape did not return focus to submenu toggle ${route} at ${width}px`);
    }

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
        const rendered = await img.evaluate(el => {
          const r = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return r.width >= 100 && r.height >= 100 &&
            style.contentVisibility === 'visible' && style.visibility !== 'hidden' &&
            Number(style.opacity) > 0;
        });
        assert(rendered, `Medições: imagem de modalidade não está visível em ${width}px`);
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
      await section.screenshot({ path: path.join(output, `instagram-${scenario.name}-${width}.png`), animations: 'disabled' });
      const before = await rail.evaluate(el => el.scrollLeft);
      await section.locator('[data-ig-scroll="next"]').click();
      await waitForRailScroll(page, before);
      const after = await rail.evaluate(el => el.scrollLeft);
      assert(after > before, `Next button does not move the feed at ${width}px (before=${before}, after=${after})`);
      const afterPrevious = await section.locator('[data-ig-scroll="previous"]').isDisabled();
      assert(!afterPrevious, `Previous control did not enable at ${width}px`);
      const trackerPresent = await page.evaluate(() => Boolean(window.gtag));
      assert(!trackerPresent, `Analytics loaded before cookie consent at ${width}px`);
    } else if (width === 390 || width === 1440 || width === 1536) {
      const name = route.replace(/\W+/g, '-').replace(/^-|-$/g, '');
      await page.screenshot({ path: path.join(output, `${scenario.name}-${name}-${width}.png`), fullPage: true, animations: 'disabled' });
    }
    await page.close();
		}
	}
	await context.close();
}
await browser.close();
if (failures.length) {
  for (const f of failures) console.error('[browser][FAIL]', f);
  console.error(`Browser smoke FAILED: ${failures.length} issue(s) / ${assertions} assertions.`);
  process.exitCode = 1;
} else console.log(`Browser smoke PASS: ${assertions} assertions, ${scenarios.map(({ name, routes: scenarioRoutes, widths: scenarioWidths }) => `${name}=${scenarioRoutes.length} routes x ${scenarioWidths.length} viewports`).join(', ')}. Screenshots at ${output}`);
