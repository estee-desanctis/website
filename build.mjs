#!/usr/bin/env node
// =====================================================================================
// build.mjs — génère les pages HTML statiques du portfolio (FR à la racine, EN dans /en)
// à partir de data/content.fr.js et data/content.en.js.
//
//   node build.mjs        (aucune dépendance, Node 18+)
//
// Pourquoi : le HTML est livré déjà rempli (lecteurs d'écran, navigation clavier, aperçus de
// liens, moteurs de recherche, JavaScript désactivé) et le navigateur ne télécharge plus les
// ~110 Ko de données ni le moteur de rendu JS. Le contenu reste édité dans data/*.js.
// =====================================================================================
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SITE_URL = 'https://estee-desanctis.github.io/website/'; // utilisé pour canonical / hreflang / sitemap
const { icons: ICONS, quote: QUOTE_ICON } = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/icons.json'), 'utf8'));

// ---------- Chaînes d'interface (hors contenu éditorial) ----------
const UI = {
  fr: {
    skip: 'Aller au contenu principal', menu: 'Menu', navLabel: 'Navigation principale', langLabel: 'Langue',
    langName: { fr: 'Français', en: 'English' }, logoAlt: 'EcoDesign — Accueil', breadcrumb: "Fil d'Ariane",
    newWindow: '(nouvelle fenêtre)', pdfNew: '(PDF, nouvelle fenêtre)', challenge: 'Le défi',
    impact: "L'impact en chiffres", method: 'Méthodologie', results: 'Résultats', role: 'Mon rôle', team: 'Équipe',
    tools: 'Outils', links: 'Liens', details: 'Informations sur le projet', portrait: 'Estée Desanctis',
    followLabel: 'Réseaux', formHint: "Les champs marqués d'un astérisque (*) sont obligatoires. Ce formulaire ouvre Gmail dans une nouvelle fenêtre.",
    formNoJs: 'Le formulaire nécessite JavaScript. Vous pouvez écrire directement à', mailSubject: 'Contact site EcoDesign',
    labelSurname: 'Nom : ', labelName: 'Prénom : ', labelEmail: 'Email : ', readMoreAbout: 'à propos de', moved: 'Cette page a changé d\'adresse.',
    pickProject: 'Choisissez le projet :', pickArticle: 'Choisissez la contribution :', toc: 'Sommaire', readMoreSep: ' : ',
    hero: 'Estée Desanctis, ', locale: 'fr_FR',
    videoFallback: 'Votre navigateur ne lit pas cette vidéo.', videoDownload: 'Télécharger la vidéo (MP4)',
    declLink: "Déclaration d'accessibilité", pagesFr: 'Version française', pagesEn: 'English version'
  },
  en: {
    skip: 'Skip to main content', menu: 'Menu', navLabel: 'Main navigation', langLabel: 'Language',
    langName: { fr: 'Français', en: 'English' }, logoAlt: 'EcoDesign — Home', breadcrumb: 'Breadcrumb',
    newWindow: '(opens in a new window)', pdfNew: '(PDF, opens in a new window)', challenge: 'The challenge',
    impact: 'The impact, in numbers', method: 'Methodology', results: 'Results', role: 'My role', team: 'Team',
    tools: 'Tools', links: 'Links', details: 'Project details', portrait: 'Estée Desanctis',
    followLabel: 'Social networks', formHint: 'Fields marked with an asterisk (*) are required. This form opens Gmail in a new window.',
    formNoJs: 'The form needs JavaScript. You can write directly to', mailSubject: 'EcoDesign website contact',
    labelSurname: 'Surname: ', labelName: 'Name: ', labelEmail: 'Email: ', readMoreAbout: 'about', moved: 'This page has a new address.',
    pickProject: 'Choose a project:', pickArticle: 'Choose a contribution:', toc: 'Contents', readMoreSep: ': ',
    hero: 'Estée Desanctis, ', locale: 'en_US',
    videoFallback: 'Your browser cannot play this video.', videoDownload: 'Download the video (MP4)',
    declLink: 'Accessibility statement', pagesFr: 'Version française', pagesEn: 'English version'
  }
};

// ---------- Chargement du contenu ----------
function loadContent(lang) {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, `data/content.${lang}.js`), 'utf8'), sandbox);
  return sandbox.window['CONTENT_' + lang.toUpperCase()];
}
const CONTENT = { fr: loadContent('fr'), en: loadContent('en') };

// ---------- Utilitaires ----------
// Texte éditorial : peut contenir quelques balises (span, strong) ; on normalise seulement les "&" isolés.
const h = (s) => String(s ?? '').replace(/&(?!#?\w+;)/g, '&amp;');
// Valeur d'attribut : échappement complet.
const at = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const paragraphs = (text) => (text || '').split('\n\n').map((p) => `<p>${h(p)}</p>`).join('');
const icon = (name, cls) => `<svg class="icon-svg${cls ? ' ' + cls : ''}" aria-hidden="true" focusable="false" viewBox="0 0 24 24">${ICONS[name] || ''}</svg>`;

const sizeCache = new Map();
function imgSize(file) {
  if (sizeCache.has(file)) return sizeCache.get(file);
  let out = null;
  try {
    const b = fs.readFileSync(path.join(ROOT, file));
    const ext = path.extname(file).toLowerCase();
    if (ext === '.png') out = { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    else if (ext === '.jpg' || ext === '.jpeg') {
      let i = 2;
      while (i < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) { out = { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) }; break; }
        i += 2 + b.readUInt16BE(i + 2);
      }
    } else if (ext === '.webp') {
      const t = b.toString('ascii', 12, 16);
      if (t === 'VP8 ') out = { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
      else if (t === 'VP8L') { const v = b.readUInt32LE(21); out = { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 }; }
      else if (t === 'VP8X') out = { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    }
  } catch { /* fichier absent : pas de dimensions */ }
  sizeCache.set(file, out);
  return out;
}

// Mois FR/EN -> index, pour trier les contributions de la plus récente à la plus ancienne.
const MONTHS = { janvier: 0, jan: 0, january: 0, fevrier: 1, feb: 1, february: 1, mars: 2, mar: 2, march: 2, avril: 3, apr: 3, april: 3, mai: 4, may: 4, juin: 5, jun: 5, june: 5, juillet: 6, jul: 6, july: 6, aout: 7, aug: 7, august: 7, septembre: 8, sept: 8, sep: 8, september: 8, octobre: 9, oct: 9, october: 9, novembre: 10, nov: 10, november: 10, decembre: 11, dec: 11, december: 11 };
function dateRank(str) {
  if (!str) return 0;
  const parts = str.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/);
  return (parseInt(parts[parts.length - 1], 10) || 0) * 12 + (MONTHS[parts[0]] ?? 0);
}
const sortedArticles = (t) => t.articles.slice().sort((a, b) => dateRank(b.date) - dateRank(a.date));

// ---------- Adresses des pages ----------
const PATHS = (l) => ({
  home: l === 'fr' ? 'index.html' : 'en/index.html',
  work: l === 'fr' ? 'portfolio.html' : 'en/portfolio.html',
  articles: l === 'fr' ? 'contributions.html' : 'en/contributions.html',
  a11y: l === 'fr' ? 'accessibilite.html' : 'en/accessibility.html',
  project: (id) => (l === 'fr' ? `projets/${id}.html` : `en/projects/${id}.html`),
  article: (id) => (l === 'fr' ? `articles/${id}.html` : `en/articles/${id}.html`)
});
const pathFor = (lang, key) => {
  const P = PATHS(lang);
  if (key === 'home') return P.home;
  if (key === 'work') return P.work;
  if (key === 'articles') return P.articles;
  if (key === 'a11y') return P.a11y;
  if (key.startsWith('project:')) return P.project(key.slice(8));
  if (key.startsWith('article:')) return P.article(key.slice(8));
};
const relTo = (fromFile, toFile) => path.posix.relative(path.posix.dirname(fromFile), toFile) || path.posix.basename(toFile);

// ---------- Gabarit commun ----------
function layout(ctx, { title, description, key, mainClass = '', body }) {
  const { lang, file, t, u } = ctx;
  const up = (p) => '../'.repeat(file.split('/').length - 1) + p;
  const L = (to) => relTo(file, to);
  const P = PATHS(lang);
  const cur = (k) => (key === k ? ' aria-current="page"' : '');
  const other = lang === 'fr' ? 'en' : 'fr';
  const abs = (f) => SITE_URL + f;
  const frFile = pathFor('fr', key), enFile = pathFor('en', key);
  const langLink = (l) => `<li><a href="${L(pathFor(l, key))}" lang="${l}" hreflang="${l}"${l === lang ? ' aria-current="true"' : ''}><span aria-hidden="true">${l.toUpperCase()}</span><span class="sr-only">${u.langName[l]}</span></a></li>`;
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${h(title)}</title>
<meta name="description" content="${at(description)}">
<link rel="canonical" href="${abs(file)}">
<link rel="alternate" hreflang="fr" href="${abs(frFile)}">
<link rel="alternate" hreflang="en" href="${abs(enFile)}">
<link rel="alternate" hreflang="x-default" href="${abs(frFile)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="${u.locale}">
<meta property="og:title" content="${at(title)}">
<meta property="og:description" content="${at(description)}">
<meta property="og:url" content="${abs(file)}">
<link rel="icon" type="image/svg+xml" href="${up('images/web-favicon.svg')}">
<link rel="alternate icon" href="${up('images/web-favicon.png')}">
<link rel="preload" href="${up('fonts/roboto-latin-400-normal.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${up('css/style.css')}">
<script>document.documentElement.classList.add('js')</script>
</head>
<body>
<a class="skip-link" href="#main">${u.skip}</a>
<header class="site-header">
  <div class="header-inner">
    <a href="${L(P.home)}" class="logo"><img src="${up('images/web-logo.svg')}" alt="${at(u.logoAlt)}" width="77" height="40"></a>
    <nav class="main-nav" id="main-nav" aria-label="${at(u.navLabel)}">
      <ul role="list">
        <li><a href="${L(P.home)}#about">${h(t.nav.about)}</a></li>
        <li><a href="${L(P.work)}"${cur('work')}>${h(t.nav.work)}</a></li>
        <li><a href="${L(P.articles)}"${cur('articles')}>${h(t.nav.articles)}</a></li>
        <li><a href="${L(P.home)}#testimonials">${h(t.nav.testimonials)}</a></li>
        <li><a href="${L(P.home)}#contact">${h(t.nav.contact)}</a></li>
      </ul>
    </nav>
    <div class="header-actions">
      <ul class="lang-switch" role="list" aria-label="${at(u.langLabel)}">${langLink('fr')}${langLink('en')}</ul>
      <button type="button" class="menu-toggle" id="menu-toggle" aria-expanded="false" aria-controls="main-nav">${icon('menu')}<span class="sr-only">${u.menu}</span></button>
    </div>
  </div>
</header>
<main id="main" tabindex="-1"${mainClass ? ` class="${mainClass}"` : ''}>
${body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <a href="${L(P.home)}" class="logo flogo"><img src="${up('images/web-logo.svg')}" alt="${at(u.logoAlt)}" width="77" height="40"></a>
    <p>${h(t.footer.rights)}${t.footer.brand ? ' · ' + h(t.footer.brand) : ''} · ${h(t.footer.siret)} · <a href="${L(P.a11y)}"${cur('a11y')}>${u.declLink}</a></p>
  </div>
</footer>
<script src="${up('js/site.js')}" defer></script>
</body>
</html>
`;
}

// ---------- Briques réutilisables ----------
const ext = (ctx, url, label, extra = '') => `<a href="${at(url)}" target="_blank" rel="noopener">${extra}${h(label)}<span class="sr-only"> ${ctx.u.newWindow}</span></a>`;
const tagList = (tags, cls = 'tags') => `<ul class="${cls}" role="list">${tags.map((tg) => `<li class="tag">${h(tg)}</li>`).join('')}</ul>`;
const sectionHead = (id, kicker, accent, after = '') => `<div class="section-head"><h2 class="big" id="${id}">${h(kicker)} <span class="accent">${h(accent)}</span>${after ? ' ' + h(after) : ''}</h2></div>`;

function imgTag(ctx, src, alt, { lazy = true, cls = '', w, h: hh, priority = false } = {}) {
  const up = '../'.repeat(ctx.file.split('/').length - 1);
  const dim = imgSize(src) || (w && hh ? { w, h: hh } : null);
  return `<img${cls ? ` class="${cls}"` : ''} src="${up}${at(src)}" alt="${at(alt || '')}"${dim ? ` width="${dim.w}" height="${dim.h}"` : ''}${priority ? ' fetchpriority="high"' : ` loading="${lazy ? 'lazy' : 'eager'}"`} decoding="async">`;
}
let videoSeq = 0;
// GIF animé (lecture automatique, boucle infinie, > 5 s) -> vidéo avec commandes, sans lecture automatique
// (WCAG 2.2.2 / RGAA 13.8) et ~90 % plus légère. Les fichiers .mp4 / .webm / -poster.webp sont dans images/.
function video(ctx, img) {
  const up = '../'.repeat(ctx.file.split('/').length - 1);
  const base = img.src.replace(/\.gif$/i, '');
  const id = `vid-cap-${++videoSeq}`;
  return `<figure class="project-figure"><video controls muted playsinline preload="none" poster="${up}${at(base)}-poster.webp" width="${img.w || 400}" height="${img.h || 400}" aria-label="${at(img.alt)}"${img.caption ? ` aria-describedby="${id}"` : ''}><source src="${up}${at(base)}.webm" type="video/webm"><source src="${up}${at(base)}.mp4" type="video/mp4"><p>${ctx.u.videoFallback} <a href="${up}${at(base)}.mp4">${ctx.u.videoDownload}</a></p></video>${img.caption ? `<figcaption id="${id}">${h(img.caption)}</figcaption>` : ''}</figure>`;
}
function figure(ctx, img) {
  if (!img) return '';
  if (Array.isArray(img)) return `<div class="figure-gallery">${img.map((i) => figure(ctx, i)).join('')}</div>`;
  if (typeof img === 'string') return '';
  if (/\.gif$/i.test(img.src)) return video(ctx, img);
  return `<figure class="project-figure">${imgTag(ctx, img.src, img.alt, { w: img.w, h: img.h })}${img.caption ? `<figcaption>${h(img.caption)}</figcaption>` : ''}</figure>`;
}

function projectCard(ctx, p, level) {
  const { file, lang } = ctx;
  const cover = p.coverImage ? `<div class="thumb">${imgTag(ctx, p.coverImage.src, '', { w: 1600, h: 900 })}</div>` : `<div class="thumb">${h(p.company)}</div>`;
  return `<li><article class="project-card">
  ${cover}
  <div class="body">
    <p class="status">${h(p.status)}</p>
    <h${level} class="title"><a class="stretched" href="${relTo(file, PATHS(lang).project(p.id))}">${h(p.title)}</a></h${level}>
    <p class="company">${h(p.subtitle)}</p>
    ${tagList(p.tags)}
  </div>
</article></li>`;
}
function typeChip(ctx, a) {
  const labels = ctx.t.articlesSection.typeLabels || {};
  const type = a.type || 'article';
  return `<span class="tag type-chip type-chip-${at(type)}">${h(labels[type] || type)}</span>`;
}
function articleCard(ctx, a, level) {
  const { t, u, file, lang } = ctx;
  return `<li><article class="article-card">
  <div class="article-card-top"><p class="date">${h(a.date)}</p>${typeChip(ctx, a)}</div>
  <h${level}>${h(a.title)}</h${level}>
  <p class="excerpt">${h(a.excerpt)}</p>
  <p class="readmore"><a class="stretched" href="${relTo(file, PATHS(lang).article(a.id))}">${h(t.articlesSection.readMore)}<span class="sr-only">${u.readMoreSep}${h(a.title)}</span> ${icon('arrow_forward')}</a></p>
</article></li>`;
}
function testiCard(ctx, te) {
  const avatar = te.avatar ? `<img src="${at(te.avatar)}" alt="" width="34" height="34" decoding="async">` : h(te.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase());
  const name = te.linkedin ? ext(ctx, te.linkedin, te.name) : h(te.name);
  return `<li><figure class="testi-card">
  <blockquote class="quote">${paragraphs(te.quote)}</blockquote>
  <figcaption class="testi-person"><span class="avatar" aria-hidden="true">${avatar}</span><span><span class="name">${name}</span><span class="role">${h(te.role)}</span></span></figcaption>
</figure></li>`;
}
function breadcrumb(ctx, trail) {
  // trail : [{label, href?}] ; le dernier élément est la page courante
  return `<nav class="breadcrumb" aria-label="${at(ctx.u.breadcrumb)}"><ol>${trail.map((s, i) => (i === trail.length - 1 ? `<li aria-current="page">${h(s.label)}</li>` : `<li><a href="${s.href}">${h(s.label)}</a></li>`)).join('')}</ol></nav>`;
}

// ---------- Pages ----------
function homePage(ctx) {
  const { t, u, file, lang } = ctx;
  const P = PATHS(lang);
  const up = '../'.repeat(file.split('/').length - 1);
  const portrait = imgSize('images/web-portrait.png');
  const a = t.about;
  const quoteLang = lang === 'fr' ? ' lang="en"' : '';
  const body = `
<section class="hero" id="profile" aria-labelledby="hero-title">
  <div class="wrap">
    <div class="hero-grid">
      <div class="hero-photo">
        <div class="frame" aria-hidden="true"></div>
        <div class="photo-box"><img src="${up}images/web-portrait.png" alt="${at(u.portrait)}"${portrait ? ` width="${portrait.w}" height="${portrait.h}"` : ''} decoding="async"></div>
      </div>
      <div class="hero-text">
        <p class="greeting">${h(t.hero.greeting)}</p>
        <h1 class="hero-title" id="hero-title"><span class="sr-only">${u.hero}</span><span class="highlight">${h(t.hero.role)}</span></h1>
        <p class="hero-bio">${h(t.hero.bio)}</p>
        <div class="hero-ctas">
          <a class="btn btn-primary" href="#contact">${h(t.hero.ctaContact)}</a>
          <a class="btn btn-outline" href="${up}${at(t.hero.cvFile)}" target="_blank" rel="noopener">${icon('download')} ${h(t.hero.ctaCV)}<span class="sr-only"> ${u.pdfNew}</span></a>
        </div>
        <div class="follow">
          <p>${h(t.hero.follow)}</p>
          <ul role="list" aria-label="${at(u.followLabel)}">
            <li><a href="https://linkedin.com/in/estee-desanctis" target="_blank" rel="noopener" aria-label="LinkedIn ${u.newWindow}">in</a></li>
            <li><a href="https://www.behance.net/estee-desanctis/projects" target="_blank" rel="noopener" aria-label="Behance ${u.newWindow}">Be</a></li>
            <li><a href="https://www.figma.com/@esteedesanctis" target="_blank" rel="noopener" aria-label="Figma Community ${u.newWindow}">Fi</a></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</section>

<section id="about" class="alt" aria-labelledby="about-title">
  <div class="wrap">
    ${sectionHead('about-title', a.kicker, a.title)}
    <div class="about-grid">
      <div class="about-intro">${a.intro.map((p) => `<p>${h(p)}</p>`).join('')}</div>
      <div class="about-philosophy">${QUOTE_ICON}
        <blockquote class="philosophy-quote"${quoteLang}><p>${h(a.philosophy.quote)}</p></blockquote>
        ${a.philosophy.author ? `<p class="philosophy-author">— ${h(a.philosophy.author)}</p>` : ''}
        <p class="philosophy-sub">${h(a.philosophy.sub)}</p>
      </div>
    </div>
    <ul class="pillars-grid" role="list">
      ${a.pillars.map((p) => `<li class="pillar-card"><h3>${h(p.title)}</h3><p>${h(p.desc)}</p><p class="pillar-metric">${h(p.metric)}</p></li>`).join('\n      ')}
    </ul>
  </div>
</section>

<section id="why" aria-labelledby="why-title">
  <div class="wrap">
    ${sectionHead('why-title', t.whyHire.kicker, t.whyHire.title)}
    <ul class="skills-grid" role="list">
      ${t.whyHire.categories.map((c) => `<li class="skill-card"><div class="skill-head">${icon(c.icon, 'icon')}<h3>${h(c.title)}</h3></div>${tagList(c.tags, 'skill-tags')}</li>`).join('\n      ')}
    </ul>
  </div>
</section>

<section id="work" class="alt" aria-labelledby="work-title">
  <div class="wrap">
    ${sectionHead('work-title', t.projectsSection.kicker, t.projectsSection.title)}
    <ul class="projects-grid" role="list">
      ${t.projects.slice(0, 2).map((p) => projectCard(ctx, p, 3)).join('\n      ')}
    </ul>
    <p class="center-link"><a href="${relTo(file, P.work)}">${h(t.projectsSection.seeMore)} ${icon('arrow_forward')}</a></p>
  </div>
</section>

<section id="articles" aria-labelledby="articles-title">
  <div class="wrap">
    ${sectionHead('articles-title', t.articlesSection.kicker, t.articlesSection.title)}
    <ul class="articles-grid" role="list">
      ${sortedArticles(t).map((x) => articleCard(ctx, x, 3)).join('\n      ')}
    </ul>
    <p class="center-link"><a href="${relTo(file, P.articles)}">${h(t.articlesSection.seeAll)} ${icon('arrow_forward')}</a></p>
  </div>
</section>

<section id="testimonials" class="alt" aria-labelledby="testimonials-title">
  <div class="wrap">
    <div class="section-head"><h2 class="big" id="testimonials-title">${t.testimonialsSection.titleBefore ? h(t.testimonialsSection.titleBefore) + ' ' : ''}<span class="accent">${h(t.testimonialsSection.titleAccent)}</span>${t.testimonialsSection.titleAfter ? ' ' + h(t.testimonialsSection.titleAfter) : ''}</h2></div>
    <ul class="testi-grid" role="list">
      ${t.testimonials.map((te) => testiCard(ctx, te)).join('\n      ')}
    </ul>
    <p class="center-link">${ext(ctx, t.testimonialsSection.seeAllLink, t.testimonialsSection.seeAll)} · ${ext(ctx, t.testimonialsSection.seeAllLink2, t.testimonialsSection.seeAll2)}</p>
  </div>
</section>

${contactSection(ctx)}`;
  return layout(ctx, { title: t.meta.title, description: t.meta.description, key: 'home', body });
}

function contactSection(ctx) {
  const { t, u } = ctx;
  const c = t.contactSection;
  const item = (ic, label, value) => `<li class="item">${icon(ic, 'ico')}<div><span class="label">${h(label)}</span> <span class="value">${value}</span></div></li>`;
  return `<section id="contact" aria-labelledby="contact-title">
  <div class="wrap">
    ${sectionHead('contact-title', c.kicker, c.title)}
    <div class="contact-grid">
      <ul class="contact-info" role="list">
        ${item('mail', c.emailLabel, `<a href="mailto:${at(c.email)}">${h(c.email)}</a>`)}
        ${item('location_on', c.locationLabel, h(c.location))}
        ${item('calendar_month', c.availabilityLabel, h(c.availability))}
        ${item('language', c.languagesLabel, h(c.languages))}
      </ul>
      <div>
        <form id="contact-form" data-to="${at(c.email)}" data-subject="${at(u.mailSubject)}" data-l-surname="${at(u.labelSurname)}" data-l-name="${at(u.labelName)}" data-l-email="${at(u.labelEmail)}">
          <div class="form-row">
            <div class="field"><label for="cf-name">${h(c.form.name)}</label><input id="cf-name" name="given-name" type="text" autocomplete="given-name" placeholder="${at(c.form.namePlaceholder)}"></div>
            <div class="field"><label for="cf-surname">${h(c.form.surname)}</label><input id="cf-surname" name="family-name" type="text" autocomplete="family-name" placeholder="${at(c.form.surnamePlaceholder)}"></div>
          </div>
          <div class="field"><label for="cf-email">${h(c.form.email)} <span aria-hidden="true">*</span></label><input id="cf-email" name="email" type="email" required autocomplete="email" placeholder="${at(c.form.emailPlaceholder)}"></div>
          <div class="field"><label for="cf-project">${h(c.form.project)} <span aria-hidden="true">*</span></label><textarea id="cf-project" name="message" required placeholder="${at(c.form.projectPlaceholder)}"></textarea></div>
          <p class="form-hint" id="cf-hint">${h(u.formHint)}</p>
          <div class="form-submit"><button type="submit" class="btn btn-outline" aria-describedby="cf-hint">${icon('send')} ${h(c.form.send)}</button></div>
        </form>
        <noscript><p class="form-hint">${u.formNoJs} <a href="mailto:${at(c.email)}">${h(c.email)}</a>.</p></noscript>
      </div>
    </div>
  </div>
</section>`;
}

function listPage(ctx, kind) {
  const { t, file, lang } = ctx;
  const P = PATHS(lang);
  const isWork = kind === 'work';
  const sec = isWork ? t.projectsSection : t.articlesSection;
  const items = isWork ? t.projects.map((p) => projectCard(ctx, p, 2)) : sortedArticles(t).map((a) => articleCard(ctx, a, 2));
  const dl = isWork
    ? `<p class="portfolio-download"><a class="btn btn-outline" href="${'../'.repeat(file.split('/').length - 1)}${at(sec.portfolioFile)}" target="_blank" rel="noopener">${icon('picture_as_pdf')} ${h(sec.downloadPortfolio)}<span class="sr-only"> ${ctx.u.pdfNew}</span></a></p>`
    : '';
  const body = `
<section>
  <div class="wrap">
    <div class="page-hero">
      ${breadcrumb(ctx, [{ label: t.nav.home, href: relTo(file, P.home) }, { label: isWork ? t.nav.work : t.nav.articles }])}
      <h1 class="big">${h(sec.kicker)} <span class="accent">${h(sec.title)}</span></h1>
      ${dl}
    </div>
    <ul class="${isWork ? 'projects-grid' : 'articles-grid'}" role="list">
      ${items.join('\n      ')}
    </ul>
  </div>
</section>`;
  return layout(ctx, { title: `${isWork ? t.nav.work : t.nav.articles} — EcoDesign`, description: `${sec.kicker} ${sec.title}`, key: kind, body });
}

function projectPage(ctx, p) {
  const { t, u, file, lang } = ctx;
  const P = PATHS(lang);
  const qLang = lang === 'fr' ? ' lang="en"' : ''; // les citations de la méthodologie sont en anglais
  const stats = p.stats && p.stats.length
    ? `<h2 class="sub">${u.impact}</h2><ul class="stats-callouts" role="list">${p.stats.map((s) => `<li class="stat-callout"><span class="stat-value">${h(s.value)}</span><span class="stat-label">${h(s.label)}</span></li>`).join('')}</ul>${p.logosImage ? figure(ctx, p.logosImage) : ''}`
    : '';
  const steps = p.process.map((s) => `<li class="process-step"><span class="step-num" aria-hidden="true">${h(s.num || '')}</span><div><p class="step-label">${h(s.step)}</p><h3>${h(s.title)}</h3>${s.quote ? `<blockquote class="step-quote"${qLang}><p>“${h(s.quote.text)}”</p><cite>— ${h(s.quote.author)}</cite></blockquote>` : ''}${paragraphs(s.desc)}${s.image ? figure(ctx, s.image) : ''}</div></li>`).join('\n      ');
  const list = (arr) => `<ul class="side-list">${arr.map((r) => `<li>${h(r)}</li>`).join('')}</ul>`;
  const body = `
<section>
  <div class="wrap">
    ${breadcrumb(ctx, [{ label: t.nav.home, href: relTo(file, P.home) }, { label: t.nav.work, href: relTo(file, P.work) }, { label: p.company }])}
    <article>
      <header class="detail-hero">
        <p class="status">${h(p.status)}</p>
        <h1>${h(p.title)}</h1>
        <p class="subtitle">${h(p.subtitle)}</p>
        ${tagList(p.tags, 'detail-meta')}
      </header>
      ${p.coverImage ? `<div class="detail-cover">${imgTag(ctx, p.coverImage.src, p.coverImage.alt, { priority: true, w: 2100, h: 900 })}</div>` : `<div class="detail-cover">${h(p.company)}</div>`}
      <div class="detail-columns">
        <div class="main">
          <h2 class="sub">${u.challenge}</h2>
          ${paragraphs(p.challenge)}
          ${stats}
          <h2 class="sub">${u.method}</h2>
          <ol class="process" role="list">
      ${steps}
          </ol>
          <h2 class="sub">${u.results}</h2>
          <ul class="achievements" role="list">${(p.achievements || p.results).map((x) => `<li class="ach-item">${icon('check_circle')} ${h(x)}</li>`).join('')}</ul>
          ${p.resultsImage ? figure(ctx, p.resultsImage) : ''}
        </div>
        <aside class="side" aria-label="${at(u.details)}">
          <section class="block"><h2 class="side-title">${u.role}</h2>${list(p.role)}</section>
          <section class="block"><h2 class="side-title">${u.team}</h2>${list(p.team)}</section>
          <section class="block"><h2 class="side-title">${u.tools}</h2>${list(p.tools)}</section>
          ${p.links && p.links.length ? `<section class="block"><h2 class="side-title">${u.links}</h2><ul class="side-list links">${p.links.map((l) => `<li>${ext(ctx, l.url, l.label, '')} ${icon('open_in_new')}</li>`).join('')}</ul></section>` : ''}
        </aside>
      </div>
    </article>
    <p class="back"><a class="back-link" href="${relTo(file, P.work)}">${icon('arrow_back')} ${h(t.nav.work)}</a></p>
  </div>
</section>`;
  return layout(ctx, { title: `${p.title} — EcoDesign`, description: p.subtitle, key: 'project:' + p.id, body });
}

function articlePage(ctx, a) {
  const { t, file, lang } = ctx;
  const P = PATHS(lang);
  const body = `
<section>
  <div class="wrap">
    ${breadcrumb(ctx, [{ label: t.nav.home, href: relTo(file, P.home) }, { label: t.nav.articles, href: relTo(file, P.articles) }, { label: a.title }])}
    <article>
      <header class="detail-hero centered">
        <p class="status">${h(a.date)} · ${typeChip(ctx, a)}</p>
        <h1>${h(a.title)}</h1>
      </header>
      <div class="article-body"><p>${h(a.body).split('. ').join('. </p><p>')}</p></div>
      ${a.links && a.links.length ? `<p class="article-links">${a.links.map((l) => `<a class="btn btn-primary btn-sm" href="${at(l.url)}" target="_blank" rel="noopener">${h(l.label)}<span class="sr-only"> ${ctx.u.newWindow}</span> ${icon('open_in_new')}</a>`).join('')}</p>` : ''}
    </article>
    <p class="back"><a class="back-link" href="${relTo(file, P.articles)}">${icon('arrow_back')} ${h(t.nav.articles)}</a></p>
  </div>
</section>`;
  return layout(ctx, { title: `${a.title} — EcoDesign`, description: a.excerpt, key: 'article:' + a.id, body });
}

const DECL = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/declaration.json'), 'utf8'));
function declPage(ctx) {
  const { t, u, file, lang } = ctx;
  const P = PATHS(lang);
  const d = DECL[lang];
  const pageLinks = (l) => {
    const tt = CONTENT[l], PP = PATHS(l);
    const entries = [[tt.nav.home, PP.home], [tt.nav.work, PP.work], [tt.nav.articles, PP.articles],
      ...tt.projects.map((p) => [p.title, PP.project(p.id)]), ...sortedArticles(tt).map((a) => [a.title, PP.article(a.id)]), [UI[l].declLink, PP.a11y]];
    return `<h3 lang="${l}">${l === 'fr' ? u.pagesFr : u.pagesEn}</h3><ul class="decl-pages" lang="${l}">${entries.map(([label, f]) => `<li><a href="${relTo(file, f)}">${h(label)}${l !== lang ? `<span class="sr-only"> (${l === 'fr' ? 'français' : 'English'})</span>` : ''}</a></li>`).join('')}</ul>`;
  };
  const fill = (s) => s.replace('{{PAGES}}', pageLinks('fr') + pageLinks('en')).replace(/\{\{EMAIL\}\}/g, t.contactSection.email).replace(/\{\{NEWWIN\}\}/g, u.newWindow);
  const body = `
<section>
  <div class="wrap">
    ${breadcrumb(ctx, [{ label: t.nav.home, href: relTo(file, P.home) }, { label: d.title }])}
    <article class="decl">
      <header class="detail-hero centered"><h1>${h(d.title)}</h1></header>
      <p class="decl-lead">${h(d.lead)}</p>
      ${d.sections.map((sec) => `<section class="decl-section"><h2>${h(sec.h)}</h2>${fill(sec.body)}</section>`).join('\n      ')}
    </article>
    <p class="back"><a class="back-link" href="${relTo(file, P.home)}">${icon('arrow_back')} ${h(t.nav.home)}</a></p>
  </div>
</section>`;
  return layout(ctx, { title: d.navTitle, description: d.description, key: 'a11y', body });
}

// Anciennes adresses (portfolio-projet.html?id=… / contribution.html?id=…) : redirection + liste de secours sans JS.
function legacyPage(kind) {
  const isProject = kind === 'project';
  const ids = CONTENT.fr[isProject ? 'projects' : 'articles'].map((x) => x.id);
  const map = Object.fromEntries(ids.map((id) => [id, [PATHS('fr')[isProject ? 'project' : 'article'](id), PATHS('en')[isProject ? 'project' : 'article'](id)]]));
  const titleOf = (lang, id) => CONTENT[lang][isProject ? 'projects' : 'articles'].find((x) => x.id === id).title;
  const li = (lang) => ids.map((id) => `<li><a href="${map[id][lang === 'fr' ? 0 : 1]}" lang="${lang}">${h(titleOf(lang, id))}</a></li>`).join('');
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>EcoDesign — ${isProject ? 'Projet' : 'Contribution'}</title>
<meta name="robots" content="noindex">
<link rel="stylesheet" href="css/style.css">
<script>(function(){var id=new URLSearchParams(location.search).get('id'),lang='fr',m=${JSON.stringify(map)};try{if(localStorage.getItem('ed_lang')==='en')lang='en'}catch(e){}if(m[id])location.replace(m[id][lang==='en'?1:0])})()</script>
</head>
<body>
<main id="main" class="wrap legacy">
  <h1>${isProject ? 'Projet' : 'Contribution'}</h1>
  <p lang="fr">${UI.fr.moved} ${isProject ? UI.fr.pickProject : UI.fr.pickArticle}</p>
  <ul lang="fr">${li('fr')}</ul>
  <p lang="en">${UI.en.moved} ${isProject ? UI.en.pickProject : UI.en.pickArticle}</p>
  <ul lang="en">${li('en')}</ul>
</main>
</body>
</html>
`;
}

// ---------- Génération ----------
const written = [];
function write(file, content) {
  const target = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  written.push(file);
}
for (const lang of ['fr', 'en']) {
  const t = CONTENT[lang];
  const make = (file) => ({ lang, t, u: UI[lang], file });
  const P = PATHS(lang);
  write(P.home, homePage(make(P.home)));
  write(P.work, listPage(make(P.work), 'work'));
  write(P.articles, listPage(make(P.articles), 'articles'));
  write(P.a11y, declPage(make(P.a11y)));
  for (const p of t.projects) write(P.project(p.id), projectPage(make(P.project(p.id)), p));
  for (const a of t.articles) write(P.article(a.id), articlePage(make(P.article(a.id)), a));
}
write('portfolio-projet.html', legacyPage('project'));
write('contribution.html', legacyPage('article'));
// Anciennes adresses d'articles : contributions/ n'existait pas ; rien d'autre à rediriger.

const urls = written.filter((f) => !['portfolio-projet.html', 'contribution.html'].includes(f));
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.map((f) => `  <url><loc>${SITE_URL}${f}</loc></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}sitemap.xml\n`);
console.log(`${written.length} fichiers générés.`);
