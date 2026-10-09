import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const code = await readFile('public/scripts/privacy-notice.js', 'utf8');
const key = 'ajn-cookie-preferences-v2';
const now = 1700000000000;
function setup({ id = '', choice = null, blocked = false } = {}) {
  const map = new Map();
  if (choice !== null) map.set(key, JSON.stringify({ version: 2, ga4Id: id, analytics: choice, at: now - 1000 }));
  const handlers = {};
  const controls = Object.fromEntries(['accept','reject','customize','save','analytics','options'].map(name => [name, {
    hidden: name === 'save' || name === 'options', checked: false,
    focus() { this.focused = true; },
    addEventListener(event, fn) { handlers[name + ':' + event] = fn; }
  }]));
  const notice = { hidden: true, dataset: { ga4Id: id }, querySelector(selector) {
    return controls[selector.match(/data-privacy-([a-z]+)/)?.[1]];
  }};
  const links = [{ addEventListener(event, fn) { handlers['reopen:' + event] = fn; } }];
  const inserted = [];
  const cookies = [];
  const head = { appendChild(tag) { inserted.push(tag); } };
  const document = {
    head, getElementById() { return notice; }, querySelectorAll() { return links; },
    createElement() { return { async: false, src: '' }; },
    get cookie() { return cookies.join('; '); },
    set cookie(value) { cookies.push(value); }
  };
  const storage = { getItem(k) { if(blocked) throw Error('blocked'); return map.get(k) || null; },
    setItem(k,v) { if(blocked) throw Error('blocked'); map.set(k,v); } };
  const windowHandlers = {};
  const window = {
    localStorage: storage,
    location: { hostname:'ajnengenharia.com.br', reload(){this.reloaded=true;} },
    addEventListener(type, listener) { windowHandlers[type] = listener; },
  };
  vm.runInNewContext(code, { document, window, Date: class extends Date { static now() { return now; } } });
  return { notice, controls, handlers, inserted, map, window, windowHandlers, cookies };
}
test('sem ID: não carrega GA4 mesmo com aceite', () => {
  const s=setup();
  assert.equal(s.notice.hidden,false);
  s.handlers['accept:click']();
  assert.equal(s.inserted.length,0);
  assert.equal(JSON.parse(s.map.get(key)).analytics,true);
});
test('com ID: visitante sem consentimento não carrega nenhuma tag', () => {
  const s=setup({id:'G-ABCDEF1234'});
  assert.equal(s.notice.hidden,false);
  assert.equal(s.inserted.length,0);
});
test('rejeição impede GA4 e salva escolha', () => {
  const s=setup({id:'G-ABCDEF1234'});
  s.handlers['reject:click']();
  assert.equal(s.inserted.length,0);
  assert.equal(JSON.parse(s.map.get(key)).analytics,false);
});
test('aceite explícito carrega GA4 uma única vez', () => {
  const s=setup({id:'G-ABCDEF1234'});
  s.handlers['accept:click']();
  assert.equal(s.inserted.length,1);
  assert.match(s.inserted[0].src,/^https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-ABCDEF1234$/);
  s.handlers['accept:click']();
  assert.equal(s.inserted.length,1);
});
test('consentimento antigo de configuração sem ID não vale para ID novo', () => {
  const s=setup({id:'G-ABCDEF1234'});
  s.map.set(key,JSON.stringify({version:2,ga4Id:'',analytics:true,at:now-1000}));
  const again=setup({id:'G-ABCDEF1234'});
  assert.equal(again.notice.hidden,false);
});
test('preferência de rejeição anterior é respeitada', () => {
  const s=setup({id:'G-ABCDEF1234',choice:false});
  assert.equal(s.notice.hidden,true);
  assert.equal(s.inserted.length,0);
});
test('consentimento anterior carrega tag após validar versão e ID', () => {
  const s=setup({id:'G-ABCDEF1234',choice:true});
  assert.equal(s.notice.hidden,true);
  assert.equal(s.inserted.length,1);
});
test('personalizar não pré-seleciona analytics e permite salvar rejeição', () => {
  const s=setup({id:'G-ABCDEF1234'});
  s.handlers['customize:click']();
  assert.equal(s.controls.analytics.checked,false);
  s.handlers['save:click']();
  assert.equal(s.inserted.length,0);
});
test('revogação desativa GA e recarrega a página', () => {
  const s=setup({id:'G-ABCDEF1234',choice:true});
  s.handlers['reopen:click']();
  s.controls.analytics.checked=false;
  s.handlers['save:click']();
  assert.equal(s.window['ga-disable-G-ABCDEF1234'],true);
  assert.equal(s.window.location.reloaded,true);
});
test('storage bloqueado mantém banner e não inicia GA4', () => {
  const s=setup({id:'G-ABCDEF1234',blocked:true});
  assert.equal(s.notice.hidden,false);
  assert.equal(s.inserted.length,0);
});

test('clique no Instagram não é medido sem consentimento', () => {
  const s = setup({ id:'G-ABCDEF1234' });
  s.windowHandlers['ajn:instagram-outbound']({
    detail: { contentId: 'DSKuL-yEXrF', contentType: 'reel', placement: 'home_editorial' },
  });
  assert.equal(s.inserted.length, 0);
  assert.equal(s.window.dataLayer, undefined);
});
test('com aceite, evento do Instagram é medido sem dados pessoais', () => {
  const s = setup({ id:'G-ABCDEF1234' });
  s.handlers['accept:click']();
  s.windowHandlers['ajn:instagram-outbound']({
    detail: { contentId: 'DSKuL-yEXrF', contentType: 'reel', placement: 'home_editorial' },
  });
  const event = s.window.dataLayer.map(args => [...args]).find(args => args[0] === 'event');
  assert.equal(event[1], 'instagram_outbound_click');
  assert.equal(event[2].content_id, 'DSKuL-yEXrF');
  assert.equal(event[2].content_type, 'reel');
  assert.equal(event[2].placement, 'home_editorial');
  assert.equal(Object.keys(event[2]).length, 3);
});
test('rejeitar e depois aceitar reabilita GA4 na própria página', () => {
  const s = setup({ id:'G-ABCDEF1234' });
  s.handlers['reject:click']();
  assert.equal(s.window['ga-disable-G-ABCDEF1234'], true);
  s.handlers['reopen:click']();
  s.handlers['accept:click']();
  assert.equal(s.window['ga-disable-G-ABCDEF1234'], false);
  s.windowHandlers['ajn:instagram-outbound']({
    detail: { contentId: 'profile', contentType: 'post', placement: 'home_editorial' },
  });
  const event = s.window.dataLayer.map(args => [...args]).find(args => args[0] === 'event');
  assert.ok(event);
  assert.equal(event[2].content_id, 'profile');
});
