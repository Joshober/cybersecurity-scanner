// LLM integration heuristics: system prompt mixing, RAG-style templates, HTML sinks.

import { describe, it } from "node:test";
import { scanSource, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

describe("llm integration rules", () => {
  it("dynamic system property flagged", () => {
    assertHasRuleId(
      scanSource("const o = { system: `You are helpful. ${userText}` };"),
      "injection.llm.dynamic-system-prompt"
    );
  });

  it("literal system property not flagged", () => {
    assertNoRuleId(
      scanSource('const o = { system: "You are a concise assistant." };'),
      "injection.llm.dynamic-system-prompt"
    );
  });

  it("rag-style template with interpolation flagged", () => {
    assertHasRuleId(
      scanSource("const p = `Context: ${chunks}`;"),
      "injection.llm.rag-template-mixing"
    );
  });

  it("template without retrieval wording not flagged", () => {
    assertNoRuleId(scanSource("const p = `Hello ${name}`;"), "injection.llm.rag-template-mixing");
  });

  it("innerHTML from completion identifier flagged", () => {
    assertHasRuleId(scanSource("el.innerHTML = completion;"), "injection.llm.unsafe-html-output");
  });

  it("innerHTML from unrelated identifier not flagged by llm rule", () => {
    assertNoRuleId(scanSource("el.innerHTML = userInput;"), "injection.llm.unsafe-html-output");
  });
});
