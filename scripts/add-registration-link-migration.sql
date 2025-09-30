-- Migration: Add registration_link column to tournaments table
-- This migration adds support for external registration links (e.g., Google Forms)
-- Run this SQL in your Supabase SQL editor or via psql

-- Add registration_link column to tournaments table
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS registration_link TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN tournaments.registration_link IS 'External registration link (e.g., Google Forms, Typeform) for tournament sign-ups';
