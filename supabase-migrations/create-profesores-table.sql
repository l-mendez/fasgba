-- Create profesores table
CREATE TABLE profesores (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  foto VARCHAR(500),
  club_id INTEGER REFERENCES clubs(id) ON DELETE SET NULL,
  anio_nacimiento INTEGER,
  modalidad VARCHAR(20) NOT NULL DEFAULT 'presencial' CHECK (modalidad IN ('presencial', 'virtual', 'ambos')),
  zona VARCHAR(255),
  biografia TEXT,
  email VARCHAR(255),
  telefono VARCHAR(50),
  tarifa_horaria VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profesores ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access for profesores"
  ON profesores FOR SELECT
  USING (true);

-- Service role full access (for admin operations via API)
CREATE POLICY "Service role full access for profesores"
  ON profesores
  USING (auth.role() = 'service_role');
