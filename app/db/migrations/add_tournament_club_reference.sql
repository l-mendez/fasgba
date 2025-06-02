-- Migration: Add created_by_club_id column to tournaments table
-- Date: 2024-12-27
-- Description: Adds a foreign key reference to track which club created each tournament

-- Add the new column to the tournaments table
ALTER TABLE tournaments 
ADD COLUMN created_by_club_id INT REFERENCES clubs(id) ON DELETE SET NULL;

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_tournaments_created_by_club ON tournaments(created_by_club_id);

-- Optional: Update existing tournaments with sample club assignments
-- You can modify these assignments based on your actual data
UPDATE tournaments 
SET created_by_club_id = CASE 
    WHEN id = 1 THEN 1  -- Gran Prix FASGBA 2025 -> Club 1
    WHEN id = 2 THEN 2  -- Torneo Rápido de Mayo -> Club 2
    WHEN id = 3 THEN 1  -- Campeonato Regional Individual -> Club 1
    WHEN id = 4 THEN 2  -- Abierto de Invierno 2025 -> Club 2
    WHEN id = 5 THEN 1  -- Torneo Relámpago Diciembre -> Club 1
    ELSE NULL  -- Leave any other tournaments without assignment
END;

-- Verify the changes
SELECT id, title, created_by_club_id FROM tournaments ORDER BY id; 