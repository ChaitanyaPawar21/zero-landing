/* ========================================================================
   Zero — landing page behaviour.
   No animation library: IntersectionObserver decides when, CSS does the
   moving, so the motion stays off the main thread while the page loads.
   ===================================================================== */

// TODO: point this at the real form handler (Formspree / Google Apps Script /
// your own endpoint). While it is empty the form validates and shows the
// success state without sending anything anywhere.
const FORM_ENDPOINT = '';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

/* ----------------------------------------------------------- theme */
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

/* ---------------------------------------------------------- header */
(function header() {
  const head = document.querySelector('.site-head');
  if (!head) return;
  const onScroll = () => head.classList.toggle('stuck', window.scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // close the mobile menu after a jump, and on outside click
  const menu = document.querySelector('.menu');
  if (!menu) return;
  menu.addEventListener('click', (e) => {
    if (e.target.closest('.menu-panel a')) menu.open = false;
  });
  document.addEventListener('click', (e) => {
    if (menu.open && !menu.contains(e.target)) menu.open = false;
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); }
  });
})();

/* ---------------------------------------------------------- reveal */
(function reveal() {
  const items = [...document.querySelectorAll('.reveal')];
  if (!items.length) return;

  // Nothing to observe with: show everything rather than hide it forever.
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('in'));
    return;
  }

  // Stagger siblings only. Capped so a six-card grid never feels slow.
  const seen = new Map();
  items.forEach((el) => {
    const i = seen.get(el.parentElement) || 0;
    seen.set(el.parentElement, i + 1);
    if (i) el.style.transitionDelay = Math.min(i, 5) * 55 + 'ms';
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      io.unobserve(entry.target);            // once in, never again
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.01 });

  items.forEach((el) => io.observe(el));
})();

/* ------------------------------------------------------------- faq */
/* <details> keeps the semantics, the keyboard and the no-JS fallback.
   JS only exists so closing animates instead of snapping shut. */
(function faq() {
  const stack = document.querySelector('.faq-stack');
  if (!stack) return;

  const CLOSE_MS = 300;   // matches the grid-template-rows transition in styles.css

  const close = (d) => {
    if (!d.open || d.classList.contains('closing')) return;
    d.classList.add('closing');
    setTimeout(() => {
      d.open = false;
      d.classList.remove('closing');
    }, reduceMotion.matches ? 0 : CLOSE_MS);
  };

  stack.querySelectorAll('details').forEach((d) => {
    d.querySelector('summary').addEventListener('click', (e) => {
      e.preventDefault();                       // we drive `open` ourselves
      if (d.open) { close(d); return; }
      stack.querySelectorAll('details[open]').forEach(close);   // one at a time
      d.open = true;
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
