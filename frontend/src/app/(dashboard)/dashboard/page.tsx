"use client";

import { useEffect } from "react";
import {
  BarChart3,
  FileText,
  Megaphone,
  TrendingUp,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth";

const stats = [
  {
    label: "Active Campaigns",
    value: "12",
    change: "+2 this week",
    icon: Megaphone,
    color: "bg-blue-50 text-blue-700",
  },
  {
    label: "Content Pieces",
    value: "48",
    change: "+8 this week",
    icon: FileText,
    color: "bg-green-50 text-green-700",
  },
  {
    label: "Publications",
    value: "156",
    change: "+24 this month",
    icon: BarChart3,
    color: "bg-purple-50 text-purple-700",
  },
  {
    label: "Engagement Rate",
    value: "4.2%",
    change: "+0.3% vs last month",
    icon: TrendingUp,
    color: "bg-orange-50 text-orange-700",
  },
];

export default function DashboardPage() {
  const { user, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Here&apos;s an overview of your media content activity.
        </p>
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
            <p className="mt-2 text-xs text-gray-500">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Content
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Your latest content pieces will appear here.
          </p>
          <div className="mt-4 flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-400">
            No content yet
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Upcoming Publications
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Scheduled publications will appear here.
          </p>
          <div className="mt-4 flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-400">
            No scheduled publications
          </div>
        </div>
      </div>
    </div>
  );
}
