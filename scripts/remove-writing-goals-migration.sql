-- Migration: Remove writing_goals column from user_settings table
-- Date: 2024
-- Description: Remove daily goals functionality from WordWise AI

-- Remove the writing_goals column from user_settings table
ALTER TABLE user_settings DROP COLUMN IF EXISTS writing_goals;

-- Optional: Add a comment explaining the change
COMMENT ON TABLE user_settings IS 'User preferences and notification settings for WordWise AI. Daily goals functionality removed to focus on Instagram carousel creation.'; 