import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CloudUpload, Camera, Trash2, Plus, ZoomIn, ImageIcon } from 'lucide-react';
import { getCsrfHeaders } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  onImagesUploaded: (imageUrls: string[]) => void;
  uploadedImages?: string[];
  /** When true, render without the outer Card (used inside the wizard). */
  embedded?: boolean;
}

const MAX_IMAGES = 3;
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export function ImageUpload({
  onImagesUploaded,
  uploadedImages = [],
  embedded = false,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrls, setPreviewUrls] = useState<string[]>(uploadedImages);
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const currentUrlsRef = useRef<string[]>(uploadedImages);
  const { toast } = useToast();

  useEffect(() => {
    currentUrlsRef.current = previewUrls;
  }, [previewUrls]);

  const uploadFilesSequentially = useCallback(
    async (files: File[]): Promise<string[]> => {
      const uploadedUrls: string[] = [...currentUrlsRef.current];
      let done = 0;

      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Invalid file',
            description: `"${file.name}" is not an image. Please select an image file.`,
            variant: 'destructive',
          });
          continue;
        }
        if (file.size > MAX_SIZE_BYTES) {
          toast({
            title: 'File too large',
            description: `"${file.name}" exceeds 10MB. Please choose a smaller image.`,
            variant: 'destructive',
          });
          continue;
        }
        if (uploadedUrls.length >= MAX_IMAGES) {
          toast({
            title: 'Limit reached',
            description: `You can upload up to ${MAX_IMAGES} images.`,
            variant: 'destructive',
          });
          break;
        }

        try {
          const formData = new FormData();
          formData.append('file', file);
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: await getCsrfHeaders(),
            body: formData,
            credentials: 'include',
          });
          if (!response.ok) throw new Error('Failed to upload file');
          const { url } = await response.json();
          uploadedUrls.push(url);
          setPreviewUrls([...uploadedUrls]);
        } catch (error) {
          console.error(`Upload error for ${file.name}:`, error);
          toast({
            title: 'Upload failed',
            description: `Could not upload "${file.name}". Please try again.`,
            variant: 'destructive',
          });
        } finally {
          done += 1;
          setProgress(Math.round((done / files.length) * 100));
        }
      }
      return uploadedUrls;
    },
    [toast]
  );

  const processFiles = useCallback(
    (fileList: FileList | null, inputEl: HTMLInputElement | null) => {
      if (!fileList || fileList.length === 0) return;
      const fileArray = Array.from(fileList);

      if (previewUrls.length + fileArray.length > MAX_IMAGES) {
        toast({
          title: 'Too many images',
          description: `Maximum ${MAX_IMAGES} images. You have ${previewUrls.length}, selected ${fileArray.length}.`,
          variant: 'destructive',
        });
        if (inputEl) inputEl.value = '';
        return;
      }

      setIsUploading(true);
      setProgress(0);
      uploadFilesSequentially(fileArray)
        .then((finalUrls) => {
          setPreviewUrls(finalUrls);
          onImagesUploaded(finalUrls);
          if (finalUrls.length > previewUrls.length) {
            toast({
              title: 'Image uploaded',
              description: `${finalUrls.length} of ${MAX_IMAGES} images ready.`,
              variant: 'success',
            });
          }
        })
        .catch((error) => console.error('Upload batch error:', error))
        .finally(() => {
          setIsUploading(false);
          setProgress(0);
          if (inputEl) inputEl.value = '';
        });
    },
    [previewUrls.length, uploadFilesSequentially, onImagesUploaded, toast]
  );

  const handleRemoveImage = (index: number) => {
    const newUrls = previewUrls.filter((_, i) => i !== index);
    setPreviewUrls(newUrls);
    onImagesUploaded(newUrls);
  };

  const openFilePicker = () => fileInputRef.current?.click();
  const openCamera = () => cameraInputRef.current?.click();

  const body = (
    <>
      {!embedded && (
        <h3 className="mb-4 flex items-center text-lg font-semibold text-foreground">
          <Camera className="mr-2 text-primary" size={20} />
          Lesion Image Upload (1–3 images)
        </h3>
      )}

      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => processFiles(e.target.files, e.target)}
        className="hidden"
        data-testid="input-file"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => processFiles(e.target.files, e.target)}
        className="hidden"
        data-testid="input-camera"
      />

      {previewUrls.length === 0 ? (
        <div className="drag-zone rounded-2xl border-2 border-dashed border-border p-8 text-center transition-all duration-300 hover:border-primary hover:bg-primary/5">
          <div className="flex flex-col items-center">
            <div className="feature-icon mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
              <CloudUpload className="text-white" size={26} />
            </div>
            <p className="mb-1 text-lg font-medium text-foreground">Add a lesion image</p>
            <p className="mb-5 text-sm text-muted-foreground">
              Up to 3 images · max 10MB each · JPEG or PNG
            </p>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                type="button"
                onClick={openCamera}
                disabled={isUploading}
                className="gap-2 bg-gradient-to-r from-[#0891B2] to-[#14B8A6] text-white hover:opacity-95"
                data-testid="button-camera"
              >
                <Camera size={18} />
                Take Photo
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={openFilePicker}
                disabled={isUploading}
                className="gap-2"
                data-testid="button-choose-file"
              >
                <ImageIcon size={18} />
                {isUploading ? 'Uploading...' : 'Choose File'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div data-testid="images-preview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {previewUrls.map((url, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-xl border border-border"
              >
                <img
                  src={url}
                  alt={`Uploaded lesion image ${index + 1}`}
                  className="h-48 w-full cursor-zoom-in object-cover transition-transform duration-300 group-hover:scale-105"
                  onClick={() => setZoomUrl(url)}
                  data-testid={`img-uploaded-lesion-${index}`}
                />
                {/* Hover actions */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/30 group-hover:opacity-100">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setZoomUrl(url)}
                    className="h-9 w-9 p-0"
                    data-testid={`button-zoom-image-${index}`}
                  >
                    <ZoomIn size={16} />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveImage(index)}
                    className="h-9 w-9 p-0"
                    data-testid={`button-remove-image-${index}`}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
                <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
                  {index + 1} / {previewUrls.length}
                </div>
              </div>
            ))}
          </div>

          {previewUrls.length < MAX_IMAGES && (
            <div className="flex flex-col justify-center gap-2 pt-1 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={openCamera}
                disabled={isUploading}
                className="gap-2"
                data-testid="button-camera-more"
              >
                <Camera size={16} />
                Take Photo
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={openFilePicker}
                disabled={isUploading}
                className="gap-2"
                data-testid="button-add-image"
              >
                <Plus size={16} />
                {isUploading ? 'Uploading...' : 'Add Image'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Upload progress */}
      {isUploading && (
        <div className="mt-4" data-testid="upload-progress">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0891B2] to-[#14B8A6] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-4 rounded-xl bg-muted/50 p-4">
        <h4 className="mb-2 font-medium text-foreground">Image Guidelines</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Upload 1–3 images of the same lesion</li>
          <li>• Different angles of the same lesion recommended</li>
          <li>• High resolution (min 1000×1000px)</li>
          <li>• Clear focus and good lighting</li>
          <li>• JPEG or PNG formats only</li>
        </ul>
      </div>

      {/* Zoom dialog */}
      <Dialog open={!!zoomUrl} onOpenChange={(open) => !open && setZoomUrl(null)}>
        <DialogContent className="max-w-3xl border-0 bg-transparent p-0 shadow-none">
          {zoomUrl && (
            <img
              src={zoomUrl}
              alt="Lesion preview enlarged"
              className="max-h-[85vh] w-full rounded-xl object-contain"
              data-testid="img-zoom-preview"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );

  if (embedded) {
    return <div>{body}</div>;
  }

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardContent className="p-6">{body}</CardContent>
    </Card>
  );
}
