import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const script = readFileSync(new URL('../public/scripts/carreiras.js', import.meta.url), 'utf8');
const applicationPage = readFileSync(new URL('../src/pages/carreiras/vaga.astro', import.meta.url), 'utf8');

test('consentimento opcional para banco de talentos não vem pré-selecionado', () => {
  const input = applicationPage.match(/<input\b[^>]*\bid="apply-consent-retention"[^>]*>/);
  assert.ok(input, 'checkbox de retenção encontrado');
  assert.match(input[0], /\bname="consentRetention"/);
  assert.doesNotMatch(input[0], /\bchecked\b/);
  assert.doesNotMatch(input[0], /\brequired\b/);
});

function createContext(document, fetchImpl = async () => ({ ok: false, status: 503 })) {
  const window = {
    location: { origin: 'https://ajn.example', pathname: '/carreiras/vaga/', search: '' },
  };
  const context = vm.createContext({ document, window, URL, URLSearchParams, fetch: fetchImpl, console });
  vm.runInContext(script, context);
  return context;
}

function createSelect(label) {
  return {
    options: [{ value: '', textContent: label }],
    value: '',
    replaceChildren(...options) { this.options = [...options]; },
    appendChild(option) { this.options.push(option); },
  };
}

test('filtros apresentam as áreas e regimes recebidos da API', () => {
  const department = createSelect('Todas as áreas');
  const type = createSelect('Todos os regimes');
  department.value = 'engenharia';
  const form = {
    querySelector(selector) { return selector.includes('department') ? department : type; },
  };
  const document = {
    addEventListener() {},
    createElement(tag) { assert.equal(tag, 'option'); return {}; },
  };
  const context = createContext(document);
  context.populateJobFilterOptions(form, [
    { department: 'Engenharia', employmentType: 'CLT' },
    { department: 'Administrativo', employmentType: 'PJ' },
    { department: 'Engenharia', employmentType: 'CLT' },
  ]);

  assert.deepEqual(department.options.map(option => option.textContent), ['Todas as áreas', 'Administrativo', 'Engenharia']);
  assert.deepEqual(type.options.map(option => option.value), ['', 'clt', 'pj']);
  assert.equal(department.value, 'engenharia');
});

function createJobPage(fetchImpl, slug) {
  const fields = { disabled: false };
  const loading = { hidden: false };
  const title = { textContent: '' };
  const message = { textContent: '' };
  const closed = {
    style: { display: 'none' },
    querySelector(selector) { return selector.includes('title') ? title : message; },
  };
  const details = { style: { display: 'block' } };
  const form = {
    action: '/api/applications/talent-pool',
    getAttribute() { return this.action; },
    setAttribute(name, value) { if (name === 'action') this.action = value; },
  };
  const dynamic = {
    querySelector(selector) {
      if (selector === '[data-job-application-fields]') return fields;
      if (selector === '[data-job-loading]') return loading;
      return null;
    },
  };
  const document = {
    title: 'Vaga',
    addEventListener() {},
    querySelector(selector) {
      if (selector === '[data-dynamic-job-page]') return dynamic;
      if (selector === '[data-application-form]') return form;
      return null;
    },
    getElementById(id) {
      if (id === 'job-closed-box') return closed;
      if (id === 'job-details-container') return details;
      return null;
    },
  };
  const context = createContext(document, fetchImpl);
  context.window.location.search = `?slug=${slug}`;
  return { context, fields, loading, title, message, closed, details, form };
}

test('não habilita candidatura quando a API não responde', async () => {
  const page = createJobPage(async () => ({ ok: false, status: 503 }), 'vaga-indisponivel');
  await page.context.checkCurrentJobStatus();
  assert.equal(page.fields.disabled, true);
  assert.equal(page.closed.style.display, 'block');
  assert.equal(page.details.style.display, 'none');
  assert.match(page.title.textContent, /Não foi possível consultar/);
  assert.equal(page.form.action, '/api/applications/talent-pool');
});

test('só vincula candidatura à vaga publicada e confirmada', async () => {
  const page = createJobPage(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ job: { slug: 'vaga-publicada', status: 'published', title: 'Analista técnico' } }),
  }), 'vaga-publicada');
  await page.context.checkCurrentJobStatus();
  assert.equal(page.fields.disabled, false);
  assert.equal(page.details.style.display, 'block');
  assert.equal(page.form.action, '/api/applications/jobs/vaga-publicada/apply');
  assert.equal(page.loading.hidden, true);
});

test('não habilita candidatura se a resposta indicar vaga encerrada', async () => {
  const page = createJobPage(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ job: { slug: 'vaga-encerrada', status: 'closed', title: 'Vaga encerrada' } }),
  }), 'vaga-encerrada');
  await page.context.checkCurrentJobStatus();
  assert.equal(page.fields.disabled, true);
  assert.equal(page.closed.style.display, 'block');
});
