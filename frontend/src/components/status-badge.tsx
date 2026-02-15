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

export function StatusBadge({
  status,
  variant = "campaign",
}: {
  status: string;
  variant?: "campaign" | "content";
}) {
  const colors = variant === "campaign" ? campaignColors : contentColors;
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
