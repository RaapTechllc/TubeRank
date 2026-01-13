-- Database Performance Indexes for TubeRank
-- These indexes optimize the most common query patterns identified in the codebase

-- Profile Video Cards Indexes (most queried table)
-- Primary queries: profile_id, video_id, column_status, position
CREATE INDEX IF NOT EXISTS idx_profile_video_cards_profile_id ON profile_video_cards(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_video_cards_video_id ON profile_video_cards(video_id);
CREATE INDEX IF NOT EXISTS idx_profile_video_cards_column_status ON profile_video_cards(column_status);
CREATE INDEX IF NOT EXISTS idx_profile_video_cards_position ON profile_video_cards(position);
-- Composite index for common query pattern: profile + column + position
CREATE INDEX IF NOT EXISTS idx_profile_video_cards_profile_column_pos ON profile_video_cards(profile_id, column_status, position);
-- Composite index for pagination queries
CREATE INDEX IF NOT EXISTS idx_profile_video_cards_profile_created ON profile_video_cards(profile_id, created_at DESC);

-- Videos Indexes
-- Primary queries: youtube_id, channel_id, published_at
CREATE INDEX IF NOT EXISTS idx_videos_youtube_id ON videos(youtube_id);
CREATE INDEX IF NOT EXISTS idx_videos_channel_id ON videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_videos_published_at ON videos(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
-- Composite index for channel videos by date
CREATE INDEX IF NOT EXISTS idx_videos_channel_published ON videos(channel_id, published_at DESC);

-- Profile Sources Indexes
-- Primary queries: profile_id, source_type, source_value
CREATE INDEX IF NOT EXISTS idx_profile_sources_profile_id ON profile_sources(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_sources_source_type ON profile_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_profile_sources_source_value ON profile_sources(source_value);
-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_profile_sources_type_value ON profile_sources(source_type, source_value);

-- Job Queue Indexes (for RSS processing performance)
-- Primary queries: job_type, status, scheduled_at
CREATE INDEX IF NOT EXISTS idx_job_queue_job_type ON job_queue(job_type);
CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_scheduled_at ON job_queue(scheduled_at);
-- Composite index for job processing queries
CREATE INDEX IF NOT EXISTS idx_job_queue_type_status ON job_queue(job_type, status);
CREATE INDEX IF NOT EXISTS idx_job_queue_status_scheduled ON job_queue(status, scheduled_at);
-- Index for payload queries (channel_youtube_id lookups)
CREATE INDEX IF NOT EXISTS idx_job_queue_payload_channel ON job_queue USING GIN ((payload->>'channel_youtube_id'));

-- Scores Indexes
-- Primary queries: video_id, profile_id, overall_score
CREATE INDEX IF NOT EXISTS idx_scores_video_id ON scores(video_id);
CREATE INDEX IF NOT EXISTS idx_scores_profile_id ON scores(profile_id);
CREATE INDEX IF NOT EXISTS idx_scores_overall_score ON scores(overall_score DESC);
-- Composite index for video-profile scoring
CREATE INDEX IF NOT EXISTS idx_scores_video_profile ON scores(video_id, profile_id);

-- Summaries Indexes
-- Primary queries: video_id, profile_id
CREATE INDEX IF NOT EXISTS idx_summaries_video_id ON summaries(video_id);
CREATE INDEX IF NOT EXISTS idx_summaries_profile_id ON summaries(profile_id);
CREATE INDEX IF NOT EXISTS idx_summaries_video_profile ON summaries(video_id, profile_id);

-- Transcripts Indexes
-- Primary queries: video_id
CREATE INDEX IF NOT EXISTS idx_transcripts_video_id ON transcripts(video_id);

-- Channels Indexes
-- Primary queries: youtube_id, last_checked_at
CREATE INDEX IF NOT EXISTS idx_channels_youtube_id ON channels(youtube_id);
CREATE INDEX IF NOT EXISTS idx_channels_last_checked ON channels(last_checked_at);
CREATE INDEX IF NOT EXISTS idx_channels_trust_score ON channels(trust_score DESC);

-- Profiles Indexes
-- Primary queries: is_active, created_at
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- Performance optimization: Analyze tables after index creation
ANALYZE profile_video_cards;
ANALYZE videos;
ANALYZE profile_sources;
ANALYZE job_queue;
ANALYZE scores;
ANALYZE summaries;
ANALYZE transcripts;
ANALYZE channels;
ANALYZE profiles;