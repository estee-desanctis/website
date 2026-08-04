// ===== EcoDesign site — main.js =====
// Toute la logique d'affichage. Le contenu texte vient de data/content.fr.js et data/content.en.js
// (variables window.CONTENT_FR et window.CONTENT_EN). Modifie ces fichiers pour changer le texte,
// ajouter un projet, un article ou un témoignage — pas besoin de toucher à ce fichier.

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
function stars(n){ return '★'.repeat(n) + '☆'.repeat(5-n); }
function initials(name){ return name.split(' ').map(function(w){return w[0];}).join('').slice(0,2).toUpperCase(); }

function renderHeader(){
  var t = T();
  var lang = getLang();
  var header = document.getElementById('site-header');
  if(!header) return;
  header.innerHTML =
    '<div class="header-inner">' +
      '<a href="index.html" class="logo"><img src="images/logo.png" alt="EcoDesign logo">EcoDesign</a>' +
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
        '<a class="btn btn-primary btn-sm" href="index.html#contact">'+t.nav.contactBtn+'</a>' +
        '<button class="menu-toggle" id="menu-toggle">☰</button>' +
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
      '<div class="flogo">EcoDesign</div>' +
      '<div>'+t.footer.rights+' · '+t.footer.siret+'</div>' +
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
            '<img src="images/portrait.jpg" alt="Estée Desanctis" onerror="this.style.display=\'none\';document.getElementById(\'photo-fallback\').style.display=\'flex\';">' +
            '<div class="photo-placeholder" id="photo-fallback" style="display:none;">Ta photo ici<br><small>(ajoute images/portrait.jpg)</small></div>' +
          '</div>' +
        '</div>' +
        '<div>' +
          '<div class="greeting">'+t.hero.greeting+'</div>' +
          '<div class="hero-title">'+t.hero.line1+' <span class="highlight">'+t.hero.role+'</span> '+t.hero.line2+'</div>' +
          '<span class="badge">'+t.hero.badge+'</span>' +
          '<p class="hero-bio">'+t.hero.bio+'</p>' +
          '<div class="hero-ctas">' +
            '<a class="btn btn-primary" href="#contact">'+t.hero.ctaContact+'</a>' +
            '<a class="btn btn-outline" href="'+t.hero.cvFile+'" target="_blank">⬇ '+t.hero.ctaCV+'</a>' +
          '</div>' +
          '<div class="follow">'+t.hero.follow+
            ' <a href="mailto:'+t.contactSection.email+'">✉</a>' +
            ' <a href="https://linkedin.com/in/estee-desanctis" target="_blank">in</a>' +
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
        '<div class="about-philosophy"><div class="quote-mark">“</div><p class="philosophy-quote">'+a.philosophy.quote+'</p><p class="philosophy-sub">'+a.philosophy.sub+'</p></div>' +
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
          return '<div class="skill-card"><div class="skill-head"><span class="icon">'+c.icon+'</span><h3>'+c.title+'</h3></div>' +
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
      '<div class="center-link"><a href="portfolio.html">'+t.projectsSection.seeMore+' →</a></div>';
  }

  var art = document.getElementById('articles-content');
  if(art){
    art.innerHTML =
      '<div class="section-head"><h2 class="big">'+t.articlesSection.kicker+' <span class="accent">'+t.articlesSection.title+'</span></h2></div>' +
      '<div class="articles-grid">' +
        t.articles.map(articleCard).join('') +
      '</div>' +
      '<div class="center-link"><a href="articles.html">'+t.articlesSection.seeAll+' →</a></div>';
  }

  var testi = document.getElementById('testimonials-content');
  if(testi){
    testi.innerHTML =
      '<div class="testimonials-title">'+t.testimonialsSection.title+'</div>' +
      '<div class="testi-grid">' +
        '<div class="stats-box">' +
          t.testimonialsSection.stats.map(function(s){
            return '<div class="stat-row">'+s.label+'<div class="stars">'+stars(s.stars)+'</div></div>';
          }).join('') +
        '</div>' +
        t.testimonials.map(testiCard).join('') +
      '</div>' +
      '<div class="center-link"><a href="index.html#testimonials">'+t.testimonialsSection.seeAll+' →</a></div>';
  }

  var contact = document.getElementById('contact-content');
  if(contact){
    var c = t.contactSection;
    contact.innerHTML =
      '<div class="section-head"><h2 class="big">'+c.kicker+' <span class="accent">'+c.title+'</span></h2></div>' +
      '<div class="contact-grid">' +
        '<div class="contact-info">' +
          infoItem('✉', c.emailLabel, c.email) +
          infoItem('📍', c.locationLabel, c.location) +
          infoItem('🗓', c.availabilityLabel, c.availability) +
          infoItem('🌐', c.languagesLabel, c.languages) +
        '</div>' +
        '<form id="contact-form">' +
          '<div class="form-row">' +
            '<div class="field"><label>'+c.form.surname+'</label><input type="text"></div>' +
            '<div class="field"><label>'+c.form.name+'</label><input type="text"></div>' +
          '</div>' +
          '<div class="field" style="margin-bottom:16px;"><label>'+c.form.email+'</label><input type="email" placeholder="'+c.form.emailPlaceholder+'"></div>' +
          '<div class="field" style="margin-bottom:16px;"><label>'+c.form.project+'</label><textarea placeholder="'+c.form.projectPlaceholder+'"></textarea></div>' +
          '<div class="form-submit"><button type="submit" class="btn btn-outline">✉ '+c.form.send+'</button></div>' +
        '</form>' +
      '</div>';

    document.getElementById('contact-form').addEventListener('submit', function(e){
      e.preventDefault();
      window.location.href = 'mailto:'+c.email+'?subject=Contact%20site%20EcoDesign';
    });
  }
}

function infoItem(icon,label,value){
  return '<div class="item"><span class="ico">'+icon+'</span><div><div class="label">'+label+'</div><div>'+value+'</div></div></div>';
}

function projectCard(p){
  return '<a class="project-card" href="portfolio-projet.html?id='+p.id+'">' +
    '<div class="thumb">'+p.company+'</div>' +
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
    '<div class="readmore">'+T().articlesSection.readMore+' →</div>' +
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
      '<h2 class="big">'+t.projectsSection.kicker+' <span class="accent">'+t.projectsSection.title+'</span></h2></div>' +
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
    '<div class="articles-grid">'+ t.articles.map(articleCard).join('') +'</div>';
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
    '<div class="detail-cover">'+p.company+'</div>' +
    '<div class="detail-columns">' +
      '<div class="main">' +
        '<h3 class="h3" style="margin-bottom:8px;">'+ (getLang()==='fr' ? 'Le défi' : 'The challenge') +'</h3>' +
        '<p>'+p.challenge+'</p>' +
        '<h3 class="h3" style="margin:28px 0 8px;">'+ (getLang()==='fr' ? 'Méthodologie' : 'Methodology') +'</h3>' +
        p.process.map(function(step){
          return '<div class="process-step numbered"><div class="step-num">'+(step.num||'')+'</div><div><div class="step-label">'+step.step+'</div><h3>'+step.title+'</h3><p>'+step.desc+'</p></div></div>';
        }).join('') +
        '<h3 class="h3" style="margin-bottom:8px;">'+ (getLang()==='fr' ? 'Résultats' : 'Results') +'</h3>' +
        (p.stats && p.stats.length ? '<div class="stats-callouts">'+ p.stats.map(function(s){
          return '<div class="stat-callout"><div class="stat-value">'+s.value+'</div><div class="stat-label">'+s.label+'</div></div>';
        }).join('') +'</div>' : '') +
        (p.achievements && p.achievements.length ? '<div class="achievements"><div class="ach-title">'+ (getLang()==='fr' ? 'Réussites clés' : 'Key achievements') +'</div>' +
          p.achievements.map(function(ac){ return '<div class="ach-item">✓ '+ac+'</div>'; }).join('') +
        '</div>' : '<div class="results-list">'+ p.results.map(function(r){return '<span class="res">'+r+'</span>';}).join('') +'</div>') +
      '</div>' +
      '<div class="side">' +
        '<div class="block"><h3>'+ (getLang()==='fr'?'Mon rôle':'My role') +'</h3><ul>'+ p.role.map(function(r){return '<li>• '+r+'</li>';}).join('') +'</ul></div>' +
        '<div class="block"><h3>'+ (getLang()==='fr'?'Équipe':'Team') +'</h3><ul>'+ p.team.map(function(r){return '<li>• '+r+'</li>';}).join('') +'</ul></div>' +
        '<div class="block"><h3>'+ (getLang()==='fr'?'Outils':'Tools') +'</h3><ul>'+ p.tools.map(function(r){return '<li>• '+r+'</li>';}).join('') +'</ul></div>' +
      '</div>' +
    '</div>' +
    '<div style="text-align:center;"><a class="back-link" href="portfolio.html">← '+t.nav.work+'</a></div>';
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
      return '<a class="btn btn-primary btn-sm" href="'+l.url+'" target="_blank" rel="noopener">'+l.label+' ↗</a>';
    }).join('') +'</div>' : '') +
    '<div style="text-align:center;"><a class="back-link" href="articles.html">← '+t.nav.articles+'</a></div>';
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
