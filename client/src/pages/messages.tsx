import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send } from "lucide-react";
import { IconFootball } from "@/components/brand/icons";
import { LoadingSpinner } from "@/components/brand/LoadingSpinner";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { User, Team, Message } from "@shared/schema";

export default function MessagesPage() {
  const [, params] = useRoute("/messages/:userId");
  const targetUserId = params?.userId;

  if (targetUserId) return <ChatView userId={targetUserId} />;
  return <ConversationList />;
}

function ConversationList() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: conversations, isLoading } = useQuery<{ user: User; lastMessage: Message; unreadCount: number }[]>({
    queryKey: ["/api/messages/conversations"],
    enabled: !!user,
    refetchInterval: 5000,
  });

  const { data: teams } = useQuery<Team[]>({ queryKey: ["/api/teams"] });

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-20 text-center">
        <IconFootball size={48} className="text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Sign in to access messages</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-20">
      <div className="flex items-center gap-2 mb-1">
        <IconFootball size={28} className="text-navy" />
        <h1 className="font-display text-2xl text-ink">Messages</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-5">Your conversations</p>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="md" />
        </div>
      ) : conversations && conversations.length > 0 ? (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const team = teams?.find((t) => t.id === conv.user.teamId);
            const initials = conv.user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase();
            return (
              <Card
                key={conv.user.id}
                className="p-4 rounded-3xl cursor-pointer hover:bg-paper-deep/50 transition-colors"
                onClick={() => navigate(`/messages/${conv.user.id}`)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-11 h-11 ring-2 ring-background shadow-sm flex-shrink-0">
                    <AvatarFallback
                      className="text-sm font-bold text-white"
                      style={{ backgroundColor: "#6B7280" }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-ink">{conv.user.displayName}</span>
                      {conv.unreadCount > 0 && (
                        <Badge className="text-[10px] px-1.5 py-0 min-w-[18px] justify-center">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {conv.lastMessage.senderId === user.id ? "You: " : ""}
                      {conv.lastMessage.content}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {conv.lastMessage.createdAt
                      ? formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true })
                      : ""}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <IconFootball size={48} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No conversations yet</p>
          <p className="text-xs text-muted-foreground mt-1">Tap on a user's name in the feed to start chatting</p>
        </div>
      )}
    </div>
  );
}

function ChatView({ userId }: { userId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: otherUser } = useQuery<User & { team?: Team; postCount: number }>({
    queryKey: [`/api/users/${userId}`],
  });

  const { data: teams } = useQuery<Team[]>({ queryKey: ["/api/teams"] });

  const { data: msgs, isLoading } = useQuery<(Message & { sender: User })[]>({
    queryKey: [`/api/messages/${userId}`],
    enabled: !!user,
    refetchInterval: 3000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const team = otherUser?.team || teams?.find((t) => t.id === otherUser?.teamId);
  const initials = otherUser?.displayName?.split(" ").map((n) => n[0]).join("").toUpperCase() || "?";

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;
    setSending(true);
    try {
      await apiRequest("POST", "/api/messages", {
        receiverId: userId,
        content: content.trim(),
      });
      setContent("");
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${userId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
    } catch {
      toast({ title: "Failed to send message", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60">
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0"
          onClick={() => navigate("/messages")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Avatar
          className="w-9 h-9 ring-2 ring-background shadow-sm flex-shrink-0 cursor-pointer"
          onClick={() => navigate(`/users/${userId}`)}
        >
          <AvatarFallback
            className="text-xs font-bold text-white"
            style={{ backgroundColor: "#6B7280" }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => navigate(`/users/${userId}`)}
        >
          <h2 className="font-semibold text-sm text-ink">{otherUser?.displayName || "Loading..."}</h2>
          {team && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-ink/30" />
              {team.name}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="sm" />
          </div>
        ) : msgs && msgs.length > 0 ? (
          msgs.map((msg) => {
            const isMine = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${
                    isMine
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-paper-deep text-ink rounded-bl-md"
                  }`}
                >
                  <p className="leading-relaxed">{msg.content}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      isMine ? "text-primary-foreground/60" : "text-muted-foreground"
                    }`}
                  >
                    {msg.createdAt
                      ? formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })
                      : ""}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">Start the conversation</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {user && (
        <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-border/60">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message..."
            className="text-sm rounded-full bg-paper-deep border-0 focus-visible:ring-1"
          />
          <Button type="submit" size="icon" disabled={!content.trim() || sending} className="flex-shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      )}
    </div>
  );
}
