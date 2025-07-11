-- Drop columns from office_hours_config
ALTER TABLE office_hours_config DROP COLUMN IF EXISTS default_time;

-- Drop columns from weekly_schedule
ALTER TABLE weekly_schedule DROP COLUMN IF EXISTS custom_time;
ALTER TABLE weekly_schedule DROP COLUMN IF EXISTS custom_zoom_link;

-- Drop columns from office_hours_overrides
ALTER TABLE office_hours_overrides DROP COLUMN IF EXISTS time;
ALTER TABLE office_hours_overrides DROP COLUMN IF EXISTS zoom_link;
