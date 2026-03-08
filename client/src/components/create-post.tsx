import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Team } from "@shared/schema";

interface CreatePostProps {
  teams: Team[];
}

export function CreatePost({ teams }: CreatePostProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [teamId, setTeamId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const initials = user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase();

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/posts", {
        content: content.trim(),
        teamId: teamId || undefined,
      });
      setContent("");
      setTeamId("");
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "Post published!" });
    } catch {
      toast({ title: "Failed to create post", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-5 rounded-3xl" data-testid="create-post">
      <div className="flex items-start gap-3.5">
        <Avatar className="w-10 h-10 flex-shrink-0 ring-2 ring-background shadow-sm">
          <AvatarFallback className="text-xs font-bold bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="resize-none border-0 bg-transparent text-sm focus-visible:ring-0 min-h-[60px] placeholder:text-muted-foreground/60"
            data-testid="input-post-content"
          />
          <div className="flex items-center gap-2 justify-between">
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger className="w-[140px] text-xs rounded-full" data-testid="select-post-team">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: team.color }} />
                      {team.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              disabled={!content.trim() || submitting}
              onClick={handleSubmit}
              data-testid="button-publish-post"
            >
              <Send className="w-4 h-4 mr-1" />
              Post
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
