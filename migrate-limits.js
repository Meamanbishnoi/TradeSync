const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  await p.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "maxTrades" INTEGER DEFAULT NULL`);
  await p.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "maxImages" INTEGER DEFAULT NULL`);
  console.log('Limit columns added: maxTrades, maxImages');
}

main().catch(console.error).finally(() => p.$disconnect());
