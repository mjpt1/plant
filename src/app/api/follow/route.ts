import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { apiError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type");

    if (!userId || (type !== "followers" && type !== "following")) {
      return NextResponse.json(
        { error: "userId and type (followers|following) required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentUser = await getSessionUser();

    if (type === "followers") {
      const follows = await prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: { id: true, name: true, username: true, avatar: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      let followingSet = new Set<string>();
      if (currentUser) {
        const targetIds = follows.map((f) => f.follower.id);
        if (targetIds.length > 0) {
          const userFollows = await prisma.follow.findMany({
            where: {
              followerId: currentUser.id,
              followingId: { in: targetIds },
            },
            select: { followingId: true },
          });
          followingSet = new Set(userFollows.map((f) => f.followingId));
        }
      }

      const users = follows.map((f) => ({
        ...f.follower,
        isFollowing: currentUser ? followingSet.has(f.follower.id) : false,
        isSelf: currentUser?.id === f.follower.id,
      }));

      return NextResponse.json({ users, type });
    }

    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let followingSet = new Set<string>();
    if (currentUser) {
      const targetIds = follows.map((f) => f.following.id);
      if (targetIds.length > 0) {
        const userFollows = await prisma.follow.findMany({
          where: {
            followerId: currentUser.id,
            followingId: { in: targetIds },
          },
          select: { followingId: true },
        });
        followingSet = new Set(userFollows.map((f) => f.followingId));
      }
    }

    const users = follows.map((f) => ({
      ...f.following,
      isFollowing: currentUser ? followingSet.has(f.following.id) : false,
      isSelf: currentUser?.id === f.following.id,
    }));

    return NextResponse.json({ users, type });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { followingId } = body;

    if (!followingId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    if (followingId === user.id) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: followingId } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId,
        },
      },
    });

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      return NextResponse.json({ following: false });
    }

    await prisma.follow.create({
      data: {
        followerId: user.id,
        followingId,
      },
    });

    return NextResponse.json({ following: true });
  } catch (error) {
    return apiError(error);
  }
}
