'use client';

// ============================================================================
// Secure User Photo & School Logo Upload Component with Built-in Image Cropper
// Automatically shows interactive cropper with recommended aspect ratios
// ============================================================================

import React, { useRef, useState, useEffect } from 'react';
import { validateImageFile } from '@/lib/utils/security';
import { Button } from '@/components/ui/button';
import { ImageCropperModal } from '@/components/ui/image-cropper-modal';
import { Upload, X, Image as ImageIcon, AlertCircle, Crop, Sparkles } from 'lucide-react';

interface PhotoUploadProps {
  label: string;
  helperText?: string;
  currentPhotoUrl?: string;
  maxMb?: number;
  onPhotoChange: (url: string | null) => void;
  aspectRatio?: 'square' | 'contain' | 'wide';
}

export function PhotoUpload({
  label,
  helperText = 'Recommended: Square 1:1 photo (Auto-crop supported)',
  currentPhotoUrl,
  maxMb = 5,
  onPhotoChange,
  aspectRatio = 'square',
}: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const [error, setError] = useState<string | null>(null);

  // Cropper State
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);

  useEffect(() => {
    setPreviewUrl(currentPhotoUrl || null);
  }, [currentPhotoUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const validation = validateImageFile(file, maxMb);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setIsCropperOpen(true);
    };
    reader.onerror = () => {
      setError('Failed to read selected image.');
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    setPreviewUrl(croppedDataUrl);
    setError(null);
    onPhotoChange(croppedDataUrl);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setRawImageSrc(null);
    setError(null);
    onPhotoChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReCrop = () => {
    if (previewUrl) {
      setRawImageSrc(previewUrl);
      setIsCropperOpen(true);
    }
  };

  const recommendedText = 'Recommended: 1:1 Square Photo (Auto-Centered)';

  return (
    <div className="space-y-1.5 text-left">
      <label className="block text-xs font-semibold text-slate-700">{label}</label>

      {error && (
        <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Preview Area */}
        <div
          className={`w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 relative group shadow-2xs ${
            aspectRatio === 'contain' ? 'p-1' : ''
          }`}
        >
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="Preview"
                className={`w-full h-full ${
                  aspectRatio === 'contain' ? 'object-contain' : 'object-cover'
                }`}
              />
              <button
                type="button"
                onClick={handleReCrop}
                className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-semibold transition-opacity"
                title="Re-crop photo"
              >
                <Crop className="w-4 h-4" />
              </button>
            </>
          ) : (
            <ImageIcon className="w-6 h-6 text-slate-300" />
          )}
        </div>

        {/* Actions */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              leftIcon={<Upload className="w-3.5 h-3.5" />}
            >
              {previewUrl ? 'Change Photo' : 'Upload Photo'}
            </Button>

            {previewUrl && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReCrop}
                  leftIcon={<Crop className="w-3.5 h-3.5 text-indigo-600" />}
                  className="text-xs text-indigo-700 hover:bg-indigo-50 border-indigo-200"
                >
                  Re-Crop
                </Button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          <p className="text-[10px] text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
            <span>{helperText}</span>
          </p>
        </div>
      </div>

      {/* Interactive Image Cropper Modal */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        onClose={() => {
          setIsCropperOpen(false);
          setRawImageSrc(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
        imageSrc={rawImageSrc}
        onCropComplete={handleCropComplete}
        recommendedSizeText={recommendedText}
      />
    </div>
  );
}
