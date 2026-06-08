import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

type SimpleUploadResult = {
  successful: unknown[];
  failed: unknown[];
};

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: 'PUT';
    url: string;
  }>;
  onComplete?: (result: SimpleUploadResult) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 *
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Provides a modal interface for:
 *   - File selection
 *   - File preview
 *   - Upload progress tracking
 *   - Upload status display
 *
 * The component uses Uppy under the hood to handle all file upload functionality.
 * All file management features are automatically handled by the Uppy dashboard modal.
 *
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded
 *   (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL).
 *   Typically used to fetch a presigned URL from the backend server for direct-to-S3
 *   uploads.
 * @param props.onComplete - Callback function called when upload is complete. Typically
 *   used to make post-upload API calls to update server state and set object ACL
 *   policies.
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, maxNumberOfFiles);
    if (files.length === 0) {
      return;
    }

    setIsUploading(true);
    const successful: unknown[] = [];
    const failed: unknown[] = [];

    try {
      for (const file of files) {
        if (file.size > maxFileSize) {
          failed.push({ data: file, error: new Error('File exceeds max size') });
          continue;
        }

        const uploadParameters = await onGetUploadParameters();
        const response = await fetch(uploadParameters.url, {
          method: uploadParameters.method,
          body: file,
        });

        if (!response.ok) {
          failed.push({ data: file, error: new Error('Upload failed') });
          continue;
        }

        successful.push({ data: file, uploadURL: uploadParameters.url });
      }

      onComplete?.({ successful, failed });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple={maxNumberOfFiles > 1}
        onChange={handleFilesSelected}
      />
      <Button
        onClick={() => inputRef.current?.click()}
        className={buttonClassName}
        disabled={isUploading}
      >
        {children}
      </Button>
    </div>
  );
}
