ALTER TABLE posts ADD COLUMN metricool_post_id text;
ALTER TABLE posts ADD COLUMN metricool_status text CHECK (metricool_status IN ('pending', 'published', 'failed'));
CREATE INDEX idx_posts_metricool_post_id ON posts(metricool_post_id);
