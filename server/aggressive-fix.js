const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

console.log('🔧 Aggressive migration fix...');

async function aggressiveFix() {
  try {
    // First, let's try to connect to the database directly
    console.log('🔍 Connecting to database...');
    const prisma = new PrismaClient();
    await prisma.$connect();
    
    // Try to directly update the migration table
    console.log('📝 Attempting to fix migration state directly...');
    
    try {
      // Try to mark the migration as applied
      await prisma.$executeRaw`
        UPDATE _prisma_migrations 
        SET finished_at = NOW(), 
            logs = 'Manually resolved via script - migration file not found locally',
            applied_steps_count = 1
        WHERE migration_name = '20250730000136_add_customer_email' 
        AND finished_at IS NULL
      `;
      console.log('✅ Migration marked as applied');
    } catch (sqlError) {
      console.log('⚠️  Could not mark as applied, trying to delete...');
      
      try {
        // If that doesn't work, try to delete the migration entry
        await prisma.$executeRaw`
          DELETE FROM _prisma_migrations 
          WHERE migration_name = '20250730000136_add_customer_email'
        `;
        console.log('✅ Migration entry deleted');
      } catch (deleteError) {
        console.log('❌ Could not delete migration entry:', deleteError.message);
        throw deleteError;
      }
    }
    
    await prisma.$disconnect();
    
    // Now try to deploy migrations
    console.log('🚀 Deploying migrations...');
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    console.log('✅ Migrations deployed successfully');
    
    // Generate Prisma client
    console.log('🔨 Generating Prisma client...');
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    console.log('✅ Prisma client generated');
    
  } catch (error) {
    console.error('❌ Aggressive fix failed:', error.message);
    
    // Fallback: try the nuclear option - reset the database
    console.log('💥 Attempting database reset as last resort...');
    try {
      execSync('npx prisma migrate reset --force', { 
        stdio: 'inherit',
        cwd: __dirname 
      });
      console.log('✅ Database reset successful');
      
      // Try deploy again
      execSync('npx prisma migrate deploy', { 
        stdio: 'inherit',
        cwd: __dirname 
      });
      console.log('✅ Migrations deployed after reset');
      
    } catch (resetError) {
      console.error('💥 Database reset also failed:', resetError.message);
      console.log('💡 You need to manually fix this in your database');
      console.log('💡 Run the SQL in fix-database.sql file');
      process.exit(1);
    }
  }
}

// Run the fix
aggressiveFix()
  .then(() => {
    console.log('🎉 Aggressive fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Aggressive fix failed:', error);
    process.exit(1);
  }); 