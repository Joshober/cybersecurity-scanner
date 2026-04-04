// Extract inline <script> bodies from EJS/HTML templates so browser-side rules can run on the JS snippet.

export interface EjsScriptBlock {
  /** Raw script source (may include leading/trailing whitespace). */
  content: string;
  /** 1-based line number in the full file of the first line of `content` (line after `<script...>`). */
  baseLine: number;
}

export function extractEjsScriptBlocks(source: string): EjsScriptBlock[] {
  const out: EjsScriptBlock[] = [];
  const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const full = m[0];
    const content = m[1];
    const gt = full.indexOf(">");
    if (gt < 0) continue;
    const openEnd = m.index + gt + 1;
    const baseLine = source.slice(0, openEnd).split(/\r?\n/).length;
    out.push({ content, baseLine });
  }
  return out;
}
