// AJN Phase 4: keyboard, reduced-motion and no-JavaScript acceptance checks.
import { chromium } from 'playwright';

const base = process.env.BASE_URL || 'http://127.0.0.1:4321';
const browser = await chromium.launch({ headless: true });
const failures = [];
let assertions = 0;
function check(ok, message) {
	assertions++;
	if (!ok) failures.push(message);
}

async function createContext({ width, reducedMotion = 'no-preference', noJs = false } = {}) {
	return browser.newContext({
		viewport: { width, height: 850 },
		reducedMotion,
		locale: 'pt-BR',
		javaScriptEnabled: !noJs,
		storageState: {
			cookies: [],
			origins: [{
				origin: new URL(base).origin,
				localStorage: [{
					name: 'ajn-cookie-preferences-v2',
					value: JSON.stringify({ version: 2, ga4Id: 'G-N6L406K645', analytics: false, at: Date.now() }),
				}],
			}],
		},
	});
}

async function load(context, route, label) {
	const page = await context.newPage();
	const errors = [];
	page.on('pageerror', (error) => errors.push(error.message));
	const response = await page.goto(new URL(route, base).href, {
		waitUntil: 'domcontentloaded', timeout: 45000,
	});
	check(response?.ok(), `${label} ${route}: HTTP OK`);
	await page.locator('main').waitFor({ timeout: 10000 });
	check(errors.length === 0, `${label} ${route}: sem exceções JavaScript (${errors.join('; ')})`);
	return page;
}

try {
	const noJsContext = await createContext({ width: 390, noJs: true });
	for (const route of ['/', '/servicos/', '/blog/', '/contato/']) {
		const page = await load(noJsContext, route, 'no-js-mobile');
		const data = await page.evaluate(() => ({
			navigationVisible: getComputedStyle(document.querySelector('#primary-navigation')).display !== 'none',
			navigationLinks: document.querySelectorAll('#primary-navigation a[href]').length,
			serviceCards: document.querySelectorAll('[data-service-card]').length,
			blogCards: document.querySelectorAll('[data-blog-card]').length,
			contactAlternatives: document.querySelectorAll('.contact-page__alternate-actions a[href]').length,
			overflow: document.documentElement.scrollWidth > innerWidth + 3,
			ariaHiddenTabStops: [...document.querySelectorAll('[aria-hidden="true"]')]
				.flatMap((node) => [...node.querySelectorAll('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])')])
				.length,
		}));
		check(data.navigationVisible, `no-js-mobile ${route}: menu principal continua navegável`);
		check(data.navigationLinks >= 15, `no-js-mobile ${route}: submenu não expõe os destinos (${data.navigationLinks})`);
		if (route === '/servicos/') check(data.serviceCards === 14, 'no-js-mobile /servicos/: cards não dependem do JS');
		if (route === '/blog/') check(data.blogCards >= 30, 'no-js-mobile /blog/: artigos não dependem do JS');
		if (route === '/contato/') check(data.contactAlternatives === 2, 'no-js-mobile /contato/: canais alternativos visíveis');
		check(!data.overflow, `no-js-mobile ${route}: sem overflow horizontal`);
		check(data.ariaHiddenTabStops === 0, `no-js-mobile ${route}: foco dentro de aria-hidden`);
		await page.close();
	}
	await noJsContext.close();

	const reducedContext = await createContext({ width: 390, reducedMotion: 'reduce' });
	const reducedHome = await load(reducedContext, '/', 'reduced-motion');
	const reducedState = await reducedHome.evaluate(() => ({
		motionEnabled: document.querySelector('.home-page')?.classList.contains('motion-enabled'),
		reveals: [...document.querySelectorAll('.home-page [data-reveal]')].map((element) => ({
			opacity: Number(getComputedStyle(element).opacity),
			visibility: getComputedStyle(element).visibility,
		})),
		overflow: document.documentElement.scrollWidth > innerWidth + 3,
	}));
	check(!reducedState.motionEnabled, 'reduced-motion: motion-enabled não deve ser adicionado');
	check(reducedState.reveals.every(({ opacity, visibility }) => opacity >= .98 && visibility !== 'hidden'),
		'reduced-motion: conteúdo revelado permanece visível');
	check(!reducedState.overflow, 'reduced-motion: sem overflow horizontal');
	await reducedHome.close();

	const mobilePage = await load(reducedContext, '/', 'keyboard-mobile');
	const menu = mobilePage.locator('[data-menu-toggle]');
	await menu.click();
	check(await mobilePage.locator('#primary-navigation').isVisible(), 'keyboard-mobile: menu abre por clique de teclado');
	const submenuToggle = mobilePage.locator('[data-submenu-toggle]').first();
	await submenuToggle.focus();
	await mobilePage.keyboard.press('Enter');
	check(await mobilePage.locator('.has-submenu.is-expanded').count() === 1,
		'keyboard-mobile: submenu abre com Enter');
	await mobilePage.keyboard.press('Escape');
	check(await mobilePage.locator('.has-submenu.is-expanded').count() === 0 && await submenuToggle.evaluate((el) => el === document.activeElement),
		'keyboard-mobile: Escape fecha submenu e devolve foco');
	await mobilePage.close();
	await reducedContext.close();

	const keyboardContext = await createContext({ width: 1440 });
	const keyboardPage = await load(keyboardContext, '/', 'keyboard-desktop');
	await keyboardPage.evaluate(() => document.body.focus());
	await keyboardPage.keyboard.press('Tab');
	check(await keyboardPage.locator('.skip-link').evaluate((el) => el === document.activeElement),
		'keyboard-desktop: primeiro Tab chega ao link de salto');
	check(await keyboardPage.locator('.skip-link').isVisible(), 'keyboard-desktop: link de salto fica visível em foco');
	await keyboardPage.keyboard.press('Enter');
	check(await keyboardPage.locator('#conteudo-principal').evaluate((el) => el === document.activeElement),
		'keyboard-desktop: Enter no salto move foco para o conteúdo');
	const focusTarget = keyboardPage.locator('#site-header .navigation-list > li > a[href]').first();
	await focusTarget.focus();
	const focusStyle = await focusTarget.evaluate((el) => {
		const style = getComputedStyle(el);
		return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
	});
	check(focusStyle.outlineStyle !== 'none' && Number.parseFloat(focusStyle.outlineWidth) >= 2,
		'keyboard-desktop: foco visível tem contorno mensurável');
	const desktopData = await keyboardPage.evaluate(() => ({
		overflow: document.documentElement.scrollWidth > innerWidth + 3,
		missingImageAlt: [...document.images].filter((image) => !image.hasAttribute('alt')).length,
		ariaHiddenTabStops: [...document.querySelectorAll('[aria-hidden="true"]')]
			.flatMap((node) => [...node.querySelectorAll('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])')])
			.length,
	}));
	check(!desktopData.overflow, 'keyboard-desktop: sem overflow horizontal');
	check(desktopData.missingImageAlt === 0, 'keyboard-desktop: todas as imagens declaram alt');
	check(desktopData.ariaHiddenTabStops === 0, 'keyboard-desktop: foco não entra em aria-hidden');
	await keyboardPage.close();
	await keyboardContext.close();
} finally {
	await browser.close();
}

if (failures.length) {
	for (const failure of failures) console.error('[accessibility][FAIL]', failure);
	console.error(`Accessibility regression FAILED: ${failures.length}/${assertions}`);
	process.exitCode = 1;
} else {
	console.log(`Accessibility regression PASS: ${assertions} assertions across no-JS, reduced-motion and keyboard scenarios.`);
}
