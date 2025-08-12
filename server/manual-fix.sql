-- Manual fix for the failed migration issue
-- Run this SQL in your PostgreSQL database on Render

-- Option 1: Mark the failed migration as resolved (if the changes were actually applied)
UPDATE _prisma_migrations 
SET finished_at = NOW(), 
    logs = 'Manually resolved - migration file not found locally but changes appear to be applied' 
WHERE migration_name = '20250730000136_add_customer_email' 
AND finished_at IS NULL;

-- Option 2: Mark the failed migration as rolled back (if the changes were NOT applied)
-- Uncomment the line below if Option 1 doesn't work
-- UPDATE _prisma_migrations 
-- SET rolled_back_at = NOW(), 
--     logs = 'Manually rolled back - migration file not found locally' 
-- WHERE migration_name = '20250730000136_add_customer_email' 
-- AND finished_at IS NULL;

-- Check the result
SELECT * FROM _prisma_migrations WHERE migration_name = '20250730000136_add_customer_email'; 