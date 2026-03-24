// Heuristics for risky LLM application patterns (prompt boundaries, RAG-style templates, HTML sinks).

import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import { isDynamicOrUserInput } from "../../system/utils/helpers.js";

const LLM_OUTPUT_NAME = /^(completion|assistantMessage|modelOutput|llmOutput|aiResponse|chatResponse)$/i;

function isSystemPropertyKey(key: Node): boolean {
  if (key.type === "Identifier" && key.name === "system") return true;
  if (key.type === "Literal" && key.value === "system") return true;
  return false;
}

function identifierOrMemberLooksLikeLlmOutput(node: Node): boolean {
  if (node.type === "Identifier") return LLM_OUTPUT_NAME.test(node.name);
  if (node.type === "MemberExpression" && node.property.type === "Identifier") {
    return LLM_OUTPUT_NAME.test(node.property.name);
  }
  return false;
}

function templateMentionsRetrievalContext(node: import("estree").TemplateLiteral): boolean {
  if (node.expressions.length === 0) return false;
  const text = node.quasis.map((q) => q.value.raw).join(" ");
  return /\b(retrieved|rag|chunks?|documents?|context)\b/i.test(text);
}

/** Dynamic `system` (or `"system"`) property values blur instruction vs untrusted data. */
export const llmDynamicSystemPromptRule: Rule = {
  id: "injection.llm.dynamic-system-prompt",
  message:
    "Dynamic or non-literal `system` prompt field may allow prompt injection if untrusted text is mixed with instructions.",
  why: "Treat system instructions and user/retrieved content as separate channels; delimit and validate external text before model calls.",
  fix: "Use structured message arrays, fixed system strings, or explicit delimiters and sanitization for retrieved/user content.",
  severity: "warning",
  category: "injection",
  cwe: 74,
  nodeTypes: ["ObjectExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "ObjectExpression") return;
    for (const prop of node.properties) {
      if (prop.type !== "Property" || prop.computed) continue;
      if (!isSystemPropertyKey(prop.key)) continue;
      if (isDynamicOrUserInput(prop.value)) context.report(prop);
    }
  },
};

/** Template literals that mention retrieval-style wording and embed expressions are a common indirect-injection surface. */
export const llmRagTemplateMixingRule: Rule = {
  id: "injection.llm.rag-template-mixing",
  message:
    "Template builds a prompt with retrieval/context wording and embedded expressions—verify untrusted chunks cannot override instructions.",
  why: "RAG and similar flows often concatenate documents into one string; attackers may hide instructions in retrieved content.",
  fix: "Separate system rules from retrieved text, use clear delimiters, strip or neutralize control-like patterns, and track provenance.",
  severity: "warning",
  category: "injection",
  cwe: 74,
  nodeTypes: ["TemplateLiteral"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "TemplateLiteral") return;
    if (templateMentionsRetrievalContext(node)) context.report(node);
  },
};

/** HTML sinks fed from typical LLM output variable names increase XSS and output-manipulation risk. */
export const llmUnsafeHtmlOutputRule: Rule = {
  id: "injection.llm.unsafe-html-output",
  message: "LLM or assistant output is inserted into HTML; treat model text as untrusted and encode or sanitize.",
  why: "Model output can contain markup or script; rendering it as HTML can cause XSS and misleading UI.",
  fix: "Use text nodes, a vetted HTML sanitizer, or structured rendering that does not interpret arbitrary HTML from the model.",
  severity: "warning",
  category: "injection",
  cwe: 79,
  nodeTypes: ["AssignmentExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "AssignmentExpression") return;
    if (node.left.type !== "MemberExpression") return;
    const prop = node.left.property;
    if (prop.type !== "Identifier") return;
    if (prop.name !== "innerHTML" && prop.name !== "outerHTML" && prop.name !== "insertAdjacentHTML") return;
    if (!identifierOrMemberLooksLikeLlmOutput(node.right)) return;
    context.report(node);
  },
};
