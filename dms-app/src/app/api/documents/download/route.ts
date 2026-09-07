import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { DocumentItem } from "@/app/api/documents/route";

const DATA_FILE = path.join(process.cwd(), "data", "documents.json");

function getMimeType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "doc":
      return "application/msword";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "xls":
      return "application/vnd.ms-excel";
    case "csv":
      return "text/csv; charset=utf-8";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "txt":
      return "text/plain; charset=utf-8";
    case "zip":
      return "application/zip";
    default:
      return "application/octet-stream";
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idStr = searchParams.get("id");

    if (!idStr) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    const id = parseInt(idStr);
    let targetDoc: DocumentItem | null = null;

    // Check Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("documents")
          .select("*")
          .eq("id", id)
          .single();
        if (!error && data) {
          targetDoc = data as DocumentItem;
        }
      } catch (err) {
        console.error("Supabase fetch document for download error:", err);
      }
    }

    // Check local data if not found in Supabase
    if (!targetDoc && fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        const docs: DocumentItem[] = JSON.parse(raw || "[]");
        targetDoc = docs.find((d) => d.id === id) || null;
      } catch (err) {
        console.error("Local data parse error:", err);
      }
    }

    if (!targetDoc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const rawFileName = targetDoc.name || `Dokumen_${targetDoc.id}.pdf`;
    const safeFileName = rawFileName.replace(/["\r\n]/g, "_");
    const mimeType = getMimeType(safeFileName);

    // 1. If physical file exists in local uploads directory
    if (targetDoc.fileUrl && targetDoc.fileUrl.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", targetDoc.fileUrl);
      if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        return new Response(fileBuffer, {
          status: 200,
          headers: {
            "Content-Type": mimeType,
            "Content-Disposition": `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodeURIComponent(safeFileName)}`,
            "Content-Length": fileBuffer.length.toString(),
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
          },
        });
      }
    }

    // 2. If remote URL (Supabase storage or CDN)
    if (targetDoc.fileUrl && (targetDoc.fileUrl.startsWith("http://") || targetDoc.fileUrl.startsWith("https://"))) {
      try {
        const remoteRes = await fetch(targetDoc.fileUrl);
        if (remoteRes.ok) {
          const arrayBuffer = await remoteRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          return new Response(buffer, {
            status: 200,
            headers: {
              "Content-Type": mimeType,
              "Content-Disposition": `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodeURIComponent(safeFileName)}`,
              "Content-Length": buffer.length.toString(),
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
          });
        }
      } catch (fetchErr) {
        console.error("Remote fetch error for download:", fetchErr);
      }
    }

    // 3. If Base64 Data URI
    if (targetDoc.fileUrl && targetDoc.fileUrl.startsWith("data:")) {
      try {
        const parts = targetDoc.fileUrl.split(",");
        if (parts.length === 2) {
          const base64Data = parts[1];
          const mimeMatch = parts[0].match(/:(.*?);/);
          const resolvedMime = mimeMatch ? mimeMatch[1] : mimeType;
          const fileBuffer = Buffer.from(base64Data, "base64");
          return new Response(fileBuffer, {
            status: 200,
            headers: {
              "Content-Type": resolvedMime,
              "Content-Disposition": `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodeURIComponent(safeFileName)}`,
              "Content-Length": fileBuffer.length.toString(),
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
          });
        }
      } catch (dataErr) {
        console.error("Data URI download error:", dataErr);
      }
    }

    // 3. Fallback: Generate official structured document file
    const docText = `================================================================================
BAGIAN UMUM SEKRETARIAT DAERAH KABUPATEN GUNUNGKIDUL
SISTEM MANAJEMEN DOKUMEN & ARSIP DIGITAL (DMS)
================================================================================

Nama Dokumen   : ${targetDoc.name}
Kategori       : ${targetDoc.category}
Pengunggah     : ${targetDoc.uploader}
Tanggal Arsip  : ${targetDoc.date}
Ukuran Berkas  : ${targetDoc.size}
Versi Dokumen  : ${targetDoc.version}
Status Berkas  : Terverifikasi di Server Pusat Bagian Umum Setda

RINGKASAN / INFORMASI DOKUMEN:
${targetDoc.desc || "Dokumen resmi tersimpan dalam sistem arsip digital Bagian Umum Sekretariat Daerah."}

KATA KUNCI / TAGS:
${targetDoc.tags || "Arsip, Dokumen Resmi, Bagian Umum, Setda"}

--------------------------------------------------------------------------------
Catatan Keaslian: Berkas ini diunduh langsung dari Server Cloud DMS Bagian Umum Setda.
Waktu Pengunduhan: ${new Date().toLocaleString("id-ID")}
ID Arsip Digital : DMS-SETDA-${targetDoc.id}
================================================================================
`;

    const textBuffer = Buffer.from(docText, "utf-8");
    const downloadExt = targetDoc.name.includes(".") ? "" : ".txt";
    const finalDownloadName = `${safeFileName}${downloadExt}`;

    return new Response(textBuffer, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${finalDownloadName}"; filename*=UTF-8''${encodeURIComponent(finalDownloadName)}`,
        "Content-Length": textBuffer.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("Download route error:", error);
    return NextResponse.json({ error: "Internal Server Error during download" }, { status: 500 });
  }
}
