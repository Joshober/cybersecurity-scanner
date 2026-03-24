#!/usr/bin/env node
/**
 * Test backend ML integration: /api/health, /api/ml-health, /api/classify, /api/classify/vit.
 * Run from repo root: node backend/scripts/test-ml-integration.js
 * Or from backend: node scripts/test-ml-integration.js
 * Requires: backend running on PORT (default 4000), and ML_SERVICE_URL reachable (local or HF).
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const axios = require('axios');
const fs = require('fs');
const sharp = require('sharp');

const BASE = process.env.BACKEND_URL || 'http://localhost:4000';

async function main() {
  console.log('Testing backend ML integration at', BASE);
  console.log('ML_SERVICE_URL:', process.env.ML_SERVICE_URL || '(default localhost:6001)');
  console.log('');

  let ok = 0;
  let fail = 0;

  // 1) Backend health
  try {
    const r = await axios.get(`${BASE}/api/health`, { timeout: 5000 });
    if (r.data && (r.data.status === 'OK' || r.data.status === 'DEGRADED')) {
      console.log('GET /api/health: OK', r.data.status, r.data.mongodb ? `(mongodb: ${r.data.mongodb})` : '');
      ok++;
    } else {
      console.log('GET /api/health: unexpected', r.data);
      fail++;
    }
  } catch (e) {
    console.log('GET /api/health: FAIL', e.code || e.message);
    fail++;
  }

  // 2) ML health
  try {
    const r = await axios.get(`${BASE}/api/ml-health`, { timeout: 30000 });
    if (r.data && r.data.available) {
      console.log('GET /api/ml-health: OK', r.data.model_loaded ? 'CNN' : '', r.data.vit_model_loaded ? 'ViT' : '', r.data.woke_from_root ? '(woke from root)' : '');
      ok++;
    } else {
      console.log('GET /api/ml-health: not available', r.data?.error || r.data);
      fail++;
    }
  } catch (e) {
    const status = e.response?.status;
    const data = e.response?.data;
    if (status === 503 && data?.available === false) {
      console.log('GET /api/ml-health: 503 (expected if ML not running)', data?.hint || data?.error);
      fail++;
    } else {
      console.log('GET /api/ml-health: FAIL', e.code || e.message, status ? `(${status})` : '');
      fail++;
    }
  }

  // 3) Classify (CNN) - only if we have a way to create a test image
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  const testImagePath = path.join(tempDir, 'test-ml-' + Date.now() + '.jpg');
  try {
    await sharp({
      create: { width: 224, height: 224, channels: 3, background: { r: 128, g: 128, b: 128 } }
    })
      .jpeg({ quality: 80 })
      .toFile(testImagePath);
  } catch (e) {
    console.log('Could not create test image:', e.message);
  }

  if (fs.existsSync(testImagePath)) {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('imagen', fs.createReadStream(testImagePath), { filename: 'test.jpg', contentType: 'image/jpeg' });

    try {
      const r = await axios.post(`${BASE}/api/classify`, form, {
        headers: form.getHeaders(),
        timeout: 60000
      });
      if (r.data && typeof r.data.tipo === 'string' && (r.data.model === 'cnn' || r.data.model === 'vision_transformer')) {
        console.log('POST /api/classify: OK', r.data.model, '->', r.data.clase_nombre || r.data.tipo);
        ok++;
      } else {
        console.log('POST /api/classify: unexpected', r.data);
        fail++;
      }
    } catch (e) {
      const status = e.response?.status;
      const data = e.response?.data;
      console.log('POST /api/classify: FAIL', status || e.code, data?.error || e.message);
      fail++;
    }

    // 4) Classify ViT (same image)
    const formVit = new FormData();
    formVit.append('imagen', fs.createReadStream(testImagePath), { filename: 'test.jpg', contentType: 'image/jpeg' });
    try {
      const r = await axios.post(`${BASE}/api/classify/vit`, formVit, {
        headers: formVit.getHeaders(),
        timeout: 90000
      });
      if (r.data && typeof r.data.tipo === 'string' && (r.data.model === 'vision_transformer' || r.data.model === 'cnn')) {
        console.log('POST /api/classify/vit: OK', r.data.model, '->', r.data.clase_nombre || r.data.tipo);
        ok++;
      } else {
        console.log('POST /api/classify/vit: unexpected', r.data);
        fail++;
      }
    } catch (e) {
      const status = e.response?.status;
      const data = e.response?.data;
      console.log('POST /api/classify/vit: FAIL', status || e.code, data?.error || e.message);
      fail++;
    }

    try { fs.unlinkSync(testImagePath); } catch (_) {}
  }

  console.log('');
  console.log('---');
  console.log(ok, 'passed,', fail, 'failed');
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
