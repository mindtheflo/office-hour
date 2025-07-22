-- Consolidated Office Hours Database Schema
-- This script creates the final desired schema state from all migration scripts

-- Create office hours configuration table
CREATE TABLE IF NOT EXISTS office_hours_config (
  id SERIAL PRIMARY KEY,
  default_zoom_link TEXT NOT NULL DEFAULT '',
  admin_timezone VARCHAR(100) DEFAULT 'Europe/Berlin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create office hours overrides table for specific dates
CREATE TABLE IF NOT EXISTS office_hours_overrides (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  time TIME,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create calendar additions tracking table
CREATE TABLE IF NOT EXISTS calendar_additions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  user_ip TEXT,
  user_agent TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create weekly schedule table
CREATE TABLE IF NOT EXISTS weekly_schedule (
  id SERIAL PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7), -- 1=Monday, 7=Sunday
  enabled BOOLEAN NOT NULL DEFAULT true,
  custom_time TIME NOT NULL DEFAULT '15:00:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(day_of_week)
);

-- Insert default configuration
INSERT INTO office_hours_config (default_zoom_link, admin_timezone) 
VALUES ('https://zoom.us/j/example', 'Europe/Berlin')
ON CONFLICT DO NOTHING;

-- Insert default weekly schedule (Monday to Friday enabled)
INSERT INTO weekly_schedule (day_of_week, enabled, custom_time) VALUES
(1, true, '15:00:00'),  -- Monday
(2, true, '15:00:00'),  -- Tuesday
(3, true, '15:00:00'),  -- Wednesday
(4, true, '15:00:00'),  -- Thursday
(5, true, '15:00:00'),  -- Friday
(6, false, '15:00:00'), -- Saturday
(7, false, '15:00:00')  -- Sunday
ON CONFLICT (day_of_week) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_office_hours_overrides_date ON office_hours_overrides(date);
CREATE INDEX IF NOT EXISTS idx_calendar_additions_date ON calendar_additions(date);
CREATE INDEX IF NOT EXISTS idx_weekly_schedule_day ON weekly_schedule(day_of_week);

-- Migration logic: Handle existing installations
-- If tables already exist, ensure they have the correct columns

-- Add admin_timezone column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'office_hours_config' 
                   AND column_name = 'admin_timezone') THEN
        ALTER TABLE office_hours_config ADD COLUMN admin_timezone VARCHAR(100) DEFAULT 'Europe/Berlin';
        UPDATE office_hours_config SET admin_timezone = 'Europe/Berlin' WHERE admin_timezone IS NULL;
    END IF;
END $$;

-- Remove default_time column if it exists (from migration 002)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'office_hours_config' 
               AND column_name = 'default_time') THEN
        ALTER TABLE office_hours_config DROP COLUMN default_time;
    END IF;
END $$;

-- Ensure weekly_schedule has custom_time column and it's NOT NULL
DO $$
BEGIN
    -- Add custom_time column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'weekly_schedule' 
                   AND column_name = 'custom_time') THEN
        ALTER TABLE weekly_schedule ADD COLUMN custom_time TIME;
    END IF;
    
    -- Update existing rows to have a default time if null
    UPDATE weekly_schedule SET custom_time = '15:00:00' WHERE custom_time IS NULL;
    
    -- Make column NOT NULL if it isn't already
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'weekly_schedule' 
               AND column_name = 'custom_time' 
               AND is_nullable = 'YES') THEN
        ALTER TABLE weekly_schedule ALTER COLUMN custom_time SET NOT NULL;
    END IF;
END $$;

-- Remove custom_zoom_link column if it exists (from migration 002)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'weekly_schedule' 
               AND column_name = 'custom_zoom_link') THEN
        ALTER TABLE weekly_schedule DROP COLUMN custom_zoom_link;
    END IF;
END $$;

-- Ensure office_hours_overrides has time column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'office_hours_overrides' 
                   AND column_name = 'time') THEN
        ALTER TABLE office_hours_overrides ADD COLUMN time TIME;
    END IF;
END $$;

-- Remove zoom_link column if it exists (from migration 002)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'office_hours_overrides' 
               AND column_name = 'zoom_link') THEN
        ALTER TABLE office_hours_overrides DROP COLUMN zoom_link;
    END IF;
END $$; 