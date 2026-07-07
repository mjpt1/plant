import {
  PrismaClient,
  Role,
  ReportStatus,
  ReportTargetType,
} from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const DEMO_SCAN_ANALYSIS = {
  plant: {
    commonName: "Monstera",
    scientificName: "Monstera deliciosa",
    family: "Araceae",
    confidence: 91,
  },
  health: {
    status: "healthy",
    possibleProblems: [
      "Lower leaf yellowing (normal aging)",
      "Needs support as it grows",
    ],
    diseaseDiagnosis: [],
    pestDiagnosis: [],
    soilAnalysis: "Well-draining soil with moderate moisture.",
    confidence: 86,
  },
  care: {
    watering: "Water when top 2cm of soil is dry.",
    light: "Bright indirect light.",
    soil: "Well-draining potting mix.",
    fertilizer: "Monthly in spring and summer.",
    temperature: "18–27°C",
    humidity: "50–60%",
  },
  treatment: {
    immediateActions: ["Wipe leaves with a damp cloth"],
    stepByStepPlan: ["Check soil moisture weekly", "Rotate pot for even growth"],
    prevention: ["Avoid overwatering", "Provide a moss pole"],
    warnings: ["Toxic to pets if ingested"],
  },
};

async function ensureAccount(data: {
  email: string;
  password: string;
  name: string;
  username: string;
  role: Role;
  country?: string;
  city?: string;
  bio?: string;
}) {
  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.upsert({
    where: { email: data.email },
    update: {
      password: passwordHash,
      role: data.role,
      name: data.name,
      username: data.username,
      country: data.country,
      city: data.city,
      bio: data.bio,
    },
    create: {
      email: data.email,
      password: passwordHash,
      role: data.role,
      name: data.name,
      username: data.username,
      country: data.country,
      city: data.city,
      bio: data.bio,
    },
  });
  console.log(`✅ Account ready: ${data.email} / ${data.password} (${data.role})`);
  return user;
}

async function ensureDemoCareReminders(userId: string, plantId: string) {
  const existing = await prisma.careReminder.count({
    where: { userId, plantId, completed: false },
  });
  if (existing > 0) return;

  const now = new Date();
  const inDays = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  await prisma.careReminder.createMany({
    data: [
      {
        userId,
        plantId,
        titleEn: "Water Monstera",
        titleFa: "آبیاری مانسترا",
        type: "watering",
        scheduledAt: inDays(1),
        recurring: "weekly",
        notes: "Check top 2cm of soil before watering.",
      },
      {
        userId,
        plantId,
        titleEn: "Fertilize Monstera",
        titleFa: "کوددهی مانسترا",
        type: "fertilizing",
        scheduledAt: inDays(14),
        recurring: "monthly",
        notes: "Use balanced liquid fertilizer diluted to half strength.",
      },
      {
        userId,
        plantId,
        titleEn: "Check leaves for pests",
        titleFa: "بررسی برگ‌ها از آفات",
        type: "inspection",
        scheduledAt: inDays(3),
        recurring: "weekly",
        notes: "Look under leaves for spider mites or scale.",
      },
    ],
  });
  console.log("✅ Care reminders created");
}

async function ensureScanHistory(userId: string, plantId: string) {
  const existing = await prisma.scanHistory.count({ where: { userId } });
  if (existing > 0) return;

  const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);

  await prisma.scanHistory.createMany({
    data: [
      {
        userId,
        plantId,
        imageUrl: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800",
        imageType: "full_plant",
        plantData: DEMO_SCAN_ANALYSIS.plant,
        healthData: DEMO_SCAN_ANALYSIS.health,
        careData: DEMO_SCAN_ANALYSIS.care,
        treatmentData: DEMO_SCAN_ANALYSIS.treatment,
        createdAt: daysAgo(7),
      },
      {
        userId,
        plantId,
        imageUrl: "https://images.unsplash.com/photo-1593482893169-8b35a30f0a15?w=800",
        imageType: "leaf",
        plantData: {
          ...DEMO_SCAN_ANALYSIS.plant,
          confidence: 88,
        },
        healthData: {
          ...DEMO_SCAN_ANALYSIS.health,
          status: "warning",
          possibleProblems: [
            "Slight yellowing on lower leaf",
            "برگ پایینی کمی زرد شده",
          ],
        },
        careData: DEMO_SCAN_ANALYSIS.care,
        treatmentData: {
          immediateActions: ["Reduce watering frequency"],
          stepByStepPlan: ["Let soil dry between waterings"],
          prevention: ["Ensure pot has drainage holes"],
          warnings: [],
        },
        createdAt: daysAgo(2),
      },
    ],
  });
  console.log("✅ Scan history created");
}

async function ensureSocialGraph(
  demoId: string,
  adminId: string,
  expertId: string
) {
  const followCount = await prisma.follow.count();
  if (followCount === 0) {
    await prisma.follow.createMany({
      data: [
        { followerId: demoId, followingId: expertId },
        { followerId: demoId, followingId: adminId },
        { followerId: expertId, followingId: demoId },
      ],
      skipDuplicates: true,
    });
    console.log("✅ Follow relationships created");
  }

  let posts = await prisma.post.findMany({ orderBy: { createdAt: "asc" } });
  if (posts.length === 0) {
    posts = await prisma.$transaction([
      prisma.post.create({
        data: {
          userId: demoId,
          content:
            "مانسترای جدیدم یک برگ جدید باز کرد! 🌿 آیا کوددهی ماهانه برایش مناسب است؟",
        },
      }),
      prisma.post.create({
        data: {
          userId: adminId,
          content:
            "Welcome to PlantCare! Share your plants, ask questions, and never miss a watering day.",
        },
      }),
      prisma.post.create({
        data: {
          userId: expertId,
          content:
            "نکته تخصصی: برای پوتوس، آبیاری زیاد شایع‌ترین علت زرد شدن برگ‌هاست. / Pro tip: Overwatering is the #1 cause of yellow pothos leaves.",
        },
      }),
    ]);
    console.log("✅ Social posts created");
  }

  const demoPost = posts.find((p) => p.userId === demoId) ?? posts[0];
  const expertPost = posts.find((p) => p.userId === expertId) ?? posts[posts.length - 1];

  const commentCount = await prisma.comment.count();
  if (commentCount === 0) {
    await prisma.comment.createMany({
      data: [
        {
          postId: demoPost.id,
          userId: expertId,
          content:
            "بله، در بهار و تابستان ماهانه کود مایع رقیق مناسب است. در پاییز و زمستان کوددهی را کم کنید.",
        },
        {
          postId: demoPost.id,
          userId: adminId,
          content: "Great growth! A moss pole will help support those new leaves.",
        },
        {
          postId: expertPost.id,
          userId: demoId,
          content: "ممنون از نکته! خاکم همیشه خیس بود، الان کمتر آبیاری می‌کنم.",
        },
      ],
    });
    console.log("✅ Comments created");
  }

  const likeCount = await prisma.like.count();
  if (likeCount === 0) {
    await prisma.like.createMany({
      data: [
        { postId: demoPost.id, userId: expertId },
        { postId: demoPost.id, userId: adminId },
        { postId: expertPost.id, userId: demoId },
        { postId: expertPost.id, userId: adminId },
      ],
      skipDuplicates: true,
    });
    console.log("✅ Likes created");
  }

  const reportCount = await prisma.report.count();
  if (reportCount === 0) {
    await prisma.report.create({
      data: {
        reporterId: demoId,
        targetType: ReportTargetType.POST,
        targetId: expertPost.id,
        reason: "spam",
        details: "Sample pending report for admin moderation demo.",
        status: ReportStatus.PENDING,
      },
    });
    console.log("✅ Sample report created");
  }
}

async function ensureQaGraph(demoId: string, adminId: string, expertId: string) {
  const voteCount = await prisma.vote.count();
  if (voteCount > 0) return;

  let q1 = await prisma.question.findFirst({
    where: { userId: demoId, category: "disease" },
  });

  if (!q1) {
    q1 = await prisma.question.create({
      data: {
        userId: demoId,
        title: "برگ‌های پوتوس زرد می‌شوند — چه کار کنم؟",
        content:
          "پوتوس من در اتاق نشیمن است و برگ‌های پایینی زرد شده‌اند. هفته‌ای یک‌بار آبیاری می‌کنم.",
        category: "disease",
        tags: ["pothos", "yellow-leaves", "watering"],
      },
    });
  }

  let q2 = await prisma.question.findFirst({
    where: { userId: demoId, category: "care" },
  });

  if (!q2) {
    q2 = await prisma.question.create({
      data: {
        userId: demoId,
        title: "Best fertilizer for Monstera in summer?",
        content:
          "My Monstera is putting out new leaves. Should I use NPK 20-20-20 or something balanced?",
        category: "care",
        tags: ["monstera", "fertilizer", "summer"],
        solved: true,
      },
    });
  }

  let a1 = await prisma.answer.findFirst({
    where: { questionId: q1.id, userId: expertId },
  });
  if (!a1) {
    a1 = await prisma.answer.create({
      data: {
        questionId: q1.id,
        userId: expertId,
        content:
          "زرد شدن برگ‌های پایینی معمولاً طبیعی است. اگر برگ‌های جدید هم زرد می‌شوند، احتمالاً آبیاری زیاد است. بگذارید خاک بین آبیاری‌ها خشک شود.",
        isExpertVerified: true,
        isAccepted: true,
      },
    });
  }

  let a2 = await prisma.answer.findFirst({
    where: { questionId: q1.id, userId: adminId },
  });
  if (!a2) {
    a2 = await prisma.answer.create({
      data: {
        questionId: q1.id,
        userId: adminId,
        content:
          "Also check that your pot has drainage holes. Stagnant water causes root issues quickly.",
        isExpertVerified: false,
        isAccepted: false,
      },
    });
  }

  let a3 = await prisma.answer.findFirst({
    where: { questionId: q2.id, userId: expertId },
  });
  if (!a3) {
    a3 = await prisma.answer.create({
      data: {
        questionId: q2.id,
        userId: expertId,
        content:
          "Use a balanced liquid fertilizer (10-10-10 or 20-20-20) at half strength every 4 weeks during active growth. در بهار و تابستان ماهانه کافی است.",
        isExpertVerified: true,
        isAccepted: true,
      },
    });
  }

  await prisma.vote.createMany({
    data: [
      { answerId: a1.id, userId: demoId, value: 1 },
      { answerId: a1.id, userId: adminId, value: 1 },
      { answerId: a2.id, userId: demoId, value: 1 },
      { answerId: a3.id, userId: demoId, value: 1 },
      { answerId: a3.id, userId: adminId, value: 1 },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Q&A with answers and votes created");
}

async function main() {
  const user = await ensureAccount({
    email: "demo@plantcare.ir",
    password: "demo1234",
    name: "کاربر نمونه",
    username: "demo_gardener",
    role: Role.USER,
    country: "Iran",
    city: "Tehran",
    bio: "عاشق گیاهان آپارتمانی",
  });

  const admin = await ensureAccount({
    email: "admin@plantcare.ir",
    password: "admin1234",
    name: "Admin",
    username: "admin",
    role: Role.ADMIN,
    country: "Iran",
    city: "Tehran",
    bio: "PlantCare platform administrator",
  });

  const expert = await ensureAccount({
    email: "expert@plantcare.ir",
    password: "expert1234",
    name: "دکتر گیاه",
    username: "plant_expert",
    role: Role.EXPERT,
    country: "Iran",
    city: "Isfahan",
    bio: "متخصص گیاهان آپارتمانی و بیماری‌های گیاهی",
  });

  let plant = await prisma.plant.findFirst({ where: { userId: user.id } });
  if (!plant) {
    plant = await prisma.plant.create({
      data: {
        userId: user.id,
        nameEn: "Monstera",
        nameFa: "مانسترا",
        scientificName: "Monstera deliciosa",
        imageUrl:
          "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800",
        healthStatus: "healthy",
        environment: "indoor",
        notes: "گیاه اصلی من در اتاق نشیمن / My main living room plant",
        careGuide: {
          watering: "Water when top 2cm of soil is dry",
          light: "Bright indirect light",
          fertilizer: "Monthly in spring/summer",
          soil: "Well-draining potting mix",
        },
      },
    });
    console.log("✅ Plant: Monstera (مانسترا)");
  }

  await ensureDemoCareReminders(user.id, plant.id);
  await ensureScanHistory(user.id, plant.id);
  await ensureSocialGraph(user.id, admin.id, expert.id);
  await ensureQaGraph(user.id, admin.id, expert.id);

  console.log("\n📋 Demo accounts:");
  console.log("   User:   demo@plantcare.ir / demo1234");
  console.log("   Admin:  admin@plantcare.ir / admin1234");
  console.log("   Expert: expert@plantcare.ir / expert1234");
  console.log("   App:    http://localhost:3000/dashboard");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
