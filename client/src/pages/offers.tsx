import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tag, MapPin, Clock, Copy, Check, Ticket } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Offer, Venue, Team, OfferClaim } from "@shared/schema";

export default function OffersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [claimDialog, setClaimDialog] = useState<OfferClaim | null>(null);
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);

  const { data: offers, isLoading } = useQuery<(Offer & { venue?: Venue })[]>({
    queryKey: ["/api/offers"],
  });

  const { data: teams } = useQuery<Team[]>({ queryKey: ["/api/teams"] });

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

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-20">
      <h1 className="text-xl font-bold mb-4" data-testid="text-offers-title">Offers</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {offers?.map((offer) => {
            const team = teams?.find((t) => t.id === offer.teamId);
            const claimed = isAlreadyClaimed(offer.id);
            return (
              <Card key={offer.id} className="p-4" data-testid={`card-offer-${offer.id}`}>
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: team?.color || "#6B728022" }}
                  >
                    <Tag className="w-6 h-6" style={{ color: team?.color ? "#fff" : "#6B7280" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm" data-testid={`text-offer-title-${offer.id}`}>{offer.title}</h3>
                      <Badge variant="default" className="text-[10px]">{offer.discount}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{offer.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                      {offer.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {offer.venue.name}
                        </span>
                      )}
                      {offer.expiresAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expires {format(new Date(offer.expiresAt), "MMM d")}
                        </span>
                      )}
                    </div>
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
          {offers?.length === 0 && (
            <div className="text-center py-12">
              <Tag className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No offers available right now</p>
            </div>
          )}
        </div>
      )}

      {user && claims && claims.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3" data-testid="text-my-claims">My Claims</h2>
          <div className="space-y-2">
            {claims.map((claim) => (
              <Card key={claim.id} className="p-3" data-testid={`card-claim-${claim.id}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{claim.offer.title}</p>
                    <p className="text-xs text-muted-foreground">{claim.offer.discount}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded" data-testid={`text-claim-code-${claim.id}`}>
                      {claim.claimCode}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyCode(claim.claimCode)}
                      data-testid={`button-copy-code-${claim.id}`}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    {claim.redeemed && (
                      <Badge variant="secondary" className="text-[10px]">Redeemed</Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!claimDialog} onOpenChange={() => setClaimDialog(null)}>
        <DialogContent className="max-w-xs text-center">
          <DialogHeader>
            <DialogTitle>Offer Claimed!</DialogTitle>
            <DialogDescription>Show this code to redeem your offer</DialogDescription>
          </DialogHeader>
          {claimDialog && (
            <div className="py-4">
              <div className="bg-white rounded-md p-4 mb-4 flex flex-col items-center gap-3">
                <QRCodeSVG
                  value={claimDialog.claimCode}
                  size={160}
                  level="H"
                  data-testid="qr-code-claim"
                />
                <code className="text-2xl font-mono font-bold tracking-widest text-black" data-testid="text-claim-code-dialog">
                  {claimDialog.claimCode}
                </code>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => copyCode(claimDialog.claimCode)}
                data-testid="button-copy-claim-code"
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
