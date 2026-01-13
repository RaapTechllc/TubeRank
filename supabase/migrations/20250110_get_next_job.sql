-- Get next job with row-level locking to prevent race conditions
CREATE OR REPLACE FUNCTION get_next_job(
  p_job_type text,
  p_max_attempts integer DEFAULT 3
) RETURNS TABLE (
  id uuid,
  job_type text,
  payload jsonb,
  attempts integer,
  scheduled_at timestamp with time zone
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT j.id, j.job_type, j.payload, j.attempts, j.scheduled_at
  FROM job_queue j
  WHERE j.job_type = p_job_type
    AND j.status = 'pending'
    AND j.attempts < p_max_attempts
  ORDER BY j.scheduled_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF FOUND THEN
    UPDATE job_queue
    SET status = 'running',
        started_at = NOW(),
        attempts = attempts + 1
    WHERE id = (SELECT id FROM get_next_job LIMIT 1);

    RETURN QUERY
    SELECT j.id, j.job_type, j.payload, j.attempts, j.scheduled_at
    FROM job_queue j
    WHERE j.id = (SELECT id FROM get_next_job LIMIT 1);
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_next_job TO postgres;
