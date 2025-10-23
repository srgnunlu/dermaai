import { useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CloudUpload, Camera, Trash2, Plus } from 'lucide-react';

interface ImageUploadProps {
  onImagesUploaded: (imageUrls: string[]) => void;
  uploadedImages?: string[];
}

export function ImageUpload({ onImagesUploaded, uploadedImages = [] }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>(uploadedImages);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    // Check if we already have 3 images
    if (previewUrls.length >= 3) {
      alert('Maksimum 3 görsel yükleyebilirsiniz.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const { url } = await response.json();
      const newUrls = [...previewUrls, url];
      setPreviewUrls(newUrls);
      onImagesUploaded(newUrls);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Dosya yükleme hatası. Lütfen tekrar deneyin.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Lütfen sadece resim dosyası seçin.');
        return;
      }

      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert("Dosya boyutu 10MB'dan küçük olmalıdır.");
        return;
      }

      handleFileUpload(file);
    }
    // Reset input so same file can be selected again
    event.target.value = '';
  }, []);

  const handleRemoveImage = (index: number) => {
    const newUrls = previewUrls.filter((_, i) => i !== index);
    setPreviewUrls(newUrls);
    onImagesUploaded(newUrls);
  };

  const handleAddMore = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  return (
    <Card className="bg-card border border-border shadow-sm">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Camera className="text-primary mr-2" size={20} />
          Lesion Image Upload (1-3 images)
        </h3>

        {previewUrls.length === 0 ? (
          <div className="drag-zone rounded-lg p-8 text-center border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all duration-300">
            <div className="flex flex-col items-center">
              <CloudUpload className="text-4xl text-muted-foreground mb-4" size={48} />
              <p className="text-lg font-medium text-foreground mb-2">Click to select image</p>
              <p className="text-sm text-muted-foreground mb-4">Maximum file size: 10MB per image</p>
              <p className="text-sm text-muted-foreground mb-4">Upload up to 3 images of the same lesion from different angles</p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <Button
                onClick={handleAddMore}
                disabled={isUploading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isUploading ? 'Yükleniyor...' : 'Resim Seç'}
              </Button>
            </div>
          </div>
        ) : (
          <div data-testid="images-preview" className="space-y-4">
            {/* Image grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Uploaded lesion image ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border border-border"
                    data-testid={`img-uploaded-lesion-${index}`}
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveImage(index)}
                      className="h-8 w-8 p-0"
                      data-testid={`button-remove-image-${index}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                    Image {index + 1} of {previewUrls.length}
                  </div>
                </div>
              ))}
            </div>

            {/* Add more button if less than 3 images */}
            {previewUrls.length < 3 && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleAddMore}
                  disabled={isUploading}
                  className="flex items-center gap-2"
                  data-testid="button-add-image"
                >
                  <Plus size={16} />
                  {isUploading ? 'Yükleniyor...' : 'Başka Resim Ekle'}
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="bg-muted/50 rounded-md p-4 mt-4">
          <h4 className="font-medium text-foreground mb-2">Image Guidelines</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Upload 1-3 images of the same lesion</li>
            <li>• Different angles or locations of same lesion recommended</li>
            <li>• High resolution (min 1000x1000px)</li>
            <li>• Clear focus on lesion</li>
            <li>• Good lighting conditions</li>
            <li>• JPEG, PNG formats only</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
