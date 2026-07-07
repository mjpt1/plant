import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { adminRoleSchema } from "@/lib/validations/admin";
import { apiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireRole(Role.ADMIN);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const role = searchParams.get("role") as Role | null;

    const where: {
      OR?: Array<
        | { name: { contains: string; mode: "insensitive" } }
        | { email: { contains: string; mode: "insensitive" } }
        | { username: { contains: string; mode: "insensitive" } }
      >;
      role?: Role;
    } = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ];
    }
    if (role && Object.values(Role).includes(role)) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        _count: {
          select: { plants: true, posts: true, questions: true, scanHistory: true },
        },
      },
    });

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireRole(Role.ADMIN);
    const body = await request.json();
    const parsed = adminRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { userId, role } = parsed.data;

    if (userId === admin.id && role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Cannot change your own admin role" },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.role === Role.ADMIN && role !== Role.ADMIN) {
      const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the last admin" },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, username: true, role: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return apiError(error);
  }
}
