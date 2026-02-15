import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  currentPage,
  totalItems,
  itemsPerPage = 20,
  onPageChange,
}: {
  currentPage: number;
  totalItems: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t pt-4">
      <p className="text-sm text-gray-500">
        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
        {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={cn(
            "rounded-md p-2 text-sm",
            currentPage <= 1
              ? "cursor-not-allowed text-gray-300"
              : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(
            (p) =>
              p === 1 ||
              p === totalPages ||
              Math.abs(p - currentPage) <= 1
          )
          .reduce<(number | "...")[]>((acc, p, i, arr) => {
            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "..." ? (
              <span key={`dots-${i}`} className="px-2 text-gray-400">
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-medium",
                  p === currentPage
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                {p}
              </button>
            )
          )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={cn(
            "rounded-md p-2 text-sm",
            currentPage >= totalPages
              ? "cursor-not-allowed text-gray-300"
              : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
