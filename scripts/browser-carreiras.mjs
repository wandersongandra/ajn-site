import { chromium } from 'playwright';

const base = process.env.BASE_URL || 'http://localhost:4321';
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
});
const failures = [];
let assertions = 0;

function assert(ok, description) {
  assertions += 1;
  if (!ok) {
    failures.push(description);
    console.error('[FAIL]', description);
  }
}

async function installAdminSessionFixture(context, role = 'super_admin') {
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
      body = { user: { id: 'usr-browser', name: 'RH Browser', role } };
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
      body = { stages: [
        { id: 'stage-triagem', name: 'Triagem & Inscrição', candidates: [{ id: 'application-fixture', fullName: 'Candidato Fictício', currentTitle: 'TST', city: 'BH', state: 'MG' }] },
        { id: 'stage-requisitos', name: 'Análise de Requisitos', candidates: [] },
      ] };
    } else if (requestUrl.pathname.endsWith('/candidates')) {
      body = { candidates: [{ id: 'candidate-fixture', fullName: 'Candidato Fictício', email: 'qa@example.invalid', phone: '31999999999', city: 'BH', state: 'MG', currentTitle: 'TST' }] };
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

async function dismissPrivacyNotice(page) {
  const privacyNotice = page.locator('#ajn-privacy-notice');
  if (await privacyNotice.isVisible()) {
    await privacyNotice.locator('[data-privacy-reject]').click();
    await privacyNotice.waitFor({ state: 'hidden' });
  }
}

async function exerciseRestoredAdmin(page) {
  await page.waitForSelector('[data-admin-dashboard]:visible');
  assert(await page.locator('[data-admin-login-card]').isHidden(), 'Login oculto após restauração da sessão administrativa');

  await dismissPrivacyNotice(page);

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
  { name: 'tablet', width: 768, height: 1024 },
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

    if (route === '/carreiras/') {
      await page.route('**/api/jobs', request => request.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ jobs: [
          { slug: 'qa-engenharia', status: 'published', title: 'Engenheiro de Segurança', department: 'Engenharia', employmentType: 'CLT', location: 'Belo Horizonte - MG', description: 'Avaliações técnicas de segurança.' },
          { slug: 'qa-administrativo', status: 'published', title: 'Assistente Administrativo', department: 'Administrativo', employmentType: 'PJ', location: 'Belo Horizonte - MG', description: 'Apoio às operações da empresa.' },
        ] }),
      }));
    }
    if (route === '/carreiras/vaga/') {
      await page.route('**/api/jobs/vaga-qa', request => request.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ job: {
          slug: 'vaga-qa', status: 'published', title: 'Vaga de validação', department: 'Engenharia', employmentType: 'CLT', experienceLevel: 'Pleno', location: 'Belo Horizonte - MG', description: 'Vaga usada no teste de candidatura.', requirements: ['Experiência na função'],
        } }),
      }));
    }

    const targetUrl = new URL(route === '/carreiras/vaga/' ? '/carreiras/vaga/?slug=vaga-qa' : route, base).href;
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

    const privacyDialog = page.locator('#ajn-privacy-notice');
    if (await privacyDialog.isVisible()) {
      await privacyDialog.locator('[data-privacy-reject]').click();
      await privacyDialog.waitFor({ state: 'hidden' });
    }

    if (route === '/admin/carreiras/') {
      await exerciseRestoredAdmin(page);
      await exerciseAdminJobCrud(page);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await exerciseRestoredAdmin(page);
      assert(await page.locator('[data-jobs-tbody] tr').count() === 1, 'Listagem de vagas disponível após F5');
    }

    if (route === '/carreiras/') {
      await page.waitForFunction(() => document.querySelectorAll('[data-job-card]').length === 2);
      const areaFilter = page.locator('[data-carreiras-filters] [name="department"]');
      assert((await areaFilter.locator('option').allTextContents()).includes('Administrativo'), `Filtro de áreas atualizado pela API (${vp.name})`);
      await areaFilter.selectOption('engenharia');
      assert(await page.locator('[data-job-card]:visible').count() === 1, `Filtro por área mostra uma vaga (${vp.name})`);
      await page.locator('[data-carreiras-filters] [name="q"]').fill('termo-que-nao-existe');
      assert(await page.locator('[data-job-card]:visible').count() === 0, `Busca sem resultados oculta os cartões (${vp.name})`);
      assert(await page.locator('[data-no-filter-results]').isVisible(), `Busca sem resultados exibe explicação (${vp.name})`);
      await page.locator('[data-carreiras-filters] [name="q"]').fill('');
      assert(await page.locator('[data-no-filter-results]').isHidden(), `Explicação some ao limpar a busca (${vp.name})`);
    }

    if (route === '/carreiras/vaga/') {
      await page.waitForSelector('[data-job-application-fields]:not([disabled])');
      assert((await page.locator('[data-application-form]').getAttribute('action')) === '/api/applications/jobs/vaga-qa/apply', `Formulário habilitado apenas para a vaga confirmada (${vp.name})`);
    }

    if (route === '/carreiras/talentos/' || route === '/carreiras/vaga/') {
      // Regressão: o aviso fica fora do <form> no layout Astro original.
      const application = page.locator('[data-application-form]');
      const oversized = Buffer.alloc(5 * 1024 * 1024 + 1, 65);
      await application.locator('input[type="file"]').setInputFiles({
        name: 'qa-over-limit.pdf',
        mimeType: 'application/pdf',
        buffer: oversized,
      });
      const notice = page.locator('.carreiras-notice[data-notice]').first();
      assert(await notice.isVisible(), `Aviso de currículo grande visível em ${route} (${vp.name})`);
      assert((await notice.textContent()).includes('excede o limite'), `Erro de upload legível em ${route} (${vp.name})`);
    }

    if (route === '/carreiras/acompanhamento/') {
      const recoveryForm = page.locator('[data-recovery-form]');
      assert(await recoveryForm.count() === 1, `Recuperação de protocolo disponível em ${vp.name}`);
      await page.route('**/api/applications/track/**', route => route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Protocolo QA inexistente.' }),
      }));
      await page.locator('[data-tracking-form] [name="code"]').fill('AJN-2026-ABCDEF');
      await page.locator('[data-tracking-form] button[type="submit"]').press('Enter');
      await page.waitForFunction(() => [...document.querySelectorAll('.carreiras-notice[data-notice]')].some(el => el.textContent.includes('Protocolo QA inexistente.')));
      assert(await page.locator('.carreiras-notice[data-notice]').first().isVisible(), `Erro de acompanhamento visível em ${vp.name}`);

      await page.route('**/api/applications/recover-tracking', route => route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Código de teste enviado.' }),
      }));
      await recoveryForm.locator('[name="email"]').fill('qa@example.invalid');
      await recoveryForm.locator('[name="cpf"]').fill('11144477735');
      await recoveryForm.locator('button[type="submit"]').press('Enter');
      await page.waitForFunction(() => document.querySelector('[data-recovery-form] [data-notice]')?.textContent.includes('Código de teste enviado.'));
      assert(await recoveryForm.locator('[data-notice]').isVisible(), `Mensagem de recuperação visível em ${vp.name}`);
      assert(await recoveryForm.locator('[data-code-group]').isVisible(), `Campo de confirmação por e-mail liberado em ${vp.name}`);

      await page.route('**/api/applications/verify-recovery', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ applications: [{ trackingCode: 'AJN-2026-QA0001', jobTitle: 'Vaga de validação', department: 'Engenharia', status: 'Em análise', appliedAt: '2026-11-10T13:00:00Z' }] }),
      }));
      await recoveryForm.locator('[name="recoveryCode"]').fill('123456');
      await recoveryForm.locator('button[type="submit"]').click();
      await page.waitForFunction(() => document.querySelector('[data-track-code]')?.textContent === 'AJN-2026-QA0001');
      assert(await page.locator('[data-tracking-result]').isVisible(), `Código recebido por e-mail recupera candidatura (${vp.name})`);

      await page.route('**/api/lgpd/deletion-request', route => route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Solicitação de teste recusada.' }),
      }));
      const lgpdForm = page.locator('[data-lgpd-form]');
      await lgpdForm.locator('[name="email"]').fill('qa@example.invalid');
      await lgpdForm.locator('[name="cpf"]').fill('11144477735');
      await lgpdForm.locator('button[type="submit"]').press('Enter');
      await page.waitForFunction(() => document.querySelector('[data-lgpd-form] [data-notice]')?.textContent.includes('Solicitação de teste recusada.'));
      assert(await lgpdForm.locator('[data-notice]').isVisible(), `Mensagem LGPD visível em ${vp.name}`);
    }

    if (route === '/carreiras/vaga/') {
      await page.route('**/api/jobs/vaga-indisponivel', request => request.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Serviço temporariamente indisponível' }),
      }));
      await page.goto(new URL('/carreiras/vaga/?slug=vaga-indisponivel', base).href, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#job-closed-box:visible');
      assert(await page.locator('[data-job-application-fields]').isDisabled(), `Candidatura bloqueada quando API falha (${vp.name})`);
      assert((await page.locator('[data-job-unavailable-title]').textContent()).includes('Não foi possível consultar'), `Falha de API não é confundida com vaga encerrada (${vp.name})`);
    }

    await page.close();
  }

  await context.close();
}

// As permissões reais continuam sendo checadas pelo servidor; este bloco impede
// que a interface ofereça ações sem acesso e testa o formulário de movimentação.
for (const role of ['recruiter', 'viewer', 'dpo']) {
  const context = await browser.newContext();
  await installAdminSessionFixture(context, role);
  const page = await context.newPage();
  await page.goto(new URL('/admin/carreiras/', base).href);
  await page.locator('[data-admin-dashboard]').waitFor({ state: 'visible' });
  await dismissPrivacyNotice(page);
  const allowed = {
    recruiter: ['pipeline', 'candidates', 'jobs', 'audit'],
    viewer: ['pipeline', 'candidates', 'jobs'],
    dpo: ['candidates', 'lgpd', 'audit'],
  }[role];
  for (const tab of ['pipeline', 'candidates', 'jobs', 'lgpd', 'audit', 'users']) {
    const visible = await page.locator(`[data-admin-tab="${tab}"]`).isVisible();
    assert(visible === allowed.includes(tab), `Aba ${tab} respeita o perfil ${role}`);
  }
  if (role !== 'dpo') {
    await page.locator('[data-pipeline-board] .pipeline-candidate-card').waitFor({ state: 'visible' });
    assert((await page.locator('[data-pipeline-board] button').count() === 1) === (role === 'recruiter'), `Mover etapa restrito para ${role}`);
    await page.locator('[data-admin-tab="jobs"]').click();
    await page.locator('[data-jobs-tbody] tr').first().waitFor({ state: 'visible' });
    assert((await page.locator('[data-jobs-tbody] button').count() === 1) === (role === 'recruiter'), `Editar vaga restrito para ${role}`);
    assert((await page.locator('[data-toggle-job-form]').isVisible()) === (role === 'recruiter'), `Criar vaga restrito para ${role}`);
  }
  await page.locator('[data-admin-tab="candidates"]').click();
  await page.locator('[data-candidates-tbody] tr').first().waitFor({ state: 'visible' });
  assert((await page.locator('[data-candidates-tbody] button').count() === 1) === (role === 'recruiter'), `Download de currículo restrito para ${role}`);
  if (role === 'dpo') {
    await page.locator('[data-admin-tab="lgpd"]').click();
    await page.locator('[data-lgpd-tbody] tr').first().waitFor({ state: 'visible' });
    assert((await page.locator('[data-lgpd-tbody] td').first().textContent()).includes('Nenhuma solicitação'), 'LGPD exibe estado vazio claro');
  }
  await context.close();
}

{
  const context = await browser.newContext();
  await installAdminSessionFixture(context);
  const page = await context.newPage();
  let moveCount = 0;
  let currentStage = 'stage-triagem';
  let nativeDialogCount = 0;
  page.on('dialog', () => { nativeDialogCount += 1; });
  await page.route('**/api/admin/pipeline/**', async (route) => {
    if (route.request().method() === 'POST') {
      const data = route.request().postDataJSON();
      assert(data.applicationId === 'application-fixture', 'Movimentação preserva ID da candidatura');
      assert(data.targetStageId === 'stage-requisitos', 'Movimentação envia etapa selecionada');
      assert(data.rating === 4 && data.notes === 'Validação humana fictícia', 'Movimentação envia nota e observações humanas');
      moveCount += 1;
      currentStage = data.targetStageId;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    }
    const candidate = { id: 'application-fixture', fullName: 'Candidato Fictício', currentTitle: 'TST', city: 'BH', state: 'MG' };
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ stages: [
      { id: 'stage-triagem', name: 'Triagem & Inscrição', candidates: currentStage === 'stage-triagem' ? [candidate] : [] },
      { id: 'stage-requisitos', name: 'Análise de Requisitos', candidates: currentStage === 'stage-requisitos' ? [candidate] : [] },
    ] }) });
  });
  await page.route('**/api/admin/candidates/candidate-fixture/resume', route => route.fulfill({
    status: 200,
    contentType: 'application/pdf',
    headers: { 'content-disposition': 'attachment; filename="curriculo.pdf"' },
    body: '%PDF-1.4\n1 0 obj <<>> endobj\ntrailer <<>>\n%%EOF',
  }));
  await page.goto(new URL('/admin/carreiras/', base).href);
  await page.locator('[data-admin-dashboard]').waitFor({ state: 'visible' });
  await dismissPrivacyNotice(page);
  await page.locator('[data-pipeline-board] button').first().waitFor({ state: 'visible' });
  await page.locator('[data-pipeline-board] button').first().click();
  const modal = page.locator('[data-move-stage-dialog]');
  assert(await modal.isVisible(), 'Movimentação abre diálogo acessível');
  await modal.locator('[name="targetStageId"]').selectOption('stage-requisitos');
  await modal.locator('[name="notes"]').fill('Validação humana fictícia');
  await modal.locator('[name="rating"]').selectOption('4');
  await modal.locator('[data-submit-move-stage]').click();
  await modal.waitFor({ state: 'hidden' });
  await page.waitForFunction(() => document.querySelector('[data-pipeline-board]')?.textContent.includes('Candidato Fictício'));
  assert(moveCount === 1, 'Movimentação envia somente uma solicitação');
  assert(nativeDialogCount === 0, 'Movimentação não usa prompts ou alertas nativos');

  await page.locator('[data-admin-tab="candidates"]').click();
  await page.locator('[data-candidates-tbody] button').waitFor({ state: 'visible' });
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }),
    page.locator('[data-candidates-tbody] button').click(),
  ]);
  assert(download.suggestedFilename() === 'curriculo.pdf', 'Download privado gera arquivo com nome correto');
  await context.close();
}

await browser.close();

if (failures.length > 0) {
  console.error(`\nTestes E2E de Carreiras FALHARAM com ${failures.length} erro(s) em ${assertions} asserções.`);
  process.exit(1);
} else {
  console.log(`\nTestes E2E de Carreiras PASSARAM com sucesso! ${assertions} asserções verificadas em mobile, tablet e desktop.`);
}
