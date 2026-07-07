import NextAuth from "next-auth";
import { ensureAuthEnv } from "@/lib/app-url";
import { authOptions } from "@/lib/auth-options";

ensureAuthEnv();

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
