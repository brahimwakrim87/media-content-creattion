"use client";

import { useState } from "react";
import { X, Search, Check, Image, Film, FileText } from "lucide-react";
import { useMediaLibrary, type MediaAssetItem } from "@/lib/hooks/use-media-library";
import { formatRelativeTime, cn } from "@/lib/utils";

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: MediaAssetItem) => void;
  accept?: "image" | "video" | "all";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const typeIcons = { image: Image, video: Film, other: FileText };

export function MediaPickerModal({
  open,
  onClose,
  onSelect,
  accept = "all",
}: MediaPickerModalProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const mimeFilter =
    accept === "image"
      ? "image/"
      : accept === "video"
        ? "video/"
        : undefined;

  const { data, isLoading } = useMediaLibrary({
    page,
    search: search || undefined,
    mimeType: mimeFilter,
  });

  const assets = data?.member ?? [];
  const totalPages = Math.ceil((data?.totalItems ?? 0) / 24);

  if (!open) return null;

  const selectedAsset = assets.find((a) => a.id === selected);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative flex h-[80vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Select from Media Library
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b px-6 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by filename..."
              className="w-full rounded-lg border py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              Loading...
            </div>
          ) : assets.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
              <Image className="h-8 w-8" />
              <p className="text-sm">No media found</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6">
              {assets.map((asset) => {
                const Icon = typeIcons[asset.mediaType] || FileText;
                return (
                  <button
                    key={asset.id}
                    onClick={() => setSelected(asset.id)}
                    className={cn(
                      "group relative aspect-square overflow-hidden rounded-lg border-2 transition-all",
                      selected === asset.id
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-transparent hover:border-gray-300"
                    )}
                  >
                    {asset.mediaType === "image" ? (
                      <img
                        src={asset.url}
                        alt={asset.alt || asset.originalFilename}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-100">
                        <Icon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    {selected === asset.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20">
                        <div className="rounded-full bg-blue-500 p-1">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="truncate text-[10px] text-white">
                        {asset.originalFilename}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-6 py-4">
          <div className="text-sm text-gray-500">
            {selectedAsset ? (
              <span>
                {selectedAsset.originalFilename} ({formatSize(selectedAsset.size)}
                {selectedAsset.width
                  ? ` · ${selectedAsset.width}×${selectedAsset.height}`
                  : ""}
                )
              </span>
            ) : (
              <span>
                {data?.totalItems ?? 0} file{(data?.totalItems ?? 0) !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {totalPages > 1 && (
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded border px-2 py-1 text-xs disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="px-2 py-1 text-xs text-gray-500">
                  {page}/{totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded border px-2 py-1 text-xs disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (selectedAsset) {
                  onSelect(selectedAsset);
                  onClose();
                }
              }}
              disabled={!selected}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
