import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";
import HomePage from "@/pages/home";
import DiscoverPage from "@/pages/discover";
import EventsPage from "@/pages/events";
import FifaPage from "@/pages/fifa";
import OffersPage from "@/pages/offers";
import ProfilePage from "@/pages/profile";
import UserProfilePage from "@/pages/user-profile";
import VenueProfilePage from "@/pages/venue-profile";
import MessagesPage from "@/pages/messages";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/discover" component={DiscoverPage} />
      <Route path="/events" component={EventsPage} />
      <Route path="/events/:id" component={EventsPage} />
      <Route path="/worldcup" component={FifaPage} />
      <Route path="/offers" component={OffersPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/users/:id" component={UserProfilePage} />
      <Route path="/venues/:id" component={VenueProfilePage} />
      <Route path="/messages" component={MessagesPage} />
      <Route path="/messages/:userId" component={MessagesPage} />
      <Route path="/admin" component={AdminPage} />
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
            <main className="relative pb-20 md:pb-0 md:pt-14">
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
