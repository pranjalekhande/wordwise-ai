-- Enhanced schema for document management

-- Users table (extends Clerk user data)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  plan_type TEXT DEFAULT 'free', -- free, pro, premium
  word_count_limit INTEGER DEFAULT 10000,
  documents_limit INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table for file uploads and text content
CREATE TABLE IF NOT EXISTS documents (
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

-- Enhanced brand voice templates
CREATE TABLE IF NOT EXISTS brand_voice_templates (
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

-- Enhanced carousel projects
CREATE TABLE IF NOT EXISTS carousel_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  template_id UUID REFERENCES brand_voice_templates(id) ON DELETE SET NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft', -- draft, in_progress, completed, archived
  target_audience TEXT,
  platform_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced slides
CREATE TABLE IF NOT EXISTS slides (
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

-- User settings
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  preferences JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert dummy data
INSERT INTO users (id, email, name, plan_type) VALUES 
('demo-user-123', 'demo@wordwise.ai', 'Demo User', 'pro')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  plan_type = EXCLUDED.plan_type;

-- Insert dummy templates
INSERT INTO brand_voice_templates (id, created_by, name, description, voice_profile, is_public) VALUES 
(
  'template-1',
  'demo-user-123',
  'Professional & Engaging',
  'Perfect for business and professional content',
  '{"tone": "professional", "style": "engaging", "guidelines": ["Use clear, concise language", "Include call-to-actions", "Maintain professional tone"], "max_chars": 280, "hashtag_count": 5}'::jsonb,
  true
),
(
  'template-2', 
  'demo-user-123',
  'Casual & Fun',
  'Great for lifestyle and entertainment content',
  '{"tone": "casual", "style": "fun", "guidelines": ["Use emojis sparingly", "Keep it conversational", "Add personality"], "max_chars": 250, "hashtag_count": 8}'::jsonb,
  true
),
(
  'template-3',
  'demo-user-123', 
  'Educational & Informative',
  'Ideal for tutorials and educational content',
  '{"tone": "informative", "style": "educational", "guidelines": ["Break down complex topics", "Use numbered lists", "Include actionable tips"], "max_chars": 300, "hashtag_count": 6}'::jsonb,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  voice_profile = EXCLUDED.voice_profile;

-- Insert dummy documents
INSERT INTO documents (id, user_id, title, content, word_count, char_count) VALUES 
(
  'doc-1',
  'demo-user-123',
  'Instagram Marketing Strategy 2024',
  'Instagram continues to be one of the most powerful social media platforms for businesses. With over 2 billion monthly active users, it offers incredible opportunities for brand growth and customer engagement. This comprehensive guide will walk you through the essential strategies for Instagram marketing success in 2024.',
  45,
  312
),
(
  'doc-2',
  'demo-user-123', 
  'Content Creation Best Practices',
  'Creating engaging content is the cornerstone of successful social media marketing. Whether you are a small business owner or a content creator, understanding the fundamentals of content creation will help you build a loyal audience and drive meaningful engagement.',
  38,
  267
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  word_count = EXCLUDED.word_count,
  char_count = EXCLUDED.char_count;

-- Insert dummy projects
INSERT INTO carousel_projects (id, user_id, title, description, template_id, document_id, status, target_audience) VALUES 
(
  'project-1',
  'demo-user-123',
  'Instagram Marketing Tips',
  'A carousel explaining key Instagram marketing strategies for small businesses',
  'template-1',
  'doc-1',
  'in_progress',
  'Small business owners'
),
(
  'project-2',
  'demo-user-123',
  'Content Creation Guide', 
  'Step-by-step guide for creating engaging social media content',
  'template-3',
  'doc-2',
  'draft',
  'Content creators'
),
(
  'project-3',
  'demo-user-123',
  'Summer Fashion Trends',
  'Showcase of trending summer fashion items and styling tips',
  'template-2',
  NULL,
  'completed',
  'Fashion enthusiasts'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  template_id = EXCLUDED.template_id,
  document_id = EXCLUDED.document_id,
  status = EXCLUDED.status,
  target_audience = EXCLUDED.target_audience;

-- Insert dummy slides
INSERT INTO slides (project_id, slide_number, title, content, char_count) VALUES 
('project-1', 1, 'Hook', 'Want to grow your Instagram following? Here are 5 proven strategies that actually work! 📈', 95),
('project-1', 2, 'Strategy 1', 'Post consistently at optimal times. Use Instagram Insights to find when your audience is most active.', 105),
('project-1', 3, 'Strategy 2', 'Create engaging Stories with polls, questions, and behind-the-scenes content to boost interaction.', 108),
('project-1', 4, 'Strategy 3', 'Use relevant hashtags strategically. Mix popular and niche hashtags for maximum reach.', 92),
('project-1', 5, 'Call to Action', 'Ready to implement these strategies? Follow for more Instagram tips! What strategy will you try first?', 115),

('project-2', 1, 'Introduction', 'Content creation feeling overwhelming? Break it down with this simple framework! ✨', 89),
('project-2', 2, 'Plan', 'Step 1: Plan your content calendar. Consistency beats perfection every time.', 82),
('project-2', 3, 'Create', 'Step 2: Create with your audience in mind. What problems can you solve for them?', 88),
('project-2', 4, 'Engage', 'Step 3: Engage authentically. Respond to comments and build real connections.', 85),

('project-3', 1, 'Summer Vibes', 'Summer fashion is all about comfort meets style! Here are this seasons must-haves ☀️', 95),
('project-3', 2, 'Trend 1', 'Oversized blazers paired with bike shorts - the perfect balance of professional and casual.', 98),
('project-3', 3, 'Trend 2', 'Bright colors and bold patterns are having a moment. Don not be afraid to make a statement!', 102)
ON CONFLICT (project_id, slide_number) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  char_count = EXCLUDED.char_count;

-- Insert user settings
INSERT INTO user_settings (user_id, preferences, notification_settings) VALUES 
(
  'demo-user-123',
  '{"theme": "light", "language": "en", "auto_save": true, "spell_check": true}'::jsonb,
  '{"email_notifications": true, "push_notifications": false, "weekly_reports": true}'::jsonb
)
ON CONFLICT (user_id) DO UPDATE SET
  preferences = EXCLUDED.preferences,
  notification_settings = EXCLUDED.notification_settings;

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own documents" ON documents FOR ALL USING (user_id = auth.uid()::text);
CREATE POLICY "Users can manage own settings" ON user_settings FOR ALL USING (user_id = auth.uid()::text);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
