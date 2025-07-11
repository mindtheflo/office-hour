-- Re-add the custom_time column to the weekly_schedule table
ALTER TABLE weekly_schedule ADD COLUMN IF NOT EXISTS custom_time TIME;

-- Update existing rows to have a default time of 15:00 if it's null
UPDATE weekly_schedule SET custom_time = '15:00:00' WHERE custom_time IS NULL;

-- Now, make the column NOT NULL to ensure every day has a time
ALTER TABLE weekly_schedule ALTER COLUMN custom_time SET NOT NULL;
