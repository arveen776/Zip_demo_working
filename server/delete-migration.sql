-- Directly delete the failed migration from the database
-- Run this in your PostgreSQL database on Render

-- Delete the failed migration entry completely
DELETE FROM _prisma_migrations 
WHERE migration_name = '20250730000136_add_customer_email';

-- Verify it's gone
SELECT * FROM _prisma_migrations WHERE migration_name = '20250730000136_add_customer_email';

-- Show all remaining migrations
SELECT migration_name, started_at, finished_at, rolled_back_at, logs FROM _prisma_migrations ORDER BY started_at; 