-- =========================================================
-- SKRIP DATABASE & STORAGE SUPABASE UNTUK DMS SETDA KAB. GUNUNGKIDUL
-- Salin dan jalankan skrip ini di SQL Editor pada Dashboard Supabase Anda
-- =========================================================

-- 1. Tabel Dokumen (documents)
CREATE TABLE IF NOT EXISTS public.documents (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Surat Keputusan',
    status TEXT NOT NULL DEFAULT 'Approved',
    size TEXT NOT NULL DEFAULT '1.5 MB',
    version TEXT NOT NULL DEFAULT 'v1.0',
    date TEXT NOT NULL,
    dateFull TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploader TEXT NOT NULL DEFAULT 'Staf Bagian Umum',
    type TEXT NOT NULL DEFAULT 'pdf',
    fileUrl TEXT,
    "desc" TEXT,
    tags TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Kategori (categories)
CREATE TABLE IF NOT EXISTS public.categories (
    id BIGINT PRIMARY KEY,
    title TEXT NOT NULL UNIQUE,
    "desc" TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Staf (staff)
CREATE TABLE IF NOT EXISTS public.staff (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'Staff',
    status TEXT NOT NULL DEFAULT 'Active',
    lastActive TEXT DEFAULT 'Baru saja',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) - Aktifkan & Izinkan Akses Publik Anon
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read and write documents" ON public.documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read and write categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read and write staff" ON public.staff FOR ALL USING (true) WITH CHECK (true);

-- 4. Seed Data Awal Kategori
INSERT INTO public.categories (id, title, "desc", status) VALUES
(1, 'Surat Keputusan', 'Dokumen keputusan resmi dan penetapan pimpinan.', 'active'),
(2, 'Laporan Keuangan', 'Laporan realisasi anggaran, keuangan, dan hasil audit.', 'active'),
(3, 'Kepegawaian', 'Berkas kepegawaian, SK jabatan, dan kontrak staf.', 'active'),
(4, 'Arsip Umum', 'Arsip umum dan dokumentasi administrasi daerah.', 'active'),
(5, 'MoU & Perjanjian', 'Nota kesepahaman dan perjanjian kerja sama.', 'active')
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Data Awal Staf
INSERT INTO public.staff (id, name, email, role, status, lastActive) VALUES
(1, 'Budi Santoso', 'budi.s@setda.gov.id', 'Admin', 'Active', 'Just now'),
(2, 'Ahmad Fauzi', 'ahmad.f@setda.gov.id', 'Staff', 'Active', '2 hours ago'),
(3, 'Siti Nurhaliza', 'siti.n@setda.gov.id', 'Viewer', 'Active', 'Yesterday')
ON CONFLICT (id) DO NOTHING;

-- 6. Kebijakan Supabase Storage Bucket "documents"
-- Buat bucket baru bernama 'documents' di menu Storage pada Dashboard Supabase (Set As Public Bucket).
