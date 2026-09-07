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

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 1, title: "Surat Keputusan", desc: "Dokumen keputusan resmi dan penetapan pimpinan.", status: "active" },
  { id: 2, title: "Laporan Keuangan", desc: "Laporan realisasi anggaran, keuangan, dan hasil audit.", status: "active" },
  { id: 3, title: "Kepegawaian", desc: "Berkas kepegawaian, SK jabatan, dan kontrak staf.", status: "active" },
  { id: 4, title: "Arsip Umum", desc: "Arsip umum dan dokumentasi administrasi daerah.", status: "active" },
  { id: 5, title: "MoU & Perjanjian", desc: "Nota kesepahaman dan perjanjian kerja sama.", status: "active" }
];

function ensureCategoriesExist() {
  try {
    const dataDir = path.dirname(CATEGORIES_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(CATEGORIES_FILE)) {
      fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(DEFAULT_CATEGORIES, null, 2));
    }
  } catch (err) {
    console.warn("Categories filesystem warning:", err);
  }
}

// GET: Fetch categories from Supabase (or fallback JSON)
export async function GET() {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("id", { ascending: true });

      if (!error && data && data.length > 0) {
        return NextResponse.json(data);
      }
    }

    ensureCategoriesExist();
    if (fs.existsSync(CATEGORIES_FILE)) {
      const data = fs.readFileSync(CATEGORIES_FILE, "utf-8");
      const categories: CategoryItem[] = JSON.parse(data || "[]");
      return NextResponse.json(categories.length > 0 ? categories : DEFAULT_CATEGORIES);
    }
    return NextResponse.json(DEFAULT_CATEGORIES);
  } catch {
    return NextResponse.json(DEFAULT_CATEGORIES);
  }
}

// POST: Add new category to Supabase (or fallback JSON)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, desc } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const newCategory: CategoryItem = {
      id: Date.now(),
      title: title.trim(),
      desc: (desc || "Deskripsi kategori dokumen").trim(),
      status: "active"
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("categories")
          .insert([newCategory])
          .select()
          .single();

        if (!error && data) {
          return NextResponse.json(data);
        }
      } catch (err) {
        console.warn("Supabase category insert error:", err);
      }
    }

    try {
      ensureCategoriesExist();
      if (fs.existsSync(CATEGORIES_FILE)) {
        const data = fs.readFileSync(CATEGORIES_FILE, "utf-8");
        const categories: CategoryItem[] = JSON.parse(data || "[]");
        categories.push(newCategory);
        fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
      }
    } catch (fsErr) {
      console.warn("Read-only filesystem on category add:", fsErr);
    }

    return NextResponse.json(newCategory);
  } catch {
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

// DELETE: Remove category from Supabase (or fallback JSON)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idStr = searchParams.get("id");
    if (!idStr) {
      return NextResponse.json({ error: "Missing category ID" }, { status: 400 });
    }

    const id = parseInt(idStr);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("categories").delete().eq("id", id);
      } catch (err) {
        console.warn("Supabase category delete error:", err);
      }
    }

    try {
      ensureCategoriesExist();
      if (fs.existsSync(CATEGORIES_FILE)) {
        const data = fs.readFileSync(CATEGORIES_FILE, "utf-8");
        let categories: CategoryItem[] = JSON.parse(data || "[]");
        categories = categories.filter((c: CategoryItem) => c.id !== id);
        fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
      }
    } catch (fsErr) {
      console.warn("Read-only filesystem on category delete:", fsErr);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
