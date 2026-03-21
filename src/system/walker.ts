import type { Node } from "estree";

/** Parent pointer map for walking from a node toward the root (e.g. SSRF guard rules). */
export function buildParentMap(root: Node): WeakMap<Node, Node | null> {
  const parents = new WeakMap<Node, Node | null>();
  function visit(node: Node, parent: Node | null): void {
    parents.set(node, parent);
    for (const key of Object.keys(node) as (keyof Node)[]) {
      const value = (node as unknown as Record<string, unknown>)[key];
      if (value == null) continue;
      if (Array.isArray(value)) {
        for (const el of value) {
          if (el && typeof el === "object" && "type" in el) visit(el as Node, node);
        }
      } else if (typeof value === "object" && value !== null && "type" in value) {
        visit(value as Node, node);
      }
    }
  }
  visit(root, null);
  return parents;
}

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
