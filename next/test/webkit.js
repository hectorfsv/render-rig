#!/usr/bin/env node
/*
 * Run one test harness in REAL WebKit (Playwright's Safari 18.4 engine, the one
 * ../../webkit-check uses) and print the harness's verdict from document.title,
 * in the same PASS/FAIL line format run.sh already counts.
 *
 *   node test/webkit.js <harness.html?query> <width> <height> [deviceScaleFactor]
 *
 * Why not Chromium only: chrome-headless-shell's virtual time never runs the
 * rendering loop, so ResizeObserver (like requestAnimationFrame) never fires
 * there, and Hector's browser is Safari. A harness ends by writing "[done]".
 */
const path = require('path');
let pw;
try { pw = require(path.join(__dirname, '../../../webkit-check/node_modules/playwright')); }
catch (e) { console.log('FAIL  playwright not found in ../webkit-check (npm install there)'); process.exit(0); }

(async () => {
  const [file, w, h, dpr] = process.argv.slice(2);
  const browser = await pw.webkit.launch();
  try {
    const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +(dpr || 1) });
    await page.goto('file://' + file);
    try {
      await page.waitForFunction(() => /\[done\]|TIMED OUT/.test(document.title), null, { timeout: 150000 });
    } catch (e) { /* print whatever it got to - a missing [done] is itself the finding */ }
    const t = await page.evaluate(() => document.title);
    const body = t.replace(/^§|§$/g, '');
    console.log(/\[done\]|TIMED OUT/.test(body) ? body : body + '\nFAIL  harness never finished in WebKit');
  } finally { await browser.close(); }
})();
