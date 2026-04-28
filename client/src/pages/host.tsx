import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Globe, Lock, Sparkles, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Sport, Venue } from "@shared/schema";

const EVENT_TYPES = [
  { id: "watch-party", label: "Watch Party" },
  { id: "meetup", label: "Meetup" },
  { id: "tailgate", label: "Tailgate" },
  { id: "bar-special", label: "Bar Special" },
  { id: "other", label: "Other" },
];

const CATEGORIES = ["Bar", "Pub", "Restaurant", "Lounge", "Beer Garden", "Pizzeria"];

function nowLocalISO(offsetHours = 2) {
  const d = new Date(Date.now() + offsetHours * 3600 * 1000);
  d.setMinutes(0, 0, 0);
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function HostPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: sports } = useQuery<Sport[]>({ queryKey: ["/api/sports"] });
  const { data: venues } = useQuery<Venue[]>({ queryKey: ["/api/venues"] });
  const { data: business, refetch: refetchBusiness } = useQuery<{ venue: Venue }>({
    queryKey: ["/api/business/me"],
    queryFn: async () => {
      const res = await fetch("/api/business/me", { credentials: "include" });
      if (!res.ok) return null as any;
      return res.json();
    },
    enabled: !!user,
  });

  if (isLoading) return <div className="p-8 text-center text-ink-muted">Loading…</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-paper">
        <BackBar />
        <div className="max-w-md mx-auto px-5 pt-16 text-center">
          <h1 className="font-headline text-4xl text-ink mb-3">Host an event</h1>
          <p className="text-ink-muted mb-6">Sign in to create your watch party or set up your business.</p>
          <Link href="/profile">
            <Button className="rounded-full px-6">Sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper pb-24">
      <BackBar />
      <div className="max-w-3xl mx-auto px-5 md:px-8 pt-6 md:pt-10">
        <div className="text-xs uppercase tracking-widest text-ink-muted mb-2">Create</div>
        <h1 className="font-headline text-4xl md:text-5xl text-ink leading-[0.95] mb-2">Host an event</h1>
        <p className="text-ink-muted mb-6">
          Throw a watch party for your crew, or host one as your business.
        </p>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-md mb-6">
            <TabsTrigger value="personal" className="gap-2"><Users className="w-4 h-4" /> Personal</TabsTrigger>
            <TabsTrigger value="business" className="gap-2"><Building2 className="w-4 h-4" /> Business</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <PersonalEventForm
              sports={sports ?? []}
              venues={venues ?? []}
              onCreated={(ev) => {
                toast({ title: "Watch party created!" });
                setLocation(ev.venueId ? `/venues/${ev.venueId}` : "/events");
              }}
            />
          </TabsContent>

          <TabsContent value="business">
            {!business?.venue ? (
              <BusinessSetupForm onSetUp={async () => { await refetchBusiness(); toast({ title: "Business created!" }); }} />
            ) : (
              <BusinessEventForm
                venue={business.venue}
                sports={sports ?? []}
                onCreated={(ev) => {
                  toast({ title: "Event posted to your business!" });
                  setLocation(`/venues/${business.venue.id}`);
                }}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function BackBar() {
  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 pt-6">
      <button
        onClick={() => (window.history.length > 1 ? window.history.back() : (window.location.href = "/"))}
        className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
    </div>
  );
}

interface PersonalFormProps {
  sports: Sport[];
  venues: Venue[];
  onCreated: (ev: { id: string; venueId: string | null }) => void;
}

function PersonalEventForm({ sports, venues, onCreated }: PersonalFormProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [sportId, setSportId] = useState<string>("");
  const [venueId, setVenueId] = useState<string>("none");
  const [date, setDate] = useState<string>(nowLocalISO(3));
  const [isPublic, setIsPublic] = useState(true);
  const [eventType, setEventType] = useState("watch-party");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const sortedVenues = useMemo(() => [...venues].sort((a, b) => a.name.localeCompare(b.name)), [venues]);

  const submit = async () => {
    if (!title.trim()) { toast({ title: "Give it a title", variant: "destructive" }); return; }
    if (!date) { toast({ title: "Pick a date", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/events", {
        title: title.trim(),
        description: description.trim() || null,
        date: new Date(date).toISOString(),
        sportId: sportId || null,
        venueId: venueId === "none" ? null : venueId,
        eventType,
        isPublic,
      });
      const ev = await res.json();
      onCreated(ev);
    } catch (e: any) {
      toast({ title: "Failed to create event", description: String(e?.message ?? e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-cream">
      <CardContent className="p-5 md:p-6 space-y-5">
        <Field label="Title">
          <Input placeholder="Lakers Game 5 Watch — my place!" value={title} onChange={e => setTitle(e.target.value)} />
        </Field>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Sport">
            <Select value={sportId} onValueChange={setSportId}>
              <SelectTrigger><SelectValue placeholder="Pick a sport" /></SelectTrigger>
              <SelectContent>
                {sports.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Type">
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Date & time">
            <Input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} />
          </Field>
          <Field label="Venue (optional)">
            <Select value={venueId} onValueChange={setVenueId}>
              <SelectTrigger><SelectValue placeholder="Pick a venue or leave blank" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No venue (private spot)</SelectItem>
                {sortedVenues.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Description">
          <Textarea
            placeholder="What's the vibe? Who's invited? Anything to bring?"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="min-h-[88px]"
          />
        </Field>

        <div className="flex items-center justify-between rounded-xl border border-cream px-4 py-3">
          <div className="flex items-center gap-3">
            {isPublic ? <Globe className="w-5 h-5 text-turf" /> : <Lock className="w-5 h-5 text-ink" />}
            <div>
              <div className="font-medium text-sm text-ink">{isPublic ? "Public" : "Private"}</div>
              <div className="text-xs text-ink-muted">
                {isPublic ? "Anyone in LA can see and RSVP" : "Only people with the link can join"}
              </div>
            </div>
          </div>
          <Switch checked={isPublic} onCheckedChange={setIsPublic} />
        </div>

        <Button onClick={submit} disabled={submitting} className="w-full rounded-full h-11">
          <Sparkles className="w-4 h-4 mr-2" />
          {submitting ? "Posting…" : "Post watch party"}
        </Button>
      </CardContent>
    </Card>
  );
}

function BusinessSetupForm({ onSetUp }: { onSetUp: () => Promise<void> }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [category, setCategory] = useState("Bar");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!name.trim()) { toast({ title: "Business name is required", variant: "destructive" }); return; }
    if (!address.trim()) { toast({ title: "Address is required", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/business/setup", {
        name: name.trim(),
        address: address.trim(),
        neighborhood: neighborhood.trim() || null,
        category,
        website: website.trim() || null,
        phone: phone.trim() || null,
        description: description.trim() || null,
      });
      await onSetUp();
    } catch (e: any) {
      toast({ title: "Setup failed", description: String(e?.message ?? e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-cream">
      <CardContent className="p-5 md:p-6 space-y-5">
        <div className="rounded-xl bg-cream/40 px-4 py-3 text-sm text-ink-muted">
          <Building2 className="inline w-4 h-4 mr-1.5 -mt-0.5" />
          Set up your business once. After that you can post game-day events and offers from your dashboard.
        </div>

        <Field label="Business name">
          <Input placeholder="Tom's Watch Bar" value={name} onChange={e => setName(e.target.value)} />
        </Field>
        <Field label="Address">
          <Input placeholder="1011 S Figueroa St, Los Angeles, CA 90015" value={address} onChange={e => setAddress(e.target.value)} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Neighborhood">
            <Input placeholder="Downtown" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} />
          </Field>
          <Field label="Category">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Website">
            <Input placeholder="https://" value={website} onChange={e => setWebsite(e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input placeholder="(323) 555-0100" value={phone} onChange={e => setPhone(e.target.value)} />
          </Field>
        </div>
        <Field label="About">
          <Textarea placeholder="A short description of your bar / restaurant." value={description} onChange={e => setDescription(e.target.value)} className="min-h-[80px]" />
        </Field>

        <Button onClick={submit} disabled={submitting} className="w-full rounded-full h-11">
          {submitting ? "Creating…" : "Create business"}
        </Button>
      </CardContent>
    </Card>
  );
}

interface BusinessEventFormProps {
  venue: Venue;
  sports: Sport[];
  onCreated: (ev: { id: string; venueId: string | null }) => void;
}

function BusinessEventForm({ venue, sports, onCreated }: BusinessEventFormProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [sportId, setSportId] = useState<string>("");
  const [date, setDate] = useState<string>(nowLocalISO(3));
  const [eventType, setEventType] = useState("watch-party");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!title.trim()) { toast({ title: "Give it a title", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/events", {
        title: title.trim(),
        description: description.trim() || null,
        date: new Date(date).toISOString(),
        sportId: sportId || null,
        venueId: venue.id,
        eventType,
        isPublic: true, // business events are always public
      });
      const ev = await res.json();
      onCreated(ev);
    } catch (e: any) {
      toast({ title: "Failed to create event", description: String(e?.message ?? e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-cream">
        <CardContent className="p-4 flex items-center gap-3">
          <Building2 className="w-5 h-5 text-turf" />
          <div>
            <div className="text-xs uppercase tracking-widest text-ink-muted">Posting as</div>
            <div className="font-headline text-xl text-ink">{venue.name}</div>
            <div className="text-xs text-ink-muted">{venue.address}</div>
          </div>
          <Link href="/business" className="ml-auto">
            <Button variant="outline" size="sm" className="rounded-full text-xs">Manage</Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="border-cream">
        <CardContent className="p-5 md:p-6 space-y-5">
          <Field label="Title">
            <Input placeholder="Sunday NFL — All-Day Pitchers Special" value={title} onChange={e => setTitle(e.target.value)} />
          </Field>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Sport">
              <Select value={sportId} onValueChange={setSportId}>
                <SelectTrigger><SelectValue placeholder="Pick a sport" /></SelectTrigger>
                <SelectContent>
                  {sports.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Type">
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Date & time">
            <Input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} />
          </Field>

          <Field label="Description">
            <Textarea
              placeholder="What are you putting on? Specials, kickoff times, dress code, etc."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="min-h-[88px]"
            />
          </Field>

          <Button onClick={submit} disabled={submitting} className="w-full rounded-full h-11">
            <Sparkles className="w-4 h-4 mr-2" />
            {submitting ? "Posting…" : "Post event"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-widest text-ink-muted">{label}</Label>
      {children}
    </div>
  );
}
