#Requires -Version 5.1
$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$DvnaDefault = Join-Path $RepoRoot "benchmarks\dvna\dvna"
$DvnaLegacy = Join-Path $RepoRoot "dvna"
$DvnaRoot = if ($env:DVNA_ROOT) { $env:DVNA_ROOT } elseif (Test-Path $DvnaDefault) { $DvnaDefault } else { $DvnaLegacy }

if (-not (Test-Path $DvnaRoot)) {
  Write-Error "DVNA not found at $DvnaRoot. Clone per benchmarks/dvna/README.md or set DVNA_ROOT."
}

$stamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$outDir = Join-Path $RepoRoot "benchmarks\results\${stamp}_dvna_vibescan"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$cli = Join-Path $RepoRoot "dist\system\cli\index.js"

Push-Location $RepoRoot
try {
  npm run build
  node $cli scan $DvnaRoot --format json --exclude-vendor --benchmark-metadata | Out-File -Encoding utf8 (Join-Path $outDir "vibescan.json")
  Write-Host "Wrote $(Join-Path $outDir 'vibescan.json')"
}
finally {
  Pop-Location
}
