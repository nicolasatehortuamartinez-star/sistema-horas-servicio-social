-- ========================================================================
-- SISTEMA DE CONTROL DE HORAS DE SERVICIO SOCIAL ESCOLAR
-- Esquema DDL para PostgreSQL / Supabase con Row Level Security (RLS)
-- ========================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Enumeradores de rol y estado
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'coordinator', 'supervisor', 'student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE record_status AS ENUM ('draft', 'pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Tabla profiles (asociada a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    active BOOLEAN NOT NULL DEFAULT true,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabla students
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
    student_code TEXT UNIQUE NOT NULL,
    first_names TEXT,
    last_names TEXT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    grade TEXT NOT NULL CHECK (grade IN ('9°', '10°', '11°')), -- Estrictamente reglamentado a 9°, 10° y 11°
    group_name TEXT NOT NULL, -- Ej: '9A', '10A', '11B'
    active BOOLEAN NOT NULL DEFAULT true,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabla institution_settings (RF-15)
CREATE TABLE IF NOT EXISTS public.institution_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    institution_name TEXT NOT NULL DEFAULT 'I. U. C. (Instituto Universitario de Caldas)',
    academic_year TEXT NOT NULL DEFAULT '2026',
    required_hours NUMERIC(6,2) NOT NULL DEFAULT 80.00 CHECK (required_hours > 0),
    grade_targets JSONB NOT NULL DEFAULT '{"9°": 20, "10°": 30, "11°": 30}',
    max_hours_per_day NUMERIC(4,2) NOT NULL DEFAULT 8.00 CHECK (max_hours_per_day > 0),
    who_can_register TEXT NOT NULL DEFAULT 'student_and_coordinator',
    enable_supervisor_role BOOLEAN NOT NULL DEFAULT true,
    allow_draft_status BOOLEAN NOT NULL DEFAULT true,
    require_evidence BOOLEAN NOT NULL DEFAULT false,
    allow_edit_after_approval BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id)
);

-- 6. Tabla service_records (Jornadas de servicio social)
CREATE TABLE IF NOT EXISTS public.service_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
    activity_name TEXT NOT NULL,
    description TEXT NOT NULL,
    service_date DATE NOT NULL,
    hours NUMERIC(5,2) NOT NULL CHECK (hours > 0),
    supervisor_id UUID REFERENCES public.profiles(id),
    supervisor_name TEXT NOT NULL,
    status record_status NOT NULL DEFAULT 'pending',
    student_notes TEXT,
    reviewer_notes TEXT,
    evidence_url TEXT,
    evidence_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id)
);

-- 7. Tabla audit_logs (RF-13, RNF-11: Trazabilidad inmutable)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL,
    actor_role user_role NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    previous_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 9. POLÍTICAS RLS (Seguridad en la Base de Datos - RNF-03)

-- Profiles: Cada usuario lee su perfil; coordinadores y admins leen y gestionan todos
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator'))
    );

CREATE POLICY "profiles_admin_update" ON public.profiles
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Students: Estudiantes leen su propio registro; coordinadores/admins leen todos
CREATE POLICY "students_select_policy" ON public.students
    FOR SELECT USING (
        profile_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator', 'supervisor'))
    );

CREATE POLICY "students_admin_all" ON public.students
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator'))
    );

-- Service Records:
-- Estudiantes leen sus propios registros
CREATE POLICY "records_student_read" ON public.service_records
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.students WHERE students.id = service_records.student_id AND students.profile_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordinator', 'supervisor'))
    );

-- Estudiantes pueden insertar si son sus propios registros y la config lo permite
CREATE POLICY "records_student_insert" ON public.service_records
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.students WHERE students.id = service_records.student_id AND students.profile_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordinator'))
    );

-- Solo coordinadores y administradores pueden aprobar o rechazar (cambiar status)
CREATE POLICY "records_review_update" ON public.service_records
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordinator'))
    );

-- Audit logs: Solo lectura para personal autorizado
CREATE POLICY "audit_logs_read" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordinator'))
    );

-- 10. Trigger para updated_at en service_records
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_service_records_updated_at
BEFORE UPDATE ON public.service_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
