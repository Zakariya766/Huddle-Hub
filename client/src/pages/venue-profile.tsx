import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { MapPin, Star, ShieldCheck, Calendar, Ticket, Users, MessageCircle, ArrowLeft, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Venue, VenueTeamAffiliation, Team, Event, Offer, Review, Checkin, User, CommunityRoom } from "@shared/schema";

export default function VenueProfilePage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [reviewContent, setReviewContent] = useState("");
  const [reviewRating, setReviewRating] = useState(5);

  const { data: venue } = useQuery<Venue>({
    queryKey: [`/api/venues/${params.id}`],
  });
  const { data: affiliations } = useQuery<(VenueTeamAffiliation & { team: Team })[]>({
    queryKey: [`/api/venues/${params.id}/affiliations`],
  });
  const { data: reviews } = useQuery<(Review & { user: User })[]>({
    queryKey: [`/api/venues/${params.id}/reviews`],
  });
  const { data: checkins } = useQuery<(Checkin & { user: User })[]>({
    queryKey: [`/api/venues/${params.id}/checkins`],
  });
  const { data: events } = useQuery<(Event & { venue?: Venue; homeTeam?: Team; awayTeam?: Team })[]>({
    queryKey: ["/api/events"],
  });
  const { data: offers } = useQuery<(Offer & { venue?: Venue })[]>({
    queryKey: ["/api/offers", { venueId: params.id }],
    queryFn: async () => {
      const res = await fetch(`/api/offers?venueId=${params.id}`);
      return res.json();
    },
  });
  const { data: rooms } = useQuery<CommunityRoom[]>({
    queryKey: ["/api/community/rooms"],
  });

  const venueEvents = events?.filter(e => e.venueId === params.id && new Date(e.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];
  const activeOffers = offers?.filter(o => o.isActive) || [];
  const venueRoom = rooms?.find(r => r.venueId === params.id);

  const handleCheckin = async () => {
    if (!user) { toast({ title: "Sign in to check in", variant: "destructive" }); return; }
    try {
      await apiRequest("POST", `/api/venues/${params.id}/checkin`);
      queryClient.invalidateQueries({ queryKey: [`/api/venues/${params.id}/checkins`] });
      toast({ title: "Checked in!" });
    } catch {
      toast({ title: "Check-in failed", variant: "destructive" });
    }
  };

  const handleReview = async () => {
    if (!user) { toast({ title: "Sign in to review", variant: "destructive" }); return; }
    if (!reviewContent.trim()) return;
    try {
      await apiRequest("POST", `/api/venues/${params.id}/reviews`, {
        rating: reviewRating,
        content: reviewContent.trim(),
      });
      setReviewContent("");
      setReviewRating(5);
      queryClient.invalidateQueries({ queryKey: [`/api/venues/${params.id}/reviews`] });
      queryClient.invalidateQueries({ queryKey: [`/api/venues/${params.id}`] });
      toast({ title: "Review posted!" });
    } catch {
      toast({ title: "Failed to post review", variant: "destructive" });
    }
  };

  const handleClaimOffer = async (offerId: string) => {
    if (!user) { toast({ title: "Sign in to claim", variant: "destructive" }); return; }
    try {
      await apiRequest("POST", `/api/offers/${offerId}/claim`);
      toast({ title: "Offer claimed! Check your offers tab." });
    } catch {
      toast({ title: "Failed to claim offer", variant: "destructive" });
    }
  };

  if (!venue) return <div className="p-4 text-center text-ink-muted">Loading...</div>;

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-paper pb-24">
      {/* Hero photo */}
      <div className="relative w-full h-[280px] md:h-[440px] overflow-hidden bg-black">
        {venue.imageUrl && (
          <img
            src={venue.imageUrl}
            alt={venue.name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40 pointer-events-none" />
        <button
          onClick={goBack}
          className="absolute top-5 left-5 md:top-6 md:left-6 flex items-center gap-1 text-sm text-white/90 hover:text-white bg-black/35 backdrop-blur-sm rounded-full pl-2.5 pr-3.5 py-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="absolute bottom-5 left-5 right-5 md:bottom-8 md:left-10 md:right-10 max-w-4xl mx-auto text-white">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-headline text-3xl md:text-5xl leading-[1] drop-shadow-sm">{venue.name}</h1>
            {venue.verified && <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-turf shrink-0" />}
          </div>
          <div className="flex items-center gap-1 text-sm text-white/85">
            <MapPin className="w-4 h-4" />
            {venue.address}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {venue.rating && venue.rating > 0 && (
              <span className="flex items-center gap-1 text-sm text-gold">
                <Star className="w-4 h-4 fill-current" /> {venue.rating.toFixed(1)}
                <span className="text-white/60">({venue.reviewCount})</span>
              </span>
            )}
            <Badge variant="outline" className="text-xs text-white/90 border-white/40 bg-black/20 backdrop-blur-sm capitalize">{venue.category}</Badge>
            {venue.neighborhood && (
              <span className="text-xs text-white/70">{venue.neighborhood}</span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6 mt-6">
        {/* Description */}
        {venue.description && (
          <p className="text-sm text-ink-muted">{venue.description}</p>
        )}

        {/* Team Affiliations */}
        {affiliations && affiliations.length > 0 && (
          <section>
            <h2 className="font-display text-sm font-bold text-ink-muted uppercase tracking-wider mb-2">Teams</h2>
            <div className="flex flex-wrap gap-1.5">
              {affiliations.map(aff => (
                <Badge key={aff.id} variant={aff.isPrimary ? "default" : "outline"} className="text-xs">
                  {aff.team.name}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={handleCheckin} variant="outline" className="flex-1 rounded-full text-sm h-10">
            <CheckCircle className="w-4 h-4 mr-1.5" /> Check In
          </Button>
          {venueRoom && (
            <Link href={`/community/${venueRoom.id}`} className="flex-1">
              <Button variant="outline" className="w-full rounded-full text-sm h-10">
                <MessageCircle className="w-4 h-4 mr-1.5" /> Community
              </Button>
            </Link>
          )}
        </div>

        {/* Check-ins */}
        {checkins && checkins.length > 0 && (
          <section>
            <h2 className="font-display text-sm font-bold text-ink-muted uppercase tracking-wider mb-2">
              Recent Check-ins ({checkins.length})
            </h2>
            <div className="flex -space-x-2">
              {checkins.slice(0, 10).map(ci => (
                <div key={ci.id} className="w-8 h-8 rounded-full bg-ink/10 flex items-center justify-center text-xs font-bold text-ink border-2 border-paper" title={ci.user?.displayName}>
                  {ci.user?.displayName?.[0] || "?"}
                </div>
              ))}
              {checkins.length > 10 && (
                <div className="w-8 h-8 rounded-full bg-cream flex items-center justify-center text-xs font-medium text-ink-muted border-2 border-paper">
                  +{checkins.length - 10}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Upcoming Events */}
        {venueEvents.length > 0 && (
          <section>
            <h2 className="font-display text-sm font-bold text-ink-muted uppercase tracking-wider mb-2">Upcoming Events</h2>
            <div className="space-y-2">
              {venueEvents.map(event => (
                <Card key={event.id} className="border-cream">
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-sm text-ink">{event.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-ink-muted">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(event.date), "EEE, MMM d 'at' h:mm a")}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {event.homeTeam && <Badge variant="outline" className="text-[10px]">{event.homeTeam.name}</Badge>}
                      {event.awayTeam && <Badge variant="outline" className="text-[10px]">{event.awayTeam.name}</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Active Offers */}
        {activeOffers.length > 0 && (
          <section>
            <h2 className="font-display text-sm font-bold text-ink-muted uppercase tracking-wider mb-2">Offers</h2>
            <div className="space-y-2">
              {activeOffers.map(offer => (
                <Card key={offer.id} className="border-cream">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-sm text-ink">{offer.title}</h3>
                        <p className="text-xs text-ink-muted mt-0.5">{offer.description}</p>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red mt-1">
                          <Ticket className="w-3 h-3" /> {offer.discount}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="rounded-full text-xs h-7 px-3 shrink-0 ml-3"
                        onClick={() => handleClaimOffer(offer.id)}
                      >
                        Claim
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        <section>
          <h2 className="font-display text-sm font-bold text-ink-muted uppercase tracking-wider mb-2">
            Reviews {reviews ? `(${reviews.length})` : ""}
          </h2>

          {/* Write Review */}
          {user && (
            <Card className="border-cream mb-3">
              <CardContent className="p-3">
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setReviewRating(n)}>
                      <Star className={`w-5 h-5 ${n <= reviewRating ? "text-gold fill-current" : "text-ink-muted/30"}`} />
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Write a review..."
                  value={reviewContent}
                  onChange={e => setReviewContent(e.target.value)}
                  className="text-sm min-h-[60px] mb-2"
                />
                <Button size="sm" className="rounded-full text-xs" onClick={handleReview} disabled={!reviewContent.trim()}>
                  Post Review
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {reviews?.map(review => (
              <Card key={review.id} className="border-cream">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-ink/10 flex items-center justify-center text-xs font-bold text-ink">
                      {review.user?.displayName?.[0] || "?"}
                    </div>
                    <span className="text-xs font-medium text-ink">{review.user?.displayName}</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-gold fill-current" />
                      ))}
                    </div>
                    <span className="text-[10px] text-ink-muted ml-auto">
                      {review.createdAt && format(new Date(review.createdAt), "MMM d")}
                    </span>
                  </div>
                  {review.content && <p className="text-xs text-ink-muted">{review.content}</p>}
                </CardContent>
              </Card>
            ))}
            {(!reviews || reviews.length === 0) && (
              <p className="text-xs text-ink-muted text-center py-4">No reviews yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
