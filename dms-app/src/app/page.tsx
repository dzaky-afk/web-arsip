"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutGrid,
  FileText,
  Folder,
  UploadCloud,
  Users,
  HelpCircle,
  Search,
  Bell,
  Sun,
  Moon,
  Plus,
  Download,
  Trash2,
  Eye,
  CheckCircle2,
  Lock,
  ArrowRight,
  RotateCcw,
  Landmark,
  Archive,
  FileCheck,
  UserPlus,
  UserX,
  X,
  Inbox,
  ExternalLink,
  User,
  LogOut,
  ShieldCheck,
  ChevronDown,
  Menu,
  Database,
  LifeBuoy,
  Phone,
  Mail,
  ChevronUp,
  Calendar,
  CalendarDays,
  Clock,
  Filter,
  AlertCircle
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { DocumentItem } from "@/app/api/documents/route";
import type { CategoryItem } from "@/app/api/categories/route";
import type { StaffItem } from "@/app/api/staff/route";

// Default System Document Categories
const DEFAULT_CATEGORIES = [
  { id: 1, title: "Surat Keputusan", desc: "Dokumen keputusan resmi dan penetapan pimpinan.", status: "active" },
  { id: 2, title: "Laporan Keuangan", desc: "Laporan realisasi anggaran, keuangan, dan hasil audit.", status: "active" },
  { id: 3, title: "Kepegawaian", desc: "Berkas kepegawaian, SK jabatan, dan kontrak staf.", status: "active" },
  { id: 4, title: "Arsip Umum", desc: "Arsip umum dan dokumentasi administrasi daerah.", status: "active" },
  { id: 5, title: "MoU & Perjanjian", desc: "Nota kesepahaman dan perjanjian kerja sama.", status: "active" }
];

const CURRENT_USER_STAFF = [
  { id: 1, name: "Budi Santoso", email: "budi.s@setda.gov.id", role: "Admin", status: "Active", lastActive: "Baru saja", nip: "19850712 201001 1 008", division: "Umum" }
];

export default function DMSApp() {
  // Mount Flag to Avoid Hydration Mismatch
  const [mounted, setMounted] = useState(false);

  // Mobile Navigation & Accordion State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // App States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // User Profile State
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    name: "Budi Santoso",
    email: "budi.s@setda.gov.id",
    nip: "19850712 201001 1 008",
    role: "Admin Setda Bagian Umum",
    department: "Bagian Umum Setda"
  });
  
  // Real Shared Server State (Google Drive Style Shared Documents)
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [staff, setStaff] = useState<StaffItem[]>(CURRENT_USER_STAFF);

  // Filter & Selection States
  const [searchQuery, setSearchQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilterPreset, setDateFilterPreset] = useState<"all" | "today" | "yesterday" | "7days" | "30days" | "thisMonth" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);

  // Modal States
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<StaffItem | null>(null);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  
  // Login Access Control States
  const [loginNip, setLoginNip] = useState("19850712 201001 1 008");
  const [loginError, setLoginError] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadTags, setUploadTags] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [catError, setCatError] = useState(false);

  const showToastMsg = (message: string, type: string = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch shared documents from Server API on load
  const loadSharedDocuments = async () => {
    try {
      const res = await fetch(`/api/documents?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setDocuments(data);
        }
      }
    } catch (e) {
      console.error("Failed to load server documents", e);
    }
  };

  // Fetch categories from Server API
  const loadCategories = async () => {
    try {
      const res = await fetch(`/api/categories?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
          try {
            localStorage.setItem("dms_categories_data", JSON.stringify(data));
          } catch {}
        }
      }
    } catch (e) {
      console.error("Failed to load categories", e);
    }
  };

  // Fetch staff from Server API
  const loadStaff = async () => {
    try {
      const res = await fetch(`/api/staff?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setStaff(data);
          try {
            localStorage.setItem("dms_staff_data", JSON.stringify(data));
          } catch {}
        }
      }
    } catch (e) {
      console.error("Failed to load staff", e);
    }
  };

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("dms_theme");
    if (savedTheme) {
      setDarkMode(savedTheme === "dark");
    } else if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setDarkMode(true);
    }

    try {
      const cachedStaff = localStorage.getItem("dms_staff_data");
      if (cachedStaff) {
        const parsed = JSON.parse(cachedStaff);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStaff(parsed);
        }
      }
    } catch {}

    try {
      const cachedCategories = localStorage.getItem("dms_categories_data");
      if (cachedCategories) {
        const parsed = JSON.parse(cachedCategories);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed);
        }
      }
    } catch {}

    loadSharedDocuments();
    loadCategories();
    loadStaff();

    // Auto-sync when window or tab gains focus (e.g., returning to phone/laptop)
    const handleFocusSync = () => {
      loadSharedDocuments();
      loadCategories();
      loadStaff();
    };

    const handleVisibilitySync = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadSharedDocuments();
      }
    };

    window.addEventListener("focus", handleFocusSync);
    document.addEventListener("visibilitychange", handleVisibilitySync);

    // Periodic background sync every 8 seconds across all active devices
    const syncInterval = setInterval(() => {
      loadSharedDocuments();
    }, 8000);

    // Realtime Supabase Database Change Listener
    let channel: any = null;
    if (isSupabaseConfigured && supabase) {
      try {
        channel = supabase
          .channel("realtime-documents-sync")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "documents" },
            () => {
              loadSharedDocuments();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn("Realtime subscription notice:", err);
      }
    }

    return () => {
      window.removeEventListener("focus", handleFocusSync);
      document.removeEventListener("visibilitychange", handleVisibilitySync);
      clearInterval(syncInterval);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (darkMode) {
      document.documentElement.classList.add("dark-mode");
      document.body.classList.add("dark-mode");
      localStorage.setItem("dms_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark-mode");
      document.body.classList.remove("dark-mode");
      localStorage.setItem("dms_theme", "light");
    }
  }, [darkMode, mounted]);

  const getCategoryDocCount = (catTitle: string) => {
    return documents.filter((d) => d.category === catTitle).length;
  };

  // Handlers
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const cleanNip = loginNip.replace(/\D/g, "");

    // 1. Validate NIP length
    if (cleanNip.length !== 18) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
      setLoginError("Format NIP salah. NIP harus terdiri dari 18 digit angka.");
      return;
    }

    // 2. Validate Division based on NIP lookup in staff list
    // Fallback if staff list API is not loaded yet
    const localAllowedStaff: Record<string, StaffItem> = {
      "198507122010011008": {
        id: 1,
        name: "Budi Santoso",
        email: "budi.s@setda.gov.id",
        role: "Admin Setda Bagian Umum",
        status: "Active",
        lastActive: "Just now",
        nip: "19850712 201001 1 008",
        division: "Umum"
      }
    };

    let foundStaff = staff.find((s) => s.nip && s.nip.replace(/\D/g, "") === cleanNip);
    
    if (!foundStaff && localAllowedStaff[cleanNip]) {
      foundStaff = localAllowedStaff[cleanNip];
    }

    if (!foundStaff) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
      setLoginError("Akses Ditolak: NIP Anda tidak terdaftar sebagai staf Setda.");
      return;
    }

    const staffDivision = foundStaff.division || "Umum";
    if (staffDivision !== "Umum") {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
      const divisionDisplay = staffDivision === "Protokol" ? "Bagian Protokol & Komunikasi Pimpinan" : `Bagian ${staffDivision}`;
      setLoginError(`Akses Ditolak: NIP Anda terdaftar di ${divisionDisplay}. Sistem DMS ini hanya diperuntukkan bagi Staf Bagian Umum.`);
      return;
    }

    setCurrentUser({
      name: foundStaff.name,
      email: foundStaff.email,
      nip: loginNip,
      role: foundStaff.role || "Staff Bagian Umum",
      department: "Bagian Umum Setda"
    });

    setIsLoggedIn(true);
    setCurrentView("dashboard");
    loadSharedDocuments();
    showToastMsg(`Selamat datang kembali, ${foundStaff.name}!`, "success");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowProfileMenu(false);
    showToastMsg("Anda telah berhasil keluar dari sistem.", "info");
  };

  const handleDeleteDocument = async (id: number) => {
    // Optimistically remove from state immediately
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    setSelectedDocIds((prev) => prev.filter((docId) => docId !== id));
    if (selectedDoc && selectedDoc.id === id) {
      setSelectedDoc(null);
    }
    showToastMsg("Dokumen berhasil dihapus dari server pusat.", "success");

    try {
      await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
    } catch (err) {
      console.warn("Server DELETE sync notice:", err);
    }
  };

  const handleToggleStaffStatus = async (id: number) => {
    try {
      const res = await fetch("/api/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "toggle-status" })
      });
      if (res.ok) {
        setStaff((prev) => {
          const updated = prev.map((s) =>
            s.id === id ? { ...s, status: s.status === "Active" ? "Suspended" : "Active" } : s
          );
          try { localStorage.setItem("dms_staff_data", JSON.stringify(updated)); } catch {}
          return updated;
        });
        showToastMsg("Status akun staf berhasil diperbarui di cloud server.");
      }
    } catch {
      showToastMsg("Gagal memperbarui status staf.", "error");
    }
  };

  const isAdmin = Boolean(currentUser?.role && currentUser.role.toLowerCase().includes("admin"));

  const handleDeleteStaff = async (id: number) => {
    if (!isAdmin) {
      showToastMsg("Akses Ditolak: Hanya Admin yang memiliki wewenang untuk menghapus staf.", "error");
      return;
    }
    const target = staff.find((s) => s.id === id);
    if (
      target &&
      target.nip &&
      currentUser.nip &&
      target.nip.replace(/\D/g, "") === currentUser.nip.replace(/\D/g, "")
    ) {
      showToastMsg("Tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.", "warning");
      return;
    }

    setStaff((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try { localStorage.setItem("dms_staff_data", JSON.stringify(updated)); } catch {}
      return updated;
    });
    setStaffToDelete(null);
    showToastMsg(`Akun staf "${target?.name || "Staf"}" berhasil dihapus secara permanen.`, "success");

    try {
      await fetch(`/api/staff?id=${id}`, { method: "DELETE" });
      await loadStaff();
    } catch (err) {
      console.warn("Server staff DELETE sync notice:", err);
    }
  };


  const handleExportFullBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      system: "DMS Setda Bagian Umum Kab. Gunungkidul",
      documentsCount: documents.length,
      categoriesCount: categories.length,
      staffCount: staff.length,
      documents,
      categories,
      staff
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `DMS_Full_Backup_Setda_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToastMsg("File Backup Database JSON berhasil diunduh!", "success");
  };

  const handleSelectDoc = (id: number) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllDocs = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedDocIds(filteredDocuments.map((d) => d.id));
    } else {
      setSelectedDocIds([]);
    }
  };

  const handleBatchDelete = async () => {
    for (const id of selectedDocIds) {
      await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
    }
    setDocuments((prev) => prev.filter((d) => !selectedDocIds.includes(d.id)));
    showToastMsg(`${selectedDocIds.length} dokumen berhasil dihapus dari server.`);
    setSelectedDocIds([]);
  };

  // Upload file & save metadata to Next.js Server API
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadTitle.trim()) {
      showToastMsg("Peringatan: Silakan masukkan judul dokumen terlebih dahulu!", "warning");
      return;
    }

    if (!uploadCategory || !uploadCategory.trim()) {
      setCatError(true);
      setIsCatDropdownOpen(true);
      showToastMsg("Peringatan: Anda belum memilih kategori dokumen! Silakan pilih kategori terlebih dahulu.", "warning");
      return;
    }

    setCatError(false);
    setIsUploading(true);
    showToastMsg("Mengirim berkas ke server pusat...", "info");

    let savedDoc: DocumentItem | null = null;

    try {
      const formData = new FormData();
      formData.append("title", uploadTitle.trim());
      formData.append("category", uploadCategory.trim());
      formData.append("uploader", currentUser.name || "Staf Bagian Umum");
      formData.append("desc", uploadDesc);
      formData.append("tags", uploadTags);

      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        savedDoc = await res.json();
      }
    } catch (err) {
      console.warn("Server API upload error, creating resilient copy:", err);
    }

    // If serverless read-only or network issue, create resilient document item
    if (!savedDoc) {
      const now = new Date();
      const ext = selectedFile ? selectedFile.name.split(".").pop()?.toLowerCase() || "pdf" : "pdf";
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      const formattedDate = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}, ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} WIB`;
      
      savedDoc = {
        id: Date.now(),
        name: uploadTitle.trim().endsWith(`.${ext}`) ? uploadTitle.trim() : `${uploadTitle.trim()}.${ext}`,
        category: uploadCategory.trim(),
        status: "Approved",
        size: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : "1.5 MB",
        version: "v1.0",
        date: formattedDate,
        dateFull: now.toISOString(),
        uploader: currentUser.name || "Staf Bagian Umum",
        type: ext,
        fileUrl: selectedFile ? URL.createObjectURL(selectedFile) : "",
        desc: uploadDesc,
        tags: uploadTags
      };
    }

    setDocuments((prev) => [savedDoc!, ...prev]);
    showToastMsg(`Berkas "${savedDoc.name}" berhasil diunggah ke server!`, "success");
    setUploadTitle("");
    setUploadCategory("");
    setUploadDesc("");
    setUploadTags("");
    setSelectedFile(null);
    setCatError(false);
    setIsUploading(false);
    setCurrentView("all-documents");
  };

  const handleDownloadDocument = (doc: DocumentItem) => {
    showToastMsg(`Mengunduh berkas "${doc.name}" ke komputer...`, "info");
    try {
      const downloadEndpoint = `/api/documents/download?id=${doc.id}&t=${Date.now()}`;
      
      const link = document.createElement("a");
      link.href = downloadEndpoint;
      link.setAttribute("download", doc.name);
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 3000);
      
      showToastMsg(`Berkas "${doc.name}" berhasil diunduh ke folder Downloads!`, "success");
    } catch (err) {
      console.error("Gagal mengunduh berkas", err);
      showToastMsg("Gagal mengunduh berkas.", "error");
    }
  };

  const handleBatchDownload = async () => {
    const selectedDocs = documents.filter((d) => selectedDocIds.includes(d.id));
    if (selectedDocs.length === 0) {
      showToastMsg("Silakan pilih setidaknya satu dokumen untuk diunduh.", "warning");
      return;
    }

    setIsBatchDownloading(true);
    showToastMsg(`Memulai pengunduhan ${selectedDocs.length} berkas secara berurutan...`, "info");

    let successCount = 0;

    for (let i = 0; i < selectedDocs.length; i++) {
      const doc = selectedDocs[i];
      showToastMsg(`Mengunduh (${i + 1}/${selectedDocs.length}): "${doc.name}"...`, "info");

      try {
        const res = await fetch(`/api/documents/download?id=${doc.id}&t=${Date.now()}`);
        if (res.ok) {
          const blob = await res.blob();
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = doc.name || `Dokumen_${doc.id}.pdf`;
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();

          setTimeout(() => {
            if (document.body.contains(link)) {
              document.body.removeChild(link);
            }
            URL.revokeObjectURL(downloadUrl);
          }, 4000);

          successCount++;
        }
      } catch (err) {
        console.error(`Gagal mengunduh berkas "${doc.name}":`, err);
      }

      // Jeda antar unduhan agar browser memproses setiap berkas asli secara terpisah
      if (i < selectedDocs.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }

    setIsBatchDownloading(false);
    if (successCount > 0) {
      showToastMsg(`Selesai! ${successCount} berkas berhasil diunduh langsung ke folder Downloads.`, "success");
    } else {
      showToastMsg("Gagal mengunduh berkas terpilih.", "error");
    }
  };

  const handleExportCSV = () => {
    if (documents.length === 0) {
      showToastMsg("Tidak ada dokumen untuk diekspor.");
      return;
    }
    let csvContent = "data:text/csv;charset=utf-8,ID,Nama File,Kategori,Status,Ukuran,Tanggal,Pengunggah,URL Berkas\n";
    documents.forEach((d) => {
      csvContent += `${d.id},"${d.name}","${d.category}",${d.status},${d.size},"${d.date}","${d.uploader}","${d.fileUrl || ''}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Daftar_Dokumen_Setda_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToastMsg("File CSV berhasil diunduh!", "success");
  };

  // Helper to extract document date as YYYY-MM-DD local date string
  const getDocDateString = (doc: DocumentItem): string => {
    // 1. Parse dateFull (ISO 8601 string)
    if (doc.dateFull) {
      const d = new Date(doc.dateFull);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    }

    // 2. Parse from doc.date text (e.g. "Senin, 7 Sep 2026, 08:10 WIB" or "07 Sep 2026")
    if (doc.date) {
      const monthMap: Record<string, string> = {
        jan: "01", januari: "01",
        feb: "02", februari: "02",
        mar: "03", maret: "03",
        apr: "04", april: "04",
        mei: "05", may: "05",
        jun: "06", juni: "06",
        jul: "07", juli: "07",
        agu: "08", agustus: "08", aug: "08",
        sep: "09", september: "09",
        okt: "10", oktober: "10", oct: "10",
        nov: "11", november: "11",
        des: "12", desember: "12", dec: "12"
      };

      const textMatch = doc.date.toLowerCase().match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
      if (textMatch) {
        const day = textMatch[1].padStart(2, "0");
        const monthStr = textMatch[2];
        const year = textMatch[3];
        const monthNum = monthMap[monthStr] || monthMap[monthStr.slice(0, 3)];
        if (monthNum) {
          return `${year}-${monthNum}-${day}`;
        }
      }

      const isoMatch = doc.date.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
      }
    }

    // 3. Parse from doc.id timestamp
    if (typeof doc.id === "number" && doc.id > 1000000000000) {
      const d = new Date(doc.id);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    }

    return "";
  };

  // Helper to get Date object from doc
  const getDocumentDateObj = (doc: DocumentItem): Date => {
    if (doc.dateFull) {
      const d = new Date(doc.dateFull);
      if (!isNaN(d.getTime())) return d;
    }
    if (typeof doc.id === "number" && doc.id > 1000000000000) {
      const d = new Date(doc.id);
      if (!isNaN(d.getTime())) return d;
    }
    const dateStr = getDocDateString(doc);
    if (dateStr) {
      const parts = dateStr.split("-");
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return new Date();
  };

  // Helper to format YYYY-MM-DD to Indonesian string for display
  const formatIndoDate = (isoStr: string) => {
    if (!isoStr) return "";
    const parts = isoStr.split("-");
    if (parts.length !== 3) return isoStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const monthIdx = parseInt(parts[1], 10) - 1;
    return `${parseInt(parts[2], 10)} ${months[monthIdx] || parts[1]} ${parts[0]}`;
  };

  const filteredDocuments = documents.filter((doc) => {
    // 1. Category Filter
    if (catFilter !== "all" && doc.category !== catFilter) return false;

    // 2. Format / Type Filter
    if (typeFilter !== "all" && doc.type !== typeFilter) return false;

    // 3. Date Preset & Range Filter
    if (dateFilterPreset !== "all") {
      const docDateStr = getDocDateString(doc);
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      if (dateFilterPreset === "today") {
        if (docDateStr !== todayStr) return false;
      } else if (dateFilterPreset === "yesterday") {
        const yest = new Date(now);
        yest.setDate(now.getDate() - 1);
        const yesterdayStr = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, "0")}-${String(yest.getDate()).padStart(2, "0")}`;
        if (docDateStr !== yesterdayStr) return false;
      } else if (dateFilterPreset === "7days") {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        const sevenDaysAgoStr = `${sevenDaysAgo.getFullYear()}-${String(sevenDaysAgo.getMonth() + 1).padStart(2, "0")}-${String(sevenDaysAgo.getDate()).padStart(2, "0")}`;
        if (docDateStr < sevenDaysAgoStr || docDateStr > todayStr) return false;
      } else if (dateFilterPreset === "30days") {
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        const thirtyDaysAgoStr = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth() + 1).padStart(2, "0")}-${String(thirtyDaysAgo.getDate()).padStart(2, "0")}`;
        if (docDateStr < thirtyDaysAgoStr || docDateStr > todayStr) return false;
      } else if (dateFilterPreset === "thisMonth") {
        const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        if (!docDateStr.startsWith(currentYearMonth)) return false;
      } else if (dateFilterPreset === "custom") {
        if (customStartDate && !customEndDate) {
          // Exact single date filter
          if (docDateStr !== customStartDate) return false;
        } else if (customStartDate && customEndDate) {
          // Date range filter
          if (docDateStr < customStartDate || docDateStr > customEndDate) return false;
        }
      }
    }

    // 4. Smart Search Query (Matches filename, category, tags, desc, uploader, day name, date, month, year)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const docDate = getDocumentDateObj(doc);
      
      const dayNames = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
      const monthNames = ["januari", "februari", "maret", "april", "mei", "juni", "juli", "agustus", "september", "oktober", "november", "desember"];
      const monthShort = ["jan", "feb", "mar", "apr", "mei", "jun", "jul", "agu", "sep", "okt", "nov", "des"];

      const docDayName = dayNames[docDate.getDay()];
      const docMonthName = monthNames[docDate.getMonth()];
      const docMonthShort = monthShort[docDate.getMonth()];
      const docYearStr = String(docDate.getFullYear());
      const docDateNum = String(docDate.getDate());
      const docDatePadded = docDateNum.padStart(2, "0");
      const docIsoDate = `${docYearStr}-${String(docDate.getMonth() + 1).padStart(2, "0")}-${docDatePadded}`;

      const matchesSearch =
        doc.name.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q) ||
        (doc.uploader && doc.uploader.toLowerCase().includes(q)) ||
        (doc.desc && doc.desc.toLowerCase().includes(q)) ||
        (doc.tags && doc.tags.toLowerCase().includes(q)) ||
        (doc.date && doc.date.toLowerCase().includes(q)) ||
        docDayName.includes(q) ||
        docMonthName.includes(q) ||
        docMonthShort.includes(q) ||
        docYearStr.includes(q) ||
        docIsoDate.includes(q) ||
        `${docDateNum} ${docMonthName} ${docYearStr}`.toLowerCase().includes(q) ||
        `${docDateNum} ${docMonthShort} ${docYearStr}`.toLowerCase().includes(q) ||
        `${docDayName}, ${docDateNum} ${docMonthShort} ${docYearStr}`.toLowerCase().includes(q);

      if (!matchesSearch) return false;
    }

    return true;
  });

  if (!mounted) return null;

  if (!isLoggedIn) {
    return (
      <div className="login-wrapper">
        <div style={{ position: "absolute", top: "20px", right: "20px", zIndex: 10 }}>
          <button
            type="button"
            className="icon-btn"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              boxShadow: "var(--shadow-md)"
            }}
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <div className="login-backdrop-decor"></div>
        <div className={`login-card ${isShaking ? "shake-error" : ""}`}>
          <div className="secure-badge">
            <ShieldCheck size={14} /> KHUSUS AKSES BAGIAN UMUM SETDA
          </div>
          <div className="login-logo" style={{ background: "transparent", width: "auto", height: "auto", boxShadow: "none" }}>
            <img src="/logo-gunungkidul.png" alt="Logo Kab. Gunungkidul" className="login-brand-logo-img" />
          </div>
          <h1 className="login-title">Setda Kab. Gunungkidul</h1>
          <p className="login-subtitle">Sistem Manajemen Dokumen - Bagian Umum</p>

          {loginError && (
            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--danger)", borderRadius: "var(--radius-md)", padding: "12px", marginBottom: "16px", color: "var(--danger)", fontSize: "12.5px", lineHeight: "1.5", textAlign: "left" }}>
              <strong>🛑 Akses Ditolak</strong>
              <div style={{ marginTop: "4px" }}>{loginError}</div>
            </div>
          )}

          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label>NIP (Nomor Induk Pegawai)</label>
              <div className="input-with-icon">
                <FileText size={18} />
                <input
                  type="text"
                  value={loginNip}
                  onChange={(e) => {
                    setLoginNip(e.target.value);
                    setLoginError("");
                  }}
                  placeholder="Contoh: 19850712 201001 1 008"
                  maxLength={22}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-primary-block">
              Masuk ke System DMS Bagian Umum <ArrowRight size={16} />
            </button>
          </form>

          <div className="login-demo-helper" style={{ marginTop: "20px", padding: "12px", background: "var(--primary-light)", border: "1px solid var(--primary-border)", borderRadius: "var(--radius-md)", fontSize: "11.5px", textAlign: "left", color: "var(--text-main)" }}>
            <div style={{ fontWeight: 700, color: "var(--primary)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
              ℹ️ Info Login NIP Pegawai
            </div>
            <div><strong>Master Admin Bagian Umum:</strong> 19850712 201001 1 008</div>
            <div style={{ marginTop: "4px", fontSize: "11px", color: "var(--text-muted)" }}>* Anda juga dapat login dengan NIP staf asli yang Anda daftarkan melalui menu <em>User & System Management</em>.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="app">
      {/* MOBILE BACKDROP OVERLAY */}
      <div
        className={`sidebar-overlay ${isMobileSidebarOpen ? "active" : ""}`}
        onClick={() => setIsMobileSidebarOpen(false)}
      ></div>

      {/* SIDEBAR */}
      <aside className={`sidebar ${isMobileSidebarOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <img src="/logo-gunungkidul.png" alt="Logo Kab. Gunungkidul" className="sidebar-brand-logo-img" />
          <div className="sidebar-brand-info">
            <h2>Setda Gunungkidul</h2>
            <p>DMS Bagian Umum</p>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setIsMobileSidebarOpen(false)}
            title="Tutup Menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div
            className={`nav-item ${currentView === "dashboard" ? "active" : ""}`}
            onClick={() => { setCurrentView("dashboard"); setIsMobileSidebarOpen(false); }}
          >
            <LayoutGrid size={18} /> Dashboard
          </div>
          <div
            className={`nav-item ${currentView === "all-documents" ? "active" : ""}`}
            onClick={() => { setCurrentView("all-documents"); setIsMobileSidebarOpen(false); }}
          >
            <FileText size={18} /> All Documents
          </div>
          <div
            className={`nav-item ${currentView === "categories" ? "active" : ""}`}
            onClick={() => { setCurrentView("categories"); setIsMobileSidebarOpen(false); }}
          >
            <Folder size={18} /> Categories
          </div>
          <div
            className={`nav-item ${currentView === "uploads" ? "active" : ""}`}
            onClick={() => { setCurrentView("uploads"); setIsMobileSidebarOpen(false); }}
          >
            <UploadCloud size={18} /> Uploads
          </div>
          <div
            className={`nav-item ${currentView === "management" ? "active" : ""}`}
            onClick={() => { setCurrentView("management"); setIsMobileSidebarOpen(false); }}
          >
            <Users size={18} /> Management
          </div>
          <div
            className={`nav-item ${currentView === "support" ? "active" : ""}`}
            onClick={() => { setCurrentView("support"); setIsMobileSidebarOpen(false); }}
          >
            <HelpCircle size={18} /> Support / Bantuan
          </div>
        </nav>
      </aside>

      {/* MAIN WRAPPER */}
      <div className="main-wrapper">
        {/* TOPBAR HEADER */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-toggle"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              title="Menu Navigasi Mobile"
            >
              <Menu size={20} />
            </button>
            <div className="topbar-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Cari berkas, hari (Senin/Jumat), tanggal (04 Sep 2026)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    padding: "2px"
                  }}
                  onClick={() => setSearchQuery("")}
                  title="Hapus Pencarian"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="topbar-right">
            {/* Cloud Sync Status & Manual Sync Button */}
            <button
              className="icon-btn sync-btn"
              onClick={async () => {
                setIsSyncing(true);
                await loadSharedDocuments();
                await loadCategories();
                await loadStaff();
                setTimeout(() => setIsSyncing(false), 600);
                showToastMsg("Sinkronisasi Cloud Berhasil! Data HP & Laptop kini sinkron.", "success");
              }}
              title="Status: Terhubung ke Cloud Database. Klik untuk sinkronisasi paksa"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                width: "auto",
                padding: "0 12px",
                borderRadius: "20px",
                background: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                color: "#10b981",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              <RotateCcw size={14} className={isSyncing ? "spin-animation" : ""} />
              <span className="sync-text-desktop">Cloud Aktif</span>
            </button>

            <button
              className="icon-btn"
              onClick={() => {
                const nextMode = !darkMode;
                setDarkMode(nextMode);
                showToastMsg(nextMode ? "Mode Gelap aktif" : "Mode Terang aktif", "info");
              }}
              title={darkMode ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              className="icon-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
            >
              <Bell size={20} />
              {documents.length > 0 && <span className="badge-dot"></span>}
            </button>

            <div
              className="user-profile-menu"
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              title="Menu Profil Pengguna"
            >
              <div className="user-avatar-icon">
                <User size={18} />
              </div>
              <span className="user-profile-name">{currentUser.name}</span>
            </div>
          </div>

          {/* PROFILE MENU DROPDOWN */}
          {showProfileMenu && (
            <div className="profile-menu-dropdown">
              <div className="profile-dropdown-header">
                <div className="user-avatar-icon" style={{ width: "40px", height: "40px" }}>
                  <User size={20} />
                </div>
                <div className="profile-dropdown-info">
                  <h4>{currentUser.name}</h4>
                  <p>{currentUser.email}</p>
                  <span className="profile-dropdown-badge">{currentUser.role}</span>
                </div>
              </div>
              <div className="profile-dropdown-list">
                <div className="profile-dropdown-item" onClick={() => { setShowProfileModal(true); setShowProfileMenu(false); }}>
                  <User size={16} /> Lihat & Edit Profil
                </div>
                <div
                  className="profile-dropdown-item"
                  onClick={() => {
                    const nextMode = !darkMode;
                    setDarkMode(nextMode);
                    showToastMsg(nextMode ? "Mode Gelap aktif" : "Mode Terang aktif", "info");
                  }}
                >
                  {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                  <span>{darkMode ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}</span>
                </div>
                <div className="profile-dropdown-item logout" onClick={handleLogout}>
                  <LogOut size={16} /> Keluar (Logout)
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATION DRAWER */}
          {showNotifications && (
            <div className="notification-drawer">
              <div className="notification-header">
                <span>Pemberitahuan Sistem</span>
                <button
                  style={{ fontSize: "11.5px", color: "var(--primary)", fontWeight: 600 }}
                  onClick={() => setShowNotifications(false)}
                >
                  Tutup
                </button>
              </div>
              <div className="notification-list">
                {documents.length > 0 ? (
                  documents.slice(0, 3).map((d) => (
                    <div key={d.id} className="notification-item">
                      <div className="notification-icon">
                        <FileText size={16} />
                      </div>
                      <div className="notification-text">
                        <p>
                          <strong>{d.name}</strong> ditambahkan ke server.
                        </p>
                        <span>{d.date}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "12.5px" }}>
                    Belum ada pemberitahuan baru.
                  </div>
                )}
              </div>
            </div>
          )}
        </header>

        {/* CONTENT CONTAINER */}
        <main className="content-container">
          {/* VIEW 1: DASHBOARD */}
          {currentView === "dashboard" && (
            <section className="page-view">
              <div className="page-header">
                <div>
                  <h1 className="page-title">Selamat Datang, Staff Bagian Umum</h1>
                  <p className="page-subtitle">Here is the overview of your document management system.</p>
                </div>
              </div>

              {/* STATS GRID */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <div className="stat-icon-wrapper blue">
                      <FileText size={20} />
                    </div>
                  </div>
                  <div className="stat-label">TOTAL DOCUMENTS</div>
                  <div className="stat-value">{documents.length}</div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <div className="stat-icon-wrapper blue">
                      <UploadCloud size={20} />
                    </div>
                  </div>
                  <div className="stat-label">RECENT UPLOADS</div>
                  <div className="stat-value">{documents.length}</div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <div className="stat-icon-wrapper purple">
                      <Folder size={20} />
                    </div>
                  </div>
                  <div className="stat-label">CATEGORIES</div>
                  <div className="stat-value">{categories.length}</div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <div className="stat-icon-wrapper blue">
                      <Users size={20} />
                    </div>
                  </div>
                  <div className="stat-label">ACTIVE STAFF</div>
                  <div className="stat-value">{staff.length}</div>
                </div>
              </div>

              {/* DASHBOARD CONTENT GRID */}
              <div className="dashboard-grid">
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Recent Activity (Server Storage)</h3>
                    <span className="card-action-link" onClick={() => setCurrentView("all-documents")}>View All</span>
                  </div>
                  <div className="table-responsive">
                    {documents.length > 0 ? (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>FILE NAME</th>
                            <th>CATEGORY</th>
                            <th>DATE MODIFIED</th>
                            <th style={{ textAlign: "right" }}>ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {documents.map((doc) => (
                            <tr key={doc.id} onClick={() => setSelectedDoc(doc)}>
                              <td>
                                <div className="file-name-cell">
                                  <div className={`file-type-icon ${doc.type}`}>{doc.type.toUpperCase()}</div>
                                  <div>
                                    <div style={{ fontWeight: 600 }}>{doc.name}</div>
                                    <div className="file-meta">{doc.size} • {doc.version}</div>
                                  </div>
                                </div>
                              </td>
                              <td><span className="badge badge-category">{doc.category}</span></td>
                              <td style={{ color: "var(--text-muted)", fontSize: "13px" }}>{doc.date}</td>
                              <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                                <button className="icon-btn" onClick={() => setSelectedDoc(doc)} title="Pratinjau Dokumen">
                                  <Eye size={16} />
                                </button>
                                <button className="icon-btn" onClick={() => handleDownloadDocument(doc)} title="Unduh Berkas ke Komputer">
                                  <Download size={16} />
                                </button>
                                <button className="icon-btn" onClick={() => setDocToDelete(doc)} title="Hapus Berkas">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)" }}>
                        <Inbox size={40} style={{ margin: "0 auto 12px auto", opacity: 0.5 }} />
                        <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>Belum ada berkas terunggah di server</h4>
                        <p style={{ fontSize: "13px", marginBottom: "16px" }}>Setiap berkas yang diunggah staf akan langsung tersimpan di server pusat dan dapat diakses oleh semua pengguna.</p>
                        <button className="btn-primary-block" style={{ width: "auto", margin: "0 auto", padding: "8px 20px" }} onClick={() => setCurrentView("uploads")}>
                          <UploadCloud size={16} /> Upload Berkas Baru
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Quick Access</h3>
                  </div>
                  <div className="quick-access-grid">
                    <div className="quick-card" onClick={() => { setCatFilter("Surat Keputusan"); setCurrentView("all-documents"); }}>
                      <div className="quick-card-icon"><FileCheck size={20} /></div>
                      <span className="quick-card-title">Surat Keputusan</span>
                    </div>
                    <div className="quick-card" onClick={() => { setCatFilter("Laporan Keuangan"); setCurrentView("all-documents"); }}>
                      <div className="quick-card-icon"><Landmark size={20} /></div>
                      <span className="quick-card-title">Laporan Keuangan</span>
                    </div>
                    <div className="quick-card" onClick={() => { setCatFilter("Arsip Umum"); setCurrentView("all-documents"); }}>
                      <div className="quick-card-icon"><Archive size={20} /></div>
                      <span className="quick-card-title">Arsip Umum</span>
                    </div>
                    <div className="quick-card" onClick={() => { setCatFilter("Kepegawaian"); setCurrentView("all-documents"); }}>
                      <div className="quick-card-icon"><Users size={20} /></div>
                      <span className="quick-card-title">Kepegawaian</span>
                    </div>
                  </div>
                  <div className="quick-access-footer">
                    <span className="card-action-link" onClick={() => setCurrentView("categories")}>Browse All Categories</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* VIEW 2: CATEGORIES */}
          {currentView === "categories" && (
            <section className="page-view">
              <div className="page-header">
                <div>
                  <h1 className="page-title">Document Categories</h1>
                  <p className="page-subtitle">Manage and organize organizational document structures.</p>
                </div>
                <button
                  className="btn-primary-block"
                  style={{ width: "auto", padding: "10px 18px", margin: 0, background: "var(--primary)" }}
                  onClick={() => setShowAddCategoryModal(true)}
                >
                  <Plus size={16} /> Add New Category
                </button>
              </div>

              <div className="categories-grid">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="category-card"
                    onClick={() => {
                      setCatFilter(cat.title);
                      setCurrentView("all-documents");
                    }}
                  >
                    <div>
                      <div className="category-card-icon"><Folder size={22} /></div>
                      <h3 className="category-card-title">{cat.title}</h3>
                      <p className="category-card-desc">{cat.desc}</p>
                    </div>
                    <div className="category-card-meta">
                      <div className="category-meta-item"><span>BERKAS SERVER</span><strong>{getCategoryDocCount(cat.title)}</strong></div>
                      <div className="category-meta-item" style={{ textAlign: "right" }}><span>STATUS</span><strong style={{ color: "var(--success)" }}>Active</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* VIEW 3: ALL DOCUMENTS */}
          {currentView === "all-documents" && (
            <section className="page-view">
              <div className="page-header">
                <div>
                  <h1 className="page-title">Daftar Dokumen Pusat (Server Shared Storage)</h1>
                  <p className="page-subtitle">Setiap berkas yang diunggah staf tersimpan di server dan dapat dilihat/diunduh oleh semua pengguna.</p>
                </div>
                <button className="btn-secondary" onClick={handleExportCSV}>
                  <Download size={15} /> Export CSV
                </button>
              </div>

              <div className="segmented-filter-wrapper">
                <div className="segmented-pill-container">
                  <div
                    className={`segmented-pill-item ${catFilter === "all" ? "active" : ""}`}
                    onClick={() => setCatFilter("all")}
                  >
                    Semua
                  </div>
                  {categories.map((c) => (
                    <div
                      key={c.id}
                      className={`segmented-pill-item ${catFilter === c.title ? "active" : ""}`}
                      onClick={() => setCatFilter(c.title)}
                    >
                      {c.title}
                    </div>
                  ))}
                </div>

                <div className="format-pill-group">
                  <button
                    className={`format-pill-btn ${typeFilter === "all" ? "active" : ""}`}
                    onClick={() => setTypeFilter("all")}
                  >
                    Semua Format
                  </button>
                  <button
                    className={`format-pill-btn ${typeFilter === "pdf" ? "active" : ""}`}
                    onClick={() => setTypeFilter("pdf")}
                  >
                    PDF
                  </button>
                  <button
                    className={`format-pill-btn ${typeFilter === "docx" ? "active" : ""}`}
                    onClick={() => setTypeFilter("docx")}
                  >
                    Word
                  </button>
                  <button
                    className={`format-pill-btn ${typeFilter === "xlsx" ? "active" : ""}`}
                    onClick={() => setTypeFilter("xlsx")}
                  >
                    Excel
                  </button>
                </div>
              </div>

              {/* SIMPLE & COMPACT DATE FILTER TOOLBAR */}
              <div className="simple-date-toolbar">
                <div className="simple-date-left">
                  <Calendar size={15} style={{ color: "var(--primary)" }} />
                  <span className="simple-date-title">Waktu:</span>
                  <button
                    type="button"
                    className={`simple-date-btn ${dateFilterPreset === "all" && !customStartDate ? "active" : ""}`}
                    onClick={() => {
                      setDateFilterPreset("all");
                      setCustomStartDate("");
                      setCustomEndDate("");
                    }}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    className={`simple-date-btn ${dateFilterPreset === "today" ? "active" : ""}`}
                    onClick={() => {
                      setDateFilterPreset("today");
                      setCustomStartDate("");
                      setCustomEndDate("");
                    }}
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    className={`simple-date-btn ${dateFilterPreset === "yesterday" ? "active" : ""}`}
                    onClick={() => {
                      setDateFilterPreset("yesterday");
                      setCustomStartDate("");
                      setCustomEndDate("");
                    }}
                  >
                    Kemarin
                  </button>
                  <button
                    type="button"
                    className={`simple-date-btn ${dateFilterPreset === "thisMonth" ? "active" : ""}`}
                    onClick={() => {
                      setDateFilterPreset("thisMonth");
                      setCustomStartDate("");
                      setCustomEndDate("");
                    }}
                  >
                    Bulan Ini
                  </button>
                </div>

                <div className="simple-date-right">
                  <span className="simple-date-picker-label">Pilih Tanggal:</span>
                  <div className="simple-date-picker-wrap">
                    <input
                      type="date"
                      className="simple-date-input"
                      value={customStartDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomStartDate(val);
                        setCustomEndDate("");
                        setDateFilterPreset(val ? "custom" : "all");
                      }}
                    />
                    {customStartDate && (
                      <button
                        type="button"
                        className="simple-date-clear"
                        onClick={() => {
                          setCustomStartDate("");
                          setCustomEndDate("");
                          setDateFilterPreset("all");
                        }}
                        title="Reset Tanggal"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTIVE FILTER SUMMARY BAR */}
              {(dateFilterPreset !== "all" || searchQuery || catFilter !== "all" || typeFilter !== "all") && (
                <div className="active-filter-banner">
                  <div className="active-filter-text">
                    <span>
                      Ditemukan <strong>{filteredDocuments.length}</strong> dari <strong>{documents.length}</strong> dokumen
                      {dateFilterPreset === "today" && " • Diunggah Hari Ini"}
                      {dateFilterPreset === "yesterday" && " • Diunggah Kemarin"}
                      {dateFilterPreset === "7days" && " • 7 Hari Terakhir"}
                      {dateFilterPreset === "thisMonth" && " • Bulan Ini"}
                      {dateFilterPreset === "custom" && customStartDate && ` • Tanggal: ${formatIndoDate(customStartDate)} ${customEndDate ? 's/d ' + formatIndoDate(customEndDate) : ''}`}
                      {catFilter !== "all" && ` • Kategori: ${catFilter}`}
                      {typeFilter !== "all" && ` • Format: ${typeFilter.toUpperCase()}`}
                      {searchQuery && ` • Kata Kunci: "${searchQuery}"`}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="active-filter-clear-btn"
                    onClick={() => {
                      setDateFilterPreset("all");
                      setCustomStartDate("");
                      setCustomEndDate("");
                      setCatFilter("all");
                      setTypeFilter("all");
                      setSearchQuery("");
                    }}
                  >
                    <RotateCcw size={12} /> Hapus Semua Filter
                  </button>
                </div>
              )}

              <div className="card">
                <div className="table-responsive">
                  {filteredDocuments.length > 0 ? (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ width: "40px" }}>
                            <input type="checkbox" onChange={handleSelectAllDocs} checked={selectedDocIds.length > 0 && selectedDocIds.length === filteredDocuments.length} />
                          </th>
                          <th>FILE NAME</th>
                          <th>CATEGORY</th>
                          <th>STATUS</th>
                          <th>DATE UPLOADED</th>
                          <th>UPLOADER</th>
                          <th style={{ textAlign: "right" }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDocuments.map((doc) => (
                          <tr key={doc.id} onClick={() => setSelectedDoc(doc)}>
                            <td onClick={(e) => e.stopPropagation()}>
                              <input type="checkbox" checked={selectedDocIds.includes(doc.id)} onChange={() => handleSelectDoc(doc.id)} />
                            </td>
                            <td>
                              <div className="file-name-cell">
                                <div className={`file-type-icon ${doc.type}`}>{doc.type.toUpperCase()}</div>
                                <div>
                                  <div style={{ fontWeight: 600 }}>{doc.name}</div>
                                  <div className="file-meta">{doc.size} • {doc.version}</div>
                                </div>
                              </div>
                            </td>
                            <td><span className="badge badge-category">{doc.category}</span></td>
                            <td>
                              <span className="badge-approval approved">Tersimpan di Server</span>
                            </td>
                            <td style={{ color: "var(--text-muted)", fontSize: "13px" }}>{doc.date}</td>
                            <td>{doc.uploader}</td>
                            <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                              <button className="icon-btn" onClick={() => setSelectedDoc(doc)} title="Lihat Pratinjau"><Eye size={16} /></button>
                              <button className="icon-btn" onClick={() => handleDownloadDocument(doc)} title="Unduh Berkas ke Komputer"><Download size={16} /></button>
                              <button className="icon-btn" onClick={() => setDocToDelete(doc)} title="Hapus Berkas"><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)" }}>
                      <Inbox size={40} style={{ margin: "0 auto 12px auto", opacity: 0.5 }} />
                      <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>Belum ada berkas terunggah</h4>
                      <p style={{ fontSize: "13px", marginBottom: "16px" }}>Upload berkas asli dari komputer Anda untuk dibagikan ke seluruh staf.</p>
                      <button className="btn-primary-block" style={{ width: "auto", margin: "0 auto", padding: "8px 20px" }} onClick={() => setCurrentView("uploads")}>
                        <UploadCloud size={16} /> Upload Berkas Baru
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* VIEW 4: UPLOADS */}
          {currentView === "uploads" && (
            <section className="page-view">
              <div className="page-header">
                <div>
                  <h1 className="page-title">Upload New Document (Server Drive)</h1>
                  <p className="page-subtitle">Berkas yang diunggah akan langsung tersimpan di server dan dapat diakses semua staf.</p>
                </div>
              </div>

              <div className="upload-grid">
                <label
                  htmlFor="hidden-file-input"
                  className="dropzone-box"
                  style={{
                    cursor: "pointer",
                    position: "relative",
                    display: "block",
                    touchAction: "manipulation"
                  }}
                >
                  <input
                    type="file"
                    id="hidden-file-input"
                    accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.txt,.png,.jpg,.jpeg,.webp,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                      cursor: "pointer",
                      zIndex: 10
                    }}
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        setSelectedFile(e.target.files[0]);
                        if (!uploadTitle) setUploadTitle(e.target.files[0].name);
                      }
                    }}
                  />
                  <div className="dropzone-icon"><UploadCloud size={28} /></div>
                  <h3 className="dropzone-title">Pilih Berkas dari HP / Komputer</h3>
                  <p className="dropzone-subtitle">Ketuk di sini untuk memilih file dokumen atau foto</p>
                  <div className="file-tags">
                    <span className="file-tag">PDF</span>
                    <span className="file-tag">DOCX</span>
                    <span className="file-tag">XLSX</span>
                    <span className="file-tag">GAMBAR</span>
                  </div>
                  {selectedFile ? (
                    <div style={{ marginTop: "16px", padding: "12px 16px", background: "var(--bg-card)", border: "2px solid var(--primary)", borderRadius: "var(--radius-md)", textAlign: "left", width: "100%", position: "relative", zIndex: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "var(--primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <CheckCircle2 size={16} style={{ flexShrink: 0 }} /> <span>{selectedFile.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedFile(null);
                          }}
                          style={{
                            background: "#fee2e2",
                            border: "none",
                            color: "#dc2626",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                            flexShrink: 0
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Berkas Siap Diunggah (Ketuk untuk ganti)
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: "14px" }}>
                      <span className="btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px", pointerEvents: "none", fontSize: "12.5px", padding: "8px 16px", fontWeight: 600 }}>
                        📁 Buka File Manager / Foto HP
                      </span>
                    </div>
                  )}
                </label>

                <div className="card" style={{ padding: "28px" }}>
                  <form onSubmit={handleUploadSubmit}>
                    <div className="form-group">
                      <label>Document Title <span className="required">*</span></label>
                      <input type="text" className="form-control" placeholder="Judul dokumen resmi..." value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ position: "relative" }}>
                      <label style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px", display: "block" }}>
                        Kategori Dokumen <span className="required">*</span>
                      </label>

                      {/* CUSTOM DROPDOWN BUTTON WITH ARROW */}
                      <div
                        className={`custom-cat-select-btn ${isCatDropdownOpen ? "open" : ""} ${catError && !uploadCategory ? "error" : ""}`}
                        onClick={() => {
                          setIsCatDropdownOpen(!isCatDropdownOpen);
                          if (catError) setCatError(false);
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <Folder size={18} style={{ color: catError && !uploadCategory ? "#ef4444" : "var(--primary)" }} />
                          <span style={{ fontWeight: uploadCategory ? 700 : 500, color: uploadCategory ? "var(--text-main)" : (catError ? "#ef4444" : "var(--text-muted)") }}>
                            {uploadCategory || "Pilih Kategori Dokumen..."}
                          </span>
                        </div>
                        <ChevronDown
                          size={18}
                          style={{
                            transition: "transform 0.2s ease",
                            transform: isCatDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                            color: "var(--text-muted)"
                          }}
                        />
                      </div>

                      {/* INLINE WARNING NOTIFICATION */}
                      {catError && !uploadCategory && (
                        <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "6px", color: "#ef4444", fontSize: "12px", fontWeight: 600 }}>
                          <AlertCircle size={14} />
                          <span>Kategori dokumen wajib dipilih sebelum mengunggah.</span>
                        </div>
                      )}

                      {/* DOWNWARD VERTICAL SCROLLABLE MENU */}
                      {isCatDropdownOpen && (
                        <div className="custom-cat-dropdown-menu">
                          {categories.map((c) => {
                            const isSelected = uploadCategory === c.title;
                            return (
                              <div
                                key={c.id}
                                className={`custom-cat-dropdown-item ${isSelected ? "selected" : ""}`}
                                onClick={() => {
                                  setUploadCategory(c.title);
                                  setCatError(false);
                                  setIsCatDropdownOpen(false);
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                  <Folder size={18} style={{ color: "var(--primary)", flexShrink: 0 }} />
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-main)" }}>{c.title}</div>
                                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{c.desc}</div>
                                  </div>
                                </div>
                                {isSelected && <CheckCircle2 size={16} style={{ color: "var(--primary)" }} />}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea className="form-control" placeholder="Brief summary or context regarding this document..." value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)}></textarea>
                    </div>
                    <div className="form-group">
                      <label>Keywords / Tags</label>
                      <input type="text" className="form-control" placeholder="e.g. anggaran, 2024, rahasia" value={uploadTags} onChange={(e) => setUploadTags(e.target.value)} />
                    </div>
                    <div className="form-actions" style={{ display: "flex", gap: "12px", marginTop: "24px", flexWrap: "wrap" }}>
                      <button type="button" className="btn-secondary" onClick={() => setCurrentView("all-documents")} style={{ flex: "1", minHeight: "44px" }}>Cancel</button>
                      <button type="submit" className="btn-primary-block" disabled={isUploading} style={{ flex: "2", minWidth: "180px", minHeight: "44px", padding: "12px 24px", margin: 0, background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)", boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        <UploadCloud size={18} /> {isUploading ? "Mengunggah..." : "Simpan Berkas ke Server"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </section>
          )}

          {/* VIEW 5: MANAGEMENT */}
          {currentView === "management" && (
            <section className="page-view">
              <div className="page-header">
                <div>
                  <h1 className="page-title">User & System Management</h1>
                  <p className="page-subtitle">Manage staff access levels, roles, and global system configurations.</p>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button className="btn-secondary" style={{ padding: "10px 16px", display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: 600 }} onClick={handleExportFullBackup}>
                    <Database size={16} /> Backup Database JSON
                  </button>
                  <button className="btn-primary-block" style={{ width: "auto", padding: "10px 18px", margin: 0 }} onClick={() => setShowAddStaffModal(true)}>
                    <UserPlus size={16} /> Add New Staff
                  </button>
                </div>
              </div>

              <div className="card">
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>USER</th>
                        <th>ROLE</th>
                        <th>STATUS</th>
                        <th>LAST ACTIVE</th>
                        <th style={{ textAlign: "right" }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staff.map((s) => (
                        <tr key={s.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div className="user-avatar-icon" style={{ width: "36px", height: "36px", flexShrink: 0 }}>
                                <User size={18} />
                              </div>
                              <div>
                                  <div style={{ fontWeight: 700 }}>{s.name}</div>
                                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                                    {s.email}
                                  </div>
                                  <div style={{ fontSize: "11px", color: "var(--primary)", fontWeight: 600 }}>
                                    Bagian: {s.division || "Umum"}
                                  </div>
                              </div>
                            </div>
                          </td>
                          <td><span className={`role-badge ${s.role.toLowerCase()}`}>{s.role}</span></td>
                          <td>
                            <div className="badge-status">
                              <span className={`status-dot ${s.status.toLowerCase()}`}></span>
                              <span>{s.status}</span>
                            </div>
                          </td>
                          <td style={{ color: "var(--text-muted)", fontSize: "13px" }}>{s.lastActive}</td>
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                              <button className="icon-btn" onClick={() => handleToggleStaffStatus(s.id)} title="Ganti Status Aktif/Nonaktif">
                                <RotateCcw size={16} />
                              </button>
                              {isAdmin && (
                                <button
                                  className="icon-btn"
                                  style={{ color: "var(--danger)" }}
                                  onClick={() => setStaffToDelete(s)}
                                  title="Hapus Akun Staf (Khusus Admin)"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* VIEW 6: SUPPORT */}
          {currentView === "support" && (
            <section className="page-view">
              <div className="page-header">
                <div>
                  <h1 className="page-title">Pusat Bantuan & Panduan Penggunaan</h1>
                  <p className="page-subtitle">Petunjuk teknis dan jawaban pertanyaan umum penggunaan Sistem Manajemen Dokumen Setda.</p>
                </div>
              </div>

              {/* QUICK GUIDE CARDS */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "28px" }}>
                <div className="card" style={{ padding: "20px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "16px", marginBottom: "12px" }}>1</div>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>Pilih Kategori Dokumen</h4>
                  <p style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>Kelompokkan berkas sesuai jenisnya (Surat Keputusan, Keuangan, Kepegawaian, dll).</p>
                </div>
                <div className="card" style={{ padding: "20px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "16px", marginBottom: "12px" }}>2</div>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>Upload Berkas Asli</h4>
                  <p style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>Unggah file PDF, Word, atau Excel dari komputer Anda langsung ke server pusat.</p>
                </div>
                <div className="card" style={{ padding: "20px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "16px", marginBottom: "12px" }}>3</div>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>Akses & Cari Mudah</h4>
                  <p style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>Cari dokumen dengan kata kunci dan pratinjau langsung dari peramban Anda.</p>
                </div>
              </div>

              {/* FAQ ACCORDION */}
              <div className="card" style={{ padding: "24px", marginBottom: "28px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <HelpCircle size={18} style={{ color: "var(--primary)" }} /> Pertanyaan Sering Diajukan (FAQ)
                </h3>

                {[
                  {
                    q: "Bagaimana cara mengunggah dokumen baru ke server?",
                    a: "Buka menu 'Uploads' dari sidebar navigasi kiri, pilih file dari komputer Anda, isi judul serta kategori dokumen, lalu klik tombol 'Simpan Berkas ke Server'."
                  },
                  {
                    q: "Siapa saja yang dapat mengakses dokumen yang sudah diunggah?",
                    a: "Seluruh staf Bagian Umum Setda yang memiliki akun terdaftar dapat melihat, melakukan pratinjau, dan mengunduh berkas resmi yang tersimpan di server pusat."
                  },
                  {
                    q: "Apakah berkas di server akan hilang jika saya keluar dari sistem (Logout)?",
                    a: "Tidak. Seluruh berkas dan metadata tersimpan secara permanen di server pusat Next.js (`/public/uploads/` & `/data/documents.json`), sehingga tetap aman dan dapat diakses kapan saja."
                  },
                  {
                    q: "Format berkas apa saja yang didukung oleh sistem?",
                    a: "DMS mendukung format dokumen PDF (.pdf), Microsoft Word (.docx), Microsoft Excel (.xlsx), serta gambar (.png, .jpg, .jpeg, .webp)."
                  }
                ].map((item, idx) => (
                  <div key={idx} className="faq-accordion-item">
                    <div
                      className="faq-accordion-header"
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    >
                      <span>{item.q}</span>
                      {openFaqIndex === idx ? <ChevronUp size={18} style={{ color: "var(--primary)" }} /> : <ChevronDown size={18} style={{ color: "var(--text-muted)" }} />}
                    </div>
                    {openFaqIndex === idx && (
                      <div className="faq-accordion-body">
                        {item.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* IT CONTACT CARD */}
              <div className="card" style={{ padding: "24px", background: "linear-gradient(135deg, rgba(37,99,235,0.04) 0%, rgba(30,58,138,0.06) 100%)", border: "1px solid var(--primary-border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "var(--primary)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <LifeBuoy size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>Butuh Bantuan Teknis Tambahan?</h3>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "2px 0 0 0" }}>Hubungi Tim IT Bagian Umum & Kominfo Setda Kab. Gunungkidul</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "24px", marginTop: "16px", flexWrap: "wrap", fontSize: "13px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Mail size={16} style={{ color: "var(--primary)" }} />
                    <span>Email: <strong>helpdesk.setda@gunungkidulkab.go.id</strong></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Phone size={16} style={{ color: "var(--primary)" }} />
                    <span>Ekstensi Internal: <strong>Ext. 104 / 105 (Jam Kerja)</strong></span>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="mobile-bottom-nav">
        <button
          type="button"
          className={`bottom-nav-item ${currentView === "dashboard" ? "active" : ""}`}
          onClick={() => { setCurrentView("dashboard"); setIsMobileSidebarOpen(false); }}
          title="Beranda"
        >
          <LayoutGrid size={20} />
          <span>Beranda</span>
        </button>
        <button
          type="button"
          className={`bottom-nav-item ${currentView === "all-documents" ? "active" : ""}`}
          onClick={() => { setCurrentView("all-documents"); setIsMobileSidebarOpen(false); }}
          title="Dokumen"
        >
          <FileText size={20} />
          <span>Dokumen</span>
        </button>
        <button
          type="button"
          className={`bottom-nav-item ${currentView === "uploads" ? "active" : ""}`}
          onClick={() => { setCurrentView("uploads"); setIsMobileSidebarOpen(false); }}
          title="Upload"
        >
          <div className="bottom-nav-upload-icon">
            <Plus size={18} />
          </div>
          <span>Upload</span>
        </button>
        <button
          type="button"
          className={`bottom-nav-item ${currentView === "categories" ? "active" : ""}`}
          onClick={() => { setCurrentView("categories"); setIsMobileSidebarOpen(false); }}
          title="Kategori"
        >
          <Folder size={20} />
          <span>Kategori</span>
        </button>
        <button
          type="button"
          className={`bottom-nav-item ${isMobileSidebarOpen ? "active" : ""}`}
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          title="Menu"
        >
          <Menu size={20} />
          <span>Menu</span>
        </button>
      </nav>

      {/* FLOATING BATCH ACTIONS BAR */}
      {selectedDocIds.length > 0 && (
        <div className="batch-actions-bar">
          <span style={{ fontWeight: 600, fontSize: "13px" }}>{selectedDocIds.length} dokumen dipilih</span>
          <button
            type="button"
            className="batch-btn"
            disabled={isBatchDownloading}
            onClick={handleBatchDownload}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Download size={14} /> {isBatchDownloading ? "Mengunduh..." : `Unduh Terpilih (${selectedDocIds.length})`}
          </button>
          <button
            type="button"
            className="batch-btn"
            onClick={() => setShowBatchDeleteModal(true)}
            style={{ background: "rgba(239, 68, 68, 0.25)", borderColor: "rgba(239, 68, 68, 0.4)", color: "#fca5a5" }}
          >
            <Trash2 size={14} /> Hapus Terpilih
          </button>
        </div>
      )}

      {/* DOCUMENT VIEWER & DOWNLOAD MODAL */}
      {selectedDoc && (
        <div className="modal-overlay active">
          <div className="modal-card modal-large" style={{ borderRadius: "var(--radius-xl)", overflow: "hidden", border: "1px solid var(--border-color)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <div className="modal-header" style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(99,102,241,0.04) 100%)", padding: "18px 24px", borderBottom: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span className="badge badge-category" style={{ fontSize: "12px", padding: "4px 12px", fontWeight: 700 }}>{selectedDoc.category}</span>
                <h3 className="modal-title" style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-main)" }}>{selectedDoc.name}</h3>
                <span style={{ fontSize: "11px", color: "#059669", background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "3px 10px", borderRadius: "12px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  ✓ Terverifikasi Server Setda
                </span>
              </div>
              <button className="icon-btn" onClick={() => setSelectedDoc(null)}><X size={18} /></button>
            </div>

            <div className="modal-body" style={{ padding: "24px" }}>
              <div className="doc-viewer-container" style={{ gap: "24px" }}>
                {/* LEFT PREVIEW CONTAINER */}
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "360px", boxShadow: "var(--shadow-sm)" }}>
                  {selectedDoc.fileUrl ? (
                    selectedDoc.type === "pdf" ? (
                      <iframe
                        src={selectedDoc.fileUrl}
                        width="100%"
                        height="420px"
                        style={{ border: "none", borderRadius: "8px" }}
                        title={selectedDoc.name}
                      />
                    ) : ["png", "jpg", "jpeg", "webp", "svg", "gif"].includes(selectedDoc.type?.toLowerCase()) ? (
                      <div style={{ textAlign: "center", padding: "12px" }}>
                        <img
                          src={selectedDoc.fileUrl}
                          alt={selectedDoc.name}
                          style={{ maxWidth: "100%", maxHeight: "400px", objectFit: "contain", borderRadius: "8px", margin: "0 auto", boxShadow: "var(--shadow-md)" }}
                        />
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", padding: "28px 16px" }}>
                        <div style={{ width: "80px", height: "80px", borderRadius: "20px", background: "linear-gradient(135deg, var(--dark-navy) 0%, var(--primary) 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "22px", margin: "0 auto 18px auto", boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.4)", letterSpacing: "1px" }}>
                          {selectedDoc.type?.toUpperCase()}
                        </div>
                        
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "1px", background: "var(--primary-light)", padding: "4px 12px", borderRadius: "20px", display: "inline-block", marginBottom: "8px" }}>
                          Dokumen Resmi Microsoft {selectedDoc.type === "docx" ? "Word" : selectedDoc.type === "xlsx" ? "Excel" : "Office"}
                        </span>
                        
                        <h4 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-main)", marginBottom: "6px" }}>
                          {selectedDoc.name}
                        </h4>
                        
                        <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginBottom: "24px" }}>
                          Ukuran Berkas: {selectedDoc.size} • Format {selectedDoc.type?.toUpperCase()} • Versi {selectedDoc.version}
                        </p>
                        
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <a
                            href={selectedDoc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-secondary"
                            style={{ fontSize: "13px", padding: "10px 20px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "8px" }}
                          >
                            <ExternalLink size={16} /> Buka Berkas di Tab Baru
                          </a>
                        </div>
                      </div>
                    )
                  ) : (
                    <div style={{ padding: "20px", textAlign: "center" }}>
                      <FileText size={48} style={{ color: "var(--primary)", margin: "0 auto 12px auto", opacity: 0.7 }} />
                      <h4 style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-main)" }}>{selectedDoc.name}</h4>
                      <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "6px" }}>Kategori: {selectedDoc.category}</p>
                    </div>
                  )}
                </div>

                {/* RIGHT METADATA PANEL */}
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)", letterSpacing: "0.5px" }}>
                    INFORMASI METADATA SERVER
                  </h4>

                  {/* USER CARD */}
                  <div style={{ background: "var(--bg-body)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)", display: "flex", alignItems: "center", gap: "12px" }}>
                    <div className="user-avatar-icon" style={{ width: "40px", height: "40px", flexShrink: 0 }}>
                      <User size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>PENGUNGGAH BERKAS</div>
                      <div style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-main)" }}>{selectedDoc.uploader}</div>
                      <div style={{ fontSize: "11px", color: "var(--primary)", fontWeight: 600 }}>Staf Bagian Umum Setda</div>
                    </div>
                  </div>

                  {/* DATE & SIZE CARD */}
                  <div style={{ background: "var(--bg-body)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>TANGGAL UPLOAD</div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)", marginTop: "2px" }}>{selectedDoc.date}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>UKURAN FILE</div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)", marginTop: "2px" }}>{selectedDoc.size}</div>
                    </div>
                  </div>

                  {/* SECURITY CARD */}
                  <div style={{ background: "rgba(30, 58, 138, 0.05)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid rgba(37, 99, 235, 0.15)" }}>
                    <div style={{ fontSize: "11px", color: "var(--primary)", fontWeight: 700, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Lock size={13} /> ENKRIPSI & KEAMANAN
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", lineHeight: 1.5 }}>
                      Tersimpan di Cloud Server Setda dengan enkripsi AES 256-bit. Dapat diakses oleh seluruh staf terverifikasi.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: "16px 24px", background: "var(--bg-body)", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.35)", background: "rgba(239, 68, 68, 0.08)", display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 600, padding: "9px 16px" }}
                onClick={() => {
                  const doc = selectedDoc;
                  setSelectedDoc(null);
                  setDocToDelete(doc);
                }}
              >
                <Trash2 size={16} /> Hapus Dokumen
              </button>

              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                <button className="btn-secondary" onClick={() => setSelectedDoc(null)} style={{ padding: "9px 20px", fontWeight: 600 }}>Tutup</button>
                <button
                  className="btn-primary-block"
                  style={{ width: "auto", padding: "9px 24px", margin: 0, background: "linear-gradient(135deg, var(--dark-navy) 0%, var(--primary) 100%)", boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)", fontWeight: 600 }}
                  onClick={() => handleDownloadDocument(selectedDoc)}
                >
                  <Download size={16} /> Unduh Berkas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {docToDelete && (
        <div className="delete-confirm-modal-overlay" onClick={() => setDocToDelete(null)}>
          <div className="delete-confirm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-backdrop-glow"></div>
            
            <div className="delete-modal-top-bar">
              <button
                type="button"
                className="delete-modal-close-btn"
                onClick={() => setDocToDelete(null)}
                title="Tutup"
              >
                <X size={16} />
              </button>
            </div>

            <div className="delete-modal-header-centered">
              <div className="delete-icon-outer-ring">
                <div className="delete-icon-inner-badge">
                  <Trash2 size={24} />
                </div>
              </div>
              <h3 className="delete-modal-title">Hapus Dokumen Permanen?</h3>
              <p className="delete-modal-subtitle">
                Berkas ini akan segera dihapus dari penyimpanan server pusat Setda dan tidak dapat diakses kembali.
              </p>
            </div>

            <div className="delete-modal-body-custom">
              {/* FILE PREVIEW CARD */}
              <div className="delete-file-preview-card">
                <div className={`delete-file-pill-icon file-type-icon ${docToDelete.type}`}>
                  {docToDelete.type.toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="delete-file-name-text" title={docToDelete.name}>
                    {docToDelete.name}
                  </div>
                  <div className="delete-file-meta-row">
                    <span className="delete-meta-tag">{docToDelete.category}</span>
                    <span>•</span>
                    <span>{docToDelete.size}</span>
                    {docToDelete.uploader && (
                      <>
                        <span>•</span>
                        <span>Oleh: {docToDelete.uploader}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* WARNING CALLOUT BANNER */}
              <div className="delete-warning-banner">
                <AlertCircle size={17} style={{ flexShrink: 0, marginTop: "1px" }} />
                <div>
                  <strong>Peringatan Penting:</strong> Tindakan ini bersifat permanen. Seluruh riwayat dan berkas asli tidak dapat dipulihkan kembali.
                </div>
              </div>

              {/* MODAL FOOTER BUTTONS */}
              <div className="delete-modal-footer-actions">
                <button
                  type="button"
                  className="delete-btn-cancel"
                  onClick={() => setDocToDelete(null)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="delete-btn-confirm"
                  onClick={async () => {
                    const id = docToDelete.id;
                    setDocToDelete(null);
                    await handleDeleteDocument(id);
                  }}
                >
                  <Trash2 size={16} /> Ya, Hapus Berkas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BATCH DELETE CONFIRMATION MODAL */}
      {showBatchDeleteModal && (
        <div className="delete-confirm-modal-overlay" onClick={() => setShowBatchDeleteModal(false)}>
          <div className="delete-confirm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-backdrop-glow"></div>
            
            <div className="delete-modal-top-bar">
              <button
                type="button"
                className="delete-modal-close-btn"
                onClick={() => setShowBatchDeleteModal(false)}
                title="Tutup"
              >
                <X size={16} />
              </button>
            </div>

            <div className="delete-modal-header-centered">
              <div className="delete-icon-outer-ring">
                <div className="delete-icon-inner-badge">
                  <Trash2 size={24} />
                </div>
              </div>
              <h3 className="delete-modal-title">Hapus {selectedDocIds.length} Dokumen Sekaligus?</h3>
              <p className="delete-modal-subtitle">
                {selectedDocIds.length} berkas yang dipilih akan segera dihapus permanen dari server pusat.
              </p>
            </div>

            <div className="delete-modal-body-custom">
              {/* WARNING CALLOUT BANNER */}
              <div className="delete-warning-banner">
                <AlertCircle size={17} style={{ flexShrink: 0, marginTop: "1px" }} />
                <div>
                  <strong>Peringatan Penting:</strong> Tindakan ini akan menghapus {selectedDocIds.length} berkas sekaligus secara permanen. Seluruh file tidak dapat dipulihkan.
                </div>
              </div>

              {/* MODAL FOOTER BUTTONS */}
              <div className="delete-modal-footer-actions">
                <button
                  type="button"
                  className="delete-btn-cancel"
                  onClick={() => setShowBatchDeleteModal(false)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="delete-btn-confirm"
                  onClick={async () => {
                    setShowBatchDeleteModal(false);
                    await handleBatchDelete();
                  }}
                >
                  <Trash2 size={16} /> Ya, Hapus Semua ({selectedDocIds.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE STAFF CONFIRMATION MODAL (ADMIN ONLY) */}
      {staffToDelete && (
        <div className="delete-confirm-modal-overlay" onClick={() => setStaffToDelete(null)}>
          <div className="delete-confirm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-backdrop-glow"></div>
            
            <div className="delete-modal-top-bar">
              <button
                type="button"
                className="delete-modal-close-btn"
                onClick={() => setStaffToDelete(null)}
                title="Tutup"
              >
                <X size={16} />
              </button>
            </div>

            <div className="delete-modal-header-centered">
              <div className="delete-icon-outer-ring">
                <div className="delete-icon-inner-badge">
                  <UserX size={24} />
                </div>
              </div>
              <h3 className="delete-modal-title">Hapus Akun Staf Permanen?</h3>
              <p className="delete-modal-subtitle">
                Akses khusus Administrator. Akun staf ini akan dihapus dari server pusat dan database Setda serta dicabut hak akses loginnya.
              </p>
            </div>

            <div className="delete-modal-body-custom">
              {/* STAFF PREVIEW CARD */}
              <div className="delete-file-preview-card" style={{ alignItems: "center" }}>
                <div className="user-avatar-icon" style={{ width: "42px", height: "42px", background: "rgba(239, 68, 68, 0.12)", color: "var(--danger)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <User size={22} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="delete-file-name-text" title={staffToDelete.name} style={{ fontSize: "14.5px" }}>
                    {staffToDelete.name}
                  </div>
                  <div className="delete-file-meta-row">
                    <span className="delete-meta-tag">{staffToDelete.role}</span>
                    <span>•</span>
                    <span>Bagian {staffToDelete.division || "Umum"}</span>
                    {staffToDelete.nip && (
                      <>
                        <span>•</span>
                        <span>NIP: {staffToDelete.nip}</span>
                      </>
                    )}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                    {staffToDelete.email}
                  </div>
                </div>
              </div>

              {/* WARNING CALLOUT BANNER */}
              <div className="delete-warning-banner">
                <AlertCircle size={17} style={{ flexShrink: 0, marginTop: "1px" }} />
                <div>
                  <strong>Peringatan Administrator:</strong> Penghapusan akun ini bersifat permanen. Pegawai ini tidak akan dapat login lagi ke sistem arsip digital Setda.
                </div>
              </div>

              {/* MODAL FOOTER BUTTONS */}
              <div className="delete-modal-footer-actions">
                <button
                  type="button"
                  className="delete-btn-cancel"
                  onClick={() => setStaffToDelete(null)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="delete-btn-confirm"
                  onClick={async () => {
                    await handleDeleteStaff(staffToDelete.id);
                  }}
                >
                  <Trash2 size={16} /> Ya, Hapus Staf Ini
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      {showAddCategoryModal && (
        <div className="modal-overlay active">
          <div className="modal-card" style={{ maxWidth: "480px", borderRadius: "var(--radius-xl)", overflow: "hidden", border: "1px solid var(--border-color)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <div className="modal-header" style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-color)", background: "var(--bg-body)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="user-avatar-icon" style={{ width: "38px", height: "38px", background: "var(--primary-light)", color: "var(--primary)" }}>
                  <Folder size={20} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>Tambah Kategori Baru</h3>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>Buat kelompok kategori dokumen resmi baru</p>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setShowAddCategoryModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const titleInput = form.elements.namedItem("catTitle") as HTMLInputElement;
              const descInput = form.elements.namedItem("catDesc") as HTMLTextAreaElement;
              const title = titleInput ? titleInput.value : "";
              const desc = descInput ? descInput.value : "";
              try {
                const res = await fetch("/api/categories", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ title, desc })
                });
                if (res.ok) {
                  const newCat = await res.json();
                  setCategories((prev) => {
                    const nextCats = [...prev, newCat];
                    try { localStorage.setItem("dms_categories_data", JSON.stringify(nextCats)); } catch {}
                    return nextCats;
                  });
                  setShowAddCategoryModal(false);
                  showToastMsg(`Kategori "${title}" berhasil disimpan di cloud server!`, "success");
                  await loadCategories();
                }
              } catch {
                showToastMsg("Gagal menyimpan kategori ke server.", "error");
              }
            }}>
              <div className="modal-body" style={{ padding: "24px" }}>
                <div className="form-group" style={{ marginBottom: "18px" }}>
                  <label style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text-main)", marginBottom: "6px", display: "block" }}>Nama Kategori *</label>
                  <div className="input-with-icon">
                    <Folder size={16} />
                    <input type="text" name="catTitle" className="form-control" placeholder="Contoh: MoU & Perjanjian Kerja Sama" required style={{ fontSize: "13px" }} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text-main)", marginBottom: "6px", display: "block" }}>Deskripsi Kategori</label>
                  <textarea name="catDesc" className="form-control" placeholder="Deskripsi singkat seputar fungsi kategori dokumen ini..." rows={3} style={{ fontSize: "13px", resize: "none" }}></textarea>
                </div>

                <div style={{ padding: "10px 14px", background: "var(--primary-light)", border: "1px solid var(--primary-border)", borderRadius: "var(--radius-md)", fontSize: "12px", color: "var(--primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckCircle2 size={15} /> Kategori baru akan langsung tersimpan permanen di server.
                </div>
              </div>

              <div className="modal-footer" style={{ padding: "16px 24px", background: "var(--bg-body)", borderTop: "1px solid var(--border-color)", display: "flex", justifySelf: "flex-end", gap: "12px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddCategoryModal(false)} style={{ padding: "9px 20px", fontWeight: 600 }}>Batal</button>
                <button type="submit" className="btn-primary-block" style={{ width: "auto", padding: "9px 24px", margin: 0, background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)", boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)", fontWeight: 600 }}>
                  Simpan Kategori Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD STAFF MODAL */}
      {showAddStaffModal && (
        <div className="modal-overlay active">
          <div className="modal-card" style={{ maxWidth: "480px", borderRadius: "var(--radius-xl)", overflow: "hidden", border: "1px solid var(--border-color)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <div className="modal-header" style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-color)", background: "var(--bg-body)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="user-avatar-icon" style={{ width: "38px", height: "38px", background: "var(--primary-light)", color: "var(--primary)" }}>
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>Tambah Staf Baru</h3>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>Daftarkan akun staf baru Bagian Umum Setda</p>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setShowAddStaffModal(false)}><X size={18} /></button>
            </div>

             <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const nameInput = form.elements.namedItem("staffName") as HTMLInputElement;
              const emailInput = form.elements.namedItem("staffEmail") as HTMLInputElement;
              const roleInput = form.elements.namedItem("staffRole") as HTMLSelectElement;
              const nipInput = form.elements.namedItem("staffNip") as HTMLInputElement;
              const divisionInput = form.elements.namedItem("staffDivision") as HTMLSelectElement;
              const name = nameInput ? nameInput.value : "";
              const email = emailInput ? emailInput.value : "";
              const role = roleInput ? roleInput.value : "Staff";
              const nip = nipInput ? nipInput.value : "";
              const division = divisionInput ? divisionInput.value : "Umum";
              try {
                const res = await fetch("/api/staff", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name, email, role, nip, division })
                });
                if (res.ok) {
                  const newStaff = await res.json();
                  setStaff((prev) => {
                    const nextStaff = [...prev, newStaff];
                    try { localStorage.setItem("dms_staff_data", JSON.stringify(nextStaff)); } catch {}
                    return nextStaff;
                  });
                  setShowAddStaffModal(false);
                  showToastMsg(`Staf "${name}" berhasil didaftarkan di cloud server!`, "success");
                  await loadStaff();
                }
              } catch {
                showToastMsg("Gagal mendaftarkan staf ke server.", "error");
              }
            }}>
              <div className="modal-body" style={{ padding: "24px" }}>
                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text-main)", marginBottom: "6px", display: "block" }}>Nama Lengkap *</label>
                  <div className="input-with-icon">
                    <User size={16} />
                    <input type="text" name="staffName" className="form-control" placeholder="Contoh: Ahmad Fauzi" required style={{ fontSize: "13px" }} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text-main)", marginBottom: "6px", display: "block" }}>Email Resmi Staf *</label>
                  <div className="input-with-icon">
                    <Inbox size={16} />
                    <input type="email" name="staffEmail" className="form-control" placeholder="ahmad.fauzi@setda.gov.id" required style={{ fontSize: "13px" }} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text-main)", marginBottom: "6px", display: "block" }}>NIP (Nomor Induk Pegawai) *</label>
                  <div className="input-with-icon">
                    <FileText size={16} />
                    <input type="text" name="staffNip" className="form-control" placeholder="Contoh: 19900815 201402 1 005" required style={{ fontSize: "13px" }} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text-main)", marginBottom: "6px", display: "block" }}>Bagian / Unit Kerja</label>
                  <select name="staffDivision" className="form-control" style={{ fontSize: "13px" }}>
                    <option value="Umum">Bagian Umum Setda</option>
                    <option value="Hukum">Bagian Hukum Setda</option>
                    <option value="Protokol">Bagian Protokol & Komunikasi Pimpinan</option>
                    <option value="Organisasi">Bagian Organisasi Setda</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text-main)", marginBottom: "6px", display: "block" }}>Hak Akses (Role)</label>
                  <select name="staffRole" className="form-control" style={{ fontSize: "13px" }}>
                    <option value="Staff">Staff Bagian Umum</option>
                    <option value="Admin">Admin Setda</option>
                    <option value="Viewer">Viewer (Pratinjau Sahaja)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: "16px 24px", background: "var(--bg-body)", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddStaffModal(false)} style={{ padding: "9px 20px", fontWeight: 600 }}>Batal</button>
                <button type="submit" className="btn-primary-block" style={{ width: "auto", padding: "9px 24px", margin: 0, background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)", boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)", fontWeight: 600 }}>
                  Tambah Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROFILE EDIT MODAL */}
      {showProfileModal && (
        <div className="modal-overlay active">
          <div className="modal-card" style={{ maxWidth: "540px", borderRadius: "var(--radius-xl)", overflow: "hidden", border: "1px solid var(--border-color)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <div className="modal-header" style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-color)", background: "var(--bg-body)" }}>
              <div>
                <h3 className="modal-title" style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>Profil Pengguna</h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>Pengaturan identitas staf Bagian Umum Setda</p>
              </div>
              <button className="icon-btn" onClick={() => setShowProfileModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const nameInput = form.elements.namedItem("profName") as HTMLInputElement;
              const emailInput = form.elements.namedItem("profEmail") as HTMLInputElement;
              const nipInput = form.elements.namedItem("profNip") as HTMLInputElement;
              const deptInput = form.elements.namedItem("profDept") as HTMLInputElement;
              const name = nameInput ? nameInput.value : currentUser.name;
              const email = emailInput ? emailInput.value : currentUser.email;
              const nip = nipInput ? nipInput.value : currentUser.nip;
              const dept = deptInput ? deptInput.value : currentUser.department;
              setCurrentUser((prev) => ({ ...prev, name, email, nip, department: dept }));
              setShowProfileModal(false);
              showToastMsg("Profil pengguna berhasil diperbarui!", "success");
            }}>
              <div className="modal-body" style={{ padding: "24px" }}>
                {/* PROFILE HEADER BADGE BOX */}
                <div style={{ background: "var(--bg-body)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", padding: "16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
                  <div className="user-avatar-icon" style={{ width: "52px", height: "52px" }}>
                    <User size={26} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>{currentUser.name}</h4>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{currentUser.email}</div>
                    <div style={{ fontSize: "11px", color: "var(--primary)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "6px", background: "var(--primary-light)", padding: "2px 10px", borderRadius: "12px" }}>
                      <ShieldCheck size={12} /> {currentUser.role}
                    </div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "12px", fontWeight: 700 }}>Nama Lengkap *</label>
                    <div className="input-with-icon">
                      <User size={16} />
                      <input type="text" name="profName" defaultValue={currentUser.name} required style={{ fontSize: "13px" }} />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "12px", fontWeight: 700 }}>Email Resmi *</label>
                    <div className="input-with-icon">
                      <Inbox size={16} />
                      <input type="email" name="profEmail" defaultValue={currentUser.email} required style={{ fontSize: "13px" }} />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "12px", fontWeight: 700 }}>NIP (Nomor Induk Pegawai)</label>
                    <div className="input-with-icon">
                      <FileText size={16} />
                      <input type="text" name="profNip" defaultValue={currentUser.nip} style={{ fontSize: "13px" }} />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "12px", fontWeight: 700 }}>Unit / Bagian</label>
                    <div className="input-with-icon">
                      <Landmark size={16} />
                      <input type="text" name="profDept" defaultValue={currentUser.department} style={{ fontSize: "13px" }} />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "20px", padding: "12px 16px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "10px" }}>
                  <ShieldCheck size={18} style={{ color: "#059669" }} />
                  <div style={{ fontSize: "12px", color: "var(--text-main)" }}>
                    <strong>Status Akun: Terverifikasi Server Setda</strong> (Hak akses Admin DMS Bagian Umum)
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: "16px 24px", background: "var(--bg-body)", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowProfileModal(false)} style={{ padding: "9px 20px", fontWeight: 600 }}>Batal</button>
                <button type="submit" className="btn-primary-block" style={{ width: "auto", padding: "9px 24px", margin: 0, background: "linear-gradient(135deg, var(--dark-navy) 0%, var(--primary) 100%)", boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)", fontWeight: 600 }}>
                  Simpan Perubahan Profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            {toast.type === "warning" || toast.type === "error" ? (
              <AlertCircle size={18} />
            ) : (
              <CheckCircle2 size={18} />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
