/**
 * Renders docs/vibescan/vibescan-research-poster.html in headless Chromium using
 * print CSS (@page 48in × 36in) and writes a single-page PDF suitable for large-format printing.
 *
 * Usage (repo root):
 *   node benchmarks/scripts/poster-html-to-pdf.mjs
 *   node benchmarks/scripts/poster-html-to-pdf.mjs --out C:/Users/Josh/Downloads/poster-print.pdf
 *   node benchmarks/scripts/poster-html-to-pdf.mjs --dpr 4
 *   node benchmarks/scripts/poster-html-to-pdf.mjs --media screen
 *   node benchmarks/scripts/poster-html-to-pdf.mjs --mode ppt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "../..");

function parseArgs(argv) {
  let out = path.join(repoRoot, "docs/vibescan/vibescan-research-poster-print.pdf");
  let dpr = 4;
  let media = "print";
  let mode = "print"; // "print" | "screen" | "ppt"
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--out" && argv[i + 1]) {
      out = path.resolve(argv[++i]);
      continue;
    }
    if (argv[i] === "--dpr" && argv[i + 1]) {
      const parsed = Number(argv[++i]);
      if (Number.isFinite(parsed) && parsed > 0) {
        dpr = parsed;
      }
      continue;
    }
    if (argv[i] === "--media" && argv[i + 1]) {
      const m = String(argv[++i]).toLowerCase();
      if (m === "print" || m === "screen") media = m;
      continue;
    }
    if (argv[i] === "--mode" && argv[i + 1]) {
      const m = String(argv[++i]).toLowerCase();
      if (m === "print" || m === "screen" || m === "ppt") mode = m;
    }
  }
  // Back-compat: --media affects render; --mode is preferred.
  if (mode === "print" && media === "screen") mode = "screen";
  return { out, dpr, media, mode };
}

async function main() {
  const { out, dpr, mode } = parseArgs(process.argv);
  const htmlPath = path.join(repoRoot, "docs/vibescan/vibescan-research-poster.html");
  if (!fs.existsSync(htmlPath)) {
    console.error("Missing poster HTML.");
    process.exit(1);
  }

  const fileUrl = pathToFileURL(htmlPath).href;
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--font-render-hinting=none"],
  });

  try {
    const page = await browser.newPage();
    // Large viewport so @media (max-width:1600px) does not collapse the poster grid before print.
    await page.setViewport({
      width: 1920,
      height: 1280,
      deviceScaleFactor: dpr,
    });
    await page.goto(fileUrl, { waitUntil: "networkidle0", timeout: 120000 });
    await page.evaluate(() => document.fonts.ready);

    if (mode === "print") {
      // Use print stylesheet: .poster becomes 48in × 36in per vibescan-research-poster.html
      await page.emulateMediaType("print");
    } else if (mode === "screen") {
      // Match on-screen poster rendering, but still export at 48"×36".
      // Ensure desktop layout and disable any scale transforms.
      await page.emulateMediaType("screen");
      await page.addStyleTag({
        content: `
          html, body { margin: 0 !important; padding: 0 !important; background: #cbd5e1 !important; }
          :root { --poster-scale: 1 !important; }
          .poster { transform: none !important; position: absolute !important; left: 0 !important; top: 0 !important; }
        `,
      });
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    } else {
      // PowerPoint-like poster printing:
      // Treat the on-screen poster as a 16"×12" slide (1536×1152 @ 96DPI) and scale it up 3×
      // to fill a 48"×36" poster (same 4:3 aspect ratio). This avoids any @media print reflow.
      await page.emulateMediaType("screen");
      await page.addStyleTag({
        content: `
          html, body { margin: 0 !important; padding: 0 !important; background: #ffffff !important; }
          :root { --poster-scale: 1 !important; }
          .poster {
            width: 1536px !important;
            height: 1152px !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: hidden !important;
            transform: scale(3) !important;
            transform-origin: top left !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
          }
        `,
      });
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    }

    await page.pdf({
      path: out,
      width: "48in",
      height: "36in",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    console.log(`Wrote ${out}`);
    console.log(
      `  (48" × 36", mode=${mode}, backgrounds on, dpr=${dpr} for higher raster quality)`
    );
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
