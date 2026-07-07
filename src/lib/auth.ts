import { Role } from "@prisma/client";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import type { ApiUser } from "@/types/next-auth";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getSessionUser(): Promise<ApiUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      avatar: true,
      bio: true,
      country: true,
      city: true,
      role: true,
    },
  });

  return user;
}

export async function requireAuth(): Promise<ApiUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new ApiError("Unauthorized", 401);
  }
  return user;
}

export async function requireRole(...roles: Role[]): Promise<ApiUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new ApiError("Forbidden", 403);
  }
  return user;
}

export { authOptions };
