# Deployment Guide

## Problem
The application was experiencing migration failures on Render due to a failed migration (`20250730000136_add_customer_email`) that was preventing new deployments.

**Root Cause**: The migration `20250730000136_add_customer_email` exists in the production database but NOT in the local codebase. This is an "orphaned migration" - it was created during a previous deployment attempt but failed, and the migration file was never committed to the repository.

## Solution
We've implemented a robust startup process that automatically handles failed migrations and database initialization.

## Files Added/Modified

### 1. `startup.js`
- Handles database initialization
- Resolves failed migrations automatically
- Falls back to database reset if needed
- Tests database connection

### 2. `render-start.sh`
- Render-specific startup script
- Handles the complete deployment process

### 3. Updated `index.js`
- Now calls `initializeDatabase()` before starting the server
- Ensures database is ready before accepting requests

### 4. Updated `package.json`
- Added new scripts for database management
- `db:init` - Initialize database
- `db:reset` - Reset database and redeploy migrations
- `db:deploy` - Resolve specific failed migration

## Deployment Process

### For Render:
1. The application will automatically run `startup.js` during deployment
2. This will resolve any failed migrations
3. Deploy all pending migrations
4. Generate the Prisma client
5. Start the server

### Manual Deployment:
```bash
# Initialize database
npm run db:init

# Start server
npm start
```

### If you encounter migration issues:
```bash
# Try to fix the orphaned migration automatically
npm run fix-orphaned-migration

# Or run the comprehensive fix script
npm run fix-migrations

# Reset database (WARNING: This will clear all data)
npm run db:reset

# Or resolve specific failed migration
npm run db:deploy
```

## Environment Variables Required
Make sure these are set in your Render environment:
- `DATABASE_URL` - Your PostgreSQL connection string
- `MANAGER_PASSWORD` - Manager login password
- `EMPLOYEE_PASSWORD` - Employee login password

## Troubleshooting

### Migration Still Failing?
If you still get migration errors, you can manually resolve them:

1. **Connect to your database** (use Render's database console or a PostgreSQL client)
2. **Check the `_prisma_migrations` table** to see the failed migration
3. **Run the SQL fix** (see `manual-fix.sql` file):
   ```sql
   -- Option 1: Mark as resolved (if changes were applied)
   UPDATE _prisma_migrations 
   SET finished_at = NOW(), logs = 'Manually resolved' 
   WHERE migration_name = '20250730000136_add_customer_email' 
   AND finished_at IS NULL;
   
   -- Option 2: Mark as rolled back (if changes were NOT applied)
   UPDATE _prisma_migrations 
   SET rolled_back_at = NOW(), logs = 'Manually rolled back' 
   WHERE migration_name = '20250730000136_add_customer_email' 
   AND finished_at IS NULL;
   ```

### Database Reset
If all else fails, you can reset the database:
```bash
npm run db:reset
```
**Warning**: This will delete all data in your database. 