import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "@/components/post-card";
import { CreatePost } from "@/components/create-post";
import { LogoWordmark } from "@/components/brand/LogoWordmark";
import { useAuth } from "@/lib/auth";
import type { Post, User, Team } from "@shared/schema";

export default function FeedPage() {
  const { user } = useAuth();

  const { data: posts, isLoading: postsLoading } = useQuery<(Post & { user: User; likeCount: number; commentCount: number })[]>({
    queryKey: ["/api/posts"],
  });

  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: likedPostIds } = useQuery<string[]>({
    queryKey: ["/api/likes"],
    enabled: !!user,
  });

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-20 space-y-5">
      <div className="flex items-center justify-between gap-2">
        <LogoWordmark size="md" />
      </div>

      <div className="star-divider">Latest</div>

      {user && teams && <CreatePost teams={teams} />}

      {postsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
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
              <p className="text-muted-foreground text-sm">No posts yet. Be the first to share!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
