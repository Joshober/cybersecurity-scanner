#Requires -Version 5.1
$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$DvnaDefault = Join-Path $RepoRoot "benchmarks\dvna\dvna"
$DvnaLegacy = Join-Path $RepoRoot "dvna"
$DvnaRoot = if ($env:DVNA_ROOT) { $env:DVNA_ROOT } elseif (Test-Path $DvnaDefault) { $DvnaDefault } else { $DvnaLegacy }

if (-not (Test-Path $DvnaRoot)) {
  Write-Error "DVNA not found at $DvnaRoot."
}

docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Error "Docker daemon not running or not installed. Start Docker Desktop or use WSL/Linux with Bearer; see results/bearer-dvna.txt"
}

$stamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$outDir = Join-Path $RepoRoot "benchmarks\results\${stamp}_dvna_bearer"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$outFile = Join-Path $outDir "bearer.json"

docker run --rm -v "${DvnaRoot}:/scan" bearer/bearer:latest-amd64 scan /scan --format json | Set-Content -Path $outFile -Encoding utf8
Write-Host "Wrote $outFile"
Write-Host "Append TP summary to results/dvna-evaluation.md and copy bearer-dvna.txt notes if first successful run."
