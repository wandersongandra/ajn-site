// Regression checks for AJN Home only, executed after Astro's static build.
import { readFile } from 'node:fs/promises';
const html = await readFile('dist/index.html', 'utf8');
const motionJs = await readFile('src/scripts/home-motion.ts', 'utf8');
const motionCss = await readFile('src/styles/home-motion.css', 'utf8');
const clientsCss = await readFile('src/styles/clients-carousel.css', 'utf8');
const clientsJs = await readFile('src/scripts/clients-carousel.ts', 'utf8');
const issues = [];
const check = (condition, message) => {
	if (!condition) issues.push(message);
};
const sections = [
	['hero', 'class="hero"'],
	['solutions', 'class="section solutions"'],
	['sectors', 'class="section home-sectors"'],
	['clients', 'class="section clients"'],
	['workflow', 'class="differentials section"'],
	['contact', 'class="home-contact-cta"'],
];
let previous = -1;
for (const [name, needle] of sections) {
	const location = html.indexOf(needle);
	check(location >= 0, 'Section missing: ' + name);
	if (location >= 0) {
		check(location > previous, 'Section out of expected order: ' + name);
		previous = location;
	}
}
const homeHtml = html.slice(html.indexOf('class="home-page"'));
const serviceCards = (homeHtml.match(/<article class="service-card"/g) ?? []).length;
const clientLogos = (homeHtml.match(/class="home-client-logo"/g) ?? []).length;
const duplicateLogos = (homeHtml.match(/class="home-client-logo home-client-logo--duplicate"/g) ?? []).length;
const sectorCards = (homeHtml.match(/class="home-sector-card"/g) ?? []).length;
const h1Count = (html.match(/<h1\b/g) ?? []).length;
check(h1Count === 1, 'Expected one H1, found ' + h1Count);
check(serviceCards === 6, 'Expected six service cards, found ' + serviceCards);
check(clientLogos === 10, 'Expected ten original client logos, found ' + clientLogos);
const clientFiles = ['01','02','03','04','06','07','08','09','10'];
for (const suffix of clientFiles) {
	const src = `/images/clients/cliente-${suffix}-hd.webp`;
	check(homeHtml.includes(`src="${src}"`), 'Missing HD client logo: ' + src);
	const binary = await readFile('dist' + src);
	check(binary.toString('ascii', 0, 4) === 'RIFF' &&
		binary.toString('ascii', 8, 12) === 'WEBP', 'Invalid WebP image: ' + src);
}
check(homeHtml.includes('/images/clients/cliente-05.png'), 'Hemarcon must remain in the portfolio');
check(/alt="Logotipo BRAVO/.test(homeHtml) && /alt="Logotipo Hemarcon"/.test(homeHtml),
	'The client carousel must use meaningful names for all logos');
const brandAsset = await readFile('dist/images/branding/ajn-logo-hd.webp');
check(brandAsset.toString('ascii', 0, 4) === 'RIFF' &&
	brandAsset.toString('ascii', 8, 12) === 'WEBP', 'AJN logo must be a valid WebP');
check((html.match(/\/images\/branding\/ajn-logo-hd\.webp/g) ?? []).length >= 2,
	'Header and footer must use the new AJN branding image');
check(clientsCss.includes('height: 152px') && clientsCss.includes('clamp(240px, 23vw, 320px)'),
	'Client logos should be visibly larger on desktop');
check(duplicateLogos === 10, 'Expected ten decorative carousel duplicates, found ' + duplicateLogos);
check(sectorCards === 4, 'Expected four sector cards, found ' + sectorCards);
check(!homeHtml.includes('class="section mission"'), 'Mission/Vision/Values unexpectedly returned');
check(!homeHtml.includes('class="about section"'), 'About AJN section unexpectedly returned');
check(!homeHtml.includes('class="section highlights"'), 'Duplicate services highlights unexpectedly returned');
check(!homeHtml.includes('solutions-carousel'), 'Unexpected services carousel returned');
check(homeHtml.includes('data-clients-carousel') && homeHtml.includes('data-clients-viewport'),
	'Client carousel and scrollable fallback must exist');
check(homeHtml.includes('aria-hidden="true" inert'), 'Duplicate logos must be ignored by assistive technology');
check(homeHtml.includes('data-clients-pause') && homeHtml.includes('aria-pressed="false"'),
	'The carousel needs an accessible pause control');
check(!homeHtml.includes('class="hero__controls"'), 'Decorative hero arrows unexpectedly returned');
const heroStart = html.indexOf('class="hero"');
const heroEnd = html.indexOf('</section>', heroStart);
const heroMarkup = html.slice(heroStart, heroEnd);
check(/href="\/contato">Solicitar atendimento/.test(heroMarkup), 'Hero primary CTA does not target /contato');
check(/href="\/servicos">Conhecer os serviços/.test(heroMarkup), 'Hero secondary CTA missing');
check(homeHtml.includes('id="home-contact-title"'), 'Contact CTA heading missing');
check(homeHtml.includes('href="/servicos"'), 'Complete catalog link missing');
check(/<img\b[^>]*loading="lazy"/.test(homeHtml), 'Lazy-loaded images missing');
check(!homeHtml.includes('Conheça as Nossas Soluções'), 'Unrefined heading returned');
check(!homeHtml.includes('Saiba mais sobre os treinamentos'), 'Generic service copy returned');
check((homeHtml.match(/data-reveal/g) ?? []).length >= 14, 'Entrance targets missing from homepage');
check(!homeHtml.includes('01 / 06'), 'Decorative service numbering unexpectedly returned');
check(!homeHtml.includes('home-sector-card__number'), 'Decorative sector numbering unexpectedly returned');
check(!homeHtml.includes('Soluções para a segurança e a continuidade da sua operação'),
	'Generic homepage pitch unexpectedly returned');
check(motionJs.includes('IntersectionObserver') && motionJs.includes('observer.unobserve'),
	'Motion must use one-shot intersection observation instead of scroll handlers');
check(motionJs.includes('prefers-reduced-motion') && motionJs.includes('saveData'),
	'Motion must honor reduced-motion and data-saver preferences');
check(motionJs.includes("home.classList.add('motion-ready')") &&
	motionCss.includes('.home-page.motion-ready [data-reveal]'),
	'No-JS content must remain visible; CSS must depend on script-enabled class');
check(!/addEventListener\(['"]scroll['"]/.test(motionJs + clientsJs),
	'Per-frame scroll listener unexpectedly introduced');
check(clientsJs.includes('IntersectionObserver') && clientsJs.includes('visibilitychange'),
	'Carousel must pause when out of view or when the tab is hidden');
check(clientsJs.includes('prefers-reduced-motion') && clientsJs.includes('saveData'),
	'Carousel must respect reduced motion and data-saving mode');
check(clientsCss.includes('prefers-reduced-motion: reduce') && clientsCss.includes('animation-play-state: paused'),
	'Carousel needs a CSS no-motion fallback and a controllable animation state');
check(clientsCss.includes('background: transparent') && clientsCss.includes('border: 0'),
	'Logos must no longer be inside framed cards');


if (issues.length) {
	for (const issue of issues) console.error('[home][FAIL] ' + issue);
	process.exitCode = 1;
} else {
	console.log('[home] PASS: 6 sections, 1 H1, 6 services, 4 sectors, 10 client logos, accessible carousel and lightweight motion.');
}
