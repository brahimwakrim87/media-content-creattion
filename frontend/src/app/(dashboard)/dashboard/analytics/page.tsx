"use client";

import { useState } from "react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  Megaphone,
  FileText,
  Send,
  Sparkles,
  Zap,
  Clock,
  CheckCircle2,
  Activity,
  Users,
  MessageSquare,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { useAnalytics, type AnalyticsPeriod } from "@/lib/hooks/use-analytics";
import { StatusBadge } from "@/components/status-badge";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  video: "#3B82F6",
  post: "#10B981",
  article: "#8B5CF6",
  image: "#F59E0B",
  advertisement: "#EC4899",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#9CA3AF",
  active: "#10B981",
  paused: "#F59E0B",
  completed: "#3B82F6",
};

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  instagram: "#E4405F",
  youtube: "#FF0000",
  linkedin: "#0A66C2",
  tiktok: "#000000",
  twitter: "#1DA1F2",
};

const PIPELINE_COLORS: Record<string, string> = {
  draft: "#9CA3AF",
  generating: "#F59E0B",
  ready: "#3B82F6",
  approved: "#10B981",
  published: "#8B5CF6",
};

const ACTION_LABELS: Record<string, string> = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
};

const PERIOD_OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "12m", label: "Last 12 months" },
  { value: "all", label: "All time" },
];

function toChartData(map: Record<string, number>) {
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString("en", { month: "short", year: "2-digit" });
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("all");
  const { data: analytics, isLoading, error } = useAnalytics(period);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="mt-1 text-sm text-gray-600">Loading analytics data...</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border bg-gray-100" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-xl border bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
          Failed to load analytics data. Please try again later.
        </div>
      </div>
    );
  }

  const contentByType = toChartData(analytics.content.byType);
  const campaignsByStatus = toChartData(analytics.campaigns.byStatus);
  const pubsByPlatform = toChartData(analytics.publications.byPlatform);
  const pubsByStatus = toChartData(analytics.publications.byStatus);
  const successRate =
    analytics.generations.total > 0
      ? Math.round((analytics.generations.completed / analytics.generations.total) * 100)
      : 0;
  const avgTimeSec = (analytics.generations.avgProcessingTimeMs / 1000).toFixed(1);

  const pipelineTotal = analytics.content.pipeline.reduce((s, p) => s + p.count, 0);

  const stats = [
    {
      label: "Total Campaigns",
      value: analytics.campaigns.total,
      sub: `${analytics.campaigns.byStatus.active ?? 0} active`,
      icon: Megaphone,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Content Pieces",
      value: analytics.content.total,
      sub: `${analytics.content.byStatus.published ?? 0} published`,
      icon: FileText,
      color: "bg-green-50 text-green-700",
    },
    {
      label: "Publications",
      value: analytics.publications.total,
      sub: `${analytics.publications.byStatus.published ?? 0} published`,
      icon: Send,
      color: "bg-purple-50 text-purple-700",
    },
    {
      label: "AI Generations",
      value: analytics.generations.total,
      sub: `${analytics.generations.completed} completed`,
      icon: Sparkles,
      color: "bg-orange-50 text-orange-700",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with period selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">
            Platform usage overview and performance metrics.
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as AnalyticsPeriod)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {PERIOD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`rounded-lg p-3 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Content Pipeline */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Content Pipeline</h2>
        {pipelineTotal === 0 ? (
          <div className="flex h-16 items-center justify-center text-sm text-gray-400">
            No content data yet
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex h-8 overflow-hidden rounded-lg">
              {analytics.content.pipeline.map((step) => {
                const pct = pipelineTotal > 0 ? (step.count / pipelineTotal) * 100 : 0;
                if (pct === 0) return null;
                return (
                  <div
                    key={step.status}
                    className="flex items-center justify-center text-xs font-semibold text-white transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: PIPELINE_COLORS[step.status] || "#6B7280",
                      minWidth: step.count > 0 ? "2rem" : 0,
                    }}
                  >
                    {step.count}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4">
              {analytics.content.pipeline.map((step) => (
                <div key={step.status} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: PIPELINE_COLORS[step.status] || "#6B7280" }}
                  />
                  <span className="capitalize text-gray-600">{step.status}</span>
                  <span className="font-semibold text-gray-900">{step.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Content by Type */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Content by Type</h2>
          {contentByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={contentByType}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                  }
                >
                  {contentByType.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={TYPE_COLORS[entry.name] || "#6B7280"}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-gray-400">
              No content data yet
            </div>
          )}
        </div>

        {/* Publications by Platform */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Publications by Platform
          </h2>
          {pubsByPlatform.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={pubsByPlatform}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="Publications">
                  {pubsByPlatform.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={PLATFORM_COLORS[entry.name] || "#6B7280"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-gray-400">
              No publication data yet
            </div>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Campaign Status */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Campaign Status</h2>
          {campaignsByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={campaignsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {campaignsByStatus.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.name] || "#6B7280"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-gray-400">
              No campaign data yet
            </div>
          )}
        </div>

        {/* Publication Outcomes */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Publication Outcomes</h2>
          {pubsByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pubsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pubsByStatus.map((entry) => {
                    const colors: Record<string, string> = {
                      published: "#10B981",
                      scheduled: "#3B82F6",
                      publishing: "#F59E0B",
                      draft: "#9CA3AF",
                      failed: "#EF4444",
                    };
                    return (
                      <Cell
                        key={entry.name}
                        fill={colors[entry.name] || "#6B7280"}
                      />
                    );
                  })}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-gray-400">
              No publication data yet
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Monthly Activity</h2>
        {analytics.monthlyTrends.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={analytics.monthlyTrends.map((t) => ({
                ...t,
                month: formatMonth(t.month),
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
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
        ) : (
          <div className="flex h-[300px] items-center justify-center text-sm text-gray-400">
            No activity data yet
          </div>
        )}
      </div>

      {/* AI + Team metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tokens</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.generations.totalTokens.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{successRate}%</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Processing</p>
              <p className="text-2xl font-bold text-gray-900">{avgTimeSec}s</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-50 p-2 text-teal-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Team Members</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.team.members}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-700">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Comments</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.team.comments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: Top Campaigns + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Campaigns */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Top Campaigns</h2>
          {analytics.topCampaigns.length > 0 ? (
            <div className="mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 font-medium">Campaign</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 text-right font-medium">Content</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {analytics.topCampaigns.map((c) => (
                    <tr key={c.id} className="group">
                      <td className="py-2.5 font-medium text-gray-900">
                        {c.name}
                      </td>
                      <td className="py-2.5">
                        <StatusBadge status={c.status} variant="campaign" />
                      </td>
                      <td className="py-2.5 text-right text-gray-600">
                        {c.contentCount}
                      </td>
                      <td className="py-2.5 text-right">
                        <Link
                          href={`/dashboard/campaigns/${c.id}`}
                          className="text-gray-400 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4 flex h-48 items-center justify-center text-sm text-gray-400">
              No campaigns yet
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          {analytics.recentActivity.length > 0 ? (
            <div className="mt-4 space-y-3">
              {analytics.recentActivity.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="rounded-md bg-gray-100 p-1.5">
                    <Activity className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      <span className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-600">
                        {ACTION_LABELS[log.action] || log.action}
                      </span>{" "}
                      {log.entityType}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatRelativeTime(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 flex h-48 items-center justify-center text-sm text-gray-400">
              No recent activity
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
