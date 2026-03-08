import { db } from "./db";
import { users, teams, posts, comments, likes, venues, events, offers } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  const existingTeams = await db.select().from(teams);
  if (existingTeams.length > 0) return;

  const teamData = [
    { id: "team-a", name: "Team Alpha", color: "#2563EB", description: "The blue powerhouse known for strategic gameplay and dedicated fans." },
    { id: "team-b", name: "Team Bravo", color: "#DC2626", description: "Fiery red competitors with a passionate community." },
    { id: "team-c", name: "Team Charlie", color: "#059669", description: "Green machines with a legacy of teamwork and grit." },
    { id: "team-d", name: "Team Delta", color: "#D97706", description: "The golden underdogs who always surprise the league." },
    { id: "team-e", name: "Team Echo", color: "#7C3AED", description: "Purple royalty with a fanbase that never sleeps." },
  ];
  await db.insert(teams).values(teamData);

  const userData = [
    { id: "user-1", username: "alex_fan", password: "demo123", displayName: "Alex Rivera", teamId: "team-a", isAdmin: false },
    { id: "user-2", username: "sam_sports", password: "demo123", displayName: "Sam Chen", teamId: "team-b", isAdmin: false },
    { id: "user-3", username: "jordan_hub", password: "demo123", displayName: "Jordan Taylor", teamId: "team-c", isAdmin: false },
    { id: "user-4", username: "casey_mod", password: "demo123", displayName: "Casey Morgan", teamId: "team-a", isAdmin: true },
    { id: "user-5", username: "riley_cheers", password: "demo123", displayName: "Riley Park", teamId: "team-e", isAdmin: false },
  ];
  await db.insert(users).values(userData);

  const now = new Date();
  const postData = [
    { id: "post-1", userId: "user-1", teamId: "team-a", content: "What an incredible match last night! Team Alpha really showed up in the second half. The defense was absolutely rock solid.", createdAt: new Date(now.getTime() - 3600000) },
    { id: "post-2", userId: "user-2", teamId: "team-b", content: "Just got my Team Bravo jersey for the new season. Cannot wait for the opener next week! Who else is going?", createdAt: new Date(now.getTime() - 7200000) },
    { id: "post-3", userId: "user-3", teamId: "team-c", content: "Spotted a great watch party at The Sideline Bar downtown. Amazing atmosphere and great drink specials during games!", createdAt: new Date(now.getTime() - 10800000) },
    { id: "post-4", userId: "user-5", teamId: "team-e", content: "Team Echo's new strategy is paying off big time. Three wins in a row! Purple reign continues.", createdAt: new Date(now.getTime() - 14400000) },
    { id: "post-5", userId: "user-4", teamId: "team-a", content: "Hosting a pre-game meetup at Central Sports Pub this Saturday at 4pm. All Team Alpha fans welcome. Appetizers on me!", createdAt: new Date(now.getTime() - 18000000) },
    { id: "post-6", userId: "user-1", content: "Hot take: this season has been the most competitive in years. Every team has a real shot at the title.", createdAt: new Date(now.getTime() - 21600000) },
    { id: "post-7", userId: "user-2", teamId: "team-b", content: "Team Bravo's new signing is absolutely electric. Changed the whole dynamic of the team in just two games.", createdAt: new Date(now.getTime() - 25200000) },
  ];
  await db.insert(posts).values(postData);

  const commentData = [
    { id: "comment-1", postId: "post-1", userId: "user-2", content: "Great game but Team Bravo will get you next time!", createdAt: new Date(now.getTime() - 3000000) },
    { id: "comment-2", postId: "post-1", userId: "user-3", content: "That second half comeback was legendary!", createdAt: new Date(now.getTime() - 2500000) },
    { id: "comment-3", postId: "post-3", userId: "user-1", content: "Love that place! Best wings in town too.", createdAt: new Date(now.getTime() - 9000000) },
    { id: "comment-4", postId: "post-5", userId: "user-1", content: "Count me in! Will bring a few friends too.", createdAt: new Date(now.getTime() - 15000000) },
    { id: "comment-5", postId: "post-6", userId: "user-5", content: "Agreed. Team Echo is proof of that!", createdAt: new Date(now.getTime() - 20000000) },
  ];
  await db.insert(comments).values(commentData);

  const likeData = [
    { postId: "post-1", userId: "user-2" },
    { postId: "post-1", userId: "user-3" },
    { postId: "post-1", userId: "user-5" },
    { postId: "post-2", userId: "user-1" },
    { postId: "post-3", userId: "user-1" },
    { postId: "post-3", userId: "user-4" },
    { postId: "post-5", userId: "user-1" },
    { postId: "post-5", userId: "user-3" },
    { postId: "post-6", userId: "user-2" },
    { postId: "post-6", userId: "user-3" },
    { postId: "post-6", userId: "user-5" },
    { postId: "post-7", userId: "user-4" },
  ];
  await db.insert(likes).values(likeData);

  const venueData = [
    { id: "venue-1", name: "The Sideline Bar", description: "Sports bar with 20+ screens, craft beer selection, and game-day specials. The go-to spot for die-hard fans.", address: "123 Main St, Downtown", lat: 41.8827, lng: -87.6233, teamId: "team-a", category: "bar" },
    { id: "venue-2", name: "Central Sports Pub", description: "Classic pub atmosphere with great food and a huge outdoor patio perfect for watch parties.", address: "456 Oak Ave, Midtown", lat: 41.8918, lng: -87.6086, teamId: "team-b", category: "bar" },
    { id: "venue-3", name: "Victory Park", description: "Open-air venue with a giant screen for live game viewing. Bring your own chairs and blankets.", address: "789 Park Blvd, Westside", lat: 41.8684, lng: -87.6168, category: "park" },
    { id: "venue-4", name: "Fan Zone Arena", description: "Indoor arena converted into a fan experience center with memorabilia, games, and food trucks.", address: "101 Stadium Way, Eastside", lat: 41.8607, lng: -87.6317, teamId: "team-c", category: "arena" },
    { id: "venue-5", name: "Tailgate Alley", description: "The ultimate pre-game destination with local food vendors, live music, and team merchandise.", address: "202 River Rd, Northside", lat: 41.9032, lng: -87.6344, teamId: "team-d", category: "outdoor" },
  ];
  await db.insert(venues).values(venueData);

  const eventData = [
    { id: "event-1", venueId: "venue-1", teamId: "team-a", title: "Team Alpha Watch Party", description: "Join fellow Alpha fans to watch the big game on our massive screens. Drink specials all night!", date: new Date(now.getTime() + 86400000 * 3) },
    { id: "event-2", venueId: "venue-2", teamId: "team-b", title: "Bravo Fan Meetup", description: "Meet other Team Bravo supporters, swap stories, and gear up for the next match.", date: new Date(now.getTime() + 86400000 * 5) },
    { id: "event-3", venueId: "venue-3", title: "Outdoor Viewing Night", description: "Bring the family for an outdoor movie-style game viewing under the stars.", date: new Date(now.getTime() + 86400000 * 7) },
    { id: "event-4", venueId: "venue-4", teamId: "team-c", title: "Charlie Championship Celebration", description: "Celebrate Team Charlie's amazing season with games, prizes, and special guests.", date: new Date(now.getTime() + 86400000 * 10) },
    { id: "event-5", venueId: "venue-5", teamId: "team-d", title: "Delta Tailgate Bash", description: "The biggest pre-game tailgate of the season. Live music, BBQ, and team spirit!", date: new Date(now.getTime() + 86400000 * 2) },
  ];
  await db.insert(events).values(eventData);

  const offerData = [
    { id: "offer-1", title: "Game Day Happy Hour", description: "50% off all draft beers during any live game broadcast.", venueId: "venue-1", teamId: "team-a", discount: "50% off drafts", expiresAt: new Date(now.getTime() + 86400000 * 30), isActive: true },
    { id: "offer-2", title: "Fan Loyalty Wings", description: "Free basket of wings with any entree purchase when you show your team jersey.", venueId: "venue-2", discount: "Free wings", expiresAt: new Date(now.getTime() + 86400000 * 14), isActive: true },
    { id: "offer-3", title: "First Timer Discount", description: "15% off your first visit to Fan Zone Arena. Includes food and merchandise.", venueId: "venue-4", teamId: "team-c", discount: "15% off first visit", expiresAt: new Date(now.getTime() + 86400000 * 60), isActive: true },
    { id: "offer-4", title: "Group Watch Deal", description: "Book a table for 6+ and get a free appetizer platter. Perfect for game nights.", venueId: "venue-1", discount: "Free appetizer platter", expiresAt: new Date(now.getTime() + 86400000 * 21), isActive: true },
  ];
  await db.insert(offers).values(offerData);

  console.log("Database seeded successfully!");
}
