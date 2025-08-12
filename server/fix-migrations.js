const { execSync } = require('child_process');

console.log('🔧 Fixing migration issues...');

try {
  // Try to resolve the specific failed migration
  console.log('📋 Resolving failed migration: 20250730000136_add_customer_email');
  execSync('npx prisma migrate resolve --applied 20250730000136_add_customer_email', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  console.log('✅ Migration resolved successfully');
} catch (error) {
  console.log('⚠️  Could not resolve migration, trying alternative approach...');
  
  try {
    // Try to mark it as rolled back instead
    console.log('🔄 Marking migration as rolled back...');
    execSync('npx prisma migrate resolve --rolled-back 20250730000136_add_customer_email', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    console.log('✅ Migration marked as rolled back');
  } catch (rollbackError) {
    console.log('❌ Could not resolve migration automatically');
    console.log('💡 You may need to manually fix this in your database');
    console.log('💡 Run this SQL in your database:');
    console.log(`
      UPDATE _prisma_migrations 
      SET finished_at = NOW(), logs = 'Manually resolved' 
      WHERE migration_name = '20250730000136_add_customer_email' 
      AND finished_at IS NULL;
    `);
    process.exit(1);
  }
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
  console.log('❌ Migration deployment failed');
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
  console.log('❌ Prisma client generation failed');
  process.exit(1);
}

console.log('🎉 Migration fix completed successfully!'); 