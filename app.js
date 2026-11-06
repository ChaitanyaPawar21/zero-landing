/* ========================================================================
   Zero — landing page behaviour: GSAP scroll motion + demo form validation
   ===================================================================== */

// TODO: point this at the real form handler (Formspree / Google Apps Script /
// your own endpoint). While it is empty the form validates and shows the
// success state without sending anything anywhere.
const FORM_ENDPOINT = '';

/* ------------------------------------------------------------- theme toggle */
(function theme() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const d = document.documentElement;

  // the icon swap is CSS; only the label has to be kept in sync here
  const sync = () => {
    const label = d.dataset.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    btn.setAttribute('aria-label', label);
    btn.title = label;
  };

  btn.addEventListener('click', () => {
    const next = d.dataset.theme === 'dark' ? 'light' : 'dark';
    d.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}  // private mode: still toggles, just won't persist
    sync();
  });

  sync();
})();

/* ------------------------------------------------------------------ motion */
(function motion() {
  const html = document.documentElement;

  // sticky header gets its edge once you scroll off the top (works with or without GSAP)
  const head = document.querySelector('.site-head');
  const onScroll = () => head.classList.toggle('stuck', window.scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // No GSAP (CDN blocked, offline, ad-blocker)? Drop the hiding class and bail.
  if (!window.gsap) { html.classList.remove('js'); return; }

  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();

  // Reduced motion: everything visible, nothing moves.
  mm.add('(prefers-reduced-motion: reduce)', () => {
    gsap.set('.reveal, .hero-el, .hero-art', { opacity: 1, y: 0, clearProps: 'transform' });
  });

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // hero: headline block, then the collage assembles underneath it
    gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.7 } })
      .fromTo('.hero-el', { y: 22, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08 })
      .fromTo('.hero-art',
        { y: 40, opacity: 0, scale: 0.97 },
        { y: 0, opacity: 1, scale: 1, duration: 0.9, stagger: 0.09, clearProps: 'scale' }, 0.3)
      .fromTo('.c-quiz .ui-opt', { x: -12, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.06 }, '-=0.55')
      .fromTo('.c-quiz .ui-bars i', { scaleY: 0 }, { scaleY: 1, transformOrigin: 'bottom', stagger: 0.06 }, '-=0.3')
      .fromTo('.c-analytics .ui-meter i', { scaleX: 0 }, { scaleX: 1, transformOrigin: 'left', stagger: 0.07, duration: 0.8 }, '-=0.6');

    // fade-up on scroll, batched so a long page stays cheap
    ScrollTrigger.batch('.reveal', {
      start: 'top 88%',
      once: true,
      batchMax: 6,
      onEnter: (batch) => gsap.fromTo(
        batch,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.07, ease: 'power2.out', overwrite: true }
      )
    });

    // meters and bars inside any tile fill when that tile arrives
    ScrollTrigger.batch('.tile .ui-meter i, .tile .ui-bars i', {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => gsap.fromTo(
        batch,
        { scaleX: 0, scaleY: 0 },
        {
          scaleX: 1, scaleY: 1, duration: 0.7, stagger: 0.05, ease: 'power2.out',
          transformOrigin: 'left bottom', overwrite: true
        }
      )
    });
  });

})();

/* ------------------------------------------------------- demo form */
(function demoForm() {
  const form = document.getElementById('demo-form');
  if (!form) return;

  const success = document.getElementById('demo-success');
  const formErr = document.getElementById('err-form');

  const required = {
    school: 'Please tell us your school name.',
    city: 'Which city is the school in?',
    person: 'Who should we ask for?',
    role: 'Please pick your role.',
    phone: 'We need a phone number to call you on.'
  };

  const setError = (name, msg) => {
    const box = form.querySelector(`[data-error-for="${name}"]`);
    const input = form.elements[name];
    if (box) {
      box.textContent = msg || '';
      box.classList.toggle('show', Boolean(msg));
    }
    // a checkbox group gives a RadioNodeList, which has no setAttribute
    if (input && input.setAttribute) {
      if (msg) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
    return !msg;
  };

  // 10 digits, optionally +91 / 0 prefixed, first digit 6-9
  const validPhone = (raw) => /^[6-9]\d{9}$/.test(
    raw.replace(/\D/g, '').replace(/^(?:91|0)(?=\d{10}$)/, '')
  );

  const validEmail = (raw) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw);

  function validate() {
    const bad = [];

    for (const [name, msg] of Object.entries(required)) {
      const ok = setError(name, form.elements[name].value.trim() ? '' : msg);
      if (!ok) bad.push(form.elements[name]);
    }

    const phone = form.elements.phone;
    if (phone.value.trim() && !validPhone(phone.value)) {
      setError('phone', 'That does not look like a 10-digit Indian mobile number.');
      bad.push(phone);
    }

    const email = form.elements.email;
    if (email.value.trim() && !validEmail(email.value)) {
      setError('email', 'Check the email address — it looks incomplete.');
      bad.push(email);
    } else if (!email.value.trim()) {
      setError('email', '');
    }

    const classes = [...form.querySelectorAll('input[name="classes"]:checked')];
    if (!classes.length) {
      setError('classes', 'Pick at least one class.');
      bad.push(form.querySelector('input[name="classes"]'));
    } else {
      setError('classes', '');
    }

    return bad;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formErr.classList.remove('show');

    const bad = validate();
    if (bad.length) {
      formErr.textContent = `Please fix ${bad.length} field${bad.length > 1 ? 's' : ''} above.`;
      formErr.classList.add('show');
      bad[0].focus();
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    if (FORM_ENDPOINT) {
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form)
        });
        if (!res.ok) throw new Error(res.status);
      } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Book a free demo';
        formErr.textContent = 'That did not go through. Please call or WhatsApp us instead.';
        formErr.classList.add('show');
        return;
      }
    }

    form.hidden = true;
    success.hidden = false;
    success.setAttribute('tabindex', '-1');
    success.focus();
  });

  // clear a field's error as soon as the person starts fixing it
  form.addEventListener('input', (e) => {
    const name = e.target.name;
    if (!name) return;
    if (name === 'classes') setError('classes', '');
    else if (required[name] || name === 'email') setError(name, '');
  });
})();

document.getElementById('year').textContent = new Date().getFullYear();
