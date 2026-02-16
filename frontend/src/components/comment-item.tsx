"use client";

import { useState } from "react";
import { Reply, Pencil, Trash2, X, Check } from "lucide-react";
import type { Comment } from "@/lib/hooks/use-comments";
import { useCreateComment, useUpdateComment, useDeleteComment } from "@/lib/hooks/use-comments";
import { formatRelativeTime } from "@/lib/utils";

interface CommentItemProps {
  comment: Comment | Omit<Comment, "replies">;
  entityType: string;
  entityId: string;
  currentUserId: string;
  isReply?: boolean;
}

export function CommentItem({
  comment,
  entityType,
  entityId,
  currentUserId,
  isReply = false,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();

  const isAuthor = comment.author.id === currentUserId;
  const replies = "replies" in comment ? comment.replies : [];

  const handleReply = async () => {
    if (!replyBody.trim()) return;
    await createComment.mutateAsync({
      entityType,
      entityId,
      body: replyBody,
      parent: `/api/comments/${comment.id}`,
    });
    setReplyBody("");
    setShowReplyForm(false);
  };

  const handleEdit = async () => {
    if (!editBody.trim()) return;
    await updateComment.mutateAsync({ id: comment.id, body: editBody });
    setEditing(false);
  };

  const handleDelete = () => {
    deleteComment.mutate(comment.id);
  };

  return (
    <div className={isReply ? "ml-10 border-l-2 border-gray-100 pl-4" : ""}>
      <div className="group flex gap-3 py-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-purple-700">
          {(comment.author.firstName?.[0] || comment.author.email[0]).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {comment.author.firstName} {comment.author.lastName}
            </span>
            <span className="text-xs text-gray-400">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>

          {editing ? (
            <div className="mt-1 space-y-2">
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={2}
                className="w-full rounded-lg border p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  disabled={updateComment.isPending}
                  className="flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Check className="h-3 w-3" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditBody(comment.body);
                  }}
                  className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-0.5 whitespace-pre-wrap text-sm text-gray-700">
              {comment.body}
            </p>
          )}

          {!editing && (
            <div className="mt-1 flex items-center gap-3 opacity-0 transition-opacity group-hover:opacity-100">
              {!isReply && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                >
                  <Reply className="h-3 w-3" />
                  Reply
                </button>
              )}
              {isAuthor && (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {showReplyForm && (
        <div className="ml-11 mt-1 mb-2 space-y-2">
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Write a reply..."
            rows={2}
            className="w-full rounded-lg border p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleReply}
              disabled={createComment.isPending || !replyBody.trim()}
              className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createComment.isPending ? "Sending..." : "Reply"}
            </button>
            <button
              onClick={() => {
                setShowReplyForm(false);
                setReplyBody("");
              }}
              className="rounded-md border px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {replies.length > 0 && (
        <div className="space-y-1">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              entityType={entityType}
              entityId={entityId}
              currentUserId={currentUserId}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}
