-- Migration: Add template_type column to carousel_projects table
-- Purpose: Store template type (NEWS/STORY/PRODUCT) for each carousel
-- Date: Phase 9.1 - Template type badges feature

-- Add template_type column to carousel_projects table
ALTER TABLE carousel_projects 
ADD COLUMN IF NOT EXISTS template_type TEXT CHECK (template_type IN ('NEWS', 'STORY', 'PRODUCT'));

-- Set default values for existing projects (can be updated later)
UPDATE carousel_projects 
SET template_type = 'STORY' 
WHERE template_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN carousel_projects.template_type IS 'Type of carousel template: NEWS, STORY, or PRODUCT';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_carousel_projects_template_type ON carousel_projects(template_type);

-- Verify the migration
SELECT 
  COUNT(*) as total_projects,
  COUNT(CASE WHEN template_type IS NOT NULL THEN 1 END) as projects_with_type,
  template_type,
  COUNT(*) as count_by_type
FROM carousel_projects 
GROUP BY template_type
ORDER BY template_type; 