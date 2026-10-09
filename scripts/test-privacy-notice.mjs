import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const script = await readFile('public/scripts/privacy-notice.js', 'utf8');
function scenario({ stored = null, storageBlocked = false, now = 1700000000000 } = {}) {
  const state = new Map();
  if (stored !== null) state.set('ajn-privacy-notice-ack-v1', String(stored));
  const events = {};
  const button = { focus() { this.focused = true; }, addEventListener(type, cb) { events['ack:' + type] = cb; } };
  const reopen = { addEventListener(type, cb) { events['open:' + type] = cb; } };
  const notice = { hidden: true, querySelector() { return button; } };
  const document = {
    getElementById(id) { assert.equal(id, 'ajn-privacy-notice'); return notice; },
    querySelectorAll(selector) { assert.equal(selector, '[data-privacy-open]'); return [reopen]; },
  };
  const localStorage = {
    getItem(key) { if (storageBlocked) throw Error('blocked'); return state.get(key) ?? null; },
    setItem(key, value) { if (storageBlocked) throw Error('blocked'); state.set(key, value); },
  };
  const sandbox = { document, window: { localStorage }, Date: class extends Date { static now() { return now; } } };
  vm.runInNewContext(script, sandbox);
  return { notice, state, button, events };
}

test('mostra aviso ao visitante sem registro anterior', () => {
  const s = scenario();
  assert.equal(s.notice.hidden, false);
  s.events['ack:click']();
  assert.equal(s.notice.hidden, true);
  assert.equal(s.state.get('ajn-privacy-notice-ack-v1'), '1700000000000');
});

test('não mostra aviso se leitura confirmada nos últimos 180 dias', () => {
  assert.equal(scenario({ stored: 1699999999000 }).notice.hidden, true);
});

test('volta a mostrar aviso depois de 180 dias', () => {
  assert.equal(scenario({ stored: 1700000000000 - 181 * 86400000 }).notice.hidden, false);
});

test('permite rever aviso e focar botão de confirmação', () => {
  const s = scenario({ stored: 1699999999000 });
  s.events['open:click']();
  assert.equal(s.notice.hidden, false);
  assert.equal(s.button.focused, true);
});

test('funciona com armazenamento local bloqueado', () => {
  const s = scenario({ storageBlocked: true });
  assert.equal(s.notice.hidden, false);
  s.events['ack:click']();
  assert.equal(s.notice.hidden, true);
});

test('não faz requisições nem instala cookies ou rastreadores', () => {
  assert.doesNotMatch(script, /document\s*\.\s*cookie|fetch\s*\(|XMLHttpRequest|sendBeacon|gtag\s*\(|fbq\s*\(/i);
});
