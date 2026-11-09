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

async function installAdminSessionFixture(context) {
  const hostname = new URL(base).hostname;
  await context.addCookies([{
    name: 'ajn_admin_session',
    value: 'browser-fixture-session',
    domain: hostname,
    path: '/',
    httpOnly: true,
    secure: new URL(base).protocol === 'https:',
    sameSite: 'Strict',
  }]);

  await context.route('**/api/**', async (route) => {
    const requestUrl = new URL(route.request().url());
    let body = {};

    if (requestUrl.pathname.endsWith('/auth/me')) {
      body = { user: { id: 'usr-browser', name: 'RH Browser', role: 'super_admin', permissions: ['admin:manage'] } };
    } else if (requestUrl.pathname.endsWith('/jobs') && route.request().method() === 'GET') {
      body = {
        jobs: [{
          id: 'job-eng-seguranca',
          title: 'Engenheiro(a) de Segurança do Trabalho',
          department: 'Engenharia de Segurança',
          location: 'Belo Horizonte - MG',
          employmentType: 'CLT',
          experienceLevel: 'Sênior',
          description: 'Descrição da vaga de teste para validação do painel administrativo.',
          requirements: JSON.stringify(['Experiência técnica']),
          status: 'published',
          applicationsCount: 0,
        }],
      };
    } else if (requestUrl.pathname.includes('/pipeline/')) {
      body = { stages: [{ id: 'new', name: 'Novos', candidates: [] }] };
    } else if (requestUrl.pathname.endsWith('/candidates')) {
      body = { candidates: [] };
    } else if (requestUrl.pathname.endsWith('/lgpd/requests')) {
      body = { requests: [] };
    } else if (requestUrl.pathname.endsWith('/audit')) {
      body = { logs: [] };
    } else if (requestUrl.pathname.endsWith('/users')) {
      body = { users: [{ id: 'usr-browser', name: 'RH Browser', email: 'rh@example.test', role: 'super_admin', mfaEnabled: true, isActive: true }] };
    } else {
      body = { success: true };
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

async function exerciseRestoredAdmin(page) {
  await page.waitForSelector('[data-admin-dashboard]:visible');
  assert(await page.locator('[data-admin-login-card]').isHidden(), 'Login oculto após restauração da sessão administrativa');

  const privacyNotice = page.locator('#ajn-privacy-notice');
  if (await privacyNotice.isVisible()) {
    await privacyNotice.locator('[data-privacy-reject]').click();
    await privacyNotice.waitFor({ state: 'hidden' });
  }

  const tabs = ['candidates', 'jobs', 'lgpd', 'audit', 'users'];
  for (const tab of tabs) {
    await page.locator(`[data-admin-tab="${tab}"]`).click();
    await page.locator(`[data-admin-pane="${tab}"]`).waitFor({ state: 'visible' });
    assert(await page.locator(`[data-admin-pane="${tab}"]`).isVisible(), `Aba ${tab} funciona após restauração`);
  }
}

async function exerciseAdminJobCrud(page) {
  await page.locator('[data-admin-tab="jobs"]').click();
  await page.locator('[data-admin-pane="jobs"]').waitFor({ state: 'visible' });
  await page.locator('[data-toggle-job-form]').click();
  const form = page.locator('[data-job-form]');
  await form.locator('[name="title"]').fill('Vaga de teste do painel');
  await form.locator('[name="slug"]').fill('vaga-teste-painel');
  await form.locator('[name="department"]').fill('Engenharia');
  await form.locator('[name="location"]').fill('Belo Horizonte - MG');
  await form.locator('[name="description"]').fill('Descrição de teste suficientemente detalhada para a validação do painel.');
  await form.locator('[name="requirements"]').fill('Experiência técnica\nDisponibilidade para viagens');
  await form.locator('[name="status"]').selectOption('draft');
  await form.locator('[name="openingsCount"]').fill('1');
  await form.locator('[data-job-form-submit]').click();
  await page.waitForFunction(() => document.querySelector('[data-jobs-notice]')?.textContent.includes('Vaga criada'));
  const createNotice = await page.locator('[data-jobs-notice]').textContent();
  assert(createNotice.includes('Vaga criada'), `Criação de vaga disponível após restauração: ${createNotice}`);

  await page.waitForFunction(() => document.querySelectorAll('[data-jobs-tbody] button').length > 0);
  const editButton = page.locator('[data-jobs-tbody] button', { hasText: 'Editar' }).first();
  await editButton.click();
  assert((await page.locator('[data-job-form-title]').textContent()).includes('Editar'), 'Edição de vaga disponível após restauração');
  await form.locator('[name="description"]').fill('Descrição de edição suficientemente detalhada para a validação do painel.');
  await form.locator('[data-job-form-submit]').click();
  await page.waitForFunction(() => document.querySelector('[data-jobs-notice]')?.textContent.includes('Vaga atualizada'));
  const updateNotice = await page.locator('[data-jobs-notice]').textContent();
  assert(updateNotice.includes('Vaga atualizada'), `Atualização de vaga disponível após restauração: ${updateNotice}`);
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
    if (route === '/admin/carreiras/') await installAdminSessionFixture(context);
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

    if (route === '/admin/carreiras/') {
      await exerciseRestoredAdmin(page);
      await exerciseAdminJobCrud(page);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await exerciseRestoredAdmin(page);
      assert(await page.locator('[data-jobs-tbody] tr').count() === 1, 'Listagem de vagas disponível após F5');
    }

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
