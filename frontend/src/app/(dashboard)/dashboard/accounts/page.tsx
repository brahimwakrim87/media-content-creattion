"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { getPlatformIcon, getPlatformColor } from "@/lib/platform-icons";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { cn, formatRelativeTime } from "@/lib/utils";

const platformFilters = [
  "all",
  "facebook",
  "instagram",
  "youtube",
  "linkedin",
  "tiktok",
  "twitter",
] as const;

export default function AccountsPage() {
  const [page, setPage] = useState(1);
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const { data, isLoading } = useAccounts(page);

  const accounts = data?.member ?? [];
  const totalItems = data?.totalItems ?? 0;

  const filtered =
    platformFilter === "all"
      ? accounts
      : accounts.filter((a) => a.platform === platformFilter);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Social Accounts
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your connected social media accounts
          </p>
        </div>
        <Link
          href="/dashboard/accounts/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Connect Account
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        {platformFilters.map((p) => (
          <button
            key={p}
            onClick={() => setPlatformFilter(p)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium capitalize",
              platformFilter === p
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {p}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-xl border bg-gray-50"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No accounts connected"
          description="Connect your first social media account to start publishing."
          action={{
            label: "Connect Account",
            href: "/dashboard/accounts/new",
          }}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((account) => {
              const Icon = getPlatformIcon(account.platform);
              const color = getPlatformColor(account.platform);
              return (
                <Link
                  key={account.id}
                  href={`/dashboard/accounts/${account.id}`}
                  className="group rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-gray-100 p-2.5">
                        <Icon className={cn("h-6 w-6", color)} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                          {account.accountName}
                        </h3>
                        <p className="text-sm capitalize text-gray-500">
                          {account.platform}
                          {account.accountType && ` \u00B7 ${account.accountType}`}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={account.status} variant="account" />
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
                    <span>ID: {account.accountIdentifier}</span>
                    {account.expiresAt && (
                      <span>
                        Expires {formatRelativeTime(account.expiresAt)}
                      </span>
                    )}
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
