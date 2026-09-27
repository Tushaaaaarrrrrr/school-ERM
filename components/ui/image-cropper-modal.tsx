'use client';

// ============================================================================
// Interactive Client-Side Image Cropper Modal (Strict 1:1 Square Ratio)
// Built with Canvas, Drag-to-Pan, Zoom, and Rotation
// Optimized for both Desktop and Mobile Screen Viewports with Guaranteed Visible Controls
// ============================================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Check,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  onCropComplete: (croppedDataUrl: string) => void;
  aspectRatio?: '1:1';
  title?: string;
  recommendedSizeText?: string;
}

export function ImageCropperModal({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  title = 'Crop & Align Photo',
  recommendedSizeText = '1:1 Square Avatar (Auto-Centered)',
}: ImageCropperModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // Crop adjustments
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Load image when imageSrc changes
  useEffect(() => {
    if (!imageSrc) {
      setImageObj(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageObj(img);
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc, isOpen]);

  // Crop box dimensions (Strict 1:1 Square)
  const cropBoxW = 190;
  const cropBoxH = 190;

  // Draw crop preview on canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Clear background
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const cropX = (canvasWidth - cropBoxW) / 2;
    const cropY = (canvasHeight - cropBoxH) / 2;

    ctx.save();

    // Translate to center of canvas
    ctx.translate(canvasWidth / 2 + offset.x, canvasHeight / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Calculate natural draw dimensions for 1:1 square
    const naturalRatio = imageObj.naturalWidth / imageObj.naturalHeight;
    let drawW = cropBoxW;
    let drawH = cropBoxH;

    if (naturalRatio > 1) {
      drawW = cropBoxH * naturalRatio;
      drawH = cropBoxH;
    } else {
      drawW = cropBoxW;
      drawH = cropBoxW / naturalRatio;
    }

    // Draw the image centered
    ctx.drawImage(imageObj, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Darken outside area (vignette mask)
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';

    // Top
    ctx.fillRect(0, 0, canvasWidth, cropY);
    // Bottom
    ctx.fillRect(0, cropY + cropBoxH, canvasWidth, canvasHeight - (cropY + cropBoxH));
    // Left
    ctx.fillRect(0, cropY, cropX, cropBoxH);
    // Right
    ctx.fillRect(cropX + cropBoxW, cropY, canvasWidth - (cropX + cropBoxW), cropBoxH);

    // 1:1 Square Crop box outline
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropX, cropY, cropBoxW, cropBoxH);

    // Grid lines inside crop box (rule of thirds)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    ctx.beginPath();
    // Vertical grid lines
    ctx.moveTo(cropX + cropBoxW / 3, cropY);
    ctx.lineTo(cropX + cropBoxW / 3, cropY + cropBoxH);
    ctx.moveTo(cropX + (2 * cropBoxW) / 3, cropY);
    ctx.lineTo(cropX + (2 * cropBoxW) / 3, cropY + cropBoxH);

    // Horizontal grid lines
    ctx.moveTo(cropX, cropY + cropBoxH / 3);
    ctx.lineTo(cropX + cropBoxW, cropY + cropBoxH / 3);
    ctx.moveTo(cropX, cropY + (2 * cropBoxH) / 3);
    ctx.lineTo(cropX + cropBoxW, cropY + (2 * cropBoxH) / 3);
    ctx.stroke();

    // Circular avatar silhouette guide
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(canvasWidth / 2, canvasHeight / 2, cropBoxW / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }, [imageObj, zoom, rotation, offset]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Pointer position helper with CSS scale compensation
  const getCanvasPointer = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: clientX, y: clientY };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Mouse Drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    const p = getCanvasPointer(e.clientX, e.clientY);
    setDragStart({ x: p.x - offset.x, y: p.y - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const p = getCanvasPointer(e.clientX, e.clientY);
    setOffset({
      x: p.x - dragStart.x,
      y: p.y - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Drag handlers for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const p = getCanvasPointer(e.touches[0].clientX, e.touches[0].clientY);
      setDragStart({
        x: p.x - offset.x,
        y: p.y - offset.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    const p = getCanvasPointer(e.touches[0].clientX, e.touches[0].clientY);
    setOffset({
      x: p.x - dragStart.x,
      y: p.y - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Rotate 90 degrees clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Reset to default zoom and position
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  // Export cropped high-res 500x500 square image
  const handleApplyCrop = () => {
    if (!imageObj) return;

    const outputSize = 500;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = outputSize;
    exportCanvas.height = outputSize;

    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Background fill white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outputSize, outputSize);

    const scaleFactor = outputSize / cropBoxW;

    ctx.save();
    ctx.translate(outputSize / 2 + offset.x * scaleFactor, outputSize / 2 + offset.y * scaleFactor);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom * scaleFactor, zoom * scaleFactor);

    const naturalRatio = imageObj.naturalWidth / imageObj.naturalHeight;
    let drawW = cropBoxW;
    let drawH = cropBoxH;

    if (naturalRatio > 1) {
      drawW = cropBoxH * naturalRatio;
      drawH = cropBoxH;
    } else {
      drawW = cropBoxW;
      drawH = cropBoxW / naturalRatio;
    }

    ctx.drawImage(imageObj, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Export as high quality JPEG
    const croppedDataUrl = exportCanvas.toDataURL('image/jpeg', 0.92);
    onCropComplete(croppedDataUrl);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description="Position and zoom your photo for a clean 1:1 avatar"
      maxWidth="sm"
    >
      <div className="flex flex-col space-y-3 text-left">
        {/* Helper Badge */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-indigo-900 truncate">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">{recommendedSizeText}</span>
          </div>
          <span className="text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded shadow-2xs">
            1:1 Square
          </span>
        </div>

        {/* Compact Responsive Canvas Viewport */}
        <div className="relative rounded-2xl border border-slate-200 bg-slate-950 overflow-hidden flex items-center justify-center select-none shadow-inner max-h-[220px]">
          <canvas
            ref={canvasRef}
            width={320}
            height={220}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="cursor-move touch-none max-w-full h-auto object-contain"
          />
          <div className="absolute bottom-1.5 left-2 text-[10px] font-medium text-white/80 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs pointer-events-none">
            Drag to reposition
          </div>
        </div>

        {/* Compact Zoom & Control Bar */}
        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          {/* Zoom Slider */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              className="p-1 text-slate-500 hover:text-indigo-600 cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
              className="p-1 text-slate-500 hover:text-indigo-600 cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono font-bold text-slate-700 w-10 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Inline Action Row */}
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleRotate}
                leftIcon={<RotateCw className="w-3 h-3 text-indigo-600" />}
              >
                Rotate 90°
              </Button>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleReset}
                leftIcon={<RefreshCw className="w-3 h-3 text-slate-500" />}
              >
                Reset
              </Button>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              HD 500×500px
            </span>
          </div>
        </div>

        {/* Guaranteed Visible Modal Action Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleApplyCrop}
            leftIcon={<Check className="w-3.5 h-3.5" />}
          >
            Apply & Use Photo
          </Button>
        </div>
      </div>
    </Modal>
  );
}


