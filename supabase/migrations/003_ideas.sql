-- Ideas table
CREATE TABLE ideas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text,
  content text,
  links text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  converted_to uuid REFERENCES posts(id)
);

-- Idea images table
CREATE TABLE idea_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_ideas_created_at ON ideas(created_at);
CREATE INDEX idx_ideas_converted_to ON ideas(converted_to);
CREATE INDEX idx_idea_images_idea_id ON idea_images(idea_id);

-- Auto-update trigger for ideas
CREATE TRIGGER ideas_updated_at
  BEFORE UPDATE ON ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Disable RLS (single user, no auth)
ALTER TABLE ideas DISABLE ROW LEVEL SECURITY;
ALTER TABLE idea_images DISABLE ROW LEVEL SECURITY;
