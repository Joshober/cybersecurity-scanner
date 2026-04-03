#Requires -Version 5.1
<#
  Downloads the CodeQL CLI bundle (Windows) if missing, builds a JavaScript database
  for benchmarks/dvna/dvna, runs the javascript-security-and-quality query suite,
  and writes SARIF + a manifest under benchmarks/results/.

  Prerequisites: GitHub CLI (`gh`) for release download, or place codeql-win64.zip
  in benchmarks/.cache/ and extract to benchmarks/.cache/codeql/

  Usage (repo root):
    pwsh -File benchmarks/scripts/run-codeql-dvna.ps1
#>
$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$Dvna = Join-Path $Root "benchmarks\dvna\dvna"
$Cache = Join-Path $Root "benchmarks\.cache"
$CodeqlRoot = Join-Path $Cache "codeql"
$ZipPath = Join-Path $Cache "codeql-win64.zip"

New-Item -ItemType Directory -Force -Path $Cache | Out-Null

if (-not (Test-Path (Join-Path $CodeqlRoot "codeql.cmd"))) {
  if (-not (Test-Path $ZipPath)) {
    Write-Host "Downloading CodeQL CLI bundle (win64) via gh release download..."
    Push-Location $Cache
    try {
      gh release download "v2.25.1" -R "github/codeql-cli-binaries" -p "codeql-win64.zip" --clobber
    } finally {
      Pop-Location
    }
  }
  if (-not (Test-Path $ZipPath)) {
    throw "codeql-win64.zip not found at $ZipPath - install gh and retry, or download manually from https://github.com/github/codeql-cli-binaries/releases"
  }
  Write-Host "Extracting CodeQL (one-time)..."
  Expand-Archive -Path $ZipPath -DestinationPath $Cache -Force
  $extracted = Get-ChildItem $Cache -Directory | Where-Object { $_.Name -like "codeql" -or $_.Name -like "codeql-*" } | Select-Object -First 1
  if ($extracted -and $extracted.FullName -ne $CodeqlRoot) {
    if (Test-Path $CodeqlRoot) { Remove-Item $CodeqlRoot -Recurse -Force }
    Move-Item $extracted.FullName $CodeqlRoot
  }
}

$CodeqlCmd = Join-Path $CodeqlRoot "codeql.cmd"
if (-not (Test-Path $CodeqlCmd)) {
  throw "codeql.cmd not found under $CodeqlRoot"
}

$Ts = Get-Date -Format "yyyy-MM-dd_HHmmss"
$OutDir = Join-Path $Root "benchmarks\results\${Ts}_dvna_codeql_v2.25.1"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$DbDir = Join-Path $OutDir "codeql-db"

Write-Host "Creating CodeQL database at $DbDir"
& $CodeqlCmd database create $DbDir --language=javascript "--source-root=$Dvna" --overwrite

Write-Host "Ensuring JavaScript query pack is available..."
& $CodeqlCmd pack download codeql/javascript-queries 2>&1 | Out-Null

Write-Host "Analyzing with javascript-security-and-quality suite..."
$SarifOut = Join-Path $OutDir "codeql.sarif"
$Suite = "codeql/javascript-queries:codeql-suites/javascript-security-and-quality.qls"
& $CodeqlCmd database analyze $DbDir $Suite --format=sarifv2.1.0 "--output=$SarifOut"

Push-Location $Dvna
try { $ShaDvna = (git rev-parse HEAD).Trim() } finally { Pop-Location }
Push-Location $Root
try { $ShaRepo = (git rev-parse HEAD).Trim() } finally { Pop-Location }

$manifest = @{
  benchmarkName = "Damn Vulnerable Node Application (DVNA)"
  benchmarkSlug = "dvna"
  tool            = "codeql"
  bundleVersion   = "2.25.1"
  sourceRepo      = @{ commitHash = $ShaDvna.Trim(); originLabel = "benchmarks/dvna/dvna" }
  scannerRepo     = @{ commitHash = $ShaRepo.Trim() }
  command         = @(
    "codeql pack download codeql/javascript-queries"
    "codeql database create $DbDir --language=javascript --source-root=$Dvna --overwrite"
    "codeql database analyze $DbDir codeql/javascript-queries:codeql-suites/javascript-security-and-quality.qls --format=sarifv2.1.0 --output=$SarifOut"
  )
  artifacts       = @("codeql.sarif", "codeql-db/")
  runDateUtc      = (Get-Date).ToUniversalTime().ToString("o")
}
$manifest | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $OutDir "manifest.json") -Encoding utf8

Write-Host "Done. Output: $OutDir"
