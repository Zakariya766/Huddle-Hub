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
    // Team Alpha watch spots — River North / Magnificent Mile
    { id: "venue-a1", name: "Theory", description: "Upscale River North lounge with big screens, craft cocktails, and an electric game-day atmosphere.", address: "9 W Hubbard St, Chicago, IL 60654", lat: 41.8901, lng: -87.6302, teamId: "team-a", category: "lounge" },
    { id: "venue-a2", name: "No Vacancy", description: "Stylish gastropub with elevated bar food, a killer beer list, and multiple TVs for every game.", address: "509 N Wells St, Chicago, IL 60654", lat: 41.8913, lng: -87.6340, teamId: "team-a", category: "restaurant" },
    { id: "venue-a3", name: "Jake Melnick's Corner Tap", description: "Famous for wings and wall-to-wall screens. A top-tier sports bar near the Magnificent Mile.", address: "41 E Superior St, Chicago, IL 60611", lat: 41.8960, lng: -87.6245, teamId: "team-a", category: "bar" },
    { id: "venue-a4", name: "Timothy O'Toole's Pub", description: "Classic Chicago sports pub with huge portions, a lively crowd, and screens you can see from every seat.", address: "622 N Fairbanks Ct, Chicago, IL 60611", lat: 41.8932, lng: -87.6208, teamId: "team-a", category: "restaurant" },
    { id: "venue-a5", name: "Tree House Chicago", description: "Multi-level River North spot with rooftop views, a party vibe, and game-day drink specials.", address: "149 W Kinzie St, Chicago, IL 60654", lat: 41.8893, lng: -87.6345, teamId: "team-a", category: "lounge" },
    // Team Bravo watch spots — Wicker Park / Logan Square
    { id: "venue-b1", name: "Lottie's Pub", description: "Wicker Park dive bar institution with pool tables, strong drinks, and a loyal neighborhood crowd.", address: "1925 W Cortland St, Chicago, IL 60622", lat: 41.9161, lng: -87.6771, teamId: "team-b", category: "bar" },
    { id: "venue-b2", name: "Fatpour Tap Works", description: "Craft beer haven in Wicker Park with an impressive tap list and a laid-back sports-watching vibe.", address: "2005 W Division St, Chicago, IL 60622", lat: 41.9032, lng: -87.6787, teamId: "team-b", category: "bar" },
    { id: "venue-b3", name: "Cleo's Bar and Grill", description: "Neighborhood favorite with great burgers, a jukebox, and an unpretentious game-day crowd.", address: "1935 W Chicago Ave, Chicago, IL 60622", lat: 41.8965, lng: -87.6774, teamId: "team-b", category: "restaurant" },
    { id: "venue-b4", name: "The Moonlighter", description: "Logan Square hangout with craft cocktails, pinball, and a cozy backroom for watching games.", address: "3204 W Armitage Ave, Chicago, IL 60647", lat: 41.9173, lng: -87.7095, teamId: "team-b", category: "lounge" },
    { id: "venue-b5", name: "Park & Field", description: "Logan Square beer garden with a huge outdoor patio, fire pits, and big-screen projectors.", address: "3509 W Fullerton Ave, Chicago, IL 60647", lat: 41.9248, lng: -87.7178, teamId: "team-b", category: "beer garden" },
    // Team Charlie watch spots — Wrigleyville / Lakeview
    { id: "venue-c1", name: "Graystone Tavern", description: "Wrigleyville sports bar packed on game days with cold beers, great wings, and a rowdy crowd.", address: "3441 N Sheffield Ave, Chicago, IL 60657", lat: 41.9441, lng: -87.6536, teamId: "team-c", category: "bar" },
    { id: "venue-c2", name: "Joe's on Weed St.", description: "Massive multi-room venue near Lincoln Park with live music, huge screens, and legendary game-day parties.", address: "940 W Weed St, Chicago, IL 60642", lat: 41.9074, lng: -87.6521, teamId: "team-c", category: "lounge" },
    { id: "venue-c3", name: "Budweiser Brickhouse Tavern", description: "Right across from the ballpark with rooftop views, a high-energy crowd, and cold Budweisers on tap.", address: "3647 N Clark St, Chicago, IL 60613", lat: 41.9488, lng: -87.6567, teamId: "team-c", category: "bar" },
    { id: "venue-c4", name: "Murphy's Bleachers", description: "Iconic Wrigleyville watering hole. The go-to pre-game and post-game spot for decades.", address: "3655 N Sheffield Ave, Chicago, IL 60613", lat: 41.9494, lng: -87.6536, teamId: "team-c", category: "beer garden" },
    { id: "venue-c5", name: "Cody's Public House", description: "Lakeview neighborhood pub with a friendly staff, solid pub grub, and all the games on TV.", address: "1658 W Barry Ave, Chicago, IL 60657", lat: 41.9379, lng: -87.6695, teamId: "team-c", category: "restaurant" },
    // Team Delta watch spots — Lincoln Park / Southport
    { id: "venue-d1", name: "Broken Barrel Bar", description: "Southport corridor gem with whiskey flights, great appetizers, and a cozy game-watching setup.", address: "2548 N Southport Ave, Chicago, IL 60614", lat: 41.9291, lng: -87.6636, teamId: "team-d", category: "bar" },
    { id: "venue-d2", name: "Benchmark", description: "Old Town sports bar with a massive screen, shuffleboard, and a menu built for game days.", address: "1510 N Wells St, Chicago, IL 60610", lat: 41.9095, lng: -87.6348, teamId: "team-d", category: "restaurant" },
    { id: "venue-d3", name: "Gaslight", description: "Lincoln Park favorite with a rooftop patio, craft beers, and an upbeat crowd on game nights.", address: "2450 N Clark St, Chicago, IL 60614", lat: 41.9271, lng: -87.6434, teamId: "team-d", category: "beer garden" },
    { id: "venue-d4", name: "The Whale Chicago", description: "Logan Square cocktail bar with a speakeasy feel, vinyl nights, and screens for the big games.", address: "2427 N Milwaukee Ave, Chicago, IL 60647", lat: 41.9270, lng: -87.7009, teamId: "team-d", category: "lounge" },
    { id: "venue-d5", name: "Will's Northwoods Inn", description: "Rustic cabin-themed bar in Lakeview with strong pours, taxidermy decor, and a die-hard sports crowd.", address: "3030 N Racine Ave, Chicago, IL 60657", lat: 41.9368, lng: -87.6568, teamId: "team-d", category: "bar" },
    // Team Echo watch spots — Sheffield / Lincoln Square
    { id: "venue-e1", name: "Sheffield's Wine & Beer Garden", description: "Lakeview institution with a massive beer garden, rare craft selections, and big screens outdoors.", address: "3258 N Sheffield Ave, Chicago, IL 60657", lat: 41.9400, lng: -87.6536, teamId: "team-e", category: "beer garden" },
    { id: "venue-e2", name: "Vaughan's Pub", description: "Cozy Sheffield neighborhood pub with a friendly vibe, darts, and all the games you could want.", address: "2917 N Sheffield Ave, Chicago, IL 60657", lat: 41.9340, lng: -87.6536, teamId: "team-e", category: "bar" },
    { id: "venue-e3", name: "The Pony Inn", description: "No-frills Belmont dive bar with cheap drinks, a pool table, and a loyal game-day following.", address: "1638 W Belmont Ave, Chicago, IL 60657", lat: 41.9397, lng: -87.6691, teamId: "team-e", category: "bar" },
    { id: "venue-e4", name: "Wild Goose Bar & Grill", description: "Lincoln Square neighborhood spot with hearty food, trivia nights, and a passionate sports crowd.", address: "4600 N Lincoln Ave, Chicago, IL 60625", lat: 41.9660, lng: -87.6877, teamId: "team-e", category: "restaurant" },
    { id: "venue-e5", name: "Robert's Pizza and Dough Company", description: "Streeterville pizza spot with deep dish, craft beers, and game-day specials on the big screen.", address: "465 N McClurg Ct, Chicago, IL 60611", lat: 41.8908, lng: -87.6170, teamId: "team-e", category: "pizzeria" },
  ];
  await db.insert(venues).values(venueData);

  const eventData = [
    { id: "event-1", venueId: "venue-a1", teamId: "team-a", awayTeamId: "team-b", title: "Team Alpha vs Team Bravo", description: "The rivalry continues! Watch Alpha take on Bravo at Theory. Drink specials all night!", date: new Date(now.getTime() + 86400000 * 3) },
    { id: "event-2", venueId: "venue-b1", teamId: "team-b", awayTeamId: "team-e", title: "Team Bravo vs Team Echo", description: "Bravo hosts Echo in a must-win clash. Join fellow fans at Lottie's.", date: new Date(now.getTime() + 86400000 * 5) },
    { id: "event-3", venueId: "venue-c1", teamId: "team-c", awayTeamId: "team-d", title: "Team Charlie vs Team Delta", description: "Charlie faces Delta at Graystone Tavern in a battle for playoff position.", date: new Date(now.getTime() + 86400000 * 7) },
    { id: "event-4", venueId: "venue-c2", teamId: "team-c", awayTeamId: "team-a", title: "Team Charlie vs Team Alpha", description: "Charlie looks to upset Alpha at Joe's on Weed St.", date: new Date(now.getTime() + 86400000 * 10) },
    { id: "event-5", venueId: "venue-d1", teamId: "team-d", awayTeamId: "team-e", title: "Team Delta vs Team Echo", description: "Delta takes on Echo at Broken Barrel Bar with pre-game specials!", date: new Date(now.getTime() + 86400000 * 2) },
  ];
  await db.insert(events).values(eventData);

  const offerData = [
    { id: "offer-1", title: "Game Day Happy Hour", description: "50% off all draft beers during any live game broadcast.", venueId: "venue-a1", teamId: "team-a", discount: "50% off drafts", expiresAt: new Date(now.getTime() + 86400000 * 30), isActive: true },
    { id: "offer-2", title: "Fan Loyalty Wings", description: "Free basket of wings with any entree purchase when you show your team jersey.", venueId: "venue-a3", teamId: "team-a", discount: "Free wings", expiresAt: new Date(now.getTime() + 86400000 * 14), isActive: true },
    { id: "offer-3", title: "First Timer Discount", description: "15% off your first visit to Graystone Tavern. Includes food and merch.", venueId: "venue-c1", teamId: "team-c", discount: "15% off first visit", expiresAt: new Date(now.getTime() + 86400000 * 60), isActive: true },
    { id: "offer-4", title: "Group Watch Deal", description: "Book a table for 6+ and get a free appetizer platter. Perfect for game nights.", venueId: "venue-a2", teamId: "team-a", discount: "Free appetizer platter", expiresAt: new Date(now.getTime() + 86400000 * 21), isActive: true },
    { id: "offer-5", title: "Wicker Park Pitcher Special", description: "Buy one pitcher, get the second half off during any live game.", venueId: "venue-b2", teamId: "team-b", discount: "50% off 2nd pitcher", expiresAt: new Date(now.getTime() + 86400000 * 21), isActive: true },
    { id: "offer-6", title: "Wrigleyville Game Day Combo", description: "Burger, fries, and a draft for twelve bucks on game days.", venueId: "venue-c4", teamId: "team-c", discount: "12 dollar combo", expiresAt: new Date(now.getTime() + 86400000 * 30), isActive: true },
    { id: "offer-7", title: "Southport Whiskey Wednesday", description: "Half-price whiskey flights every Wednesday during games.", venueId: "venue-d1", teamId: "team-d", discount: "50% off whiskey flights", expiresAt: new Date(now.getTime() + 86400000 * 45), isActive: true },
    { id: "offer-8", title: "Beer Garden Bucket Deal", description: "Bucket of 5 craft beers for twenty bucks on game days.", venueId: "venue-e1", teamId: "team-e", discount: "5 beers for 20 dollars", expiresAt: new Date(now.getTime() + 86400000 * 30), isActive: true },
  ];
  await db.insert(offers).values(offerData);

  console.log("Database seeded successfully!");
}
