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
import { LogOut, Shield, Check, Search, MessageCircle, FileText, Settings, Clock, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import type { Team, OfferClaim, Offer, User as UserType, Post } from "@shared/schema";

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin" />
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
    <div className="min-h-screen bg-paper">
      <div className="bg-ink text-paper px-4 pt-12 pb-8 text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight">HUDDLE HUB</h1>
        <p className="text-sm text-paper/70 mt-2">Find where fans watch the game</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4 pb-24">
        <Card className="p-6 rounded-3xl shadow-lg">
          <Tabs value={isLogin ? "login" : "register"} onValueChange={(v) => setIsLogin(v === "login")}>
            <TabsList className="w-full mb-5 rounded-full p-1">
              <TabsTrigger value="login" className="flex-1 rounded-full">Sign In</TabsTrigger>
              <TabsTrigger value="register" className="flex-1 rounded-full">Sign Up</TabsTrigger>
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-ink-muted">Favorite Team</Label>
                    <Select value={teamId} onValueChange={setTeamId}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Choose a team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams?.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <Button type="submit" className="w-full rounded-full" disabled={loading}>
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
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="bg-ink text-paper px-4 pt-10 pb-6">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Avatar className="w-16 h-16 ring-2 ring-paper/30">
            <AvatarFallback className="text-xl font-bold text-paper bg-ink/50">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-bold">{user.displayName}</h1>
              {user.isAdmin && (
                <Badge variant="secondary" className="text-[10px]">
                  <Shield className="w-3 h-3 mr-0.5" /> Admin
                </Badge>
              )}
            </div>
            <p className="text-sm text-paper/70">@{user.username}</p>
            <div className="flex items-center gap-2 mt-1">
              {team && <Badge variant="outline" className="text-[10px] text-paper/80 border-paper/30">{team.name}</Badge>}
              <span className="text-xs text-paper/60">{postCount} posts</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-24 space-y-3 mt-4">
        {/* Quick links */}
        <Card className="border-cream">
          <div className="divide-y divide-cream">
            <Link href="/messages">
              <button className="w-full flex items-center justify-between p-4 hover:bg-cream/50 transition-colors">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-ink-muted" />
                  <span className="text-sm font-medium text-ink">Messages</span>
                </div>
                <div className="flex items-center gap-2">
                  {unread && unread.count > 0 && (
                    <Badge className="text-[10px] px-1.5">{unread.count}</Badge>
                  )}
                  <ChevronRight className="w-4 h-4 text-ink-muted" />
                </div>
              </button>
            </Link>
            {user.isAdmin && (
              <Link href="/admin">
                <button className="w-full flex items-center justify-between p-4 hover:bg-cream/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-ink-muted" />
                    <span className="text-sm font-medium text-ink">Admin Dashboard</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-muted" />
                </button>
              </Link>
            )}
          </div>
        </Card>

        {/* Admin Redeem */}
        {user.isAdmin && <RedeemSection />}

        {/* Claimed offers */}
        {claims && claims.length > 0 && (
          <section>
            <h2 className="font-display text-sm font-bold text-ink-muted uppercase tracking-wider mb-2 mt-4">My Claims</h2>
            <div className="space-y-2">
              {claims.map((claim) => (
                <Card key={claim.id} className="border-cream">
                  <div className="p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{claim.offer.title}</p>
                      <p className="text-xs text-muted-foreground">{claim.offer.discount}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <code className="text-xs font-mono bg-cream px-2 py-1 rounded">{claim.claimCode}</code>
                      <Badge variant={claim.redeemed ? "secondary" : "outline"} className="text-[10px]">
                        {claim.redeemed ? "Redeemed" : "Active"}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Sign out */}
        <Button
          variant="outline"
          className="w-full rounded-full text-destructive hover:text-destructive mt-4"
          onClick={logout}
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
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
    <Card className="border-cream p-4">
      <h3 className="font-semibold text-sm mb-3 text-ink flex items-center gap-2">
        <Shield className="w-4 h-4 text-red" /> Redeem Offer (Admin)
      </h3>
      <div className="flex items-center gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter claim code"
          className="font-mono text-sm"
        />
        <Button size="sm" onClick={handleSearch} disabled={searching || !code.trim()}>
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {claimData && (
        <div className="mt-3 p-3 bg-cream/50 rounded-xl space-y-1.5">
          <p className="text-sm font-medium text-ink">{claimData.offer.title}</p>
          <p className="text-xs text-ink-muted">By: {claimData.user.displayName}</p>
          <p className="text-xs text-ink-muted">Discount: {claimData.offer.discount}</p>
          {claimData.redeemed ? (
            <Badge variant="secondary" className="text-xs">
              <Check className="w-3 h-3 mr-1" /> Already Redeemed
            </Badge>
          ) : (
            <Button size="sm" className="w-full rounded-full mt-2" onClick={handleRedeem} disabled={redeeming}>
              {redeeming ? "Redeeming..." : "Redeem Now"}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
