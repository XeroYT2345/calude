/*!
 * AniRadar · monetize.js
 * Capa de monetización que se añade con UNA etiqueta <script> y no toca el resto de la web.
 *   1) Pone tu ID de afiliado de Amazon en los enlaces de «Dónde verlo» que apunten a Amazon.
 *   2) Añade en cada ficha un bloque «Manga, figuras y merchandising» con enlaces de afiliado.
 *   3) Añade un anuncio de AdSense en la portada (entre los destacados y el selector de días).
 *   4) Botón opcional de donaciones (Ko-fi, Buy Me a Coffee…) en el pie.
 * Todo es opcional: lo que dejes vacío en CONFIG simplemente no se activa. Coste: 0 €.
 */
(function () {
  'use strict';

  /* ===================== CONFIGURACIÓN (rellena solo lo que tengas) ===================== */
  var CONFIG = {
    // Amazon Associates: un ID por tienda (se crea gratis en cada país: afiliados.amazon.es, affiliate-program.amazon.com…).
    // Si una tienda no tiene ID, no se muestra el bloque de merchandising en ese país.
    amazonTags: {
      'amazon.es': '',        // p. ej. 'aniradar-21'
      'amazon.com': '',       // p. ej. 'aniradar-20'
      'amazon.co.uk': '',
      'amazon.fr': '',
      'amazon.de': '',
      'amazon.it': '',
      'amazon.com.mx': '',
      'amazon.com.br': '',
      'amazon.ca': '',
      'amazon.co.jp': '',
      'amazon.com.au': ''
    },

    // Otros programas (Impact, Awin, CJ…): plantilla que recibe la URL de destino. Ejemplo:
    // { match: /crunchyroll\.com/i, build: function (u) { return 'https://crunchyroll.sjv.io/c/XXXX/YYYY/ZZZZ?u=' + encodeURIComponent(u); } }
    deepLinks: [],

    // Enlaces de búsqueda de otras tiendas para el bloque de merchandising (opcional). {q} = título codificado.
    extraStores: [
      // { name: 'CDJapan', url: 'https://www.cdjapan.co.jp/searchuni?term.media_format=&q={q}&aff=TU_ID' }
    ],

    // Anuncio de portada (AdSense). Necesitas crear un bloque de anuncios «adaptable» en AdSense y pegar aquí su ID numérico.
    adsense: { client: 'ca-pub-7212697940074599', homeSlot: '' },

    // Botón de donación en el pie (vacío = no se muestra)
    donateUrl: ''
  };

  /* ===================== TEXTOS ===================== */
  var T = {
    es: { merch: 'Manga, figuras y merchandising', manga: 'Manga y novelas', figs: 'Figuras', merchTxt: 'Merchandising', disc: 'Enlaces de afiliado: si compras, AniRadar recibe una pequeña comisión sin coste extra para ti.', donate: 'Apoya AniRadar', ad: 'Publicidad' },
    en: { merch: 'Manga, figures & merch', manga: 'Manga & novels', figs: 'Figures', merchTxt: 'Merchandise', disc: 'Affiliate links: if you buy, AniRadar earns a small commission at no extra cost to you.', donate: 'Support AniRadar', ad: 'Advertisement' }
  };
  var lang = function () { var l = (document.documentElement.lang || 'es').slice(0, 2); return T[l] ? l : (l === 'pt' || l === 'fr' || l === 'de' || l === 'it' ? 'en' : 'es'); };
  var tx = function (k) { return T[lang()][k]; };

  /* ===================== UTILIDADES ===================== */
  var $ = function (id) { return document.getElementById(id); };
  var STORE_BY_COUNTRY = { ES: 'amazon.es', MX: 'amazon.com.mx', AR: 'amazon.com', CO: 'amazon.com', CL: 'amazon.com', PE: 'amazon.com', UY: 'amazon.com', EC: 'amazon.com', VE: 'amazon.com', US: 'amazon.com', CA: 'amazon.ca', GB: 'amazon.co.uk', IE: 'amazon.co.uk', AU: 'amazon.com.au', BR: 'amazon.com.br', PT: 'amazon.es', FR: 'amazon.fr', DE: 'amazon.de', IT: 'amazon.it', JP: 'amazon.co.jp' };

  function country() { // el botón de idioma muestra «ES·MX»: el país es la parte tras el punto medio
    var el = $('langBtnLabel'), m = el && /[·.]\s*([A-Z]{2})/.exec(el.textContent || '');
    return m ? m[1] : 'ES';
  }
  function store() { return STORE_BY_COUNTRY[country()] || 'amazon.com'; }
  function tagFor(domain) { return (CONFIG.amazonTags[domain] || '').trim(); }
  function amazonSearch(domain, query, tag) {
    return 'https://www.' + domain + '/s?k=' + encodeURIComponent(query) + '&tag=' + encodeURIComponent(tag);
  }
  function mark(a) { a.target = '_blank'; a.rel = 'sponsored nofollow noopener noreferrer'; }
  function once(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }

  /* ===================== 1) Afiliados en «Dónde verlo» ===================== */
  function decorateLinks() {
    var box = $('whereBody'); if (!box) return;
    box.querySelectorAll('a[href]').forEach(function (a) {
      if (a.dataset.arAff) return;
      var u; try { u = new URL(a.href); } catch (_) { return; }
      var host = u.hostname.replace(/^www\./, '');
      var am = /^amazon\.[a-z.]+$/.exec(host);
      if (am && tagFor(host)) { u.searchParams.set('tag', tagFor(host)); a.href = u.toString(); a.dataset.arAff = '1'; mark(a); return; }
      for (var i = 0; i < CONFIG.deepLinks.length; i++) {
        var d = CONFIG.deepLinks[i];
        if (d.match.test(u.href)) { a.href = d.build(u.href); a.dataset.arAff = '1'; mark(a); return; }
      }
    });
  }

  /* ===================== 2) Bloque de merchandising en la ficha ===================== */
  function merchBlock() {
    var old = $('arMerch'); if (old) old.remove();
    var titleEl = $('resTitle'), anchor = $('whereBody') && $('whereBody').parentElement;
    if (!titleEl || !anchor) return;
    var title = (titleEl.textContent || '').trim();
    if (!title || title === '—') return;
    var domain = store(), tag = tagFor(domain);
    if (!tag && !CONFIG.extraStores.length) return;

    var q = encodeURIComponent(title), links = [];
    if (tag) {
      links.push([tx('manga'), amazonSearch(domain, title + ' manga', tag)]);
      links.push([tx('figs'), amazonSearch(domain, title + ' figure', tag)]);
      links.push([tx('merchTxt'), amazonSearch(domain, title + ' anime', tag)]);
    }
    CONFIG.extraStores.forEach(function (s) { links.push([s.name, s.url.replace('{q}', q)]); });

    var wrap = document.createElement('div');
    wrap.id = 'arMerch'; wrap.className = 'space-y-2.5';
    var h = document.createElement('h3');
    h.className = 'text-xs font-mono uppercase tracking-wider text-zinc-300 flex items-center gap-1.5';
    h.innerHTML = '<i class="ph-fill ph-shopping-bag-open text-orange-400 text-sm"></i>';
    h.appendChild(document.createTextNode(tx('merch')));
    var row = document.createElement('div'); row.className = 'flex flex-wrap gap-2';
    links.forEach(function (l) {
      var a = document.createElement('a'); a.href = l[1]; mark(a);
      a.className = 'glass-pill pressable px-3 py-2 rounded-xl text-xs font-semibold text-zinc-100 flex items-center gap-1.5';
      a.appendChild(document.createTextNode(l[0]));
      var ic = document.createElement('i'); ic.className = 'ph-bold ph-arrow-up-right text-[10px] text-zinc-400'; a.appendChild(ic);
      row.appendChild(a);
    });
    var note = document.createElement('p'); note.className = 'text-[10px] font-mono text-zinc-500'; note.textContent = tx('disc');
    wrap.appendChild(h); wrap.appendChild(row); wrap.appendChild(note);
    anchor.insertAdjacentElement('afterend', wrap);
  }

  /* ===================== 3) Anuncio en la portada ===================== */
  function homeAd() {
    var c = CONFIG.adsense; if (!c.homeSlot || $('arHomeAd')) return;
    var after = $('tlSpotWrap'); if (!after) return;
    var aside = document.createElement('aside');
    aside.id = 'arHomeAd'; aside.setAttribute('aria-label', tx('ad'));
    aside.style.cssText = 'max-width:970px;margin:12px auto 0;width:100%;min-height:100px';
    var lab = document.createElement('span');
    lab.style.cssText = 'display:block;text-align:center;margin-bottom:6px;font:500 9px/1 monospace;letter-spacing:.14em;text-transform:uppercase;color:#52525b';
    lab.textContent = tx('ad');
    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle'; ins.style.display = 'block';
    ins.setAttribute('data-ad-client', c.client); ins.setAttribute('data-ad-slot', String(c.homeSlot));
    ins.setAttribute('data-ad-format', 'auto'); ins.setAttribute('data-full-width-responsive', 'true');
    aside.appendChild(lab); aside.appendChild(ins);
    after.insertAdjacentElement('afterend', aside);
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (_) {}
    new MutationObserver(function () { if (ins.getAttribute('data-ad-status') === 'unfilled') aside.style.display = 'none'; })
      .observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] });
  }

  /* ===================== 4) Donaciones ===================== */
  function donate() {
    if (!CONFIG.donateUrl || $('arDonate')) return;
    var foot = document.querySelector('footer'); if (!foot) return;
    var p = document.createElement('p'); p.id = 'arDonate';
    var a = document.createElement('a'); a.href = CONFIG.donateUrl; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.className = 'underline hover:text-accent'; a.textContent = '♥ ' + tx('donate');
    p.appendChild(a); foot.insertBefore(p, foot.firstChild);
  }

  /* ===================== ARRANQUE ===================== */
  var refresh = once(function () { decorateLinks(); }, 60);
  var refreshMerch = once(function () { merchBlock(); decorateLinks(); }, 250);

  function start() {
    var where = $('whereBody'); if (where) new MutationObserver(refresh).observe(where, { childList: true, subtree: true });
    var title = $('resTitle'); if (title) new MutationObserver(refreshMerch).observe(title, { childList: true, characterData: true, subtree: true });
    var lbl = $('langBtnLabel'); if (lbl) new MutationObserver(refreshMerch).observe(lbl, { childList: true, characterData: true, subtree: true });
    homeAd(); donate(); decorateLinks(); merchBlock();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
