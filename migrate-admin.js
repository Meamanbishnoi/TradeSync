const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();

async function main() {
  // Add admin/permission columns
  await p.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false`);
  await p.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isBlocked" BOOLEAN NOT NULL DEFAULT false`);
  await p.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "canAddTrades" BOOLEAN NOT NULL DEFAULT true`);
  await p.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "canViewAnalytics" BOOLEAN NOT NULL DEFAULT true`);
  await p.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "canExport" BOOLEAN NOT NULL DEFAULT true`);
  console.log('Columns added');

  // Seed admin account
  const existing = await p.user.findUnique({ where: { email: 'admin@tradesync.app' } });
  if (!existing) {
    const hashed = await bcrypt.hash('admin@123', 10);
    await p.$executeRawUnsafe(
      `INSERT INTO "User" (id, email, password, name, "isAdmin", "emailVerified", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, 'admin@tradesync.app', $1, 'Admin', true, true, NOW(), NOW())`,
      hashed
    );
    console.log('Admin account created: admin@tradesync.app / admin@123');
  } else {
    // Ensure existing admin account has isAdmin = true
    await p.$executeRawUnsafe(`UPDATE "User" SET "isAdmin" = true WHERE email = 'admin@tradesync.app'`);
    console.log('Admin account already exists, ensured isAdmin=true');
  }
}

main().catch(console.error).finally(() => p.$disconnect());
