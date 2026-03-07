import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Calendar, Clock, ChevronRight, List, Map as MapIcon, Flag } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { ReportDialog } from "@/components/report-dialog";
import type { Team, Venue, Event } from "@shared/schema";

export default function DiscoverPage() {
  const { user } = useAuth();
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [reportTarget, setReportTarget] = useState<{ type: string; id: string } | null>(null);

  const { data: teams } = useQuery<Team[]>({ queryKey: ["/api/teams"] });

  const venueQueryKey = `/api/venues?${teamFilter !== "all" ? `teamId=${teamFilter}&` : ""}${categoryFilter !== "all" ? `category=${categoryFilter}` : ""}`;
  const { data: venues, isLoading: venuesLoading } = useQuery<Venue[]>({
    queryKey: [venueQueryKey],
  });

  const eventQueryKey = `/api/events?${teamFilter !== "all" ? `teamId=${teamFilter}` : ""}`;
  const { data: events, isLoading: eventsLoading } = useQuery<(Event & { venue?: Venue })[]>({
    queryKey: [eventQueryKey],
  });

  const categories = ["bar", "park", "arena", "outdoor"];

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-20">
      <h1 className="text-xl font-bold mb-4" data-testid="text-discover-title">Discover</h1>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Select value={teamFilter} onValueChange={setTeamFilter}>
          <SelectTrigger className="w-[130px] text-xs" data-testid="select-team-filter">
            <SelectValue placeholder="All Teams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {teams?.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: team.color }} />
                  {team.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[120px] text-xs" data-testid="select-category-filter">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
            data-testid="button-list-view"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "map" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("map")}
            data-testid="button-map-view"
          >
            <MapIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="venues" className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="venues" className="flex-1" data-testid="tab-venues">Venues</TabsTrigger>
          <TabsTrigger value="events" className="flex-1" data-testid="tab-events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="venues">
          {viewMode === "map" ? (
            <Card className="p-6 flex items-center justify-center min-h-[300px]" data-testid="map-view">
              <div className="text-center">
                <MapIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Map View</p>
                <div className="mt-4 space-y-2">
                  {venues?.map((venue) => {
                    const team = teams?.find((t) => t.id === venue.teamId);
                    return (
                      <div key={venue.id} className="flex items-center gap-2 text-xs text-left">
                        <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: team?.color || "#6B7280" }} />
                        <span className="font-medium">{venue.name}</span>
                        <span className="text-muted-foreground">({venue.lat.toFixed(2)}, {venue.lng.toFixed(2)})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          ) : venuesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-md" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {venues?.map((venue) => {
                const team = teams?.find((t) => t.id === venue.teamId);
                return (
                  <Card key={venue.id} className="p-4" data-testid={`card-venue-${venue.id}`}>
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: team?.color || "#6B728022" }}
                      >
                        <MapPin className="w-5 h-5" style={{ color: team?.color ? "#fff" : "#6B7280" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm" data-testid={`text-venue-name-${venue.id}`}>{venue.name}</h3>
                          {team && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {team.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{venue.description}</p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {venue.address}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-[10px]">{venue.category}</Badge>
                          {user && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground ml-auto h-7 px-2"
                              onClick={() => setReportTarget({ type: "venue", id: venue.id })}
                              data-testid={`button-report-venue-${venue.id}`}
                            >
                              <Flag className="w-3 h-3 mr-1" />
                              <span className="text-[10px]">Report</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
              {venues?.length === 0 && (
                <div className="text-center py-12">
                  <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No venues found</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="events">
          {eventsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-md" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {events?.map((event) => {
                const team = teams?.find((t) => t.id === event.teamId);
                return (
                  <Card key={event.id} className="p-4" data-testid={`card-event-${event.id}`}>
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: team?.color || "#6B728022" }}
                      >
                        <Calendar className="w-5 h-5" style={{ color: team?.color ? "#fff" : "#6B7280" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm" data-testid={`text-event-title-${event.id}`}>{event.title}</h3>
                          {team && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {team.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(event.date), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                          {event.venue && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.venue.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
              {events?.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No events found</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {reportTarget && (
        <ReportDialog
          open={!!reportTarget}
          onOpenChange={() => setReportTarget(null)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
        />
      )}
    </div>
  );
}
