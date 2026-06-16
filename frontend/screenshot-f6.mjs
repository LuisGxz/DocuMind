import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join } from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_PATH);

const root = 'dist/frontend/browser';
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.ico': 'image/x-icon',
};
const server = createServer(async (req, res) => {
  const url = (req.url ?? '/').split('?')[0];
  let file = join(root, url);
  let data = await readFile(file).catch(() => null);
  if (!data) {
    file = join(root, 'index.html');
    data = await readFile(file);
  }
  res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
  res.end(data);
});
await new Promise((r) => server.listen(4173, r));

const browser = await chromium.launch();
const widths = [
  [1280, 900, 'desktop'],
  [768, 1024, 'tablet'],
  [390, 844, 'mobile'],
];
const errors = [];
const shot = (page, name) => page.screenshot({ path: `../docs/screenshots/f6-${name}.png` });

async function login(page) {
  await page.addInitScript(() => localStorage.setItem('documind.tourSeen', '1')); // suppress tour for flow shots
  await page.goto('http://localhost:4173/login', { waitUntil: 'networkidle' });
  await page.locator('.demo-row').first().click(); // Owner
  await page.waitForURL('**/library', { timeout: 15000 });
  await page.waitForSelector('.dcard', { timeout: 15000 });
}

// 1) First-run tour (fresh context, no tourSeen)
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(`[tour] ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`[tour] ${e.message}`));
  await page.goto('http://localhost:4173/login', { waitUntil: 'networkidle' });
  await page.locator('.demo-row').first().click();
  await page.waitForSelector('.tour', { timeout: 15000 });
  await page.waitForTimeout(500);
  await shot(page, 'tour-desktop');
  await ctx.close();
}

// 2) Library + Document flow at 3 breakpoints
for (const [w, h, label] of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(`[${label}] ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`[${label}] ${e.message}`));

  await login(page);
  await page.waitForTimeout(400);
  await shot(page, `library-${label}`);

  // open the MSA card (the one with conversations / hot), else first card
  const hot = page.locator('.dcard.hot').first();
  const target = (await hot.count()) ? hot : page.locator('.dcard').first();
  await target.click();
  await page.waitForURL('**/d/**', { timeout: 15000 });
  await page.waitForSelector('.split', { timeout: 15000 });
  // On mobile the chat is behind a tab
  if (label === 'mobile') {
    await page.locator('.tabs button', { hasText: /Chat|Pregunta/ }).click().catch(() => {});
  }
  await page.waitForTimeout(600);
  await shot(page, `doc-${label}`);

  // Ask a question and capture the streamed answer + citations (desktop only, full flow)
  if (label === 'desktop') {
    await page.locator('.cinput').fill('How can the contract be terminated early?');
    await page.locator('.send').click();
    await page.waitForSelector('.cite-chip', { timeout: 20000 });
    await page.waitForTimeout(800);
    await page.locator('.cite-chip').first().hover();
    await page.waitForTimeout(700);
    await shot(page, 'doc-answer-desktop');
    const chips = await page.locator('.cite-chip').count();
    const hotHl = await page.locator('.cite-hl.hot').count();
    const answer = (await page.locator('.atext').last().textContent()) ?? '';
    console.log(
      `chat: ${chips} citation chips, ${hotHl} highlighted passage(s), answer="${answer.slice(0, 70)}…"`,
    );
  }
  await ctx.close();
}

await browser.close();
server.close();
console.log(errors.length ? 'CONSOLE ERRORS:\n' + errors.join('\n') : 'OK — no console errors');
