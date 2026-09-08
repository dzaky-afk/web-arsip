import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface StaffItem {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  lastActive: string;
  nip?: string;
  division?: string;
}

const STAFF_FILE = path.join(process.cwd(), "data", "staff.json");
const CLOUD_STORAGE_STAFF_PATH = "_system/staff.json";

const DEFAULT_STAFF: StaffItem[] = [
  { id: 1, name: "Budi Santoso", email: "budi.s@setda.gov.id", role: "Admin", status: "Active", lastActive: "Baru saja", nip: "19850712 201001 1 008", division: "Umum" }
];

// Helper: Read staff from Cloud Supabase Storage (or local fallback)
async function getStaffFromCloud(): Promise<StaffItem[]> {
  // 1. Try Supabase Storage
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(CLOUD_STORAGE_STAFF_PATH);

      if (!error && data) {
        const text = await data.text();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn("Supabase Storage staff download notice:", err);
    }

    // 2. Try Supabase Table (if table exists)
    try {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .order("id", { ascending: true });

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch {}
  }

  // 3. Try Local JSON File
  try {
    if (fs.existsSync(STAFF_FILE)) {
      const data = fs.readFileSync(STAFF_FILE, "utf-8");
      const staff: StaffItem[] = JSON.parse(data || "[]");
      if (staff.length > 0) return staff;
    }
  } catch (err) {
    console.warn("Local staff file read error:", err);
  }

  return DEFAULT_STAFF;
}

// Helper: Save staff list to Cloud Supabase Storage (and local fallback)
async function saveStaffToCloud(staffList: StaffItem[]): Promise<void> {
  // 1. Save to Supabase Cloud Storage
  if (isSupabaseConfigured && supabase) {
    try {
      const jsonBuffer = Buffer.from(JSON.stringify(staffList, null, 2), "utf-8");
      await supabase.storage
        .from("documents")
        .upload(CLOUD_STORAGE_STAFF_PATH, jsonBuffer, {
          contentType: "application/json",
          upsert: true
        });
    } catch (err) {
      console.warn("Supabase Storage staff upload error:", err);
    }

    // 2. Try Supabase Table (if exists)
    try {
      await supabase.from("staff").upsert(staffList);
    } catch {}
  }

  // 3. Save to Local JSON File
  try {
    const dataDir = path.dirname(STAFF_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(STAFF_FILE, JSON.stringify(staffList, null, 2));
  } catch (err) {
    console.warn("Local staff file write notice:", err);
  }
}

// GET: Fetch staff list
export async function GET() {
  try {
    const staffList = await getStaffFromCloud();
    return NextResponse.json(staffList);
  } catch {
    return NextResponse.json(DEFAULT_STAFF);
  }
}

// POST: Add new staff member
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, role, nip, division } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and Email are required" }, { status: 400 });
    }

    const currentStaffList = await getStaffFromCloud();

    const newStaff: StaffItem = {
      id: Date.now(),
      name: name.trim(),
      email: email.trim(),
      role: role || "Staff",
      status: "Active",
      lastActive: "Baru saja",
      nip: nip ? nip.trim() : `199${Math.floor(Math.random()*10)}0${Math.floor(Math.random()*9)+1}${Math.floor(Math.random()*28)+1} 202${Math.floor(Math.random()*5)}01 ${Math.floor(Math.random()*2)+1} 00${Math.floor(Math.random()*9)+1}`,
      division: division || "Umum"
    };

    const updatedList = [...currentStaffList, newStaff];
    await saveStaffToCloud(updatedList);

    return NextResponse.json(newStaff);
  } catch {
    return NextResponse.json({ error: "Failed to add staff" }, { status: 500 });
  }
}

// PATCH: Update staff status
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing staff ID" }, { status: 400 });
    }

    const currentStaffList = await getStaffFromCloud();
    const target = currentStaffList.find((s) => s.id === id);
    const newStatus = target && target.status === "Active" ? "Suspended" : "Active";

    const updatedList = currentStaffList.map((s) =>
      s.id === id ? { ...s, status: newStatus } : s
    );

    await saveStaffToCloud(updatedList);
    return NextResponse.json({ success: true, staff: updatedList });
  } catch {
    return NextResponse.json({ error: "Failed to update staff" }, { status: 500 });
  }
}

// DELETE: Remove a staff member
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");
    if (!idParam) {
      return NextResponse.json({ error: "Missing staff id" }, { status: 400 });
    }
    const id = Number(idParam);

    const currentStaffList = await getStaffFromCloud();
    const updatedList = currentStaffList.filter((s) => s.id !== id);

    await saveStaffToCloud(updatedList);
    return NextResponse.json({ success: true, message: "Staff removed successfully" });
  } catch {
    return NextResponse.json({ error: "Failed to delete staff" }, { status: 500 });
  }
}
