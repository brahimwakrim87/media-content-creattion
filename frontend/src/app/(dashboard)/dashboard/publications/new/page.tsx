"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { useContentList } from "@/lib/hooks/use-content";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useCreatePublication } from "@/lib/hooks/use-publications";
import { getPlatformIcon, getPlatformColor } from "@/lib/platform-icons";
import { cn } from "@/lib/utils";

const publicationSchema = z.object({
  campaignObject: z.string().min(1, "Please select content"),
  socialAccount: z.string().min(1, "Please select a social account"),
  scheduledAt: z.string().optional(),
});

type PublicationFormData = z.infer<typeof publicationSchema>;

export default function NewPublicationPage() {
  const router = useRouter();
  const createPublication = useCreatePublication();
  const { data: contentData } = useContentList();
  const { data: accountsData } = useAccounts();
  const [error, setError] = useState<string | null>(null);

  const contentItems = contentData?.member ?? [];
  const accounts = (accountsData?.member ?? []).filter(
    (a) => a.status === "active"
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PublicationFormData>({
    resolver: zodResolver(publicationSchema),
  });

  const onSubmit = async (data: PublicationFormData) => {
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        campaignObject: `/api/campaign_objects/${data.campaignObject}`,
        socialAccount: `/api/social_accounts/${data.socialAccount}`,
      };
      if (data.scheduledAt) {
        payload.scheduledAt = new Date(data.scheduledAt).toISOString();
      }

      await createPublication.mutateAsync(
        payload as unknown as Parameters<typeof createPublication.mutateAsync>[0]
      );
      router.push("/dashboard/publications");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create publication"
      );
    }
  };

  // Group content by campaign
  const contentByCampaign = contentItems.reduce(
    (acc, item) => {
      const campaignName = item.campaign?.name || "No Campaign";
      if (!acc[campaignName]) acc[campaignName] = [];
      acc[campaignName].push(item);
      return acc;
    },
    {} as Record<string, typeof contentItems>
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href="/dashboard/publications"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Publications
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          New Publication
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Select content and a social account to create a publication.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 rounded-xl border bg-white p-6 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Content *
          </label>
          <select
            {...register("campaignObject")}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select content to publish</option>
            {Object.entries(contentByCampaign).map(([campaign, items]) => (
              <optgroup key={campaign} label={campaign}>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title || `Untitled ${item.type}`} ({item.status})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {errors.campaignObject && (
            <p className="mt-1 text-sm text-red-600">
              {errors.campaignObject.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Social Account *
          </label>
          {accounts.length === 0 ? (
            <div className="mt-1 rounded-lg border-2 border-dashed border-gray-200 p-4 text-center">
              <p className="text-sm text-gray-500">
                No active accounts available.
              </p>
              <Link
                href="/dashboard/accounts/new"
                className="mt-1 text-sm text-blue-600 hover:underline"
              >
                Connect an account first
              </Link>
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              {accounts.map((account) => {
                const Icon = getPlatformIcon(account.platform);
                const color = getPlatformColor(account.platform);
                return (
                  <label
                    key={account.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
                  >
                    <input
                      type="radio"
                      value={account.id}
                      {...register("socialAccount")}
                      className="text-blue-600"
                    />
                    <Icon className={cn("h-5 w-5", color)} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {account.accountName}
                      </p>
                      <p className="text-xs capitalize text-gray-500">
                        {account.platform}
                        {account.accountType &&
                          ` \u00B7 ${account.accountType}`}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
          {errors.socialAccount && (
            <p className="mt-1 text-sm text-red-600">
              {errors.socialAccount.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Schedule (optional)
          </label>
          <input
            type="datetime-local"
            {...register("scheduledAt")}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            Leave empty to save as draft. Set a date to schedule publication.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting || accounts.length === 0}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Publication"}
          </button>
          <Link
            href="/dashboard/publications"
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
