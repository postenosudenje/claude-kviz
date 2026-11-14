// Dohvaća utakmice iz Google Apps Scripta i sprema ih kao statične JSON datoteke.
// Pokretanje: node scripts/fetch-data.mjs   (Node 18+)
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const SJ = 'https://postenosudenje.com';
const num = v => Number(String(v ?? '').replace(',', '.')) || 0;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slug = s => String(s).toLowerCase().replace(/đ/g, 'dj').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const dec = v => v.toFixed(2).replace('.', ',');
const FONTS = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Figtree:wght@400;500;600;700;800&display=swap';
const validne = d => (Array.isArray(d) ? d : []).filter(u => num(u.Kolo) >= 1 && num(u.Kolo) <= 36 && (String(u['Domaćin'] || '').trim() || String(u.Gost || '').trim()));
const kompletne = rows => { const po = {}; rows.forEach(u => (po[num(u.Kolo)] ||= []).push(u));
  return Object.values(po).filter(r => r.filter(u => String(u['Domaćin'] || '').trim() && String(u.Gost || '').trim()).length >= 5).flat(); };

const src = await readFile('script.js', 'utf8');
const url = n => src.match(new RegExp(`const ${n} = "([^"]+)"`))?.[1];
const IZVORI = { 'aktivna': url('API_URL_AKTIVNA'), '2025-26': url('API_URL_PROŠLA') };

async function dohvati(u) {
  for (let i = 1; i <= 3; i++) {
    try {
      const r = await fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(90_000) });
      const d = await r.json();
      if (Array.isArray(d) && d.length) return d;
      throw new Error(d?.error || 'prazan odgovor');
    } catch (e) {
      console.warn(`pokušaj ${i}/3: ${e.message}`);
      await new Promise(r => setTimeout(r, i * 3000));
    }
  }
  return null;
}

await mkdir('data', { recursive: true });
let promjena = false;
const brojevi = {};
for (const [ime, u] of Object.entries(IZVORI)) {
  const datoteka = `data/${ime}.json`;
  const stari = await readFile(datoteka, 'utf8').catch(() => null);
  const podaci = u && await dohvati(u);
  if (!podaci) { console.warn(`${ime}: zadržavam staru verziju`); if (stari) brojevi[ime] = JSON.parse(stari).length; continue; }
  const novi = JSON.stringify(podaci);
  brojevi[ime] = podaci.length;
  if (novi !== stari) { await writeFile(datoteka, novi); promjena = true; console.log(`${ime}: ${podaci.length} redaka (ažurirano)`); }
}

if (promjena) {
  const danas = new Date().toISOString().slice(0, 10);
  await writeFile('data/meta.json', JSON.stringify({ updated: new Date().toISOString(), counts: brojevi }));
  const sm = await readFile('sitemap.xml', 'utf8').catch(() => null);
  if (sm) await writeFile('sitemap.xml', sm.replace(/<lastmod>[^<]*<\/lastmod>/g, `<lastmod>${danas}</lastmod>`));
}

// Statične stranice sudaca i klubova (SEO, dijeljenje)
try {
  const sezone = [['2026/27', 'aktivna'], ['2025/26', '2025-26']];
  const sve = [];
  for (const [naziv, ime] of sezone) {
    const d = validne(JSON.parse(await readFile(`data/${ime}.json`, 'utf8').catch(() => '[]')));
    kompletne(d).forEach(u => sve.push({ ...u, _s: naziv }));
  }
  const zbroj = (rows, suf) => ['Žuti', 'Crveni', 'Penal', 'VAR priznat', 'VAR poništen'].map(k => rows.reduce((z, u) => z + suf.reduce((a, s) => a + num(u[`${k} ${s}`]), 0), 0));
  const tab = (naslov, zag, redovi) => `<section class="seo-summary"><h2>${naslov}</h2><div class="tablica-wrap"><table><thead><tr>${zag.map(z => `<th>${z}</th>`).join('')}</tr></thead><tbody>${redovi.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`;
  const stranica = (naslov, opis, put, h1, uvod, tijelo) => `<!DOCTYPE html>
<html lang="hr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(naslov)}</title><meta name="description" content="${esc(opis)}"><link rel="canonical" href="${SJ}${put}">
<meta property="og:type" content="website"><meta property="og:locale" content="hr_HR"><meta property="og:title" content="${esc(naslov)}"><meta property="og:description" content="${esc(opis)}"><meta property="og:url" content="${SJ}${put}"><meta property="og:image" content="https://i.imgur.com/TMWFtd5.png"><meta name="twitter:card" content="summary">
<link rel="stylesheet" href="${FONTS}"><link rel="stylesheet" href="/styles.css">
<script>try{var t=localStorage.getItem('posteno_sudenje_theme');if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Pošteno suđenje', item: SJ + '/' }, { '@type': 'ListItem', position: 2, name: h1, item: SJ + put }] })}</script>
</head><body><main style="max-width:960px;margin:0 auto;padding:1.5rem 0">
<p><a href="/">← Pošteno suđenje</a></p><h1>${esc(h1)}</h1><p>${uvod}</p>${tijelo}
</main></body></html>`;
  const zapisi = async (put, html) => { const f = put.slice(1); await mkdir(f.split('/')[0], { recursive: true });
    if ((await readFile(f, 'utf8').catch(() => '')) !== html) await writeFile(f, html); };
  const stranice = [];

  const suci = [...new Set(sve.map(u => String(u['Glavni sudac'] || '').trim()).filter(Boolean))];
  for (const ime of suci) {
    const r = sve.filter(u => String(u['Glavni sudac'] || '').trim() === ime), put = `/sudac/${slug(ime)}.html`;
    const t = zbroj(r, ['D', 'G']);
    const po = sezone.map(([s]) => [s, r.filter(u => u._s === s)]).filter(([, x]) => x.length);
    const klubovi = {}; r.forEach(u => [u['Domaćin'], u.Gost].forEach(k => { k = String(k || '').trim(); if (k) klubovi[k] = (klubovi[k] || 0) + 1; }));
    const opis = `Statistika suca ${ime} u SuperSport HNL-u: ${r.length} utakmica, ${t[0]} žutih, ${t[1]} crvenih kartona i ${t[2]} penala.`;
    await zapisi(put, stranica(`${ime} – statistika suca | Pošteno suđenje`, opis, put, ime, esc(opis),
      tab('Po sezonama', ['Sezona', 'Utakmica', 'Žuti', 'Crveni', 'Penali', 'VAR priznat', 'VAR poništen'], po.map(([s, x]) => [s, x.length, ...zbroj(x, ['D', 'G'])])) +
      tab('Utakmice', ['Sezona', 'Kolo', 'Domaćin', 'Gost', 'Žuti', 'Crveni', 'Penali'], r.slice().sort((a, b) => b._s.localeCompare(a._s) || num(b.Kolo) - num(a.Kolo)).slice(0, 20)
        .map(u => [u._s, num(u.Kolo), `<a href="/klub/${slug(u['Domaćin'])}.html">${esc(u['Domaćin'])}</a>`, `<a href="/klub/${slug(u.Gost)}.html">${esc(u.Gost)}</a>`, ...zbroj([u], ['D', 'G']).slice(0, 3)]))));
    stranice.push(put);
  }
  const klubovi = [...new Set(sve.flatMap(u => [u['Domaćin'], u.Gost]).map(x => String(x || '').trim()).filter(Boolean))];
  for (const ime of klubovi) {
    const r = sve.filter(u => [u['Domaćin'], u.Gost].map(x => String(x || '').trim()).includes(ime)), put = `/klub/${slug(ime)}.html`;
    const strana = u => (String(u['Domaćin'] || '').trim() === ime ? ['D'] : ['G']);
    const zb = rows => ['Žuti', 'Crveni', 'Penal', 'VAR priznat', 'VAR poništen'].map(k => rows.reduce((z, u) => z + num(u[`${k} ${strana(u)[0]}`]), 0));
    const t = zb(r);
    const po = sezone.map(([s]) => [s, r.filter(u => u._s === s)]).filter(([, x]) => x.length);
    const suci2 = {}; r.forEach(u => { const s = String(u['Glavni sudac'] || '').trim(); if (s) (suci2[s] ||= []).push(u); });
    const opis = `Statistika kluba ${ime} u SuperSport HNL-u: ${r.length} utakmica, ${t[0]} žutih, ${t[1]} crvenih kartona i ${t[2]} penala.`;
    await zapisi(put, stranica(`${ime} – statistika suđenja | Pošteno suđenje`, opis, put, ime, esc(opis),
      tab('Po sezonama', ['Sezona', 'Utakmica', 'Žuti', 'Crveni', 'Penali', 'VAR priznat', 'VAR poništen'], po.map(([s, x]) => [s, x.length, ...zb(x)])) +
      tab('Suci koji su sudili klubu', ['Sudac', 'Utakmica', 'Žuti', 'Crveni', 'Penali'], Object.entries(suci2).sort((a, b) => b[1].length - a[1].length)
        .map(([s, x]) => [`<a href="/sudac/${slug(s)}.html">${esc(s)}</a>`, x.length, ...zb(x).slice(0, 3)]))));
    stranice.push(put);
  }
  const meta = JSON.parse(await readFile('data/meta.json', 'utf8').catch(() => '{}'));
  const lm = (meta.updated || new Date().toISOString()).slice(0, 10);
  const url = (p, f, pr) => `  <url><loc>${SJ}${p}</loc><lastmod>${lm}</lastmod><changefreq>${f}</changefreq><priority>${pr}</priority></url>`;
  const sm = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` + [
    url('/', 'daily', '1.0'), url('/?section=statistika', 'weekly', '0.8'), url('/?section=utakmice', 'daily', '0.8'), url('/?section=usporedba', 'weekly', '0.7'), url('/igra.html', 'monthly', '0.6'),
    ...stranice.map(p => url(p, 'weekly', '0.6'))].join('\n') + '\n</urlset>\n';
  if ((await readFile('sitemap.xml', 'utf8').catch(() => '')) !== sm) await writeFile('sitemap.xml', sm);
  console.log(`stranice: ${stranice.length}`);
} catch (e) { console.warn('stranice preskočene:', e.message); }

if (!Object.keys(brojevi).length) process.exit(1);
