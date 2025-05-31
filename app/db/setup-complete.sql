-- Complete Database Setup Script for FASGBA
-- Run this in your Supabase SQL editor to set up the database from scratch

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in correct order to avoid foreign key issues)
DROP TABLE IF EXISTS course_creators CASCADE;
DROP TABLE IF EXISTS tournamentdates CASCADE;
DROP TABLE IF EXISTS club_admins CASCADE;
DROP TABLE IF EXISTS user_follows_club CASCADE;
DROP TABLE IF EXISTS elohistory CASCADE;
DROP TABLE IF EXISTS news CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;
DROP TABLE IF EXISTS regulations CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;

-- 1️⃣ Clubs Table
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

-- 3️⃣ ELO History Table
CREATE TABLE elohistory (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    elo INT NOT NULL,
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- 4️⃣ Club Admins Table (Many-to-Many)
CREATE TABLE club_admins (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    club_id INT REFERENCES clubs(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, club_id)
);

-- 5️⃣ User Follows Club Table (Many-to-Many)
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

-- 11️⃣ Course Creators Table (Many-to-Many relationship)
CREATE TABLE course_creators (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    course_id INT REFERENCES courses(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, course_id)
);

-- 🔹 Indexes for Performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_club ON users(club_id);
CREATE INDEX idx_news_date ON news(date);
CREATE INDEX idx_news_club ON news(club_id);
CREATE INDEX idx_news_created_by ON news(created_by_user_id);
CREATE INDEX idx_tournaments_title ON tournaments(title);
CREATE INDEX idx_tournamentdates_tournament_id ON tournamentdates(tournament_id);
CREATE INDEX idx_tournamentdates_event_date ON tournamentdates(event_date);
CREATE INDEX idx_course_creators_user_id ON course_creators(user_id);
CREATE INDEX idx_course_creators_course_id ON course_creators(course_id);
CREATE INDEX idx_elo_user ON elohistory(user_id);

-- 🔒 Row Level Security Policies

-- News Table RLS
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to news" ON news FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to create news" ON news FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow users to update their own news or if admin" ON news FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.auth_id = auth.uid() 
        AND (users.id = news.created_by_user_id OR users.page_admin = true)
    )
);
CREATE POLICY "Allow users to delete their own news or if admin" ON news FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.auth_id = auth.uid() 
        AND (users.id = news.created_by_user_id OR users.page_admin = true)
    )
);

-- Users Table RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow service role to create users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow users to update their own data or if admin" ON users FOR UPDATE USING (
    auth.uid() = users.auth_id OR 
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.page_admin = true)
);
CREATE POLICY "Allow users to delete their own data or if admin" ON users FOR DELETE USING (
    auth.uid() = users.auth_id OR 
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.page_admin = true)
);

-- Tournaments Table RLS (simplified for public access)
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to create tournaments" ON tournaments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update tournaments" ON tournaments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete tournaments" ON tournaments FOR DELETE USING (auth.role() = 'authenticated');

-- Tournament Dates Table RLS (simplified for public access)
ALTER TABLE tournamentdates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to tournamentdates" ON tournamentdates FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to create tournamentdates" ON tournamentdates FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update tournamentdates" ON tournamentdates FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete tournamentdates" ON tournamentdates FOR DELETE USING (auth.role() = 'authenticated');

-- 📊 Insert Sample Data

-- Insert Clubs
INSERT INTO clubs (name, address, telephone, mail, schedule) VALUES 
('Colegio Nuestra Señora de la Guardia', 'Rodriguez Peña 26', '+123456789', 'contact@clubA.com', 'Mon-Fri 10:00-20:00'),  
('Club de Ajedrez de Quilmes', '456 Park Ave', '+987654321', 'info@clubB.com', 'Tue-Sat 09:00-19:00');

-- Insert Users
INSERT INTO users (name, surname, birth_date, club_id, birth_gender, email, profile_picture, biography, page_admin) VALUES  
('Lorenzo', 'Méndez', '2005-05-18', 1, 'Male', 'lolomendez985@gmail.com', 'profile1.jpg', 'Passionate chess player.', true),  
('Alejandro', 'Méndez', '1974-03-19', 2, 'Male', 'amendez@solucionesbancarias.com.ar', 'profile2.jpg', 'Love teaching chess.', false);

-- Insert ELO History
INSERT INTO elohistory (user_id, elo, recorded_at) VALUES  
(1, 1600, NOW()),  
(2, 1800, NOW());

-- Assign Club Admins
INSERT INTO club_admins (user_id, club_id) VALUES  
(1, 1),
(2, 2);

-- Insert News
INSERT INTO news (title, date, image, extract, text, tags) VALUES  
('Nueva Página Web!', NOW(), 'news1.jpg', 'Big event coming up.', 'Full article text...', ARRAY['chess', 'tournament']),  
('New Club Opening', NOW(), 'news2.jpg', 'Exciting new club in town.', 'Details about the club...', ARRAY['club', 'news']);

-- Insert Tournaments
INSERT INTO tournaments (title, description, time, place, location, rounds, pace, inscription_details, cost, prizes, image) VALUES  
('Gran Prix FASGBA 2025', 'Torneo válido para el ranking FIDE con importantes premios en efectivo y trofeos.', '10:00 AM', 'Club de Ajedrez Bahía Blanca', 'Av. Colón 123, Bahía Blanca', 7, '90 min + 30 seg', 'Inscripción abierta hasta el 14 de Abril. Contactar: torneos@fasgba.com.ar', '$5000 general, $3000 sub-18', 'Premios en efectivo para los primeros 5 puestos y trofeos para los 3 primeros.', 'tournament1.jpg'),
('Torneo Rápido de Mayo', 'Torneo rápido conmemorativo del 25 de Mayo con premios especiales.', '14:00 hs', 'Círculo de Ajedrez Punta Alta', 'Rivadavia 450, Punta Alta', 9, '10 min + 5 seg', 'Inscripción abierta hasta el 24 de Mayo.', '$2000 general, $1000 sub-18', 'Premios especiales conmemorativos del 25 de Mayo.', 'tournament2.jpg'),
('Campeonato Regional Individual', 'Campeonato oficial de FASGBA válido para el ranking nacional y FIDE.', '10:00 hs', 'Club de Ajedrez Tres Arroyos', 'San Martín 789, Tres Arroyos', 6, '90 min + 30 seg', 'Inscripción abierta hasta el 5 de Junio.', '$6000 general, $4000 sub-18', 'El campeón obtendrá el título de Campeón Regional 2025 y clasificación directa al Campeonato Argentino.', 'tournament3.jpg'),
('Abierto de Invierno 2025', 'Tradicional torneo de invierno con participación de jugadores de todo el país.', '16:00 hs', 'Club de Ajedrez Monte Hermoso', 'Costanera 234, Monte Hermoso', 6, '60 min + 30 seg', 'Inscripción abierta hasta el 18 de Julio.', '$4000 general, $2500 sub-18', 'Trofeos y medallas para los primeros puestos en cada categoría.', 'tournament4.jpg'),
('Torneo Relámpago Diciembre', 'Torneo relámpago de fin de año con formato especial.', '19:00 hs', 'Círculo de Ajedrez Coronel Suárez', 'Mitre 567, Coronel Suárez', 8, '5 min + 3 seg', 'Inscripción cerrada.', '$1500 general, $800 sub-18', 'Premios sorpresa y copa al ganador.', 'tournament5.jpg');

-- Insert Tournament Dates
INSERT INTO tournamentdates (tournament_id, event_date) VALUES  
-- Gran Prix FASGBA 2025 (single day)
(1, '2025-04-15'),
-- Torneo Rápido de Mayo (single day)
(2, '2025-05-25'),
-- Campeonato Regional Individual (3 days)
(3, '2025-06-10'),
(3, '2025-06-11'),
(3, '2025-06-12'),
-- Abierto de Invierno 2025 (3 days)
(4, '2025-07-20'),
(4, '2025-07-21'),
(4, '2025-07-22'),
-- Torneo Relámpago Diciembre (single day - past tournament)
(5, '2024-12-15');

-- Insert Regulations
INSERT INTO regulations (title, pdf_file, download_link) VALUES  
('Reglamento General de Torneos FASGBA', 'reglamento-general.pdf', 'https://fasgba.com.ar/docs/reglamento-general.pdf'),
('Bases del Gran Prix FASGBA 2025', 'bases-gran-prix-2025.pdf', 'https://fasgba.com.ar/docs/bases-gran-prix-2025.pdf');

-- Insert Courses
INSERT INTO courses (title, description, start_date, end_date, schedule, location, address, quota, places_left, price, level, category, image, themes, requisites, includes, cronogram) VALUES  
('Curso de Ajedrez para Principiantes', 'Aprende ajedrez desde cero con instructores calificados.', '2025-06-01 10:00:00', '2025-08-01 12:00:00', 'Sábados 10:00-12:00', 'Club de Ajedrez Bahía Blanca', 'Av. Colón 123, Bahía Blanca', 20, 15, '$8000 curso completo', 'Principiante', 'Estrategia', 'course1.jpg', ARRAY['Aperturas básicas', 'Tácticas elementales', 'Finales simples'], 'Sin experiencia previa necesaria', 'Manual del estudiante, certificado de participación', 'cronograma-principiantes.pdf'),
('Perfeccionamiento en Ajedrez Avanzado', 'Curso para jugadores con experiencia que buscan mejorar su nivel competitivo.', '2025-07-15 18:00:00', '2025-09-15 20:00:00', 'Martes y Jueves 18:00-20:00', 'Círculo de Ajedrez Punta Alta', 'Rivadavia 450, Punta Alta', 15, 8, '$12000 curso completo', 'Avanzado', 'Competición', 'course2.jpg', ARRAY['Aperturas modernas', 'Estrategia posicional', 'Cálculo de variantes', 'Finales complejos'], 'Rating mínimo 1400 ELO', 'Material de estudio avanzado, análisis personalizado, certificado', 'cronograma-avanzado.pdf');

-- Assign Course Creators
INSERT INTO course_creators (user_id, course_id) VALUES  
(2, 1),
(2, 2); 