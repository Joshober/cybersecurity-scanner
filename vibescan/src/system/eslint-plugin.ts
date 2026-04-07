// ESLint plugin that runs the same security rules as the standalone scanner.

import type { ESLint, Rule as ESLintRuleNamespace } from "eslint";
import type { Node } from "estree";
import { cryptoRules, injectionRules } from "../attacks/index.js";
import type { Rule } from "./utils/rule-types.js";
import { buildParentMap } from "./walker.js";

function createEslintRule(rule: Rule): ESLintRuleNamespace.RuleModule {
  const messageId = rule.id.replace(/\./g, "_");
  return {
    meta: {
      type: "problem",
      docs: {
        description: rule.message,
        recommended: true,
      },
      schema: [],
      messages: {
        [messageId]: rule.message,
      },
    },
    create(context: ESLintRuleNamespace.RuleContext) {
      const ast = context.getSourceCode().ast as Node;
      const parentMap = buildParentMap(ast);
      const getParent = (n: Node) => parentMap.get(n) ?? null;
      const report = (node: import("estree").Node, data?: Record<string, unknown>) => {
        const n = node as import("estree").Node & { type: string };
        if (data?.message && typeof data.message === "string") {
          context.report({ node: n, message: data.message });
        } else {
          context.report({ node: n, messageId, data: (data ?? {}) as Record<string, string> });
        }
      };
      const getSource = () => undefined;
      const getResolvedCallee = () => null;
      const getTypeText = () => undefined;
      const ruleContext = { report, getSource, getParent, getResolvedCallee, getTypeText };

      const visit: Record<string, (node: import("estree").Node) => void> = {};
      for (const type of rule.nodeTypes) {
        visit[type] = (node) => {
          try {
            rule.check(ruleContext, node);
          } catch (_) {
            // Skip reporting when the rule throws.
          }
        };
      }
      return visit as ESLintRuleNamespace.RuleListener;
    },
  };
}

const allRules: Rule[] = [...cryptoRules, ...injectionRules];
const rules: Record<string, ESLintRuleNamespace.RuleModule> = {};
for (const rule of allRules) {
  rules[rule.id] = createEslintRule(rule);
}

const plugin: ESLint.Plugin = {
  meta: {
    name: "vibescan",
    version: "1.0.0",
  },
  rules,
};

export { plugin };
export default plugin;
