import { describe, it } from "node:test";
import { scanSource, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

describe("injection.xss.react-dangerously-set-inner-html", () => {
  it("flags createElement-style object when __html is dynamic", () => {
    assertHasRuleId(
      scanSource(
        `import React from "react"; const u = req.body.html; React.createElement("div", { dangerouslySetInnerHTML: { __html: u } });`
      ),
      "injection.xss.react-dangerously-set-inner-html"
    );
  });

  it("does not flag static __html literal", () => {
    assertNoRuleId(
      scanSource(
        `import React from "react"; React.createElement("div", { dangerouslySetInnerHTML: { __html: "<p>ok</p>" } });`
      ),
      "injection.xss.react-dangerously-set-inner-html"
    );
  });

  it("flags JSX attribute when __html is dynamic", () => {
    assertHasRuleId(
      scanSource(
        `export function F({ html }) { return <div dangerouslySetInnerHTML={{ __html: html }} />; }`,
        "component.tsx"
      ),
      "injection.xss.react-dangerously-set-inner-html"
    );
  });
});

describe("injection.xss.angular-sanitizer-bypass", () => {
  it("flags bypassSecurityTrustHtml with identifier argument", () => {
    assertHasRuleId(
      scanSource(
        `class C { constructor(s) { this.s = s; } m(x) { return this.s.bypassSecurityTrustHtml(x); } }`
      ),
      "injection.xss.angular-sanitizer-bypass"
    );
  });

  it("does not flag when argument is a string literal", () => {
    assertNoRuleId(
      scanSource(
        `class C { constructor(s) { this.s = s; } m() { return this.s.bypassSecurityTrustHtml("<b>ok</b>"); } }`
      ),
      "injection.xss.angular-sanitizer-bypass"
    );
  });

  it("flags bypassSecurityTrustScript", () => {
    assertHasRuleId(
      scanSource(`const y = getScript(); sanitizer.bypassSecurityTrustScript(y);`),
      "injection.xss.angular-sanitizer-bypass"
    );
  });
});
