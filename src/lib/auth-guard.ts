import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";

export async function requirePageAuth(...roles: Role[]) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  if (roles.length > 0 && !roles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  return session.user;
}
