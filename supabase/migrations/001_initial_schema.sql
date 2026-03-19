-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Posts table
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform text NOT NULL CHECK (platform IN ('instagram', 'tiktok')),
  caption text,
  post_type text NOT NULL CHECK (post_type IN ('reel', 'carousel', 'story', 'single_image', 'video', 'photo')),
  status text NOT NULL CHECK (status IN ('idea', 'draft', 'scheduled', 'published')) DEFAULT 'idea',
  scheduled_at timestamptz,
  published_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Analytics snapshots table
CREATE TABLE analytics_snapshots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform text NOT NULL CHECK (platform IN ('instagram', 'tiktok')),
  date date NOT NULL,
  impressions integer DEFAULT 0,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  saves integer DEFAULT 0,
  followers integer DEFAULT 0,
  engagement_rate decimal DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (platform, date)
);

-- Post analytics table
CREATE TABLE post_analytics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  impressions integer DEFAULT 0,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  saves integer DEFAULT 0,
  reach integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_posts_platform ON posts(platform);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scheduled_at ON posts(scheduled_at);
CREATE INDEX idx_posts_published_at ON posts(published_at);
CREATE INDEX idx_analytics_snapshots_date ON analytics_snapshots(date);
CREATE INDEX idx_analytics_snapshots_platform ON analytics_snapshots(platform);
CREATE INDEX idx_post_analytics_post_id ON post_analytics(post_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
