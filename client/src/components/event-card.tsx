import { Link } from "wouter";
import { Calendar, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VenueImage } from "@/components/venue-image";
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
  "watch-party": "bg-red text-white",
  "bar-special": "bg-amber-500 text-white",
  "tailgate": "bg-emerald-600 text-white",
  "meetup": "bg-sky-600 text-white",
  "other": "bg-ink text-paper",
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
  /** compact = square tile for horizontal scroll; full = image-forward vertical card */
  variant?: "compact" | "full";
}

export function EventCard({ event, rsvpd, onRsvp, variant = "full" }: EventCardProps) {
  const type = event.eventType || "watch-party";
  const typeLabel = TYPE_LABELS[type] ?? type;
  const typeStyle = TYPE_STYLES[type] ?? TYPE_STYLES["other"];
  const tags = (event.teamTags ?? []).filter(
    (t, i, arr) => arr.findIndex(x => x.id === t.id) === i
  );

  if (variant === "compact") {
    return (
      <Link href={`/events/${event.id}`}>
        <div className="group w-[200px] shrink-0 cursor-pointer">
          <div className="relative">
            <VenueImage
              src={event.imageUrl ?? event.venue?.imageUrl}
              name={event.venue?.name ?? event.title}
              seed={event.venue?.id ?? event.id}
              aspect="aspect-square"
              rounded="rounded-3xl"
            />
            <span className={`absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full ${typeStyle}`}>
              {typeLabel}
            </span>
          </div>
          <div className="px-1 pt-2.5">
            <h3 className="font-headline text-lg text-ink leading-tight line-clamp-2">{event.title}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-ink-muted">
              <Calendar className="w-3 h-3" />
              {format(new Date(event.date), "EEE, MMM d")}
              {event.venue?.neighborhood && <span>· {event.venue.neighborhood}</span>}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="group rounded-3xl overflow-hidden bg-paper border border-cream/60 hover:border-ink/20 transition-all">
      <Link href={`/events/${event.id}`}>
        <div className="relative cursor-pointer">
          <VenueImage
            src={event.venue?.imageUrl}
            name={event.venue?.name ?? event.title}
            seed={event.venue?.id ?? event.id}
            aspect="aspect-[5/3]"
            rounded="rounded-none"
          />
          <span className={`absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${typeStyle}`}>
            {typeLabel}
          </span>
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1 text-[11px] text-ink">
            <Users className="w-3 h-3" /> {event.rsvpCount || 0}
          </div>
        </div>
      </Link>
      <div className="p-4">
        <h3 className="font-headline text-[22px] text-ink leading-tight">{event.title}</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-ink-muted">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {format(new Date(event.date), "EEE, MMM d · h:mm a")}
          </span>
          {event.venue && (
            <Link href={`/venues/${event.venue.id}`}>
              <span className="flex items-center gap-1 text-ink hover:text-red">
                <MapPin className="w-3.5 h-3.5" />
                {event.venue.name}
              </span>
            </Link>
          )}
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {tags.map(t => (
              <Badge key={t.id} variant="outline" className="text-[10px] rounded-full">
                {t.name}
              </Badge>
            ))}
          </div>
        )}
        {onRsvp && (
          <div className="mt-4">
            <Button
              size="sm"
              variant={rsvpd ? "outline" : "default"}
              className="rounded-full h-9 px-5 text-sm"
              onClick={() => onRsvp(event.id)}
            >
              {rsvpd ? "RSVP'd" : "RSVP"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
