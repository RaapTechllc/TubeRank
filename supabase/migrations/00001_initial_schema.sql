-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- Job queue for async processing
CREATE TABLE job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_job_queue_pending 
  ON job_queue(job_type, scheduled_at)
  WHERE status = 'pending';

-- Channels table (first-class, not buried in metadata)
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  subscriber_count BIGINT,
  video_count INTEGER,
  trust_score INTEGER DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  notes TEXT,
  followed_since TIMESTAMPTZ DEFAULT now(),
  last_checked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_channels_youtube_id ON channels(youtube_id);

-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'channel_stack', 
    'video_set', 
    'keyword_radar', 
    'category_pulse',
    'custom'
  )),
  system_prompt TEXT,
  score_weights JSONB DEFAULT '{
    "relevance": 35,
    "novelty": 20,
    "actionability": 20,
    "credibility": 15,
    "efficiency": 10
  }',
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_type ON profiles(type);
CREATE INDEX idx_profiles_active ON profiles(is_active) WHERE is_active = true;

-- Profile sources
CREATE TABLE profile_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'channel',
    'video', 
    'keyword',
    'category'
  )),
  source_value TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sources_profile ON profile_sources(profile_id);
CREATE INDEX idx_sources_type ON profile_sources(source_type);
CREATE UNIQUE INDEX idx_sources_unique 
  ON profile_sources(profile_id, source_type, source_value);

-- Videos
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT UNIQUE NOT NULL,
  channel_id TEXT NOT NULL,
  channel_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  published_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  view_count BIGINT,
  like_count BIGINT,
  comment_count BIGINT,
  thumbnail_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_videos_youtube_id ON videos(youtube_id);
CREATE INDEX idx_videos_channel ON videos(channel_id);
CREATE INDEX idx_videos_published ON videos(published_at DESC);

-- Transcripts (allows multiple versions)
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('official', 'fetcher', 'user', 'asr')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'available', 'failed', 'none')),
  content TEXT,
  language TEXT DEFAULT 'en',
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_transcripts_active 
  ON transcripts(video_id) 
  WHERE is_active = true;
CREATE INDEX idx_transcripts_video ON transcripts(video_id);

-- Summaries
CREATE TABLE summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1,
  key_ideas JSONB,
  action_items JSONB,
  claims_to_verify JSONB,
  short_summary TEXT,
  long_summary TEXT,
  entities JSONB,
  tags TEXT[],
  summary_confidence INTEGER DEFAULT 100 CHECK (summary_confidence >= 0 AND summary_confidence <= 100),
  model_used TEXT,
  system_prompt_used TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_summaries_video ON summaries(video_id);
CREATE INDEX idx_summaries_profile ON summaries(profile_id);
CREATE UNIQUE INDEX idx_summaries_video_profile 
  ON summaries(video_id, profile_id);
CREATE INDEX idx_summaries_tags ON summaries USING GIN(tags);

-- Scores
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  relevance_score INTEGER,
  novelty_score INTEGER,
  actionability_score INTEGER,
  credibility_score INTEGER,
  efficiency_score INTEGER,
  time_saved_seconds INTEGER,
  explanation TEXT,
  reason_codes JSONB DEFAULT '{}',
  weights_used JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_scores_video_profile ON scores(video_id, profile_id);
CREATE INDEX idx_scores_overall ON scores(overall_score DESC);
CREATE INDEX idx_scores_profile ON scores(profile_id);

-- Board cards
CREATE TABLE profile_video_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  column_status TEXT NOT NULL DEFAULT 'inbox' CHECK (column_status IN (
    'inbox',
    'recommended',
    'skim',
    'watch',
    'archived'
  )),
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_cards_video_profile 
  ON profile_video_cards(profile_id, video_id);
CREATE INDEX idx_cards_profile_column 
  ON profile_video_cards(profile_id, column_status);

-- Embeddings
CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  embedding vector(768),
  source_type TEXT DEFAULT 'summary',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_embeddings_video_profile 
  ON embeddings(video_id, profile_id);
CREATE INDEX idx_embeddings_vector 
  ON embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'keyword_match',
    'category_digest',
    'channel_upload',
    'high_score'
  )),
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_alerts_unread ON alerts(is_read) WHERE is_read = false;
CREATE INDEX idx_alerts_profile ON alerts(profile_id);

-- User settings (single row)
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tonality JSONB DEFAULT '{}',
  digest_time TIME DEFAULT '08:00',
  digest_enabled BOOLEAN DEFAULT true,
  default_score_threshold INTEGER DEFAULT 75,
  auto_archive_below INTEGER DEFAULT 0,
  theme TEXT DEFAULT 'dark',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_settings_singleton ON user_settings((true));

-- Job runs (observability)
CREATE TABLE job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  items_processed INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_job_runs_name ON job_runs(job_name);
CREATE INDEX idx_job_runs_recent ON job_runs(started_at DESC);

-- Quota tracking
CREATE TABLE quota_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  units_used INTEGER DEFAULT 0,
  units_limit INTEGER,
  cost_usd NUMERIC(10, 4),
  UNIQUE(api_name, date)
);

CREATE INDEX idx_quota_api_date ON quota_usage(api_name, date DESC);

-- Exports
CREATE TABLE exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  format TEXT DEFAULT 'obsidian',
  file_path TEXT,
  content TEXT,
  exported_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_exports_date ON exports(exported_at DESC);

-- Quota increment function
CREATE OR REPLACE FUNCTION increment_quota(
  p_api_name TEXT,
  p_units INTEGER
)
RETURNS void AS $$
BEGIN
  INSERT INTO quota_usage (api_name, date, units_used, units_limit)
  VALUES (p_api_name, CURRENT_DATE, p_units, 10000)
  ON CONFLICT (api_name, date)
  DO UPDATE SET units_used = quota_usage.units_used + p_units;
END;
$$ LANGUAGE plpgsql;
