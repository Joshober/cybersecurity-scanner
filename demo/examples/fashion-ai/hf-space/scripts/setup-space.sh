#!/usr/bin/env bash
# Run from repo root: ./hf-space/scripts/setup-space.sh  OR  npm run hf:deploy (Windows uses .ps1)
# Prereqs: gh auth login, huggingface-cli login (https://huggingface.co/settings/tokens)
# Deploys both CNN and ViT to one Space (Dockerfile requires both models from the release).

set -e
REPO="${GITHUB_REPO:-Alvaromp3/fashion_ai}"
TAG="${MODELS_RELEASE_TAG:-models-v1.0}"
HF_SPACE_SLUG="${HF_SPACE_ID:-fashion-ai-ml}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HF_SPACE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

HF_USER="$(huggingface-cli whoami 2>/dev/null)" || { echo "Run: huggingface-cli login"; exit 1; }
HF_SPACE_ID="$HF_USER/$HF_SPACE_SLUG"

echo "=== 1. GitHub: check release and assets (both models required) ==="
gh release view "$TAG" --repo "$REPO" || { echo "Release $TAG not found. Create it and upload both: modelo_ropa.h5 (or cnn_model_v1.zip) AND vision_transformer_moda_modelo.keras (or vit_model_v1.zip)."; exit 1; }
echo "Release $TAG exists."
echo ""

echo "=== 2. Hugging Face: create Space (Docker, both CNN + ViT) ==="
huggingface-cli repo create "$HF_SPACE_SLUG" --repo-type space --space_sdk docker --exist-ok
echo ""

echo "=== 3. Upload hf-space files to the Space ==="
huggingface-cli upload "$HF_SPACE_ID" "$HF_SPACE_DIR/app.py" "app.py" --repo-type space
huggingface-cli upload "$HF_SPACE_ID" "$HF_SPACE_DIR/space_app.py" "space_app.py" --repo-type space
huggingface-cli upload "$HF_SPACE_ID" "$HF_SPACE_DIR/requirements.txt" "requirements.txt" --repo-type space
huggingface-cli upload "$HF_SPACE_ID" "$HF_SPACE_DIR/Dockerfile" "Dockerfile" --repo-type space
huggingface-cli upload "$HF_SPACE_ID" "$HF_SPACE_DIR/README.md" "README.md" --repo-type space
huggingface-cli upload "$HF_SPACE_ID" "$HF_SPACE_DIR/scripts/download_models.sh" "scripts/download_models.sh" --repo-type space
echo ""

SPACE_APP_URL="https://${HF_USER}-${HF_SPACE_SLUG}.hf.space"
echo "=== Done ==="
echo "Space (CNN + ViT): https://huggingface.co/spaces/$HF_SPACE_ID"
echo "App URL: $SPACE_APP_URL"
echo "Set backend ML_SERVICE_URL to: $SPACE_APP_URL (no trailing slash). First build may take 10–15 min."
