import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const code = await readFile('public/scripts/privacy-notice.js', 'utf8');
const baseLayout = await readFile('src/layouts/BaseLayout.astro', 'utf8');
const cookiesPolicy = await readFile('src/pages/politica-de-cookies.astro', 'utf8');
const privacyPolicy = await readFile('src/pages/politica-de-privacidade.astro', 'utf8');
const key = 'ajn-cookie-preferences-v2';
const now = 1700000000000;

test('disclosure informa o evento do formulário e limita os dados enviados', () => {
  for (const source of [baseLayout, cookiesPolicy, privacyPolicy]) {
    assert.match(source, /contact_form_submit/);
    assert.match(source, /apenas o caminho da página/);
    assert.match(source, /nome/);
    assert.match(source, /e-mail/);
    assert.match(source, /mensagem/);
    assert.match(source, /anexo/);
  }
});

function setup({ id = '', choice = null, blocked = false } = {}) {
  const map = new Map();
  if (choice !== null) map.set(key, JSON.stringify({ version: 2, ga4Id: id, analytics: choice, at: now - 1000 }));
  const handlers = {};
  const controls = Object.fromEntries(['accept','reject','customize','save','analytics','options'].map(name => [name, {
    hidden: name === 'save' || name === 'options', checked: false, focused: false,
    focus() { this.focused = true; },
    addEventListener(event, fn) { handlers[name + ':' + event] = fn; }
  }]));
  const main = { focused: false, focus() { this.focused = true; } };
  const notice = { hidden: true, dataset: { ga4Id: id }, querySelector(selector) {
    return controls[selector.match(/data-privacy-([a-z]+)/)?.[1]];
  }, contains(target) { return Object.values(controls).includes(target); }};
  const links = [{ focused: false, focus() { this.focused = true; }, addEventListener(event, fn) { handlers['reopen:' + event] = fn; } }];
  const inserted = [];
  const cookies = [];
  const head = { appendChild(tag) { inserted.push(tag); } };
  const document = {
    head, getElementById(id) { return id === 'ajn-privacy-notice' ? notice : id === 'conteudo-principal' ? main : null; },
    querySelector(selector) { return selector === 'main' ? main : null; },
    querySelectorAll() { return links; },
    addEventListener(type, listener) { handlers['document:' + type] = listener; },
    createElement() { return { async: false, src: '' }; },
    get cookie() { return cookies.join('; '); },
    set cookie(value) { cookies.push(value); }
  };
  const storage = { getItem(k) { if(blocked) throw Error('blocked'); return map.get(k) || null; },
    setItem(k,v) { if(blocked) throw Error('blocked'); map.set(k,v); } };
  const windowHandlers = {};
  const window = {
    localStorage: storage,
    location: { hostname:'ajnengenharia.com.br', pathname:'/contato/', reloaded:false, reload(){this.reloaded=true;} },
    addEventListener(type, listener) { windowHandlers[type] = listener; },
  };
  vm.runInNewContext(code, { document, window, Date: class extends Date { static now() { return now; } } });
  return { notice, controls, handlers, inserted, map, window, windowHandlers, cookies, links, main };
}
test('banner sem consentimento move o foco para a primeira ação de privacidade', () => {
  const s = setup({ id: 'G-ABCDEF1234' });
  assert.equal(s.controls.reject.focused, true);
});
test('sem ID: não carrega GA4 mesmo com aceite', () => {
  const s=setup();
  assert.equal(s.notice.hidden,false);
  s.handlers['accept:click']();
  assert.equal(s.inserted.length,0);
  assert.equal(JSON.parse(s.map.get(key)).analytics,true);
  assert.equal(s.main.focused,true);
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
  assert.equal(s.main.focused,true);
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
  s.handlers['customize:click']({ currentTarget: s.controls.customize });
  assert.equal(s.controls.analytics.checked,false);
  s.handlers['save:click']();
  assert.equal(s.inserted.length,0);
  assert.equal(s.main.focused,true);
});
test('Escape no primeiro acesso mantém o aviso e devolve foco a Personalizar', () => {
  const s = setup({ id:'G-ABCDEF1234' });
  s.handlers['customize:click']({ currentTarget: s.controls.customize });
  s.handlers['document:keydown']({ key: 'Escape', preventDefault() {} });
  assert.equal(s.notice.hidden, false);
  assert.equal(s.controls.options.hidden, true);
  assert.equal(s.controls.customize.focused, true);
});
test('revogação desativa GA e recarrega a página', () => {
  const s=setup({id:'G-ABCDEF1234',choice:true});
  s.handlers['reopen:click']();
  s.controls.analytics.checked=false;
  s.handlers['save:click']();
  assert.equal(s.window['ga-disable-G-ABCDEF1234'],true);
  assert.equal(s.window.location.reloaded,true);
});
test('Escape fecha somente as preferências abertas e devolve o foco ao gatilho', () => {
  const s = setup({ id:'G-ABCDEF1234' });
  s.handlers['reopen:click']({ currentTarget: s.links[0] });
  assert.equal(s.controls.save.focused, true);
  let prevented = false;
  s.handlers['document:keydown']({ key: 'Escape', preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(s.controls.options.hidden, true);
  assert.equal(s.controls.save.hidden, true);
  assert.equal(s.notice.hidden, false);
  assert.equal(s.links[0].focused, true);
});
test('Escape em preferências já escolhidas cancela a abertura e oculta o aviso', () => {
  const s = setup({ id:'G-ABCDEF1234', choice: false });
  s.handlers['reopen:click']({ currentTarget: s.links[0] });
  s.handlers['document:keydown']({ key: 'Escape', preventDefault() {} });
  assert.equal(s.notice.hidden, true);
  assert.equal(s.links[0].focused, true);
});
test('storage bloqueado mantém banner e não inicia GA4', () => {
  const s=setup({id:'G-ABCDEF1234',blocked:true});
  assert.equal(s.notice.hidden,false);
  assert.equal(s.inserted.length,0);
  s.handlers['reject:click']();
  assert.equal(s.main.focused,true);
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
test('envio confirmado do formulário não é medido sem consentimento', () => {
  const s = setup({ id: 'G-ABCDEF1234' });
  s.windowHandlers['ajn:contact-form-submit']();
  assert.equal(s.window.dataLayer, undefined);
});
test('envio confirmado do formulário mede somente a página após consentimento', () => {
  const s = setup({ id: 'G-ABCDEF1234' });
  s.handlers['accept:click']();
  s.windowHandlers['ajn:contact-form-submit']();
  const event = s.window.dataLayer.map(args => [...args]).find(args => args[0] === 'event' && args[1] === 'contact_form_submit');
  assert.equal(event[2].page_path, '/contato/');
  assert.deepEqual(Object.keys(event[2]), ['page_path']);
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

function clickContact(s, href) {
  s.handlers['document:click']({
    target: { closest(selector) {
      assert.equal(selector, 'a[href]');
      return { getAttribute(name) { assert.equal(name, 'href'); return href; } };
    } }
  });
}

test('sem consentimento, cliques de contato não ativam eventos nem tags', () => {
  const s = setup({ id: 'G-ABCDEF1234' });
  clickContact(s, 'https://web.whatsapp.com/send?phone=5531999999999');
  clickContact(s, 'mailto:cliente@example.org');
  assert.equal(s.window.dataLayer, undefined);
  assert.equal(s.inserted.length, 0);
});

test('com consentimento, mede canais de contato sem transmitir dados pessoais', () => {
  const s = setup({ id: 'G-ABCDEF1234' });
  s.handlers['accept:click']();
  clickContact(s, 'https://web.whatsapp.com/send?phone=5531999999999');
  clickContact(s, 'https://wa.me/5531999999999');
  clickContact(s, 'tel:+5531988888888');
  clickContact(s, 'mailto:cliente@example.org?subject=orcamento');
  clickContact(s, 'https://example.org/um-link');
  const events = s.window.dataLayer.map(args => [...args]).filter(args => args[0] === 'event' && args[1] === 'contact_channel_click');
  assert.deepEqual(events.map(args => args[2].channel).join(','), 'whatsapp,whatsapp,phone,email');
  for (const event of events) {
    assert.equal(event[2].page_path, '/contato/');
    assert.deepEqual(Object.keys(event[2]).sort().join(','), 'channel,page_path');
    assert.doesNotMatch(JSON.stringify(event), /5531999999999|5531988888888|cliente@example.org/);
  }
});

test('revogação bloqueia novos cliques de contato antes do recarregamento', () => {
  const s = setup({ id: 'G-ABCDEF1234', choice: true });
  s.handlers['reopen:click']();
  s.controls.analytics.checked = false;
  s.handlers['save:click']();
  clickContact(s, 'tel:+5531988888888');
  const events = s.window.dataLayer.map(args => [...args]).filter(args => args[0] === 'event');
  assert.equal(events.length, 0);
});
