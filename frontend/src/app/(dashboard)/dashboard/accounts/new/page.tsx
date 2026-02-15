"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { useCreateAccount } from "@/lib/hooks/use-accounts";

const accountSchema = z.object({
  platform: z.enum([
    "facebook",
    "instagram",
    "youtube",
    "linkedin",
    "tiktok",
    "twitter",
  ]),
  accountName: z.string().min(1, "Account name is required").max(255),
  accountType: z.string().optional(),
  accountIdentifier: z
    .string()
    .min(1, "Account identifier is required")
    .max(255),
});

type AccountFormData = z.infer<typeof accountSchema>;

export default function NewAccountPage() {
  const router = useRouter();
  const createAccount = useCreateAccount();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: { platform: "facebook" },
  });

  const onSubmit = async (data: AccountFormData) => {
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        platform: data.platform,
        accountName: data.accountName,
        accountIdentifier: data.accountIdentifier,
      };
      if (data.accountType) payload.accountType = data.accountType;

      const account = await createAccount.mutateAsync(
        payload as Parameters<typeof createAccount.mutateAsync>[0]
      );
      router.push(`/dashboard/accounts/${account.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect account"
      );
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href="/dashboard/accounts"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Accounts
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Connect Social Account
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Register a social media account for publishing content.
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
            Platform *
          </label>
          <select
            {...register("platform")}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
            <option value="linkedin">LinkedIn</option>
            <option value="tiktok">TikTok</option>
            <option value="twitter">Twitter / X</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Account Name *
          </label>
          <input
            type="text"
            {...register("accountName")}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. My Company Page"
          />
          {errors.accountName && (
            <p className="mt-1 text-sm text-red-600">
              {errors.accountName.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Account Type
            </label>
            <select
              {...register("accountType")}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select type</option>
              <option value="page">Page</option>
              <option value="profile">Profile</option>
              <option value="business">Business</option>
              <option value="channel">Channel</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Account Identifier *
            </label>
            <input
              type="text"
              {...register("accountIdentifier")}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. page_id or @handle"
            />
            {errors.accountIdentifier && (
              <p className="mt-1 text-sm text-red-600">
                {errors.accountIdentifier.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Connecting..." : "Connect Account"}
          </button>
          <Link
            href="/dashboard/accounts"
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
