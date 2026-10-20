import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const code = await readFile('public/scripts/contact-form.js', 'utf8');

function setup({ responseOk = true, responseStatus, file = null, endpoint = 'https://forms.example.test/contact', honeypotValue = '', pendingFetch = false } = {}) {
  const handlers = {};
  const calls = [];
  let resolveFetch;
  const status = {
    dataset: {},
    textContent: '',
    focused: false,
    focus() { this.focused = true; },
  };
  const submit = { disabled: false, textContent: 'Enviar mensagem' };
  const attachment = { files: file ? [file] : [], focus() { this.focused = true; } };
  const honeypot = { value: honeypotValue };
  const form = {
    dataset: { contactEndpoint: endpoint },
    checkValidity() { return true; },
    addEventListener(type, handler) { handlers[type] = handler; },
    querySelector(selector) {
      if (selector === '[data-contact-status]') return status;
      if (selector === 'button[type="submit"]') return submit;
      if (selector === 'input[type="file"]') return attachment;
      if (selector === 'input[name="website"]') return honeypot;
      return null;
    },
    setAttribute(name, value) { this[name] = value; },
    removeAttribute(name) { delete this[name]; },
    reset() { this.wasReset = true; },
  };
  const document = {
    querySelectorAll() { return [form]; },
  };
  const window = { dispatchEvent(event) { calls.push(['event', event.type]); } };
  const fetch = (...args) => {
    calls.push(['fetch', ...args]);
    if (pendingFetch) {
      return new Promise((resolve) => { resolveFetch = resolve; });
    }
    const statusCode = responseStatus ?? (responseOk ? 202 : 500);
    return Promise.resolve({ ok: statusCode >= 200 && statusCode < 300, status: statusCode });
  };
  class FormData {
    constructor(value) { this.form = value; }
  }
  class CustomEvent {
    constructor(type) { this.type = type; }
  }
  vm.runInNewContext(code, { document, window, fetch, FormData, CustomEvent, URL, Set });
  return { handlers, calls, status, submit, form, honeypot, resolveFetch: (value = { ok: responseOk }) => resolveFetch?.(value) };
}

test('envia multipart apenas para endpoint HTTPS e confirma resposta 2xx', async () => {
  const state = setup();
  let prevented = false;
  await state.handlers.submit({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(state.form.wasReset, true);
  assert.equal(state.status.dataset.state, 'success');
  assert.equal(state.status.focused, true);
  assert.match(state.status.textContent, /Mensagem enviada/);
  assert.deepEqual(state.calls.map(([type]) => type), ['fetch', 'event']);
});

test('preserva os dados e informa falha quando o receptor não aceita', async () => {
  const state = setup({ responseOk: false });
  await state.handlers.submit({ preventDefault() {} });
  assert.equal(state.form.wasReset, undefined);
  assert.equal(state.status.dataset.state, 'error');
  assert.equal(state.status.focused, true);
  assert.match(state.status.textContent, /não foi possível enviar/i);
});

test('trata 4xx, 429 e 5xx como falha sem falso sucesso', async () => {
  for (const responseStatus of [400, 429, 500, 503]) {
    const state = setup({ responseStatus });
    await state.handlers.submit({ preventDefault() {} });
    assert.equal(state.form.wasReset, undefined, `status ${responseStatus} não deve resetar o formulário`);
    assert.equal(state.status.dataset.state, 'error');
  }
});

test('não habilita envio para endpoint HTTP', async () => {
  const state = setup({ endpoint: 'http://forms.example.test/contact' });
  let prevented = false;
  await state.handlers.submit({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(state.calls.length, 0);
  assert.equal(state.status.dataset.state, 'error');
});

test('aceita anexo permitido quando o navegador informa MIME genérico', async () => {
  const state = setup({ file: { name: 'memorial.docx', type: 'application/octet-stream', size: 1 } });
  await state.handlers.submit({ preventDefault() {} });
  assert.equal(state.form.wasReset, true);
  assert.equal(state.status.dataset.state, 'success');
  assert.equal(state.calls.filter(([type]) => type === 'fetch').length, 1);
});

test('aceita extensão permitida quando o navegador informa MIME desconhecido', async () => {
  const state = setup({ file: { name: 'planta.png', type: 'application/x-ajustado', size: 1 } });
  await state.handlers.submit({ preventDefault() {} });
  assert.equal(state.form.wasReset, true);
  assert.equal(state.calls.filter(([type]) => type === 'fetch').length, 1);
});

test('bloqueia anexo fora da extensão permitida antes do fetch', async () => {
  const state = setup({ file: { name: 'payload.exe', type: 'application/octet-stream', size: 1 } });
  let prevented = false;
  await state.handlers.submit({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(state.calls.length, 0);
  assert.equal(state.status.dataset.state, 'error');
  assert.match(state.status.textContent, /PDF, DOC/);
});

test('bloqueia anexo acima de 5 MB antes do fetch', async () => {
  const state = setup({ file: { name: 'memorial.pdf', type: 'application/pdf', size: 5 * 1024 * 1024 + 1 } });
  await state.handlers.submit({ preventDefault() {} });
  assert.equal(state.calls.length, 0);
  assert.match(state.status.textContent, /5 MB/);
});

test('não envia quando o honeypot foi preenchido', async () => {
  const state = setup({ honeypotValue: 'bot-value' });
  let prevented = false;
  await state.handlers.submit({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(state.calls.length, 0);
  assert.equal(state.status.dataset.state, 'error');
});

test('impede dois envios concorrentes enquanto o primeiro aguarda o receptor', async () => {
  const state = setup({ pendingFetch: true });
  const event = { preventDefault() {} };
  const first = state.handlers.submit(event);
  await Promise.resolve();
  const second = state.handlers.submit(event);
  assert.equal(state.calls.filter(([type]) => type === 'fetch').length, 1);
  state.resolveFetch({ ok: true });
  await first;
  await second;
  assert.equal(state.form.wasReset, true);
});
