import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface DocumentItem {
  id: number;
  name: string;
  category: string;
  status: string;
  size: string;
  version: string;
  date: string;
  dateFull?: string;
  uploader: string;
  type: string;
  fileUrl?: string;
  desc?: string;
  tags?: string;
}

const DATA_FILE = path.join(process.cwd(), "data", "documents.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// Helper to ensure directories exist
function ensureDirsExist() {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

// GET: Fetch all shared documents from Supabase (or fallback JSON)
export async function GET() {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("id", { ascending: false });

      if (!error && data) {
        return NextResponse.json(data);
      }
    }

    ensureDirsExist();
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    const documents: DocumentItem[] = JSON.parse(data || "[]");
    return NextResponse.json(documents);
  } catch {
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

// POST: Upload file & save metadata to Supabase (or fallback local storage)
export async function POST(req: NextRequest) {
  try {
    ensureDirsExist();
    const formData = await req.formData();
    
    const title = formData.get("title") as string;
    const category = (formData.get("category") as string) || "Surat Keputusan";
    const uploader = (formData.get("uploader") as string) || "Staf Bagian Umum";
    const desc = (formData.get("desc") as string) || "";
    const tags = (formData.get("tags") as string) || "";
    const file = formData.get("file") as File | null;

    let fileUrl = "";
    let fileSizeStr = "1.5 MB";
    let fileName = title;
    let fileExt = "pdf";

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      fileSizeStr = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
      fileName = file.name;
      fileExt = file.name.split(".").pop()?.toLowerCase() || "pdf";

      // Try uploading to Supabase Storage if configured
      if (isSupabaseConfigured && supabase) {
        try {
          const { error: uploadError } = await supabase.storage
            .from("documents")
            .upload(safeName, buffer, {
              contentType: file.type || "application/octet-stream",
              upsert: true
            });

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from("documents")
              .getPublicUrl(safeName);
            fileUrl = publicUrlData.publicUrl;
          }
        } catch (storageErr) {
          console.error("Supabase Storage Upload Error:", storageErr);
        }
      }

      // Local fallback file save if Supabase Storage url not generated
      if (!fileUrl) {
        const filePath = path.join(UPLOADS_DIR, safeName);
        fs.writeFileSync(filePath, buffer);
        fileUrl = `/uploads/${safeName}`;
      }
    } else {
      fileExt = title.toLowerCase().includes("xlsx")
        ? "xlsx"
        : title.toLowerCase().includes("docx")
        ? "docx"
        : "pdf";
      fileName = title.endsWith(`.${fileExt}`) ? title : `${title}.${fileExt}`;
    }

    const now = new Date();
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const dayName = dayNames[now.getDay()];
    const day = now.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const realTimeStr = `${dayName}, ${day} ${month} ${year}, ${hours}:${minutes} WIB`;

    const newDoc: DocumentItem = {
      id: Date.now(),
      name: fileName,
      category: category,
      status: "Approved",
      size: fileSizeStr,
      version: "v1.0",
      date: realTimeStr,
      dateFull: now.toISOString(),
      uploader: uploader,
      type: fileExt,
      fileUrl: fileUrl,
      desc: desc,
      tags: tags
    };

    // Save to Supabase Table if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: docData, error: docErr } = await supabase
          .from("documents")
          .insert([newDoc])
          .select()
          .single();

        if (!docErr && docData) {
          // Sync locally as well
          const localData = fs.readFileSync(DATA_FILE, "utf-8");
          const localDocs: DocumentItem[] = JSON.parse(localData || "[]");
          localDocs.unshift(docData as DocumentItem);
          fs.writeFileSync(DATA_FILE, JSON.stringify(localDocs, null, 2));

          return NextResponse.json(docData);
        }
      } catch (dbErr) {
        console.error("Supabase Database Insert Error:", dbErr);
      }
    }

    // Local JSON Fallback Save
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, "utf-8");
        const documents: DocumentItem[] = JSON.parse(data || "[]");
        documents.unshift(newDoc);
        fs.writeFileSync(DATA_FILE, JSON.stringify(documents, null, 2));
      }
    } catch (fsErr) {
      console.warn("Serverless read-only filesystem detected, proceeding in-memory:", fsErr);
    }

    return NextResponse.json(newDoc);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}

// DELETE: Delete document from Supabase (or fallback local database)
export async function DELETE(req: NextRequest) {
  try {
    ensureDirsExist();
    const { searchParams } = new URL(req.url);
    const idStr = searchParams.get("id");
    if (!idStr) {
      return NextResponse.json({ error: "Missing document ID" }, { status: 400 });
    }

    const id = parseInt(idStr);

    if (isSupabaseConfigured && supabase) {
      await supabase.from("documents").delete().eq("id", id);
    }

    const data = fs.readFileSync(DATA_FILE, "utf-8");
    let documents: DocumentItem[] = JSON.parse(data || "[]");

    const targetDoc = documents.find((d: DocumentItem) => d.id === id);
    if (targetDoc && targetDoc.fileUrl && targetDoc.fileUrl.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", targetDoc.fileUrl);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch { /* ignore */ }
      }
    }

    documents = documents.filter((d: DocumentItem) => d.id !== id);
    fs.writeFileSync(DATA_FILE, JSON.stringify(documents, null, 2));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
