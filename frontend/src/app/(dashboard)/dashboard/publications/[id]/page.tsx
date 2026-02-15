"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, AlertTriangle } from "lucide-react";
import {
  usePublication,
  useUpdatePublication,
  useDeletePublication,
} from "@/lib/hooks/use-publications";
import { getPlatformIcon, getPlatformColor } from "@/lib/platform-icons";
import { StatusBadge } from "@/components/status-badge";
import { cn, formatDateTime } from "@/lib/utils";

export default function PublicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: pub, isLoading } = usePublication(id);
  const updatePublication = useUpdatePublication(id);
  const deletePublication = useDeletePublication();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    await updatePublication.mutateAsync({ status: newStatus });
  };

  const handleDelete = async () => {
    await deletePublication.mutateAsync(id);
    router.push("/dashboard/publications");
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-4 h-64 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (!pub) {
    return (
      <div className="text-center">
        <p className="text-gray-500">Publication not found.</p>
        <Link
          href="/dashboard/publications"
          className="mt-2 text-blue-600 hover:underline"
        >
          Back to publications
        </Link>
      </div>
    );
  }

  const Icon = getPlatformIcon(pub.platform);
  const color = getPlatformColor(pub.platform);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/dashboard/publications"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Publications
        </Link>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-gray-100 p-3">
              <Icon className={cn("h-6 w-6", color)} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {pub.campaignObject?.title ||
                  `Untitled ${pub.campaignObject?.type}`}
              </h1>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <Link
                  href={`/dashboard/campaigns/${pub.campaignObject?.campaign?.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {pub.campaignObject?.campaign?.name}
                </Link>
                <span className="text-gray-300">&rarr;</span>
                <span className="capitalize">{pub.platform}</span>
                <span className="text-gray-300">|</span>
                <span>{pub.socialAccount?.accountName}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={pub.status} variant="publication" />
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-lg border border-red-300 p-2 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Status actions */}
        {(pub.status === "draft" || pub.status === "scheduled") && (
          <div className="mt-6 border-t pt-4">
            <p className="mb-2 text-xs font-medium uppercase text-gray-500">
              Change Status
            </p>
            <div className="flex gap-2">
              {pub.status === "draft" && (
                <button
                  onClick={() => handleStatusChange("scheduled")}
                  disabled={updatePublication.isPending}
                  className="rounded-lg border border-blue-300 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                >
                  Schedule
                </button>
              )}
              {pub.status === "scheduled" && (
                <button
                  onClick={() => handleStatusChange("draft")}
                  disabled={updatePublication.isPending}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Unschedule (back to draft)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error info for failed publications */}
        {pub.status === "failed" && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="font-medium text-red-800">Publication Failed</h3>
            </div>
            {pub.errorMessage && (
              <p className="mt-2 text-sm text-red-700">{pub.errorMessage}</p>
            )}
            <p className="mt-1 text-xs text-red-500">
              Retry attempts: {pub.retryCount}
            </p>
          </div>
        )}

        {/* Schedule info */}
        <div className="mt-6 grid gap-4 border-t pt-4 sm:grid-cols-2">
          {pub.scheduledAt && (
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase text-gray-500">
                Scheduled For
              </p>
              <p className="mt-1 text-sm text-gray-900">
                {formatDateTime(pub.scheduledAt)}
              </p>
            </div>
          )}
          {pub.publishedAt && (
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase text-gray-500">
                Published At
              </p>
              <p className="mt-1 text-sm text-gray-900">
                {formatDateTime(pub.publishedAt)}
              </p>
            </div>
          )}
          {pub.externalId && (
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase text-gray-500">
                External Post ID
              </p>
              <p className="mt-1 font-mono text-sm text-gray-900">
                {pub.externalId}
              </p>
            </div>
          )}
        </div>

        {/* Content preview */}
        <div className="mt-6 border-t pt-4">
          <h2 className="mb-2 text-sm font-medium uppercase text-gray-500">
            Content
          </h2>
          <Link
            href={`/dashboard/content/${pub.campaignObject?.id}`}
            className="block rounded-lg border p-4 transition-colors hover:bg-gray-50"
          >
            <p className="font-medium text-gray-900">
              {pub.campaignObject?.title ||
                `Untitled ${pub.campaignObject?.type}`}
            </p>
            <p className="mt-0.5 text-sm capitalize text-gray-500">
              {pub.campaignObject?.type}
            </p>
          </Link>
        </div>

        {/* Metadata */}
        <div className="mt-4 border-t pt-4 text-xs text-gray-400">
          Created: {formatDateTime(pub.createdAt)} | Updated:{" "}
          {formatDateTime(pub.updatedAt)}
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Delete Publication
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete this publication? This action
              cannot be undone.
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
                disabled={deletePublication.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deletePublication.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
