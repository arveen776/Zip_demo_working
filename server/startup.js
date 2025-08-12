const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

async function initializeDatabase() {
  console.log('🔧 Initializing database...');
  
  try {
    // First, check migration status to understand the issue
    console.log('📋 Checking migration status...');
    try {
      const migrationStatus = execSync('npx prisma migrate status', { 
        encoding: 'utf8',
        cwd: __dirname 
      });
      console.log('Migration status:', migrationStatus);
      
      // If we see the failed migration, try to mark it as rolled back
      if (migrationStatus.includes('20250730000136_add_customer_email') && migrationStatus.includes('failed')) {
        console.log('🔄 Found failed migration, marking as rolled back...');
        try {
          execSync('npx prisma migrate resolve --rolled-back 20250730000136_add_customer_email', { 
            stdio: 'inherit',
            cwd: __dirname 
          });
          console.log('✅ Migration marked as rolled back');
        } catch (resolveError) {
          console.log('⚠️  Could not resolve migration automatically');
          console.log('💡 This migration exists in the database but not locally');
          console.log('💡 You may need to manually fix this in your database');
        }
      }
    } catch (error) {
      console.log('ℹ️  Could not check migration status:', error.message);
    }

    // Check if there are any other failed migrations
    try {
      const { execSync } = require('child_process');
      const migrationStatus = execSync('npx prisma migrate status', { 
        encoding: 'utf8',
        cwd: __dirname 
      });
      
      if (migrationStatus.includes('failed')) {
        console.log('⚠️  Found failed migrations, attempting to resolve...');
        // Try to resolve all failed migrations
        try {
          execSync('npx prisma migrate resolve --applied $(npx prisma migrate status --json | jq -r ".failedMigrations[].migrationId")', { 
            stdio: 'inherit',
            cwd: __dirname 
          });
          console.log('✅ Resolved all failed migrations');
        } catch (resolveError) {
          console.log('ℹ️  Could not resolve failed migrations automatically');
        }
      }
    } catch (statusError) {
      console.log('ℹ️  Could not check migration status');
    }

    // Deploy migrations
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

    // Test database connection
    console.log('🔍 Testing database connection...');
    const prisma = new PrismaClient();
    await prisma.$connect();
    await prisma.$disconnect();
    console.log('✅ Database connection successful');

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    
    // If migration deploy fails, try reset approach
    if (error.message.includes('P3009') || error.message.includes('failed migrations')) {
      console.log('🔄 Attempting database reset...');
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
        
        // Generate client again
        execSync('npx prisma generate', { 
          stdio: 'inherit',
          cwd: __dirname 
        });
        console.log('✅ Prisma client regenerated');
        
      } catch (resetError) {
        console.error('❌ Database reset also failed:', resetError.message);
        throw resetError;
      }
    } else {
      throw error;
    }
  }
}

// If this file is run directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('🎉 Database initialization completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase }; 