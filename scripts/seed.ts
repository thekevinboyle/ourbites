import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

type Platform = "instagram" | "tiktok";
type PostType =
  | "reel"
  | "carousel"
  | "story"
  | "single_image"
  | "video"
  | "photo";
type PostStatus = "idea" | "draft" | "scheduled" | "published";

// --- Helpers ---

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

// --- Instagram Captions ---

const instagramCaptions = [
  "New recipe alert! This one's a game-changer 🔥",
  "Sunday brunch done right. Link in bio for the full recipe!",
  "Who else loves a good avocado toast? 🥑",
  "Quick 15-minute dinner idea for busy weeknights",
  "This smoothie bowl is almost too pretty to eat 🎨",
  "Meal prep Sunday! Here's what I'm making this week",
  "The secret ingredient? A little bit of love ❤️",
  "POV: You just discovered the best pasta recipe ever",
  "Taste test: Store-bought vs homemade hummus",
  "3 ingredients. 5 minutes. The perfect snack.",
  "Our most requested recipe is finally here!",
  "Kitchen hack: How to ripen avocados in 10 minutes",
  "Date night cooking at home 🕯️",
  "This salad dressing will change your life",
  "Behind the scenes of today's food shoot 📸",
  "Comfort food season is officially here 🍂",
  "Quick breakfast ideas that aren't boring",
  "The viral baked feta pasta - our take on it!",
  "Farmers market haul! Look at these gorgeous tomatoes 🍅",
  "Easy meal prep containers for the whole week",
  "Dessert first? We won't judge 🍰",
  "Our top 5 kitchen tools we can't live without",
  "Summer grilling season is here! 🔥",
  "One-pot wonder: Creamy tomato soup",
  "Taste-testing every hot sauce in the fridge",
  "Morning routine: The perfect pour-over coffee ☕",
  "This bread recipe is foolproof, we promise",
  "Plant-based doesn't have to be boring!",
  "Friday night pizza from scratch 🍕",
  "Holiday cookie decorating with the team 🎄",
];

const tiktokCaptions = [
  "Wait for it... the cheese pull is INSANE 🧀",
  "POV: You're a home chef who just nailed it",
  "This hack saved me 30 minutes in the kitchen!",
  "Replying to @user: Here's the full recipe!",
  "Things that just make sense: garlic bread with everything",
  "Rating viral food hacks so you don't have to",
  "When the recipe actually turns out like the picture 😭",
  "3 lunches you can meal prep in under an hour",
  "The sound this steak makes... turn up your volume 🔊",
  "I tried the most popular recipe on TikTok",
  "You've been cutting avocados wrong this whole time",
  "Easy dorm room meals with just a microwave",
  "This sandwich is worth every calorie",
  "Testing if expensive olive oil is actually better",
  "Recipe for my famous chocolate chip cookies 🍪",
  "Day in my life as a food content creator",
  "5 sauces that make everything taste better",
  "The kitchen gadget that's worth the hype",
  "What I eat in a day: realistic edition",
  "Transforming leftovers into a gourmet meal",
  "Cooking the most expensive steak I could find",
  "This pasta shape holds sauce the best - here's proof",
  "Making restaurant-quality ramen at home 🍜",
  "Kitchen fails compilation... we've all been there",
  "How to make your grocery budget stretch further",
  "The one seasoning blend you need in your pantry",
  "Feeding 10 people on a $50 budget challenge",
  "Secret menu items you should try ordering",
  "Why your fried rice doesn't taste like restaurant fried rice",
  "Duet this with your cooking fails! 😂",
];

const instagramPostTypes: PostType[] = [
  "reel",
  "carousel",
  "story",
  "single_image",
  "photo",
];
const tiktokPostTypes: PostType[] = ["video", "reel"];

function generatePosts(
  platform: Platform,
  captions: string[],
  postTypes: PostType[],
  count: number
) {
  const statuses: PostStatus[] = ["idea", "draft", "scheduled", "published"];
  const posts: Array<{
    platform: Platform;
    caption: string;
    post_type: PostType;
    status: PostStatus;
    scheduled_at: string | null;
    published_at: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  }> = [];

  for (let i = 0; i < count; i++) {
    const status = randomElement(statuses);
    const createdDaysAgo = randomInt(1, 90);
    const createdAt = daysAgo(createdDaysAgo);

    let scheduledAt: string | null = null;
    let publishedAt: string | null = null;

    if (status === "scheduled") {
      // Schedule 1-14 days in the future from now
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + randomInt(1, 14));
      scheduledAt = futureDate.toISOString();
    } else if (status === "published") {
      // Published some time after creation
      const pubDate = new Date(createdAt);
      pubDate.setDate(pubDate.getDate() + randomInt(0, 5));
      publishedAt = pubDate.toISOString();
    }

    posts.push({
      platform,
      caption: captions[i % captions.length],
      post_type: randomElement(postTypes),
      status,
      scheduled_at: scheduledAt,
      published_at: publishedAt,
      notes:
        Math.random() > 0.6
          ? `Notes for ${platform} post #${i + 1}`
          : null,
      created_at: createdAt.toISOString(),
      updated_at: createdAt.toISOString(),
    });
  }

  return posts;
}

function generateAnalyticsSnapshots(platform: Platform, days: number) {
  const snapshots: Array<{
    platform: Platform;
    date: string;
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    followers: number;
    engagement_rate: number;
  }> = [];

  // Start with a base follower count
  let followers = platform === "instagram" ? 12500 : 8200;
  const baseImpressions = platform === "instagram" ? 3000 : 5000;

  for (let i = days; i >= 1; i--) {
    const date = toISODate(daysAgo(i));

    // Simulate organic growth with some variance
    followers += randomInt(-20, 80);
    const impressions =
      baseImpressions + randomInt(-1000, 2000) + Math.floor(i * 10);
    const likes = Math.floor(impressions * (0.03 + Math.random() * 0.05));
    const comments = Math.floor(likes * (0.05 + Math.random() * 0.1));
    const shares = Math.floor(likes * (0.02 + Math.random() * 0.05));
    const saves = Math.floor(likes * (0.1 + Math.random() * 0.15));
    const totalEngagements = likes + comments + shares + saves;
    const engagementRate =
      impressions > 0
        ? parseFloat(((totalEngagements / impressions) * 100).toFixed(2))
        : 0;

    snapshots.push({
      platform,
      date,
      impressions,
      likes,
      comments,
      shares,
      saves,
      followers,
      engagement_rate: engagementRate,
    });
  }

  return snapshots;
}

function generatePostAnalytics(postId: string) {
  const impressions = randomInt(500, 50000);
  const likes = Math.floor(impressions * (0.03 + Math.random() * 0.07));
  const comments = Math.floor(likes * (0.05 + Math.random() * 0.15));
  const shares = Math.floor(likes * (0.01 + Math.random() * 0.05));
  const saves = Math.floor(likes * (0.05 + Math.random() * 0.2));
  const reach = Math.floor(impressions * (0.6 + Math.random() * 0.3));

  return {
    post_id: postId,
    impressions,
    likes,
    comments,
    shares,
    saves,
    reach,
  };
}

async function seed() {
  console.log("🌱 Starting database seed...\n");

  // Clear existing data (order matters due to foreign keys)
  console.log("Clearing existing data...");
  await supabase.from("post_analytics").delete().neq("id", "");
  await supabase.from("analytics_snapshots").delete().neq("id", "");
  await supabase.from("posts").delete().neq("id", "");
  console.log("Existing data cleared.\n");

  // Seed posts
  console.log("Seeding Instagram posts...");
  const igPosts = generatePosts("instagram", instagramCaptions, instagramPostTypes, 30);
  const { data: insertedIgPosts, error: igError } = await supabase
    .from("posts")
    .insert(igPosts)
    .select("id");

  if (igError) {
    console.error("Error inserting Instagram posts:", igError);
    process.exit(1);
  }
  console.log(`  Inserted ${insertedIgPosts?.length ?? 0} Instagram posts.`);

  console.log("Seeding TikTok posts...");
  const tkPosts = generatePosts("tiktok", tiktokCaptions, tiktokPostTypes, 30);
  const { data: insertedTkPosts, error: tkError } = await supabase
    .from("posts")
    .insert(tkPosts)
    .select("id");

  if (tkError) {
    console.error("Error inserting TikTok posts:", tkError);
    process.exit(1);
  }
  console.log(`  Inserted ${insertedTkPosts?.length ?? 0} TikTok posts.\n`);

  // Seed analytics snapshots
  console.log("Seeding analytics snapshots...");
  const igSnapshots = generateAnalyticsSnapshots("instagram", 90);
  const { error: igSnapError } = await supabase
    .from("analytics_snapshots")
    .insert(igSnapshots);

  if (igSnapError) {
    console.error("Error inserting Instagram snapshots:", igSnapError);
    process.exit(1);
  }
  console.log(`  Inserted ${igSnapshots.length} Instagram snapshots.`);

  const tkSnapshots = generateAnalyticsSnapshots("tiktok", 90);
  const { error: tkSnapError } = await supabase
    .from("analytics_snapshots")
    .insert(tkSnapshots);

  if (tkSnapError) {
    console.error("Error inserting TikTok snapshots:", tkSnapError);
    process.exit(1);
  }
  console.log(`  Inserted ${tkSnapshots.length} TikTok snapshots.\n`);

  // Seed post analytics for published posts
  console.log("Seeding post analytics...");
  const allPostIds = [
    ...(insertedIgPosts ?? []),
    ...(insertedTkPosts ?? []),
  ].map((p) => p.id);

  const postAnalyticsData = allPostIds.map((id) => generatePostAnalytics(id));
  const { error: paError } = await supabase
    .from("post_analytics")
    .insert(postAnalyticsData);

  if (paError) {
    console.error("Error inserting post analytics:", paError);
    process.exit(1);
  }
  console.log(`  Inserted ${postAnalyticsData.length} post analytics records.\n`);

  console.log("✅ Database seeded successfully!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
