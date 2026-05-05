import "dotenv/config";
import {
  ActivityType,
  CollabRole,
  DistStatus,
  ExpenseCategory,
  Plan,
  PayoutStatus,
  Prisma,
  PrismaClient,
  ProjectStatus,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for seeding.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const DAY_MS = 24 * 60 * 60 * 1000;
const DEMO_PASSWORD = "musiky123";
// bcrypt hash of "musiky123" — pre-computed so seeding is fast & deterministic.
const DEMO_PASSWORD_HASH =
  "$2b$12$vEAI8RjcBhJRxGveyJSdYunhNs9WSKMCwqxekf36s/rka5zDc/FJ6";

const PLATFORMS = [
  { name: "Spotify", slug: "spotify" },
  { name: "Apple Music", slug: "apple-music" },
  { name: "YouTube Music", slug: "youtube-music" },
  { name: "Amazon Music", slug: "amazon-music" },
  { name: "Deezer", slug: "deezer" },
  { name: "Tidal", slug: "tidal" },
  { name: "TikTok", slug: "tiktok" },
  { name: "Instagram", slug: "instagram" },
  { name: "Shazam", slug: "shazam" },
  { name: "Pandora", slug: "pandora" },
  { name: "SoundCloud", slug: "soundcloud" },
  { name: "Napster", slug: "napster" },
];

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS);
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

async function wipeAll() {
  // Order matters because of FKs that don't cascade onto User.
  await prisma.activity.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.revenue.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.distribution.deleteMany();
  await prisma.track.deleteMany();
  await prisma.collaborator.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  // We deliberately keep the `Platform` table intact (custom platforms added
  // through the UI survive a re-seed too).
}

async function ensurePlatforms() {
  for (const p of PLATFORMS) {
    await prisma.platform.upsert({
      where: { slug: p.slug },
      update: { name: p.name },
      create: p,
    });
  }
}

async function createUser(input: { email: string; name: string; plan: Plan }) {
  return prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      plan: input.plan,
      passwordHash: DEMO_PASSWORD_HASH,
    },
  });
}

type Roster = Array<{ userId: string; role: CollabRole; splitPct: number }>;

async function buildProject(input: {
  ownerId: string;
  title: string;
  status: ProjectStatus;
  coverUrl: string;
  releasedAt: Date | null;
  roster: Roster;
  tracks: Array<{ title: string; duration: number; coverUrl?: string | null }>;
  distributions: Array<{ slug: string; status: DistStatus; liveAt: Date | null; streams: number }>;
  expenses: Array<{
    category: ExpenseCategory;
    amount: number;
    description: string;
    spentAt: Date;
    payerId: string;
  }>;
  revenues: Array<{
    slug: string;
    amount: number;
    periodStart: Date;
    periodEnd: Date;
    receivedAt: Date;
    paidUserIds?: string[];
    paidAt?: Date;
  }>;
  activities: Array<{ actorId: string; type: ActivityType; createdAt: Date; payload?: Prisma.InputJsonValue }>;
}) {
  const project = await prisma.project.create({
    data: {
      ownerId: input.ownerId,
      title: input.title,
      status: input.status,
      coverUrl: input.coverUrl,
      releasedAt: input.releasedAt,
    },
  });

  // Roster
  for (const r of input.roster) {
    await prisma.collaborator.create({
      data: {
        projectId: project.id,
        userId: r.userId,
        role: r.role,
        splitPct: r.splitPct.toFixed(2),
      },
    });
  }

  // Tracks
  for (const t of input.tracks) {
    await prisma.track.create({
      data: {
        projectId: project.id,
        title: t.title,
        version: 1,
        duration: t.duration,
        fileUrl: `https://cdn.example.com/musiky/${project.id}/${slugify(t.title)}.mp3`,
        coverUrl: t.coverUrl ?? input.coverUrl,
      },
    });
  }

  // Distributions
  const platformBySlug = new Map(
    (await prisma.platform.findMany()).map((p) => [p.slug, p])
  );
  for (const d of input.distributions) {
    const platform = platformBySlug.get(d.slug);
    if (!platform) continue;
    await prisma.distribution.create({
      data: {
        projectId: project.id,
        platformId: platform.id,
        status: d.status,
        liveAt: d.liveAt,
        streams: d.streams,
      },
    });
  }

  // Expenses
  for (const e of input.expenses) {
    await prisma.expense.create({
      data: {
        projectId: project.id,
        payerId: e.payerId,
        category: e.category,
        amount: e.amount.toFixed(2),
        currency: "USD",
        description: e.description,
        spentAt: e.spentAt,
      },
    });
  }

  // Revenue + payouts (split by roster)
  for (const r of input.revenues) {
    const platform = platformBySlug.get(r.slug);
    if (!platform) continue;
    const revenue = await prisma.revenue.create({
      data: {
        projectId: project.id,
        platformId: platform.id,
        amount: r.amount.toFixed(2),
        currency: "USD",
        periodStart: r.periodStart,
        periodEnd: r.periodEnd,
        receivedAt: r.receivedAt,
      },
    });

    // Fan out per roster, owner absorbs the rounding remainder.
    let distributed = 0;
    const shares = input.roster.map((collab) => {
      const share = round2(r.amount * (collab.splitPct / 100));
      distributed += share;
      return { userId: collab.userId, amount: share };
    });
    const owner = shares.find((s) => s.userId === input.ownerId);
    const remainder = round2(r.amount - distributed);
    if (owner && remainder !== 0) owner.amount = round2(owner.amount + remainder);

    const paidSet = new Set(r.paidUserIds ?? []);
    for (const s of shares) {
      const paid = paidSet.has(s.userId);
      await prisma.payout.create({
        data: {
          projectId: project.id,
          revenueId: revenue.id,
          userId: s.userId,
          amount: s.amount.toFixed(2),
          status: paid ? PayoutStatus.PAID : PayoutStatus.PENDING,
          paidAt: paid ? r.paidAt ?? r.receivedAt : null,
        },
      });
    }
  }

  // Activities
  for (const a of input.activities) {
    await prisma.activity.create({
      data: {
        projectId: project.id,
        actorId: a.actorId,
        type: a.type,
        payload: a.payload ?? Prisma.JsonNull,
        createdAt: a.createdAt,
      },
    });
  }

  return project;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("Wiping previous data…");
  await wipeAll();

  await ensurePlatforms();

  console.log("Creating users…");
  const main = await createUser({
    email: "main@musiky.dev",
    name: "Main Account",
    plan: Plan.PRO,
  });
  const mohamed = await createUser({
    email: "mohamed@musiky.dev",
    name: "Mohamed",
    plan: Plan.STARTER,
  });
  const yussef = await createUser({
    email: "yussef@musiky.dev",
    name: "Yussef",
    plan: Plan.STARTER,
  });

  console.log("Building 6 projects for the main account…");

  // ─── 1. Take Care (Drake) — LIVE, big revenue, full roster ───
  await buildProject({
    ownerId: main.id,
    title: "Take Care",
    status: ProjectStatus.LIVE,
    coverUrl:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=900&q=80",
    releasedAt: daysAgo(45),
    roster: [
      { userId: main.id, role: CollabRole.OWNER, splitPct: 50 },
      { userId: mohamed.id, role: CollabRole.PRODUCER, splitPct: 30 },
      { userId: yussef.id, role: CollabRole.VOCALIST, splitPct: 20 },
    ],
    tracks: [
      { title: "Marvin's Room", duration: 354 },
      { title: "Headlines", duration: 235 },
      { title: "Take Care", duration: 272 },
      { title: "The Motto", duration: 181 },
      { title: "HYFR", duration: 268 },
    ],
    distributions: [
      { slug: "spotify", status: DistStatus.LIVE, liveAt: daysAgo(45), streams: 1_842_000 },
      { slug: "apple-music", status: DistStatus.LIVE, liveAt: daysAgo(45), streams: 920_000 },
      { slug: "youtube-music", status: DistStatus.LIVE, liveAt: daysAgo(44), streams: 1_205_000 },
      { slug: "tidal", status: DistStatus.LIVE, liveAt: daysAgo(43), streams: 84_000 },
      { slug: "deezer", status: DistStatus.LIVE, liveAt: daysAgo(43), streams: 162_000 },
    ],
    expenses: [
      { category: ExpenseCategory.PRODUCTION, amount: 1200, description: "Studio + mixing engineer", spentAt: daysAgo(80), payerId: main.id },
      { category: ExpenseCategory.MASTERING, amount: 450, description: "Mastering pass at Sterling", spentAt: daysAgo(70), payerId: main.id },
      { category: ExpenseCategory.MARKETING, amount: 800, description: "Pre-save + playlist pitching", spentAt: daysAgo(55), payerId: main.id },
      { category: ExpenseCategory.VIDEO, amount: 2200, description: "Music video — Marvin's Room", spentAt: daysAgo(48), payerId: main.id },
    ],
    revenues: [
      { slug: "spotify", amount: 4280, periodStart: new Date("2026-01-01"), periodEnd: new Date("2026-01-31"), receivedAt: daysAgo(60), paidUserIds: [main.id, mohamed.id], paidAt: daysAgo(55) },
      { slug: "spotify", amount: 3960, periodStart: new Date("2026-02-01"), periodEnd: new Date("2026-02-28"), receivedAt: daysAgo(30), paidUserIds: [main.id, mohamed.id], paidAt: daysAgo(25) },
      { slug: "apple-music", amount: 1840, periodStart: new Date("2026-02-01"), periodEnd: new Date("2026-02-28"), receivedAt: daysAgo(28), paidUserIds: [main.id], paidAt: daysAgo(20) },
      { slug: "youtube-music", amount: 1120, periodStart: new Date("2026-03-01"), periodEnd: new Date("2026-03-31"), receivedAt: daysAgo(8) },
    ],
    activities: [
      { actorId: main.id, type: ActivityType.PROJECT_CREATED, createdAt: daysAgo(95), payload: { title: "Take Care" } },
      { actorId: mohamed.id, type: ActivityType.COLLAB_JOINED, createdAt: daysAgo(90), payload: { role: "PRODUCER", splitPct: "30.00" } },
      { actorId: yussef.id, type: ActivityType.COLLAB_JOINED, createdAt: daysAgo(89), payload: { role: "VOCALIST", splitPct: "20.00" } },
      { actorId: main.id, type: ActivityType.TRACK_UPLOADED, createdAt: daysAgo(80), payload: { title: "Take Care", version: 1 } },
      { actorId: main.id, type: ActivityType.DISTRIBUTED, createdAt: daysAgo(45), payload: { platforms: ["spotify", "apple-music", "youtube-music", "tidal", "deezer"] } },
      { actorId: main.id, type: ActivityType.REVENUE_RECEIVED, createdAt: daysAgo(60), payload: { amount: "4280.00", currency: "USD" } },
      { actorId: main.id, type: ActivityType.PAYOUT_SENT, createdAt: daysAgo(55), payload: { amount: "1284.00" } },
    ],
  });

  // ─── 2. Scorpion (Drake) — LIVE, solo, prolific ───
  await buildProject({
    ownerId: main.id,
    title: "Scorpion",
    status: ProjectStatus.LIVE,
    coverUrl:
      "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=900&q=80",
    releasedAt: daysAgo(20),
    roster: [{ userId: main.id, role: CollabRole.OWNER, splitPct: 100 }],
    tracks: [
      { title: "Nonstop", duration: 238 },
      { title: "In My Feelings", duration: 217 },
      { title: "God's Plan", duration: 199 },
      { title: "Nice For What", duration: 211 },
    ],
    distributions: [
      { slug: "spotify", status: DistStatus.LIVE, liveAt: daysAgo(20), streams: 2_640_000 },
      { slug: "apple-music", status: DistStatus.LIVE, liveAt: daysAgo(20), streams: 1_180_000 },
      { slug: "youtube-music", status: DistStatus.LIVE, liveAt: daysAgo(20), streams: 980_000 },
      { slug: "amazon-music", status: DistStatus.LIVE, liveAt: daysAgo(18), streams: 320_000 },
      { slug: "tiktok", status: DistStatus.LIVE, liveAt: daysAgo(15), streams: 4_120_000 },
    ],
    expenses: [
      { category: ExpenseCategory.PRODUCTION, amount: 1800, description: "Studio bookings + session players", spentAt: daysAgo(50), payerId: main.id },
      { category: ExpenseCategory.MARKETING, amount: 2400, description: "Social campaign + influencer push", spentAt: daysAgo(22), payerId: main.id },
      { category: ExpenseCategory.VIDEO, amount: 3500, description: "In My Feelings music video", spentAt: daysAgo(18), payerId: main.id },
    ],
    revenues: [
      { slug: "spotify", amount: 5680, periodStart: new Date("2026-03-01"), periodEnd: new Date("2026-03-31"), receivedAt: daysAgo(10), paidUserIds: [main.id], paidAt: daysAgo(5) },
      { slug: "tiktok", amount: 920, periodStart: new Date("2026-03-01"), periodEnd: new Date("2026-03-31"), receivedAt: daysAgo(7) },
    ],
    activities: [
      { actorId: main.id, type: ActivityType.PROJECT_CREATED, createdAt: daysAgo(60), payload: { title: "Scorpion" } },
      { actorId: main.id, type: ActivityType.TRACK_UPLOADED, createdAt: daysAgo(35), payload: { title: "God's Plan", version: 1 } },
      { actorId: main.id, type: ActivityType.DISTRIBUTED, createdAt: daysAgo(20), payload: { platforms: ["spotify", "apple-music", "youtube-music"] } },
      { actorId: main.id, type: ActivityType.REVENUE_RECEIVED, createdAt: daysAgo(10), payload: { amount: "5680.00", currency: "USD" } },
    ],
  });

  // ─── 3. After Hours (The Weeknd) — LIVE, with Mohamed ───
  await buildProject({
    ownerId: main.id,
    title: "After Hours",
    status: ProjectStatus.LIVE,
    coverUrl:
      "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=900&q=80",
    releasedAt: daysAgo(35),
    roster: [
      { userId: main.id, role: CollabRole.OWNER, splitPct: 65 },
      { userId: mohamed.id, role: CollabRole.PRODUCER, splitPct: 35 },
    ],
    tracks: [
      { title: "Blinding Lights", duration: 200 },
      { title: "Save Your Tears", duration: 215 },
      { title: "In Your Eyes", duration: 237 },
      { title: "Heartless", duration: 198 },
    ],
    distributions: [
      { slug: "spotify", status: DistStatus.LIVE, liveAt: daysAgo(35), streams: 3_240_000 },
      { slug: "apple-music", status: DistStatus.LIVE, liveAt: daysAgo(35), streams: 1_410_000 },
      { slug: "youtube-music", status: DistStatus.LIVE, liveAt: daysAgo(34), streams: 2_880_000 },
      { slug: "shazam", status: DistStatus.LIVE, liveAt: daysAgo(30), streams: 510_000 },
    ],
    expenses: [
      { category: ExpenseCategory.PRODUCTION, amount: 2200, description: "Synthwave production setup", spentAt: daysAgo(70), payerId: main.id },
      { category: ExpenseCategory.MASTERING, amount: 600, description: "Mastering — Blinding Lights", spentAt: daysAgo(45), payerId: main.id },
      { category: ExpenseCategory.MARKETING, amount: 1500, description: "TV/Film sync placements", spentAt: daysAgo(36), payerId: main.id },
      { category: ExpenseCategory.VIDEO, amount: 4200, description: "Cinematic music video — Blinding Lights", spentAt: daysAgo(32), payerId: main.id },
    ],
    revenues: [
      { slug: "spotify", amount: 6120, periodStart: new Date("2026-02-01"), periodEnd: new Date("2026-02-28"), receivedAt: daysAgo(25), paidUserIds: [main.id, mohamed.id], paidAt: daysAgo(20) },
      { slug: "apple-music", amount: 2340, periodStart: new Date("2026-02-01"), periodEnd: new Date("2026-02-28"), receivedAt: daysAgo(22), paidUserIds: [main.id] },
      { slug: "youtube-music", amount: 3120, periodStart: new Date("2026-03-01"), periodEnd: new Date("2026-03-31"), receivedAt: daysAgo(6) },
    ],
    activities: [
      { actorId: main.id, type: ActivityType.PROJECT_CREATED, createdAt: daysAgo(85), payload: { title: "After Hours" } },
      { actorId: mohamed.id, type: ActivityType.COLLAB_JOINED, createdAt: daysAgo(80), payload: { role: "PRODUCER", splitPct: "35.00" } },
      { actorId: main.id, type: ActivityType.TRACK_UPLOADED, createdAt: daysAgo(50), payload: { title: "Blinding Lights", version: 1 } },
      { actorId: main.id, type: ActivityType.DISTRIBUTED, createdAt: daysAgo(35), payload: { platforms: ["spotify", "apple-music", "youtube-music", "shazam"] } },
      { actorId: main.id, type: ActivityType.REVENUE_RECEIVED, createdAt: daysAgo(25), payload: { amount: "6120.00", currency: "USD" } },
    ],
  });

  // ─── 4. Ma Bagheek (Cheb Bello) — LIVE, regional, with Yussef ───
  await buildProject({
    ownerId: main.id,
    title: "Ma Bagheek",
    status: ProjectStatus.LIVE,
    coverUrl:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&q=80",
    releasedAt: daysAgo(15),
    roster: [
      { userId: main.id, role: CollabRole.OWNER, splitPct: 70 },
      { userId: yussef.id, role: CollabRole.VOCALIST, splitPct: 30 },
    ],
    tracks: [
      { title: "Ma Bagheek", duration: 254 },
      { title: "Goulou Lemama", duration: 219 },
      { title: "Habibi Layla", duration: 268 },
    ],
    distributions: [
      { slug: "spotify", status: DistStatus.LIVE, liveAt: daysAgo(15), streams: 480_000 },
      { slug: "youtube-music", status: DistStatus.LIVE, liveAt: daysAgo(14), streams: 1_120_000 },
      { slug: "deezer", status: DistStatus.LIVE, liveAt: daysAgo(13), streams: 92_000 },
      { slug: "tiktok", status: DistStatus.LIVE, liveAt: daysAgo(10), streams: 2_650_000 },
    ],
    expenses: [
      { category: ExpenseCategory.PRODUCTION, amount: 700, description: "Studio sessions in Algiers", spentAt: daysAgo(40), payerId: main.id },
      { category: ExpenseCategory.MASTERING, amount: 280, description: "Online mastering pass", spentAt: daysAgo(20), payerId: main.id },
      { category: ExpenseCategory.MARKETING, amount: 600, description: "Maghreb radio + TikTok push", spentAt: daysAgo(13), payerId: main.id },
    ],
    revenues: [
      { slug: "youtube-music", amount: 1520, periodStart: new Date("2026-03-01"), periodEnd: new Date("2026-03-31"), receivedAt: daysAgo(5), paidUserIds: [main.id] },
      { slug: "tiktok", amount: 480, periodStart: new Date("2026-03-01"), periodEnd: new Date("2026-03-31"), receivedAt: daysAgo(3) },
    ],
    activities: [
      { actorId: main.id, type: ActivityType.PROJECT_CREATED, createdAt: daysAgo(50), payload: { title: "Ma Bagheek" } },
      { actorId: yussef.id, type: ActivityType.COLLAB_JOINED, createdAt: daysAgo(48), payload: { role: "VOCALIST", splitPct: "30.00" } },
      { actorId: main.id, type: ActivityType.TRACK_UPLOADED, createdAt: daysAgo(30), payload: { title: "Ma Bagheek", version: 1 } },
      { actorId: main.id, type: ActivityType.DISTRIBUTED, createdAt: daysAgo(15), payload: { platforms: ["spotify", "youtube-music", "deezer", "tiktok"] } },
      { actorId: main.id, type: ActivityType.REVENUE_RECEIVED, createdAt: daysAgo(5), payload: { amount: "1520.00", currency: "USD" } },
    ],
  });

  // ─── 5. Astroworld (Travis Scott) — READY, pre-launch, full roster ───
  await buildProject({
    ownerId: main.id,
    title: "Astroworld",
    status: ProjectStatus.READY,
    coverUrl:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&q=80",
    releasedAt: null,
    roster: [
      { userId: main.id, role: CollabRole.OWNER, splitPct: 55 },
      { userId: mohamed.id, role: CollabRole.PRODUCER, splitPct: 25 },
      { userId: yussef.id, role: CollabRole.ARTIST, splitPct: 20 },
    ],
    tracks: [
      { title: "Sicko Mode", duration: 312 },
      { title: "Stargazing", duration: 270 },
      { title: "Stop Trying To Be God", duration: 320 },
    ],
    distributions: [
      { slug: "spotify", status: DistStatus.PENDING, liveAt: null, streams: 0 },
      { slug: "apple-music", status: DistStatus.PENDING, liveAt: null, streams: 0 },
    ],
    expenses: [
      { category: ExpenseCategory.PRODUCTION, amount: 3200, description: "Maximalist trap production", spentAt: daysAgo(25), payerId: main.id },
      { category: ExpenseCategory.MASTERING, amount: 700, description: "Mastering — full album", spentAt: daysAgo(12), payerId: main.id },
    ],
    revenues: [],
    activities: [
      { actorId: main.id, type: ActivityType.PROJECT_CREATED, createdAt: daysAgo(40), payload: { title: "Astroworld" } },
      { actorId: mohamed.id, type: ActivityType.COLLAB_JOINED, createdAt: daysAgo(38), payload: { role: "PRODUCER", splitPct: "25.00" } },
      { actorId: yussef.id, type: ActivityType.COLLAB_JOINED, createdAt: daysAgo(37), payload: { role: "ARTIST", splitPct: "20.00" } },
      { actorId: main.id, type: ActivityType.TRACK_UPLOADED, createdAt: daysAgo(20), payload: { title: "Sicko Mode", version: 1 } },
      { actorId: main.id, type: ActivityType.EXPENSE_LOGGED, createdAt: daysAgo(12), payload: { category: "MASTERING", amount: "700.00" } },
    ],
  });

  // ─── 6. Currents (Tame Impala) — DRAFT, early stage, with Yussef ───
  await buildProject({
    ownerId: main.id,
    title: "Currents",
    status: ProjectStatus.DRAFT,
    coverUrl:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=900&q=80",
    releasedAt: null,
    roster: [
      { userId: main.id, role: CollabRole.OWNER, splitPct: 75 },
      { userId: yussef.id, role: CollabRole.COMPOSER, splitPct: 25 },
    ],
    tracks: [
      { title: "Let It Happen", duration: 467 },
      { title: "The Less I Know The Better", duration: 216 },
    ],
    distributions: [],
    expenses: [
      { category: ExpenseCategory.PRODUCTION, amount: 420, description: "Bedroom synth setup", spentAt: daysAgo(7), payerId: main.id },
    ],
    revenues: [],
    activities: [
      { actorId: main.id, type: ActivityType.PROJECT_CREATED, createdAt: daysAgo(10), payload: { title: "Currents" } },
      { actorId: yussef.id, type: ActivityType.COLLAB_JOINED, createdAt: daysAgo(8), payload: { role: "COMPOSER", splitPct: "25.00" } },
      { actorId: main.id, type: ActivityType.TRACK_UPLOADED, createdAt: daysAgo(5), payload: { title: "Let It Happen", version: 1 } },
    ],
  });

  // ─── Summary ───
  const [users, projects, tracks, collaborators, revenues, payouts, expenses] =
    await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.track.count(),
      prisma.collaborator.count(),
      prisma.revenue.count(),
      prisma.payout.count(),
      prisma.expense.count(),
    ]);

  console.log("");
  console.log("Seed complete.");
  console.log(
    `Users: ${users} · Projects: ${projects} · Tracks: ${tracks} · Collaborators: ${collaborators}`
  );
  console.log(
    `Revenues: ${revenues} · Payouts: ${payouts} · Expenses: ${expenses}`
  );
  console.log("");
  console.log(`Demo password (all 3 accounts): ${DEMO_PASSWORD}`);
  console.log("  • main@musiky.dev    — Main Account, owns all 6 projects");
  console.log("  • mohamed@musiky.dev — collaborator on Take Care, After Hours, Astroworld");
  console.log("  • yussef@musiky.dev  — collaborator on Take Care, Ma Bagheek, Astroworld, Currents");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
