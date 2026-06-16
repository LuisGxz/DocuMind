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
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};

const server = createServer(async (req, res) => {
  const url = (req.url ?? '/').split('?')[0];
  let file = join(root, url);
  let data = await readFile(file).catch(() => null);
  if (!data) {
    file = join(root, 'index.html');
    data = await readFile(file);
  } // SPA fallback
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
const shot = async (page, name) =>
  page.screenshot({ path: `../docs/screenshots/f5-${name}.png` });

// 1) Login + register pages at 3 breakpoints
for (const [path, pname] of [
  ['/login', 'login'],
  ['/register', 'register'],
]) {
  for (const [w, h, label] of widths) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`[${pname}/${label}] ${m.text()}`);
    });
    page.on('pageerror', (e) => errors.push(`[${pname}/${label}] ${e.message}`));
    await page.goto(`http://localhost:4173${path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await shot(page, `${pname}-${label}`);
    await page.close();
  }
}

// 2) E2E: log in as owner via demo button, land on library, screenshot at 3 breakpoints
for (const [w, h, label] of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`[library/${label}] ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`[library/${label}] ${e.message}`));
  await page.goto('http://localhost:4173/login', { waitUntil: 'networkidle' });
  // Click the first demo account row (Owner)
  await page.locator('.demo-row').first().click();
  await page.waitForURL('**/library', { timeout: 15000 });
  await page.waitForSelector('.dcard', { timeout: 15000 });
  await page.waitForTimeout(600);
  await shot(page, `library-${label}`);
  if (label === 'desktop') {
    const docCount = await page.locator('.dcard').count();
    const roleBadge = await page.locator('.role-pill').first().textContent().catch(() => '');
    console.log(`library: ${docCount} document cards, role badge = "${roleBadge?.trim()}"`);
  }
  await page.close();
}

await browser.close();
server.close();
console.log(errors.length ? 'CONSOLE ERRORS:\n' + errors.join('\n') : 'OK — no console errors');
