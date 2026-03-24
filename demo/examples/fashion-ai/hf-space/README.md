---
title: Fashion AI ML
emoji: 👗
colorFrom: pink
colorTo: blue
sdk: docker
pinned: false
---

# Fashion AI — Garment classification (CNN + ViT)

HTTP API for classifying clothing images. Used by the [Fashion AI](https://github.com/Alvaromp3/fashion_ai) app.

## API

- **GET /health** — Model status
- **POST /classify** — CNN classification (form field `imagen`: image file)
- **POST /classify-vit** — ViT classification (form field `imagen`)
- **POST /predict** — Alias for `/classify`

## Deploy both models (one Space)

From the **repo root** (with `huggingface-cli login` and `gh auth login` done):

- **Windows:** `npm run hf:deploy`
- **macOS/Linux:** `./hf-space/scripts/setup-space.sh`

This creates/updates the Space and uploads the Dockerfile + app so **both CNN and ViT** are built and served. The Dockerfile requires both model assets on the GitHub release (see below). Set your backend **ML_SERVICE_URL** to the Space app URL printed at the end (e.g. `https://YOUR_USER-fashion-ai-ml.hf.space`).

## Setup (one-time, if not using the script)

1. **GitHub Release:** Create a release (e.g. tag `models-v1.0`) and attach **both**:
   - `modelo_ropa.h5` (or `cnn_model_v1.zip`)
   - `vision_transformer_moda_modelo.keras` (or `vit_model_v1.zip`)

2. **Space Settings → Repository secrets:** Add
   - `GITHUB_REPO` = `your-username/fashion_ai`
   - `MODELS_RELEASE_TAG` = `models-v1.0` (optional)
   - `GITHUB_TOKEN` = (only if the repo is private)

3. **Rebuild** the Space. Both models download at build time; inference runs on CPU (16 GB RAM).

## ViT in a separate Space (optional)

If you call ViT rarely, run ViT in a **second Space** so the main Space stays CNN-only (faster, less RAM). Use **Dockerfile.vit** in the new Space (only downloads the ViT model). In your backend set:
- `ML_SERVICE_URL` = main Space (CNN)
- `ML_VIT_SERVICE_URL` = ViT-only Space URL  
The backend will call the ViT Space only for `/classify-vit` and `/vit-base64`.

## CORS

Set **Variables** → `CORS_ORIGINS` to your frontend URL (e.g. `https://your-app.pages.dev`) or `*` for testing.
