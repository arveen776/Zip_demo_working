const { PrismaClient } = require('@prisma/client');

console.log('🗑️  Deleting failed migration from database...');

async function deleteFailedMigration() {
  try {
    // Connect to database
    console.log('🔍 Connecting to database...');
    const prisma = new PrismaClient();
    await prisma.$connect();
    
    // Delete the failed migration
    console.log('🗑️  Deleting failed migration: 20250730000136_add_customer_email');
    const result = await prisma.$executeRaw`
      DELETE FROM _prisma_migrations 
      WHERE migration_name = '20250730000136_add_customer_email'
    `;
    
    console.log(`✅ Deleted ${result} migration entry(ies)`);
    
    // Verify it's gone
    const remaining = await prisma.$queryRaw`
      SELECT * FROM _prisma_migrations 
      WHERE migration_name = '20250730000136_add_customer_email'
    `;
    
    if (remaining.length === 0) {
      console.log('✅ Migration successfully deleted');
    } else {
      console.log('⚠️  Migration still exists:', remaining);
    }
    
    // Show all remaining migrations
    const allMigrations = await prisma.$queryRaw`
      SELECT migration_name, started_at, finished_at, rolled_back_at, logs 
      FROM _prisma_migrations 
      ORDER BY started_at
    `;
    
    console.log('📋 Remaining migrations:', allMigrations);
    
    await prisma.$disconnect();
    
    console.log('🎉 Migration deletion completed!');
    
  } catch (error) {
    console.error('❌ Failed to delete migration:', error.message);
    process.exit(1);
  }
}

// Run the deletion
deleteFailedMigration()
  .then(() => {
    console.log('✅ Migration deletion successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration deletion failed:', error);
    process.exit(1);
  }); 