import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { apiError } from "@/lib/api-error";

export async function GET(
  _request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const currentUser = await getSessionUser();

    const profile = await prisma.user.findUnique({
      where: { username: params.username },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        bio: true,
        country: true,
        city: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            plants: true,
            posts: true,
            followers: true,
            following: true,
          },
        },
        posts: {
          where: { isHidden: false },
          orderBy: { createdAt: "desc" },
          take: 12,
          select: {
            id: true,
            content: true,
            imageUrl: true,
            createdAt: true,
            _count: { select: { likes: true, comments: true } },
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let isFollowing = false;
    if (currentUser && currentUser.id !== profile.id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: profile.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    return NextResponse.json({
      profile: {
        ...profile,
        createdAt: profile.createdAt.toISOString(),
        posts: profile.posts.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
        })),
        isFollowing,
        isOwnProfile: currentUser?.id === profile.id,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
