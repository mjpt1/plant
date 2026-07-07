import { execSync } from "node:child_process";

function run(command) {
  execSync(command, { stdio: "inherit", env: process.env });
}

run("npx prisma generate");

if (process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL) {
  console.log("Applying database schema...");
  run("npx prisma db push");
} else {
  console.warn("DATABASE_URL is not set — skipping prisma db push.");
}

run("next build");
