import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Shield, Check, Search } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Team, OfferClaim, Offer, User as UserType } from "@shared/schema";

export default function ProfilePage() {
  const { user, isLoading: authLoading, login, register, logout } = useAuth();

  if (authLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-4 pb-20 space-y-4">
        <Skeleton className="h-32 w-full rounded-md" />
        <Skeleton className="h-20 w-full rounded-md" />
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
    <div className="max-w-lg mx-auto px-4 py-8 pb-20">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold" data-testid="text-auth-title">TheHuddle</h1>
        <p className="text-sm text-muted-foreground mt-1">Your sports fan community</p>
      </div>

      <Card className="p-6">
        <Tabs value={isLogin ? "login" : "register"} onValueChange={(v) => setIsLogin(v === "login")}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="login" className="flex-1" data-testid="tab-login">Sign In</TabsTrigger>
            <TabsTrigger value="register" className="flex-1" data-testid="tab-register">Sign Up</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                data-testid="input-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                data-testid="input-password"
              />
            </div>

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                    data-testid="input-display-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Favorite Team</Label>
                  <Select value={teamId} onValueChange={setTeamId}>
                    <SelectTrigger data-testid="select-team">
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
              <p className="text-xs text-muted-foreground text-center mt-2">
                Demo accounts: alex_fan, sam_sports, casey_mod (password: demo123)
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
  const { toast } = useToast();

  const { data: teams } = useQuery<Team[]>({ queryKey: ["/api/teams"] });
  const { data: claims } = useQuery<(OfferClaim & { offer: Offer })[]>({
    queryKey: ["/api/claims"],
  });

  if (!user) return null;
  const team = teams?.find((t) => t.id === user.teamId);
  const initials = user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase();

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-20">
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarFallback
              className="text-xl font-bold text-white"
              style={{ backgroundColor: team?.color || "#6B7280" }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-lg font-bold" data-testid="text-profile-name">{user.displayName}</h2>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            <div className="flex items-center gap-2 mt-1">
              {team && (
                <Badge variant="secondary" className="text-xs">
                  <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: team.color }} />
                  {team.name}
                </Badge>
              )}
              {user.isAdmin && (
                <Badge variant="default" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={logout}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </Card>

      {user.isAdmin && <RedeemSection />}

      {claims && claims.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-3" data-testid="text-my-offers">My Claimed Offers</h3>
          <div className="space-y-2">
            {claims.map((claim) => (
              <Card key={claim.id} className="p-3" data-testid={`card-profile-claim-${claim.id}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{claim.offer.title}</p>
                    <p className="text-xs text-muted-foreground">{claim.offer.discount}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{claim.claimCode}</code>
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
    <Card className="p-4 mt-6">
      <h3 className="font-semibold mb-3 flex items-center gap-2" data-testid="text-redeem-section">
        <Shield className="w-4 h-4" />
        Redeem Offer (Admin)
      </h3>
      <div className="flex items-center gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter claim code"
          className="font-mono"
          data-testid="input-redeem-code"
        />
        <Button onClick={handleSearch} disabled={searching || !code.trim()} data-testid="button-search-code">
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {claimData && (
        <div className="mt-4 p-3 bg-muted rounded-md space-y-2">
          <p className="text-sm font-medium">{claimData.offer.title}</p>
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
