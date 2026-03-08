import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/post-card";
import { CreatePost } from "@/components/create-post";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, Users } from "lucide-react";
import type { Post, User, Team } from "@shared/schema";

export default function TeamHubPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const { data: team, isLoading: teamLoading } = useQuery<Team>({
    queryKey: ["/api/teams", id],
  });

  const { data: posts, isLoading: postsLoading } = useQuery<(Post & { user: User; likeCount: number; commentCount: number })[]>({
    queryKey: [`/api/posts?teamId=${id}`],
  });

  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: likedPostIds } = useQuery<string[]>({
    queryKey: ["/api/likes"],
    enabled: !!user,
  });

  if (teamLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-20 space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Team not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-20">
      {/* Team hero header */}
      <div
        className="relative px-4 pt-4 pb-8 rounded-b-3xl"
        style={{ background: `linear-gradient(160deg, ${team.color}18, ${team.color}35)` }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="mb-2"
          onClick={() => navigate("/teams")}
          data-testid="button-back-teams"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
            style={{ backgroundColor: team.color }}
          >
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl text-ink" data-testid="text-team-hub-name">{team.name}</h1>
            <p className="text-sm text-ink-muted mt-1">{team.description}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {user && teams && <CreatePost teams={teams} />}

        {postsLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            {posts?.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                teams={teams || []}
                likedPostIds={likedPostIds || []}
              />
            ))}
            {posts?.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-sm">No posts in this hub yet</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
