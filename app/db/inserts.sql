-- 1️⃣ Insert into Clubs
INSERT INTO clubs (name, address, telephone, mail, schedule)  
VALUES 
('Colegio Nuestra Señora de la Guardia', 'Rodriguez Peña 26', '+123456789', 'contact@clubA.com', 'Mon-Fri 10:00-20:00'),  
('Club de Ajedrez de Quilmes', '456 Park Ave', '+987654321', 'info@clubB.com', 'Tue-Sat 09:00-19:00')  
RETURNING id;

-- 2️⃣ Insert into Users (Without ELO)
INSERT INTO users (name, surname, birth_date, club_id, birth_gender, email, profile_picture, biography, page_admin)  
VALUES  
('Lorenzo', 'Méndez', '2005-05-18', 1, 'Male', 'lolomendez985@gmail.com', 'profile1.jpg', 'Passionate chess player.', true),  
('Alejandro', 'Méndez', '1974-03-19', 2, 'Male', 'amendez@solucionesbancarias.com.ar', 'profile2.jpg', 'Love teaching chess.', false)  
RETURNING id;

-- 3️⃣ Insert into ELOHistory (Tracks All ELO Changes)
INSERT INTO elohistory (user_id, elo, recorded_at)  
VALUES  
(1, 1600, NOW()),  
(2, 1800, NOW());

-- 4️⃣ Assign Club Admins (Many-to-Many)
INSERT INTO club_admins (user_id, club_id)  
VALUES  
(1, 1), -- Lorenzo is admin of Club A  
(2, 2); -- Alejandro is admin of Club B  

-- 5️⃣ Insert into News
INSERT INTO news (title, date, image, extract, text, tags)  
VALUES  
('Nueva Página Web!', NOW(), 'news1.jpg', 'Big event coming up.', 'Full article text...', ARRAY['chess', 'tournament']),  
('New Club Opening', NOW(), 'news2.jpg', 'Exciting new club in town.', 'Details about the club...', ARRAY['club', 'news']);

-- 6️⃣ Insert into Tournaments
INSERT INTO tournaments (title, description, time, place, location, rounds, pace, inscription_details, cost, prizes, image)  
VALUES  
('Spring Chess Open', 'Annual spring tournament.', '10:00 AM', 'City Hall', 'Downtown', 9, '90+30', 'Register online.', '50 USD', 'Cash prizes', 'tournament1.jpg')  
RETURNING id;

-- 7️⃣ Insert Multiple Tournament Dates
INSERT INTO tournament_dates (tournament_id, event_date)  
VALUES  
(1, '2025-05-10'),  
(1, '2025-05-11'),  
(1, '2025-05-12');

-- 8️⃣ Insert into Regulations
INSERT INTO regulations (title, pdf_file, download_link)  
VALUES  
('Official Chess Rules', 'rules.pdf', 'https://example.com/rules.pdf');

-- 9️⃣ Insert into Courses
INSERT INTO courses (title, description, start_date, end_date, schedule, location, address, quota, places_left, price, level, category, image, themes, requisites, includes, cronogram)  
VALUES  
('Beginner Chess Course', 'Learn chess from scratch.', '2025-06-01', '2025-08-01', 'Sat 10:00-12:00', 'Chess Club A', '123 Main St', 20, 15, '100 USD', 'Beginner', 'Strategy', 'course1.jpg', ARRAY['Openings', 'Tactics'], ARRAY['No experience needed'], ARRAY['Workbook', 'Certificate'], 'cronogram1.pdf')  
RETURNING id;

-- 🔟 Assign Course Creators (Many-to-Many)
INSERT INTO course_creators (user_id, course_id)  
VALUES  
(2, 1); -- Alejandro created the Beginner Chess Course
