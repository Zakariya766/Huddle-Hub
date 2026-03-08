import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Flag, Send, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ReportDialog } from "./report-dialog";
import type { Comment, User } from "@shared/schema";

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [reportTarget, setReportTarget] = useState<string | null>(null);

  const { data: comments, isLoading } = useQuery<(Comment & { user: User })[]>({
    queryKey: ["/api/posts", postId, "comments"],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;
    try {
      await apiRequest("POST", `/api/posts/${postId}/comments`, { content: content.trim() });
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    } catch {
      toast({ title: "Failed to add comment", variant: "destructive" });
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await apiRequest("DELETE", `/api/posts/${postId}/comments`);
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="mt-4 pt-4 border-t border-border/60 space-y-3">
        <Skeleton className="h-8 w-full rounded-lg" />
        <Skeleton className="h-8 w-3/4 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-border/60">
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {comments?.map((comment) => {
          const initials = comment.user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase();
          return (
            <div key={comment.id} className="flex items-start gap-2.5" data-testid={`comment-${comment.id}`}>
              <Avatar className="w-7 h-7 flex-shrink-0">
                <AvatarFallback className="text-[10px] font-semibold bg-paper-deep text-ink-muted">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 bg-paper-deep rounded-2xl rounded-tl-md px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-ink">{comment.user.displayName}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : ""}
                  </span>
                </div>
                <p className="text-xs mt-0.5 leading-relaxed text-ink/85">{comment.content}</p>
              </div>
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                  onClick={() => setReportTarget(comment.id)}
                >
                  <Flag className="w-3 h-3" />
                </Button>
              )}
            </div>
          );
        })}
        {comments?.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-3">No comments yet</p>
        )}
      </div>
      {user && (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-3">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a comment..."
            className="text-sm rounded-full bg-paper-deep border-0 focus-visible:ring-1"
            data-testid={`input-comment-${postId}`}
          />
          <Button type="submit" size="icon" disabled={!content.trim()} className="flex-shrink-0" data-testid={`button-send-comment-${postId}`}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      )}
      {reportTarget && (
        <ReportDialog
          open={!!reportTarget}
          onOpenChange={() => setReportTarget(null)}
          targetType="comment"
          targetId={reportTarget}
        />
      )}
    </div>
  );
}
