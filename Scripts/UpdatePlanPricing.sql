-- View current plans
SELECT Id, Name, MonthlyPrice, AnnualPrice, Currency, MaxTechnicians, MaxEquipment 
FROM SubscriptionPlans;

-- Update Professional plan pricing
UPDATE SubscriptionPlans 
SET MonthlyPrice = 3500, 
    AnnualPrice = 35000
WHERE Name = 'Professional';

-- Update Enterprise plan pricing
UPDATE SubscriptionPlans 
SET MonthlyPrice = 10000, 
    AnnualPrice = 100000
WHERE Name = 'Enterprise';

-- Verify changes
SELECT Id, Name, MonthlyPrice, AnnualPrice, Currency 
FROM SubscriptionPlans;
