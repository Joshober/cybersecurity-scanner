# Run from repo root: .\hf-space\scripts\setup-space.ps1  OR  npm run hf:deploy
# Prereqs: gh auth login; Hugging Face via huggingface-cli login OR set HF_TOKEN / HUGGING_FACE_HUB_TOKEN in .env
# Ensures both CNN and ViT models are deployed (Dockerfile requires both from the GitHub release).

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$HF_SPACE_DIR = Split-Path -Parent $ScriptDir
$REPO_ROOT = Split-Path -Parent $HF_SPACE_DIR

# Avoid UnicodeEncodeError on Windows when huggingface-cli prints deprecation warning
$env:PYTHONIOENCODING = "utf-8"
$env:PYTHONUTF8 = "1"
# Don't let stderr from external commands (huggingface-cli, gh) terminate the script; we check $LASTEXITCODE instead
$ErrorActionPreference = "Continue"

# Load .env from repo root and backend so HF_TOKEN / HUGGING_FACE_HUB_TOKEN are available
foreach ($envFile in @("$REPO_ROOT\.env", "$REPO_ROOT\backend\.env")) {
    if (Test-Path $envFile) {
        Get-Content $envFile -Raw | ForEach-Object {
            $_ -split "`n" | ForEach-Object {
                if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
                    $key = $matches[1].Trim()
                    $val = $matches[2].Trim() -replace '^["'']|["'']$'
                    [Environment]::SetEnvironmentVariable($key, $val, 'Process')
                }
            }
        }
    }
}

$REPO = if ($env:GITHUB_REPO) { $env:GITHUB_REPO } else { "Alvaromp3/fashion_ai" }
$TAG = if ($env:MODELS_RELEASE_TAG) { $env:MODELS_RELEASE_TAG } else { "models-v1.0" }
$HF_SPACE_SLUG = if ($env:HF_SPACE_ID) { $env:HF_SPACE_ID } else { "fashion-ai-ml" }

# Use token from env (CLI reads HUGGING_FACE_HUB_TOKEN / HF_TOKEN automatically; no login needed)
$HFToken = if ($env:HF_TOKEN) { $env:HF_TOKEN } else { $env:HUGGING_FACE_HUB_TOKEN }
if ($HFToken) {
    $env:HUGGING_FACE_HUB_TOKEN = $HFToken
}

# Resolve full Space repo ID (username/fashion-ai-ml) for uploads
$whoamiOut = huggingface-cli whoami 2>&1
$HF_USER = ($whoamiOut | Where-Object { $_ -and ($_ -match '^[a-zA-Z0-9_-]+$') } | Select-Object -First 1)
if (-not $HF_USER) {
    Write-Host "Hugging Face not authenticated. Either:" -ForegroundColor Red
    Write-Host "  1. Run: huggingface-cli login" -ForegroundColor Yellow
    Write-Host "  2. Or add HF_TOKEN= or HUGGING_FACE_HUB_TOKEN= to backend\.env or repo root .env (e.g. after npm run env:vault-pull)" -ForegroundColor Yellow
    exit 1
}
$HF_SPACE_ID = "$HF_USER/$HF_SPACE_SLUG"

Write-Host "=== 1. GitHub: check release and assets (both models required) ===" -ForegroundColor Cyan
gh release view $TAG --repo $REPO
if ($LASTEXITCODE -ne 0) {
    Write-Host "Release $TAG not found. Create it and upload both: modelo_ropa.h5 (or cnn_model_v1.zip) AND vision_transformer_moda_modelo.keras (or vit_model_v1.zip)." -ForegroundColor Red
    exit 1
}
Write-Host "Release $TAG exists.`n" -ForegroundColor Green

Write-Host "=== 2. Hugging Face: create Space (Docker, both CNN + ViT) ===" -ForegroundColor Cyan
huggingface-cli repo create $HF_SPACE_SLUG --repo-type space --space_sdk docker --exist-ok
if ($LASTEXITCODE -ne 0) {
    Write-Host "HF create failed. Run: huggingface-cli login" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "=== 3. Upload hf-space files to the Space ===" -ForegroundColor Cyan
huggingface-cli upload $HF_SPACE_ID (Join-Path $HF_SPACE_DIR "app.py") "app.py" --repo-type space
huggingface-cli upload $HF_SPACE_ID (Join-Path $HF_SPACE_DIR "space_app.py") "space_app.py" --repo-type space
huggingface-cli upload $HF_SPACE_ID (Join-Path $HF_SPACE_DIR "requirements.txt") "requirements.txt" --repo-type space
huggingface-cli upload $HF_SPACE_ID (Join-Path $HF_SPACE_DIR "Dockerfile") "Dockerfile" --repo-type space
huggingface-cli upload $HF_SPACE_ID (Join-Path $HF_SPACE_DIR "README.md") "README.md" --repo-type space
$downloadScript = Join-Path $HF_SPACE_DIR "scripts\download_models.sh"
if (Test-Path $downloadScript) {
    huggingface-cli upload $HF_SPACE_ID $downloadScript "scripts/download_models.sh" --repo-type space
}
Write-Host ""

$SpaceUrl = "https://$HF_USER-$HF_SPACE_SLUG.hf.space" -replace "/", "-"
Write-Host "=== Done ===" -ForegroundColor Green
Write-Host "Space (CNN + ViT): https://huggingface.co/spaces/$HF_SPACE_ID"
Write-Host "App URL: $SpaceUrl"
Write-Host "Set backend ML_SERVICE_URL to: $SpaceUrl (no trailing slash). First build may take 10-15 min."
