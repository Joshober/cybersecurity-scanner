import type { Node } from "estree";

// Recursively walk the AST and invoke the visitor for each node.
export function walk(node: Node, visitor: (n: Node) => void): void {
  visitor(node);
  for (const key of Object.keys(node) as (keyof Node)[]) {
    const value = (node as unknown as Record<string, unknown>)[key];
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const el of value) {
        if (el && typeof el === "object" && "type" in el) walk(el as Node, visitor);
      }
    } else if (typeof value === "object" && value !== null && "type" in value) {
      walk(value as Node, visitor);
    }
  }
}
