// server/cleanup-overflow.js

const { PrismaClient } = require('@prisma/client');

;(async () => {
  const prisma = new PrismaClient();
  // Delete any QuoteItem whose qty exceeds 2³¹−1
  const result = await prisma.quoteItem.deleteMany({
    where: {
      qty: { gt: 2147483647 }
    }
  });
  console.log(`✅ Deleted ${result.count} overflow rows.`);
  await prisma.$disconnect();
})();
