import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageCircle, FileText } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import type { User, Team } from "@shared/schema";

interface UserProfilePopupProps {
  userId: string;
  displayName: string;
  onClose: () => void;
  onMessage?: (userId: string) => void;
}

export function UserProfilePopup({ userId, displayName, onClose, onMessage }: UserProfilePopupProps) {
  const { user: currentUser } = useAuth();
  const [, navigate] = useLocation();

  const { data: profile } = useQuery<User & { team?: Team; postCount: number }>({
    queryKey: [`/api/users/${userId}`],
  });

  if (!profile) return null;

  const initials = profile.displayName.split(" ").map((n) => n[0]).join("").toUpperCase();
  const team = profile.team;
  const isSelf = currentUser?.id === userId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <Card
        className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner */}
        <div
          className="h-24 w-full"
          style={{
            background: team
              ? "linear-gradient(135deg, #6B7280, #6B728088)"
              : "linear-gradient(135deg, hsl(var(--navy)), hsl(var(--navy) / 0.6))",
          }}
        />

        {/* Avatar overlapping banner */}
        <div className="px-5 -mt-10">
          <Avatar className="w-20 h-20 ring-4 ring-background shadow-lg">
            <AvatarFallback
              className="text-2xl font-bold text-white"
              style={{ backgroundColor: "#6B7280" }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Info */}
        <div className="px-5 pt-3 pb-5">
          <h2 className="font-display text-lg text-ink">{profile.displayName}</h2>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>

          <div className="flex items-center gap-2 mt-2.5">
            {team && (
              <Badge variant="secondary" className="text-xs">
                <span className="w-2 h-2 rounded-full mr-1.5 bg-ink/30" />
                {team.name}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              <FileText className="w-3 h-3 mr-1" />
              {profile.postCount} posts
            </Badge>
          </div>

          {!isSelf && currentUser && (
            <div className="flex gap-2 mt-4">
              <Button
                className="flex-1"
                onClick={() => {
                  onClose();
                  navigate(`/users/${userId}`);
                }}
              >
                View Profile
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  onClose();
                  if (onMessage) onMessage(userId);
                  else navigate(`/messages/${userId}`);
                }}
              >
                <MessageCircle className="w-4 h-4 mr-1.5" />
                Message
              </Button>
            </div>
          )}

          {isSelf && (
            <Button
              className="w-full mt-4"
              variant="outline"
              onClick={() => {
                onClose();
                navigate("/profile");
              }}
            >
              Go to My Profile
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
