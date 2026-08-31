import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const STAFF_FILE = path.join(process.cwd(), "data", "staff.json");

const DEFAULT_STAFF = [
  { id: 1, name: "Budi Santoso", email: "budi.s@setda.gov.id", role: "Admin", status: "Active", lastActive: "Just now", nip: "19850712 201001 1 008", division: "Umum" },
  { id: 2, name: "Ahmad Fauzi", email: "ahmad.f@setda.gov.id", role: "Staff", status: "Active", lastActive: "2 hours ago", nip: "19900815 201402 1 005", division: "Umum" },
  { id: 3, name: "Siti Nurhaliza", email: "siti.n@setda.gov.id", role: "Viewer", status: "Active", lastActive: "Yesterday", nip: "19951210 201901 2 001", division: "Umum" },
  { id: 4, name: "Hendra Wijaya", email: "hendra.w@setda.gov.id", role: "Staff", status: "Active", lastActive: "3 days ago", nip: "19910324 201503 2 002", division: "Protokol" }
];

function ensureStaffExists() {
  const dataDir = path.dirname(STAFF_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(STAFF_FILE)) {
    fs.writeFileSync(STAFF_FILE, JSON.stringify(DEFAULT_STAFF, null, 2));
  }
}

// GET: Fetch staff list from Supabase (or fallback JSON)
export async function GET() {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .order("id", { ascending: true });

      if (!error && data && data.length > 0) {
        return NextResponse.json(data);
      }
    }

    ensureStaffExists();
    const data = fs.readFileSync(STAFF_FILE, "utf-8");
    const staff = JSON.parse(data || "[]");
    return NextResponse.json(staff);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch staff list" }, { status: 500 });
  }
}

// POST: Add new staff member to Supabase (or fallback JSON)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, role, nip, division } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and Email are required" }, { status: 400 });
    }

    const newStaff = {
      id: Date.now(),
      name: name.trim(),
      email: email.trim(),
      role: role || "Staff",
      status: "Active",
      lastActive: "Baru saja",
      nip: nip ? nip.trim() : `199${Math.floor(Math.random()*10)}0${Math.floor(Math.random()*9)+1}${Math.floor(Math.random()*28)+1} 202${Math.floor(Math.random()*5)}01 ${Math.floor(Math.random()*2)+1} 00${Math.floor(Math.random()*9)+1}`,
      division: division || "Umum"
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("staff")
        .insert([newStaff])
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json(data);
      }
    }

    ensureStaffExists();
    const data = fs.readFileSync(STAFF_FILE, "utf-8");
    const staff = JSON.parse(data || "[]");
    staff.push(newStaff);
    fs.writeFileSync(STAFF_FILE, JSON.stringify(staff, null, 2));

    return NextResponse.json(newStaff);
  } catch (error) {
    return NextResponse.json({ error: "Failed to add staff" }, { status: 500 });
  }
}

// PATCH: Update staff status on Supabase (or fallback JSON)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing staff ID" }, { status: 400 });
    }

    ensureStaffExists();
    const localData = fs.readFileSync(STAFF_FILE, "utf-8");
    let localStaffList = JSON.parse(localData || "[]");

    const target = localStaffList.find((s: any) => s.id === id);
    const newStatus = target && target.status === "Active" ? "Suspended" : "Active";

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from("staff")
        .update({ status: newStatus })
        .eq("id", id);
    }

    localStaffList = localStaffList.map((s: any) => {
      if (s.id === id) {
        return { ...s, status: newStatus };
      }
      return s;
    });

    fs.writeFileSync(STAFF_FILE, JSON.stringify(localStaffList, null, 2));
    return NextResponse.json({ success: true, staff: localStaffList });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update staff" }, { status: 500 });
  }
}
