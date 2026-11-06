const { chromium } = require('playwright');
const assert = require('assert');
const URL = 'http://localhost:5173/index.html';
const bg = (p) => p.evaluate(() => getComputedStyle(document.body).backgroundColor);
const attr = (p) => p.evaluate(() => document.documentElement.dataset.theme);

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });

  // 1. no stored choice -> follows the OS
  for (const [scheme, want] of [['light', 'light'], ['dark', 'dark']]) {
    const c = await browser.newContext({ colorScheme: scheme });
    const p = await c.newPage();
    await p.goto(URL, { waitUntil: 'domcontentloaded' });
    assert.equal(await attr(p), want, `OS ${scheme} -> ${want}`);
    await c.close();
  }

  // 2. toggling flips the attribute, the body colour AND the button label
  const c = await browser.newContext({ colorScheme: 'light' });
  const p = await c.newPage();
  await p.goto(URL, { waitUntil: 'networkidle' });
  const lightBg = await bg(p);
  assert.equal(await p.getAttribute('#theme-toggle', 'aria-label'), 'Switch to dark theme');
  await p.click('#theme-toggle');
  assert.equal(await attr(p), 'dark', 'click -> dark');
  const darkBg = await bg(p);
  assert.notEqual(lightBg, darkBg, 'body background actually changed');
  assert.equal(await p.getAttribute('#theme-toggle', 'aria-label'), 'Switch to light theme');
  assert(await p.isVisible('.i-sun') && await p.isHidden('.i-moon'), 'sun icon shows in dark');

  // 3. the choice survives a reload
  await p.reload({ waitUntil: 'domcontentloaded' });
  assert.equal(await attr(p), 'dark', 'dark persisted');
  assert.equal(await bg(p), darkBg, 'persisted with no flash back to light');

  // 4. an explicit LIGHT choice must beat a dark OS (the :not() guard)
  const c2 = await browser.newContext({ colorScheme: 'dark' });
  const p2 = await c2.newPage();
  await p2.goto(URL, { waitUntil: 'networkidle' });
  await p2.click('#theme-toggle');                       // dark -> light
  assert.equal(await attr(p2), 'light');
  await p2.reload({ waitUntil: 'domcontentloaded' });
  assert.equal(await attr(p2), 'light', 'light choice survived');
  assert.equal(await bg(p2), lightBg, 'explicit light overrides dark OS');

  // 5. keyboard reachable
  assert(await p2.evaluate(() => {
    const b = document.getElementById('theme-toggle');
    b.focus();
    return document.activeElement === b;
  }), 'toggle is focusable');

  console.log('theme toggle: all 5 checks passed');
  await browser.close();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
