/* Faisal — portfolio
   Three jobs: theme toggle, copyright year, wordmark animation.
   Written to run without a build step; no dependencies. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- copyright year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  /* ---------- theme toggle ----------
     No stored value means "follow the OS". The first click therefore has to
     resolve what is actually on screen and flip away from it, rather than
     assuming light. */
  var toggle = document.getElementById('theme-toggle');

  function currentTheme() {
    var stored = root.getAttribute('data-theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(next) {
    // Freeze colour transitions for the swap (see .theme-switching in styles.css),
    // otherwise every link, label and tag fades in from the old palette.
    root.classList.add('theme-switching');
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch (e) { /* private mode — the choice just won't persist */ }
  }

  function endSwitch() {
    // Two frames, so the new colours are painted before transitions come back on.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        root.classList.remove('theme-switching');
      });
    });
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';

      // The incoming theme is revealed by a circle growing out of the button.
      // Needs the View Transitions API; everywhere else the swap is instant,
      // which is a perfectly good outcome rather than a broken one.
      if (!document.startViewTransition || reduceMotion.matches) {
        applyTheme(next);
        endSwitch();
        return;
      }

      var box = toggle.getBoundingClientRect();
      var originX = box.left + box.width / 2;
      var originY = box.top + box.height / 2;

      // Radius needed to reach the furthest corner from the button.
      var radius = Math.hypot(
        Math.max(originX, window.innerWidth - originX),
        Math.max(originY, window.innerHeight - originY)
      );

      var transition = document.startViewTransition(function () {
        applyTheme(next);
      });
      transition.finished.then(endSwitch, endSwitch);

      transition.ready.then(function () {
        root.animate(
          {
            clipPath: [
              'circle(0px at ' + originX + 'px ' + originY + 'px)',
              'circle(' + radius + 'px at ' + originX + 'px ' + originY + 'px)'
            ]
          },
          {
            duration: 520,
            easing: 'cubic-bezier(.22,.61,.36,1)',
            pseudoElement: '::view-transition-new(root)'
          }
        );
      }).catch(function () { /* transition was skipped — the theme still changed */ });
    });
  }

  /* ---------- smooth scroll on nav anchors ---------- */
  var anchors = document.querySelectorAll('nav a[href^="#"]');
  Array.prototype.forEach.call(anchors, function (link) {
    link.addEventListener('click', function (event) {
      var target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({
        behavior: reduceMotion.matches ? 'auto' : 'smooth',
        block: 'start'
      });
    });
  });

  /* ---------- wordmark: types itself in, then refuses to do it again ---------- */
  var wordmark = document.querySelector('.wordmark');
  var wordmarkText = document.querySelector('.wordmark-text');
  var caret = document.querySelector('.caret');

  if (wordmark && wordmarkText && caret) {
    var settled = false;

    if (reduceMotion.matches) {
      // Nothing animates: show the finished state immediately.
      caret.classList.add('is-done');
      settled = true;
    } else {
      // Split the existing text into spans. The name is already in the HTML,
      // so this only controls *when* each character shows — with JS off, the
      // whole name renders normally.
      var letters = wordmarkText.textContent.split('');
      wordmarkText.textContent = '';
      wordmarkText.setAttribute('aria-hidden', 'true');

      var spans = letters.map(function (letter) {
        var span = document.createElement('span');
        span.className = 'ch';
        span.textContent = letter;
        wordmarkText.appendChild(span);
        return span;
      });

      // ~80ms per character with jitter, so the rhythm reads as a person
      // typing rather than a metronome.
      var elapsed = 260; // let the caret blink once before typing starts
      spans.forEach(function (span) {
        elapsed += 80 + (Math.random() * 50 - 25);
        setTimeout(function () { span.classList.add('is-in'); }, elapsed);
      });

      setTimeout(function () {
        caret.classList.add('is-done');
        settled = true;
      }, elapsed + 1200);
    }

    wordmark.addEventListener('click', function (event) {
      // Still functional: if the reader is scrolled down, take them up.
      if (window.scrollY > 4) {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      } else {
        event.preventDefault();
      }

      // The gag: it declines to type itself out a second time.
      if (!settled || reduceMotion.matches) return;
      if (wordmark.classList.contains('is-refusing')) return; // don't stack shakes

      wordmark.classList.add('is-refusing');
      wordmark.addEventListener('animationend', function done() {
        wordmark.classList.remove('is-refusing');
        wordmark.removeEventListener('animationend', done);
      });
    });
  }
})();
