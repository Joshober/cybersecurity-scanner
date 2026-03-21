// jwt.sign weak secret + res.cookie missing flags — used by pattern rules / taint helpers.

import type { CallExpression, Expression } from "estree";

function argAt(node: CallExpression, i: number): Expression | undefined {
  const a = node.arguments[i];
  if (!a || a.type === "SpreadElement") return undefined;
  return a as Expression;
}

export function isJwtSignCall(calleeName: string): boolean {
  return (
    calleeName === "jwt.sign" ||
    calleeName === "jsonwebtoken.sign" ||
    (calleeName.endsWith(".sign") &&
      (calleeName.startsWith("jwt.") || calleeName.startsWith("jsonwebtoken.")))
  );
}

export function isResCookieCall(calleeName: string): boolean {
  return calleeName === "res.cookie" || calleeName === "response.cookie";
}

export function getJwtSignSecretArg(node: CallExpression): Expression | undefined {
  return argAt(node, 1);
}

export function getResCookieOptionsArg(node: CallExpression): Expression | undefined {
  return argAt(node, 2);
}
