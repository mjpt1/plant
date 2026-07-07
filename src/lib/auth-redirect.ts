import { Role } from "@prisma/client";

export function redirectPathForRole(role?: Role | string): string {
  if (role === Role.ADMIN || role === "ADMIN") return "/admin";
  if (role === Role.EXPERT || role === "EXPERT") return "/expert";
  return "/dashboard";
}
