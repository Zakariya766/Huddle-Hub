import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Ticket, MapPin, Clock, CheckCircle, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Sport, Offer, Venue, OfferClaim } from "@shared/schema";

export default function OffersPage() {
  const [tab, setTab] = useState<"browse" | "claimed">("browse");
  const [sportFilter, setSportFilter] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sports } = useQuery<Sport[]>({ queryKey: ["/api/sports"] });
  const { data: offers } = useQuery<(Offer & { venue?: Venue })[]>({
    queryKey: ["/api/offers", { sportId: sportFilter || undefined }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (sportFilter) params.set("sportId", sportFilter);
      const res = await fetch(`/api/offers?${params}`);
      return res.json();
    },
  });

  const { data: claims } = useQuery<(OfferClaim & { offer: Offer })[]>({
    queryKey: ["/api/claims"],
    enabled: !!user,
  });

  const activeOffers = offers?.filter(o => o.isActive) || [];

  const handleClaim = async (offerId: string) => {
    if (!user) {
      toast({ title: "Sign in to claim offers", variant: "destructive" });
      return;
    }
    try {
      await apiRequest("POST", `/api/offers/${offerId}/claim`);
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      toast({ title: "Offer claimed! View in My Claims." });
    } catch {
      toast({ title: "Failed to claim offer", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <div className="bg-ink text-paper px-4 pt-10 pb-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-display text-2xl font-bold">Offers</h1>
          <p className="text-sm text-paper/70 mt-1">Exclusive deals from partner venues</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-24">
        {/* Tab toggle */}
        <div className="flex gap-1 mt-4 mb-4 bg-cream rounded-full p-1">
          <Button
            size="sm"
            variant={tab === "browse" ? "default" : "ghost"}
            className="flex-1 rounded-full text-xs h-8"
            onClick={() => setTab("browse")}
          >
            <Ticket className="w-3.5 h-3.5 mr-1" /> Browse Offers
          </Button>
          <Button
            size="sm"
            variant={tab === "claimed" ? "default" : "ghost"}
            className="flex-1 rounded-full text-xs h-8"
            onClick={() => setTab("claimed")}
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1" /> My Claims {claims?.length ? `(${claims.length})` : ""}
          </Button>
        </div>

        {tab === "browse" && (
          <>
            {/* Sport filter */}
            <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide">
              <Button
                size="sm"
                variant={!sportFilter ? "default" : "outline"}
                className="text-xs h-7 px-3 rounded-full shrink-0"
                onClick={() => setSportFilter("")}
              >
                All Sports
              </Button>
              {sports?.map(s => (
                <Button
                  key={s.id}
                  size="sm"
                  variant={sportFilter === s.id ? "default" : "outline"}
                  className="text-xs h-7 px-3 rounded-full shrink-0"
                  onClick={() => setSportFilter(s.id)}
                >
                  {s.name.replace("American ", "")}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeOffers.length === 0 && (
                <p className="text-sm text-ink-muted text-center py-8">No offers available right now.</p>
              )}
              {activeOffers.map(offer => (
                <Card key={offer.id} className="border-cream hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-ink">{offer.title}</h3>
                        <p className="text-xs text-ink-muted mt-0.5 line-clamp-2">{offer.description}</p>
                        <div className="flex items-center gap-1 mt-1.5 text-sm font-bold text-red">
                          <Ticket className="w-3.5 h-3.5" /> {offer.discount}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-ink-muted">
                          {offer.venue && (
                            <Link href={`/venues/${offer.venue.id}`}>
                              <span className="flex items-center gap-1 hover:text-red">
                                <MapPin className="w-3 h-3" /> {offer.venue.name}
                              </span>
                            </Link>
                          )}
                          {offer.expiresAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Expires {format(new Date(offer.expiresAt), "MMM d")}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="rounded-full text-xs h-8 px-4 shrink-0 ml-3"
                        onClick={() => handleClaim(offer.id)}
                      >
                        Claim
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {tab === "claimed" && (
          <div className="space-y-2">
            {!user && (
              <p className="text-sm text-ink-muted text-center py-8">
                <Link href="/profile"><span className="text-red font-medium">Sign in</span></Link> to view your claims.
              </p>
            )}
            {user && (!claims || claims.length === 0) && (
              <p className="text-sm text-ink-muted text-center py-8">No claimed offers yet. Browse and claim one!</p>
            )}
            {claims?.map(claim => (
              <Card key={claim.id} className={`border-cream ${claim.redeemed ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm text-ink">{claim.offer?.title}</h3>
                      <p className="text-xs text-ink-muted mt-0.5">{claim.offer?.discount}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant={claim.redeemed ? "secondary" : "default"} className="text-xs">
                          {claim.redeemed ? "Redeemed" : "Active"}
                        </Badge>
                        <span className="text-xs text-ink-muted font-mono">{claim.claimCode}</span>
                      </div>
                    </div>
                    {!claim.redeemed && (
                      <div className="text-center">
                        <div className="bg-white p-2 rounded-lg border">
                          <div className="w-16 h-16 bg-ink/5 flex items-center justify-center text-[8px] font-mono text-ink break-all">
                            {claim.claimCode}
                          </div>
                        </div>
                        <p className="text-[10px] text-ink-muted mt-1">Show at venue</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
