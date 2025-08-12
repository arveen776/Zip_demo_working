const { execSync } = require('child_process');

console.log('🔧 Fixing migration issues...');

// First, let's check what migrations exist locally vs what's in the database
console.log('📋 Checking migration status...');
try {
  const migrationStatus = execSync('npx prisma migrate status', { 
    encoding: 'utf8',
    cwd: __dirname 
  });
  console.log('Migration status:', migrationStatus);
} catch (error) {
  console.log('Could not check migration status:', error.message);
}

// The issue is that 20250730000136_add_customer_email exists in the database but not locally
// We need to mark it as rolled back since we don't have the migration file
console.log('🔄 Marking orphaned migration as rolled back...');
try {
  execSync('npx prisma migrate resolve --rolled-back 20250730000136_add_customer_email', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  console.log('✅ Migration marked as rolled back');
} catch (error) {
  console.log('⚠️  Could not mark migration as rolled back:', error.message);
  console.log('💡 Trying alternative approach...');
  
  // If that doesn't work, we need to manually fix the database
  console.log('💡 You need to manually fix this in your database. Run this SQL:');
  console.log(`
    UPDATE _prisma_migrations 
    SET finished_at = NOW(), logs = 'Manually resolved - migration file not found locally' 
    WHERE migration_name = '20250730000136_add_customer_email' 
    AND finished_at IS NULL;
  `);
  console.log('💡 Or mark it as rolled back:');
  console.log(`
    UPDATE _prisma_migrations 
    SET rolled_back_at = NOW(), logs = 'Manually rolled back - migration file not found locally' 
    WHERE migration_name = '20250730000136_add_customer_email' 
    AND finished_at IS NULL;
  `);
  process.exit(1);
}

// Now try to deploy migrations
console.log('🚀 Deploying migrations...');
try {
  execSync('npx prisma migrate deploy', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  console.log('✅ Migrations deployed successfully');
} catch (deployError) {
  console.log('❌ Migration deployment failed:', deployError.message);
  process.exit(1);
}

// Generate Prisma client
console.log('🔨 Generating Prisma client...');
try {
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  console.log('✅ Prisma client generated');
} catch (generateError) {
  console.log('❌ Prisma client generation failed:', generateError.message);
  process.exit(1);
}

console.log('🎉 Migration fix completed successfully!'); 