-- Convert news.date from TIMESTAMP to DATE.
--
-- A news date is an editor-chosen calendar day with no meaningful time-of-day.
-- Storing it as TIMESTAMP forced a phantom 00:00:00 that PostgREST serialized
-- without a 'Z', causing an off-by-one when formatted in America/Argentina/Buenos_Aires.
-- DATE has no time component to misinterpret, matching how event_date / game_date
-- are already modelled. Real instants stay on created_at / updated_at.
--
-- The ::date cast truncates the date portion of a `timestamp without time zone`
-- with no timezone conversion, so existing rows keep their stored calendar day.
-- idx_news_date is rebuilt automatically by the type change.
ALTER TABLE news
  ALTER COLUMN date TYPE DATE USING date::date,
  ALTER COLUMN date SET DEFAULT CURRENT_DATE;
