import { Link } from "wouter";
import { Calendar, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Event, Venue, Team } from "@shared/schema";

const TYPE_LABELS: Record<string, string> = {
  "watch-party": "Watch Party",
  "bar-special": "Bar Special",
  "tailgate": "Tailgate",
  "meetup": "Meetup",
  "other": "Event",
};

const TYPE_STYLES: Record<string, string> = {
  "watch-party": "bg-red/10 text-red border-red/30",
  "bar-special": "bg-amber-500/10 text-amber-700 border-amber-500/30",
  "tailgate": "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  "meetup": "bg-sky-500/10 text-sky-700 border-sky-500/30",
  "other": "bg-ink-muted/10 text-ink-muted border-ink-muted/30",
};

export type EventWithRelations = Event & {
  venue?: Venue;
  homeTeam?: Team;
  awayTeam?: Team;
  teamTags?: Team[];
};

interface EventCardProps {
  event: EventWithRelations;
  rsvpd?: boolean;
  onRsvp?: (eventId: string) => void;
  compact?: boolean;
}

export function EventCard({ event, rsvpd, onRsvp, compact }: EventCardProps) {
  const type = event.eventType || "watch-party";
  const typeLabel = TYPE_LABELS[type] ?? type;
  const typeStyle = TYPE_STYLES[type] ?? TYPE_STYLES["other"];

  // Dedupe team tags (junction may repeat home/away)
  const tags = (event.teamTags ?? []).filter(
    (t, i, arr) => arr.findIndex(x => x.id === t.id) === i
  );

  return (
    <Card className={`border-cream hover:shadow-md transition-shadow ${compact ? "" : ""}`}>
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${typeStyle}`}>
                {typeLabel}
              </span>
            </div>
            <h3 className="font-semibold text-ink leading-snug">{event.title}</h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-ink-muted">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(event.date), "EEE, MMM d 'at' h:mm a")}
              </span>
              {event.venue && (
                <Link href={`/venues/${event.venue.id}`}>
                  <span className="flex items-center gap-1 text-red hover:underline">
                    <MapPin className="w-3.5 h-3.5" />
                    {event.venue.name}
                    {event.venue.neighborhood && (
                      <span className="text-ink-muted">· {event.venue.neighborhood}</span>
                    )}
                  </span>
                </Link>
              )}
            </div>
            {!compact && event.description && (
              <p className="text-xs text-ink-muted mt-2 line-clamp-2">{event.description}</p>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 mt-2">
                {tags.map(t => (
                  <Badge key={t.id} variant="outline" className="text-[10px]">
                    {t.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-1 text-xs text-ink-muted">
              <Users className="w-3.5 h-3.5" /> {event.rsvpCount || 0}
            </div>
            {onRsvp && (
              <Button
                size="sm"
                variant={rsvpd ? "outline" : "default"}
                className="text-xs h-7 px-3 rounded-full"
                onClick={() => onRsvp(event.id)}
              >
                {rsvpd ? "RSVP'd" : "RSVP"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
