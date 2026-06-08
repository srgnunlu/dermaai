import { Response } from 'express';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { createReadStream, existsSync } from 'fs';

export class FileNotFoundError extends Error {
  constructor() {
    super('File not found');
    this.name = 'FileNotFoundError';
    Object.setPrototypeOf(this, FileNotFoundError.prototype);
  }
}

// Local file storage service to replace Google Cloud Storage
export class LocalFileStorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'images'), { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }
  }

  // Get upload directory
  getUploadDir(): string {
    return this.uploadDir;
  }

  // Download/serve a file
  async downloadFile(filePath: string, res: Response, cacheTtlSec: number = 3600) {
    try {
      const fullPath = this.resolveUploadPath(filePath);

      if (!fullPath) {
        throw new FileNotFoundError();
      }

      if (!existsSync(fullPath)) {
        throw new FileNotFoundError();
      }

      const stats = await fs.stat(fullPath);
      const ext = path.extname(fullPath).toLowerCase();

      // Determine content type based on extension
      let contentType = 'application/octet-stream';
      switch (ext) {
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
        case '.webp':
          contentType = 'image/webp';
          break;
        case '.pdf':
          contentType = 'application/pdf';
          break;
      }

      // Set headers
      res.set({
        'Content-Type': contentType,
        'Content-Length': stats.size.toString(),
        'Cache-Control': `public, max-age=${cacheTtlSec}`,
      });

      // Stream the file
      const stream = createReadStream(fullPath);

      stream.on('error', (err: Error) => {
        console.error('Stream error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error streaming file' });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error('Error downloading file:', error);
      if (!res.headersSent) {
        if (error instanceof FileNotFoundError) {
          res.status(404).json({ error: 'File not found' });
        } else {
          res.status(500).json({ error: 'Error downloading file' });
        }
      }
    }
  }

  // Generate upload URL (for multipart uploads)
  async getUploadURL(): Promise<string> {
    const fileId = randomUUID();
    // Return a local upload endpoint
    return `/api/upload/${fileId}`;
  }

  // Save uploaded file
  async saveUploadedFile(fileId: string, buffer: Buffer, filename?: string): Promise<string> {
    try {
      const ext = filename ? path.extname(filename) : '.jpg';
      const fullFilename = `${fileId}${ext}`;
      const filePath = this.resolveUploadPath(path.join('images', fullFilename));

      if (!filePath) {
        throw new Error('Invalid upload path');
      }

      await fs.writeFile(filePath, buffer);

      // Return the relative path that can be used to access the file
      return `images/${fullFilename}`;
    } catch (error) {
      console.error('Error saving uploaded file:', error);
      throw new Error('Failed to save uploaded file');
    }
  }

  // Get file from path
  async getFile(filePath: string): Promise<{ exists: boolean; path: string; buffer?: Buffer }> {
    try {
      const fullPath = this.resolveUploadPath(filePath);

      if (!fullPath) {
        return { exists: false, path: filePath };
      }

      if (!existsSync(fullPath)) {
        return { exists: false, path: fullPath };
      }

      const buffer = await fs.readFile(fullPath);
      return { exists: true, path: fullPath, buffer };
    } catch (error) {
      console.error('Error reading file:', error);
      return { exists: false, path: filePath };
    }
  }

  async deleteFile(reference: string): Promise<boolean> {
    try {
      let filePath = reference;
      if (reference.startsWith('http://') || reference.startsWith('https://')) {
        filePath = new URL(reference).pathname;
      }
      filePath = filePath.replace(/^\/files\//, '');

      const fullPath = this.resolveUploadPath(filePath);
      if (!fullPath) {
        return false;
      }

      await fs.unlink(fullPath);
      return true;
    } catch (error: any) {
      if (error?.code === 'ENOENT') {
        return true;
      }
      console.warn('Local image cleanup failed:', error);
      return false;
    }
  }

  // Normalize object entity path (convert from old Google Storage URLs)
  normalizeObjectEntityPath(rawPath: string): string {
    // If it's already a local path, return as is
    if (!rawPath.startsWith('http://') && !rawPath.startsWith('https://')) {
      return rawPath.startsWith('/files/') ? rawPath : `/files/${rawPath}`;
    }

    // Extract filename from a signed local URL or legacy cloud URL.
    try {
      const url = new URL(rawPath);
      const pathname = url.pathname;
      const filename = path.basename(pathname);
      return `/files/images/${filename}`;
    } catch (error) {
      console.error('Error parsing URL:', error);
      return rawPath;
    }
  }

  // Get file for entity
  async getObjectEntityFile(objectPath: string): Promise<{
    exists: boolean;
    path: string;
    buffer?: Buffer;
    download: () => Promise<[Buffer]>;
    getMetadata: () => Promise<[{ contentType: string; size: number }]>;
  }> {
    const filePath = objectPath.replace('/files/', '');
    const fileData = await this.getFile(filePath);

    if (!fileData.exists || !fileData.buffer) {
      throw new FileNotFoundError();
    }

    const stats = await fs.stat(fileData.path);
    const ext = path.extname(fileData.path).toLowerCase();

    let contentType = 'application/octet-stream';
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
    }

    return {
      exists: true,
      path: fileData.path,
      buffer: fileData.buffer,
      download: async () => [fileData.buffer!],
      getMetadata: async () => [
        {
          contentType,
          size: stats.size,
        },
      ],
    };
  }

  private resolveUploadPath(filePath: string): string | null {
    const uploadRoot = path.resolve(this.uploadDir);
    const fullPath = path.resolve(uploadRoot, filePath);
    const relativePath = path.relative(uploadRoot, fullPath);

    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      return null;
    }

    return fullPath;
  }
}

// Export a default instance
export const localFileStorage = new LocalFileStorageService();
