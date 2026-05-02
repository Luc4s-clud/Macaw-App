import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { loadEnv } from '../config/env.js';
import { hiringApplicationSchema } from '../validators/hiringSchema.js';
import { createSmtpTransport, sendHiringApplicationEmail } from '../services/mailService.js';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_RESUME_TYPE'));
    }
  },
});

const hiringLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas candidaturas deste IP. Tente mais tarde.' },
});

const router = express.Router();

function handleUpload(req, res, next) {
  upload.single('resume')(req, res, (err) => {
    if (!err) return next();
    if (err.message === 'INVALID_RESUME_TYPE') {
      return res.status(400).json({
        error: 'Tipo de arquivo não permitido. Use PDF, DOC, DOCX ou JPG.',
      });
    }
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Arquivo muito grande (máx. 5 MB).' });
      }
      return res.status(400).json({ error: 'Erro ao processar o arquivo.' });
    }
    next(err);
  });
}

router.post('/', hiringLimiter, handleUpload, async (req, res, next) => {
  try {
    const env = loadEnv();
    const parsed = hiringApplicationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Dados do formulário inválidos. Confira os campos obrigatórios.',
        details: parsed.error.flatten(),
      });
    }
    const transport = createSmtpTransport(env);
    if (!transport) {
      return res.status(503).json({
        error:
          'Envio de e-mail não está configurado no servidor. Contate o administrador.',
      });
    }
    await sendHiringApplicationEmail(transport, env, parsed.data, req.file ?? undefined);
    res.status(201).json({ ok: true });
  } catch (e) {
    const status = e.statusCode ?? e.status;
    if (status === 503) {
      return res.status(503).json({ error: e.message });
    }
    next(e);
  }
});

export default router;
