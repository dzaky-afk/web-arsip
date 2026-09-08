import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface CategoryItem {
  id: number;
  title: string;
  desc: string;
  status: string;
}

const CATEGORIES_FILE = path.join(process.cwd(), "data", "categories.json");
const CLOUD_STORAGE_CAT_PATH = "_system/categories.json";

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 1, title: "Surat Keputusan", desc: "Dokumen keputusan resmi dan penetapan pimpinan.", status: "active" },
  { id: 2, title: "Laporan Keuangan", desc: "Laporan realisasi anggaran, keuangan, dan hasil audit.", status: "active" },
  { id: 3, title: "Kepegawaian", desc: "Berkas kepegawaian, SK jabatan, dan kontrak staf.", status: "active" },
  { id: 4, title: "Arsip Umum", desc: "Arsip umum dan dokumentasi administrasi daerah.", status: "active" },
  { id: 5, title: "MoU & Perjanjian", desc: "Nota kesepahaman dan perjanjian kerja sama.", status: "active" }
];

async function getCategoriesFromCloud(): Promise<CategoryItem[]> {
  // 1. Try Supabase Storage
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(CLOUD_STORAGE_CAT_PATH);

      if (!error && data) {
        const text = await data.text();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn("Supabase Storage categories download notice:", err);
    }

    // 2. Try Supabase Table (if exists)
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("id", { ascending: true });

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch {}
  }

  // 3. Try Local JSON File
  try {
    if (fs.existsSync(CATEGORIES_FILE)) {
      const data = fs.readFileSync(CATEGORIES_FILE, "utf-8");
      const categories: CategoryItem[] = JSON.parse(data || "[]");
      if (categories.length > 0) return categories;
    }
  } catch (err) {
    console.warn("Local categories file read error:", err);
  }

  return DEFAULT_CATEGORIES;
}

async function saveCategoriesToCloud(categories: CategoryItem[]): Promise<void> {
  // 1. Save to Supabase Cloud Storage
  if (isSupabaseConfigured && supabase) {
    try {
      const jsonBuffer = Buffer.from(JSON.stringify(categories, null, 2), "utf-8");
      await supabase.storage
        .from("documents")
        .upload(CLOUD_STORAGE_CAT_PATH, jsonBuffer, {
          contentType: "application/json",
          upsert: true
        });
    } catch (err) {
      console.warn("Supabase Storage categories upload error:", err);
    }

    // 2. Try Supabase Table (if exists)
    try {
      await supabase.from("categories").upsert(categories);
    } catch {}
  }

  // 3. Save to Local JSON File
  try {
    const dataDir = path.dirname(CATEGORIES_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
  } catch (err) {
    console.warn("Local categories file write notice:", err);
  }
}

// GET: Fetch categories
export async function GET() {
  try {
    const categories = await getCategoriesFromCloud();
    return NextResponse.json(categories);
  } catch {
    return NextResponse.json(DEFAULT_CATEGORIES);
  }
}

// POST: Add new category
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, desc } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const currentCategories = await getCategoriesFromCloud();

    const newCategory: CategoryItem = {
      id: Date.now(),
      title: title.trim(),
      desc: (desc || "Deskripsi kategori dokumen").trim(),
      status: "active"
    };

    const updated = [...currentCategories, newCategory];
    await saveCategoriesToCloud(updated);

    return NextResponse.json(newCategory);
  } catch {
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

// DELETE: Remove category
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idStr = searchParams.get("id");
    if (!idStr) {
      return NextResponse.json({ error: "Missing category ID" }, { status: 400 });
    }

    const id = parseInt(idStr);
    const currentCategories = await getCategoriesFromCloud();
    const updated = currentCategories.filter((c) => c.id !== id);

    await saveCategoriesToCloud(updated);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
