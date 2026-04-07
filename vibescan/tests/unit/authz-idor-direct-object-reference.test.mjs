import { describe, it } from "node:test";
import { scanSource, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

describe("authz.idor.direct-object-reference", () => {
  it("flags model lookup using req.params.id", () => {
    assertHasRuleId(
      scanSource("async function h(req){return User.findByPk(req.params.id);}"),
      "authz.idor.direct-object-reference"
    );
  });

  it("flags findOne where id comes from req params", () => {
    assertHasRuleId(
      scanSource("async function h(req){return User.findOne({where:{id:req.params.id}});}"),
      "authz.idor.direct-object-reference"
    );
  });

  it("does not flag constant object id lookup", () => {
    assertNoRuleId(
      scanSource("async function h(req){return User.findByPk(1);}"),
      "authz.idor.direct-object-reference"
    );
  });
});
