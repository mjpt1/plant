import { Role } from "@prisma/client";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

const DEMO_ACCOUNTS = [
  {
    email: "demo@plantcare.ir",
    password: "demo1234",
    name: "کاربر نمونه",
    username: "demo_gardener",
    role: Role.USER,
    country: "Iran",
    city: "Tehran",
    bio: "عاشق گیاهان آپارتمانی",
  },
  {
    email: "admin@plantcare.ir",
    password: "admin1234",
    name: "Admin",
    username: "admin",
    role: Role.ADMIN,
    country: "Iran",
    city: "Tehran",
    bio: "PlantCare platform administrator",
  },
  {
    email: "expert@plantcare.ir",
    password: "expert1234",
    name: "دکتر گیاه",
    username: "plant_expert",
    role: Role.EXPERT,
    country: "Iran",
    city: "Isfahan",
    bio: "متخصص گیاهان آپارتمانی و بیماری‌های گیاهی",
  },
] as const;

async function upsertDemoAccount(account: (typeof DEMO_ACCOUNTS)[number]) {
  const passwordHash = await bcrypt.hash(account.password, 12);

  return prisma.user.upsert({
    where: { email: account.email },
    update: {
      password: passwordHash,
      role: account.role,
      name: account.name,
      username: account.username,
      country: account.country,
      city: account.city,
      bio: account.bio,
    },
    create: {
      email: account.email,
      password: passwordHash,
      role: account.role,
      name: account.name,
      username: account.username,
      country: account.country,
      city: account.city,
      bio: account.bio,
    },
    select: { email: true, username: true, role: true },
  });
}

export async function bootstrapDemoUsers() {
  const users = [];

  for (const account of DEMO_ACCOUNTS) {
    users.push(await upsertDemoAccount(account));
  }

  return users;
}

export async function checkDatabaseConnection() {
  await prisma.$queryRaw`SELECT 1`;
}
