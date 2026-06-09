"use client";

import * as React from "react";
import { Eye, Download, Upload } from "lucide-react";

interface DocumentThumbnailProps {
  label: string;
  imageUrl?: string;
  onView?: () => void;
  onDownload?: () => void;
}

export function DocumentThumbnail({
  label,
  imageUrl,
  onView,
  onDownload,
}: DocumentThumbnailProps) {
  return (
    <div className="group relative aspect-[3/4] rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={label}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-xs text-gray-400">{label}</span>
      )}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        {onView && (
          <button
            onClick={onView}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white"
          >
            <Eye className="h-4 w-4" />
          </button>
        )}
        {onDownload && (
          <button
            onClick={onDownload}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white"
          >
            <Download className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

interface DocumentUploadTileProps {
  onUpload?: () => void;
  label?: string;
}

export function DocumentUploadTile({
  onUpload,
  label = "Загрузить",
}: DocumentUploadTileProps) {
  return (
    <div
      onClick={onUpload}
      className="aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-gray-400 transition-colors"
    >
      <Upload className="h-5 w-5 text-gray-400" />
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}
