import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ChevronRight } from "lucide-react";
import type { Team } from "@shared/schema";

export default function TeamsPage() {
  const [, navigate] = useLocation();
  const { data: teams, isLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-20">
      <h1 className="text-xl font-bold mb-4" data-testid="text-teams-title">Team Hubs</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {teams?.map((team) => (
            <Card
              key={team.id}
              className="p-4 cursor-pointer hover-elevate active-elevate-2"
              onClick={() => navigate(`/teams/${team.id}`)}
              data-testid={`card-team-${team.id}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: team.color }}
                >
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm" data-testid={`text-team-name-${team.id}`}>{team.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{team.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
