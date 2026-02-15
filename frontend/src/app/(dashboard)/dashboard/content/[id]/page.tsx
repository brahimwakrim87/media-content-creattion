"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Trash2,
  Video,
  FileText,
  Image,
  Newspaper,
  Megaphone,
  Sparkles,
} from "lucide-react";
import { useContentItem, useUpdateContent, useDeleteContent } from "@/lib/hooks/use-content";
import { StatusBadge } from "@/components/status-badge";
import { MediaPreview } from "@/components/media-preview";
import { MediaUpload } from "@/components/media-upload";
import { GenerationProgress } from "@/components/generation-progress";

const typeIcons: Record<string, typeof Video> = {
  video: Video,
  post: FileText,
  article: Newspaper,
  image: Image,
  advertisement: Megaphone,
};

const statusFlow = ["draft", "ready", "approved", "published"] as const;

export default function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: item, isLoading, refetch } = useContentItem(id);
  const updateContent = useUpdateContent(id);
  const deleteContent = useDeleteContent();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    await updateContent.mutateAsync({ status: newStatus } as Parameters<typeof updateContent.mutateAsync>[0]);
  };

  const handleDelete = async () => {
    await deleteContent.mutateAsync(id);
    router.push("/dashboard/content");
  };

  const handleMediaUpload = async (result: { url: string }) => {
    await updateContent.mutateAsync({ mediaUrl: result.url } as Parameters<typeof updateContent.mutateAsync>[0]);
    refetch();
  };

  const handleGenerationComplete = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-4 h-64 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center">
        <p className="text-gray-500">Content not found.</p>
        <Link href="/dashboard/content" className="mt-2 text-blue-600 hover:underline">
          Back to content
        </Link>
      </div>
    );
  }

  const Icon = typeIcons[item.type] || FileText;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/dashboard/content"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Content
        </Link>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-gray-100 p-3">
              <Icon className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {item.title || `Untitled ${item.type}`}
              </h1>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <span className="capitalize">{item.type}</span>
                <span className="text-gray-300">|</span>
                <Link
                  href={`/dashboard/campaigns/${item.campaign?.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {item.campaign?.name}
                </Link>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/ai-studio?campaign=${item.campaign?.id}&type=${item.type}`}
              className="flex items-center gap-1.5 rounded-lg border border-purple-300 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-50"
            >
              <Sparkles className="h-4 w-4" />
              Generate with AI
            </Link>
            <StatusBadge status={item.status} variant="content" />
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-lg border border-red-300 p-2 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Generation in progress */}
        {item.status === "generating" && (
          <div className="mt-6 border-t pt-4">
            <p className="mb-2 text-xs font-medium uppercase text-gray-500">
              Generation in Progress
            </p>
            <GenerationProgress
              jobId=""
              onComplete={handleGenerationComplete}
            />
            <p className="mt-2 text-xs text-gray-400">
              Check the AI Studio for detailed progress.
            </p>
          </div>
        )}

        {/* Status flow */}
        {item.status !== "published" && item.status !== "generating" && (
          <div className="mt-6 border-t pt-4">
            <p className="mb-2 text-xs font-medium uppercase text-gray-500">
              Change Status
            </p>
            <div className="flex gap-2">
              {statusFlow
                .filter((s) => s !== item.status)
                .map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={updateContent.isPending}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium capitalize text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Content body */}
        {item.content && (
          <div className="mt-6 border-t pt-4">
            <h2 className="mb-2 text-sm font-medium uppercase text-gray-500">
              Content
            </h2>
            <div className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
              {item.content}
            </div>
          </div>
        )}

        {/* Media */}
        <div className="mt-4 border-t pt-4">
          <h2 className="mb-2 text-sm font-medium uppercase text-gray-500">
            Media
          </h2>
          {item.mediaUrl ? (
            <MediaPreview url={item.mediaUrl} alt={item.title ?? undefined} />
          ) : (
            <MediaUpload
              onUploadComplete={handleMediaUpload}
              accept={
                item.type === "video"
                  ? "video/*"
                  : item.type === "image"
                    ? "image/*"
                    : "image/*,video/*"
              }
            />
          )}
        </div>

        {/* Generation metadata */}
        {item.generationMeta && (
          <div className="mt-4 border-t pt-4">
            <h2 className="mb-2 text-sm font-medium uppercase text-gray-500">
              AI Generation Info
            </h2>
            <div className="flex gap-4 text-xs text-gray-500">
              {item.generationMeta.provider && (
                <span>Provider: {item.generationMeta.provider}</span>
              )}
              {item.generationMeta.tokensUsed && (
                <span>Tokens: {item.generationMeta.tokensUsed}</span>
              )}
              {item.generationMeta.lastGeneratedAt && (
                <span>
                  Generated:{" "}
                  {new Date(
                    item.generationMeta.lastGeneratedAt
                  ).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <h2 className="mb-2 text-sm font-medium uppercase text-gray-500">
              Tags
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: tag.color ? `${tag.color}20` : "#f3f4f6",
                    color: tag.color || "#6b7280",
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="mt-4 border-t pt-4 text-xs text-gray-400">
          Created: {new Date(item.createdAt).toLocaleString()} | Updated:{" "}
          {new Date(item.updatedAt).toLocaleString()}
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Delete Content
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete this content? This action cannot be
              undone.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteContent.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteContent.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
