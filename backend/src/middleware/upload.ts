import multer from 'multer';
import { BadRequestError } from '../common/errors';

// Use memory storage so files are never written to local disk
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(
        new BadRequestError(
          `Unsupported file type (${file.mimetype}). Permitted types: JPG, PNG, WEBP, PDF, DOC, DOCX`
        )
      );
    }
  },
});
