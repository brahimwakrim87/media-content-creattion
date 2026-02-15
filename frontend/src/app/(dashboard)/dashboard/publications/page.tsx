"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Send } from "lucide-react";
import { usePublications } from "@/lib/hooks/use-publications";
import { getPlatformIcon, getPlatformColor } from "@/lib/platform-icons";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { cn, formatDateTime } from "@/lib/utils";

const statusFilters = [
  "all",
  "draft",
  "scheduled",
  "publishing",
  "published",
  "failed",
] as const;

export default function PublicationsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data, isLoading } = usePublications(page);

  const publications = data?.member ?? [];
  const totalItems = data?.totalItems ?? 0;

  const filtered =
    statusFilter === "all"
      ? publications
      : publications.filter((p) => p.status === statusFilter);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Publications</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track and manage your social media publications
          </p>
        </div>
        <Link
          href="/dashboard/publications/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Publication
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium capitalize",
              statusFilter === s
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border bg-gray-50"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Send}
          title="No publications yet"
          description="Create your first publication to share content on social media."
          action={{
            label: "New Publication",
            href: "/dashboard/publications/new",
          }}
        />
      ) : (
        <>
          <div className="space-y-3">
            {filtered.map((pub) => {
              const Icon = getPlatformIcon(pub.platform);
              const color = getPlatformColor(pub.platform);
              return (
                <Link
                  key={pub.id}
                  href={`/dashboard/publications/${pub.id}`}
                  className="flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="rounded-lg bg-gray-100 p-2.5">
                    <Icon className={cn("h-5 w-5", color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">
                      {pub.campaignObject?.title ||
                        `Untitled ${pub.campaignObject?.type}`}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-sm text-gray-500">
                      <span>{pub.campaignObject?.campaign?.name}</span>
                      <span className="text-gray-300">&rarr;</span>
                      <span>{pub.socialAccount?.accountName}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={pub.status} variant="publication" />
                    <span className="text-xs text-gray-400">
                      {pub.scheduledAt
                        ? formatDateTime(pub.scheduledAt)
                        : pub.publishedAt
                          ? formatDateTime(pub.publishedAt)
                          : formatDateTime(pub.createdAt)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-6">
            <Pagination
              currentPage={page}
              totalItems={totalItems}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </div>
  );
}
