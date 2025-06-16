-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS slides CASCADE;
DROP TABLE IF EXISTS carousel_projects CASCADE;
DROP TABLE IF EXISTS brand_voice_templates CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  plan_type TEXT DEFAULT 'free',
  word_count_limit INTEGER DEFAULT 10000,
  documents_limit INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  word_count INTEGER DEFAULT 0,
  char_count INTEGER DEFAULT 0,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create brand voice templates table
CREATE TABLE brand_voice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  voice_profile JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create carousel projects table
CREATE TABLE carousel_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  template_id UUID REFERENCES brand_voice_templates(id) ON DELETE SET NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft',
  target_audience TEXT,
  platform_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create slides table
CREATE TABLE slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES carousel_projects(id) ON DELETE CASCADE,
  slide_number INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL DEFAULT '',
  char_count INTEGER NOT NULL DEFAULT 0,
  tone TEXT,
  hashtags TEXT[],
  image_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, slide_number)
);

-- Create user settings table
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  preferences JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}',
  writing_goals JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_created_at ON documents(created_at);
CREATE INDEX idx_carousel_projects_user_id ON carousel_projects(user_id);
CREATE INDEX idx_slides_project_id ON slides(project_id);
CREATE INDEX idx_brand_voice_templates_created_by ON brand_voice_templates(created_by);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Disable RLS for demo purposes (enable in production)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE brand_voice_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE carousel_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE slides DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;

-- Insert demo user
INSERT INTO users (id, email, name, plan_type) VALUES 
('demo-user-123', 'demo@wordwise.ai', 'Demo User', 'pro');

-- Insert demo templates
INSERT INTO brand_voice_templates (id, created_by, name, description, voice_profile, is_public) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001',
  'demo-user-123',
  'Professional & Engaging',
  'Perfect for business and professional content',
  '{"tone": "professional", "style": "engaging", "guidelines": ["Use clear, concise language", "Include call-to-actions", "Maintain professional tone"], "max_chars": 280, "hashtag_count": 5}'::jsonb,
  true
),
(
  '550e8400-e29b-41d4-a716-446655440002', 
  'demo-user-123',
  'Casual & Fun',
  'Great for lifestyle and entertainment content',
  '{"tone": "casual", "style": "fun", "guidelines": ["Use emojis sparingly", "Keep it conversational", "Add personality"], "max_chars": 250, "hashtag_count": 8}'::jsonb,
  true
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  'demo-user-123', 
  'Educational & Informative',
  'Ideal for tutorials and educational content',
  '{"tone": "informative", "style": "educational", "guidelines": ["Break down complex topics", "Use numbered lists", "Include actionable tips"], "max_chars": 300, "hashtag_count": 6}'::jsonb,
  true
);

-- Insert demo documents
INSERT INTO documents (id, user_id, title, content, word_count, char_count) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440004',
  'demo-user-123',
  'Instagram Marketing Strategy 2024',
  'Instagram continues to be one of the most powerful social media platforms for businesses. With over 2 billion monthly active users, it offers incredible opportunities for brand growth and customer engagement. This comprehensive guide will walk you through the essential strategies for Instagram marketing success in 2024.',
  45,
  312
),
(
  '550e8400-e29b-41d4-a716-446655440005',
  'demo-user-123', 
  'Content Creation Best Practices',
  'Creating engaging content is the cornerstone of successful social media marketing. Whether you are a small business owner or a content creator, understanding the fundamentals of content creation will help you build a loyal audience and drive meaningful engagement.',
  38,
  267
);

-- Insert demo projects
INSERT INTO carousel_projects (id, user_id, title, description, template_id, document_id, status, target_audience) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440006',
  'demo-user-123',
  'Instagram Marketing Tips',
  'A carousel explaining key Instagram marketing strategies for small businesses',
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440004',
  'in_progress',
  'Small business owners'
),
(
  '550e8400-e29b-41d4-a716-446655440007',
  'demo-user-123',
  'Content Creation Guide', 
  'Step-by-step guide for creating engaging social media content',
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440005',
  'draft',
  'Content creators'
),
(
  '550e8400-e29b-41d4-a716-446655440008',
  'demo-user-123',
  'Summer Fashion Trends',
  'Showcase of trending summer fashion items and styling tips',
  '550e8400-e29b-41d4-a716-446655440002',
  NULL,
  'completed',
  'Fashion enthusiasts'
);

-- Insert demo slides
INSERT INTO slides (project_id, slide_number, title, content, char_count) VALUES 
('550e8400-e29b-41d4-a716-446655440006', 1, 'Hook', 'Want to grow your Instagram following? Here are 5 proven strategies that actually work! 📈', 95),
('550e8400-e29b-41d4-a716-446655440006', 2, 'Strategy 1', 'Post consistently at optimal times. Use Instagram Insights to find when your audience is most active.', 105),
('550e8400-e29b-41d4-a716-446655440006', 3, 'Strategy 2', 'Create engaging Stories with polls, questions, and behind-the-scenes content to boost interaction.', 108),
('550e8400-e29b-41d4-a716-446655440006', 4, 'Strategy 3', 'Use relevant hashtags strategically. Mix popular and niche hashtags for maximum reach.', 92),
('550e8400-e29b-41d4-a716-446655440006', 5, 'Call to Action', 'Ready to implement these strategies? Follow for more Instagram tips! What strategy will you try first?', 115),

('550e8400-e29b-41d4-a716-446655440007', 1, 'Introduction', 'Content creation feeling overwhelming? Break it down with this simple framework! ✨', 89),
('550e8400-e29b-41d4-a716-446655440007', 2, 'Plan', 'Step 1: Plan your content calendar. Consistency beats perfection every time.', 82),
('550e8400-e29b-41d4-a716-446655440007', 3, 'Create', 'Step 2: Create with your audience in mind. What problems can you solve for them?', 88),
('550e8400-e29b-41d4-a716-446655440007', 4, 'Engage', 'Step 3: Engage authentically. Respond to comments and build real connections.', 85),

('550e8400-e29b-41d4-a716-446655440008', 1, 'Summer Vibes', 'Summer fashion is all about comfort meets style! Here are this seasons must-haves ☀️', 95),
('550e8400-e29b-41d4-a716-446655440008', 2, 'Trend 1', 'Oversized blazers paired with bike shorts - the perfect balance of professional and casual.', 98),
('550e8400-e29b-41d4-a716-446655440008', 3, 'Trend 2', 'Bright colors and bold patterns are having a moment. Don not be afraid to make a statement!', 102);

-- Insert user settings
INSERT INTO user_settings (user_id, preferences, notification_settings, writing_goals) VALUES 
(
  'demo-user-123',
  '{"theme": "light", "language": "en", "auto_save": true, "spell_check": true}'::jsonb,
  '{"email_notifications": true, "push_notifications": false, "weekly_reports": true}'::jsonb,
  '{"daily_word_target": 500, "weekly_projects": 3, "preferred_writing_time": "morning"}'::jsonb
);
