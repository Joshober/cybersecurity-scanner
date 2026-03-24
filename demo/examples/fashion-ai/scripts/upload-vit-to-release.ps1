# Upload the local ViT model as vision_transformer_moda_modelo.keras to the GitHub release.
# The HF Space Dockerfile downloads it directly (no zip). Run from repo root: .\scripts\upload-vit-to-release.ps1 [RELEASE_TAG]
# Requires: gh CLI, gh auth login. Release must already exist (e.g. models-v1.0).

param([string]$ReleaseTag = "models-v1.0")

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$VitPath = Join-Path $RepoRoot "ml-service\vision_transformer_moda_modelo.keras"

if (-not (Test-Path $VitPath)) {
    Write-Host "Error: ViT model not found at $VitPath" -ForegroundColor Red
    exit 1
}

$sizeMB = [math]::Round((Get-Item $VitPath).Length / 1MB, 1)
Write-Host "Uploading vision_transformer_moda_modelo.keras ($sizeMB MB) to release $ReleaseTag..." -ForegroundColor Cyan

$repo = gh repo view --json nameWithOwner -q .nameWithOwner 2>$null
if (-not $repo) {
    Write-Host "Error: gh not logged in or not in a git repo. Run: gh auth login" -ForegroundColor Red
    exit 1
}

gh release view $ReleaseTag 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Release $ReleaseTag not found. Create it first (e.g. with scripts/publish-models-release.sh) or use your fork." -ForegroundColor Red
    exit 1
}

# Upload the .keras file directly; --clobber replaces if it already exists
gh release upload $ReleaseTag $VitPath --clobber 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Upload failed. Check gh auth and repo permissions." -ForegroundColor Red
    exit 1
}

Write-Host "Done. Release now has vision_transformer_moda_modelo.keras. Rebuild your HF Space." -ForegroundColor Green
Write-Host "URL: https://github.com/$repo/releases/tag/$ReleaseTag"
