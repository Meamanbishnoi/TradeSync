const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "customSetups" TEXT')
  .then(() => console.log('customSetups column added'))
  .catch(console.error)
  .finally(() => p.$disconnect());
