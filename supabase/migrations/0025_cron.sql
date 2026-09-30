-- Backend Schema §10 #25 / §6.7: daily purge of notifications older than 90 days.
SELECT cron.schedule(
  'purge-old-notifications',
  '0 3 * * *',  -- daily at 3am UTC
  $$
    DELETE FROM public.notifications
    WHERE created_at < now() - INTERVAL '90 days';
  $$
);
