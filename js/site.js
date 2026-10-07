// js/site.js — amélioration progressive (le site reste lisible et navigable sans ce fichier).
// 1) Menu mobile : bouton avec aria-expanded, fermeture par Échap / clic sur un lien, fond rendu inerte.
// 2) Formulaire de contact : ouvre la rédaction Gmail dans une nouvelle fenêtre.
(function () {
  'use strict';
  var header = document.querySelector('.site-header');
  var toggle = document.getElementById('menu-toggle');
  var nav = document.getElementById('main-nav');

  if (header && toggle && nav) {
    var behind = [document.getElementById('main'), document.querySelector('.site-footer')];
    var mq = window.matchMedia('(max-width: 820px)');

    var setOpen = function (open, restoreFocus) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('open', open);
      if (open) header.style.setProperty('--hdr', header.getBoundingClientRect().height + 'px');
      behind.forEach(function (el) { if (el) { if (open) el.setAttribute('inert', ''); else el.removeAttribute('inert'); } });
      if (!open && restoreFocus) toggle.focus();
    };

    toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setOpen(false, true);
    });
    // Repasser en affichage large : on referme proprement (pas d'état "ouvert" caché).
    var onChange = function () { if (!mq.matches) setOpen(false); };
    if (mq.addEventListener) mq.addEventListener('change', onChange); else mq.addListener(onChange);
  }

  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = form.dataset;
      var body = [
        d.lSurname + document.getElementById('cf-surname').value,
        d.lName + document.getElementById('cf-name').value,
        d.lEmail + document.getElementById('cf-email').value,
        '',
        document.getElementById('cf-project').value
      ].join('\n');
      var url = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(d.to) +
        '&su=' + encodeURIComponent(d.subject) + '&body=' + encodeURIComponent(body);
      window.open(url, '_blank', 'noopener');
    });
  }
})();
