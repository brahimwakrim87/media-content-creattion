"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useCampaigns } from "@/lib/hooks/use-campaigns";
import { useCreateContent } from "@/lib/hooks/use-content";
import { useTags } from "@/lib/hooks/use-tags";
import { MediaUpload } from "@/components/media-upload";

const contentSchema = z.object({
  campaign: z.string().min(1, "Please select a campaign"),
  type: z.enum(["video", "post", "article", "image", "advertisement"]),
  title: z.string().optional(),
  content: z.string().optional(),
});

type ContentFormData = z.infer<typeof contentSchema>;

export default function NewContentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCampaign = searchParams.get("campaign") || "";
  const createContent = useCreateContent();
  const { data: campaignsData } = useCampaigns();
  const { data: tagsData } = useTags();
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  const campaigns = campaignsData?.member ?? [];
  const tags = tagsData?.member ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContentFormData>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      campaign: preselectedCampaign,
      type: "post",
    },
  });

  const onSubmit = async (data: ContentFormData) => {
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        campaign: `/api/campaigns/${data.campaign}`,
        type: data.type,
      };
      if (data.title) payload.title = data.title;
      if (data.content) payload.content = data.content;
      if (mediaUrl) payload.mediaUrl = mediaUrl;
      if (selectedTags.length > 0) {
        payload.tags = selectedTags.map((id) => `/api/tags/${id}`);
      }

      const item = await createContent.mutateAsync(
        payload as unknown as Parameters<typeof createContent.mutateAsync>[0]
      );
      router.push(`/dashboard/content/${item.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create content");
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href="/dashboard/content"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Content
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Create Content
        </h1>
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
            Campaign *
          </label>
          <select
            {...register("campaign")}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select a campaign</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.campaign && (
            <p className="mt-1 text-sm text-red-600">
              {errors.campaign.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Type *
            </label>
            <select
              {...register("type")}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="post">Post</option>
              <option value="video">Video</option>
              <option value="article">Article</option>
              <option value="image">Image</option>
              <option value="advertisement">Advertisement</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              {...register("title")}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Content title"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Content
          </label>
          <textarea
            {...register("content")}
            rows={6}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Write your content here..."
          />
        </div>

        {/* Media Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Media (optional)
          </label>
          <div className="mt-1">
            <MediaUpload
              onUploadComplete={(result) => setMediaUrl(result.url)}
            />
          </div>
        </div>

        {tags.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tags
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    selectedTags.includes(tag.id)
                      ? "ring-2 ring-blue-500 ring-offset-1"
                      : "hover:opacity-80"
                  }`}
                  style={{
                    backgroundColor: tag.color ? `${tag.color}20` : "#f3f4f6",
                    color: tag.color || "#6b7280",
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Content"}
          </button>
          <Link
            href="/dashboard/content"
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancel
          </Link>
          <Link
            href={`/dashboard/ai-studio${preselectedCampaign ? `?campaign=${preselectedCampaign}` : ""}`}
            className="flex items-center gap-1.5 rounded-lg border border-purple-300 px-4 py-2.5 text-sm font-semibold text-purple-700 shadow-sm hover:bg-purple-50"
          >
            <Sparkles className="h-4 w-4" />
            Generate with AI
          </Link>
        </div>
      </form>
    </div>
  );
}
