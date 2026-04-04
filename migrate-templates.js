const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tradeTemplates" TEXT')
  .then(() => console.log('tradeTemplates column added'))
  .catch(console.error)
  .finally(() => p.$disconnect());
