import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const PROOF_UPLOAD_DIR = path.resolve(process.cwd(), 'uploads/expenses');

fs.mkdirSync(PROOF_UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PROOF_UPLOAD_DIR),
  filename: (_req, _file, cb) => cb(null, `${uuidv4()}.pdf`),
});

function fileFilter(_req: unknown, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Somente arquivos PDF são aceitos'));
  }
  cb(null, true);
}

// 📌 Upload de comprovante de despesa (PDF único, campo "file")
export const uploadProof: RequestHandler = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('file');
