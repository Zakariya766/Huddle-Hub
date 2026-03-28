import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { ArrowLeft, Send, Users, SmilePlus } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { CommunityRoom, RoomMessage, RoomMessageReaction, User } from "@shared/schema";

const QUICK_REACTIONS = ["👍", "🔥", "❤️", "😂", "🏈", "🎉"];

export default function CommunityRoomPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: room } = useQuery<CommunityRoom>({
    queryKey: [`/api/community/rooms/${params.id}`],
  });

  const { data: messages } = useQuery<(RoomMessage & { user: User; reactions: RoomMessageReaction[] })[]>({
    queryKey: [`/api/community/rooms/${params.id}/messages`],
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !user) return;
    try {
      await apiRequest("POST", `/api/community/rooms/${params.id}/messages`, {
        content: message.trim(),
        parentMessageId: replyTo,
      });
      setMessage("");
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: [`/api/community/rooms/${params.id}/messages`] });
    } catch {
      toast({ title: "Failed to send message", variant: "destructive" });
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    if (!user) return;
    try {
      await apiRequest("POST", `/api/community/messages/${messageId}/react`, { emoji });
      queryClient.invalidateQueries({ queryKey: [`/api/community/rooms/${params.id}/messages`] });
    } catch {
      // ignore
    }
  };

  // Group messages: top-level vs replies
  const topLevel = messages?.filter(m => !m.parentMessageId) || [];
  const replies = messages?.filter(m => m.parentMessageId) || [];
  const replyMap = new Map<string, typeof replies>();
  replies.forEach(r => {
    const arr = replyMap.get(r.parentMessageId!) || [];
    arr.push(r);
    replyMap.set(r.parentMessageId!, arr);
  });

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Header */}
      <div className="bg-ink text-paper px-4 pt-10 pb-3 shrink-0">
        <div className="max-w-lg mx-auto">
          <Link href="/community">
            <button className="flex items-center gap-1 text-sm text-paper/70 hover:text-paper mb-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="font-display text-xl font-bold">{room?.name || "Room"}</h1>
            <div className="flex items-center gap-1 text-xs text-paper/70">
              <Users className="w-3.5 h-3.5" /> {room?.memberCount || 0}
            </div>
          </div>
          {room?.description && (
            <p className="text-xs text-paper/60 mt-1">{room.description}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-4 max-w-lg mx-auto w-full">
        <div className="space-y-3 pt-4">
          {topLevel.map(msg => {
            const msgReplies = replyMap.get(msg.id) || [];
            const isOwn = user?.id === msg.userId;

            return (
              <div key={msg.id}>
                <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2.5",
                    isOwn
                      ? "bg-ink text-paper rounded-br-md"
                      : "bg-cream text-ink rounded-bl-md"
                  )}>
                    {!isOwn && (
                      <div className="text-[10px] font-semibold mb-0.5 opacity-70">
                        {msg.user?.displayName}
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <div className="flex items-center justify-between mt-1 gap-3">
                      <span className={cn("text-[10px]", isOwn ? "text-paper/50" : "text-ink-muted")}>
                        {msg.createdAt && format(new Date(msg.createdAt), "h:mm a")}
                      </span>
                      <button
                        onClick={() => setReplyTo(msg.id)}
                        className={cn("text-[10px] font-medium", isOwn ? "text-paper/60 hover:text-paper" : "text-ink-muted hover:text-ink")}
                      >
                        Reply
                      </button>
                    </div>
                    {/* Reactions */}
                    {msg.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {Object.entries(
                          msg.reactions.reduce((acc, r) => {
                            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            onClick={() => handleReact(msg.id, emoji)}
                            className="text-xs bg-white/20 rounded-full px-1.5 py-0.5"
                          >
                            {emoji} {count > 1 && count}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* Quick react */}
                <div className={cn("flex gap-0.5 mt-0.5", isOwn ? "justify-end pr-1" : "justify-start pl-1")}>
                  {QUICK_REACTIONS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleReact(msg.id, emoji)}
                      className="text-xs opacity-0 hover:opacity-100 transition-opacity p-0.5 group-hover:opacity-100"
                      style={{ opacity: 0.3 }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Thread replies */}
                {msgReplies.length > 0 && (
                  <div className="ml-8 mt-1 space-y-1 border-l-2 border-cream pl-3">
                    {msgReplies.map(reply => (
                      <div key={reply.id} className="bg-cream/50 rounded-xl px-3 py-2">
                        <span className="text-[10px] font-semibold text-ink/70">{reply.user?.displayName}</span>
                        <p className="text-xs text-ink">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Compose */}
      <div className="shrink-0 border-t border-cream bg-paper px-4 py-3">
        <div className="max-w-lg mx-auto">
          {replyTo && (
            <div className="flex items-center justify-between bg-cream/50 rounded-lg px-3 py-1.5 mb-2 text-xs text-ink-muted">
              <span>Replying to message...</span>
              <button onClick={() => setReplyTo(null)} className="text-red font-medium">Cancel</button>
            </div>
          )}
          {user ? (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Type a message..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                className="flex-1 h-10 rounded-full text-sm"
              />
              <Button
                size="icon"
                className="h-10 w-10 rounded-full shrink-0"
                onClick={handleSend}
                disabled={!message.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <p className="text-sm text-center text-ink-muted py-2">
              <Link href="/profile"><span className="text-red font-medium">Sign in</span></Link> to join the conversation
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
