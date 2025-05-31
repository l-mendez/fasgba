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

-- 6️⃣ Insert into Tournaments (without date fields)
INSERT INTO tournaments (title, description, time, place, location, rounds, pace, inscription_details, cost, prizes, image)  
VALUES  
('Gran Prix FASGBA 2025', 'Torneo válido para el ranking FIDE con importantes premios en efectivo y trofeos.', '10:00 AM', 'Club de Ajedrez Bahía Blanca', 'Av. Colón 123, Bahía Blanca', 7, '90 min + 30 seg', 'Inscripción abierta hasta el 14 de Abril. Contactar: torneos@fasgba.com.ar', '$5000 general, $3000 sub-18', 'Premios en efectivo para los primeros 5 puestos y trofeos para los 3 primeros.', 'tournament1.jpg'),
('Torneo Rápido de Mayo', 'Torneo rápido conmemorativo del 25 de Mayo con premios especiales.', '14:00 hs', 'Círculo de Ajedrez Punta Alta', 'Rivadavia 450, Punta Alta', 9, '10 min + 5 seg', 'Inscripción abierta hasta el 24 de Mayo.', '$2000 general, $1000 sub-18', 'Premios especiales conmemorativos del 25 de Mayo.', 'tournament2.jpg'),
('Campeonato Regional Individual', 'Campeonato oficial de FASGBA válido para el ranking nacional y FIDE.', '10:00 hs', 'Club de Ajedrez Tres Arroyos', 'San Martín 789, Tres Arroyos', 6, '90 min + 30 seg', 'Inscripción abierta hasta el 5 de Junio.', '$6000 general, $4000 sub-18', 'El campeón obtendrá el título de Campeón Regional 2025 y clasificación directa al Campeonato Argentino.', 'tournament3.jpg'),
('Abierto de Invierno 2025', 'Tradicional torneo de invierno con participación de jugadores de todo el país.', '16:00 hs', 'Club de Ajedrez Monte Hermoso', 'Costanera 234, Monte Hermoso', 6, '60 min + 30 seg', 'Inscripción abierta hasta el 18 de Julio.', '$4000 general, $2500 sub-18', 'Trofeos y medallas para los primeros puestos en cada categoría.', 'tournament4.jpg'),
('Torneo Relámpago Diciembre', 'Torneo relámpago de fin de año con formato especial.', '19:00 hs', 'Círculo de Ajedrez Coronel Suárez', 'Mitre 567, Coronel Suárez', 8, '5 min + 3 seg', 'Inscripción cerrada.', '$1500 general, $800 sub-18', 'Premios sorpresa y copa al ganador.', 'tournament5.jpg')
RETURNING id;

-- 7️⃣ Insert Tournament Dates
INSERT INTO tournamentdates (tournament_id, event_date)  
VALUES  
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

-- 8️⃣ Insert into Regulations
INSERT INTO regulations (title, pdf_file, download_link)  
VALUES  
('Reglamento General de Torneos FASGBA', 'reglamento-general.pdf', 'https://fasgba.com.ar/docs/reglamento-general.pdf'),
('Bases del Gran Prix FASGBA 2025', 'bases-gran-prix-2025.pdf', 'https://fasgba.com.ar/docs/bases-gran-prix-2025.pdf');

-- 9️⃣ Insert into Courses
INSERT INTO courses (title, description, start_date, end_date, schedule, location, address, quota, places_left, price, level, category, image, themes, requisites, includes, cronogram)  
VALUES  
('Curso de Ajedrez para Principiantes', 'Aprende ajedrez desde cero con instructores calificados.', '2025-06-01 10:00:00', '2025-08-01 12:00:00', 'Sábados 10:00-12:00', 'Club de Ajedrez Bahía Blanca', 'Av. Colón 123, Bahía Blanca', 20, 15, '$8000 curso completo', 'Principiante', 'Estrategia', 'course1.jpg', ARRAY['Aperturas básicas', 'Tácticas elementales', 'Finales simples'], 'Sin experiencia previa necesaria', 'Manual del estudiante, certificado de participación', 'cronograma-principiantes.pdf'),
('Perfeccionamiento en Ajedrez Avanzado', 'Curso para jugadores con experiencia que buscan mejorar su nivel competitivo.', '2025-07-15 18:00:00', '2025-09-15 20:00:00', 'Martes y Jueves 18:00-20:00', 'Círculo de Ajedrez Punta Alta', 'Rivadavia 450, Punta Alta', 15, 8, '$12000 curso completo', 'Avanzado', 'Competición', 'course2.jpg', ARRAY['Aperturas modernas', 'Estrategia posicional', 'Cálculo de variantes', 'Finales complejos'], 'Rating mínimo 1400 ELO', 'Material de estudio avanzado, análisis personalizado, certificado', 'cronograma-avanzado.pdf')
RETURNING id;

-- 🔟 Assign Course Creators (Many-to-Many)
INSERT INTO course_creators (user_id, course_id)  
VALUES  
(2, 1); -- Alejandro created the Beginner Chess Course
