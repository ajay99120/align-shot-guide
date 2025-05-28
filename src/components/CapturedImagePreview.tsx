
import React from 'react';
import { CapturePoint } from '../types/camera';

interface CapturedImagePreviewProps {
  images: CapturePoint[];
  onImageClick: (imageIndex: number) => void;
}

export const CapturedImagePreview: React.FC<CapturedImagePreviewProps> = ({
  images,
  onImageClick
}) => {
  const capturedImages = images.filter(img => img.captured && img.imageData);

  if (capturedImages.length === 0) return null;

  return (
    <div className="absolute top-20 right-4 w-20">
      <div className="text-white text-xs mb-2 font-medium">
        Captured: {capturedImages.length}
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {capturedImages.map((image, index) => (
          <button
            key={image.id}
            onClick={() => onImageClick(index)}
            className="w-full h-16 rounded-lg overflow-hidden border-2 border-white border-opacity-50 hover:border-opacity-100 transition-all duration-200 pointer-events-auto"
          >
            <img
              src={image.imageData}
              alt={`Captured ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};
