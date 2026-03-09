import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, MessageCircle, FileText, Shield } from "lucide-react";
import { LoadingSpinner } from "@/components/brand/LoadingSpinner";
import { PostCard } from "@/components/post-card";
import { useAuth } from "@/lib/auth";
import type { User, Team, Post } from "@shared/schema";

export default function UserProfilePage() {
  const [, params] = useRoute("/users/:id");
  const [, navigate] = useLocation();
  const { user: currentUser } = useAuth();
  const userId = params?.id;

  const { data: profile, isLoading } = useQuery<User & { team?: Team; postCount: number }>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const { data: teams } = useQuery<Team[]>({ queryKey: ["/api/teams"] });

  const { data: allPosts } = useQuery<(Post & { user: User; likeCount: number; commentCount: number })[]>({
    queryKey: ["/api/posts"],
  });

  const { data: likedPostIds } = useQuery<string[]>({
    queryKey: ["/api/likes"],
    enabled: !!currentUser,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-20 text-center">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  const initials = profile.displayName.split(" ").map((n) => n[0]).join("").toUpperCase();
  const team = profile.team;
  const userPosts = allPosts?.filter((p) => p.userId === userId) || [];
  const isSelf = currentUser?.id === userId;

  return (
    <div className="max-w-lg mx-auto pb-20">
      {/* Banner + back button */}
      <div
        className="relative h-36 w-full"
        style={{
          background: team?.color
            ? `linear-gradient(135deg, ${team.color}, ${team.color}88, ${team.color}44)`
            : "linear-gradient(135deg, hsl(var(--navy)), hsl(var(--navy) / 0.6), hsl(var(--navy) / 0.3))",
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 left-3 text-white bg-black/20 hover:bg-black/30 rounded-full"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Profile card overlapping banner */}
      <div className="px-4 -mt-12">
        <Card className="rounded-3xl overflow-hidden">
          <div className="px-5 pt-0 -mt-8">
            <Avatar className="w-24 h-24 ring-4 ring-background shadow-lg">
              <AvatarFallback
                className="text-2xl font-bold text-white"
                style={{ backgroundColor: team?.color || "#6B7280" }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="px-5 pt-3 pb-5">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl text-ink">{profile.displayName}</h1>
              {profile.isAdmin && (
                <Badge variant="default" className="text-[10px]">
                  <Shield className="w-3 h-3 mr-0.5" />
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>

            <div className="flex items-center gap-3 mt-3">
              {team && (
                <Badge variant="secondary" className="text-xs">
                  <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: team.color }} />
                  {team.name}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                <FileText className="w-3 h-3 mr-1" />
                {profile.postCount} posts
              </Badge>
            </div>

            {!isSelf && currentUser && (
              <Button
                className="w-full mt-4"
                onClick={() => navigate(`/messages/${userId}`)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* User's posts */}
      {userPosts.length > 0 && (
        <div className="px-4 mt-5">
          <div className="star-divider mb-4">Posts</div>
          <div className="space-y-3">
            {userPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                teams={teams || []}
                likedPostIds={likedPostIds || []}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
