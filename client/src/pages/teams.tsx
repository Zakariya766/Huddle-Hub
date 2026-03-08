import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ChevronRight } from "lucide-react";
import { BadgeMark } from "@/components/brand/BadgeMark";
import type { Team } from "@shared/schema";

export default function TeamsPage() {
  const [, navigate] = useLocation();
  const { data: teams, isLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-20">
      <h1 className="font-display text-2xl text-ink mb-1" data-testid="text-teams-title">Team Hubs</h1>
      <p className="text-sm text-muted-foreground mb-5">Pick your squad</p>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {teams?.map((team) => (
            <Card
              key={team.id}
              className="p-4 cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.99]"
              onClick={() => navigate(`/teams/${team.id}`)}
              data-testid={`card-team-${team.id}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: team.color }}
                >
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-ink" data-testid={`text-team-name-${team.id}`}>{team.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{team.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
