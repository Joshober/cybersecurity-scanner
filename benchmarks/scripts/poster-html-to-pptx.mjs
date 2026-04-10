/**
 * Renders docs/vibescan/vibescan-research-poster.html in headless Chromium,
 * screenshots the .poster element, and writes a single-slide .pptx that matches
 * the on-screen / print-to-PDF layout (same assets as the HTML poster).
 *
 * Usage (repo root):
 *   node benchmarks/scripts/poster-html-to-pptx.mjs
 *   node benchmarks/scripts/poster-html-to-pptx.mjs --out C:/Users/Josh/Downloads/poster.pptx
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import puppeteer from "puppeteer";

const require = createRequire(import.meta.url);
const pptxgen = require("pptxgenjs");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "../..");

function parseArgs(argv) {
  let out = path.join(repoRoot, "docs/vibescan/vibescan-research-poster.pptx");
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--out" && argv[i + 1]) {
      out = path.resolve(argv[++i]);
    }
  }
  return { out };
}

async function main() {
  const { out } = parseArgs(process.argv);
  const htmlPath = path.join(repoRoot, "docs/vibescan/vibescan-research-poster.html");
  if (!fs.existsSync(htmlPath)) {
    console.error("Missing poster HTML. Run: npm run benchmark:poster-charts");
    process.exit(1);
  }

  const tmpDir = path.join(repoRoot, ".tmp");
  fs.mkdirSync(tmpDir, { recursive: true });
  const tmpPng = path.join(tmpDir, "poster-screenshot.png");

  const fileUrl = pathToFileURL(htmlPath).href;
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--font-render-hinting=none"],
  });

  try {
    const page = await browser.newPage();
    // Viewport must be *wider than 1600px* or the poster’s @media (max-width:1600px)
    // switches to a stacked mobile layout — the export would not show the full poster grid.
    await page.setViewport({
      width: 1920,
      height: 1280,
      deviceScaleFactor: 2,
    });
    await page.goto(fileUrl, { waitUntil: "networkidle0", timeout: 120000 });

    // Full desktop layout: no body padding clipping, no CSS scale shrink on .poster.
    await page.addStyleTag({
      content: `
        html, body { margin: 0 !important; padding: 0 !important; background: #cbd5e1 !important; }
        :root { --poster-scale: 1 !important; }
        .poster { transform: none !important; }
      `,
    });
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

    const poster = await page.$(".poster");
    if (!poster) {
      throw new Error("No .poster element found in HTML");
    }
    const box = await poster.boundingBox();
    if (!box) {
      throw new Error("Could not measure .poster");
    }

    await poster.screenshot({ path: tmpPng, type: "png" });

    // CSS px → inches (96 CSS px per inch); matches PowerPoint’s logical slide size for this bitmap
    const wIn = box.width / 96;
    const hIn = box.height / 96;

    const pptx = new pptxgen();
    pptx.title = "VibeScan research poster";
    pptx.author = "Josh Obersteadt";
    pptx.defineLayout({ name: "POSTER", width: wIn, height: hIn });
    pptx.layout = "POSTER";

    const slide = pptx.addSlide();
    slide.addImage({
      path: tmpPng,
      x: 0,
      y: 0,
      w: wIn,
      h: hIn,
    });

    await pptx.writeFile({ fileName: out });
    console.log(`Wrote ${out}`);
    console.log(`  (${wIn.toFixed(2)}\" × ${hIn.toFixed(2)}\", from ${tmpPng})`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
