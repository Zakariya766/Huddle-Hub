import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Users, Search, MessageCircle, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CommunityRoom } from "@shared/schema";

const roomTypeLabels: Record<string, string> = {
  sport: "Sport",
  league: "League",
  team: "Team",
  venue: "Venue",
  event: "Event",
};

const typeFilters = ["all", "team", "league", "sport", "event"];

export default function CommunityPage() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: rooms } = useQuery<CommunityRoom[]>({
    queryKey: ["/api/community/rooms", { type: typeFilter === "all" ? undefined : typeFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      const res = await fetch(`/api/community/rooms?${params}`);
      return res.json();
    },
  });

  const filtered = rooms?.filter(room =>
    !search || room.name.toLowerCase().includes(search.toLowerCase()) ||
    room.description?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-paper">
      <div className="bg-ink text-paper px-4 pt-10 pb-4">
        <div className="max-w-lg mx-auto">
          <h1 className="font-display text-2xl font-bold">Community</h1>
          <p className="text-sm text-paper/70 mt-1">Join the conversation with fellow fans</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-24">
        {/* Search */}
        <div className="relative mt-4 mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <Input
            placeholder="Search rooms..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm rounded-full"
          />
        </div>

        {/* Type Filters */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide">
          {typeFilters.map(type => (
            <Button
              key={type}
              size="sm"
              variant={typeFilter === type ? "default" : "outline"}
              className="text-xs h-7 px-3 rounded-full shrink-0 capitalize"
              onClick={() => setTypeFilter(type)}
            >
              {type === "all" ? "All" : roomTypeLabels[type] || type}
            </Button>
          ))}
        </div>

        {/* Room List */}
        <div className="space-y-2">
          {filtered.length === 0 && (
            <p className="text-sm text-ink-muted text-center py-8">No rooms found.</p>
          )}
          {filtered.map(room => (
            <Link key={room.id} href={`/community/${room.id}`}>
              <Card className="border-cream hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-ink/10 flex items-center justify-center shrink-0">
                          <MessageCircle className="w-4 h-4 text-ink" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm text-ink truncate">{room.name}</h3>
                          {room.description && (
                            <p className="text-xs text-ink-muted truncate">{room.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-3 shrink-0">
                      <div className="flex items-center gap-1 text-xs text-ink-muted">
                        <Users className="w-3 h-3" />
                        {room.memberCount || 0}
                      </div>
                      <Badge variant="outline" className="text-[10px] py-0 capitalize">
                        {roomTypeLabels[room.type] || room.type}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-ink-muted" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
