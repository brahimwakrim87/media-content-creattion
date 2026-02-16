"use client";

import Link from "next/link";
import {
  BarChart3,
  FileText,
  Megaphone,
  Sparkles,
  Video,
  Image,
  Newspaper,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useAuthStore } from "@/lib/auth";
import { useCampaigns } from "@/lib/hooks/use-campaigns";
import { useContentList } from "@/lib/hooks/use-content";
import { useAnalytics } from "@/lib/hooks/use-analytics";
import { StatusBadge } from "@/components/status-badge";

const typeIcons: Record<string, typeof Video> = {
  video: Video,
  post: FileText,
  article: Newspaper,
  image: Image,
  advertisement: Megaphone,
};

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString("en", { month: "short" });
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: campaignsData } = useCampaigns();
  const { data: contentData } = useContentList();
  const { data: analytics } = useAnalytics();

  const campaigns = campaignsData?.member ?? [];
  const content = contentData?.member ?? [];

  const stats = [
    {
      label: "Total Campaigns",
      value: String(analytics?.campaigns.total ?? campaigns.length),
      sub: `${analytics?.campaigns.byStatus?.active ?? 0} active`,
      icon: Megaphone,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Content Pieces",
      value: String(analytics?.content.total ?? content.length),
      sub: "across all campaigns",
      icon: FileText,
      color: "bg-green-50 text-green-700",
    },
    {
      label: "Published",
      value: String(analytics?.content.byStatus?.published ?? 0),
      sub: "content items",
      icon: BarChart3,
      color: "bg-purple-50 text-purple-700",
    },
    {
      label: "AI Generations",
      value: String(analytics?.generations.total ?? 0),
      sub: `${analytics?.generations.completed ?? 0} completed`,
      icon: Sparkles,
      color: "bg-orange-50 text-orange-700",
    },
  ];

  const trendData = (analytics?.monthlyTrends ?? []).map((t) => ({
    month: formatMonth(t.month),
    content: t.content,
    publications: t.publications,
    generations: t.generations,
  }));

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Here&apos;s an overview of your media content activity.
          </p>
        </div>
        <Link
          href="/dashboard/analytics"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          View full analytics
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.label}
                </p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
              <div className={`rounded-lg p-3 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Mini trend chart */}
      {trendData.length > 0 && (
        <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Activity Trend</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="content"
                name="Content"
                stroke="#10B981"
                fill="#10B98133"
              />
              <Area
                type="monotone"
                dataKey="publications"
                name="Publications"
                stroke="#8B5CF6"
                fill="#8B5CF633"
              />
              <Area
                type="monotone"
                dataKey="generations"
                name="Generations"
                stroke="#F59E0B"
                fill="#F59E0B33"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Campaigns
            </h2>
            <Link
              href="/dashboard/campaigns"
              className="text-sm text-blue-600 hover:underline"
            >
              View all
            </Link>
          </div>
          {campaigns.length === 0 ? (
            <div className="mt-4 flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-400">
              No campaigns yet
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {campaigns.slice(0, 5).map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/dashboard/campaigns/${campaign.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {campaign.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {campaign.tags.map((t) => t.name).join(", ") || "No tags"}
                    </p>
                  </div>
                  <StatusBadge status={campaign.status} variant="campaign" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Content
            </h2>
            <Link
              href="/dashboard/content"
              className="text-sm text-blue-600 hover:underline"
            >
              View all
            </Link>
          </div>
          {content.length === 0 ? (
            <div className="mt-4 flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-400">
              No content yet
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {content.slice(0, 5).map((item) => {
                const Icon = typeIcons[item.type] || FileText;
                return (
                  <Link
                    key={item.id}
                    href={`/dashboard/content/${item.id}`}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {item.title || `Untitled ${item.type}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.campaign?.name}
                      </p>
                    </div>
                    <StatusBadge status={item.status} variant="content" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
