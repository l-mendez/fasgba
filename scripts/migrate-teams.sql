-- Migration: Add teams entity between clubs and tournament participation
-- Run this in Supabase SQL editor as a single transaction

BEGIN;

-- Step 1: Create teams table
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (name, club_id)
);

-- Step 2: Data migration - create one team per club that participated in any tournament
INSERT INTO teams (name, club_id)
SELECT DISTINCT c.name, c.id
FROM clubs c
WHERE c.id IN (
    SELECT club_id FROM tournament_club_teams
    UNION
    SELECT club_a_id FROM matches WHERE club_a_id IS NOT NULL
    UNION
    SELECT club_b_id FROM matches WHERE club_b_id IS NOT NULL
);

-- Step 3: Create new tournament_teams join table
CREATE TABLE tournament_teams (
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    PRIMARY KEY (tournament_id, team_id)
);

-- Step 4: Migrate tournament_club_teams -> tournament_teams
INSERT INTO tournament_teams (tournament_id, team_id)
SELECT tct.tournament_id, t.id
FROM tournament_club_teams tct
JOIN teams t ON t.club_id = tct.club_id;

-- Step 5: Add team_id to tournament_team_players and populate
ALTER TABLE tournament_team_players ADD COLUMN team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE;

UPDATE tournament_team_players ttp
SET team_id = t.id
FROM teams t
WHERE t.club_id = ttp.club_id;

-- Step 6: Add team columns to matches and populate
ALTER TABLE matches ADD COLUMN team_a_id INTEGER REFERENCES teams(id);
ALTER TABLE matches ADD COLUMN team_b_id INTEGER REFERENCES teams(id);

UPDATE matches m
SET team_a_id = ta.id, team_b_id = tb.id
FROM teams ta, teams tb
WHERE ta.club_id = m.club_a_id AND tb.club_id = m.club_b_id;

-- Step 7: Drop old columns and constraints from matches
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_round_id_club_a_id_club_b_id_key;
DROP INDEX IF EXISTS idx_matches_club_a;
DROP INDEX IF EXISTS idx_matches_club_b;
ALTER TABLE matches DROP COLUMN club_a_id;
ALTER TABLE matches DROP COLUMN club_b_id;
ALTER TABLE matches ADD CONSTRAINT matches_round_team_unique UNIQUE (round_id, team_a_id, team_b_id);

-- Step 8: Drop old club_id from tournament_team_players
ALTER TABLE tournament_team_players DROP COLUMN club_id;

-- Step 9: Drop old tournament_club_teams table
DROP INDEX IF EXISTS idx_tournament_club_teams_tournament_id;
DROP INDEX IF EXISTS idx_tournament_club_teams_club_id;
DROP TABLE tournament_club_teams;

-- Step 10: Create indexes
CREATE INDEX idx_teams_club_id ON teams(club_id);
CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_tournament_teams_tournament_id ON tournament_teams(tournament_id);
CREATE INDEX idx_tournament_teams_team_id ON tournament_teams(team_id);
CREATE INDEX idx_matches_team_a ON matches(team_a_id);
CREATE INDEX idx_matches_team_b ON matches(team_b_id);

-- Step 11: RLS policies for teams table
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to teams" ON teams
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to manage teams" ON teams
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 12: RLS policies for tournament_teams table
ALTER TABLE tournament_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to tournament_teams" ON tournament_teams
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to manage tournament_teams" ON tournament_teams
    FOR ALL USING (auth.role() = 'authenticated');

COMMIT;
