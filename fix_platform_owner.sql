-- Fix Platform Owner User
-- Remove TenantId from simwinga8788@gmail.com to make them a Platform Owner

UPDATE AspNetUsers 
SET TenantId = NULL
WHERE Email = 'simwinga8788@gmail.com';

-- Verify the change
SELECT Id, Email, TenantId, FirstName, LastName 
FROM AspNetUsers 
WHERE Email = 'simwinga8788@gmail.com';
