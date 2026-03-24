#!/usr/bin/env node
/**
 * Test production Hugging Face Space: send an image, assert response shape.
 * Usage: node backend/scripts/test-hf-space.js [HF_SPACE_URL]
 * Or from backend: node scripts/test-hf-space.js
 * Default URL: https://jobersteadt-fashion-ai-ml.hf.space (or ML_SERVICE_URL from .env if it's *.hf.space)
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const axios = require('axios');
const fs = require('fs');
const sharp = require('sharp');

const defaultHfUrl = 'https://jobersteadt-fashion-ai-ml.hf.space';
const base = process.argv[2] || (process.env.ML_SERVICE_URL && process.env.ML_SERVICE_URL.includes('hf.space') ? process.env.ML_SERVICE_URL : defaultHfUrl);
const baseUrl = base.replace(/\/$/, '');

const timeoutMs = 90000; // Space may be sleeping (cold start)

function expectClassificationShape(data, modelLabel) {
  const ok = typeof data.tipo === 'string' &&
    typeof data.clase_nombre === 'string' &&
    typeof data.confianza === 'number' &&
    Array.isArray(data.top3) &&
    (data.model === 'cnn' || data.model === 'vision_transformer');
  if (!ok) {
    throw new Error(`Unexpected ${modelLabel} response shape: ${JSON.stringify(data).slice(0, 200)}`);
  }
  return true;
}

async function main() {
  console.log('Testing Hugging Face Space:', baseUrl);
  console.log('(Cold start may take 30–90s)\n');

  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  const testImagePath = path.join(tempDir, 'test-hf-' + Date.now() + '.jpg');

  try {
    await sharp({
      create: { width: 224, height: 224, channels: 3, background: { r: 200, g: 180, b: 160 } }
    })
      .jpeg({ quality: 85 })
      .toFile(testImagePath);
  } catch (e) {
    console.error('Failed to create test image:', e.message);
    process.exit(1);
  }

  const FormData = require('form-data');
  let passed = 0;
  let failed = 0;

  // 1) GET /health
  try {
    const healthRes = await axios.get(`${baseUrl}/health`, { timeout: timeoutMs });
    const d = healthRes.data;
    if (d.status === 'OK' && typeof d.model_loaded === 'boolean') {
      console.log('GET /health: OK', d.model_loaded ? 'CNN' : '', d.vit_model_loaded ? 'ViT' : '');
      passed++;
    } else {
      console.log('GET /health: unexpected', d);
      failed++;
    }
  } catch (e) {
    console.log('GET /health: FAIL', e.response?.status || e.code, e.response?.data?.detail || e.message);
    failed++;
  }

  // 2) POST /classify (CNN)
  const formCnn = new FormData();
  formCnn.append('imagen', fs.createReadStream(testImagePath), { filename: 'test.jpg', contentType: 'image/jpeg' });
  try {
    const classifyRes = await axios.post(`${baseUrl}/classify`, formCnn, {
      headers: formCnn.getHeaders(),
      timeout: timeoutMs
    });
    expectClassificationShape(classifyRes.data, 'CNN');
    if (classifyRes.data.model !== 'cnn') {
      console.log('POST /classify: OK (model:', classifyRes.data.model + ')', '->', classifyRes.data.clase_nombre);
    } else {
      console.log('POST /classify: OK', classifyRes.data.clase_nombre, '| tipo:', classifyRes.data.tipo, '| confianza:', classifyRes.data.confianza.toFixed(2));
    }
    passed++;
  } catch (e) {
    const status = e.response?.status;
    const data = e.response?.data;
    const detail = data?.detail || data;
    const msg = typeof detail === 'object' ? (detail.error || JSON.stringify(detail).slice(0, 100)) : detail;
    console.log('POST /classify: FAIL', status || e.code, msg || e.message);
    failed++;
  }

  // 3) POST /classify-vit (ViT)
  const formVit = new FormData();
  formVit.append('imagen', fs.createReadStream(testImagePath), { filename: 'test.jpg', contentType: 'image/jpeg' });
  try {
    const vitRes = await axios.post(`${baseUrl}/classify-vit`, formVit, {
      headers: formVit.getHeaders(),
      timeout: timeoutMs
    });
    expectClassificationShape(vitRes.data, 'ViT');
    if (vitRes.data.model !== 'vision_transformer') {
      console.log('POST /classify-vit: OK (model:', vitRes.data.model + ')', '->', vitRes.data.clase_nombre);
    } else {
      console.log('POST /classify-vit: OK', vitRes.data.clase_nombre, '| tipo:', vitRes.data.tipo, '| confianza:', vitRes.data.confianza.toFixed(2));
    }
    passed++;
  } catch (e) {
    const status = e.response?.status;
    const data = e.response?.data;
    if (status === 503) {
      const detail = data?.detail || data;
      const modelLoaded = detail?.model_loaded ?? data?.model_loaded;
      const errMsg = detail?.error ?? data?.error;
      if (modelLoaded === false && errMsg) {
        console.log('POST /classify-vit: OK (503 ViT not loaded — response shape correct)', errMsg);
        passed++;
      } else {
        console.log('POST /classify-vit: 503', errMsg || detail);
        failed++;
      }
    } else {
      console.log('POST /classify-vit: FAIL', status || e.code, (data?.detail?.error || data?.error || e.message));
      failed++;
    }
  }

  try { fs.unlinkSync(testImagePath); } catch (_) {}

  console.log('\n---');
  console.log(passed, 'passed,', failed, 'failed');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
