"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  FileText,
  Video,
  Image,
  Newspaper,
  Megaphone,
} from "lucide-react";
import { useContentList } from "@/lib/hooks/use-content";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { cn } from "@/lib/utils";

const typeFilters = [
  { value: "all", label: "All" },
  { value: "video", label: "Video", icon: Video },
  { value: "post", label: "Post", icon: FileText },
  { value: "article", label: "Article", icon: Newspaper },
  { value: "image", label: "Image", icon: Image },
  { value: "advertisement", label: "Ad", icon: Megaphone },
];

const typeIcons: Record<string, typeof Video> = {
  video: Video,
  post: FileText,
  article: Newspaper,
  image: Image,
  advertisement: Megaphone,
};

export default function ContentPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("all");
  const { data, isLoading } = useContentList(page);

  const items = data?.member ?? [];
  const totalItems = data?.totalItems ?? 0;

  const filtered =
    typeFilter === "all"
      ? items
      : items.filter((item) => item.type === typeFilter);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Library</h1>
          <p className="mt-1 text-sm text-gray-600">
            All content across your campaigns
          </p>
        </div>
        <Link
          href="/dashboard/content/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Content
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        {typeFilters.map((t) => (
          <button
            key={t.value}
            onClick={() => setTypeFilter(t.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
              typeFilter === t.value
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {t.icon && <t.icon className="h-3 w-3" />}
            {t.label}
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
          icon={FileText}
          title="No content yet"
          description="Start creating content for your campaigns."
          action={{ label: "Create Content", href: "/dashboard/content/new" }}
        />
      ) : (
        <>
          <div className="space-y-3">
            {filtered.map((item) => {
              const Icon = typeIcons[item.type] || FileText;
              return (
                <Link
                  key={item.id}
                  href={`/dashboard/content/${item.id}`}
                  className="flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="rounded-lg bg-gray-100 p-2.5">
                    <Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {item.title || `Untitled ${item.type}`}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-sm text-gray-500">
                      <span>{item.campaign?.name}</span>
                      {item.content && (
                        <>
                          <span className="text-gray-300">|</span>
                          <span className="truncate">{item.content}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={item.status} variant="content" />
                    <span className="text-xs text-gray-400">
                      {new Date(item.createdAt).toLocaleDateString()}
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
