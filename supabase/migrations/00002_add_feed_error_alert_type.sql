-- Add feed_error to alerts alert_type check constraint
ALTER TABLE alerts
DROP CONSTRAINT IF EXISTS alerts_alert_type_check;

ALTER TABLE alerts
ADD CONSTRAINT alerts_alert_type_check
CHECK (alert_type IN (
  'keyword_match',
  'category_digest',
  'channel_upload',
  'high_score',
  'feed_error'
));
