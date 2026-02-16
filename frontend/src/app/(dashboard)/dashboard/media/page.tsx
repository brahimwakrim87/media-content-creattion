"use client";

import { useState, useCallback } from "react";
import {
  Image,
  Film,
  FileText,
  Upload,
  Trash2,
  Pencil,
  Search,
  FolderOpen,
  Grid3x3,
  List,
  X,
  HardDrive,
  Check,
} from "lucide-react";
import {
  useMediaLibrary,
  useMediaStats,
  useDeleteMediaAsset,
  useUpdateMediaAsset,
  type MediaAssetItem,
} from "@/lib/hooks/use-media-library";
import { MediaUpload } from "@/components/media-upload";
import { MediaPreview } from "@/components/media-preview";
import { formatRelativeTime, cn } from "@/lib/utils";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

const typeIcons: Record<string, typeof Image> = {
  image: Image,
  video: Film,
  other: FileText,
};

type ViewMode = "grid" | "list";
type TypeFilter = "all" | "image" | "video";

function EditModal({
  asset,
  onClose,
}: {
  asset: MediaAssetItem;
  onClose: () => void;
}) {
  const [alt, setAlt] = useState(asset.alt ?? "");
  const [folder, setFolder] = useState(asset.folder ?? "");
  const [tagsInput, setTagsInput] = useState(
    (asset.tags ?? []).join(", ")
  );
  const update = useUpdateMediaAsset();

  const handleSave = () => {
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    update.mutate(
      {
        id: asset.id,
        data: {
          alt: alt || undefined,
          tags: tags.length > 0 ? tags : undefined,
          folder: folder || null,
        },
      },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Edit Media</h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-3">
          <p className="mb-1 truncate text-sm text-gray-500">
            {asset.originalFilename}
          </p>
          {asset.mediaType === "image" && (
            <img
              src={asset.url}
              alt={asset.alt || ""}
              className="mb-3 h-32 w-full rounded-lg object-cover"
            />
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Alt text
            </label>
            <input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Describe this media..."
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Folder
            </label>
            <input
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder="e.g. campaigns, social, branding"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tags (comma-separated)
            </label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. logo, banner, product"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={update.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {update.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailPanel({
  asset,
  onClose,
  onEdit,
  onDelete,
}: {
  asset: MediaAssetItem;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="w-80 shrink-0 border-l bg-white">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">Details</h3>
        <button
          onClick={onClose}
          className="rounded p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4">
        <MediaPreview
          url={asset.url}
          type={asset.mediaType === "video" ? "video" : "image"}
          alt={asset.alt || asset.originalFilename}
          className="mb-4"
        />

        <div className="space-y-3 text-sm">
          <div>
            <span className="text-gray-500">Filename</span>
            <p className="mt-0.5 break-all font-medium text-gray-900">
              {asset.originalFilename}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-gray-500">Type</span>
              <p className="mt-0.5 font-medium text-gray-900">
                {asset.mimeType.split("/")[1]?.toUpperCase()}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Size</span>
              <p className="mt-0.5 font-medium text-gray-900">
                {formatSize(asset.size)}
              </p>
            </div>
          </div>
          {asset.width && asset.height && (
            <div>
              <span className="text-gray-500">Dimensions</span>
              <p className="mt-0.5 font-medium text-gray-900">
                {asset.width} × {asset.height}px
              </p>
            </div>
          )}
          {asset.alt && (
            <div>
              <span className="text-gray-500">Alt text</span>
              <p className="mt-0.5 text-gray-900">{asset.alt}</p>
            </div>
          )}
          {asset.folder && (
            <div>
              <span className="text-gray-500">Folder</span>
              <p className="mt-0.5 font-medium text-gray-900">
                {asset.folder}
              </p>
            </div>
          )}
          {asset.tags && asset.tags.length > 0 && (
            <div>
              <span className="text-gray-500">Tags</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {asset.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div>
            <span className="text-gray-500">Uploaded</span>
            <p className="mt-0.5 text-gray-900">
              {formatRelativeTime(asset.createdAt)}
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onEdit}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>

        <div className="mt-3">
          <button
            onClick={() => navigator.clipboard.writeText(asset.url)}
            className="w-full rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Copy URL
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MediaLibraryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [folderFilter, setFolderFilter] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showUpload, setShowUpload] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MediaAssetItem | null>(
    null
  );
  const [editAsset, setEditAsset] = useState<MediaAssetItem | null>(null);

  const mimeFilter =
    typeFilter === "image"
      ? "image/"
      : typeFilter === "video"
        ? "video/"
        : undefined;

  const { data, isLoading, refetch } = useMediaLibrary({
    page,
    search: search || undefined,
    mimeType: mimeFilter,
    folder: folderFilter,
  });
  const { data: stats } = useMediaStats();
  const deleteAsset = useDeleteMediaAsset();

  const assets = data?.member ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = Math.ceil(totalItems / 24);

  const handleDelete = useCallback(
    (asset: MediaAssetItem) => {
      if (confirm(`Delete "${asset.originalFilename}"?`)) {
        deleteAsset.mutate(asset.id, {
          onSuccess: () => {
            if (selectedAsset?.id === asset.id) setSelectedAsset(null);
          },
        });
      }
    },
    [deleteAsset, selectedAsset]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-2">
            <Image className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
            <p className="text-sm text-gray-500">
              {stats
                ? `${stats.totalFiles} files · ${formatSize(stats.totalSize)}`
                : "Loading..."}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Upload className="h-4 w-4" />
          Upload
        </button>
      </div>

      {/* Upload area */}
      {showUpload && (
        <div className="mb-6">
          <MediaUpload
            onUploadComplete={() => {
              refetch();
              setShowUpload(false);
            }}
          />
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search files..."
            className="w-full rounded-lg border py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Type filter */}
        <div className="flex rounded-lg border">
          {(["all", "image", "video"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTypeFilter(t);
                setPage(1);
              }}
              className={cn(
                "px-3 py-2 text-xs font-medium capitalize",
                typeFilter === t
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              {t === "all" ? "All" : t === "image" ? "Images" : "Videos"}
            </button>
          ))}
        </div>

        {/* Folder filter */}
        {stats?.folders && stats.folders.length > 0 && (
          <select
            value={folderFilter ?? ""}
            onChange={(e) => {
              setFolderFilter(e.target.value || undefined);
              setPage(1);
            }}
            className="rounded-lg border px-3 py-2 text-sm text-gray-700"
          >
            <option value="">All folders</option>
            {stats.folders.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        )}

        {/* View toggle */}
        <div className="flex rounded-lg border">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "rounded-l-lg p-2",
              viewMode === "grid"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            <Grid3x3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "rounded-r-lg p-2",
              viewMode === "list"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 gap-0 overflow-hidden rounded-lg border bg-white">
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center text-gray-400">
              Loading...
            </div>
          ) : assets.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-gray-400">
              <HardDrive className="h-8 w-8" />
              <p className="text-sm">No media files found</p>
              <button
                onClick={() => setShowUpload(true)}
                className="mt-2 text-sm font-medium text-blue-600 hover:underline"
              >
                Upload your first file
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {assets.map((asset) => {
                const Icon = typeIcons[asset.mediaType] || FileText;
                const isSelected = selectedAsset?.id === asset.id;
                return (
                  <button
                    key={asset.id}
                    onClick={() =>
                      setSelectedAsset(isSelected ? null : asset)
                    }
                    className={cn(
                      "group relative aspect-square overflow-hidden rounded-lg border-2 transition-all",
                      isSelected
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
                    {isSelected && (
                      <div className="absolute right-1.5 top-1.5 rounded-full bg-blue-500 p-0.5">
                        <Check className="h-3 w-3 text-white" />
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
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-xs text-gray-500">
                  <th className="pb-2 font-medium">File</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Size</th>
                  <th className="pb-2 font-medium">Folder</th>
                  <th className="pb-2 font-medium">Uploaded</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {assets.map((asset) => {
                  const Icon = typeIcons[asset.mediaType] || FileText;
                  return (
                    <tr
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className={cn(
                        "cursor-pointer transition-colors",
                        selectedAsset?.id === asset.id
                          ? "bg-blue-50"
                          : "hover:bg-gray-50"
                      )}
                    >
                      <td className="flex items-center gap-3 py-2.5">
                        {asset.mediaType === "image" ? (
                          <img
                            src={asset.url}
                            alt=""
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100">
                            <Icon className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <span className="max-w-[200px] truncate text-sm font-medium text-gray-900">
                          {asset.originalFilename}
                        </span>
                      </td>
                      <td className="text-xs text-gray-500 uppercase">
                        {asset.mimeType.split("/")[1]}
                      </td>
                      <td className="text-xs text-gray-500">
                        {formatSize(asset.size)}
                      </td>
                      <td className="text-xs text-gray-500">
                        {asset.folder || "—"}
                      </td>
                      <td className="text-xs text-gray-500">
                        {formatRelativeTime(asset.createdAt)}
                      </td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(asset);
                          }}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <p className="text-xs text-gray-500">
                {totalItems} file{totalItems !== 1 ? "s" : ""} · Page{" "}
                {page}/{totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded border px-3 py-1 text-xs disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={page >= totalPages}
                  className="rounded border px-3 py-1 text-xs disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail sidebar */}
        {selectedAsset && (
          <DetailPanel
            asset={selectedAsset}
            onClose={() => setSelectedAsset(null)}
            onEdit={() => setEditAsset(selectedAsset)}
            onDelete={() => handleDelete(selectedAsset)}
          />
        )}
      </div>

      {/* Edit modal */}
      {editAsset && (
        <EditModal
          asset={editAsset}
          onClose={() => setEditAsset(null)}
        />
      )}
    </div>
  );
}
