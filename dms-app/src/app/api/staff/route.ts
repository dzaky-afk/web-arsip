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

const DEFAULT_STAFF: StaffItem[] = [
  { id: 1, name: "Budi Santoso", email: "budi.s@setda.gov.id", role: "Admin", status: "Active", lastActive: "Baru saja", nip: "19850712 201001 1 008", division: "Umum" }
];

function ensureStaffExists() {
  try {
    const dataDir = path.dirname(STAFF_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(STAFF_FILE)) {
      fs.writeFileSync(STAFF_FILE, JSON.stringify(DEFAULT_STAFF, null, 2));
    }
  } catch (err) {
    console.warn("Staff filesystem warning:", err);
  }
}

// GET: Fetch staff list from Supabase (or fallback JSON)
export async function GET() {
  try {
    if (isSupabaseConfigured && supabase) {
      try {
        // Clean up legacy dummy seed rows (id 2, 3, 4) if present
        await supabase.from("staff").delete().in("id", [2, 3, 4]);
      } catch (cleanupErr) {
        console.warn("Legacy dummy staff cleanup warning:", cleanupErr);
      }

      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .order("id", { ascending: true });

      if (!error && data && data.length > 0) {
        return NextResponse.json(data);
      }
    }

    ensureStaffExists();
    if (fs.existsSync(STAFF_FILE)) {
      const data = fs.readFileSync(STAFF_FILE, "utf-8");
      const staff: StaffItem[] = JSON.parse(data || "[]");
      return NextResponse.json(staff.length > 0 ? staff : DEFAULT_STAFF);
    }
    return NextResponse.json(DEFAULT_STAFF);
  } catch {
    return NextResponse.json(DEFAULT_STAFF);
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

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("staff")
          .insert([newStaff])
          .select()
          .single();

        if (!error && data) {
          return NextResponse.json(data);
        }
      } catch (err) {
        console.warn("Supabase staff insert error:", err);
      }
    }

    try {
      ensureStaffExists();
      if (fs.existsSync(STAFF_FILE)) {
        const data = fs.readFileSync(STAFF_FILE, "utf-8");
        const staff: StaffItem[] = JSON.parse(data || "[]");
        staff.push(newStaff);
        fs.writeFileSync(STAFF_FILE, JSON.stringify(staff, null, 2));
      }
    } catch (fsErr) {
      console.warn("Read-only filesystem on staff add:", fsErr);
    }

    return NextResponse.json(newStaff);
  } catch {
    return NextResponse.json({ error: "Failed to add staff" }, { status: 500 });
  }
}

// PATCH: Update staff status on Supabase (or fallback JSON)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing staff ID" }, { status: 400 });
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from("staff")
          .update({ status: "Active" }) // fallback
          .eq("id", id);
      } catch (err) {
        console.warn("Supabase staff update error:", err);
      }
    }

    try {
      ensureStaffExists();
      if (fs.existsSync(STAFF_FILE)) {
        const localData = fs.readFileSync(STAFF_FILE, "utf-8");
        let localStaffList: StaffItem[] = JSON.parse(localData || "[]");

        const target = localStaffList.find((s: StaffItem) => s.id === id);
        const newStatus = target && target.status === "Active" ? "Suspended" : "Active";

        localStaffList = localStaffList.map((s: StaffItem) => {
          if (s.id === id) {
            return { ...s, status: newStatus };
          }
          return s;
        });

        fs.writeFileSync(STAFF_FILE, JSON.stringify(localStaffList, null, 2));
        return NextResponse.json({ success: true, staff: localStaffList });
      }
    } catch (fsErr) {
      console.warn("Read-only filesystem on staff patch:", fsErr);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update staff" }, { status: 500 });
  }
}

// DELETE: Remove a staff member from Supabase & fallback JSON
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");
    if (!idParam) {
      return NextResponse.json({ error: "Missing staff id" }, { status: 400 });
    }
    const id = Number(idParam);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("staff").delete().eq("id", id);
      } catch (sbErr) {
        console.warn("Supabase staff delete error:", sbErr);
      }
    }

    try {
      ensureStaffExists();
      if (fs.existsSync(STAFF_FILE)) {
        const data = fs.readFileSync(STAFF_FILE, "utf-8");
        let staffList: StaffItem[] = JSON.parse(data || "[]");
        staffList = staffList.filter((s: StaffItem) => s.id !== id);
        fs.writeFileSync(STAFF_FILE, JSON.stringify(staffList, null, 2));
      }
    } catch (fsErr) {
      console.warn("Read-only filesystem on staff delete:", fsErr);
    }

    return NextResponse.json({ success: true, message: "Staff removed successfully" });
  } catch {
    return NextResponse.json({ error: "Failed to delete staff" }, { status: 500 });
  }
}

