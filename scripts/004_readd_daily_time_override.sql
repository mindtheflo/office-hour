-- Re-add the time column to the office_hours_overrides table to allow daily time overrides
ALTER TABLE office_hours_overrides ADD COLUMN IF NOT EXISTS time TIME;
