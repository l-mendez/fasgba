-- Harden public RLS policies so direct Supabase client access matches the
-- authorization model enforced by the Next.js API routes.

begin;

create or replace function public.is_site_admin(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.admins
      where auth_id = user_id
    ),
    false
  );
$$;

create or replace function public.is_any_club_admin(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.club_admins
      where auth_id = user_id
    ),
    false
  );
$$;

create or replace function public.is_club_admin(target_club_id integer, user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    target_club_id is not null
    and exists (
      select 1
      from public.club_admins
      where auth_id = user_id
        and club_id = target_club_id
    ),
    false
  );
$$;

create or replace function public.can_manage_player(target_club_id integer, user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.is_site_admin(user_id)
    or public.is_club_admin(target_club_id, user_id)
    or (target_club_id is null and public.is_any_club_admin(user_id)),
    false
  );
$$;

create or replace function public.can_manage_news(
  target_club_id integer,
  target_author_id uuid,
  user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    target_author_id = user_id
    or public.is_site_admin(user_id)
    or public.is_club_admin(target_club_id, user_id),
    false
  );
$$;

create or replace function public.can_create_tournament_for_club(
  target_club_id integer,
  user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.is_site_admin(user_id)
    or public.is_club_admin(target_club_id, user_id)
    or (target_club_id is null and public.is_any_club_admin(user_id)),
    false
  );
$$;

create or replace function public.can_manage_tournament(
  target_tournament_id integer,
  user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.is_site_admin(user_id)
    or exists (
      select 1
      from public.tournaments t
      where t.id = target_tournament_id
        and public.can_create_tournament_for_club(t.created_by_club_id, user_id)
    ),
    false
  );
$$;

create or replace function public.can_manage_round(target_round_id integer, user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.rounds r
      where r.id = target_round_id
        and public.can_manage_tournament(r.tournament_id, user_id)
    ),
    false
  );
$$;

create or replace function public.can_manage_match(target_match_id integer, user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.matches m
      join public.rounds r on r.id = m.round_id
      where m.id = target_match_id
        and public.can_manage_tournament(r.tournament_id, user_id)
    ),
    false
  );
$$;

create or replace function public.can_manage_team(target_team_id integer, user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.teams t
      where t.id = target_team_id
        and (
          public.is_site_admin(user_id)
          or public.is_club_admin(t.club_id, user_id)
        )
    ),
    false
  );
$$;

create or replace function public.can_manage_match_game(target_game_id integer, user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.match_games g
      where g.id = target_game_id
        and public.can_manage_match(g.match_id, user_id)
    ),
    false
  );
$$;

create or replace function public.can_manage_individual_game(target_game_id integer, user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.individual_games g
      where g.id = target_game_id
        and public.can_manage_round(g.round_id, user_id)
    ),
    false
  );
$$;

revoke all on function public.is_site_admin(uuid) from public;
revoke all on function public.is_any_club_admin(uuid) from public;
revoke all on function public.is_club_admin(integer, uuid) from public;
revoke all on function public.can_manage_player(integer, uuid) from public;
revoke all on function public.can_manage_news(integer, uuid, uuid) from public;
revoke all on function public.can_create_tournament_for_club(integer, uuid) from public;
revoke all on function public.can_manage_tournament(integer, uuid) from public;
revoke all on function public.can_manage_round(integer, uuid) from public;
revoke all on function public.can_manage_match(integer, uuid) from public;
revoke all on function public.can_manage_team(integer, uuid) from public;
revoke all on function public.can_manage_match_game(integer, uuid) from public;
revoke all on function public.can_manage_individual_game(integer, uuid) from public;

grant execute on function public.is_site_admin(uuid) to authenticated;
grant execute on function public.is_any_club_admin(uuid) to authenticated;
grant execute on function public.is_club_admin(integer, uuid) to authenticated;
grant execute on function public.can_manage_player(integer, uuid) to authenticated;
grant execute on function public.can_manage_news(integer, uuid, uuid) to authenticated;
grant execute on function public.can_create_tournament_for_club(integer, uuid) to authenticated;
grant execute on function public.can_manage_tournament(integer, uuid) to authenticated;
grant execute on function public.can_manage_round(integer, uuid) to authenticated;
grant execute on function public.can_manage_match(integer, uuid) to authenticated;
grant execute on function public.can_manage_team(integer, uuid) to authenticated;
grant execute on function public.can_manage_match_game(integer, uuid) to authenticated;
grant execute on function public.can_manage_individual_game(integer, uuid) to authenticated;

alter table public.clubs enable row level security;
alter table public.alumnos enable row level security;

drop policy if exists "Allow public read access to admins" on public.admins;
drop policy if exists "Allow service role to manage admins" on public.admins;
drop policy if exists "Admins are readable by authenticated users" on public.admins;

create policy "Admins are readable by authenticated users"
on public.admins
for select
to authenticated
using (auth.uid() = auth_id or public.is_site_admin(auth.uid()));

drop policy if exists "Allow public read access to club_admins" on public.club_admins;
drop policy if exists "Allow authenticated users to manage club_admins" on public.club_admins;
drop policy if exists "Club admin rows are readable by owners and site admins" on public.club_admins;

create policy "Club admin rows are readable by owners and site admins"
on public.club_admins
for select
to authenticated
using (auth.uid() = auth_id or public.is_site_admin(auth.uid()));

drop policy if exists "Alumno rows are readable by owners and site admins" on public.alumnos;

create policy "Alumno rows are readable by owners and site admins"
on public.alumnos
for select
to authenticated
using (auth.uid() = auth_id or public.is_site_admin(auth.uid()));

drop policy if exists "Allow public read access to user_follows_club" on public.user_follows_club;
drop policy if exists "Allow users to manage their own follows" on public.user_follows_club;
drop policy if exists "Follows are readable by owners and site admins" on public.user_follows_club;
drop policy if exists "Users can insert their own follows" on public.user_follows_club;
drop policy if exists "Users can delete their own follows" on public.user_follows_club;

create policy "Follows are readable by owners and site admins"
on public.user_follows_club
for select
to authenticated
using (auth.uid() = auth_id or public.is_site_admin(auth.uid()));

create policy "Users can insert their own follows"
on public.user_follows_club
for insert
to authenticated
with check (auth.uid() = auth_id);

create policy "Users can delete their own follows"
on public.user_follows_club
for delete
to authenticated
using (auth.uid() = auth_id);

drop policy if exists "Clubs are publicly readable" on public.clubs;
drop policy if exists "Site admins can create clubs" on public.clubs;
drop policy if exists "Site and club admins can update clubs" on public.clubs;
drop policy if exists "Site admins can delete clubs" on public.clubs;

create policy "Clubs are publicly readable"
on public.clubs
for select
using (true);

create policy "Site admins can create clubs"
on public.clubs
for insert
to authenticated
with check (public.is_site_admin(auth.uid()));

create policy "Site and club admins can update clubs"
on public.clubs
for update
to authenticated
using (public.is_site_admin(auth.uid()) or public.is_club_admin(id, auth.uid()))
with check (public.is_site_admin(auth.uid()) or public.is_club_admin(id, auth.uid()));

create policy "Site admins can delete clubs"
on public.clubs
for delete
to authenticated
using (public.is_site_admin(auth.uid()));

drop policy if exists "Allow public read access to news" on public.news;
drop policy if exists "Allow authenticated users to create news" on public.news;
drop policy if exists "Allow users to update their own news or if admin" on public.news;
drop policy if exists "Allow users to delete their own news or if admin" on public.news;
drop policy if exists "News is publicly readable" on public.news;
drop policy if exists "Admins can create scoped news" on public.news;
drop policy if exists "Permitted users can update news" on public.news;
drop policy if exists "Permitted users can delete news" on public.news;

create policy "News is publicly readable"
on public.news
for select
using (true);

create policy "Admins can create scoped news"
on public.news
for insert
to authenticated
with check (
  created_by_auth_id = auth.uid()
  and (
    (club_id is null and public.is_site_admin(auth.uid()))
    or (club_id is not null and (
      public.is_site_admin(auth.uid())
      or public.is_club_admin(club_id, auth.uid())
    ))
  )
);

create policy "Permitted users can update news"
on public.news
for update
to authenticated
using (public.can_manage_news(club_id, created_by_auth_id, auth.uid()))
with check (public.can_manage_news(club_id, created_by_auth_id, auth.uid()));

create policy "Permitted users can delete news"
on public.news
for delete
to authenticated
using (public.can_manage_news(club_id, created_by_auth_id, auth.uid()));

drop policy if exists "Allow public read access to tournaments" on public.tournaments;
drop policy if exists "Allow authenticated users to create tournaments" on public.tournaments;
drop policy if exists "Allow authenticated users to update tournaments" on public.tournaments;
drop policy if exists "Allow authenticated users to delete tournaments" on public.tournaments;
drop policy if exists "Tournaments are publicly readable" on public.tournaments;
drop policy if exists "Admins can create scoped tournaments" on public.tournaments;
drop policy if exists "Permitted users can update tournaments" on public.tournaments;
drop policy if exists "Permitted users can delete tournaments" on public.tournaments;

create policy "Tournaments are publicly readable"
on public.tournaments
for select
using (true);

create policy "Admins can create scoped tournaments"
on public.tournaments
for insert
to authenticated
with check (public.can_create_tournament_for_club(created_by_club_id, auth.uid()));

create policy "Permitted users can update tournaments"
on public.tournaments
for update
to authenticated
using (public.can_manage_tournament(id, auth.uid()))
with check (public.can_create_tournament_for_club(created_by_club_id, auth.uid()));

create policy "Permitted users can delete tournaments"
on public.tournaments
for delete
to authenticated
using (public.can_manage_tournament(id, auth.uid()));

drop policy if exists "Allow public read access to tournamentdates" on public.tournamentdates;
drop policy if exists "Allow authenticated users to create tournamentdates" on public.tournamentdates;
drop policy if exists "Allow authenticated users to update tournamentdates" on public.tournamentdates;
drop policy if exists "Allow authenticated users to delete tournamentdates" on public.tournamentdates;
drop policy if exists "Tournament dates are publicly readable" on public.tournamentdates;
drop policy if exists "Permitted users can create tournament dates" on public.tournamentdates;
drop policy if exists "Permitted users can update tournament dates" on public.tournamentdates;
drop policy if exists "Permitted users can delete tournament dates" on public.tournamentdates;

create policy "Tournament dates are publicly readable"
on public.tournamentdates
for select
using (true);

create policy "Permitted users can create tournament dates"
on public.tournamentdates
for insert
to authenticated
with check (public.can_manage_tournament(tournament_id, auth.uid()));

create policy "Permitted users can update tournament dates"
on public.tournamentdates
for update
to authenticated
using (public.can_manage_tournament(tournament_id, auth.uid()))
with check (public.can_manage_tournament(tournament_id, auth.uid()));

create policy "Permitted users can delete tournament dates"
on public.tournamentdates
for delete
to authenticated
using (public.can_manage_tournament(tournament_id, auth.uid()));

drop policy if exists "Allow public read access to players" on public.players;
drop policy if exists "Allow authenticated users to manage players" on public.players;
drop policy if exists "Players are publicly readable" on public.players;
drop policy if exists "Permitted users can create players" on public.players;
drop policy if exists "Permitted users can update players" on public.players;
drop policy if exists "Permitted users can delete players" on public.players;

create policy "Players are publicly readable"
on public.players
for select
using (true);

create policy "Permitted users can create players"
on public.players
for insert
to authenticated
with check (public.can_manage_player(club_id, auth.uid()));

create policy "Permitted users can update players"
on public.players
for update
to authenticated
using (public.can_manage_player(club_id, auth.uid()))
with check (public.can_manage_player(club_id, auth.uid()));

create policy "Permitted users can delete players"
on public.players
for delete
to authenticated
using (public.can_manage_player(club_id, auth.uid()));

drop policy if exists "Allow public read access to teams" on public.teams;
drop policy if exists "Allow authenticated users to manage teams" on public.teams;
drop policy if exists "Teams are publicly readable" on public.teams;
drop policy if exists "Permitted users can create teams" on public.teams;
drop policy if exists "Permitted users can update teams" on public.teams;
drop policy if exists "Permitted users can delete teams" on public.teams;

create policy "Teams are publicly readable"
on public.teams
for select
using (true);

create policy "Permitted users can create teams"
on public.teams
for insert
to authenticated
with check (public.is_site_admin(auth.uid()) or public.is_club_admin(club_id, auth.uid()));

create policy "Permitted users can update teams"
on public.teams
for update
to authenticated
using (public.is_site_admin(auth.uid()) or public.is_club_admin(club_id, auth.uid()))
with check (public.is_site_admin(auth.uid()) or public.is_club_admin(club_id, auth.uid()));

create policy "Permitted users can delete teams"
on public.teams
for delete
to authenticated
using (public.is_site_admin(auth.uid()) or public.is_club_admin(club_id, auth.uid()));

drop policy if exists "Allow public read access to tournament_teams" on public.tournament_teams;
drop policy if exists "Allow authenticated users to manage tournament_teams" on public.tournament_teams;
drop policy if exists "Tournament teams are publicly readable" on public.tournament_teams;
drop policy if exists "Permitted users can create tournament teams" on public.tournament_teams;
drop policy if exists "Permitted users can update tournament teams" on public.tournament_teams;
drop policy if exists "Permitted users can delete tournament teams" on public.tournament_teams;

create policy "Tournament teams are publicly readable"
on public.tournament_teams
for select
using (true);

create policy "Permitted users can create tournament teams"
on public.tournament_teams
for insert
to authenticated
with check (
  public.can_manage_tournament(tournament_id, auth.uid())
  or public.can_manage_team(team_id, auth.uid())
);

create policy "Permitted users can update tournament teams"
on public.tournament_teams
for update
to authenticated
using (
  public.can_manage_tournament(tournament_id, auth.uid())
  or public.can_manage_team(team_id, auth.uid())
)
with check (
  public.can_manage_tournament(tournament_id, auth.uid())
  or public.can_manage_team(team_id, auth.uid())
);

create policy "Permitted users can delete tournament teams"
on public.tournament_teams
for delete
to authenticated
using (
  public.can_manage_tournament(tournament_id, auth.uid())
  or public.can_manage_team(team_id, auth.uid())
);

drop policy if exists "Allow public read access to tournament_team_players" on public.tournament_team_players;
drop policy if exists "Allow authenticated users to manage tournament_team_players" on public.tournament_team_players;
drop policy if exists "Tournament team players are publicly readable" on public.tournament_team_players;
drop policy if exists "Permitted users can create tournament team players" on public.tournament_team_players;
drop policy if exists "Permitted users can update tournament team players" on public.tournament_team_players;
drop policy if exists "Permitted users can delete tournament team players" on public.tournament_team_players;

create policy "Tournament team players are publicly readable"
on public.tournament_team_players
for select
using (true);

create policy "Permitted users can create tournament team players"
on public.tournament_team_players
for insert
to authenticated
with check (
  public.can_manage_tournament(tournament_id, auth.uid())
  or public.can_manage_team(team_id, auth.uid())
);

create policy "Permitted users can update tournament team players"
on public.tournament_team_players
for update
to authenticated
using (
  public.can_manage_tournament(tournament_id, auth.uid())
  or public.can_manage_team(team_id, auth.uid())
)
with check (
  public.can_manage_tournament(tournament_id, auth.uid())
  or public.can_manage_team(team_id, auth.uid())
);

create policy "Permitted users can delete tournament team players"
on public.tournament_team_players
for delete
to authenticated
using (
  public.can_manage_tournament(tournament_id, auth.uid())
  or public.can_manage_team(team_id, auth.uid())
);

drop policy if exists "Allow public read access to tournament_registrations" on public.tournament_registrations;
drop policy if exists "Allow authenticated users to manage tournament_registrations" on public.tournament_registrations;
drop policy if exists "Tournament registrations are publicly readable" on public.tournament_registrations;
drop policy if exists "Permitted users can create tournament registrations" on public.tournament_registrations;
drop policy if exists "Permitted users can update tournament registrations" on public.tournament_registrations;
drop policy if exists "Permitted users can delete tournament registrations" on public.tournament_registrations;

create policy "Tournament registrations are publicly readable"
on public.tournament_registrations
for select
using (true);

create policy "Permitted users can create tournament registrations"
on public.tournament_registrations
for insert
to authenticated
with check (public.can_manage_tournament(tournament_id, auth.uid()));

create policy "Permitted users can update tournament registrations"
on public.tournament_registrations
for update
to authenticated
using (public.can_manage_tournament(tournament_id, auth.uid()))
with check (public.can_manage_tournament(tournament_id, auth.uid()));

create policy "Permitted users can delete tournament registrations"
on public.tournament_registrations
for delete
to authenticated
using (public.can_manage_tournament(tournament_id, auth.uid()));

drop policy if exists "Allow public read access to rounds" on public.rounds;
drop policy if exists "Allow authenticated users to manage rounds" on public.rounds;
drop policy if exists "Rounds are publicly readable" on public.rounds;
drop policy if exists "Permitted users can create rounds" on public.rounds;
drop policy if exists "Permitted users can update rounds" on public.rounds;
drop policy if exists "Permitted users can delete rounds" on public.rounds;

create policy "Rounds are publicly readable"
on public.rounds
for select
using (true);

create policy "Permitted users can create rounds"
on public.rounds
for insert
to authenticated
with check (public.can_manage_tournament(tournament_id, auth.uid()));

create policy "Permitted users can update rounds"
on public.rounds
for update
to authenticated
using (public.can_manage_tournament(tournament_id, auth.uid()))
with check (public.can_manage_tournament(tournament_id, auth.uid()));

create policy "Permitted users can delete rounds"
on public.rounds
for delete
to authenticated
using (public.can_manage_tournament(tournament_id, auth.uid()));

drop policy if exists "Allow public read access to matches" on public.matches;
drop policy if exists "Allow authenticated users to manage matches" on public.matches;
drop policy if exists "Matches are publicly readable" on public.matches;
drop policy if exists "Permitted users can create matches" on public.matches;
drop policy if exists "Permitted users can update matches" on public.matches;
drop policy if exists "Permitted users can delete matches" on public.matches;

create policy "Matches are publicly readable"
on public.matches
for select
using (true);

create policy "Permitted users can create matches"
on public.matches
for insert
to authenticated
with check (public.can_manage_round(round_id, auth.uid()));

create policy "Permitted users can update matches"
on public.matches
for update
to authenticated
using (public.can_manage_round(round_id, auth.uid()))
with check (public.can_manage_round(round_id, auth.uid()));

create policy "Permitted users can delete matches"
on public.matches
for delete
to authenticated
using (public.can_manage_round(round_id, auth.uid()));

drop policy if exists "Allow public read access to match_games" on public.match_games;
drop policy if exists "Allow authenticated users to manage match_games" on public.match_games;
drop policy if exists "Match games are publicly readable" on public.match_games;
drop policy if exists "Permitted users can create match games" on public.match_games;
drop policy if exists "Permitted users can update match games" on public.match_games;
drop policy if exists "Permitted users can delete match games" on public.match_games;

create policy "Match games are publicly readable"
on public.match_games
for select
using (true);

create policy "Permitted users can create match games"
on public.match_games
for insert
to authenticated
with check (public.can_manage_match(match_id, auth.uid()));

create policy "Permitted users can update match games"
on public.match_games
for update
to authenticated
using (public.can_manage_match(match_id, auth.uid()))
with check (public.can_manage_match(match_id, auth.uid()));

create policy "Permitted users can delete match games"
on public.match_games
for delete
to authenticated
using (public.can_manage_match(match_id, auth.uid()));

drop policy if exists "Allow public read access to individual_games" on public.individual_games;
drop policy if exists "Allow authenticated users to manage individual_games" on public.individual_games;
drop policy if exists "Individual games are publicly readable" on public.individual_games;
drop policy if exists "Permitted users can create individual games" on public.individual_games;
drop policy if exists "Permitted users can update individual games" on public.individual_games;
drop policy if exists "Permitted users can delete individual games" on public.individual_games;

create policy "Individual games are publicly readable"
on public.individual_games
for select
using (true);

create policy "Permitted users can create individual games"
on public.individual_games
for insert
to authenticated
with check (public.can_manage_round(round_id, auth.uid()));

create policy "Permitted users can update individual games"
on public.individual_games
for update
to authenticated
using (public.can_manage_round(round_id, auth.uid()))
with check (public.can_manage_round(round_id, auth.uid()));

create policy "Permitted users can delete individual games"
on public.individual_games
for delete
to authenticated
using (public.can_manage_round(round_id, auth.uid()));

commit;
