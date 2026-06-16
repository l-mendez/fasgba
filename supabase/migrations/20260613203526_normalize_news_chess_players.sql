-- Normalize legacy news chess player metadata.
--
-- Some editors saved chess blocks with player objects marked as type "user",
-- but the value is a typed display name, not a Supabase Auth UUID. The runtime
-- user lookup never worked because there is no canonical public.users table.
-- Preserve the display names and make the data explicit as custom text.

begin;

create or replace function pg_temp.normalize_news_chess_block(block jsonb)
returns jsonb
language plpgsql
as $$
declare
  normalized jsonb := block;
begin
  if normalized->>'type' not in ('chess', 'chess_game') then
    return normalized;
  end if;

  if normalized #>> '{content,whitePlayer,type}' = 'user' then
    normalized := jsonb_set(
      normalized,
      '{content,whitePlayer,type}',
      to_jsonb('custom'::text),
      false
    );
  end if;

  if normalized #>> '{content,blackPlayer,type}' = 'user' then
    normalized := jsonb_set(
      normalized,
      '{content,blackPlayer,type}',
      to_jsonb('custom'::text),
      false
    );
  end if;

  if normalized #>> '{whitePlayer,type}' = 'user' then
    normalized := jsonb_set(
      normalized,
      '{whitePlayer,type}',
      to_jsonb('custom'::text),
      false
    );
  end if;

  if normalized #>> '{blackPlayer,type}' = 'user' then
    normalized := jsonb_set(
      normalized,
      '{blackPlayer,type}',
      to_jsonb('custom'::text),
      false
    );
  end if;

  return normalized;
end;
$$;

create or replace function pg_temp.normalize_news_chess_players(news_text text)
returns text
language plpgsql
as $$
declare
  parsed jsonb;
  normalized jsonb;
begin
  parsed := news_text::jsonb;

  if jsonb_typeof(parsed) <> 'array' then
    return news_text;
  end if;

  select jsonb_agg(pg_temp.normalize_news_chess_block(block) order by ordinality)
  into normalized
  from jsonb_array_elements(parsed) with ordinality as blocks(block, ordinality);

  return normalized::text;
exception
  when others then
    return news_text;
end;
$$;

with candidates as (
  select
    id,
    pg_temp.normalize_news_chess_players(text) as normalized_text
  from public.news
  where text ~ '"type"[[:space:]]*:[[:space:]]*"user"'
)
update public.news as news
set
  text = candidates.normalized_text,
  updated_at = now()
from candidates
where news.id = candidates.id
  and news.text is distinct from candidates.normalized_text;

commit;
