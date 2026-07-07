export function redirectPathForRole(role?: string): string {
  if (role === "ADMIN") return "/admin";
  if (role === "EXPERT") return "/expert";
  return "/dashboard";
}
