-- Enable extensions (Optional: for text search, UUIDs, etc.)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1️⃣ Clubs Table (Created First Since Others Depend on It)
CREATE TABLE clubs (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    address TEXT,
    telephone TEXT,
    mail TEXT UNIQUE,
    schedule TEXT
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
    image TEXT
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
CREATE INDEX idx_tournamentdates_tournament_id ON tournamentdates(tournament_id);
CREATE INDEX idx_tournamentdates_event_date ON tournamentdates(event_date);
CREATE INDEX idx_course_creators_auth_id ON course_creators(auth_id);
CREATE INDEX idx_course_creators_course_id ON course_creators(course_id);
CREATE INDEX idx_elo_auth_id ON elohistory(auth_id);

-- 🔒 Row Level Security Policies

-- Enable RLS for all tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows_club ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournamentdates ENABLE ROW LEVEL SECURITY;

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
    FOR ALL USING (auth.uid() = auth_id);

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
