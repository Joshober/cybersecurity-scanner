// Regression checks for DVNA benchmark-style patterns (open redirect, deserialize, ORM, EJS DOM XSS).

import { describe, it } from "node:test";
import { scanSource, assertHasRuleId } from "../helpers.mjs";

describe("DVNA-oriented pattern rules", () => {
  it("open redirect: res.redirect(req.query.url)", () => {
    assertHasRuleId(scanSource("function r(req,res){res.redirect(req.query.url);}"), "injection.open-redirect");
  });

  it("deserialize: unserialize on non-literal", () => {
    assertHasRuleId(
      scanSource("const s=require('node-serialize'); s.unserialize(buf.toString('utf8'));"),
      "injection.deserialize.untrusted"
    );
  });

  it("ORM: findOne where login is passport-local username identifier", () => {
    assertHasRuleId(
      scanSource(
        "db.User.findOne({ where: { login: username } }).then(function (user) { return user; });"
      ),
      "injection.orm.request-in-query"
    );
  });

  it("EJS inline script: innerHTML with member access is scanned", () => {
    const tpl = `<div></div>
<script>
  var c = row.insertCell(0);
  c.innerHTML = users[i].id;
</script>`;
    assertHasRuleId(scanSource(tpl, "views/adminusers.ejs"), "injection.xss");
  });
});
