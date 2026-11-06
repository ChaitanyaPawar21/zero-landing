const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const shown = () => page.$$eval('.err.show', (n) => n.map((e) => e.id));

  // 1. empty submit -> every required field errors, focus lands on the first bad one
  await page.click('#demo-form button[type=submit]');
  let e = await shown();
  for (const id of ['err-school', 'err-city', 'err-person', 'err-role', 'err-phone', 'err-classes'])
    assert(e.includes(id), `empty submit should flag ${id}; got ${e}`);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'school', 'focus -> first invalid');
  assert(await page.isVisible('#demo-form'), 'form must not submit when invalid');

  // 2. bad phone + bad email are caught
  await page.fill('#school', 'St. Xavier High School');
  await page.fill('#city', 'Pune');
  await page.fill('#person', 'A. Deshpande');
  await page.selectOption('#role', 'Principal');
  await page.check('input[name=classes][value="10"]');
  await page.fill('#phone', '12345');
  await page.fill('#email', 'not-an-email');
  await page.click('#demo-form button[type=submit]');
  e = await shown();
  assert(e.includes('err-phone'), 'rejects 5-digit phone');
  assert(e.includes('err-email'), 'rejects malformed email');

  // 3. +91 prefix and spaces are accepted, not rejected as junk
  await page.fill('#phone', '+91 98765 43210');
  await page.fill('#email', '');
  await page.click('#demo-form button[type=submit]');
  await page.waitForTimeout(400);
  assert(await page.isHidden('#demo-form'), 'form hides on success');
  assert(await page.isVisible('#demo-success'), 'success state shows');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'demo-success', 'focus moves to success');

  // 4. keyboard: accordion opens on Enter
  await page.reload({ waitUntil: 'networkidle' });
  const sum = page.locator('#faq summary').first();
  await sum.focus();
  await page.keyboard.press('Enter');
  assert(await page.locator('#faq details').first().evaluate((d) => d.open), 'details opens via keyboard');

  console.log('form + accordion: all 4 checks passed');
  await browser.close();
})().catch((err) => { console.error('FAILED:', err.message); process.exit(1); });
