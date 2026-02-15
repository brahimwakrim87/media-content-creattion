import { cn } from "@/lib/utils";

const campaignColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-green-100 text-green-700",
  paused: "bg-amber-100 text-amber-700",
  completed: "bg-blue-100 text-blue-700",
};

const contentColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  generating: "bg-yellow-100 text-yellow-700",
  ready: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  published: "bg-purple-100 text-purple-700",
};

const publicationColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-blue-100 text-blue-700",
  publishing: "bg-yellow-100 text-yellow-700",
  published: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

const accountColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  expired: "bg-amber-100 text-amber-700",
  revoked: "bg-red-100 text-red-700",
  error: "bg-red-100 text-red-700",
};

export function StatusBadge({
  status,
  variant = "campaign",
}: {
  status: string;
  variant?: "campaign" | "content" | "publication" | "account";
}) {
  const colors =
    variant === "campaign"
      ? campaignColors
      : variant === "content"
        ? contentColors
        : variant === "publication"
          ? publicationColors
          : accountColors;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        colors[status] || "bg-gray-100 text-gray-700"
      )}
    >
      {status}
    </span>
  );
}
