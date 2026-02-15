"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, CheckCircle2 } from "lucide-react";
import { useMediaUpload, type UploadResponse } from "@/lib/hooks/use-media-upload";
import { cn } from "@/lib/utils";

interface MediaUploadProps {
  onUploadComplete: (result: UploadResponse) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

export function MediaUpload({
  onUploadComplete,
  accept = "image/*,video/*",
  maxSizeMB = 50,
  className,
}: MediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useMediaUpload();

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploadedFile(null);

      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File too large. Maximum size is ${maxSizeMB}MB.`);
        return;
      }

      try {
        const result = await upload.mutateAsync(file);
        setUploadedFile(result);
        onUploadComplete(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    },
    [maxSizeMB, upload, onUploadComplete]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={className}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
          upload.isPending && "pointer-events-none opacity-60"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />

        {upload.isPending ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-2 text-sm text-gray-600">Uploading...</p>
          </>
        ) : uploadedFile ? (
          <>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <p className="mt-2 text-sm font-medium text-green-700">
              Uploaded successfully
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {uploadedFile.filename}
            </p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Drag & drop or click to upload
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              Images and videos up to {maxSizeMB}MB
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
          <X className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
