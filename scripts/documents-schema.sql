-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
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

-- Create documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
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

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'documents_user_id_fkey'
    ) THEN
        ALTER TABLE documents ADD CONSTRAINT documents_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Insert demo user
INSERT INTO users (id, email, name, plan_type) VALUES 
('demo-user-123', 'demo@wordwise.ai', 'Demo User', 'pro')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  plan_type = EXCLUDED.plan_type;

-- Disable RLS for demo purposes (enable in production)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

-- Insert some demo documents
INSERT INTO documents (id, user_id, title, content, word_count, char_count) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001',
  'demo-user-123',
  'Instagram Marketing Strategy 2024',
  'Instagram continues to be one of the most powerful social media platforms for businesses. With over 2 billion monthly active users, it offers incredible opportunities for brand growth and customer engagement. This comprehensive guide will walk you through the essential strategies for Instagram marketing success in 2024.

Key strategies include:
1. Consistent posting schedule
2. Engaging with your audience
3. Using relevant hashtags
4. Creating high-quality visual content
5. Leveraging Instagram Stories and Reels

Remember, authenticity is key to building a loyal following on Instagram.',
  89,
  623
),
(
  'doc-demo-2',
  'demo-user-123', 
  'Content Creation Best Practices',
  'Creating engaging content is the cornerstone of successful social media marketing. Whether you are a small business owner or a content creator, understanding the fundamentals of content creation will help you build a loyal audience and drive meaningful engagement.

Essential tips for content creation:
- Know your audience
- Plan your content calendar
- Use high-quality visuals
- Write compelling captions
- Engage with comments and messages
- Analyze your performance metrics

Consistency and authenticity are the keys to long-term success in content creation.',
  76,
  534
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  word_count = EXCLUDED.word_count,
  char_count = EXCLUDED.char_count;
