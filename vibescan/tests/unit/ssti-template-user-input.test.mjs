import { describe, it } from "node:test";
import { scanSource, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

describe("injection.ssti.template-user-input", () => {
  it("flags res.render with req query-derived template", () => {
    assertHasRuleId(
      scanSource("function h(req,res){res.render(req.query.view,{a:1});}"),
      "injection.ssti.template-user-input"
    );
  });

  it("flags ejs.render with req body template", () => {
    assertHasRuleId(
      scanSource("const ejs=require('ejs'); function h(req){return ejs.render(req.body.tpl,{})}"),
      "injection.ssti.template-user-input"
    );
  });

  it("does not flag constant template name", () => {
    assertNoRuleId(
      scanSource("function h(req,res){res.render('dashboard',{a:1});}"),
      "injection.ssti.template-user-input"
    );
  });
});
