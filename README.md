# Web DMS & Arsip - Setda Bagian Umum Kab. Gunungkidul

Sistem Manajemen Dokumen & Digitalisasi Arsip Resmi berbasis **Next.js 16**, **React 19**, **TypeScript**, dan **Supabase Cloud Database (PostgreSQL) & Storage**.

## 🚀 Fitur Utama
- **Manajemen Dokumen & Arsip**: Pencarian dokumen real-time, filter kategori, dan filter format (PDF, Word, Excel).
- **Penyimpanan Cloud Supabase & Local Fallback**: Menyimpan berkas fisik ke Supabase Storage & metadata ke Supabase Database PostgreSQL.
- **Autentikasi Staf Setda**: Proteksi akses khusus Staf Bagian Umum Setda.
- **Dark Mode & Responsive Drawer**: Tampilan antarmuka modern dengan dukungan mode gelap dan drawer mobile.
- **Export & Backup Data**: Fitur ekspor laporan CSV dan backup lengkap seluruh database JSON.

## 📁 Struktur Direktori
- `dms-app/`: Aplikasi utama Next.js 16 (App Router).
- `dms-app/supabase_schema.sql`: Skrip skema database Supabase PostgreSQL.
- `dms-app/data/`: Data cadangan lokal JSON (`documents.json`, `categories.json`, `staff.json`).

## 🛠️ Jalankan Lokal
```bash
npm run dev
```
Aplikasi akan berjalan di `http://localhost:3000`.
