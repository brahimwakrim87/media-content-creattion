"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  FileText,
  Video,
  Image,
  Newspaper,
  Megaphone,
  ClipboardCheck,
} from "lucide-react";
import { useApprovals, useBulkAction } from "@/lib/hooks/use-advanced";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const typeIcons: Record<string, typeof Video> = {
  video: Video,
  post: FileText,
  article: Newspaper,
  image: Image,
  advertisement: Megaphone,
};

export default function ApprovalsPage() {
  const { data: items, isLoading } = useApprovals();
  const bulkAction = useBulkAction();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!items) return;
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i.id)));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selected.size === 0) return;
    try {
      const result = await bulkAction.mutateAsync({
        ids: Array.from(selected),
        action,
      });
      toast.success(
        `${result.processed} item${result.processed !== 1 ? "s" : ""} ${action === "approve" ? "approved" : "returned for changes"}`
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
        <p className="mt-1 text-sm text-gray-600">
          Content items pending your review
        </p>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <span className="text-sm font-medium text-blue-700">
            {selected.size} selected
          </span>
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
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border bg-gray-50"
            />
          ))}
        </div>
      ) : !items || items.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="All caught up!"
          description="No content items are pending review right now."
        />
      ) : (
        <div className="space-y-3">
          {/* Select all */}
          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              checked={selected.size === items.length && items.length > 0}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-500">
              Select all ({items.length})
            </span>
          </div>

          {items.map((item) => {
            const Icon = typeIcons[item.type] || FileText;
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm transition-shadow",
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
                    <span>{item.campaign.name}</span>
                    {item.content && (
                      <>
                        <span className="text-gray-300">|</span>
                        <span className="truncate">{item.content}</span>
                      </>
                    )}
                  </div>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    Ready
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
