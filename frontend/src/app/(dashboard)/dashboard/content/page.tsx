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
  Download,
  CheckCircle,
  XCircle,
  Trash2,
  Send,
} from "lucide-react";
import { useContentList } from "@/lib/hooks/use-content";
import { useExportContent, useBulkAction } from "@/lib/hooks/use-advanced";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { SearchInput } from "@/components/search-input";
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
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { data, isLoading } = useContentList(page, search);
  const exportContent = useExportContent();
  const bulkAction = useBulkAction();

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const items = data?.member ?? [];
  const totalItems = data?.totalItems ?? 0;

  const filtered =
    typeFilter === "all"
      ? items
      : items.filter((item) => item.type === typeFilter);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((i) => i.id)));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selected.size === 0) return;
    try {
      const result = await bulkAction.mutateAsync({
        ids: Array.from(selected),
        action,
      });
      const labels: Record<string, string> = {
        approve: "approved",
        submit_review: "submitted for review",
        request_changes: "returned for changes",
        delete: "deleted",
      };
      toast.success(
        `${result.processed} item${result.processed !== 1 ? "s" : ""} ${labels[action] ?? action}`
      );
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} error(s): ${result.errors[0]}`);
      }
      setSelected(new Set());
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Library</h1>
          <p className="mt-1 text-sm text-gray-600">
            All content across your campaigns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              exportContent.mutate(undefined, {
                onSuccess: () => toast.success("Content exported"),
                onError: (e) => toast.error(e.message),
              });
            }}
            disabled={exportContent.isPending}
            className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <Link
            href="/dashboard/content/new"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create Content
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Search content..."
        />
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

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <span className="text-sm font-medium text-blue-700">
            {selected.size} selected
          </span>
          <button
            onClick={() => handleBulkAction("submit_review")}
            disabled={bulkAction.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            Submit for Review
          </button>
          <button
            onClick={() => handleBulkAction("approve")}
            disabled={bulkAction.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Approve
          </button>
          <button
            onClick={() => handleBulkAction("request_changes")}
            disabled={bulkAction.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
          >
            <XCircle className="h-3.5 w-3.5" />
            Request Changes
          </button>
          <button
            onClick={() => handleBulkAction("delete")}
            disabled={bulkAction.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        </div>
      )}

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
          {/* Select all */}
          <div className="mb-2 flex items-center gap-2 px-1">
            <input
              type="checkbox"
              checked={selected.size === filtered.length && filtered.length > 0}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-500">
              Select all ({filtered.length})
            </span>
          </div>

          <div className="space-y-3">
            {filtered.map((item) => {
              const Icon = typeIcons[item.type] || FileText;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
                    selected.has(item.id) && "border-blue-300 bg-blue-50/50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="rounded-lg bg-gray-100 p-2.5">
                    <Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <Link
                    href={`/dashboard/content/${item.id}`}
                    className="flex-1 min-w-0"
                  >
                    <p className="font-medium text-gray-900 hover:text-blue-600">
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
                  </Link>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={item.status} variant="content" />
                    <span className="text-xs text-gray-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
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
