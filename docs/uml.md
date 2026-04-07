sequenceDiagram
autonumber
participant U as User
participant C as CLI
participant S as Scanner
participant T as TS Context
participant P as Parser
participant R as Rule Engine
participant D as Taint Engine
participant X as Route/Dep Analyzers
participant F as Formatter

U->>C: vibescan scan <project> [options]
C->>S: scanProject(root, options)

alt tsAnalysis = semantic/auto
  S->>T: createTsProjectContext()
  T-->>S: program/typeChecker/warnings
end

loop each source file
  S->>P: parseFile()
  P-->>S: AST + parserKind + services
  S->>R: runRules(AST, context)
  R-->>S: ruleFindings
  S->>D: analyze(AST, context)
  D-->>S: taintFindings
end

S->>X: build route graph
S->>X: analyze third-party surface
X-->>S: route/dependency insights

S->>F: formatProjectJson/SARIF/HTML
F-->>C: serialized report
C-->>U: findings + summary + warnings
