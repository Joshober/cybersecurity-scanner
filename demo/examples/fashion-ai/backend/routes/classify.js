const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, 'classify-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|heic|heif|bmp|tiff|tif/;
    const valid = allowedTypes.test(path.extname(file.originalname).toLowerCase()) ||
                  ['image/heic', 'image/heif', 'image/x-heic', 'image/x-heif'].includes(file.mimetype);
    cb(valid ? null : new Error('Image format not supported'), valid);
  }
});

/** True when ML is hosted (e.g. Hugging Face Space); use longer timeouts for cold start. */
function isHostedMl(url) {
  return /\.hf\.space|\.onrender\.com|https?:\/\/(?!localhost|127\.)/.test(url || '');
}

/** Poll ML service /health until vit_model_loaded is true or timeout. Returns true when ViT is ready. */
async function waitForVitReady(mlServiceUrl, maxWaitMs = 90000, pollIntervalMs = 4000) {
  const healthTimeoutMs = isHostedMl(mlServiceUrl) ? 25000 : 5000;
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    try {
      const health = await axios.get(`${mlServiceUrl}/health`, { timeout: healthTimeoutMs });
      if (health.data && health.data.vit_model_loaded) return true;
    } catch (_) { /* ML may still be starting or Space waking */ }
    await new Promise(r => setTimeout(r, pollIntervalMs));
  }
  return false;
}

/**
 * Run classification via ML service; handles HEIC conversion and cleanup.
 * For ViT requests, if the model is not ready yet, waits for it (polling /health) then retries once.
 * @param {import('express').Request} req - Must have req.file (multer)
 * @param {import('express').Response} res
 * @param {string} endpoint - e.g. '/classify' or '/classify-vit'
 */
async function processAndClassify(req, res, endpoint) {
  let convertedFilePath = null;

  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });

    // Use separate ViT Space when set (ViT called rarely; keeps main Space lighter)
    const isVit = endpoint === '/classify-vit';
    const mlServiceUrl = isVit && process.env.ML_VIT_SERVICE_URL
      ? process.env.ML_VIT_SERVICE_URL
      : (process.env.ML_SERVICE_URL || 'http://localhost:6001');
    let filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const isHeic = ['.heic', '.heif'].includes(fileExt) || 
                   ['image/heic', 'image/heif', 'image/x-heic', 'image/x-heif'].includes(req.file.mimetype);

    if (isHeic) {
      try {
        convertedFilePath = path.join(path.dirname(filePath), `converted-${Date.now()}.jpg`);
        await sharp(filePath).jpeg({ quality: 90 }).toFile(convertedFilePath);
        filePath = convertedFilePath;
      } catch (e) {
        console.error('Error converting HEIC:', e);
      }
    }

    const FormData = require('form-data');

    const requestTimeoutMs = isHostedMl(mlServiceUrl) ? 60000 : 30000;
    const doVitRequest = () => {
      const form = new FormData();
      form.append('imagen', fs.createReadStream(filePath), { filename: path.basename(filePath), contentType: 'image/jpeg' });
      const requestUrl = (isVit && process.env.ML_VIT_SERVICE_URL)
        ? `${mlServiceUrl}/classify-vit`
        : `${mlServiceUrl}${endpoint}`;
      return axios.post(requestUrl, form, {
        headers: form.getHeaders(),
        timeout: requestTimeoutMs
      });
    };

    let response;
    try {
      response = await doVitRequest();
    } catch (mlError) {
      const status = mlError.response?.status;
      const data = mlError.response?.data;
      const modelLoaded = data?.model_loaded ?? data?.detail?.model_loaded;
      const errorMessage = data?.error ?? data?.detail?.error;

      // ViT not ready yet: wait for it then retry once (Flask: data.model_loaded; FastAPI/HF: data.detail.model_loaded)
      if (endpoint === '/classify-vit' && status === 503 && modelLoaded === false) {
        const vitReady = await waitForVitReady(mlServiceUrl);
        if (vitReady) {
          try {
            response = await doVitRequest();
          } catch (retryErr) {
            [req.file.path, convertedFilePath].forEach(p => p && fs.existsSync(p) && fs.unlinkSync(p));
            const retryData = retryErr.response?.data;
            return res.status(503).json({
              error: retryData?.error ?? retryData?.detail?.error ?? 'Vision Transformer request failed after retry',
              model_loaded: false
            });
          }
        } else {
          [req.file.path, convertedFilePath].forEach(p => p && fs.existsSync(p) && fs.unlinkSync(p));
          return res.status(503).json({
            error: 'Vision Transformer model not available (still loading). Try again in a minute.',
            model_loaded: false
          });
        }
      } else {
        [req.file.path, convertedFilePath].forEach(p => p && fs.existsSync(p) && fs.unlinkSync(p));
        if (endpoint === '/classify-vit') {
          return res.status(503).json({ error: errorMessage || 'Vision Transformer model not available', model_loaded: false });
        }
        if (status === 503 && data?.loading) {
          return res.status(503).json({ error: 'Models still loading. Wait ~1 min and try again.', loading: true });
        }
        return res.status(503).json({
          error: data?.error || 'ML service not available',
          tipo: 'superior', color: 'desconocido', confianza: 0.5, clase: 0,
          clase_nombre: 'desconocido', warning: 'ML service not available'
        });
      }
    }

    [req.file.path, convertedFilePath].forEach(p => p && fs.existsSync(p) && fs.unlinkSync(p));

    res.json({
      tipo: response.data.tipo || 'desconocido',
      color: response.data.color || 'desconocido',
      confianza: response.data.confianza || 0.5,
      clase: response.data.clase || 0,
      clase_nombre: response.data.clase_nombre || 'desconocido',
      top3: response.data.top3 || [],
      model: response.data.model || 'cnn',
      model_file: response.data.model_file || (response.data.model === 'vision_transformer' ? 'vision_transformer_moda_modelo.keras' : 'modelo_ropa.h5')
    });
  } catch (error) {
    res.status(500).json({ error: 'Error classifying the image' });
  }
}

router.post('/', upload.single('imagen'), (req, res) => processAndClassify(req, res, '/classify'));
router.post('/vit', upload.single('imagen'), (req, res) => processAndClassify(req, res, '/classify-vit'));

/** POST /api/classify/vit-base64 — Mirror: classify from data URL (no multipart) */
router.post('/vit-base64', async (req, res) => {
  const imageDataUrl = req.body?.imageDataUrl ?? req.body?.image_data_url ?? '';
  if (!imageDataUrl || typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:image/')) {
    return res.status(400).json({ error: 'imageDataUrl (data:image/...) required' });
  }
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  const tempPath = path.join(tempDir, 'mirror-vit-' + Date.now() + '.jpg');
  try {
    const base64 = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buf = Buffer.from(base64, 'base64');
    await sharp(buf).jpeg({ quality: 90 }).toFile(tempPath);
    req.file = { path: tempPath, originalname: 'frame.jpg', mimetype: 'image/jpeg' };
    await processAndClassify(req, res, '/classify-vit');
  } catch (e) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    res.status(500).json({ error: e.message || 'Error processing image' });
  } finally {
    if (fs.existsSync(tempPath)) try { fs.unlinkSync(tempPath); } catch (_) {}
  }
});

module.exports = router;
