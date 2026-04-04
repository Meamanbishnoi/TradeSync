const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarId" TEXT')
  .then(() => console.log('avatarId column added'))
  .catch(console.error)
  .finally(() => p.$disconnect());
