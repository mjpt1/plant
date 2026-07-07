import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validations/auth";
import { apiError } from "@/lib/api-error";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const email = data.email.toLowerCase();
    const username = data.username.toLowerCase();

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email or username already exists" },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: data.name,
        username,
        password: await hashPassword(data.password),
        country: data.country || null,
        city: data.city || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
