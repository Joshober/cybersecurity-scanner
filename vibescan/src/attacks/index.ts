// Attack rules by category: crypto, injection, browser (XSS), file (path-traversal).

import type { Rule } from "../system/utils/rule-types.js";
import { weakHashingRule } from "./crypto/weak-hashing.js";
import { weakCiphersRule } from "./crypto/weak-ciphers.js";
import { deprecatedCiphersRule } from "./crypto/deprecated-ciphers.js";
import { fixedIvRule } from "./crypto/fixed-iv.js";
import { insecureRandomnessRule } from "./crypto/insecure-randomness.js";
import { hardcodedSecretsRule } from "./crypto/hardcoded-secrets.js";
import { defaultSecretFallbackRule } from "./crypto/default-secret-fallback.js";
import { jwtWeakSecretRule } from "./crypto/jwt-weak-sign.js";
import { disabledTlsRule } from "./crypto/disabled-tls.js";
import { codeInjectionRule } from "./injection/code-injection.js";
import { sqlInjectionRule } from "./injection/sql-injection.js";
import { commandInjectionRule } from "./injection/command-injection.js";
import { nosqlInjectionRule } from "./injection/nosql-injection.js";
import { sstiTemplateUserInputRule } from "./injection/ssti-template-user-input.js";
import { authzIdorDirectObjectReferenceRule } from "./injection/authz-idor-direct-object-reference.js";
import { openRedirectRule } from "./injection/open-redirect.js";
import { insecureDeserializeRule } from "./injection/insecure-deserialize.js";
import { ormRequestInputRule } from "./injection/orm-request-input.js";
import { xpathInjectionRule } from "./injection/xpath-injection.js";
import { logInjectionRule } from "./injection/log-injection.js";
import { xssRule } from "./browser/xss.js";
import { reactDangerouslyInnerHtmlRule } from "./browser/react-dangerously-html.js";
import { angularSanitizerBypassRule } from "./browser/angular-sanitizer-bypass.js";
import { pathTraversalRule } from "./file/path-traversal.js";
import { insecureCookieRule } from "./injection/insecure-cookie.js";
import { ipGuardSsrRule } from "./injection/ssrf-ip-guard.js";
import { axiosBypassRule } from "./injection/ssrf-axios-bypass.js";

export const cryptoRules: Rule[] = [
  weakHashingRule,
  weakCiphersRule,
  deprecatedCiphersRule,
  fixedIvRule,
  insecureRandomnessRule,
  hardcodedSecretsRule,
  defaultSecretFallbackRule,
  jwtWeakSecretRule,
  disabledTlsRule,
];

export const injectionRules: Rule[] = [
  codeInjectionRule,
  sqlInjectionRule,
  commandInjectionRule,
  openRedirectRule,
  insecureDeserializeRule,
  pathTraversalRule,
  xssRule,
  reactDangerouslyInnerHtmlRule,
  angularSanitizerBypassRule,
  nosqlInjectionRule,
  sstiTemplateUserInputRule,
  authzIdorDirectObjectReferenceRule,
  ormRequestInputRule,
  xpathInjectionRule,
  logInjectionRule,
  insecureCookieRule,
  ipGuardSsrRule,
  axiosBypassRule,
];
