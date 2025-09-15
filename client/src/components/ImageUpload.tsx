import { useState, useCallback } from "react";
import { ObjectUploader } from "./ObjectUploader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CloudUpload, Camera, Trash2 } from "lucide-react";
import type { UploadResult } from "@uppy/core";

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  uploadedImage?: string;
}

export function ImageUpload({ onImageUploaded, uploadedImage }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(uploadedImage);

  const handleGetUploadParameters = async () => {
    const response = await fetch("/api/objects/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!response.ok) {
      throw new Error("Failed to get upload URL");
    }
    
    const { uploadURL } = await response.json();
    return {
      method: "PUT" as const,
      url: uploadURL,
    };
  };

  const handleComplete = useCallback((result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    setIsUploading(false);
    
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const imageUrl = uploadedFile.uploadURL;
      
      if (imageUrl) {
        // Normalize the uploaded image URL for preview
        const normalizedUrl = imageUrl.startsWith('https://storage.googleapis.com') 
          ? `/objects/${imageUrl.split('/.private/')[1]}`
          : imageUrl;
        setPreviewUrl(normalizedUrl);
        onImageUploaded(imageUrl);
      }
    }
  }, [onImageUploaded]);

  const handleRemove = () => {
    setPreviewUrl(undefined);
    onImageUploaded("");
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
              <p className="text-lg font-medium text-foreground mb-2">Drop image here</p>
              <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
              
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={10485760} // 10MB
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleComplete}
                buttonClassName="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Select Image
              </ObjectUploader>
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
