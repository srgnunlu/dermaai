import { describe, expect, it, beforeEach } from 'vitest';
import {
  decodeBase64Image,
  detectImageType,
  validateImageUploadBuffer,
} from '../uploadSecurity';
import { createSignedFileAccessToken, verifySignedFileAccessToken } from '../fileAccess';

const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const jpgHeader = Buffer.from([0xff, 0xd8, 0xff, 0xdb]);

describe('security helpers', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = 'test-session-secret';
  });

  it('detects image type from magic bytes', () => {
    expect(detectImageType(Buffer.concat([pngHeader, Buffer.alloc(8)]))).toEqual({
      mimeType: 'image/png',
      extension: '.png',
    });
    expect(detectImageType(Buffer.concat([jpgHeader, Buffer.alloc(8)]))).toEqual({
      mimeType: 'image/jpeg',
      extension: '.jpg',
    });
  });

  it('rejects MIME spoofed uploads', () => {
    const image = Buffer.concat([pngHeader, Buffer.alloc(8)]);
    expect(() => validateImageUploadBuffer(image, 'image/jpeg')).toThrow(
      'Image MIME type does not match file contents'
    );
  });

  it('decodes data URL base64 images', () => {
    const payload = `data:image/png;base64,${pngHeader.toString('base64')}`;
    expect(decodeBase64Image(payload).equals(pngHeader)).toBe(true);
  });

  it('signs file URLs for a specific path', () => {
    const token = createSignedFileAccessToken('images/example.png', 60);
    expect(verifySignedFileAccessToken('images/example.png', token)).toBe(true);
    expect(verifySignedFileAccessToken('images/other.png', token)).toBe(false);
  });
});
