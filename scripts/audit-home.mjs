// Regression checks for AJN Home only, executed after Astro's static build.
import { readFile } from 'node:fs/promises';
const html = await readFile('dist/index.html', 'utf8');
const motionJs = await readFile('src/scripts/home-motion.ts', 'utf8');
const motionCss = await readFile('src/styles/home-motion.css', 'utf8');
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
const sectorCards = (homeHtml.match(/class="home-sector-card"/g) ?? []).length;
const h1Count = (html.match(/<h1\b/g) ?? []).length;
check(h1Count === 1, 'Expected one H1, found ' + h1Count);
check(serviceCards === 6, 'Expected six service cards, found ' + serviceCards);
check(clientLogos === 10, 'Expected ten client logos, found ' + clientLogos);
check(sectorCards === 4, 'Expected four sector cards, found ' + sectorCards);
check(!homeHtml.includes('class="section mission"'), 'Mission/Vision/Values unexpectedly returned');
check(!homeHtml.includes('class="about section"'), 'About AJN section unexpectedly returned');
check(!homeHtml.includes('class="section highlights"'), 'Duplicate services highlights unexpectedly returned');
check(!homeHtml.includes('solutions-carousel') && !homeHtml.includes('clients-carousel'),
	'Infinite services or client carousel unexpectedly returned');
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
check(!/addEventListener\(['"]scroll['"]/.test(motionJs),
	'Per-frame scroll listener unexpectedly introduced');


if (issues.length) {
	for (const issue of issues) console.error('[home][FAIL] ' + issue);
	process.exitCode = 1;
} else {
	console.log('[home] PASS: 6 sections, 1 H1, 6 services, 4 sectors, 10 logos, natural copy and accessible lightweight motion.');
}
