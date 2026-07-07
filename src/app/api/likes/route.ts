import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { apiError } from "@/lib/api-error";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.isHidden) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const existing = await prisma.like.findUnique({
      where: { postId_userId: { postId, userId: user.id } },
    });

    if (existing) {
      const count = await prisma.like.count({ where: { postId } });
      return NextResponse.json({ liked: true, count });
    }

    await prisma.like.create({ data: { postId, userId: user.id } });
    const count = await prisma.like.count({ where: { postId } });
    return NextResponse.json({ liked: true, count });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    await prisma.like.deleteMany({ where: { postId, userId: user.id } });
    const count = await prisma.like.count({ where: { postId } });
    return NextResponse.json({ liked: false, count });
  } catch (error) {
    return apiError(error);
  }
}
