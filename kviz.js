// Kviz "Tko želi biti VAR-ovac?" – sekcija glavne stranice
(() => {
const num = v => Number(String(v ?? '').replace(',', '.')) || 0;
const T = v => String(v ?? '').trim();
const el = (t, tekst, kl) => { const e = document.createElement(t); if (tekst !== undefined && tekst !== null) e.textContent = tekst; if (kl) e.className = kl; return e; };
const promijesaj = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);
const nasumce = a => a[Math.floor(Math.random() * a.length)];
const dobro = u => T(u['Glavni sudac']) && T(u['Domaćin']) && T(u.Gost) && num(u.Kolo) >= 1;

// GEN-START
const zbroj = (u, k) => num(u[k + ' D']) + num(u[k + ' G']);
function kompletne(rows) { const po = {}; rows.forEach(u => (po[u.sezona + '|' + num(u.Kolo)] ||= []).push(u)); return Object.values(po).filter(r => r.length >= 5).flat(); }
const poSucima = (rows, f) => { const m = {}; rows.forEach(u => { const s = T(u['Glavni sudac']); m[s] = (m[s] || 0) + f(u); }); return m; };
const poKlubovima = (rows, k) => { const m = {}; rows.forEach(u => [['Domaćin', 'D'], ['Gost', 'G']].forEach(([i, s]) => { const c = T(u[i]); m[c] = (m[c] || 0) + num(u[k + ' ' + s]); })); return m; };
const vrh = m => { const e = Object.entries(m).sort((a, b) => b[1] - a[1]); return e.length > 3 && e[0][1] > e[1][1] ? e[0] : null; };
const imena = (m, tocan, tezko) => { const e = Object.entries(m).filter(([k]) => k !== tocan).sort((a, b) => b[1] - a[1]).map(x => x[0]); const iz = tezko ? e.slice(0, 6) : e; return promijesaj(iz.length >= 3 ? iz : e).slice(0, 3); };
const brojevi = (c, dec) => { const korak = dec ? 0.1 : Math.max(1, Math.round(c * 0.12)); const kand = new Set(); for (let k = 1; kand.size < 8; k++) { [c - k * korak, c + k * korak].forEach(x => { x = dec ? Math.round(x * 100) / 100 : Math.round(x); if (x >= 0 && x !== c) kand.add(x); }); if (k > 40) break; } return promijesaj([...kand].slice(0, 6)).slice(0, 3); };
const fmt = (v, dec) => dec ? v.toFixed(2).replace('.', ',') : String(v);
const Q = (id, tier, q, tocan, krivi, dec) => ({ id, tier, q, tocan: fmt(tocan, dec), opcije: promijesaj([tocan, ...krivi]).map(x => typeof x === 'number' ? fmt(x, dec) : x) });

const SABLONE = [
  [1, 'klub-zuti', (r, l) => { const v = vrh(poKlubovima(r, 'Žuti')); return v && Q('klub-zuti', 1, `Koji je klub dobio najviše žutih kartona ${l}?`, v[0], imena(poKlubovima(r, 'Žuti'), v[0], false)); }],
  [1, 'sudac-utakmice', (r, l) => { const m = poSucima(r, () => 1), v = vrh(m); return v && Q('sudac-utakmice', 1, `Koji je sudac sudio najviše utakmica ${l}?`, v[0], imena(m, v[0], false)); }],
  [1, 'crveni-ukupno', (r, l) => { const c = r.reduce((z, u) => z + zbroj(u, 'Crveni'), 0); return c > 2 && Q('crveni-ukupno', 1, `Koliko je crvenih kartona ukupno pokazano ${l}?`, c, brojevi(c)); }],
  [2, 'sudac-zuti', (r, l) => { const m = poSucima(r, u => zbroj(u, 'Žuti')), v = vrh(m); return v && Q('sudac-zuti', 2, `Koji je sudac podijelio najviše žutih kartona ${l}?`, v[0], imena(m, v[0], true)); }],
  [2, 'klub-penali', (r, l) => { const m = poKlubovima(r, 'Penal'), v = vrh(m); return v && Q('klub-penali', 2, `Koji klub ima najviše penala upisanih u statistici ${l}?`, v[0], imena(m, v[0], true)); }],
  [2, 'penali-ukupno', (r, l) => { const c = r.reduce((z, u) => z + zbroj(u, 'Penal'), 0); return c > 2 && Q('penali-ukupno', 2, `Koliko je penala ukupno dosuđeno ${l}?`, c, brojevi(c)); }],
  [2, 'kolo-zuti', (r, l, sc) => { if (sc.ukupno) return null; const m = {}; r.forEach(u => { const k = 'Kolo ' + num(u.Kolo); m[k] = (m[k] || 0) + zbroj(u, 'Žuti'); }); const v = vrh(m); return v && Q('kolo-zuti', 2, `U kojem je kolu pokazano najviše žutih kartona ${l}?`, v[0], imena(m, v[0], true)); }],
  [2, 'var-priznat', (r, l) => { const c = r.reduce((z, u) => z + zbroj(u, 'VAR priznat'), 0); return c > 2 && Q('var-priznat', 2, `Koliko je VAR odluka ukupno priznato ${l}?`, c, brojevi(c)); }],
  [3, 'sudac-crveni', (r, l) => { const m = poSucima(r, u => zbroj(u, 'Crveni')), v = vrh(m); return v && Q('sudac-crveni', 3, `Koji sudac ima najviše crvenih kartona ${l}?`, v[0], imena(m, v[0], true)); }],
  [3, 'klub-crveni', (r, l) => { const m = poKlubovima(r, 'Crveni'), v = vrh(m); return v && Q('klub-crveni', 3, `Koji je klub dobio najviše crvenih kartona ${l}?`, v[0], imena(m, v[0], true)); }],
  [3, 'klub-var-ponisten', (r, l) => { const m = poKlubovima(r, 'VAR poništen'), v = vrh(m); return v && Q('klub-var-ponisten', 3, `Koji klub ima najviše poništenih VAR odluka ${l}?`, v[0], imena(m, v[0], true)); }],
  [3, 'sudac-prosjek', (r, l) => { const br = poSucima(r, () => 1), zu = poSucima(r, u => zbroj(u, 'Žuti')); const p = {}; Object.keys(br).filter(s => br[s] >= 5).forEach(s => p[s] = zu[s] / br[s]); const v = vrh(p); return v && Q('sudac-prosjek', 3, `Koji sudac ima najviši prosjek žutih kartona po utakmici ${l} (najmanje 5 utakmica)?`, v[0], imena(p, v[0], true)); }],
  [3, 'sudac-prosjek-broj', (r, l) => { const br = poSucima(r, () => 1), zu = poSucima(r, u => zbroj(u, 'Žuti')); const s = nasumce(Object.keys(br).filter(x => br[x] >= 5) || []); if (!s) return null; const c = Math.round(zu[s] / br[s] * 100) / 100; return Q('sudac-prosjek-broj', 3, `Koliko je žutih kartona u prosjeku po utakmici podijelio sudac ${s} ${l}?`, c, brojevi(c, true), true); }],
  [3, 'sudac-broj-utakmica', (r, l) => { const br = poSucima(r, () => 1); const s = nasumce(Object.keys(br).filter(x => br[x] >= 4)); if (!s) return null; return Q('sudac-broj-utakmica', 3, `Koliko je utakmica sudio ${s} ${l}?`, br[s], brojevi(br[s])); }]
];

function napraviPitanja(sve) {
  const sezone = [...new Set(sve.map(u => u.sezona))].sort();
  const scopes = [];
  sezone.forEach(s => { const r = kompletne(sve.filter(u => u.sezona === s)); if (r.length >= 30) scopes.push({ r, l: `u sezoni ${s}`, ukupno: false }); });
  if (sezone.length > 1) scopes.push({ r: kompletne(sve), l: 'u obje sezone zajedno', ukupno: true });
  const pool = [], vidjeno = new Set();
  SABLONE.forEach(([tier, , f]) => scopes.forEach(sc => { try { const q = f(sc.r, sc.l, sc); if (q && q.opcije.length === 4 && new Set(q.opcije).size === 4 && !vidjeno.has(q.q)) { vidjeno.add(q.q); q.ti = q.opcije.indexOf(q.tocan); pool.push(q); } } catch (e) {} }));
  return pool;
}
function odaberi15(pool) {
  const izabrano = [], koristeno = new Set();
  [1, 2, 3].forEach(t => {
    const p = promijesaj(pool.filter(q => q.tier === t)), pick = [];
    p.forEach(q => { if (pick.length < 5 && !koristeno.has(q.id + t)) { pick.push(q); koristeno.add(q.id + t); } });
    p.forEach(q => { if (pick.length < 5 && !pick.includes(q)) pick.push(q); });
    izabrano.push(...pick);
  });
  promijesaj(pool).forEach(q => { if (izabrano.length < 15 && !izabrano.includes(q)) izabrano.push(q); });
  return izabrano.slice(0, 15).sort((a, b) => a.tier - b.tier);
}
// GEN-END

const root = document.getElementById('igra');
let pool = [], igra = null;

async function ucitaj() {
  const sve = [];
  for (const [sezona, url] of [['2026/27', 'data/aktivna.json'], ['2025/26', 'data/2025-26.json']]) {
    try { const d = await (await fetch(url)).json(); if (Array.isArray(d)) d.filter(dobro).forEach(u => sve.push({ ...u, sezona })); } catch (e) {}
  }
  pool = napraviPitanja(sve);
  if (odaberi15(pool).length < 15) { root.replaceChildren(el('p', 'Za kviz još nema dovoljno podataka. Pokušaj kasnije.')); return; }
  nova();
}
function nova() { igra = { pitanja: odaberi15(pool), i: 0, jokeri: [false, false, false], skriveno: new Set(), odabir: null, zavrseno: false, publika: null }; crtaj(); }

function crtaj() {
  const g = igra, p = g.pitanja[g.i], slova = 'ABCD';
  const lj = el('div', null, 'ljestvica'); for (let k = 0; k < 15; k++) lj.append(el('span', null, k < g.i ? 'gotovo' : k === g.i ? 'sada' : ''));
  const jok = el('div', null, 'jokeri');
  g.jokeri.forEach((iskoristen, n) => {
    const b = el('button', 'VAR: Publika'); b.disabled = iskoristen || g.zavrseno || g.publika !== null; b.onclick = () => joker(n); jok.append(b);
  });
  const ops = el('div', null, 'opcije');
  p.opcije.forEach((o, idx) => {
    const b = el('button'); b.append(el('span', slova[idx] + ':', 'slovo'), document.createTextNode(o));
    if (g.skriveno.has(idx)) { b.classList.add('skriveno'); b.disabled = true; }
    if (g.publika && g.publika[idx] !== undefined) { b.append(el('span', g.publika[idx] + '%', 'pct')); const bar = el('span', null, 'bar'); bar.style.setProperty('--p', g.publika[idx] + '%'); b.append(bar); }
    if (g.zavrseno) { b.disabled = true; if (idx === p.ti) b.classList.add('tocno'); else if (idx === g.odabir) b.classList.add('krivo'); }
    else { if (idx === g.odabir) b.classList.add('odabrano'); b.onclick = () => { g.odabir = idx; crtaj(); }; }
    ops.append(b);
  });
  const dno = el('div');
  if (!g.zavrseno) {
    const k = el('button', 'Konačni odgovor', 'primarno'); k.disabled = g.odabir === null;
    k.onclick = () => { g.zavrseno = true; crtaj(); }; dno.append(k);
  } else {
    const tocno = g.odabir === p.ti;
    dno.append(el('p', tocno ? 'Točno!' : `Netočno. Točan odgovor: ${p.tocan}.`));
    if (!tocno || g.i === 14) {
      dno.append(el('p', tocno ? 'Pobjeda! Odgovorio si na svih 15 pitanja.' : `Kraj igre. Stigao si do pitanja ${g.i + 1} od 15.`));
      const r = el('button', 'Igraj ponovno', 'primarno'); r.onclick = nova; dno.append(r);
    } else {
      const d = el('button', 'Sljedeće pitanje', 'primarno'); d.onclick = () => { g.i++; g.odabir = null; g.zavrseno = false; g.skriveno = new Set(); g.publika = null; crtaj(); }; dno.append(d);
    }
  }
  root.replaceChildren(el('div', `Pitanje ${g.i + 1} / 15`, 'status'), lj, jok, el('h2', p.q), ops, dno);
}

function joker(n) {
  const g = igra, p = g.pitanja[g.i];
  if (g.jokeri[n] || g.zavrseno || g.publika) return;
  g.jokeri[n] = true;
  const krivi = [0, 1, 2, 3].filter(x => x !== p.ti);
  const raspon = { 1: [70, 90], 2: [45, 70], 3: [30, 55] }[p.tier];
  let t = raspon[0] + Math.random() * (raspon[1] - raspon[0]);
  if (p.tier === 3 && Math.random() < 0.2) t = 20 + Math.random() * 10; // na teškim pitanjima publika zna pogriješiti
  const tezine = krivi.map(() => Math.random() + 0.2), zb = tezine.reduce((a, c) => a + c, 0), res = {};
  krivi.forEach((x, i) => res[x] = Math.round((100 - t) * tezine[i] / zb));
  res[p.ti] = 100 - Object.values(res).reduce((a, c) => a + c, 0);
  g.publika = res;
  crtaj();
}

// Kviz se učitava tek kad se otvori sekcija
let pokrenut = false;
const pokreni = () => { if (pokrenut) return; pokrenut = true; ucitaj(); };
document.querySelector('#mainMenu [data-section="kviz"]')?.addEventListener('click', pokreni);
if (new URLSearchParams(location.search).get('section') === 'kviz') pokreni();

})();
