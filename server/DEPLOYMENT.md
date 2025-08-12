# Deployment Guide

## Problem
The application was experiencing migration failures on Render due to a failed migration (`20250730000136_add_customer_email`) that was preventing new deployments.

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

1. Connect to your database
2. Check the `_prisma_migrations` table
3. Mark failed migrations as applied:
   ```sql
   UPDATE _prisma_migrations 
   SET finished_at = NOW(), logs = 'Manually resolved' 
   WHERE migration_name = '20250730000136_add_customer_email' 
   AND finished_at IS NULL;
   ```

### Database Reset
If all else fails, you can reset the database:
```bash
npm run db:reset
```
**Warning**: This will delete all data in your database. 