-- ============================================================
-- EKO Agency – Schema para Supabase
-- Pega esto entero en Supabase → SQL Editor → Run
-- ============================================================

-- Perfiles (extiende auth.users de Supabase)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin' | 'member' | 'producer'
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conciertos
CREATE TABLE IF NOT EXISTS concerts (
  id BIGSERIAL PRIMARY KEY,
  city TEXT NOT NULL,
  date DATE NOT NULL,
  transport_ida TEXT,
  venue_name TEXT,
  venue_address TEXT,
  venue_capacity TEXT,
  venue_parking BOOLEAN DEFAULT FALSE,
  merch_space BOOLEAN DEFAULT FALSE,
  dj_booth BOOLEAN DEFAULT FALSE,
  micros_sm58 BOOLEAN DEFAULT FALSE,
  iem BOOLEAN DEFAULT FALSE,
  monitors BOOLEAN DEFAULT FALSE,
  visuals_screen BOOLEAN DEFAULT FALSE,
  hotel_name TEXT,
  hotel_address TEXT,
  hotel_phone TEXT,
  hotel_checkin TEXT,
  hotel_checkout TEXT,
  hotel_booking_code TEXT,
  hotel_parking BOOLEAN DEFAULT FALSE,
  distance_hotel_venue TEXT,
  get_in TEXT,
  setup_time TEXT,
  sound_check TEXT,
  doors TEXT,
  show_time TEXT,
  curfew TEXT,
  guest_list INT DEFAULT 0,
  catering TEXT,
  contact_venue_name TEXT,
  contact_venue_phone TEXT,
  contact_booking_name TEXT,
  contact_booking_phone TEXT,
  extra_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participantes por concierto
CREATE TABLE IF NOT EXISTS concert_members (
  id BIGSERIAL PRIMARY KEY,
  concert_id BIGINT NOT NULL REFERENCES concerts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  room TEXT,
  transport_ida TEXT,
  transport_vuelta TEXT,
  UNIQUE(concert_id, user_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE concerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE concert_members ENABLE ROW LEVEL SECURITY;

-- Función helper para comprobar si el usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM profiles WHERE id = auth.uid()),
    FALSE
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- profiles: admin gestiona todo, usuario solo ve el suyo
CREATE POLICY "admin_all_profiles" ON profiles
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "user_view_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- concerts: admin gestiona todo, miembro solo ve los suyos
CREATE POLICY "admin_all_concerts" ON concerts
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "member_view_own_concerts" ON concerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM concert_members
      WHERE concert_id = concerts.id AND user_id = auth.uid()
    )
  );

-- concert_members: admin gestiona todo, miembro ve el suyo
CREATE POLICY "admin_all_concert_members" ON concert_members
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "member_view_own_assignments" ON concert_members
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================
-- PASO FINAL: Registra tu cuenta de admin
-- Después de crear tu usuario en Supabase Auth, ejecuta esto
-- cambiando el email por el tuyo:
-- ============================================================
-- INSERT INTO profiles (id, name, email, role)
-- SELECT id, 'Jhonny', email, 'admin'
-- FROM auth.users
-- WHERE email = 'TU_EMAIL_AQUI';
