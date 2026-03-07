import { useState } from "react";
import { Heart, MessageCircle, Flag, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { CommentSection } from "./comment-section";
import { ReportDialog } from "./report-dialog";
import type { Post, User, Team } from "@shared/schema";

interface PostCardProps {
  post: Post & { user: User; likeCount: number; commentCount: number };
  teams: Team[];
  likedPostIds: string[];
}

export function PostCard({ post, teams, likedPostIds }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(post.likeCount);
  const [localLiked, setLocalLiked] = useState(likedPostIds.includes(post.id));

  const team = teams.find((t) => t.id === post.teamId);
  const initials = post.user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase();

  const handleLike = async () => {
    if (!user) {
      toast({ title: "Sign in to like posts", variant: "destructive" });
      return;
    }
    const wasLiked = localLiked;
    setLocalLiked(!wasLiked);
    setLocalLikeCount((c) => (wasLiked ? c - 1 : c + 1));
    try {
      await apiRequest("POST", `/api/posts/${post.id}/like`);
      queryClient.invalidateQueries({ queryKey: ["/api/likes"] });
    } catch {
      setLocalLiked(wasLiked);
      setLocalLikeCount((c) => (wasLiked ? c + 1 : c - 1));
    }
  };

  const handleDelete = async () => {
    try {
      await apiRequest("DELETE", `/api/posts/${post.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "Post deleted" });
    } catch {
      toast({ title: "Failed to delete post", variant: "destructive" });
    }
  };

  return (
    <>
      <Card className="p-4" data-testid={`post-card-${post.id}`}>
        <div className="flex items-start gap-3">
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarFallback
              className="text-xs font-semibold text-white"
              style={{ backgroundColor: team?.color || "#6B7280" }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm" data-testid={`post-author-${post.id}`}>
                {post.user.displayName}
              </span>
              {team && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  <span className="w-2 h-2 rounded-full inline-block mr-1" style={{ backgroundColor: team.color }} />
                  {team.name}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ""}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed" data-testid={`post-content-${post.id}`}>
              {post.content}
            </p>
            <div className="flex items-center gap-1 mt-3">
              <Button
                variant="ghost"
                size="sm"
                className={localLiked ? "text-red-500" : "text-muted-foreground"}
                onClick={handleLike}
                data-testid={`button-like-${post.id}`}
              >
                <Heart className={`w-4 h-4 mr-1 ${localLiked ? "fill-current" : ""}`} />
                <span className="text-xs">{localLikeCount}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => setShowComments(!showComments)}
                data-testid={`button-comments-${post.id}`}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                <span className="text-xs">{post.commentCount}</span>
              </Button>
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground ml-auto"
                  onClick={() => setShowReport(true)}
                  data-testid={`button-report-${post.id}`}
                >
                  <Flag className="w-4 h-4" />
                </Button>
              )}
              {user && (user.id === post.userId || user.isAdmin) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={handleDelete}
                  data-testid={`button-delete-post-${post.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        {showComments && <CommentSection postId={post.id} />}
      </Card>
      <ReportDialog
        open={showReport}
        onOpenChange={setShowReport}
        targetType="post"
        targetId={post.id}
      />
    </>
  );
}
