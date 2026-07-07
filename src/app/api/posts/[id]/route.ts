import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { apiError } from "@/lib/api-error";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
        comments: {
          where: { isHidden: false },
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, name: true, username: true, avatar: true } },
          },
        },
        _count: { select: { likes: true, comments: true } },
        ...(user
          ? { likes: { where: { userId: user.id }, select: { id: true } } }
          : {}),
      },
    });

    if (!post || post.isHidden) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      post: {
        id: post.id,
        content: post.content,
        imageUrl: post.imageUrl,
        createdAt: post.createdAt.toISOString(),
        user: post.user,
        _count: post._count,
        likedByUser: user && "likes" in post && Array.isArray(post.likes) ? post.likes.length > 0 : false,
        comments: post.comments.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({ where: { id: params.id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (post.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.post.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
