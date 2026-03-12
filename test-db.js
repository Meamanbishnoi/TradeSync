const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const trades = await prisma.trade.findMany({ orderBy: { id: 'desc' }, take: 2 });
  console.log(JSON.stringify(trades, null, 2));
}
main();
