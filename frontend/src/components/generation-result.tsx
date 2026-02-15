"use client";

import { useState } from "react";
import { Copy, Save, RefreshCw, Check } from "lucide-react";

interface GenerationResultProps {
  content: string;
  onSave: (editedContent: string) => void;
  onRegenerate?: () => void;
  isSaving?: boolean;
}

export function GenerationResult({
  content,
  onSave,
  onRegenerate,
  isSaving,
}: GenerationResultProps) {
  const [editedContent, setEditedContent] = useState(content);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">Generated Content</p>
        <span className="text-xs text-gray-400">
          {editedContent.length} characters
        </span>
      </div>

      <textarea
        value={editedContent}
        onChange={(e) => setEditedContent(e.target.value)}
        rows={12}
        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <div className="flex items-center gap-2">
        <button
          onClick={() => onSave(editedContent)}
          disabled={isSaving}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save to Content"}
        </button>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>

        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Regenerate
          </button>
        )}
      </div>
    </div>
  );
}
