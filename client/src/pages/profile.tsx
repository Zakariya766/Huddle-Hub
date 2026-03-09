import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Shield, Check, Search, MessageCircle, FileText } from "lucide-react";
import { LogoWordmark } from "@/components/brand/LogoWordmark";
import { IconWhistle } from "@/components/brand/icons";
import { LoadingSpinner } from "@/components/brand/LoadingSpinner";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Team, OfferClaim, Offer, User as UserType, Post } from "@shared/schema";

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!user) return <AuthForm />;

  return <UserProfile />;
}

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
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, password, displayName || username, teamId || undefined);
      }
      queryClient.invalidateQueries();
    } catch (err: any) {
      toast({ title: err.message || "Authentication failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative max-w-lg mx-auto px-4 pt-8 pb-20">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-[0.08]"
          src="/loops/loop_stadium_bokeh_1280x720.mp4"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      <div className="text-center mb-8 pt-4">
        <LogoWordmark size="lg" className="justify-center" />
        <p className="text-sm text-muted-foreground mt-3">Your sports fan community</p>
      </div>

      <Card className="p-6 rounded-3xl shadow-lg">
        <Tabs value={isLogin ? "login" : "register"} onValueChange={(v) => setIsLogin(v === "login")}>
          <TabsList className="w-full mb-5 rounded-full p-1">
            <TabsTrigger value="login" className="flex-1 rounded-full" data-testid="tab-login">Sign In</TabsTrigger>
            <TabsTrigger value="register" className="flex-1 rounded-full" data-testid="tab-register">Sign Up</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-medium text-ink-muted">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="rounded-xl"
                required
                data-testid="input-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium text-ink-muted">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="rounded-xl"
                required
                data-testid="input-password"
              />
            </div>

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-xs font-medium text-ink-muted">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                    className="rounded-xl"
                    data-testid="input-display-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-ink-muted">Favorite Team</Label>
                  <Select value={teamId} onValueChange={setTeamId}>
                    <SelectTrigger className="rounded-xl" data-testid="select-team">
                      <SelectValue placeholder="Choose a team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams?.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                            {team.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading} data-testid="button-auth-submit">
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </Button>

            {isLogin && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                Demo: alex_fan, sam_sports, casey_mod (password: demo123)
              </p>
            )}
          </form>
        </Tabs>
      </Card>
    </div>
  );
}

function UserProfile() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const { data: teams } = useQuery<Team[]>({ queryKey: ["/api/teams"] });
  const { data: claims } = useQuery<(OfferClaim & { offer: Offer })[]>({
    queryKey: ["/api/claims"],
  });
  const { data: allPosts } = useQuery<(Post & { user: UserType; likeCount: number; commentCount: number })[]>({
    queryKey: ["/api/posts"],
  });
  const { data: unread } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
    enabled: !!user,
    refetchInterval: 10000,
  });

  if (!user) return null;
  const team = teams?.find((t) => t.id === user.teamId);
  const initials = user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase();
  const postCount = allPosts?.filter((p) => p.userId === user.id).length || 0;

  return (
    <div className="max-w-lg mx-auto pb-20">
      {/* Banner */}
      <div
        className="h-36 w-full relative"
        style={{
          background: team?.color
            ? `linear-gradient(135deg, ${team.color}, ${team.color}88, ${team.color}44)`
            : "linear-gradient(135deg, hsl(var(--navy)), hsl(var(--navy) / 0.6), hsl(var(--navy) / 0.3))",
        }}
      />

      {/* Profile card overlapping banner */}
      <div className="px-4 -mt-14">
        <Card className="rounded-3xl overflow-visible">
          {/* Avatar section */}
          <div className="px-5 -mt-10">
            <Avatar className="w-24 h-24 ring-4 ring-background shadow-lg">
              <AvatarFallback
                className="text-2xl font-bold text-white"
                style={{ backgroundColor: team?.color || "#6B7280" }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Info */}
          <div className="px-5 pt-3 pb-5">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl text-ink" data-testid="text-profile-name">{user.displayName}</h2>
              {user.isAdmin && (
                <Badge variant="default" className="text-[10px]">
                  <Shield className="w-3 h-3 mr-0.5" />
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">@{user.username}</p>

            {/* Stats row */}
            <div className="flex items-center gap-3 mt-3">
              {team && (
                <Badge variant="secondary" className="text-xs">
                  <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: team.color }} />
                  {team.name}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                <FileText className="w-3 h-3 mr-1" />
                {postCount} posts
              </Badge>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/messages")}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Messages
                {unread && unread.count > 0 && (
                  <Badge className="ml-2 text-[10px] px-1.5 py-0 min-w-[18px] justify-center">
                    {unread.count}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-destructive hover:text-destructive"
                onClick={logout}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="px-4">
        {user.isAdmin && <RedeemSection />}

        {claims && claims.length > 0 && (
          <div className="mt-6">
            <div className="star-divider mb-4">My Claimed Offers</div>
            <div className="space-y-2">
              {claims.map((claim) => (
                <Card key={claim.id} className="p-4 rounded-3xl" data-testid={`card-profile-claim-${claim.id}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{claim.offer.title}</p>
                      <p className="text-xs text-muted-foreground">{claim.offer.discount}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <code className="text-xs font-mono bg-paper-deep px-2 py-1 rounded-lg">{claim.claimCode}</code>
                      {claim.redeemed ? (
                        <Badge variant="secondary" className="text-[10px]">
                          <Check className="w-3 h-3 mr-0.5" />
                          Redeemed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Active</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
      if (!res.ok) {
        toast({ title: "Claim code not found", variant: "destructive" });
        return;
      }
      const data = await res.json();
      setClaimData(data);
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
      toast({ title: "Offer redeemed successfully!" });
      setClaimData({ ...claimData, redeemed: true, redeemedAt: new Date() });
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
    } catch {
      toast({ title: "Failed to redeem", variant: "destructive" });
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <Card className="p-5 mt-6 rounded-3xl">
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-ink" data-testid="text-redeem-section">
        <IconWhistle size={20} className="text-red" />
        Redeem Offer (Admin)
      </h3>
      <div className="flex items-center gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter claim code"
          className="font-mono rounded-xl"
          data-testid="input-redeem-code"
        />
        <Button onClick={handleSearch} disabled={searching || !code.trim()} data-testid="button-search-code">
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {claimData && (
        <div className="mt-4 p-4 bg-paper-deep rounded-2xl space-y-2">
          <p className="text-sm font-medium text-ink">{claimData.offer.title}</p>
          <p className="text-xs text-muted-foreground">Claimed by: {claimData.user.displayName}</p>
          <p className="text-xs text-muted-foreground">Discount: {claimData.offer.discount}</p>
          {claimData.redeemed ? (
            <Badge variant="secondary">
              <Check className="w-3 h-3 mr-1" />
              Already Redeemed
            </Badge>
          ) : (
            <Button
              size="sm"
              className="w-full"
              onClick={handleRedeem}
              disabled={redeeming}
              data-testid="button-redeem-offer"
            >
              {redeeming ? "Redeeming..." : "Redeem Now"}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
