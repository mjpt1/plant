import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";
import { buildAuthProviders } from "@/lib/oauth/build-providers";

async function syncUserTokenFields(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      username: true,
      avatar: true,
      bio: true,
      country: true,
      city: true,
      name: true,
    },
  });
}

function profileImage(
  profile: Record<string, unknown> | undefined,
  fallback?: string | null
): string | null {
  if (!profile) return fallback ?? null;
  const picture = profile.picture ?? profile.image ?? profile.avatar_url;
  return typeof picture === "string" ? picture : fallback ?? null;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  providers: buildAuthProviders(),
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.id || account?.provider === "credentials") {
        return true;
      }

      const avatar = profileImage(profile as Record<string, unknown>, user.image);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(avatar ? { avatar } : {}),
          emailVerified: new Date(),
        },
      });

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        const dbUser = await syncUserTokenFields(user.id);
        if (dbUser) {
          token.id = dbUser.id;
          token.username = dbUser.username;
          token.role = dbUser.role;
          token.avatar = dbUser.avatar;
          token.bio = dbUser.bio;
          token.country = dbUser.country;
          token.city = dbUser.city;
          token.name = dbUser.name;
        }
      }

      if (trigger === "update" && session?.user) {
        token.name = session.user.name ?? token.name;
        token.username = session.user.username ?? token.username;
        token.avatar = session.user.avatar ?? token.avatar;
        token.bio = session.user.bio ?? token.bio;
        token.country = session.user.country ?? token.country;
        token.city = session.user.city ?? token.city;
      }

      if (token.id && trigger !== "update" && !user) {
        try {
          const dbUser = await syncUserTokenFields(token.id);
          if (dbUser) {
            token.role = dbUser.role;
            token.username = dbUser.username;
            token.avatar = dbUser.avatar;
            token.bio = dbUser.bio;
            token.country = dbUser.country;
            token.city = dbUser.city;
            token.name = dbUser.name;
          }
        } catch (error) {
          console.error("JWT user refresh failed:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.role = token.role;
        session.user.avatar = token.avatar;
        session.user.bio = token.bio;
        session.user.country = token.country;
        session.user.city = token.city;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  events: {
    async createUser({ user }) {
      if (!user.email) return;

      const base =
        user.email.split("@")[0].replace(/[^a-z0-9]/gi, "_").toLowerCase() ||
        `user_${Date.now()}`;
      let username = base;
      let suffix = 0;

      while (await prisma.user.findUnique({ where: { username } })) {
        suffix += 1;
        username = `${base}_${suffix}`;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          username,
          name: user.name || username,
          avatar: user.image || undefined,
        },
      });
    },
  },
};
