import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAuth } from "@/lib/auth";
import { postSchema } from "@/lib/validations/social";
import { apiError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const followingOnly = searchParams.get("following") === "true";
    const skip = (page - 1) * limit;

    const user = await getSessionUser();

    const where: { isHidden: boolean; userId?: { in: string[] } } = {
      isHidden: false,
    };

    if (followingOnly) {
      if (!user) {
        return NextResponse.json({ posts: [], page, limit, hasMore: false, total: 0 });
      }

      const follows = await prisma.follow.findMany({
        where: { followerId: user.id },
        select: { followingId: true },
      });

      const followingIds = follows.map((f) => f.followingId);
      if (followingIds.length === 0) {
        return NextResponse.json({ posts: [], page, limit, hasMore: false, total: 0 });
      }

      where.userId = { in: followingIds };
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
          _count: {
            select: { likes: true, comments: true },
          },
          ...(user
            ? {
                likes: {
                  where: { userId: user.id },
                  select: { id: true },
                },
              }
            : {}),
        },
      }),
      prisma.post.count({ where }),
    ]);

    let followingSet = new Set<string>();
    if (user) {
      const authorIds = Array.from(new Set(posts.map((post) => post.user.id))).filter(
        (id) => id !== user.id
      );
      if (authorIds.length > 0) {
        const userFollows = await prisma.follow.findMany({
          where: {
            followerId: user.id,
            followingId: { in: authorIds },
          },
          select: { followingId: true },
        });
        followingSet = new Set(userFollows.map((f) => f.followingId));
      }
    }

    const formatted = posts.map((post) => ({
      id: post.id,
      content: post.content,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt.toISOString(),
      user: post.user,
      _count: post._count,
      likedByUser: user
        ? "likes" in post && Array.isArray(post.likes)
          ? post.likes.length > 0
          : false
        : false,
      isFollowing: user ? followingSet.has(post.user.id) : false,
    }));

    return NextResponse.json({
      posts: formatted,
      page,
      limit,
      total,
      hasMore: skip + posts.length < total,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        content: parsed.data.content,
        imageUrl: parsed.data.imageUrl || null,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    return NextResponse.json({
      post: {
        ...post,
        createdAt: post.createdAt.toISOString(),
        likedByUser: false,
        isFollowing: false,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (post.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.post.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
