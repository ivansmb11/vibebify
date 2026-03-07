"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  Modal,
  ModalOverlay,
  TextField,
  Input,
  Button,
} from "react-aria-components";
import { haptic } from "@/lib/haptics";
import { getComments, createComment } from "@/lib/db";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
}

interface CommentsSheetProps {
  postId: string;
  onClose: () => void;
  onCommentAdded: () => void;
}

export function CommentsSheet({
  postId,
  onClose,
  onCommentAdded,
}: CommentsSheetProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getComments(postId).then((data) => {
      setComments(data as Comment[]);
      setLoading(false);
    });
  }, [postId]);

  const submitComment = async () => {
    if (!newComment.trim() || submitting) return;
    haptic("medium");
    setSubmitting(true);
    try {
      const comment = await createComment(postId, newComment.trim());
      setComments((prev) => [...prev, comment as Comment]);
      setNewComment("");
      onCommentAdded();
    } catch {}
    setSubmitting(false);
  };

  return (
    <ModalOverlay
      isOpen
      onOpenChange={(open) => !open && onClose()}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
    >
      <Modal className="w-full max-w-lg max-h-[80vh] bg-background border-t sm:border border-border flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden">
        <Dialog className="flex flex-col flex-1 outline-none overflow-hidden">
          {/* Handle bar (mobile) */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 bg-border rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Comments
            </h3>
            <Button
              onPress={onClose}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Close
            </Button>
          </div>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-punk-cyan border-t-transparent rounded-full animate-spin" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No comments yet. Start the conversation.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    {comment.profiles.avatar_url ? (
                      <img
                        src={comment.profiles.avatar_url}
                        alt=""
                        className="w-6 h-6 rounded-full border border-border shrink-0 mt-0.5"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-punk-purple flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {comment.profiles.display_name?.charAt(0) ?? "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold">
                          {comment.profiles.display_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {getTimeAgo(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90 leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border px-4 py-3 flex gap-2">
            <TextField
              className="flex-1"
              value={newComment}
              onChange={setNewComment}
              aria-label="Write a comment"
            >
              <Input
                placeholder="Drop a comment..."
                className="w-full bg-muted border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-punk-cyan"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitComment();
                  }
                }}
              />
            </TextField>
            <Button
              onPress={submitComment}
              isDisabled={!newComment.trim() || submitting}
              className="bg-punk-pink text-white px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-punk-pink/80 disabled:opacity-40 disabled:cursor-default -skew-x-3"
            >
              <span className="skew-x-3 block">Send</span>
            </Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
