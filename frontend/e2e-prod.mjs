// Production E2E against the live GitHub Pages site + live Azure API.
// Owner: login → open doc → ask → streamed answer with citations + highlight.
// Viewer: login → RBAC (no upload / no owner actions) but can still ask.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_PATH);

const BASE = 'https://luisgxz.github.io/DocuMind';
const browser = await chromium.launch();
const errors = [];
const shot = (page, name) => page.screenshot({ path: `../docs/screenshots/prod-${name}.png` });
const track = (page, tag) => {
  page.on('console', (m) => m.type() === 'error' && errors.push(`[${tag}] ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`[${tag}] ${e.message}`));
};

// ---- Owner full flow ----
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  track(page, 'owner');
  await page.addInitScript(() => localStorage.setItem('documind.tourSeen', '1'));
  // Enter via app root so client-side routing handles /login (no Pages deep-link 404 artifact).
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.demo-row', { timeout: 30000 });
  await page.locator('.demo-row').first().click(); // Owner
  await page.waitForURL('**/library', { timeout: 30000 });
  await page.waitForSelector('.dcard', { timeout: 30000 });
  const cards = await page.locator('.dcard').count();
  const uploadBtn = await page.locator('button:has-text("Upload"), button:has-text("Subir")').count();
  await shot(page, 'owner-library');

  // Open the MSA (master services agreement) — the doc with the termination clause.
  const msa = page.locator('.dcard', { hasText: /master|services/i }).first();
  const target = (await msa.count()) ? msa : page.locator('.dcard').first();
  await target.click();
  await page.waitForURL('**/d/**', { timeout: 30000 });
  await page.waitForSelector('.split', { timeout: 30000 });

  await page.locator('.cinput').fill('How can the contract be terminated early?');
  await page.locator('.send').click();
  await page.waitForSelector('.cite-chip', { timeout: 40000 });
  await page.waitForTimeout(1000);
  await page.locator('.cite-chip').first().hover();
  await page.waitForTimeout(900);
  await shot(page, 'owner-answer');
  const chips = await page.locator('.cite-chip').count();
  const hl = await page.locator('.cite-hl').count();
  const answer = (await page.locator('.atext').last().textContent()) ?? '';
  console.log(
    `OWNER: ${cards} cards, uploadBtn=${uploadBtn}, ${chips} citation chips, ${hl} highlighted, answer="${answer.slice(0, 80)}…"`,
  );
  await ctx.close();
}

// ---- Viewer RBAC ----
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  track(page, 'viewer');
  await page.addInitScript(() => localStorage.setItem('documind.tourSeen', '1'));
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.demo-row', { timeout: 30000 });
  await page.locator('.demo-row').nth(1).click(); // Viewer
  await page.waitForURL('**/library', { timeout: 30000 });
  await page.waitForSelector('.dcard', { timeout: 30000 });
  const rolePill = (await page.locator('.role-pill').first().textContent().catch(() => '')) ?? '';
  const uploadBtn = await page.locator('button:has-text("Upload"), button:has-text("Subir")').count();
  await shot(page, 'viewer-library');

  await page.locator('.dcard').first().click();
  await page.waitForURL('**/d/**', { timeout: 30000 });
  await page.waitForSelector('.split', { timeout: 30000 });
  const ownerActions = await page.locator('button:has-text("Reprocess"), button:has-text("Delete"), button:has-text("Eliminar"), button:has-text("Reprocesar")').count();
  // viewer can still ask
  await page.locator('.cinput').fill('What are the confidentiality obligations?');
  await page.locator('.send').click();
  await page.waitForSelector('.cite-chip', { timeout: 40000 });
  await page.waitForTimeout(800);
  const chips = await page.locator('.cite-chip').count();
  console.log(`VIEWER: rolePill="${rolePill.trim()}", uploadBtn=${uploadBtn}, ownerActions=${ownerActions}, askChips=${chips}`);
  await ctx.close();
}

await browser.close();
console.log(errors.length ? 'CONSOLE ERRORS:\n' + errors.join('\n') : 'OK — no console errors');
