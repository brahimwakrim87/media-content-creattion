"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useContentList } from "@/lib/hooks/use-content";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useCreatePublication } from "@/lib/hooks/use-publications";
import { useQueryClient } from "@tanstack/react-query";
import { getPlatformIcon, getPlatformColor } from "@/lib/platform-icons";
import { cn, formatDateISO } from "@/lib/utils";

interface QuickScheduleModalProps {
  date: Date;
  onClose: () => void;
}

export function QuickScheduleModal({ date, onClose }: QuickScheduleModalProps) {
  const queryClient = useQueryClient();
  const { data: contentData } = useContentList();
  const { data: accountsData } = useAccounts();
  const createPublication = useCreatePublication();

  const [selectedContent, setSelectedContent] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [time, setTime] = useState("09:00");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const approvedContent = (contentData?.member ?? []).filter(
    (item) => item.status === "approved"
  );
  const activeAccounts = (accountsData?.member ?? []).filter(
    (a) => a.status === "active"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedContent || !selectedAccount) {
      setError("Please select both content and an account.");
      return;
    }

    const scheduledAt = new Date(
      `${formatDateISO(date)}T${time}:00`
    ).toISOString();

    setSubmitting(true);
    try {
      await createPublication.mutateAsync({
        campaignObject: `/api/campaign_objects/${selectedContent}`,
        socialAccount: `/api/social_accounts/${selectedAccount}`,
        scheduledAt,
      } as unknown as Parameters<typeof createPublication.mutateAsync>[0]);
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Schedule Publication
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-500">
          {date.toLocaleDateString("en", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Content (approved only) *
            </label>
            <select
              value={selectedContent}
              onChange={(e) => setSelectedContent(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select content</option>
              {approvedContent.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title || `Untitled ${item.type}`}
                </option>
              ))}
            </select>
            {approvedContent.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                No approved content available. Approve content first.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Social Account *
            </label>
            {activeAccounts.length === 0 ? (
              <p className="mt-1 text-sm text-gray-500">
                No active accounts available.
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                {activeAccounts.map((account) => {
                  const Icon = getPlatformIcon(account.platform);
                  const color = getPlatformColor(account.platform);
                  return (
                    <label
                      key={account.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 transition-colors hover:bg-gray-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
                    >
                      <input
                        type="radio"
                        name="account"
                        value={account.id}
                        checked={selectedAccount === account.id}
                        onChange={(e) => setSelectedAccount(e.target.value)}
                        className="text-blue-600"
                      />
                      <Icon className={cn("h-4 w-4", color)} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {account.accountName}
                        </p>
                        <p className="text-xs capitalize text-gray-500">
                          {account.platform}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Time *
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting || !selectedContent || !selectedAccount}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Scheduling..." : "Schedule"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
