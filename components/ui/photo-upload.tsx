'use client';

// ============================================================================
// Secure User Photo & School Logo Upload Component with Built-in Image Cropper
// Automatically shows interactive cropper with recommended aspect ratios
// ============================================================================

import React, { useRef, useState, useEffect } from 'react';
import { validateImageFile } from '@/lib/utils/security';
import { Button } from '@/components/ui/button';
import { ImageCropperModal } from '@/components/ui/image-cropper-modal';
import { Upload, X, Image as ImageIcon, AlertCircle, Crop, Sparkles, ExternalLink, FileText } from 'lucide-react';

interface PhotoUploadProps {
  label: string;
  helperText?: string;
  currentPhotoUrl?: string;
  maxMb?: number;
  onPhotoChange: (url: string | null) => void;
  aspectRatio?: 'square' | 'contain' | 'wide';
  allowCrop?: boolean;
}

export function PhotoUpload({
  label,
  helperText,
  currentPhotoUrl,
  maxMb = 5,
  onPhotoChange,
  aspectRatio = 'square',
  allowCrop = true,
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
      const dataUrl = reader.result as string;
      if (!allowCrop) {
        setPreviewUrl(dataUrl);
        setError(null);
        onPhotoChange(dataUrl);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setRawImageSrc(dataUrl);
        setIsCropperOpen(true);
      }
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
    if (previewUrl && allowCrop) {
      setRawImageSrc(previewUrl);
      setIsCropperOpen(true);
    }
  };

  const resolvedHelperText = helperText ?? (allowCrop ? '' : 'Upload clear document photo or scan (PNG, JPG, WebP)');

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
          className={`${
            allowCrop && aspectRatio === 'square'
              ? 'w-16 h-16 rounded-xl'
              : 'w-24 h-16 sm:w-28 sm:h-20 rounded-xl p-1 bg-slate-100/60'
          } border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 relative group shadow-2xs ${
            aspectRatio === 'contain' ? 'p-1' : ''
          }`}
        >
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="Preview"
                className={`w-full h-full ${
                  aspectRatio === 'contain' || !allowCrop ? 'object-contain' : 'object-cover'
                }`}
              />
              {allowCrop ? (
                <button
                  type="button"
                  onClick={handleReCrop}
                  className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-semibold transition-opacity"
                  title="Re-crop photo"
                >
                  <Crop className="w-4 h-4" />
                </button>
              ) : (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-semibold transition-opacity gap-1"
                  title="View full image in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View</span>
                </a>
              )}
            </>
          ) : (
            allowCrop ? (
              <ImageIcon className="w-6 h-6 text-slate-300" />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 gap-0.5">
                <FileText className="w-5 h-5 text-slate-300" />
                <span className="text-[9px] font-medium text-slate-400">Card / Doc</span>
              </div>
            )
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
                {allowCrop && (
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
                )}
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          {resolvedHelperText && (
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              {allowCrop ? (
                <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
              ) : (
                <FileText className="w-3 h-3 text-slate-400 shrink-0" />
              )}
              <span>{resolvedHelperText}</span>
            </p>
          )}
        </div>
      </div>

      {/* Interactive Image Cropper Modal (Only when crop allowed) */}
      {allowCrop && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          onClose={() => {
            setIsCropperOpen(false);
            setRawImageSrc(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
          imageSrc={rawImageSrc}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
