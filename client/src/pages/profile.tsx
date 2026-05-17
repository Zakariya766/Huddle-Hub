import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Shield, Check, Search, MessageCircle, Settings, ChevronRight, Heart, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { EventCard, type EventWithRelations } from "@/components/event-card";
import { VenueImage } from "@/components/venue-image";
import type { Team, OfferClaim, Offer, User as UserType, Venue } from "@shared/schema";

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthForm />;
  return <UserProfile />;
}

/* ───────────────── AUTH ───────────────── */
function AuthForm() {
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: teams } = useQuery<Team[]>({ queryKey: ["/api/teams"] });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) await login(username, password);
      else await register(username, password, displayName || username, teamId || undefined);
      queryClient.invalidateQueries();
    } catch (err: any) {
      toast({ title: err.message || "Authentication failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-xl mx-auto px-5 md:px-8 pt-10 md:pt-16 pb-24">
        <div className="mb-8">
          <div className="text-xs font-medium text-ink-muted uppercase tracking-widest mb-3">Welcome</div>
          <h1 className="font-headline text-[clamp(2.25rem,7vw,3.75rem)] text-ink leading-[0.95]">
            {isLogin ? "Sign in." : "Join the huddle."}
          </h1>
          <p className="text-sm text-ink-muted mt-3">
            {isLogin
              ? "Your events and favorite spots, back in one tap."
              : "Pick your team, RSVP to watch parties, follow your spots."}
          </p>
        </div>

        <Tabs value={isLogin ? "login" : "register"} onValueChange={v => setIsLogin(v === "login")}>
          <TabsList className="w-full mb-6 rounded-full p-1 border border-cream bg-paper">
            <TabsTrigger value="login" className="flex-1 rounded-full">Sign In</TabsTrigger>
            <TabsTrigger value="register" className="flex-1 rounded-full">Sign Up</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-medium text-ink-muted">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="alex_fan"
                className="rounded-full h-12 px-5"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-ink-muted">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-full h-12 px-5"
                required
              />
            </div>

            {!isLogin && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="displayName" className="text-xs font-medium text-ink-muted">Display name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="rounded-full h-12 px-5"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-ink-muted">Favorite team</Label>
                  <Select value={teamId} onValueChange={setTeamId}>
                    <SelectTrigger className="rounded-full h-12 px-5">
                      <SelectValue placeholder="Pick one" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams?.map(team => (
                        <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button type="submit" className="w-full rounded-full h-12 text-base" disabled={loading}>
              {loading ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
            </Button>

            {isLogin && (
              <p className="text-xs text-ink-muted text-center mt-3">
                Demo: <span className="font-mono">alex_fan</span> / <span className="font-mono">demo123</span>
              </p>
            )}
          </form>
        </Tabs>
      </div>
    </div>
  );
}

/* ───────────────── PROFILE ───────────────── */
function UserProfile() {
  const { user, logout } = useAuth();

  const { data: teams } = useQuery<Team[]>({ queryKey: ["/api/teams"] });
  const { data: claims } = useQuery<(OfferClaim & { offer: Offer })[]>({
    queryKey: ["/api/claims"],
  });
  const { data: myEvents } = useQuery<EventWithRelations[]>({
    queryKey: ["/api/me/events"],
    queryFn: async () => {
      const res = await fetch("/api/me/events", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });
  const { data: followedVenues } = useQuery<Venue[]>({
    queryKey: ["/api/me/followed-venues"],
    queryFn: async () => {
      const res = await fetch("/api/me/followed-venues", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });
  const { data: unread } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
    enabled: !!user,
    refetchInterval: 10000,
  });

  if (!user) return null;
  const team = teams?.find(t => t.id === user.teamId);
  const initials = user.displayName.split(" ").map(n => n[0]).join("").toUpperCase();

  const upcoming = (myEvents ?? [])
    .filter(e => new Date(e.date).getTime() > Date.now())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const stats = [
    { label: "Events", value: myEvents?.length ?? 0 },
    { label: "Following", value: followedVenues?.length ?? 0 },
    { label: "Upcoming", value: upcoming.length },
  ];

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-4xl mx-auto px-5 md:px-8 pt-8 md:pt-14 pb-24">
        {/* Header */}
        <div className="flex items-start gap-5 mb-8">
          <Avatar className="w-20 h-20 md:w-24 md:h-24 ring-2 ring-cream">
            <AvatarFallback className="text-2xl font-semibold text-ink bg-cream">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 pt-1">
            <div className="text-xs font-medium text-ink-muted uppercase tracking-widest mb-2">
              @{user.username}
              {user.isAdmin && (
                <Badge variant="secondary" className="ml-2 text-[10px]">
                  <Shield className="w-3 h-3 mr-0.5" /> Admin
                </Badge>
              )}
            </div>
            <h1 className="font-headline text-3xl md:text-5xl text-ink leading-[0.95]">
              {user.displayName}
            </h1>
            {team && (
              <div className="mt-3">
                <Badge variant="outline" className="rounded-full text-xs border-ink/20">
                  Fan of {team.name}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {stats.map(s => (
            <div key={s.label} className="rounded-2xl border border-cream px-4 py-4 text-center">
              <div className="font-headline text-3xl text-ink">{s.value}</div>
              <div className="text-[11px] font-medium text-ink-muted uppercase tracking-wider mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick links card */}
        <div className="rounded-3xl border border-cream overflow-hidden mb-10">
          <div className="divide-y divide-cream">
            <Link href="/messages">
              <button className="w-full flex items-center justify-between p-4 hover:bg-cream/40 transition-colors">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-ink-muted" />
                  <span className="text-sm font-medium text-ink">Messages</span>
                </div>
                <div className="flex items-center gap-2">
                  {unread && unread.count > 0 && (
                    <Badge className="text-[10px] px-1.5 rounded-full">{unread.count}</Badge>
                  )}
                  <ChevronRight className="w-4 h-4 text-ink-muted" />
                </div>
              </button>
            </Link>
            <Link href="/events">
              <button className="w-full flex items-center justify-between p-4 hover:bg-cream/40 transition-colors">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-ink-muted" />
                  <span className="text-sm font-medium text-ink">My Events</span>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-muted" />
              </button>
            </Link>
            {user.isAdmin && (
              <Link href="/admin">
                <button className="w-full flex items-center justify-between p-4 hover:bg-cream/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-ink-muted" />
                    <span className="text-sm font-medium text-ink">Admin Dashboard</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-muted" />
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Following venues */}
        {followedVenues && followedVenues.length > 0 && (
          <section className="mb-10">
            <div className="flex items-end justify-between mb-4">
              <h2 className="font-headline text-2xl text-ink flex items-center gap-2">
                <Heart className="w-5 h-5 text-red fill-current" /> Following
              </h2>
            </div>
            <div className="flex gap-4 overflow-x-auto -mx-5 md:-mx-8 px-5 md:px-8 pb-2 scrollbar-none">
              {followedVenues.map(v => (
                <Link key={v.id} href={`/venues/${v.id}`}>
                  <div className="group shrink-0 w-[200px] cursor-pointer">
                    <VenueImage src={v.imageUrl} name={v.name} seed={v.id} aspect="aspect-[4/3]" rounded="rounded-2xl" />
                    <div className="mt-2">
                      <p className="font-semibold text-sm text-ink truncate">{v.name}</p>
                      {v.neighborhood && (
                        <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {v.neighborhood}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming events */}
        {upcoming.length > 0 && (
          <section className="mb-10">
            <div className="flex items-end justify-between mb-4">
              <h2 className="font-headline text-2xl text-ink">Your Next Events</h2>
              <Link href="/events">
                <span className="text-sm text-ink-muted hover:text-ink cursor-pointer">See all →</span>
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto -mx-5 md:-mx-8 px-5 md:px-8 pb-2 scrollbar-none">
              {upcoming.slice(0, 6).map(e => (
                <EventCard key={e.id} event={e} variant="compact" />
              ))}
            </div>
          </section>
        )}

        {/* Claimed offers */}
        {claims && claims.length > 0 && (
          <section className="mb-10">
            <h2 className="font-headline text-2xl text-ink mb-4">Your Offers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {claims.map(claim => (
                <div key={claim.id} className="rounded-2xl border border-cream p-4 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{claim.offer.title}</p>
                    <p className="text-xs text-ink-muted">{claim.offer.discount}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <code className="text-xs font-mono bg-cream px-2 py-1 rounded-full">{claim.claimCode}</code>
                    <Badge variant={claim.redeemed ? "secondary" : "outline"} className="text-[10px] rounded-full">
                      {claim.redeemed ? "Redeemed" : "Active"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Admin Redeem */}
        {user.isAdmin && <RedeemSection />}

        {/* Sign out */}
        <Button
          variant="outline"
          className="w-full rounded-full h-11 text-destructive hover:text-destructive mt-6"
          onClick={logout}
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign out
        </Button>
      </div>
    </div>
  );
}

/* ───────────────── ADMIN REDEEM ───────────────── */
function RedeemSection() {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [claimData, setClaimData] = useState<(OfferClaim & { offer: Offer; user: UserType }) | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  const handleSearch = async () => {
    if (!code.trim()) return;
    setSearching(true);
    setClaimData(null);
    try {
      const res = await fetch(`/api/claims/code/${code.trim()}`, { credentials: "include" });
      if (!res.ok) { toast({ title: "Claim code not found", variant: "destructive" }); return; }
      setClaimData(await res.json());
    } catch {
      toast({ title: "Error looking up code", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const handleRedeem = async () => {
    if (!claimData) return;
    setRedeeming(true);
    try {
      await apiRequest("POST", `/api/claims/${claimData.id}/redeem`);
      toast({ title: "Offer redeemed!" });
      setClaimData({ ...claimData, redeemed: true, redeemedAt: new Date() });
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
    } catch {
      toast({ title: "Failed to redeem", variant: "destructive" });
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="rounded-3xl border border-cream p-5 mb-6">
      <h3 className="font-headline text-xl text-ink mb-3 flex items-center gap-2">
        <Shield className="w-4 h-4 text-red" /> Redeem Offer
      </h3>
      <div className="flex items-center gap-2">
        <Input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="Enter claim code"
          className="font-mono text-sm rounded-full h-11 px-5"
        />
        <Button size="sm" className="rounded-full h-11 w-11 p-0" onClick={handleSearch} disabled={searching || !code.trim()}>
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {claimData && (
        <div className="mt-4 p-4 bg-cream/60 rounded-2xl space-y-1.5">
          <p className="text-sm font-semibold text-ink">{claimData.offer.title}</p>
          <p className="text-xs text-ink-muted">By: {claimData.user.displayName}</p>
          <p className="text-xs text-ink-muted">Discount: {claimData.offer.discount}</p>
          {claimData.redeemed ? (
            <Badge variant="secondary" className="text-xs">
              <Check className="w-3 h-3 mr-1" /> Already redeemed
            </Badge>
          ) : (
            <Button size="sm" className="w-full rounded-full mt-2" onClick={handleRedeem} disabled={redeeming}>
              {redeeming ? "Redeeming…" : "Redeem now"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
