"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Megaphone, Calendar, DollarSign } from "lucide-react";
import { useCampaigns, useDeleteCampaign } from "@/lib/hooks/use-campaigns";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { SearchInput } from "@/components/search-input";
import { cn } from "@/lib/utils";

const statusFilters = ["all", "draft", "active", "paused", "completed"] as const;

export default function CampaignsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const { data, isLoading } = useCampaigns(page, search);
  const deleteCampaign = useDeleteCampaign();

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const campaigns = data?.member ?? [];
  const totalItems = data?.totalItems ?? 0;

  const filtered =
    statusFilter === "all"
      ? campaigns
      : campaigns.filter((c) => c.status === statusFilter);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your media campaigns
          </p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Campaign
        </Link>
      </div>

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Search campaigns..."
        />
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl border bg-gray-50"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No campaigns yet"
          description="Create your first campaign to get started."
          action={{ label: "New Campaign", href: "/dashboard/campaigns/new" }}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/dashboard/campaigns/${campaign.id}`}
                className="group rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                    {campaign.name}
                  </h3>
                  <StatusBadge status={campaign.status} variant="campaign" />
                </div>
                {campaign.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                    {campaign.description}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-1">
                  {campaign.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: tag.color
                          ? `${tag.color}20`
                          : "#f3f4f6",
                        color: tag.color || "#6b7280",
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
                  {campaign.budget && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {campaign.budget}
                    </span>
                  )}
                  {campaign.startDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(campaign.startDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </Link>
            ))}
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
