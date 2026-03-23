#Requires -Version 5.1
$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$DvnaDefault = Join-Path $RepoRoot "benchmarks\dvna\dvna"
$DvnaLegacy = Join-Path $RepoRoot "dvna"
$DvnaRoot = if ($env:DVNA_ROOT) { $env:DVNA_ROOT } elseif (Test-Path $DvnaDefault) { $DvnaDefault } else { $DvnaLegacy }
if (-not (Test-Path $DvnaRoot)) {
  Write-Error "DVNA not found at $DvnaRoot."
}
$stamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$outDir = Join-Path $RepoRoot "benchmarks\results\${stamp}_dvna_eslint"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$outFile = Join-Path $outDir "eslint.json"
Push-Location $RepoRoot
try {
  npx eslint -f json -c benchmarks/results/legacy/eslint-dvna.eslintrc.cjs "$DvnaRoot/**/*.js" | Out-File -Encoding utf8 $outFile
  Write-Host "Wrote $outFile"
}
finally {
  Pop-Location
}
