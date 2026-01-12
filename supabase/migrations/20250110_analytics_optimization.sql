-- Optimized performance analytics using database aggregation
CREATE OR REPLACE FUNCTION get_performance_analytics(
  p_profile_id UUID DEFAULT NULL,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
) RETURNS TABLE (
  date TEXT,
  views BIGINT,
  likes BIGINT,
  comments BIGINT,
  avg_score NUMERIC,
  video_count BIGINT
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(pvc.created_at::date, 'YYYY-MM-DD') as date,
    COALESCE(SUM(v.view_count), 0)::BIGINT as views,
    COALESCE(SUM(v.like_count), 0)::BIGINT as likes,
    COALESCE(SUM(v.comment_count), 0)::BIGINT as comments,
    COALESCE(AVG(s.overall_score), 0)::NUMERIC as avg_score,
    COUNT(*)::BIGINT as video_count
  FROM profile_video_cards pvc
  JOIN videos v ON v.id = pvc.video_id
  LEFT JOIN scores s ON s.video_id = v.id AND s.profile_id = pvc.profile_id
  WHERE pvc.created_at >= p_start_date
    AND pvc.created_at <= p_end_date
    AND (p_profile_id IS NULL OR pvc.profile_id = p_profile_id)
  GROUP BY TO_CHAR(pvc.created_at::date, 'YYYY-MM-DD')
  ORDER BY date;
END;
$$;

-- Get performance summary stats
CREATE OR REPLACE FUNCTION get_performance_summary(
  p_profile_id UUID DEFAULT NULL,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
) RETURNS TABLE (
  total_views BIGINT,
  total_likes BIGINT,
  total_comments BIGINT,
  avg_score NUMERIC,
  total_videos BIGINT,
  views_change NUMERIC,
  score_change NUMERIC
) LANGUAGE plpgsql AS $$
DECLARE
  v_total_views BIGINT;
  v_total_likes BIGINT;
  v_total_comments BIGINT;
  v_total_videos BIGINT;
  v_avg_score NUMERIC;
  v_first_half_views BIGINT;
  v_second_half_views BIGINT;
  v_first_half_score NUMERIC;
  v_second_half_score NUMERIC;
BEGIN
  SELECT
    COALESCE(SUM(v.view_count), 0)::BIGINT,
    COALESCE(SUM(v.like_count), 0)::BIGINT,
    COALESCE(SUM(v.comment_count), 0)::BIGINT,
    COALESCE(AVG(s.overall_score), 0)::NUMERIC,
    COUNT(*)::BIGINT
  INTO v_total_views, v_total_likes, v_total_comments, v_avg_score, v_total_videos
  FROM profile_video_cards pvc
  JOIN videos v ON v.id = pvc.video_id
  LEFT JOIN scores s ON s.video_id = v.id AND s.profile_id = pvc.profile_id
  WHERE pvc.created_at >= p_start_date
    AND pvc.created_at <= p_end_date
    AND (p_profile_id IS NULL OR pvc.profile_id = p_profile_id);

  -- Calculate change: compare first half to second half
  SELECT
    COALESCE(SUM(CASE WHEN pvc.created_at < (p_start_date + (p_end_date - p_start_date)/2) THEN v.view_count ELSE 0 END), 0)::BIGINT
  INTO v_first_half_views
  FROM profile_video_cards pvc
  JOIN videos v ON v.id = pvc.video_id
  WHERE pvc.created_at >= p_start_date
    AND pvc.created_at <= p_end_date
    AND (p_profile_id IS NULL OR pvc.profile_id = p_profile_id);

  SELECT
    COALESCE(SUM(CASE WHEN pvc.created_at >= (p_start_date + (p_end_date - p_start_date)/2) THEN v.view_count ELSE 0 END), 0)::BIGINT
  INTO v_second_half_views
  FROM profile_video_cards pvc
  JOIN videos v ON v.id = pvc.video_id
  WHERE pvc.created_at >= p_start_date
    AND pvc.created_at <= p_end_date
    AND (p_profile_id IS NULL OR pvc.profile_id = p_profile_id);

  RETURN QUERY
  SELECT
    v_total_views,
    v_total_likes,
    v_total_comments,
    v_avg_score,
    v_total_videos,
    CASE
      WHEN v_first_half_views > 0 THEN
        ROUND(((v_second_half_views - v_first_half_views)::NUMERIC / v_first_half_views * 100), 2)
      ELSE 0
    END as views_change,
    0 as score_change; -- Simplified for now
END;
$$;

GRANT EXECUTE ON FUNCTION get_performance_analytics TO postgres;
GRANT EXECUTE ON FUNCTION get_performance_summary TO postgres;
