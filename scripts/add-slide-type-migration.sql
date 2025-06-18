-- Migration: Add slide_type column to slides table
-- Purpose: Support AI-generated slide categorization (hook, key_points, context, etc.)
-- Date: Phase 3.1 - AI Generation feature

-- Add slide_type column to slides table
ALTER TABLE slides 
ADD COLUMN IF NOT EXISTS slide_type TEXT;

-- Add comment for documentation
COMMENT ON COLUMN slides.slide_type IS 'Type of slide content: hook, key_points, context, implications, cta, setup, challenge, resolution, takeaway, problem, solution, features, benefits';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_slides_slide_type ON slides(slide_type);

-- Update existing slides with generic slide_type based on slide_number
UPDATE slides 
SET slide_type = 
  CASE 
    WHEN slide_number = 1 THEN 'hook'
    WHEN slide_number = 2 THEN 'key_points'
    WHEN slide_number = 3 THEN 'context'
    WHEN slide_number = 4 THEN 'implications'
    WHEN slide_number >= 5 THEN 'cta'
    ELSE 'content'
  END
WHERE slide_type IS NULL;

-- Verify the migration
SELECT 
  COUNT(*) as total_slides,
  COUNT(CASE WHEN slide_type IS NOT NULL THEN 1 END) as slides_with_type,
  slide_type,
  COUNT(*) as count_by_type
FROM slides 
GROUP BY slide_type
ORDER BY slide_type; 