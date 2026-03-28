import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { PostCard } from "@/components/post-card";
import { CreatePost } from "@/components/create-post";
import type { Post, User, Team } from "@shared/schema";

export default function LatestPage() {
  const { user } = useAuth();

  const { data: posts, isLoading } = useQuery<(Post & { user: User; likeCount: number; commentCount: number })[]>({
    queryKey: ["/api/posts"],
  });

  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: userLikes } = useQuery<string[]>({
    queryKey: ["/api/likes"],
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-paper">
      <div className="bg-ink text-paper px-4 pt-10 pb-4">
        <div className="max-w-lg mx-auto">
          <h1 className="font-display text-2xl font-bold">Latest</h1>
          <p className="text-sm text-paper/70 mt-1">Strictly chronological — latest first</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-24">
        {user && (
          <div className="mt-4">
            <CreatePost teams={teams || []} />
          </div>
        )}

        <div className="space-y-3 mt-4">
          {isLoading && (
            <p className="text-sm text-ink-muted text-center py-8">Loading posts...</p>
          )}
          {posts?.length === 0 && !isLoading && (
            <p className="text-sm text-ink-muted text-center py-8">No posts yet. Be the first!</p>
          )}
          {posts?.map(post => (
            <PostCard
              key={post.id}
              post={post}
              teams={teams || []}
              likedPostIds={userLikes || []}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
