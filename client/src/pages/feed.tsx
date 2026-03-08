import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "@/components/post-card";
import { CreatePost } from "@/components/create-post";
import { LogoWordmark } from "@/components/brand/LogoWordmark";
import { LoadingSpinner } from "@/components/brand/LoadingSpinner";
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
    <div className="max-w-lg mx-auto pb-20">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-b-3xl mb-5">
        <img
          src="/brand/banner_stars_1600x320.png"
          alt=""
          className="w-full h-28 object-cover"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
        <div className="absolute bottom-3 left-4">
          <LogoWordmark size="md" />
        </div>
      </div>

      <div className="px-4 space-y-5">
        <div className="star-divider">Latest</div>

        {user && teams && <CreatePost teams={teams} />}

        {postsLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="md" />
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
    </div>
  );
}
