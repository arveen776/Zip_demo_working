-- Comprehensive fix for the failed migration issue
-- Run this SQL in your PostgreSQL database on Render

-- First, let's see what's in the migrations table
SELECT * FROM _prisma_migrations WHERE migration_name = '20250730000136_add_customer_email';

-- Option 1: Delete the failed migration entry completely (if you're sure it's not needed)
-- DELETE FROM _prisma_migrations WHERE migration_name = '20250730000136_add_customer_email';

-- Option 2: Mark it as applied with a timestamp
UPDATE _prisma_migrations 
SET finished_at = NOW(), 
    logs = 'Manually resolved - migration file not found locally but changes appear to be applied',
    applied_steps_count = 1
WHERE migration_name = '20250730000136_add_customer_email' 
AND finished_at IS NULL;

-- Option 3: If Option 2 doesn't work, try marking it as rolled back
-- UPDATE _prisma_migrations 
-- SET rolled_back_at = NOW(), 
--     logs = 'Manually rolled back - migration file not found locally',
--     applied_steps_count = 0
-- WHERE migration_name = '20250730000136_add_customer_email' 
-- AND finished_at IS NULL;

-- Check the result
SELECT * FROM _prisma_migrations WHERE migration_name = '20250730000136_add_customer_email';

-- Also check all migrations to see the current state
SELECT migration_name, started_at, finished_at, rolled_back_at, logs FROM _prisma_migrations ORDER BY started_at; 