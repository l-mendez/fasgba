-- Enable extensions (Optional: for text search, UUIDs, etc.)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1️⃣ Clubs Table (Created First Since Others Depend on It)
CREATE TABLE clubs (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    address TEXT,
    telephone TEXT,
    mail TEXT UNIQUE,
    schedule TEXT,
    image TEXT
);

-- 2️⃣ Admins Table (Site-wide administrators)
CREATE TABLE admins (
    auth_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 3️⃣ Table for ELO History (Tracks Changes Over Time) - Now uses auth_id
CREATE TABLE elohistory (
    id SERIAL PRIMARY KEY,
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    elo INT NOT NULL,
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- 4️⃣ Table for Club Admins (Many-to-Many Relationship) - Now uses auth_id
CREATE TABLE club_admins (
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    club_id INT REFERENCES clubs(id) ON DELETE CASCADE,
    PRIMARY KEY (auth_id, club_id)
);

-- 5️⃣ Table for Users Following Clubs (Many-to-Many) - Now uses auth_id
CREATE TABLE user_follows_club (
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    club_id INT REFERENCES clubs(id) ON DELETE CASCADE,
    PRIMARY KEY (auth_id, club_id)
);

-- 6️⃣ News Table - Now uses created_by_auth_id
CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    date TIMESTAMP DEFAULT NOW(),
    image TEXT,
    extract TEXT,
    text TEXT NOT NULL,
    tags TEXT[],
    club_id INT REFERENCES clubs(id) ON DELETE SET NULL,
    created_by_auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 7️⃣ Tournaments Table (without direct date fields)
CREATE TABLE tournaments (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    time TEXT,
    place TEXT,
    location TEXT,
    rounds INT CHECK (rounds > 0),
    pace TEXT,
    inscription_details TEXT,
    cost TEXT,
    prizes TEXT,
    image TEXT,
    created_by_club_id INT REFERENCES clubs(id) ON DELETE SET NULL,
    tournament_type TEXT DEFAULT 'individual' CHECK (tournament_type IN ('individual', 'team')),
    players_per_team INTEGER,
    max_teams INTEGER,
    registration_deadline DATE,
    team_match_points JSON
);

-- 8️⃣ Tournament Dates Table (Many-to-Many relationship)
CREATE TABLE tournamentdates (
    id SERIAL PRIMARY KEY,
    tournament_id INT REFERENCES tournaments(id) ON DELETE CASCADE,
    event_date DATE NOT NULL
);

-- 9️⃣ Regulations Table
CREATE TABLE regulations (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    pdf_file TEXT NOT NULL,
    download_link TEXT
);

-- 🔟 Courses Table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    schedule TEXT,
    location TEXT,
    address TEXT,
    quota INT CHECK (quota > 0),
    places_left INT CHECK (places_left >= 0),
    price TEXT,
    level TEXT,
    category TEXT,
    image TEXT,
    themes TEXT[],
    requisites TEXT,
    includes TEXT,
    cronogram TEXT
);

-- 1️⃣1️⃣ Course Creators Table (Many-to-Many relationship) - Now uses auth_id
CREATE TABLE course_creators (
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id INT REFERENCES courses(id) ON DELETE CASCADE,
    PRIMARY KEY (auth_id, course_id)
);

-- 1️⃣2️⃣ Players Table (for tournament games)
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    fide_id TEXT UNIQUE,
    rating INTEGER,
    club_id INTEGER REFERENCES clubs(id) ON DELETE SET NULL
);

-- 1️⃣3️⃣ Tournament Club Teams
CREATE TABLE tournament_club_teams (
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    club_id INTEGER REFERENCES clubs(id) ON DELETE CASCADE,
    PRIMARY KEY (tournament_id, club_id)
);

-- 1️⃣4️⃣ Tournament Team Players
CREATE TABLE tournament_team_players (
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    club_id INTEGER REFERENCES clubs(id) ON DELETE CASCADE,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    PRIMARY KEY (tournament_id, player_id)
);

-- 1️⃣5️⃣ Tournament Registrations (for individual tournaments)
CREATE TABLE tournament_registrations (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tournament_id, player_id)
);

-- 1️⃣6️⃣ Rounds
CREATE TABLE rounds (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL
);

-- 1️⃣7️⃣ Matches (for team tournaments)
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    round_id INTEGER REFERENCES rounds(id) ON DELETE CASCADE,
    club_a_id INTEGER REFERENCES clubs(id),
    club_b_id INTEGER REFERENCES clubs(id),
    UNIQUE (round_id, club_a_id, club_b_id)
);

-- 1️⃣8️⃣ Match Games (team tournaments)
CREATE TABLE match_games (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    white_player_id INTEGER REFERENCES players(id),
    black_player_id INTEGER REFERENCES players(id),
    board_number INTEGER NOT NULL,
    result TEXT CHECK (result IN ('1-0', '0-1', '1/2-1/2', '*')),
    pgn TEXT,
    fen TEXT,
    game_date DATE,
    game_time TIME
);

-- 1️⃣9️⃣ Individual Games (individual tournaments)
CREATE TABLE individual_games (
    id SERIAL PRIMARY KEY,
    round_id INTEGER REFERENCES rounds(id) ON DELETE CASCADE,
    white_player_id INTEGER REFERENCES players(id),
    black_player_id INTEGER REFERENCES players(id),
    board_number INTEGER,
    result TEXT CHECK (result IN ('1-0', '0-1', '1/2-1/2', '*')),
    pgn TEXT,
    fen TEXT,
    game_date DATE,
    game_time TIME
);

-- 🔹 Indexes for Performance
CREATE INDEX idx_admins_auth_id ON admins(auth_id);
CREATE INDEX idx_club_admins_auth_id ON club_admins(auth_id);
CREATE INDEX idx_club_admins_club_id ON club_admins(club_id);
CREATE INDEX idx_user_follows_club_auth_id ON user_follows_club(auth_id);
CREATE INDEX idx_user_follows_club_club_id ON user_follows_club(club_id);
CREATE INDEX idx_news_date ON news(date);
CREATE INDEX idx_news_club ON news(club_id);
CREATE INDEX idx_news_created_by_auth_id ON news(created_by_auth_id);
CREATE INDEX idx_tournaments_title ON tournaments(title);
CREATE INDEX idx_tournaments_created_by_club ON tournaments(created_by_club_id);
CREATE INDEX idx_tournaments_type ON tournaments(tournament_type);
CREATE INDEX idx_tournamentdates_tournament_id ON tournamentdates(tournament_id);
CREATE INDEX idx_tournamentdates_event_date ON tournamentdates(event_date);
CREATE INDEX idx_course_creators_auth_id ON course_creators(auth_id);
CREATE INDEX idx_course_creators_course_id ON course_creators(course_id);
CREATE INDEX idx_elo_auth_id ON elohistory(auth_id);
CREATE INDEX idx_players_fide_id ON players(fide_id);
CREATE INDEX idx_players_rating ON players(rating);
CREATE INDEX idx_players_full_name ON players(full_name);
CREATE INDEX idx_players_club_id ON players(club_id);
CREATE INDEX idx_tournament_club_teams_tournament_id ON tournament_club_teams(tournament_id);
CREATE INDEX idx_tournament_club_teams_club_id ON tournament_club_teams(club_id);
CREATE INDEX idx_tournament_team_players_tournament_id ON tournament_team_players(tournament_id);
CREATE INDEX idx_tournament_team_players_player_id ON tournament_team_players(player_id);
CREATE INDEX idx_tournament_registrations_tournament_id ON tournament_registrations(tournament_id);
CREATE INDEX idx_tournament_registrations_player_id ON tournament_registrations(player_id);
CREATE INDEX idx_rounds_tournament_id ON rounds(tournament_id);
CREATE INDEX idx_rounds_round_number ON rounds(round_number);
CREATE INDEX idx_matches_round_id ON matches(round_id);
CREATE INDEX idx_match_games_match_id ON match_games(match_id);
CREATE INDEX idx_match_games_white_player ON match_games(white_player_id);
CREATE INDEX idx_match_games_black_player ON match_games(black_player_id);
CREATE INDEX idx_individual_games_round_id ON individual_games(round_id);
CREATE INDEX idx_individual_games_white_player ON individual_games(white_player_id);
CREATE INDEX idx_individual_games_black_player ON individual_games(black_player_id);

-- 🔒 Row Level Security Policies

-- Enable RLS for all tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows_club ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournamentdates ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_club_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_games ENABLE ROW LEVEL SECURITY;

-- Admins table policies
CREATE POLICY "Allow public read access to admins" ON admins
    FOR SELECT USING (true);

CREATE POLICY "Allow service role to manage admins" ON admins
    FOR ALL USING (true);

-- Club admins table policies
CREATE POLICY "Allow public read access to club_admins" ON club_admins
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to manage club_admins" ON club_admins
    FOR ALL USING (auth.role() = 'authenticated');

-- User follows club table policies
CREATE POLICY "Allow public read access to user_follows_club" ON user_follows_club
    FOR SELECT USING (true);

CREATE POLICY "Allow users to manage their own follows" ON user_follows_club
    FOR ALL USING (auth.uid() = auth_id)
    WITH CHECK (auth.uid() = auth_id);

-- News table policies
CREATE POLICY "Allow public read access to news" ON news
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to create news" ON news
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow users to update their own news or if admin" ON news
    FOR UPDATE USING (
        auth.uid() = created_by_auth_id OR 
        EXISTS (SELECT 1 FROM admins WHERE auth_id = auth.uid())
    );

CREATE POLICY "Allow users to delete their own news or if admin" ON news
    FOR DELETE USING (
        auth.uid() = created_by_auth_id OR 
        EXISTS (SELECT 1 FROM admins WHERE auth_id = auth.uid())
    );

-- Tournament table policies (public access for now)
CREATE POLICY "Allow public read access to tournaments" ON tournaments
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to create tournaments" ON tournaments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update tournaments" ON tournaments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete tournaments" ON tournaments
    FOR DELETE USING (auth.role() = 'authenticated');

-- Tournament dates table policies
CREATE POLICY "Allow public read access to tournamentdates" ON tournamentdates
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to create tournamentdates" ON tournamentdates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update tournamentdates" ON tournamentdates
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete tournamentdates" ON tournamentdates
    FOR DELETE USING (auth.role() = 'authenticated');

-- Players table policies
CREATE POLICY "Allow public read access to players" ON players
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to manage players" ON players
    FOR ALL USING (auth.role() = 'authenticated');

-- Tournament club teams policies
CREATE POLICY "Allow public read access to tournament_club_teams" ON tournament_club_teams
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to manage tournament_club_teams" ON tournament_club_teams
    FOR ALL USING (auth.role() = 'authenticated');

-- Tournament team players policies
CREATE POLICY "Allow public read access to tournament_team_players" ON tournament_team_players
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to manage tournament_team_players" ON tournament_team_players
    FOR ALL USING (auth.role() = 'authenticated');

-- Tournament registrations policies
CREATE POLICY "Allow public read access to tournament_registrations" ON tournament_registrations
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to manage tournament_registrations" ON tournament_registrations
    FOR ALL USING (auth.role() = 'authenticated');

-- Rounds policies
CREATE POLICY "Allow public read access to rounds" ON rounds
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to manage rounds" ON rounds
    FOR ALL USING (auth.role() = 'authenticated');

-- Matches policies
CREATE POLICY "Allow public read access to matches" ON matches
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to manage matches" ON matches
    FOR ALL USING (auth.role() = 'authenticated');

-- Match games policies
CREATE POLICY "Allow public read access to match_games" ON match_games
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to manage match_games" ON match_games
    FOR ALL USING (auth.role() = 'authenticated');

-- Individual games policies
CREATE POLICY "Allow public read access to individual_games" ON individual_games
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to manage individual_games" ON individual_games
    FOR ALL USING (auth.role() = 'authenticated');
