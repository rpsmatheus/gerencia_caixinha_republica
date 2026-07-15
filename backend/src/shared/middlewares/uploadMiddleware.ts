import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';

const PROOF_MIME_TYPE_EXTENSIONS: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/heic': '.heic',
  'image/heif': '.heif',
};

function isAllowedProofFile(file: Express.Multer.File): boolean {
  return file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/');
}

function getProofFileExtension(file: Express.Multer.File): string {
  return PROOF_MIME_TYPE_EXTENSIONS[file.mimetype] ?? path.extname(file.originalname).toLowerCase() ?? '.img';
}

export const PROOF_UPLOAD_DIR = process.env.PROOF_UPLOAD_DIR
  ? path.resolve(process.env.PROOF_UPLOAD_DIR)
  : path.resolve(process.cwd(), 'uploads/expenses');

fs.mkdirSync(PROOF_UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PROOF_UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${getProofFileExtension(file)}`),
});

function fileFilter(_req: unknown, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (!isAllowedProofFile(file)) {
    return cb(new Error('Somente arquivos PDF ou imagens são aceitos'));
  }
  cb(null, true);
}

// 📌 Upload de comprovante de despesa (PDF/imagem única, campo "file")
export const uploadProof: RequestHandler = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('file');
