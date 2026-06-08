import crypto from 'crypto';
import multer from 'multer';

export const maxImageUploadBytes = 10 * 1024 * 1024;
const allowedImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

type DetectedImageType = {
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  extension: '.jpg' | '.png' | '.webp';
};

export function createImageUploadMiddleware() {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxImageUploadBytes,
      files: 1,
    },
    fileFilter: (_req, file, callback) => {
      if (!allowedImageMimeTypes.has(file.mimetype)) {
        callback(new Error('Unsupported image type'));
        return;
      }

      callback(null, true);
    },
  });
}

export function decodeBase64Image(input: string): Buffer {
  const match = input.match(/^data:(image\/[a-z0-9.+-]+);base64,(.*)$/i);
  const rawBase64 = match ? match[2] : input;

  if (!rawBase64 || !/^[A-Za-z0-9+/_=\s-]+$/.test(rawBase64)) {
    throw new Error('Invalid base64 image payload');
  }

  return Buffer.from(rawBase64.replace(/\s/g, ''), 'base64');
}

export function detectImageType(buffer: Buffer): DetectedImageType | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: 'image/jpeg', extension: '.jpg' };
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mimeType: 'image/png', extension: '.png' };
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { mimeType: 'image/webp', extension: '.webp' };
  }

  return null;
}

export function validateImageUploadBuffer(buffer: Buffer, providedMimeType?: string): DetectedImageType {
  if (!buffer.length) {
    throw new Error('Image is empty');
  }

  if (buffer.length > maxImageUploadBytes) {
    throw new Error('Image exceeds 10MB limit');
  }

  const detectedType = detectImageType(buffer);
  if (!detectedType) {
    throw new Error('Unsupported image type');
  }

  if (providedMimeType && providedMimeType !== detectedType.mimeType) {
    throw new Error('Image MIME type does not match file contents');
  }

  return detectedType;
}

export function buildImageFilename(extension: DetectedImageType['extension']): string {
  return `image-${crypto.randomUUID()}${extension}`;
}
