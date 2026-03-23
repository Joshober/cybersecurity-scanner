#Requires -Version 5.1
$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$Lab = Join-Path $RepoRoot "benchmarks\vuln-lab"
$Stamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$OutDir = Join-Path $RepoRoot "benchmarks\results\${Stamp}_vuln_lab_baselines"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

Write-Host "Installing VulnLab deps..."
Push-Location $Lab
try {
  npm ci
}
finally {
  Pop-Location
}

Write-Host "Building VibeScan..."
Push-Location $RepoRoot
try {
  npm run build -w vibescan
}
finally {
  Pop-Location
}

$Cli = Join-Path $RepoRoot "vibescan\dist\system\cli\index.js"
$Manifest = Join-Path $OutDir "manifest.json"
$Adj = Join-Path $OutDir "vibescan-adjudication"
$Proj = Join-Path $OutDir "vibescan-project.json"

Write-Host "VibeScan JSON + adjudication + manifest..."
& node $Cli scan $Lab --format json --exclude-vendor --benchmark-metadata --manifest $Manifest --export-adjudication $Adj | Out-File -Encoding utf8 $Proj

Write-Host "ESLint (json)..."
$EslintCfg = Join-Path $Lab ".eslintrc.cjs"
$EslintOut = Join-Path $OutDir "eslint.json"
Push-Location $RepoRoot
try {
  npx eslint -f json -c $EslintCfg "$Lab\server.js" | Out-File -Encoding utf8 $EslintOut
}
catch {
  Write-Warning "ESLint exited with errors (expected on vulnerable code); output still written."
}
finally {
  Pop-Location
}

Write-Host "npm audit..."
$AuditOut = Join-Path $OutDir "npm-audit.json"
Push-Location $Lab
try {
  npm audit --json | Out-File -Encoding utf8 $AuditOut
}
catch {
  Write-Warning "npm audit reported vulnerabilities; JSON still captured."
}
finally {
  Pop-Location
}

Write-Host "Done. Output: $OutDir"
Get-ChildItem $OutDir
