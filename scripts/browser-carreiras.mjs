import { readFileSync } from 'node:fs';
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
  // O prefixo __Host- exige HTTPS e ausencia de Domain; no preview HTTP local
  // o Chromium recusa cookies Secure/__Host-, entao espelhamos a forma HTTPS
  // apenas quando BASE_URL usar https:// (chamadas /api/** sao interceptadas).
  const parsedBase = new URL(base);
  const isHttps = parsedBase.protocol === 'https:';
  await context.addCookies([{
    name: isHttps ? '__Host-ajn_admin_session' : 'ajn_admin_session',
    value: 'browser-fixture-session',
    url: parsedBase.origin,
    httpOnly: true,
    secure: isHttps,
    sameSite: 'Strict',
  }]);

  await context.route('**/api/**', async (route) => {
    const requestUrl = new URL(route.request().url());
    let body = {};

    if (requestUrl.pathname.endsWith('/auth/me')) {
      body = { user: { id: 'usr-browser', name: 'RH Browser', role }, csrfToken: 'csrf-browser-fixture' };
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

    await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', async (reqRoute) => {
      await reqRoute.fulfill({
        status: 200,
        contentType: 'application/javascript; charset=utf-8',
        body: 'window.turnstile = { getResponse: () => "XXXX.DUMMY.TOKEN.XXXX", reset: () => {} }; document.querySelectorAll(".cf-turnstile").forEach((el) => { if (!el.querySelector("[name=cf-turnstile-response]")) { const inp = document.createElement("input"); inp.type = "hidden"; inp.name = "cf-turnstile-response"; inp.value = "XXXX.DUMMY.TOKEN.XXXX"; el.appendChild(inp); } });',
      });
    });

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
      assert(await page.locator('[data-tracking-form] input[name="website"]').count() === 1, `Honeypot presente no formulário de acompanhamento em ${vp.name}`);
      assert(await recoveryForm.locator('input[name="website"]').count() === 1, `Honeypot anti-bot presente na recuperação em ${vp.name}`);
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
      const blockedFields = await page.locator('[data-job-application-fields]').evaluate((fieldset) => ({
        disabled: fieldset.disabled,
        hasDisabledAttribute: fieldset.hasAttribute('disabled'),
        childrenDisabled: [...fieldset.querySelectorAll('input, select, textarea, button')]
          .every((control) => control.matches(':disabled')),
      }));
      assert(blockedFields.disabled && blockedFields.hasDisabledAttribute && blockedFields.childrenDisabled,
        `Candidatura bloqueada quando API falha (${vp.name}): ${JSON.stringify(blockedFields)}`);
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
    recruiter: ['pipeline', 'candidates', 'jobs'],
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
      assert(route.request().headers()['x-csrf-token'] === 'csrf-browser-fixture', 'Movimentação envia cabeçalho X-CSRF-Token da sessão');
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
  let lgpdStatus = 'pending';
  await page.route('**/api/admin/lgpd/requests**', route => {
    if (route.request().method() === 'POST' && route.request().url().endsWith('/execute')) {
      lgpdStatus = 'completed';
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'Solicitação de exclusão concluída.' }) });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        requests: [{
          id: 'lgpd-req-1',
          requestType: 'erasure',
          status: lgpdStatus,
          candidateName: 'Candidato Teste',
          candidateEmail: 'cand@example.invalid',
          requestedAt: '2026-11-13T10:00:00Z',
          completedAt: lgpdStatus === 'completed' ? '2026-11-13T10:05:00Z' : null,
        }],
      }),
    });
  });
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

  await page.locator('[data-admin-tab="lgpd"]').click();
  await page.locator('[data-lgpd-tbody] .carreiras-badge').waitFor({ state: 'visible' });
  const badgeText = await page.locator('[data-lgpd-tbody] .carreiras-badge').first().textContent();
  assert(badgeText === 'Exclusão Definitiva', `Tipo erasure mapeado na tabela LGPD: ${badgeText}`);
  await page.locator('[data-lgpd-tbody] button').first().click();
  const confirmModal = page.locator('[data-confirm-dialog]');
  assert(await confirmModal.isVisible(), 'Confirmação LGPD abre diálogo acessível');
  await confirmModal.locator('[data-confirm-accept]').click();
  await confirmModal.waitFor({ state: 'hidden' });
  await page.waitForFunction(() => document.querySelector('[data-lgpd-notice]')?.textContent.includes('Solicitação de exclusão concluída'));
  assert(nativeDialogCount === 0, 'Fluxo administrativo não usa prompts ou alertas nativos');
  await context.close();
}

// Item 2.d Turnstile E2E: formulario renderiza o widget e envia o token (=201); sem token responde 400
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  let turnstileWidgetActive = true;

  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', async (route) => {
    const tokenJs = turnstileWidgetActive
      ? 'window.turnstile = { getResponse: () => "XXXX.DUMMY.TOKEN.XXXX", reset: () => {} }; document.querySelectorAll(".cf-turnstile").forEach((el) => { const inp = document.createElement("input"); inp.type = "hidden"; inp.name = "cf-turnstile-response"; inp.value = "XXXX.DUMMY.TOKEN.XXXX"; el.appendChild(inp); });'
      : 'window.turnstile = { getResponse: () => "", reset: () => {} };';
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript; charset=utf-8',
      body: tokenJs,
    });
  });

  const capturedTokens = [];
  await page.route('**/api/applications/talent-pool', async (route) => {
    const postBody = (route.request().postDataBuffer() ?? Buffer.from(route.request().postData() || '')).toString('utf8');
    const tokenMatch = postBody.match(/name="turnstileToken"(?:;[^\r\n]*)?\r?\n\r?\n([^\r\n]*)/);
    const token = (tokenMatch?.[1] ?? '').trim();
    capturedTokens.push(token);
    if (!token) {
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Conclua a verificação antispam antes de enviar.' }),
      });
    }
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Candidatura registrada no banco de talentos!',
        trackingCode: 'AJN-2026-E2ETEST',
      }),
    });
  });

  // Caso 1: widget Turnstile renderizado com data-sitekey e envia token no POST
  await page.goto(new URL('/carreiras/talentos/', base).href, { waitUntil: 'networkidle' });
  await dismissPrivacyNotice(page);
  const widgetSiteKey = await page.locator('[data-application-form] .cf-turnstile').getAttribute('data-sitekey');
  assert(Boolean(widgetSiteKey && widgetSiteKey.length >= 10), `Widget Turnstile renderizado em /carreiras/talentos/ (sitekey=${widgetSiteKey})`);

  const talentForm = page.locator('[data-application-form]');
  await talentForm.locator('[name="fullName"]').fill('Candidata E2E Turnstile');
  await talentForm.locator('[name="email"]').fill('e2e.turnstile@example.invalid');
  await talentForm.locator('[name="phone"]').fill('(31) 99999-8888');
  await talentForm.locator('[name="cpf"]').fill('52998224725');
  await talentForm.locator('[name="city"]').fill('Belo Horizonte');
  await talentForm.locator('[name="state"]').fill('MG');
  await talentForm.locator('[name="consentTerms"]').check();
  await talentForm.locator('[name="consentRetention"]').check();
  await talentForm.locator('input[type="file"]').setInputFiles({
    name: 'cv-e2e.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n%E2E\n'),
  });
  await talentForm.locator('button[type="submit"]').click();
  await page.waitForFunction(() => document.querySelector('[data-notice]')?.textContent.includes('AJN-2026-E2ETEST'));
  assert(capturedTokens[0] === 'XXXX.DUMMY.TOKEN.XXXX', `Formulário enviou turnstileToken do widget: ${capturedTokens[0]}`);

  // Caso 2: envio sem token Turnstile recebe 400 do backend e exibe erro
  turnstileWidgetActive = false;
  await page.reload({ waitUntil: 'networkidle' });
  await dismissPrivacyNotice(page);
  await talentForm.locator('[name="fullName"]').fill('Candidata Sem Token');
  await talentForm.locator('[name="email"]').fill('sem.token@example.invalid');
  await talentForm.locator('[name="phone"]').fill('(31) 99999-7777');
  await talentForm.locator('[name="cpf"]').fill('52998224725');
  await talentForm.locator('[name="city"]').fill('Belo Horizonte');
  await talentForm.locator('[name="state"]').fill('MG');
  await talentForm.locator('[name="consentTerms"]').check();
  await talentForm.locator('[name="consentRetention"]').check();
  await talentForm.locator('input[type="file"]').setInputFiles({
    name: 'cv-sem-token.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n%E2E\n'),
  });
  await talentForm.locator('button[type="submit"]').click();
  await page.waitForFunction(() => document.querySelector('[data-notice]')?.textContent.includes('verificação antispam'));
  assert(capturedTokens[1] === '', 'Submissão sem token enviou string vazia para o servidor e recebeu HTTP 400');
  await context.close();
}

// Item 2 (F.1 CSP): Zero violações de CSP no console e em securitypolicyviolation
// em home (/), /carreiras/, /carreiras/vaga/, /carreiras/acompanhamento/ e /admin/carreiras/
{
  const htaccessRaw = readFileSync(new URL('../public/.htaccess', import.meta.url), 'utf8');
  const cspMatch = htaccessRaw.match(/Header\s+always\s+set\s+Content-Security-Policy\s+"([^"]+)"/i);
  const rawCsp = cspMatch ? cspMatch[1] : '';
  assert(rawCsp.length > 0, 'Header Content-Security-Policy extraído de public/.htaccess');
  assert(!rawCsp.includes("'unsafe-inline'"), "CSP em public/.htaccess não contém 'unsafe-inline'");
  assert(!rawCsp.includes("'unsafe-eval'"), "CSP em public/.htaccess não contém 'unsafe-eval'");

  // Em servidor local HTTP (preview), remove apenas upgrade-insecure-requests para não forçar TLS em 127.0.0.1/localhost
  const effectiveCsp = base.startsWith('http://')
    ? rawCsp.replace(/;\s*upgrade-insecure-requests/gi, '')
    : rawCsp;

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await installAdminSessionFixture(context, 'super_admin');
  await context.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript; charset=utf-8',
      body: 'window.turnstile = { getResponse: () => "XXXX.DUMMY.TOKEN.XXXX", reset: () => {} };',
    });
  });
  await context.addInitScript(() => {
    window.__ajnCspViolations = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__ajnCspViolations.push(`${e.violatedDirective}:${e.blockedURI}`);
    });
  });

  const parsedOrigin = new URL(base).origin;
  await context.route(`${parsedOrigin}/**`, async (route) => {
    const reqUrl = new URL(route.request().url());
    if (reqUrl.pathname.startsWith('/api/')) {
      return route.fallback();
    }
    const response = await route.fetch();
    const headers = { ...response.headers(), 'content-security-policy': effectiveCsp };
    await route.fulfill({ response, headers });
  });

  const page = await context.newPage();
  const cspConsoleViolations = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && /Content Security Policy|CSP/i.test(msg.text())) {
      cspConsoleViolations.push(msg.text());
    }
  });

  for (const routePath of ['/', '/carreiras/', '/carreiras/vaga/', '/carreiras/acompanhamento/', '/admin/carreiras/']) {
    cspConsoleViolations.length = 0;
    await page.goto(new URL(routePath, base).href, { waitUntil: 'networkidle' });
    const domViolations = await page.evaluate(() => window.__ajnCspViolations || []);
    assert(
      cspConsoleViolations.length === 0 && domViolations.length === 0,
      `Zero violações de CSP em ${routePath} (console=${cspConsoleViolations.length}, dom=${domViolations.length})`
    );
  }
  await context.close();
}

await browser.close();

if (failures.length > 0) {
  console.error(`\nTestes E2E de Carreiras FALHARAM com ${failures.length} erro(s) em ${assertions} asserções.`);
  process.exit(1);
} else {
  console.log(`\nTestes E2E de Carreiras PASSARAM com sucesso! ${assertions} asserções verificadas em mobile, tablet e desktop.`);
}
