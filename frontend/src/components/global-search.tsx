"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Megaphone,
  FileText,
  Send,
} from "lucide-react";
import { useGlobalSearch } from "@/lib/hooks/use-advanced";
import { cn } from "@/lib/utils";

const typeConfig = {
  campaign: { icon: Megaphone, color: "text-blue-600", href: "/dashboard/campaigns" },
  content: { icon: FileText, color: "text-purple-600", href: "/dashboard/content" },
  publication: { icon: Send, color: "text-green-600", href: "/dashboard/publications" },
} as const;

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { data, isLoading } = useGlobalSearch(query);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSelect = (type: string, id: string) => {
    const config = typeConfig[type as keyof typeof typeConfig];
    if (config) {
      router.push(`${config.href}/${id}`);
    }
    setOpen(false);
    setQuery("");
  };

  const allResults = [
    ...(data?.campaigns ?? []),
    ...(data?.content ?? []),
    ...(data?.publications ?? []),
  ];

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-400 hover:bg-white hover:text-gray-600 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden rounded border bg-white px-1.5 py-0.5 text-xs font-medium text-gray-400 sm:inline">
          Ctrl+K
        </kbd>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-[28rem] rounded-xl border bg-white shadow-2xl">
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search campaigns, content, publications..."
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="rounded p-0.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {query.length < 2 ? (
                <p className="p-4 text-center text-sm text-gray-400">
                  Type at least 2 characters to search
                </p>
              ) : isLoading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 animate-pulse rounded bg-gray-50" />
                  ))}
                </div>
              ) : allResults.length === 0 ? (
                <p className="p-4 text-center text-sm text-gray-500">
                  No results for "{query}"
                </p>
              ) : (
                <div className="py-1">
                  {/* Campaigns */}
                  {(data?.campaigns?.length ?? 0) > 0 && (
                    <div>
                      <p className="px-3 py-1.5 text-xs font-semibold uppercase text-gray-400">
                        Campaigns
                      </p>
                      {data!.campaigns.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelect("campaign", item.id)}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          <Megaphone className="h-4 w-4 shrink-0 text-blue-600" />
                          <span className="flex-1 truncate text-gray-900">
                            {item.name}
                          </span>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                            {item.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Content */}
                  {(data?.content?.length ?? 0) > 0 && (
                    <div>
                      <p className="px-3 py-1.5 text-xs font-semibold uppercase text-gray-400">
                        Content
                      </p>
                      {data!.content.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelect("content", item.id)}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          <FileText className="h-4 w-4 shrink-0 text-purple-600" />
                          <div className="flex-1 min-w-0">
                            <span className="truncate text-gray-900">
                              {item.title}
                            </span>
                            <span className="ml-2 text-xs text-gray-400">
                              {item.campaignName}
                            </span>
                          </div>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                            {item.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Publications */}
                  {(data?.publications?.length ?? 0) > 0 && (
                    <div>
                      <p className="px-3 py-1.5 text-xs font-semibold uppercase text-gray-400">
                        Publications
                      </p>
                      {data!.publications.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelect("publication", item.id)}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          <Send className="h-4 w-4 shrink-0 text-green-600" />
                          <div className="flex-1 min-w-0">
                            <span className="truncate text-gray-900">
                              {item.title}
                            </span>
                            <span className="ml-2 text-xs text-gray-400">
                              {item.platform}
                            </span>
                          </div>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                            {item.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
