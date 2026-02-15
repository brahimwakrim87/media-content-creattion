"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  FileText,
  Image,
  Video,
  Newspaper,
  Megaphone,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useCampaigns } from "@/lib/hooks/use-campaigns";
import { useCreateContent } from "@/lib/hooks/use-content";
import { useUpdateContent } from "@/lib/hooks/use-content";
import {
  useGenerateContent,
  useGenerationHistory,
} from "@/lib/hooks/use-generation";
import { GenerationProgress } from "@/components/generation-progress";
import { GenerationResult } from "@/components/generation-result";
import { cn, formatDateTime } from "@/lib/utils";

type WizardStep = "configure" | "generating" | "review";

const contentTypes = [
  { value: "post", label: "Post", icon: FileText, desc: "Social media post" },
  {
    value: "article",
    label: "Article",
    icon: Newspaper,
    desc: "Long-form article",
  },
  {
    value: "advertisement",
    label: "Ad Copy",
    icon: Megaphone,
    desc: "Advertising copy",
  },
  { value: "image", label: "Image", icon: Image, desc: "Image processing" },
  { value: "video", label: "Video", icon: Video, desc: "Video processing" },
] as const;

const toneOptions = [
  "professional",
  "casual",
  "humorous",
  "formal",
  "inspirational",
];
const lengthOptions = ["short", "medium", "long"];
const platformOptions = [
  "general",
  "facebook",
  "instagram",
  "linkedin",
  "twitter",
  "youtube",
];

export default function AIStudioPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCampaign = searchParams.get("campaign") || "";
  const preselectedType = searchParams.get("type") || "";

  const { data: campaignsData } = useCampaigns();
  const { data: historyData } = useGenerationHistory();
  const createContent = useCreateContent();
  const generateContent = useGenerateContent();

  const campaigns = campaignsData?.member ?? [];
  const recentJobs = historyData?.member ?? [];

  const [step, setStep] = useState<WizardStep>("configure");
  const [campaignId, setCampaignId] = useState(preselectedCampaign);
  const [contentType, setContentType] = useState(preselectedType || "post");
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [platform, setPlatform] = useState("general");
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [createdObjectId, setCreatedObjectId] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!campaignId) {
      setError("Please select a campaign.");
      return;
    }
    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }

    setError(null);

    try {
      // Create content object first
      const contentObj = await createContent.mutateAsync({
        campaign: `/api/campaigns/${campaignId}`,
        type: contentType,
        title: title || undefined,
      });

      setCreatedObjectId(contentObj.id);

      // Trigger generation
      const result = await generateContent.mutateAsync({
        campaignObjectId: contentObj.id,
        prompt: prompt.trim(),
        options: { tone, length, platform },
      });

      setJobId(result.jobId);
      setStep("generating");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    }
  };

  const handleGenerationComplete = (result: string) => {
    setGeneratedContent(result);
    setStep("review");
  };

  const handleGenerationError = (errorMsg: string) => {
    setError(errorMsg);
    setStep("configure");
  };

  const updateContent = useUpdateContent(createdObjectId ?? "");

  const handleSave = async (editedContent: string) => {
    if (!createdObjectId) return;
    await updateContent.mutateAsync({
      content: editedContent,
    } as Parameters<typeof updateContent.mutateAsync>[0]);
    router.push(`/dashboard/content/${createdObjectId}`);
  };

  const handleRegenerate = () => {
    setStep("configure");
    setJobId(null);
    setGeneratedContent(null);
  };

  const isTextType = ["post", "article", "advertisement"].includes(contentType);

  return (
    <div className="flex gap-6">
      {/* Main wizard */}
      <div className="flex-1">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">AI Studio</h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Generate content using AI. Select a campaign, choose the content
            type, and describe what you need.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step: Configure */}
        {step === "configure" && (
          <div className="space-y-6 rounded-xl border bg-white p-6 shadow-sm">
            {/* Campaign */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Campaign *
              </label>
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select a campaign</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Content Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Content Type
              </label>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {contentTypes.map((ct) => {
                  const Icon = ct.icon;
                  return (
                    <button
                      key={ct.value}
                      type="button"
                      onClick={() => setContentType(ct.value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors",
                        contentType === ct.value
                          ? "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{ct.label}</span>
                    </button>
                  );
                })}
              </div>
              {!isTextType && (
                <p className="mt-2 text-xs text-amber-600">
                  {contentType === "image"
                    ? "Image processing is handled via N8N. Provide a source URL in the prompt."
                    : "Video processing is handled via N8N. Provide source clip URLs in the prompt."}
                </p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title (optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Content title"
              />
            </div>

            {/* Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Prompt *
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={
                  isTextType
                    ? "Describe what you want to generate. Be specific about the topic, audience, and key points..."
                    : "Provide source URLs and processing instructions..."
                }
              />
            </div>

            {/* Options (text types only) */}
            {isTextType && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500">
                    Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm capitalize text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {toneOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">
                    Length
                  </label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm capitalize text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {lengthOptions.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">
                    Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm capitalize text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {platformOptions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={
                generateContent.isPending ||
                createContent.isPending ||
                !campaignId ||
                !prompt.trim()
              }
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {generateContent.isPending || createContent.isPending
                ? "Starting generation..."
                : "Generate Content"}
            </button>
          </div>
        )}

        {/* Step: Generating */}
        {step === "generating" && jobId && (
          <div className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Generating...
            </h2>
            <GenerationProgress
              jobId={jobId}
              onComplete={handleGenerationComplete}
              onError={handleGenerationError}
            />
          </div>
        )}

        {/* Step: Review */}
        {step === "review" && generatedContent && (
          <div className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Review & Save
            </h2>
            <GenerationResult
              content={generatedContent}
              onSave={handleSave}
              onRegenerate={handleRegenerate}
              isSaving={updateContent.isPending}
            />
          </div>
        )}
      </div>

      {/* Right sidebar: recent history */}
      <div className="hidden w-72 shrink-0 lg:block">
        <h3 className="text-sm font-semibold text-gray-900">Recent</h3>
        <div className="mt-3 space-y-2">
          {recentJobs.length === 0 ? (
            <p className="text-xs text-gray-400">No generation history yet.</p>
          ) : (
            recentJobs.slice(0, 8).map((job) => (
              <div
                key={job.id}
                className="rounded-lg border p-2.5 text-xs"
              >
                <div className="flex items-center gap-1.5">
                  {job.status === "completed" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  ) : job.status === "failed" ? (
                    <XCircle className="h-3.5 w-3.5 text-red-500" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                  )}
                  <span className="truncate font-medium text-gray-700">
                    {job.campaignObject?.title ||
                      `${job.campaignObject?.type}`}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-gray-400">
                  {job.prompt.slice(0, 60)}
                  {job.prompt.length > 60 ? "..." : ""}
                </p>
                <p className="mt-0.5 text-gray-300">
                  {formatDateTime(job.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
