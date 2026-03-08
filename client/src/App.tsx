import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";
import FeedPage from "@/pages/feed";
import TeamsPage from "@/pages/teams";
import TeamHubPage from "@/pages/team-hub";
import DiscoverPage from "@/pages/discover";
import OffersPage from "@/pages/offers";
import ProfilePage from "@/pages/profile";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={FeedPage} />
      <Route path="/teams" component={TeamsPage} />
      <Route path="/teams/:id" component={TeamHubPage} />
      <Route path="/discover" component={DiscoverPage} />
      <Route path="/offers" component={OffersPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <div className="relative min-h-screen bg-background">
            <main className="relative pb-20">
              <Router />
            </main>
            <BottomNav />
          </div>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
