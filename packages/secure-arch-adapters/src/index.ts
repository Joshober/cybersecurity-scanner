export type { AdapterFile, AdapterInitOptions, AdapterResult, SupportedTool } from "./types.js";
export { initCursorAdapter } from "./cursorAdapter.js";
export { initAmazonQAdapter } from "./amazonqAdapter.js";

import type { AdapterInitOptions, AdapterResult, SupportedTool } from "./types.js";
import { initAmazonQAdapter } from "./amazonqAdapter.js";
import { initCursorAdapter } from "./cursorAdapter.js";

export function runAdapter(tool: SupportedTool, opts: AdapterInitOptions): AdapterResult {
  switch (tool) {
    case "cursor":
      return initCursorAdapter(opts);
    case "amazonq":
      return initAmazonQAdapter(opts);
    default:
      throw new Error(`Unknown tool: ${String(tool)}`);
  }
}
