"use client";

import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { useComments, useCreateComment } from "@/lib/hooks/use-comments";
import { CommentItem } from "@/components/comment-item";
import { useAuthStore } from "@/lib/auth";

interface CommentSectionProps {
  entityType: string;
  entityId: string;
}

export function CommentSection({ entityType, entityId }: CommentSectionProps) {
  const { data: comments, isLoading } = useComments(entityType, entityId);
  const createComment = useCreateComment();
  const user = useAuthStore((s) => s.user);
  const [body, setBody] = useState("");

  const handleSubmit = async () => {
    if (!body.trim()) return;
    await createComment.mutateAsync({ entityType, entityId, body });
    setBody("");
  };

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Comments</h3>
        {comments && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {comments.length}
          </span>
        )}
      </div>

      {/* New comment form */}
      <div className="mb-4 flex gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment..."
          rows={2}
          className="flex-1 rounded-lg border p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={handleSubmit}
          disabled={createComment.isPending || !body.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="h-20 animate-pulse rounded-lg bg-gray-50" />
      ) : !comments || comments.length === 0 ? (
        <p className="text-sm text-gray-500">No comments yet. Start the conversation!</p>
      ) : (
        <div className="divide-y">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              entityType={entityType}
              entityId={entityId}
              currentUserId={user?.id ?? ""}
            />
          ))}
        </div>
      )}
    </div>
  );
}
