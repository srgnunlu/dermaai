import { v2 as cloudinary } from 'cloudinary';
import { Response } from 'express';
import logger from './logger';

export class CloudinaryStorageService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // Upload image to Cloudinary
  async uploadImage(buffer: Buffer, filename?: string): Promise<string> {
    try {
      return new Promise((resolve, reject) => {
        const uploadOptions = {
          folder: 'derma-assist',
          resource_type: 'image' as const,
          public_id: filename ? filename.split('.')[0] : undefined,
          transformation: [
            { quality: 'auto', fetch_format: 'auto' },
            { width: 1024, height: 1024, crop: 'limit' },
          ],
        };

        cloudinary.uploader
          .upload_stream(uploadOptions, (error, result) => {
            if (error) {
              logger.error('Cloudinary upload error:', error);
              reject(error);
            } else if (result) {
              logger.info('Cloudinary upload success:', result.secure_url);
              resolve(result.secure_url);
            } else {
              reject(new Error('Upload failed - no result'));
            }
          })
          .end(buffer);
      });
    } catch (error) {
      logger.error('Error uploading to Cloudinary:', error);
      throw new Error('Failed to upload image');
    }
  }

  async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      const url = new URL(imageUrl);
      if (!url.hostname.endsWith('cloudinary.com')) {
        return false;
      }

      const uploadMarker = '/upload/';
      const uploadIndex = url.pathname.indexOf(uploadMarker);
      if (uploadIndex === -1) {
        return false;
      }

      const pathAfterUpload = decodeURIComponent(url.pathname.slice(uploadIndex + uploadMarker.length));
      const withoutVersion = pathAfterUpload.replace(/^v\d+\//, '');
      const publicId = withoutVersion.replace(/\.[^/.]+$/, '');
      if (!publicId.startsWith('derma-assist/')) {
        logger.warn('Refusing to delete Cloudinary image outside Corio Scan folder');
        return false;
      }

      const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
      return result.result === 'ok' || result.result === 'not found';
    } catch (error) {
      logger.warn('Cloudinary image cleanup failed', {
        imageUrl,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  // Get image data from URL for AI analysis
  async getImageForAnalysis(imageUrl: string): Promise<{
    buffer: Buffer;
    contentType: string;
    download: () => Promise<[Buffer]>;
    getMetadata: () => Promise<[{ contentType: string; size: number }]>;
  }> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || 'image/jpeg';

      return {
        buffer,
        contentType,
        download: async () => [buffer],
        getMetadata: async () => [
          {
            contentType,
            size: buffer.length,
          },
        ],
      };
    } catch (error) {
      logger.error('Error fetching image from Cloudinary:', error);
      throw new Error('Failed to fetch image for analysis');
    }
  }

  // Normalize path for compatibility
  normalizeObjectEntityPath(rawPath: string): string {
    // If it's already a Cloudinary URL, return as is
    if (rawPath.includes('cloudinary.com')) {
      return rawPath;
    }

    // If it's a local path, convert to Cloudinary format
    return rawPath;
  }

  // Get file entity (compatibility method)
  async getObjectEntityFile(path: string) {
    if (path.includes('cloudinary.com')) {
      return this.getImageForAnalysis(path);
    }

    throw new Error('Invalid image path');
  }
}

// Export default instance
export const cloudinaryStorage = new CloudinaryStorageService();
