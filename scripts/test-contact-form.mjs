import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const code = await readFile('public/scripts/contact-form.js', 'utf8');

function setup({ responseOk = true, file = null, endpoint = 'https://forms.example.test/contact' } = {}) {
  const handlers = {};
  const calls = [];
  const status = {
    dataset: {},
    textContent: '',
    focus() { this.focused = true; },
  };
  const submit = { disabled: false, textContent: 'Enviar mensagem' };
  const attachment = { files: file ? [file] : [], focus() { this.focused = true; } };
  const form = {
    dataset: { contactEndpoint: endpoint },
    checkValidity() { return true; },
    addEventListener(type, handler) { handlers[type] = handler; },
    querySelector(selector) {
      if (selector === '[data-contact-status]') return status;
      if (selector === 'button[type="submit"]') return submit;
      if (selector === 'input[type="file"]') return attachment;
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
  const fetch = async (...args) => {
    calls.push(['fetch', ...args]);
    return { ok: responseOk };
  };
  class FormData {
    constructor(value) { this.form = value; }
  }
  class CustomEvent {
    constructor(type) { this.type = type; }
  }
  vm.runInNewContext(code, { document, window, fetch, FormData, CustomEvent, URL, Set });
  return { handlers, calls, status, submit, form };
}

test('envia multipart apenas para endpoint HTTPS e confirma resposta 2xx', async () => {
  const state = setup();
  let prevented = false;
  await state.handlers.submit({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(state.form.wasReset, true);
  assert.equal(state.status.dataset.state, 'success');
  assert.match(state.status.textContent, /Mensagem enviada/);
  assert.deepEqual(state.calls.map(([type]) => type), ['fetch', 'event']);
});

test('preserva os dados e informa falha quando o receptor não aceita', async () => {
  const state = setup({ responseOk: false });
  await state.handlers.submit({ preventDefault() {} });
  assert.equal(state.form.wasReset, undefined);
  assert.equal(state.status.dataset.state, 'error');
  assert.match(state.status.textContent, /não foi possível enviar/i);
});

test('não habilita envio para endpoint HTTP', async () => {
  const state = setup({ endpoint: 'http://forms.example.test/contact' });
  let prevented = false;
  await state.handlers.submit({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(state.calls.length, 0);
  assert.equal(state.status.dataset.state, 'error');
});

test('bloqueia anexo fora do tipo ou tamanho permitido antes do fetch', async () => {
  const state = setup({ file: { name: 'payload.exe', type: 'application/octet-stream', size: 1 } });
  let prevented = false;
  await state.handlers.submit({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(state.calls.length, 0);
  assert.equal(state.status.dataset.state, 'error');
  assert.match(state.status.textContent, /PDF, DOC/);
});
