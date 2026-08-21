// ===== EcoDesign site — main.js =====
// Toute la logique d'affichage. Le contenu texte vient de data/content.fr.js et data/content.en.js
// (variables window.CONTENT_FR et window.CONTENT_EN). Modifie ces fichiers pour changer le texte,
// ajouter un projet, un article ou un témoignage — pas besoin de toucher à ce fichier.

// Page externe (Malt) listant tous les avis clients.
var TESTIMONIALS_URL = 'https://www.malt.fr/profile/esteedesanctis#appraisals-section';

function getLang(){
  var saved = localStorage.getItem('ed_lang');
  if(saved === 'fr' || saved === 'en') return saved;
  return 'fr';
}
function setLang(l){ localStorage.setItem('ed_lang', l); render(); }
function T(){ return getLang() === 'en' ? window.CONTENT_EN : window.CONTENT_FR; }

function qs(name){
  var params = new URLSearchParams(window.location.search);
  return params.get(name);
}
function el(html){
  var d = document.createElement('div');
  d.innerHTML = html.trim();
  return d.firstChild;
}
// Icônes en SVG inline (pas de police externe à charger : léger et fiable).
var ICONS = {
  star: '<path d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5 6.1 20.7l1.2-6.6-4.8-4.6 6.6-.9L12 2.5z"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  download: '<path d="M12 3v11"/><path d="M7 10l5 5 5-5"/><path d="M4 20h16"/>',
  groups: '<circle cx="9" cy="8" r="3"/><path d="M3.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6"/><circle cx="17" cy="9" r="2.4" fill="none"/><path d="M15.6 14.3c2.2.5 4.1 2.4 4.1 5.7"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  palette: '<path d="M12 3a9 9 0 100 18c1.3 0 2-.9 2-1.9 0-.5-.2-.9-.5-1.3-.3-.4-.5-.8-.5-1.2 0-.9.7-1.6 1.6-1.6H16a5 5 0 005-5c0-3.9-4-7-9-7z"/><circle cx="8" cy="11.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="8.7" cy="7.7" r="1.1" fill="currentColor" stroke="none"/><circle cx="12.8" cy="6.6" r="1.1" fill="currentColor" stroke="none"/><circle cx="16.2" cy="8.7" r="1.1" fill="currentColor" stroke="none"/>',
  smart_toy: '<rect x="5" y="9" width="14" height="10" rx="2"/><path d="M12 5v4M9 3.2h6"/><circle cx="9.5" cy="14" r="1.1" fill="currentColor" stroke="none"/><circle cx="14.5" cy="14" r="1.1" fill="currentColor" stroke="none"/><path d="M2 12.5v4M22 12.5v4"/>',
  eco: '<path d="M19.5 4.5C10 4.5 4.5 10.3 4.5 18c0 .6 0 1.1.1 1.5H8c7.8 0 13.5-5.9 13.5-13.5 0-.5 0-1-.1-1.5z"/><path d="M6.5 19.5c2-5 6-9 12-11"/>',
  build: '<path d="M14.9 6.4a4 4 0 00-5.6 5.2L4 17l3 3 5.4-5.3a4 4 0 005.2-5.6l-2.7 2.7-2-2 2.7-2.7z"/>',
  arrow_forward: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
  send: '<path d="M3 11.2L21 3l-8.2 18-2-8-7.8-1.8z"/>',
  picture_as_pdf: '<path d="M6 2h8l5 5v15H6z"/><path d="M14 2v5h5"/><path d="M9 13.5h6M9 17h6"/>',
  check_circle: '<circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.6 2.6L16 9.5"/>',
  arrow_back: '<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>',
  open_in_new: '<path d="M14 3h7v7"/><path d="M21 3l-9 9"/><path d="M19 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  location_on: '<path d="M12 21s7-7.4 7-12.4a7 7 0 10-14 0C5 13.6 12 21 12 21z"/><circle cx="12" cy="8.8" r="2.3"/>',
  calendar_month: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  language: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.6 4 6 4 9s-1.5 6.4-4 9c-2.5-2.6-4-6-4-9s1.5-6.4 4-9z"/>'
};
function icon(name, extraClass){
  var inner = ICONS[name] || '';
  return '<svg class="icon-svg'+(extraClass?' '+extraClass:'')+'" aria-hidden="true" viewBox="0 0 24 24">'+inner+'</svg>';
}
function stars(n){
  var out = '';
  for(var i=0;i<5;i++){ out += icon('star', 'star-ico'+(i<n?' filled':'')); }
  return out;
}
function initials(name){ return name.split(' ').map(function(w){return w[0];}).join('').slice(0,2).toUpperCase(); }
// Guillemet de citation en SVG inline (plutôt que la police d'icônes) : s'affiche
// toujours correctement, même si la police externe ne charge pas, et évite une requête réseau.
var QUOTE_ICON = '<svg class="quote-mark" viewBox="0 0 32 24" fill="none" aria-hidden="true" focusable="false"><path d="M0 24V14.4C0 9.6 1.2 6 3.6 3.6C6 1.2 9.2 0 13.2 0V4.8C10.8 4.8 9 5.6 7.8 7.2C6.6 8.8 6 10.8 6 13.2H12V24H0ZM18.8 24V14.4C18.8 9.6 20 6 22.4 3.6C24.8 1.2 28 0 32 0V4.8C29.6 4.8 27.8 5.6 26.6 7.2C25.4 8.8 24.8 10.8 24.8 13.2H30.8V24H18.8Z" fill="currentColor"/></svg>';

// Placeholder visuel (SVG inline, pas de police externe) affiché sur les pages projet tant qu'une
// vraie image n'a pas été déposée dans /images et référencée à la place de ce bloc.
var IMAGE_PLACEHOLDER_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5-4 4-3-3-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function imgPlaceholder(caption){
  return '<div class="img-placeholder">'+IMAGE_PLACEHOLDER_ICON+'<span>[image à insérer : '+caption+']</span></div>';
}
// Découpe un texte en paragraphes sur les doubles retours à la ligne ("\n\n"),
// pour les blocs de contenu projet un peu longs (défi, étapes de méthodologie).
function paragraphs(text){
  return (text||'').split('\n\n').map(function(p){ return '<p>'+p+'</p>'; }).join('');
}
// Renders a real project screenshot with an accessible caption, or falls back
// to the text placeholder when only a caption string (no image yet) is given.
function projectFigure(img){
  if(!img) return '';
  if(Array.isArray(img)) return img.map(projectFigure).join('');
  if(typeof img === 'string') return imgPlaceholder(img);
  return '<figure class="project-figure"><img src="'+img.src+'" alt="'+(img.alt||'')+'" width="'+(img.w||'')+'" height="'+(img.h||'')+'" loading="lazy" decoding="async">' +
    (img.caption ? '<figcaption>'+img.caption+'</figcaption>' : '') +
  '</figure>';
}

// Trie les articles du plus récent au plus ancien à partir de leur date texte ("Avril 2024", "November 2025"...).
var MONTHS_INDEX = {
  janvier:0, jan:0, january:0,
  fevrier:1, février:1, feb:1, february:1,
  mars:2, mar:2, march:2,
  avril:3, apr:3, april:3,
  mai:4, may:4,
  juin:5, jun:5, june:5,
  juillet:6, jul:6, july:6,
  aout:7, août:7, aug:7, august:7,
  septembre:8, sept:8, sep:8, september:8,
  octobre:9, oct:9, october:9,
  novembre:10, nov:10, november:10,
  decembre:11, décembre:11, dec:11, december:11
};
function parseArticleDate(str){
  if(!str) return 0;
  var norm = str.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  var parts = norm.split(/\s+/);
  var year = parseInt(parts[parts.length-1], 10) || 0;
  var month = MONTHS_INDEX[parts[0]];
  return year * 12 + (month === undefined ? 0 : month);
}
function sortedArticles(t){
  return t.articles.slice().sort(function(a,b){ return parseArticleDate(b.date) - parseArticleDate(a.date); });
}

function renderHeader(){
  var t = T();
  var lang = getLang();
  var header = document.getElementById('site-header');
  if(!header) return;
  header.innerHTML =
    '<div class="header-inner">' +
      '<a href="index.html" class="logo"><img src="images/web-logo.png" alt="EcoDesign — '+t.nav.home+'"></a>' +
      '<nav class="main-nav" id="main-nav"><ul>' +
        '<li><a href="index.html#about">'+t.nav.about+'</a></li>' +
        '<li><a href="portfolio.html">'+t.nav.work+'</a></li>' +
        '<li><a href="articles.html">'+t.nav.articles+'</a></li>' +
        '<li><a href="index.html#testimonials">'+t.nav.testimonials+'</a></li>' +
        '<li><a href="index.html#contact">'+t.nav.contact+'</a></li>' +
      '</ul></nav>' +
      '<div class="header-actions">' +
        '<div class="lang-switch">' +
          '<button data-lang="fr" class="'+(lang==='fr'?'active':'')+'">FR</button>' +
          '<button data-lang="en" class="'+(lang==='en'?'active':'')+'">EN</button>' +
        '</div>' +
        '<button class="menu-toggle" id="menu-toggle" aria-label="Menu">'+icon('menu')+'</button>' +
      '</div>' +
    '</div>';

  header.querySelectorAll('[data-lang]').forEach(function(b){
    b.addEventListener('click', function(){ setLang(b.dataset.lang); });
  });
  var toggle = document.getElementById('menu-toggle');
  var nav = document.getElementById('main-nav');
  if(toggle){ toggle.addEventListener('click', function(){ nav.classList.toggle('open'); }); }
}

function renderFooter(){
  var t = T();
  var footer = document.getElementById('site-footer');
  if(!footer) return;
  footer.innerHTML =
    '<div class="wrap">' +
      '<a href="index.html" class="flogo"><img src="images/web-logo.png" alt="EcoDesign — '+t.nav.home+'"></a>' +
      '<div>'+t.footer.rights+(t.footer.brand ? ' · '+t.footer.brand : '')+' · '+t.footer.siret+'</div>' +
    '</div>';
}

// ---------- HOME ----------
function renderHome(){
  var t = T();
  document.title = t.meta.title;

  var hero = document.getElementById('hero-content');
  if(hero){
    hero.innerHTML =
      '<div class="hero-grid">' +
        '<div class="hero-photo">' +
          '<div class="frame"></div>' +
          '<div class="photo-box">' +
            '<img src="images/web-portrait.png" alt="Estée Desanctis" onerror="this.style.display=\'none\';document.getElementById(\'photo-fallback\').style.display=\'flex\';">' +
            '<div class="photo-placeholder" id="photo-fallback" style="display:none;">Ta photo ici<br><small>(ajoute images/web-portrait.png)</small></div>' +
          '</div>' +
        '</div>' +
        '<div>' +
          '<div class="greeting">'+t.hero.greeting+'</div>' +
          '<div class="hero-title"><span class="highlight">'+t.hero.role+'</span></div>' +
          '<p class="hero-bio">'+t.hero.bio+'</p>' +
          '<div class="hero-ctas">' +
            '<a class="btn btn-primary" href="#contact">'+t.hero.ctaContact+'</a>' +
            '<a class="btn btn-outline" href="'+t.hero.cvFile+'" target="_blank">'+icon('download')+' '+t.hero.ctaCV+'</a>' +
          '</div>' +
          '<div class="follow">'+t.hero.follow+
            ' <a href="https://linkedin.com/in/estee-desanctis" target="_blank" aria-label="LinkedIn">in</a>' +
            ' <a href="https://www.behance.net/estee-desanctis/projects" target="_blank" aria-label="Behance">Be</a>' +
            ' <a href="https://www.figma.com/@esteedesanctis" target="_blank" aria-label="Figma Community">Fi</a>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  var about = document.getElementById('about-content');
  if(about && t.about){
    var a = t.about;
    about.innerHTML =
      '<div class="section-head"><h2 class="big">'+a.kicker+' <span class="accent">'+a.title+'</span></h2></div>' +
      '<div class="about-grid">' +
        '<div class="about-intro">' + a.intro.map(function(p){ return '<p>'+p+'</p>'; }).join('') + '</div>' +
        '<div class="about-philosophy">'+QUOTE_ICON+'<p class="philosophy-quote">'+a.philosophy.quote+'</p>'+
          (a.philosophy.author ? '<p class="philosophy-author">— '+a.philosophy.author+'</p>' : '')+
          '<p class="philosophy-sub">'+a.philosophy.sub+'</p></div>' +
      '</div>' +
      '<div class="pillars-grid">' +
        a.pillars.map(function(p){
          return '<div class="pillar-card"><h3>'+p.title+'</h3><p>'+p.desc+'</p><div class="pillar-metric">'+p.metric+'</div></div>';
        }).join('') +
      '</div>';
  }

  var why = document.getElementById('why-content');
  if(why){
    why.innerHTML =
      '<div class="section-head"><h2 class="big">'+t.whyHire.kicker+' <span class="accent">'+t.whyHire.title+'</span> ?</h2></div>' +
      '<div class="skills-grid">' +
        t.whyHire.categories.map(function(c){
          return '<div class="skill-card"><div class="skill-head">'+icon(c.icon,'icon')+'<h3>'+c.title+'</h3></div>' +
            '<div class="skill-tags">'+ c.tags.map(function(tg){ return '<span class="tag">'+tg+'</span>'; }).join('') +'</div></div>';
        }).join('') +
      '</div>';
  }

  var proj = document.getElementById('projects-content');
  if(proj){
    proj.innerHTML =
      '<div class="section-head"><h2 class="big">'+t.projectsSection.kicker+' <span class="accent">'+t.projectsSection.title+'</span></h2></div>' +
      '<div class="projects-grid">' +
        t.projects.map(projectCard).join('') +
      '</div>' +
      '<div class="center-link"><a href="portfolio.html">'+t.projectsSection.seeMore+' '+icon('arrow_forward')+'</a></div>';
  }

  var art = document.getElementById('articles-content');
  if(art){
    art.innerHTML =
      '<div class="section-head"><h2 class="big">'+t.articlesSection.kicker+' <span class="accent">'+t.articlesSection.title+'</span></h2></div>' +
      '<div class="articles-grid">' +
        sortedArticles(t).map(articleCard).join('') +
      '</div>' +
      '<div class="center-link"><a href="articles.html">'+t.articlesSection.seeAll+' '+icon('arrow_forward')+'</a></div>';
  }

  var testi = document.getElementById('testimonials-content');
  if(testi){
    testi.innerHTML =
      '<div class="testimonials-title">'+t.testimonialsSection.title+'</div>' +
      '<div class="testi-grid">' +
        '<div class="stats-box">' +
          t.testimonialsSection.stats.map(function(s){
            return '<div class="stat-row">'+s.label+'<div class="stars" role="img" aria-label="'+s.stars+'/5">'+stars(s.stars)+'</div></div>';
          }).join('') +
        '</div>' +
        t.testimonials.map(testiCard).join('') +
      '</div>' +
      '<div class="center-link"><a href="'+TESTIMONIALS_URL+'" target="_blank" rel="noopener">'+t.testimonialsSection.seeAll+' '+icon('arrow_forward')+'</a></div>';
  }

  var contact = document.getElementById('contact-content');
  if(contact){
    var c = t.contactSection;
    contact.innerHTML =
      '<div class="section-head"><h2 class="big">'+c.kicker+' <span class="accent">'+c.title+'</span></h2></div>' +
      '<div class="contact-grid">' +
        '<div class="contact-info">' +
          infoItem('mail', c.emailLabel, c.email) +
          infoItem('location_on', c.locationLabel, c.location) +
          infoItem('calendar_month', c.availabilityLabel, c.availability) +
          infoItem('language', c.languagesLabel, c.languages) +
        '</div>' +
        '<form id="contact-form">' +
          '<div class="form-row">' +
            '<div class="field"><label for="cf-surname">'+c.form.surname+'</label><input id="cf-surname" type="text" placeholder="'+c.form.surnamePlaceholder+'"></div>' +
            '<div class="field"><label for="cf-name">'+c.form.name+'</label><input id="cf-name" type="text" placeholder="'+c.form.namePlaceholder+'"></div>' +
          '</div>' +
          '<div class="field" style="margin-bottom:16px;"><label for="cf-email">'+c.form.email+'</label><input id="cf-email" type="email" placeholder="'+c.form.emailPlaceholder+'"></div>' +
          '<div class="field" style="margin-bottom:16px;"><label for="cf-project">'+c.form.project+'</label><textarea id="cf-project" placeholder="'+c.form.projectPlaceholder+'"></textarea></div>' +
          '<div class="form-submit"><button type="submit" class="btn btn-outline">'+icon('send')+' '+c.form.send+'</button></div>' +
        '</form>' +
      '</div>';

    document.getElementById('contact-form').addEventListener('submit', function(e){
      e.preventDefault();
      var isFr = getLang() === 'fr';
      var surname = document.getElementById('cf-surname').value;
      var name = document.getElementById('cf-name').value;
      var senderEmail = document.getElementById('cf-email').value;
      var project = document.getElementById('cf-project').value;
      var subject = isFr ? 'Contact site EcoDesign' : 'EcoDesign website contact';
      var bodyLines = [
        (isFr ? 'Nom : ' : 'Surname: ') + surname,
        (isFr ? 'Prénom : ' : 'Name: ') + name,
        (isFr ? 'Email : ' : 'Email: ') + senderEmail,
        '',
        project
      ];
      // Ouvre Gmail (composition web) plutôt que le client mail par défaut du système.
      var gmailUrl = 'https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(c.email)+
        '&su='+encodeURIComponent(subject)+'&body='+encodeURIComponent(bodyLines.join('\n'));
      window.open(gmailUrl, '_blank', 'noopener');
    });
  }
}

function infoItem(iconName,label,value){
  return '<div class="item">'+icon(iconName,'ico')+'<div><div class="label">'+label+'</div><div>'+value+'</div></div></div>';
}

function projectCard(p){
  return '<a class="project-card" href="portfolio-projet.html?id='+p.id+'">' +
    '<div class="thumb">'+ (p.coverImage ? '<img src="'+p.coverImage.src+'" alt="" loading="lazy" decoding="async">' : p.company) +'</div>' +
    '<div class="body">' +
      '<div class="status">'+p.status+'</div>' +
      '<h3 class="title">'+p.title+'</h3>' +
      '<div class="company">'+p.subtitle+'</div>' +
      '<div class="tags">'+p.tags.map(function(tg){return '<span class="tag">'+tg+'</span>';}).join('')+'</div>' +
    '</div>' +
  '</a>';
}

function articleCard(a){
  return '<a class="article-card" href="articles-article.html?id='+a.id+'">' +
    '<div class="date">'+a.date+'</div>' +
    '<h3>'+a.title+'</h3>' +
    '<p>'+a.excerpt+'</p>' +
    '<div class="readmore">'+T().articlesSection.readMore+' '+icon('arrow_forward')+'</div>' +
  '</a>';
}

function testiCard(te){
  return '<div class="testi-card">' +
    '<p class="quote">“'+te.quote+'”</p>' +
    '<div class="testi-person">' +
      '<div class="avatar">'+initials(te.name)+'</div>' +
      '<div><div class="name">'+te.name+'</div><div class="role">'+te.role+'</div></div>' +
    '</div>' +
  '</div>';
}

// ---------- PORTFOLIO LIST ----------
function renderPortfolioList(){
  var t = T();
  document.title = t.projectsSection.title + ' — EcoDesign';
  var el2 = document.getElementById('list-content');
  el2.innerHTML =
    '<div class="page-hero"><div class="breadcrumb"><a href="index.html">'+t.nav.home+'</a> / '+t.nav.work+'</div>' +
      '<h2 class="big">'+t.projectsSection.kicker+' <span class="accent">'+t.projectsSection.title+'</span></h2>' +
      '<div class="portfolio-download"><a class="btn btn-outline" href="'+t.projectsSection.portfolioFile+'" target="_blank">'+icon('picture_as_pdf')+' '+t.projectsSection.downloadPortfolio+'</a></div>' +
    '</div>' +
    '<div class="projects-grid">'+ t.projects.map(projectCard).join('') +'</div>';
}

// ---------- ARTICLES LIST ----------
function renderArticlesList(){
  var t = T();
  document.title = t.articlesSection.title + ' — EcoDesign';
  var el2 = document.getElementById('list-content');
  el2.innerHTML =
    '<div class="page-hero"><div class="breadcrumb"><a href="index.html">'+t.nav.home+'</a> / '+t.nav.articles+'</div>' +
      '<h2 class="big">'+t.articlesSection.kicker+' <span class="accent">'+t.articlesSection.title+'</span></h2></div>' +
    '<div class="articles-grid">'+ sortedArticles(t).map(articleCard).join('') +'</div>';
}

// ---------- PROJECT DETAIL ----------
function renderProjectDetail(){
  var t = T();
  var id = qs('id');
  var p = t.projects.find(function(x){ return x.id === id; }) || t.projects[0];
  document.title = p.title + ' — EcoDesign';
  var c = document.getElementById('detail-content');
  c.innerHTML =
    '<div class="breadcrumb"><a href="index.html">'+t.nav.home+'</a> / <a href="portfolio.html">'+t.nav.work+'</a> / '+p.company+'</div>' +
    '<div class="detail-hero">' +
      '<div class="status">'+p.status+'</div>' +
      '<h1>'+p.title+'</h1>' +
      '<p style="color:#666;max-width:640px;">'+p.subtitle+'</p>' +
      '<div class="detail-meta">'+ p.tags.map(function(tg){return '<span class="tag">'+tg+'</span>';}).join('') +'</div>' +
    '</div>' +
    (p.coverImage ? '<div class="detail-cover"><img src="'+p.coverImage.src+'" alt="'+(p.coverImage.alt||'')+'" loading="lazy" decoding="async"></div>' : '<div class="detail-cover">'+p.company+'</div>') +
    '<div class="detail-columns">' +
      '<div class="main">' +
        '<h3 class="h3" style="margin-bottom:8px;">'+ (getLang()==='fr' ? 'Le défi' : 'The challenge') +'</h3>' +
        paragraphs(p.challenge) +
        (p.stats && p.stats.length ? '<h3 class="h3" style="margin:24px 0 8px;">'+ (getLang()==='fr' ? "L'impact en chiffres" : 'The impact, in numbers') +'</h3><div class="stats-callouts">'+ p.stats.map(function(s){
          return '<div class="stat-callout"><div class="stat-value">'+s.value+'</div><div class="stat-label">'+s.label+'</div></div>';
        }).join('') +'</div>' + (p.logosImage ? projectFigure(p.logosImage) : '') : '') +
        '<h3 class="h3" style="margin:28px 0 8px;">'+ (getLang()==='fr' ? 'Méthodologie' : 'Methodology') +'</h3>' +
        p.process.map(function(step){
          return '<div class="process-step numbered"><div class="step-num">'+(step.num||'')+'</div><div><div class="step-label">'+step.step+'</div><h3>'+step.title+'</h3>'+
            (step.quote ? '<blockquote class="step-quote">“'+step.quote.text+'”<cite>— '+step.quote.author+'</cite></blockquote>' : '')+
            paragraphs(step.desc)+ (step.image ? projectFigure(step.image) : '') +'</div></div>';
        }).join('') +
        '<h3 class="h3" style="margin-bottom:8px;">'+ (getLang()==='fr' ? 'Résultats' : 'Results') +'</h3>' +
        '<div class="achievements">' +
          (p.achievements || p.results).map(function(ac){ return '<span class="ach-item">'+icon('check_circle')+' '+ac+'</span>'; }).join('') +
        '</div>' +
        (p.resultsImage ? projectFigure(p.resultsImage) : '') +
      '</div>' +
      '<div class="side">' +
        '<div class="block"><h3>'+ (getLang()==='fr'?'Mon rôle':'My role') +'</h3><ul>'+ p.role.map(function(r){return '<li>• '+r+'</li>';}).join('') +'</ul></div>' +
        '<div class="block"><h3>'+ (getLang()==='fr'?'Équipe':'Team') +'</h3><ul>'+ p.team.map(function(r){return '<li>• '+r+'</li>';}).join('') +'</ul></div>' +
        '<div class="block"><h3>'+ (getLang()==='fr'?'Outils':'Tools') +'</h3><ul>'+ p.tools.map(function(r){return '<li>• '+r+'</li>';}).join('') +'</ul></div>' +
      '</div>' +
    '</div>' +
    '<div style="text-align:center;"><a class="back-link" href="portfolio.html">'+icon('arrow_back')+' '+t.nav.work+'</a></div>';
}

// ---------- ARTICLE DETAIL ----------
function renderArticleDetail(){
  var t = T();
  var id = qs('id');
  var a = t.articles.find(function(x){ return x.id === id; }) || t.articles[0];
  document.title = a.title + ' — EcoDesign';
  var c = document.getElementById('detail-content');
  c.innerHTML =
    '<div class="breadcrumb"><a href="index.html">'+t.nav.home+'</a> / <a href="articles.html">'+t.nav.articles+'</a></div>' +
    '<div class="detail-hero" style="text-align:center;">' +
      '<div class="status" style="text-align:center;">'+a.date+'</div>' +
      '<h1 style="text-align:center;">'+a.title+'</h1>' +
    '</div>' +
    '<div class="article-body"><p>'+a.body.split('. ').join('. </p><p>')+'</p></div>' +
    (a.links && a.links.length ? '<div class="article-links">'+ a.links.map(function(l){
      return '<a class="btn btn-primary btn-sm" href="'+l.url+'" target="_blank" rel="noopener">'+l.label+' '+icon('open_in_new')+'</a>';
    }).join('') +'</div>' : '') +
    '<div style="text-align:center;"><a class="back-link" href="articles.html">'+icon('arrow_back')+' '+t.nav.articles+'</a></div>';
}

function render(){
  renderHeader();
  renderFooter();
  var page = document.body.dataset.page;
  if(page === 'home') renderHome();
  if(page === 'portfolio-list') renderPortfolioList();
  if(page === 'articles-list') renderArticlesList();
  if(page === 'portfolio-detail') renderProjectDetail();
  if(page === 'articles-detail') renderArticleDetail();
}

document.addEventListener('DOMContentLoaded', render);
