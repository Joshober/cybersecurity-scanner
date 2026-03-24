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
import { jwtWeakVerifySecretRule } from "./crypto/jwt-weak-test.js";
import { disabledTlsRule } from "./crypto/disabled-tls.js";
import { codeInjectionRule } from "./injection/code-injection.js";
import { sqlInjectionRule } from "./injection/sql-injection.js";
import { commandInjectionRule } from "./injection/command-injection.js";
import { nosqlInjectionRule } from "./injection/nosql-injection.js";
import { xpathInjectionRule } from "./injection/xpath-injection.js";
import { logInjectionRule } from "./injection/log-injection.js";
import { xssRule } from "./browser/xss.js";
import { pathTraversalRule } from "./file/path-traversal.js";
import { insecureCookieRule } from "./injection/insecure-cookie.js";
import { prototypePollutionRule } from "./injection/prototypePollution.js";
import { ipGuardSsrRule } from "../system/ai/ipGuard.js";
import { axiosBypassRule } from "../system/ai/axiosBypass.js";
import {
  llmDynamicSystemPromptRule,
  llmRagTemplateMixingRule,
  llmUnsafeHtmlOutputRule,
} from "./injection/llm-integration.js";

export const cryptoRules: Rule[] = [
  weakHashingRule,
  weakCiphersRule,
  deprecatedCiphersRule,
  fixedIvRule,
  insecureRandomnessRule,
  hardcodedSecretsRule,
  defaultSecretFallbackRule,
  jwtWeakSecretRule,
  jwtWeakVerifySecretRule,
  disabledTlsRule,
];

export const injectionRules: Rule[] = [
  codeInjectionRule,
  sqlInjectionRule,
  commandInjectionRule,
  pathTraversalRule,
  xssRule,
  nosqlInjectionRule,
  xpathInjectionRule,
  logInjectionRule,
  insecureCookieRule,
  prototypePollutionRule,
  ipGuardSsrRule,
  axiosBypassRule,
  llmDynamicSystemPromptRule,
  llmRagTemplateMixingRule,
  llmUnsafeHtmlOutputRule,
];
