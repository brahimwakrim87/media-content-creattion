"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Edit2,
  Trash2,
  Plus,
  Video,
  FileText,
  Image,
  Newspaper,
  Megaphone,
  MessageSquare,
  Clock,
  Users,
} from "lucide-react";
import { useCampaign, useDeleteCampaign } from "@/lib/hooks/use-campaigns";
import { useCampaignContent } from "@/lib/hooks/use-content";
import { useCampaignActivity } from "@/lib/hooks/use-activity";
import { useAuthStore } from "@/lib/auth";
import { StatusBadge } from "@/components/status-badge";
import { TeamMembersPanel } from "@/components/team-members-panel";
import { CommentSection } from "@/components/comment-section";
import { ActivityFeed } from "@/components/activity-feed";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, typeof Video> = {
  video: Video,
  post: FileText,
  article: Newspaper,
  image: Image,
  advertisement: Megaphone,
};

type TabKey = "activity" | "comments" | "team";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: campaign, isLoading } = useCampaign(id);
  const { data: contentData } = useCampaignContent(id);
  const { data: activityData, isLoading: activityLoading } = useCampaignActivity(id);
  const deleteCampaign = useDeleteCampaign();
  const user = useAuthStore((s) => s.user);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("activity");

  const content = contentData?.member ?? [];

  const handleDelete = async () => {
    await deleteCampaign.mutateAsync(id);
    router.push("/dashboard/campaigns");
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-4 h-64 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center">
        <p className="text-gray-500">Campaign not found.</p>
        <Link href="/dashboard/campaigns" className="mt-2 text-blue-600 hover:underline">
          Back to campaigns
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          href="/dashboard/campaigns"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Campaigns
        </Link>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {campaign.name}
              </h1>
              <StatusBadge status={campaign.status} variant="campaign" />
            </div>
            {campaign.description && (
              <p className="mt-2 text-gray-600">{campaign.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-lg border border-red-300 p-2 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-6 text-sm text-gray-500">
          {campaign.budget && (
            <span className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" />
              Budget: ${campaign.budget}
            </span>
          )}
          {campaign.startDate && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {new Date(campaign.startDate).toLocaleDateString()}
              {campaign.endDate &&
                ` - ${new Date(campaign.endDate).toLocaleDateString()}`}
            </span>
          )}
        </div>

        {campaign.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {campaign.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: tag.color ? `${tag.color}20` : "#f3f4f6",
                  color: tag.color || "#6b7280",
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content objects section */}
      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Content</h2>
          <Link
            href={`/dashboard/content/new?campaign=${id}`}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Content
          </Link>
        </div>

        {content.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
            <FileText className="h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-900">
              No content yet
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Start creating content for this campaign.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {content.map((item) => {
              const Icon = typeIcons[item.type] || FileText;
              return (
                <Link
                  key={item.id}
                  href={`/dashboard/content/${item.id}`}
                  className="flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="rounded-lg bg-gray-100 p-2.5">
                    <Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {item.title || `Untitled ${item.type}`}
                    </p>
                    {item.content && (
                      <p className="mt-0.5 truncate text-sm text-gray-500">
                        {item.content}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={item.status} variant="content" />
                    <span className="text-xs text-gray-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Collaboration tabs */}
      {campaign && (
        <div className="mt-6">
          <div className="flex border-b">
            {(
              [
                { key: "activity" as TabKey, label: "Activity", icon: Clock },
                { key: "comments" as TabKey, label: "Comments", icon: MessageSquare },
                { key: "team" as TabKey, label: "Team", icon: Users },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="mt-4">
            {activeTab === "activity" && (
              <ActivityFeed items={activityData} isLoading={activityLoading} />
            )}
            {activeTab === "comments" && (
              <CommentSection entityType="Campaign" entityId={id} />
            )}
            {activeTab === "team" && (
              <TeamMembersPanel
                campaignId={id}
                isOwner={campaign.owner.id === user?.id}
              />
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Delete Campaign
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete &ldquo;{campaign.name}&rdquo;?
              This will also delete all associated content. This action cannot be
              undone.
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
                disabled={deleteCampaign.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteCampaign.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
