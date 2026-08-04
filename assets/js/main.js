/* ==========================================================================
   AD Consulting et Formation — Scripts du site
   Aucune dépendance externe.
   ========================================================================== */

(function () {
  'use strict';

  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ======================================================================
     En-tête
     ====================================================================== */
  var header = $('.header');
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Menu mobile */
  var burger = $('.burger');
  var nav = $('.nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('a', nav).forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        burger.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Lien actif */
  var current = location.pathname.split('/').pop() || 'index.html';
  $$('.nav__link').forEach(function (link) {
    if (link.getAttribute('href') === current) link.classList.add('is-active');
  });

  /* Année courante */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ======================================================================
     Accordéon FAQ
     ====================================================================== */
  $$('.faq__q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq__item');
      var answer = $('.faq__a', item);
      var isOpen = item.classList.contains('is-open');

      $$('.faq__item.is-open', item.parentElement).forEach(function (other) {
        other.classList.remove('is-open');
        $('.faq__a', other).style.maxHeight = null;
        $('.faq__q', other).setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('is-open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ======================================================================
     Apparition au défilement + compteurs
     ====================================================================== */
  var revealables = $$('.reveal');
  if ('IntersectionObserver' in window && revealables.length) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    revealables.forEach(function (el) { revealObs.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
  }

  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseFloat(el.dataset.count);
        var duration = 1200;
        var start = performance.now();

        (function tick(now) {
          var p = Math.min((now - start) / duration, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          var value = target * eased;
          el.textContent = target % 1 === 0 ? Math.round(value) : value.toFixed(1);
          if (p < 1) requestAnimationFrame(tick);
        })(start);

        countObs.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { countObs.observe(el); });
  }

  /* ======================================================================
     Formulaire de contact
     Aucun backend branché : compose le message et ouvre le client mail.
     Voir README pour le branchement définitif à la mise en ligne.
     ====================================================================== */
  var contactForm = $('#contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(contactForm);
      var nom = (d.get('nom') || '').trim();
      var email = (d.get('email') || '').trim();
      var message = (d.get('message') || '').trim();
      if (!nom || !email || !message) return;

      var corps = 'Nom : ' + nom + '\n' +
                  'Email : ' + email + '\n' +
                  'Téléphone : ' + (d.get('telephone') || '') + '\n' +
                  'Projet : ' + (d.get('sujet') || '') + '\n\n' + message;

      window.location.href = 'mailto:adconsultingetformation@gmail.com' +
        '?subject=' + encodeURIComponent('[Site web] ' + (d.get('sujet') || 'Demande') + ' — ' + nom) +
        '&body=' + encodeURIComponent(corps);

      var msg = $('.form-msg', contactForm);
      if (msg) {
        msg.textContent = 'Merci ' + nom + ' ! Votre messagerie va s\'ouvrir pour finaliser l\'envoi. Vous pouvez aussi nous joindre au 0639 400 663.';
        msg.classList.add('is-visible');
      }
      contactForm.reset();
    });
  }

  /* ======================================================================
     Chat en direct
     Démonstration côté navigateur : réponses scriptées + bascule WhatsApp.
     À raccorder à une messagerie réelle (Crisp, Tawk.to…) à la mise en ligne.
     ====================================================================== */
  var chatBtn = $('.chat-launcher');
  var chatPanel = $('.chat-panel');

  if (chatBtn && chatPanel) {
    var chatLog = $('#chat-log');
    var chatQuick = $('#chat-quick');
    var chatForm = $('#chat-form');
    var chatInput = $('#chat-input');
    var started = false;

    var REPONSES = [
      {
        q: 'Quels sont vos délais ?',
        r: 'Comptez 3 à 7 jours pour le montage du dossier, puis environ 7 jours pour le Kbis. Soit une semaine maximum à partir d\'un dossier complet.'
      },
      {
        q: 'Quel statut choisir ?',
        r: 'Cela dépend de votre activité, du nombre d\'associés et de vos objectifs fiscaux. C\'est l\'objet du rendez-vous de cadrage — il est gratuit.'
      },
      {
        q: 'Combien ça coûte ?',
        r: 'De 50 € pour un acte simple à 5 000 € pour un montage complet avec financements. L\'immatriculation clé en main est à 1 200 €.'
      },
      {
        q: 'Quelles aides à Mayotte ?',
        r: 'Aides économiques locales, subvention LEADER (GAL Nord), défiscalisation et fonds européens. 98 % de nos dossiers aboutissent.'
      },
      {
        q: 'Où êtes-vous ?',
        r: '661 C rue Maevantana, Mtsapéré — 97600 Mamoudzou, vers la boulangerie de Cavani Sud. Ouvert du lundi au vendredi.'
      }
    ];

    function addMsg(text, who) {
      var el = document.createElement('div');
      el.className = 'chat-msg chat-msg--' + who;
      el.textContent = text;
      chatLog.appendChild(el);
      chatLog.scrollTop = chatLog.scrollHeight;
      return el;
    }

    function botReply(text, delay) {
      setTimeout(function () {
        addMsg(text, 'bot');
      }, delay || 650);
    }

    function renderQuick() {
      chatQuick.innerHTML = '';
      REPONSES.forEach(function (item) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = item.q;
        b.addEventListener('click', function () {
          addMsg(item.q, 'me');
          botReply(item.r);
        });
        chatQuick.appendChild(b);
      });
    }

    function startChat() {
      if (started) return;
      started = true;
      addMsg('Bonjour 👋 Bienvenue chez AD Consulting et Formation. Comment pouvons-nous vous aider ?', 'bot');
      botReply('Choisissez une question ci-dessous, ou écrivez-nous directement.', 900);
      renderQuick();
    }

    chatBtn.addEventListener('click', function () {
      var open = chatPanel.classList.toggle('is-open');
      chatBtn.classList.toggle('is-open', open);
      chatBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      var badge = $('.chat-launcher__badge', chatBtn);
      if (badge) badge.remove();
      if (open) { startChat(); setTimeout(function () { chatInput.focus(); }, 300); }
    });

    chatForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = chatInput.value.trim();
      if (!text) return;
      addMsg(text, 'me');
      chatInput.value = '';
      botReply('Merci ! Un conseiller vous répond dans quelques minutes. Pour une réponse immédiate, appelez le 0639 400 663 ou continuez sur WhatsApp.', 800);
    });
  }

  /* ======================================================================
     Prise de rendez-vous en ligne (assistant en 4 étapes)
     ====================================================================== */
  var booking = $('#booking');
  if (booking) {
    var JOURS = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
    var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    /* Horaires du cabinet : 8h-12h et 13h15-17h, du lundi au vendredi */
    var CRENEAUX = ['08:00', '09:00', '10:00', '11:00', '13:15', '14:15', '15:15', '16:00'];
    /* Créneaux fictifs déjà réservés, pour la démonstration */
    var OCCUPES = ['09:00', '14:15'];

    var state = { prestation: null, mode: 'cabinet', date: null, heure: null };
    var paneIndex = 0;
    var panes = $$('.booking__pane', booking);
    var stepTabs = $$('.booking__step', booking);
    var btnPrev = $('#booking-prev');
    var btnNext = $('#booking-next');

    var view = new Date();
    view.setDate(1);

    function fmtDate(d) {
      return JOURS[d.getDay()] + '. ' + d.getDate() + ' ' + MOIS[d.getMonth()] + ' ' + d.getFullYear();
    }

    function isSelectable(d) {
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      var day = d.getDay();
      return d >= today && day !== 0 && day !== 6;
    }

    /* --- Calendrier --- */
    function renderCalendar() {
      var title = $('#cal-title');
      var grid = $('#cal-grid');
      title.textContent = MOIS[view.getMonth()] + ' ' + view.getFullYear();
      grid.innerHTML = '';

      ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'].forEach(function (d) {
        var el = document.createElement('div');
        el.className = 'calendar__dow';
        el.textContent = d;
        grid.appendChild(el);
      });

      /* Décalage : la grille commence le lundi */
      var first = new Date(view.getFullYear(), view.getMonth(), 1);
      var offset = (first.getDay() + 6) % 7;
      for (var i = 0; i < offset; i++) grid.appendChild(document.createElement('div'));

      var nbJours = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      var today = new Date(); today.setHours(0, 0, 0, 0);

      for (var jour = 1; jour <= nbJours; jour++) {
        var d = new Date(view.getFullYear(), view.getMonth(), jour);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'calendar__day';
        btn.textContent = jour;
        btn.disabled = !isSelectable(d);
        if (d.getTime() === today.getTime()) btn.classList.add('is-today');
        if (state.date && d.toDateString() === state.date.toDateString()) btn.classList.add('is-selected');

        (function (dateChoisie) {
          btn.addEventListener('click', function () {
            state.date = dateChoisie;
            state.heure = null;
            renderCalendar();
            renderSlots();
            updateUI();
          });
        })(d);

        grid.appendChild(btn);
      }

      /* Interdit de remonter avant le mois courant */
      var now = new Date();
      $('#cal-prev').disabled =
        view.getFullYear() === now.getFullYear() && view.getMonth() === now.getMonth();
    }

    /* --- Créneaux horaires --- */
    function renderSlots() {
      var box = $('#slots');
      var label = $('#slots-label');
      if (!state.date) {
        label.textContent = 'Sélectionnez d\'abord une date.';
        box.innerHTML = '';
        return;
      }
      label.textContent = 'Créneaux disponibles le ' + fmtDate(state.date) + ' :';
      box.innerHTML = '';

      CRENEAUX.forEach(function (h) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'slot';
        b.textContent = h;
        b.disabled = OCCUPES.indexOf(h) !== -1;
        if (state.heure === h) b.classList.add('is-selected');
        b.addEventListener('click', function () {
          state.heure = h;
          renderSlots();
          updateUI();
        });
        box.appendChild(b);
      });
    }

    /* --- Récapitulatif --- */
    function renderRecap() {
      $('#recap-prestation').textContent = state.prestation || '—';
      $('#recap-mode').textContent = state.mode === 'cabinet' ? 'Au cabinet (Mtsapéré)' : 'À distance (téléphone / visio)';
      $('#recap-date').textContent = state.date ? fmtDate(state.date) : '—';
      $('#recap-heure').textContent = state.heure || '—';
    }

    /* --- Navigation entre étapes --- */
    function canAdvance() {
      if (paneIndex === 0) return !!state.prestation;
      if (paneIndex === 1) return !!(state.date && state.heure);
      if (paneIndex === 2) {
        return $('#rdv-nom').value.trim() && $('#rdv-email').value.trim() && $('#rdv-tel').value.trim();
      }
      return true;
    }

    function updateUI() {
      panes.forEach(function (p, i) { p.classList.toggle('is-active', i === paneIndex); });
      stepTabs.forEach(function (t, i) {
        t.classList.toggle('is-active', i === paneIndex);
        t.classList.toggle('is-done', i < paneIndex);
      });
      btnPrev.style.visibility = paneIndex === 0 ? 'hidden' : 'visible';
      btnNext.disabled = !canAdvance();
      btnNext.textContent = paneIndex === 2 ? 'Confirmer le rendez-vous' : 'Continuer';
      btnNext.style.display = paneIndex === 3 ? 'none' : '';
      btnPrev.style.display = paneIndex === 3 ? 'none' : '';
      if (paneIndex === 2) renderRecap();
    }

    btnNext.addEventListener('click', function () {
      if (!canAdvance()) return;
      if (paneIndex === 2) { confirmer(); return; }
      paneIndex++;
      updateUI();
      booking.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    btnPrev.addEventListener('click', function () {
      if (paneIndex > 0) paneIndex--;
      updateUI();
    });

    /* Choix de prestation et de modalité */
    $$('input[name="prestation"]', booking).forEach(function (input) {
      input.addEventListener('change', function () { state.prestation = input.value; updateUI(); });
    });
    $$('input[name="mode"]', booking).forEach(function (input) {
      input.addEventListener('change', function () { state.mode = input.value; });
    });
    ['#rdv-nom', '#rdv-email', '#rdv-tel'].forEach(function (sel) {
      $(sel).addEventListener('input', updateUI);
    });

    $('#cal-prev').addEventListener('click', function () {
      view.setMonth(view.getMonth() - 1); renderCalendar();
    });
    $('#cal-next').addEventListener('click', function () {
      view.setMonth(view.getMonth() + 1); renderCalendar();
    });

    /* Confirmation : sans backend, on transmet par e-mail */
    function confirmer() {
      var nom = $('#rdv-nom').value.trim();
      var recapTexte =
        'Prestation : ' + state.prestation + '\n' +
        'Modalité : ' + (state.mode === 'cabinet' ? 'Au cabinet' : 'À distance') + '\n' +
        'Date : ' + fmtDate(state.date) + '\n' +
        'Heure : ' + state.heure + '\n\n' +
        'Nom : ' + nom + '\n' +
        'E-mail : ' + $('#rdv-email').value.trim() + '\n' +
        'Téléphone : ' + $('#rdv-tel').value.trim() + '\n' +
        'Précisions : ' + ($('#rdv-message').value.trim() || '—');

      $('#confirm-nom').textContent = nom;
      $('#confirm-detail').textContent = fmtDate(state.date) + ' à ' + state.heure +
        ' — ' + (state.mode === 'cabinet' ? 'au cabinet' : 'à distance');

      paneIndex = 3;
      updateUI();
      stepTabs.forEach(function (t) { t.classList.add('is-done'); t.classList.remove('is-active'); });
      booking.scrollIntoView({ behavior: 'smooth', block: 'start' });

      window.location.href = 'mailto:adconsultingetformation@gmail.com' +
        '?subject=' + encodeURIComponent('[Rendez-vous] ' + state.prestation + ' — ' + nom) +
        '&body=' + encodeURIComponent(recapTexte);
    }

    renderCalendar();
    renderSlots();
    updateUI();
  }

  /* ======================================================================
     Espace client (démonstration)
     ====================================================================== */
  var dash = $('#dash');
  if (dash) {
    $$('.dash__nav button', dash).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.dataset.pane;
        $$('.dash__nav button', dash).forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        $$('.dash__pane', dash).forEach(function (p) {
          p.classList.toggle('is-active', p.dataset.pane === target);
        });
      });
    });
  }

  /* Connexion de démonstration */
  var loginForm = $('#login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      $('#login-view').style.display = 'none';
      $('#dash-view').style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  var logout = $('#logout');
  if (logout) {
    logout.addEventListener('click', function () {
      $('#dash-view').style.display = 'none';
      $('#login-view').style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();
