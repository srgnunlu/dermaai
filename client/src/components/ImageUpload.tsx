import { useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CloudUpload, Camera, Trash2 } from "lucide-react";

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  uploadedImage?: string;
}

export function ImageUpload({ onImageUploaded, uploadedImage }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(uploadedImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload file");
      }
      
      const { url } = await response.json();
      setPreviewUrl(url);
      onImageUploaded(url);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Dosya yükleme hatası. Lütfen tekrar deneyin.");
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
        alert('Dosya boyutu 10MB\'dan küçük olmalıdır.');
        return;
      }
      
      handleFileUpload(file);
    }
  }, []);

  const handleRemove = () => {
    setPreviewUrl(undefined);
    onImageUploaded("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="bg-card border border-border shadow-sm">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Camera className="text-primary mr-2" size={20} />
          Lesion Image Upload
        </h3>
        
        {!previewUrl ? (
          <div className="drag-zone rounded-lg p-8 text-center border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all duration-300">
            <div className="flex flex-col items-center">
              <CloudUpload className="text-4xl text-muted-foreground mb-4" size={48} />
              <p className="text-lg font-medium text-foreground mb-2">Click to select image</p>
              <p className="text-sm text-muted-foreground mb-4">Maximum file size: 10MB</p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <Button
                onClick={handleButtonClick}
                disabled={isUploading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isUploading ? "Yükleniyor..." : "Resim Seç"}
              </Button>
            </div>
          </div>
        ) : (
          <div data-testid="image-preview">
            <img 
              src={previewUrl} 
              alt="Uploaded skin lesion for analysis" 
              className="w-full h-48 object-cover rounded-lg border border-border"
              data-testid="img-uploaded-lesion"
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-sm text-muted-foreground" data-testid="text-filename">
                lesion_image.jpg
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-destructive hover:text-destructive/80"
                data-testid="button-remove-image"
              >
                <Trash2 size={16} className="mr-1" />
                Remove
              </Button>
            </div>
          </div>
        )}

        <div className="bg-muted/50 rounded-md p-4 mt-4">
          <h4 className="font-medium text-foreground mb-2">Image Guidelines</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
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
