-- Create office hours configuration table
CREATE TABLE IF NOT EXISTS office_hours_config (
  id SERIAL PRIMARY KEY,
  default_time TIME NOT NULL DEFAULT '15:00:00',
  default_zoom_link TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create office hours overrides table for specific dates
CREATE TABLE IF NOT EXISTS office_hours_overrides (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  time TIME,
  zoom_link TEXT,
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
  custom_time TIME,
  custom_zoom_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(day_of_week)
);

-- Insert default configuration
INSERT INTO office_hours_config (default_time, default_zoom_link) 
VALUES ('15:00:00', 'https://zoom.us/j/example')
ON CONFLICT DO NOTHING;

-- Insert default weekly schedule (Monday to Friday enabled)
INSERT INTO weekly_schedule (day_of_week, enabled) VALUES
(1, true),  -- Monday
(2, true),  -- Tuesday
(3, true),  -- Wednesday
(4, true),  -- Thursday
(5, true),  -- Friday
(6, false), -- Saturday
(7, false)  -- Sunday
ON CONFLICT (day_of_week) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_office_hours_overrides_date ON office_hours_overrides(date);
CREATE INDEX IF NOT EXISTS idx_calendar_additions_date ON calendar_additions(date);
CREATE INDEX IF NOT EXISTS idx_weekly_schedule_day ON weekly_schedule(day_of_week);
