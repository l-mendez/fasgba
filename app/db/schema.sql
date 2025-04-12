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

-- 2️⃣ Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    birth_date DATE NOT NULL,
    birth_gender TEXT CHECK (birth_gender IN ('Male', 'Female')),
    email TEXT UNIQUE NOT NULL,
    profile_picture TEXT,
    biography TEXT,
    page_admin BOOLEAN DEFAULT FALSE,
    club_id INT REFERENCES clubs(id) ON DELETE SET NULL,
    auth_id UUID UNIQUE
);

-- Add auth_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'auth_id'
    ) THEN
        ALTER TABLE users ADD COLUMN auth_id UUID UNIQUE;
    END IF;
END $$;

-- 3️⃣ Table for ELO History (Tracks Changes Over Time)
CREATE TABLE elohistory (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    elo INT NOT NULL,
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- 4️⃣ Table for Club Admins (Many-to-Many Relationship)
CREATE TABLE club_admins (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    club_id INT REFERENCES clubs(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, club_id)
);

-- 5️⃣ Table for Users Following Clubs (Many-to-Many)
CREATE TABLE user_follows_club (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    club_id INT REFERENCES clubs(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, club_id)
);

-- 6️⃣ News Table
CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    date TIMESTAMP DEFAULT NOW(),
    image TEXT,
    extract TEXT,
    text TEXT NOT NULL,
    tags TEXT[],
    club_id INT REFERENCES clubs(id) ON DELETE SET NULL,
    created_by_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 7️⃣ Tournaments Table
CREATE TABLE tournaments (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
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

-- 8️⃣ Regulations Table
CREATE TABLE regulations (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    pdf_file TEXT NOT NULL,
    download_link TEXT
);

-- 9️⃣ Courses Table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    creator_ids INT[] REFERENCES users(id) ON DELETE SET NULL,
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

-- 🔹 Indexes for Performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_club ON users(club_id);
CREATE INDEX idx_news_date ON news(date);
CREATE INDEX idx_news_club ON news(club_id);
CREATE INDEX idx_news_created_by ON news(created_by_user_id);
CREATE INDEX idx_tournaments_start_date ON tournaments(start_date);
CREATE INDEX idx_elo_user ON elohistory(user_id);

-- 🔒 Row Level Security Policies for News
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read news
CREATE POLICY "Allow public read access to news" ON news
    FOR SELECT USING (true);

-- Allow authenticated users to create news
CREATE POLICY "Allow authenticated users to create news" ON news
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own news or if they're an admin
CREATE POLICY "Allow users to update their own news or if admin" ON news
    FOR UPDATE USING (
        auth.uid() = created_by_user_id OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = created_by_user_id 
            AND page_admin = true
        )
    );

-- Allow users to delete their own news or if they're an admin
CREATE POLICY "Allow users to delete their own news or if admin" ON news
    FOR DELETE USING (
        auth.uid() = created_by_user_id OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = created_by_user_id 
            AND page_admin = true
        )
    );

-- Add new columns to news table
ALTER TABLE news
ADD COLUMN IF NOT EXISTS club_id INT REFERENCES clubs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS created_by_user_id INT REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add new indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_news_club ON news(club_id);
CREATE INDEX IF NOT EXISTS idx_news_created_by ON news(created_by_user_id);

-- Enable RLS if not already enabled
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to news" ON news;
DROP POLICY IF EXISTS "Allow authenticated users to create news" ON news;
DROP POLICY IF EXISTS "Allow users to update their own news or if admin" ON news;
DROP POLICY IF EXISTS "Allow users to delete their own news or if admin" ON news;

-- Create new policies
CREATE POLICY "Allow public read access to news" ON news
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to create news" ON news
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow users to update their own news or if admin" ON news
    FOR UPDATE USING (
        auth.uid() = created_by_user_id OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = created_by_user_id 
            AND page_admin = true
        )
    );

CREATE POLICY "Allow users to delete their own news or if admin" ON news
    FOR DELETE USING (
        auth.uid() = created_by_user_id OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = created_by_user_id 
            AND page_admin = true
        )
    );

-- Enable RLS for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read users
CREATE POLICY "Allow public read access to users" ON users
    FOR SELECT USING (true);

-- Allow service role to create users
CREATE POLICY "Allow service role to create users" ON users
    FOR INSERT WITH CHECK (true);  -- More permissive for testing

-- Allow users to update their own data or if they're an admin
CREATE POLICY "Allow users to update their own data or if admin" ON users
    FOR UPDATE USING (true);  -- More permissive for testing

-- Allow users to delete their own data or if they're an admin
CREATE POLICY "Allow users to delete their own data or if admin" ON users
    FOR DELETE USING (true);  -- More permissive for testing
