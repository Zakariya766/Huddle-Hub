import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Users, FileText, MapPin, Calendar, Ticket, AlertTriangle, MessageCircle, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { User, Report } from "@shared/schema";

type AdminStats = {
  users: number;
  posts: number;
  venues: number;
  events: number;
  offers: number;
  claims: number;
  reports: number;
  rooms: number;
};

export default function AdminPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"overview" | "users" | "reports">("overview");

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-xl font-bold text-ink mb-2">Admin Access Required</h2>
          <p className="text-sm text-ink-muted">You must be an admin to view this page.</p>
          <Link href="/">
            <Button className="mt-4 rounded-full">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: allUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: tab === "users",
  });

  const { data: reports } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
    enabled: tab === "reports",
  });

  const handleReportStatus = async (id: string, status: string) => {
    try {
      await apiRequest("PATCH", `/api/reports/${id}`, { status });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({ title: `Report ${status}` });
    } catch {
      toast({ title: "Failed to update report", variant: "destructive" });
    }
  };

  const handleToggleAdmin = async (userId: string, currentAdmin: boolean) => {
    try {
      await apiRequest("PATCH", `/api/admin/users/${userId}`, { isAdmin: !currentAdmin });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: `Admin status ${!currentAdmin ? "granted" : "revoked"}` });
    } catch {
      toast({ title: "Failed to update user", variant: "destructive" });
    }
  };

  const statCards = stats ? [
    { label: "Users", value: stats.users, icon: Users },
    { label: "Posts", value: stats.posts, icon: FileText },
    { label: "Venues", value: stats.venues, icon: MapPin },
    { label: "Events", value: stats.events, icon: Calendar },
    { label: "Offers", value: stats.offers, icon: Ticket },
    { label: "Claims", value: stats.claims, icon: Ticket },
    { label: "Reports", value: stats.reports, icon: AlertTriangle },
    { label: "Rooms", value: stats.rooms, icon: MessageCircle },
  ] : [];

  return (
    <div className="min-h-screen bg-paper">
      <div className="bg-ink text-paper px-4 pt-10 pb-4">
        <div className="max-w-lg mx-auto">
          <Link href="/profile">
            <button className="flex items-center gap-1 text-sm text-paper/70 hover:text-paper mb-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </Link>
          <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-24">
        {/* Tabs */}
        <div className="flex gap-1 mt-4 mb-4 bg-cream rounded-full p-1">
          {(["overview", "users", "reports"] as const).map(t => (
            <Button
              key={t}
              size="sm"
              variant={tab === t ? "default" : "ghost"}
              className="flex-1 rounded-full text-xs h-8 capitalize"
              onClick={() => setTab(t)}
            >
              {t}
            </Button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="grid grid-cols-2 gap-2">
            {statCards.map(({ label, value, icon: Icon }) => (
              <Card key={label} className="border-cream">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-ink-muted" />
                    <div>
                      <p className="text-lg font-bold text-ink">{value}</p>
                      <p className="text-xs text-ink-muted">{label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {tab === "users" && (
          <div className="space-y-2">
            {allUsers?.map(u => (
              <Card key={u.id} className="border-cream">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-ink/10 flex items-center justify-center text-xs font-bold text-ink">
                        {u.displayName?.[0] || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink">{u.displayName}</p>
                        <p className="text-xs text-ink-muted">@{u.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {u.isAdmin && <Badge className="text-[10px]">Admin</Badge>}
                      {u.id !== user.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[10px] h-6 px-2"
                          onClick={() => handleToggleAdmin(u.id, u.isAdmin || false)}
                        >
                          {u.isAdmin ? "Remove Admin" : "Make Admin"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {tab === "reports" && (
          <div className="space-y-2">
            {(!reports || reports.length === 0) && (
              <p className="text-sm text-ink-muted text-center py-8">No reports.</p>
            )}
            {reports?.map(report => (
              <Card key={report.id} className="border-cream">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="outline" className="text-[10px] mb-1 capitalize">{report.targetType}</Badge>
                      <p className="text-sm text-ink">{report.reason}</p>
                      <p className="text-xs text-ink-muted mt-1">
                        {report.createdAt && format(new Date(report.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={report.status === "pending" ? "destructive" : "secondary"} className="text-[10px] capitalize">
                        {report.status}
                      </Badge>
                      {report.status === "pending" && (
                        <div className="flex gap-1 ml-2">
                          <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => handleReportStatus(report.id, "resolved")}>
                            Resolve
                          </Button>
                          <Button size="sm" variant="ghost" className="text-[10px] h-6 px-2" onClick={() => handleReportStatus(report.id, "dismissed")}>
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </div>
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
