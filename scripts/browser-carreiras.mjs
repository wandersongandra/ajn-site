import { chromium } from 'playwright';

const base = process.env.BASE_URL || 'http://localhost:4321';
const browser = await chromium.launch({ headless: true });
const failures = [];
let assertions = 0;

function assert(ok, description) {
  assertions += 1;
  if (!ok) {
    failures.push(description);
    console.error('[FAIL]', description);
  }
}

const routes = [
  '/carreiras/',
  '/carreiras/talentos/',
  '/carreiras/acompanhamento/',
  '/carreiras/vaga/',
  '/admin/carreiras/',
];

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
];

for (const vp of viewports) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    locale: 'pt-BR',
  });

  for (const route of routes) {
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const targetUrl = new URL(route, base).href;
    const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    assert(response?.ok(), `HTTP 200 OK para ${route} em ${vp.name} (${response?.status()})`);

    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      h1Count: document.querySelectorAll('h1').length,
      hasMain: Boolean(document.querySelector('main')),
      hasFooter: Boolean(document.querySelector('footer.site-footer')),
      hasHeader: Boolean(document.querySelector('header.site-header')),
    }));

    assert(metrics.scrollWidth <= metrics.innerWidth + 3, `Sem overflow horizontal em ${route} (${vp.name}): ${metrics.scrollWidth} <= ${metrics.innerWidth}`);
    assert(metrics.h1Count === 1, `Exatamente 1 tag H1 em ${route} (${vp.name}): encontrado ${metrics.h1Count}`);
    assert(metrics.hasMain, `Elemento main presente em ${route}`);
    assert(metrics.hasFooter, `Rodapé padrão presente em ${route}`);
    assert(metrics.hasHeader, `Cabeçalho padrão presente em ${route}`);
    assert(pageErrors.length === 0, `Zero erros JS em ${route} (${vp.name}): ${pageErrors.join(', ')}`);

    await page.close();
  }

  await context.close();
}

await browser.close();

if (failures.length > 0) {
  console.error(`\nTestes E2E de Carreiras FALHARAM com ${failures.length} erro(s) em ${assertions} asserções.`);
  process.exit(1);
} else {
  console.log(`\nTestes E2E de Carreiras PASSARAM com sucesso! ${assertions} asserções verificadas em mobile e desktop.`);
}
