import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, MapPin, Clock, Calendar, Copy, Check, Ticket, Flag } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { VenueMap } from "@/components/venue-map";
import { IconLocation, IconTicket } from "@/components/brand/icons";
import { LoadingSpinner } from "@/components/brand/LoadingSpinner";
import type { Venue, Team, Offer, OfferClaim, Event } from "@shared/schema";

export default function VenueProfilePage() {
  const [, params] = useRoute("/venues/:id");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const venueId = params?.id;

  const [claimDialog, setClaimDialog] = useState<OfferClaim | null>(null);
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);

  const { data: venue, isLoading } = useQuery<Venue>({
    queryKey: [`/api/venues/${venueId}`],
    enabled: !!venueId,
  });

  const { data: teams } = useQuery<Team[]>({ queryKey: ["/api/teams"] });

  const { data: offers } = useQuery<(Offer & { venue?: Venue })[]>({
    queryKey: [`/api/offers?venueId=${venueId}`],
    enabled: !!venueId,
  });

  const { data: events } = useQuery<(Event & { venue?: Venue; homeTeam?: Team; awayTeam?: Team })[]>({
    queryKey: ["/api/events"],
  });

  const { data: claims } = useQuery<(OfferClaim & { offer: Offer })[]>({
    queryKey: ["/api/claims"],
    enabled: !!user,
  });

  const handleClaim = async (offerId: string) => {
    if (!user) {
      toast({ title: "Sign in to claim offers", variant: "destructive" });
      return;
    }
    setClaiming(offerId);
    try {
      const res = await apiRequest("POST", `/api/offers/${offerId}/claim`);
      const claim = await res.json();
      setClaimDialog(claim);
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
    } catch {
      toast({ title: "Failed to claim offer", variant: "destructive" });
    } finally {
      setClaiming(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAlreadyClaimed = (offerId: string) => {
    return claims?.some((c) => c.offerId === offerId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-20 text-center">
        <p className="text-muted-foreground">Venue not found</p>
      </div>
    );
  }

  const team = teams?.find((t) => t.id === venue.teamId);
  const venueEvents = events?.filter((e) => e.venueId === venueId) || [];

  return (
    <div className="max-w-lg mx-auto pb-20">
      {/* Banner with map */}
      <div className="relative h-48 w-full">
        <VenueMap
          venues={[venue]}
          teams={teams || []}
          selectedVenueId={venue.id}
          onVenueSelect={() => {}}
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 left-3 z-[1000] text-ink bg-background/80 hover:bg-background rounded-full shadow-md"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Venue info card */}
      <div className="px-4 -mt-6 relative z-[500]">
        <Card className="rounded-3xl overflow-hidden">
          <div className="px-5 pt-5 pb-5">
            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ backgroundColor: team?.color || "#6B728022" }}
              >
                <IconLocation size={26} className={team?.color ? "text-white" : "text-ink-muted"} />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-xl text-ink">{venue.name}</h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {team && (
                    <Badge variant="secondary" className="text-xs">
                      <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: team.color }} />
                      {team.name}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs capitalize">{venue.category}</Badge>
                </div>
              </div>
            </div>

            {venue.description && (
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{venue.description}</p>
            )}

            <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{venue.address}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Offers section */}
      {offers && offers.length > 0 && (
        <div className="px-4 mt-5">
          <div className="star-divider mb-4">Offers</div>
          <div className="space-y-3">
            {offers.map((offer) => {
              const offerTeam = teams?.find((t) => t.id === offer.teamId);
              const claimed = isAlreadyClaimed(offer.id);
              return (
                <Card key={offer.id} className="p-4 rounded-3xl" data-testid={`card-offer-${offer.id}`}>
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: offerTeam?.color || "#6B728022" }}
                    >
                      <IconTicket size={22} className={offerTeam?.color ? "text-white" : "text-ink-muted"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm text-ink">{offer.title}</h3>
                        <Badge variant="default" className="text-[10px]">{offer.discount}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{offer.description}</p>
                      {offer.expiresAt && (
                        <span className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          Expires {format(new Date(offer.expiresAt), "MMM d")}
                        </span>
                      )}
                      <div className="mt-3">
                        {claimed ? (
                          <Badge variant="secondary" className="text-xs">
                            <Check className="w-3 h-3 mr-1" />
                            Claimed
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleClaim(offer.id)}
                            disabled={claiming === offer.id}
                            data-testid={`button-claim-${offer.id}`}
                          >
                            <Ticket className="w-4 h-4 mr-1" />
                            {claiming === offer.id ? "Claiming..." : "Claim Offer"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming events at this venue */}
      {venueEvents.length > 0 && (
        <div className="px-4 mt-5">
          <div className="star-divider mb-4">Upcoming Events</div>
          <div className="space-y-3">
            {venueEvents.map((event) => {
              const homeTeam = event.homeTeam;
              const awayTeam = event.awayTeam;
              const hasMatchup = homeTeam && awayTeam;
              return (
                <Card key={event.id} className="p-4 rounded-3xl">
                  {hasMatchup ? (
                    <div>
                      <div className="flex items-center justify-center gap-3 py-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: homeTeam.color }}
                          >
                            <span className="text-white text-[10px] font-bold">{homeTeam.name.split(" ").pop()?.[0]}</span>
                          </div>
                          <span className="font-display text-xs text-ink">{homeTeam.name}</span>
                        </div>
                        <span className="font-display text-sm text-muted-foreground">vs</span>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-xs text-ink">{awayTeam.name}</span>
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: awayTeam.color }}
                          >
                            <span className="text-white text-[10px] font-bold">{awayTeam.name.split(" ").pop()?.[0]}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {format(new Date(event.date), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-ink">{event.title}</h3>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {format(new Date(event.date), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Claim dialog */}
      <Dialog open={!!claimDialog} onOpenChange={() => setClaimDialog(null)}>
        <DialogContent className="max-w-xs text-center rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Offer Claimed!</DialogTitle>
            <DialogDescription>Show this code to redeem your offer</DialogDescription>
          </DialogHeader>
          {claimDialog && (
            <div className="py-4">
              <div className="bg-white rounded-2xl p-5 mb-4 flex flex-col items-center gap-4 shadow-sm border border-border/50">
                <QRCodeSVG
                  value={claimDialog.claimCode}
                  size={160}
                  level="H"
                />
                <code className="text-2xl font-mono font-bold tracking-widest text-ink">
                  {claimDialog.claimCode}
                </code>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => copyCode(claimDialog.claimCode)}
              >
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Copied!" : "Copy Code"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
