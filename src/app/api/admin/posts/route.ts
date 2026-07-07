import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { adminPostVisibilitySchema } from "@/lib/validations/admin";
import { apiError } from "@/lib/api-error";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireRole(Role.ADMIN);
    const { searchParams } = new URL(request.url);
    const hidden = searchParams.get("hidden");
    const search = searchParams.get("search")?.trim();

    const where: {
      isHidden?: boolean;
      content?: { contains: string; mode: "insensitive" };
    } = {};

    if (hidden === "true") where.isHidden = true;
    if (hidden === "false") where.isHidden = false;
    if (search) where.content = { contains: search, mode: "insensitive" };

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { id: true, name: true, username: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    return NextResponse.json({
      posts: posts.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireRole(Role.ADMIN);
    const body = await request.json();
    const parsed = adminPostVisibilitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    await prisma.post.update({
      where: { id: parsed.data.postId },
      data: { isHidden: parsed.data.isHidden },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireRole(Role.ADMIN);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Post id required" }, { status: 400 });
    }

    await prisma.post.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
