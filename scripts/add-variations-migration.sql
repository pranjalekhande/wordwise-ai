-- Add variations support to slides table
-- Run this migration to enable content variations functionality

-- Add columns for content variations
ALTER TABLE slides 
ADD COLUMN IF NOT EXISTS variations JSONB DEFAULT '[]';

ALTER TABLE slides 
ADD COLUMN IF NOT EXISTS selected_variation_id TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_slides_variations 
ON slides USING GIN (variations);

CREATE INDEX IF NOT EXISTS idx_slides_selected_variation 
ON slides(selected_variation_id);

-- Add comment for documentation
COMMENT ON COLUMN slides.variations IS 'JSON array storing content variations with different tones for each slide';
COMMENT ON COLUMN slides.selected_variation_id IS 'ID of the currently selected variation from the variations array'; 