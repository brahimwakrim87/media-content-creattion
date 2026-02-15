"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useAccount, useDeleteAccount } from "@/lib/hooks/use-accounts";
import { getPlatformIcon, getPlatformColor } from "@/lib/platform-icons";
import { StatusBadge } from "@/components/status-badge";
import { cn, formatDateTime, formatRelativeTime } from "@/lib/utils";

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: account, isLoading } = useAccount(id);
  const deleteAccount = useDeleteAccount();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    await deleteAccount.mutateAsync(id);
    router.push("/dashboard/accounts");
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-4 h-64 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="text-center">
        <p className="text-gray-500">Account not found.</p>
        <Link
          href="/dashboard/accounts"
          className="mt-2 text-blue-600 hover:underline"
        >
          Back to accounts
        </Link>
      </div>
    );
  }

  const Icon = getPlatformIcon(account.platform);
  const color = getPlatformColor(account.platform);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/dashboard/accounts"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Accounts
        </Link>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-gray-100 p-3">
              <Icon className={cn("h-8 w-8", color)} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {account.accountName}
              </h1>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <span className="capitalize">{account.platform}</span>
                {account.accountType && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className="capitalize">{account.accountType}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={account.status} variant="account" />
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-lg border border-red-300 p-2 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Account details */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase text-gray-500">
              Account Identifier
            </p>
            <p className="mt-1 font-mono text-sm text-gray-900">
              {account.accountIdentifier}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase text-gray-500">
              Status
            </p>
            <p className="mt-1 text-sm capitalize text-gray-900">
              {account.status}
            </p>
          </div>
          {account.expiresAt && (
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase text-gray-500">
                Expires
              </p>
              <p className="mt-1 text-sm text-gray-900">
                {formatRelativeTime(account.expiresAt)} (
                {formatDateTime(account.expiresAt)})
              </p>
            </div>
          )}
          {account.lastUsedAt && (
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase text-gray-500">
                Last Used
              </p>
              <p className="mt-1 text-sm text-gray-900">
                {formatDateTime(account.lastUsedAt)}
              </p>
            </div>
          )}
        </div>

        {/* Make.com Integration (placeholder) */}
        <div className="mt-6 border-t pt-4">
          <h2 className="mb-3 text-sm font-medium uppercase text-gray-500">
            Make.com Integration
          </h2>
          {account.makeConnectionId || account.makeScenarioId ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {account.makeConnectionId && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Connection ID</p>
                  <p className="mt-0.5 font-mono text-sm">
                    {account.makeConnectionId}
                  </p>
                </div>
              )}
              {account.makeScenarioId && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Scenario ID</p>
                  <p className="mt-0.5 font-mono text-sm">
                    {account.makeScenarioId}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              Not connected to Make.com yet. This will be configured in a future
              update.
            </p>
          )}
        </div>

        {/* Metadata */}
        <div className="mt-4 border-t pt-4 text-xs text-gray-400">
          Created: {formatDateTime(account.createdAt)} | Updated:{" "}
          {formatDateTime(account.updatedAt)}
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Disconnect Account
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to disconnect &ldquo;{account.accountName}
              &rdquo;? Publications linked to this account will be affected.
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
                disabled={deleteAccount.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteAccount.isPending ? "Disconnecting..." : "Disconnect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
