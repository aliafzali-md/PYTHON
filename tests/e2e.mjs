// End-to-end smoke test in a real browser at iPhone size: play level 1 from
// the home screen to level-complete, then confirm progress survives a reload.
import { chromium, devices } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../docs');
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png',
};

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  const file = path.join(DOCS, url === '/' ? 'index.html' : url);
  if (!file.startsWith(DOCS) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'text/plain' });
  res.end(fs.readFileSync(file));
});

const failures = [];
const check = (label, condition) => {
  console.log(`${condition ? 'ok  ' : 'FAIL'} ${label}`);
  if (!condition) failures.push(label);
};

await new Promise((resolve) => server.listen(0, resolve));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const context = await browser.newContext(devices['iPhone 13']);
const page = await context.newPage();

const consoleErrors = [];
page.on('pageerror', (err) => consoleErrors.push(err.message));
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

await page.goto(base, { waitUntil: 'networkidle' });

// --- home -----------------------------------------------------------------
check('home shows the title', await page.locator('h1').innerText() === 'Learn Python');
check('nine levels are listed', await page.locator('.level').count() === 9);
check('level 1 is unlocked', await page.locator('.level').first().isEnabled());
check('level 2 is locked', await page.locator('.level').nth(1).isDisabled());
check('starts at 0 XP', (await page.locator('#xp-chip').innerText()).startsWith('0'));
check('the key toolbar stays out of the way until an editor is focused',
  !(await page.locator('#keybar').isVisible()));
check('no back control on the home screen', !(await page.locator('#back').isVisible()));

// --- lesson ---------------------------------------------------------------
await page.locator('.level').first().click();
check('lesson opens', (await page.locator('h2').first().innerText()) === 'Storing a value');

await page.locator('button:has-text("Run this example")').click();
check('lesson example runs in the browser',
  (await page.locator('pre').last().innerText()).includes('Ali'));

for (let i = 0; i < 2; i++) await page.locator('button:has-text("Next")').click();
await page.locator('button:has-text("Start exercises")').click();
check('exercise screen opens', await page.locator('#code').isVisible());
check('an exercise cannot be skipped before it is solved',
  !(await page.locator('button:has-text("Next exercise")').isVisible()));
check('back control appears once inside a level', await page.locator('#back').isVisible());

// --- exercise 1: wrong answer, then hints, then the real thing ------------
await page.locator('#code').fill('city = "London"\npopulation = 1\nprint(city)\nprint(population)');
await page.locator('button:has-text("Run tests")').click();
check('a wrong answer fails', await page.locator('.result:not(.pass)').count() > 0);
check('failure shows expected vs got',
  (await page.locator('.result:not(.pass) .cmp').first().innerText()).includes('expected'));

await page.locator('button:has-text("Show hint 1")').click();
check('a hint appears', await page.locator('.hint').count() === 1);

await page.locator('#code').fill('city = "Paris"\npopulation = 2141000\nprint(city)\nprint(population)');
await page.locator('button:has-text("Run tests")').click();
check('the right answer passes', await page.locator('.banner.win').count() === 1);
check('solving reveals the way forward',
  await page.locator('button:has-text("Next exercise")').isVisible());
check('XP was awarded (reduced by the hint)',
  (await page.locator('#xp-chip').innerText()) === '8 XP');

// --- a syntax error is reported, not swallowed ----------------------------
await page.locator('button:has-text("Next exercise")').click();
await page.locator('#code').fill('price = 19.99\nif price\n');
await page.locator('button:has-text("Run tests")').click();
check('a syntax error is shown clearly',
  (await page.locator('.error-box').innerText()).includes('SyntaxError'));

// --- an infinite loop must not hang the phone -----------------------------
await page.locator('#code').fill('while True:\n    x = 1\n');
const start = Date.now();
await page.locator('button:has-text("Run tests")').click();
await page.locator('.error-box').waitFor({ timeout: 15000 });
const elapsed = Date.now() - start;
check(`an infinite loop is stopped (${elapsed}ms)`,
  (await page.locator('.error-box').innerText()).includes('TimeoutError') && elapsed < 15000);

// --- finish the level -----------------------------------------------------
await page.locator('#code').fill('price = 19.99\nin_stock = True\nprint(type(price))\nprint(type(in_stock))');
await page.locator('button:has-text("Run tests")').click();
await page.locator('button:has-text("Next exercise")').click();
await page.locator('#code').fill('score = 10\nscore += 5\nscore *= 2\nprint(score)');
await page.locator('button:has-text("Run tests")').click();
await page.locator('button:has-text("Review questions")').click();
check('review questions appear', await page.locator('.choice').count() === 3);

for (let q = 0; q < 3; q++) {
  await page.locator('.choice').first().click();
  check(`question ${q + 1} explains the answer`, await page.locator('.card').last().isVisible());
  const next = page.locator('button:has-text("Next question"), button:has-text("Finish level")');
  await next.first().click();
}

check('level completion is celebrated', await page.locator('.banner.win').count() === 1);

// --- progress persists -----------------------------------------------------
await page.locator('button:has-text("Back to levels")').click();
check('back at the level list', await page.locator('.level').count() === 9);
check('level 2 is now unlocked', await page.locator('.level').nth(1).isEnabled());

const xpBefore = await page.locator('#xp-chip').innerText();
await page.reload({ waitUntil: 'networkidle' });
check('progress survives a reload', (await page.locator('#xp-chip').innerText()) === xpBefore);
check('level 2 still unlocked after reload', await page.locator('.level').nth(1).isEnabled());
check('level 1 shows as done', await page.locator('.done-badge').count() >= 1);

// --- layout ---------------------------------------------------------------
const overflow = await page.evaluate(() =>
  document.documentElement.scrollWidth - document.documentElement.clientWidth);
check(`no horizontal scroll on a phone (${overflow}px)`, overflow <= 0);

// --- iOS installability ----------------------------------------------------
// These are exactly what iOS reads when someone taps Add to Home Screen.
const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
check('a manifest is linked', manifestHref === 'manifest.webmanifest');

const manifest = await (await context.request.get(`${base}/manifest.webmanifest`)).json();
check('manifest is standalone', manifest.display === 'standalone');
check('manifest has a start_url', Boolean(manifest.start_url));
check('manifest has a short_name for the home screen', manifest.short_name === 'PyQuest');
check('manifest declares a 192 and a 512 icon',
  manifest.icons.some((i) => i.sizes === '192x192') && manifest.icons.some((i) => i.sizes === '512x512'));
check('manifest declares a maskable icon',
  manifest.icons.some((i) => i.purpose === 'maskable'));

check('apple-mobile-web-app-capable is set',
  await page.locator('meta[name="apple-mobile-web-app-capable"]').getAttribute('content') === 'yes');
check('apple-mobile-web-app-title is set',
  await page.locator('meta[name="apple-mobile-web-app-title"]').getAttribute('content') === 'PyQuest');
check('a theme-color is set', await page.locator('meta[name="theme-color"]').count() === 1);
check('viewport covers the notch',
  (await page.locator('meta[name="viewport"]').getAttribute('content')).includes('viewport-fit=cover'));

for (const icon of ['icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png']) {
  const response = await context.request.get(`${base}/${icon}`);
  check(`${icon} loads`, response.status() === 200);
}
const touchIcon = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
check('apple-touch-icon points at a real file', touchIcon === 'icons/icon-180.png');

// The editor must not trigger iOS zoom-on-focus or autocorrect.
await page.locator('.level').first().click();
for (let i = 0; i < 2; i++) await page.locator('button:has-text("Next")').click();
await page.locator('button:has-text("Start exercises")').click();
const editor = page.locator('#code');
check('editor disables autocorrect',
  await editor.getAttribute('autocorrect') === 'off' && await editor.getAttribute('spellcheck') === 'false');
check('editor font is at least 16px, so iOS will not zoom in',
  parseFloat(await editor.evaluate((n) => getComputedStyle(n).fontSize)) >= 16);

await editor.focus();
check('the key toolbar appears with the keyboard',
  await page.locator('#keybar').isVisible() && await page.locator('#keybar button').count() > 10);

await editor.fill('');
await page.locator('#keybar button:has-text(":")').click();
check('a toolbar key types into the editor', await editor.inputValue() === ':');

await editor.fill('if True:');
await editor.press('End');
await editor.press('Enter');
check('Enter auto-indents after a colon', await editor.inputValue() === 'if True:\n    ');

check('no console errors', consoleErrors.length === 0);
if (consoleErrors.length) console.log(consoleErrors.slice(0, 5));

await browser.close();
server.close();

console.log(failures.length
  ? `\n${failures.length} check(s) failed:\n  ${failures.join('\n  ')}`
  : '\nAll end-to-end checks passed.');
process.exit(failures.length ? 1 : 0);
