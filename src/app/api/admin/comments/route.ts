import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { adminCommentVisibilitySchema } from "@/lib/validations/admin";
import { apiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole(Role.ADMIN);

    const comments = await prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { id: true, name: true, username: true } },
        post: { select: { id: true, content: true } },
      },
    });

    return NextResponse.json({
      comments: comments.map((c) => ({
        id: c.id,
        content: c.content,
        isHidden: c.isHidden,
        createdAt: c.createdAt.toISOString(),
        user: c.user,
        postId: c.postId,
        postPreview: c.post.content.slice(0, 80),
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
    const parsed = adminCommentVisibilitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    await prisma.comment.update({
      where: { id: parsed.data.commentId },
      data: { isHidden: parsed.data.isHidden },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
