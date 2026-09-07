/**
 * Setda Bagian Umum - Document Management System (DMS) Admin Panel
 * Static HTML Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const state = {
    currentView: 'dashboard',
    darkMode: false,
    user: {
      name: 'Budi Santoso',
      email: 'budi.s@setda.gov.id',
      role: 'Admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      nip: '19850712 201001 1 008',
      division: 'Umum'
    },
    documents: [],
    categories: [
      { id: 1, title: 'Surat Keputusan', desc: 'Dokumen keputusan resmi dan penetapan pimpinan.', docs: 0, updated: 'Baru saja', status: 'active' },
      { id: 2, title: 'Laporan Keuangan', desc: 'Laporan realisasi anggaran, keuangan, dan hasil audit.', docs: 0, updated: 'Baru saja', status: 'active' },
      { id: 3, title: 'Kepegawaian', desc: 'Berkas kepegawaian, SK jabatan, dan kontrak staf.', docs: 0, updated: 'Baru saja', status: 'active' },
      { id: 4, title: 'Arsip Umum', desc: 'Arsip umum dan dokumentasi administrasi daerah.', docs: 0, updated: 'Baru saja', status: 'active' },
      { id: 5, title: 'MoU & Perjanjian', desc: 'Nota kesepahaman dan perjanjian kerja sama.', docs: 0, updated: 'Baru saja', status: 'active' }
    ],
    staff: [
      { id: 1, name: 'Budi Santoso', email: 'budi.s@setda.gov.id', role: 'Admin', status: 'Active', lastActive: 'Just now', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', nip: '19850712 201001 1 008', division: 'Umum' }
    ],
    selectedDocIds: [],
    selectedUploadFile: null,
    searchQuery: '',
    catFilter: 'all',
    yearFilter: 'all',
    typeFilter: 'all'
  };

  const loginView = document.getElementById('login-view');
  const appView = document.getElementById('app-view');

  function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('mobile-open', 'open');
    if (overlay) overlay.classList.remove('active');
  }

  function openMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.add('mobile-open');
    if (overlay) overlay.classList.add('active');
  }

  function switchView(viewName) {
    state.currentView = viewName;
    document.querySelectorAll('.page-view').forEach(view => {
      view.style.display = 'none';
    });

    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) targetView.style.display = 'block';

    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    document.querySelectorAll('.bottom-nav-item[data-view]').forEach(item => {
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    closeMobileSidebar();

    if (viewName === 'dashboard') renderDashboardTable();
    if (viewName === 'all-documents') renderAllDocumentsTable();
    if (viewName === 'categories') renderCategoriesGrid();
    if (viewName === 'management') renderStaffTable();
  }

  // Update Profile UI dynamically
  function updateProfileUI() {
    const profileNameDisp = document.getElementById('user-profile-name-display');
    const dropdownName = document.getElementById('user-dropdown-name');
    const dropdownEmail = document.getElementById('user-dropdown-email');
    const dropdownRole = document.getElementById('user-dropdown-role');

    if (profileNameDisp) profileNameDisp.textContent = state.user.name;
    if (dropdownName) dropdownName.textContent = state.user.name;
    if (dropdownEmail) dropdownEmail.textContent = state.user.email;
    if (dropdownRole) dropdownRole.textContent = `${state.user.role} Setda Bagian ${state.user.division}`;
  }

  // Clear error banner on input change
  const loginNipInput = document.getElementById('login-nip');
  const loginErrorContainer = document.getElementById('login-error-container');
  const loginErrorText = document.getElementById('login-error-text');

  if (loginNipInput) {
    loginNipInput.addEventListener('input', () => {
      if (loginErrorContainer) loginErrorContainer.style.display = 'none';
    });
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const nipVal = loginNipInput ? loginNipInput.value : '';
      const cleanNip = nipVal.replace(/\D/g, '');
      const loginCard = document.querySelector('.login-card');

      if (cleanNip.length !== 18) {
        if (loginErrorContainer && loginErrorText) {
          loginErrorContainer.style.display = 'block';
          loginErrorText.textContent = 'Format NIP salah. NIP harus terdiri dari 18 digit angka.';
        }
        if (loginCard) {
          loginCard.classList.add('shake-error');
          setTimeout(() => loginCard.classList.remove('shake-error'), 500);
        }
        return;
      }

      const allowedStaffMap = {
        '198507122010011008': { name: 'Budi Santoso', email: 'budi.s@setda.gov.id', role: 'Admin', division: 'Umum' },
        '199008152014021005': { name: 'Ahmad Fauzi', email: 'ahmad.f@setda.gov.id', role: 'Staff', division: 'Umum' },
        '199512102019012001': { name: 'Siti Nurhaliza', email: 'siti.n@setda.gov.id', role: 'Viewer', division: 'Umum' }
      };

      const deniedStaffMap = {
        '199103242015032002': { name: 'Hendra Wijaya', division: 'Protokol & Komunikasi Pimpinan' }
      };

      if (cleanNip in deniedStaffMap) {
        if (loginErrorContainer && loginErrorText) {
          loginErrorContainer.style.display = 'block';
          const staffDetail = deniedStaffMap[cleanNip];
          loginErrorText.textContent = `Akses Ditolak: NIP Anda terdaftar di ${staffDetail.division}. Sistem ini khusus untuk Staf Bagian Umum.`;
        }
        if (loginCard) {
          loginCard.classList.add('shake-error');
          setTimeout(() => loginCard.classList.remove('shake-error'), 500);
        }
        return;
      }

      if (!(cleanNip in allowedStaffMap)) {
        if (loginErrorContainer && loginErrorText) {
          loginErrorContainer.style.display = 'block';
          loginErrorText.textContent = 'Akses Ditolak: NIP Anda tidak terdaftar sebagai Staf Bagian Umum Setda.';
        }
        if (loginCard) {
          loginCard.classList.add('shake-error');
          setTimeout(() => loginCard.classList.remove('shake-error'), 500);
        }
        return;
      }

      if (loginErrorContainer) loginErrorContainer.style.display = 'none';

      const matchedStaff = allowedStaffMap[cleanNip];
      state.user = {
        name: matchedStaff.name,
        email: matchedStaff.email,
        role: matchedStaff.role,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        nip: nipVal,
        division: matchedStaff.division
      };

      updateProfileUI();

      if (loginView) loginView.style.display = 'none';
      if (appView) appView.style.display = 'flex';
      switchView('dashboard');
      showToast(`Selamat datang kembali, ${state.user.name}!`, 'success');
    });
  }

  // Profile Toggle & Dropdown
  const profileToggle = document.getElementById('user-profile-toggle');
  const profileDropdown = document.getElementById('profile-menu-dropdown');
  const btnLogout = document.getElementById('btn-logout');

  if (profileToggle && profileDropdown) {
    profileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = profileDropdown.style.display === 'block';
      profileDropdown.style.display = isVisible ? 'none' : 'block';
      const notifDrawer = document.getElementById('notification-drawer');
      if (notifDrawer) notifDrawer.style.display = 'none';
    });

    document.addEventListener('click', () => {
      profileDropdown.style.display = 'none';
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      if (appView) appView.style.display = 'none';
      if (loginView) loginView.style.display = 'flex';
      if (profileDropdown) profileDropdown.style.display = 'none';
      showToast('Anda telah berhasil keluar dari sistem.', 'info');
    });
  }

  // Dark Mode Toggle
  const btnToggleTheme = document.getElementById('btn-toggle-theme');
  if (btnToggleTheme) {
    btnToggleTheme.addEventListener('click', () => {
      state.darkMode = !state.darkMode;
      if (state.darkMode) {
        document.body.classList.add('dark-mode');
        document.body.setAttribute('data-theme', 'dark');
      } else {
        document.body.classList.remove('dark-mode');
        document.body.removeAttribute('data-theme');
      }
      showToast(state.darkMode ? 'Mode Gelap Aktif' : 'Mode Terang Aktif', 'info');
    });
  }

  // Notification Drawer
  const btnNotifications = document.getElementById('btn-notifications');
  const notificationDrawer = document.getElementById('notification-drawer');
  const btnReadAllNotifs = document.getElementById('btn-read-all-notifications');

  if (btnNotifications && notificationDrawer) {
    btnNotifications.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = notificationDrawer.style.display === 'block';
      notificationDrawer.style.display = isVisible ? 'none' : 'block';
      if (profileDropdown) profileDropdown.style.display = 'none';
    });

    document.addEventListener('click', (e) => {
      if (notificationDrawer && !notificationDrawer.contains(e.target) && e.target !== btnNotifications) {
        notificationDrawer.style.display = 'none';
      }
    });
  }

  if (btnReadAllNotifs) {
    btnReadAllNotifs.addEventListener('click', () => {
      const dot = document.querySelector('#btn-notifications .badge-dot');
      if (dot) dot.style.display = 'none';
      showToast('Semua notifikasi telah ditandai dibaca.');
    });
  }

  // Sidebar navigation & Nav Triggers
  document.querySelectorAll('.nav-item[data-view]').forEach(nav => {
    nav.addEventListener('click', () => {
      const view = nav.getAttribute('data-view');
      switchView(view);
    });
  });

  // Mobile Bottom Nav items
  document.querySelectorAll('.bottom-nav-item[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      switchView(view);
    });
  });

  // Mobile Drawer toggles
  const btnMobileMenu = document.getElementById('btn-mobile-menu');
  const btnCloseSidebar = document.getElementById('btn-close-sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const btnBottomMenu = document.getElementById('btn-bottom-menu');

  if (btnMobileMenu) {
    btnMobileMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      openMobileSidebar();
    });
  }

  if (btnBottomMenu) {
    btnBottomMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      const sidebar = document.getElementById('sidebar');
      if (sidebar && (sidebar.classList.contains('mobile-open') || sidebar.classList.contains('open'))) {
        closeMobileSidebar();
      } else {
        openMobileSidebar();
      }
    });
  }

  if (btnCloseSidebar) {
    btnCloseSidebar.addEventListener('click', () => {
      closeMobileSidebar();
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      closeMobileSidebar();
    });
  }

  document.querySelectorAll('.nav-trigger[data-view]').forEach(trig => {
    trig.addEventListener('click', (e) => {
      e.preventDefault();
      const view = trig.getAttribute('data-view');
      switchView(view);
    });
  });

  // Global Search
  const globalSearchInput = document.getElementById('global-search-input');
  if (globalSearchInput) {
    globalSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.toLowerCase();
      renderDashboardTable();
      renderAllDocumentsTable();
    });
  }

  // Filters on All Documents View
  const docCatFilter = document.getElementById('doc-category-filter');
  const docYearFilter = document.getElementById('doc-year-filter');
  const docTypeFilter = document.getElementById('doc-type-filter');
  const btnResetFilters = document.getElementById('btn-reset-filters');

  if (docCatFilter) {
    docCatFilter.addEventListener('change', (e) => {
      state.catFilter = e.target.value;
      renderAllDocumentsTable();
    });
  }
  if (docYearFilter) {
    docYearFilter.addEventListener('change', (e) => {
      state.yearFilter = e.target.value;
      renderAllDocumentsTable();
    });
  }
  if (docTypeFilter) {
    docTypeFilter.addEventListener('change', (e) => {
      state.typeFilter = e.target.value;
      renderAllDocumentsTable();
    });
  }
  if (btnResetFilters) {
    btnResetFilters.addEventListener('click', () => {
      state.catFilter = 'all';
      state.yearFilter = 'all';
      state.typeFilter = 'all';
      state.searchQuery = '';
      if (docCatFilter) docCatFilter.value = 'all';
      if (docYearFilter) docYearFilter.value = 'all';
      if (docTypeFilter) docTypeFilter.value = 'all';
      if (globalSearchInput) globalSearchInput.value = '';
      renderAllDocumentsTable();
      showToast('Filter telah direset.');
    });
  }

  // Export CSV
  const btnExportCsv = document.getElementById('btn-export-csv');
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
      if (state.documents.length === 0) {
        showToast('Tidak ada dokumen untuk diekspor.', 'error');
        return;
      }
      let csvContent = "data:text/csv;charset=utf-8,ID,Nama Berkas,Kategori,Status,Tanggal,Pengunggah\n";
      state.documents.forEach(d => {
        csvContent += `${d.id},"${d.name}","${d.category}",${d.status},"${d.date}","${d.uploader}"\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Dokumen_Setda_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('File CSV berhasil diunduh!', 'success');
    });
  }

  // Backup JSON
  const btnBackupJson = document.getElementById('btn-backup-json');
  if (btnBackupJson) {
    btnBackupJson.addEventListener('click', () => {
      const backupData = {
        exportedAt: new Date().toISOString(),
        system: "DMS Setda Bagian Umum Kab. Gunungkidul",
        documentsCount: state.documents.length,
        categoriesCount: state.categories.length,
        staffCount: state.staff.length,
        documents: state.documents,
        categories: state.categories,
        staff: state.staff
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const link = document.createElement("a");
      link.setAttribute("href", dataStr);
      link.setAttribute("download", `DMS_Full_Backup_Setda_${new Date().toISOString().split("T")[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Cadangan Database JSON berhasil diunduh!', 'success');
    });
  }

  // Modal Helpers
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  function closeModal(modal) {
    if (modal) modal.classList.remove('active');
  }

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay);
    });
  });

  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const overlay = btn.closest('.modal-overlay');
      closeModal(overlay);
    });
  });

  // Add Category Modal & Form
  const btnAddCategory = document.getElementById('btn-add-category');
  const formAddCategory = document.getElementById('form-add-category');
  if (btnAddCategory) {
    btnAddCategory.addEventListener('click', () => openModal('modal-add-category'));
  }
  if (formAddCategory) {
    formAddCategory.addEventListener('submit', (e) => {
      e.preventDefault();
      const titleInput = document.getElementById('cat-title');
      const descInput = document.getElementById('cat-desc');
      if (!titleInput || !titleInput.value) return;

      const newCat = {
        id: Date.now(),
        title: titleInput.value.trim(),
        desc: descInput ? descInput.value.trim() : '',
        docs: 0,
        updated: 'Baru saja',
        status: 'active'
      };

      state.categories.push(newCat);
      renderCategoriesGrid();
      closeModal(document.getElementById('modal-add-category'));
      formAddCategory.reset();
      showToast(`Kategori "${newCat.title}" berhasil ditambahkan!`, 'success');
    });
  }

  // Add Staff Modal & Form
  const btnAddStaff = document.getElementById('btn-add-staff');
  const formAddStaff = document.getElementById('form-add-staff');
  if (btnAddStaff) {
    btnAddStaff.addEventListener('click', () => openModal('modal-add-staff'));
  }
  if (formAddStaff) {
    formAddStaff.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('staff-name');
      const emailInput = document.getElementById('staff-email');
      const roleInput = document.getElementById('staff-role');

      if (!nameInput || !emailInput) return;

      const newStaffMember = {
        id: Date.now(),
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        role: roleInput ? roleInput.value : 'Staff',
        status: 'Active',
        lastActive: 'Baru saja',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
        nip: '199' + Math.floor(10000000000000 + Math.random() * 90000000000000),
        division: 'Umum'
      };

      state.staff.push(newStaffMember);
      renderStaffTable();
      closeModal(document.getElementById('modal-add-staff'));
      formAddStaff.reset();
      showToast(`Staf "${newStaffMember.name}" berhasil didaftarkan!`, 'success');
    });
  }

  // File Upload Handling
  const dropzone = document.getElementById('upload-dropzone');
  const fileInputHidden = document.getElementById('file-input-hidden');
  const dropzonePreview = document.getElementById('dropzone-file-preview');
  const selectedFileName = document.getElementById('selected-filename');
  const selectedFileSize = document.getElementById('selected-filesize');
  const uploadForm = document.getElementById('upload-document-form');
  const btnCancelUpload = document.getElementById('btn-cancel-upload');

  if (dropzone && fileInputHidden) {
    dropzone.addEventListener('click', () => fileInputHidden.click());
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--primary)';
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.style.borderColor = 'var(--border-color)';
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--border-color)';
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });
    fileInputHidden.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
      }
    });
  }

  function handleFileSelect(file) {
    state.selectedUploadFile = file;
    if (dropzonePreview && selectedFileName && selectedFileSize) {
      selectedFileName.textContent = file.name;
      selectedFileSize.textContent = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      dropzonePreview.style.display = 'block';
    }
  }

  if (btnCancelUpload) {
    btnCancelUpload.addEventListener('click', () => {
      if (uploadForm) uploadForm.reset();
      state.selectedUploadFile = null;
      if (dropzonePreview) dropzonePreview.style.display = 'none';
      switchView('all-documents');
    });
  }

  if (uploadForm) {
    uploadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const titleInput = document.getElementById('upload-doc-title');
      const catInput = document.getElementById('upload-doc-category');
      const descInput = document.getElementById('upload-doc-desc');

      if (!titleInput || !titleInput.value.trim()) {
        showToast('Peringatan: Silakan isi judul dokumen terlebih dahulu!', 'warning');
        return;
      }

      if (!catInput || !catInput.value.trim()) {
        showToast('Peringatan: Anda belum memilih kategori dokumen!', 'warning');
        if (catInput) catInput.focus();
        return;
      }

      const ext = state.selectedUploadFile ? state.selectedUploadFile.name.split('.').pop().toLowerCase() : 'pdf';
      const sizeStr = state.selectedUploadFile ? (state.selectedUploadFile.size / (1024 * 1024)).toFixed(1) + ' MB' : '1.8 MB';

      const newDoc = {
        id: Date.now(),
        name: titleInput.value.trim().endsWith(`.${ext}`) ? titleInput.value.trim() : `${titleInput.value.trim()}.${ext}`,
        category: catInput ? catInput.value : 'Surat Keputusan',
        size: sizeStr,
        version: 'v1.0',
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        uploader: state.user.name,
        type: ['pdf', 'docx', 'xlsx'].includes(ext) ? ext : 'pdf',
        desc: descInput ? descInput.value : '',
        status: 'Disetujui'
      };

      state.documents.unshift(newDoc);
      uploadForm.reset();
      state.selectedUploadFile = null;
      if (dropzonePreview) dropzonePreview.style.display = 'none';
      switchView('all-documents');
      showToast(`Dokumen "${newDoc.name}" berhasil diunggah!`, 'success');
    });
  }

  // Delete Document with Confirmation Dialog
  window.deleteDocument = function(id) {
    const doc = state.documents.find(d => d.id === id);
    const docName = doc ? `"${doc.name}"` : 'dokumen ini';
    if (!confirm(`Konfirmasi Hapus Dokumen:\nApakah Anda yakin ingin menghapus berkas ${docName} dari penyimpanan server? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    state.documents = state.documents.filter(d => d.id !== id);
    renderDashboardTable();
    renderAllDocumentsTable();
    renderCategoriesGrid();
    showToast('Dokumen berhasil dihapus dari server!', 'info');
  };

  // Document Viewer Modal Trigger
  window.viewDocument = function(id) {
    const doc = state.documents.find(d => d.id === id);
    if (!doc) return;

    const modalTitle = document.getElementById('modal-doc-title');
    const modalBadge = document.getElementById('modal-doc-category-badge');
    const modalUploader = document.getElementById('modal-doc-uploader');
    const modalDate = document.getElementById('modal-doc-date');
    const modalSize = document.getElementById('modal-doc-size');
    const modalVersion = document.getElementById('modal-doc-version');

    if (modalTitle) modalTitle.textContent = doc.name;
    if (modalBadge) modalBadge.textContent = doc.category;
    if (modalUploader) modalUploader.textContent = doc.uploader;
    if (modalDate) modalDate.textContent = doc.date;
    if (modalSize) modalSize.textContent = doc.size;
    if (modalVersion) modalVersion.textContent = doc.version || 'v1.0';

    openModal('modal-doc-viewer');
  };

  // Render Functions
  function renderDashboardTable() {
    const tbody = document.getElementById('dashboard-recent-table-body');
    if (!tbody) return;

    let filtered = state.documents;
    if (state.searchQuery) {
      filtered = filtered.filter(d => d.name.toLowerCase().includes(state.searchQuery) || d.category.toLowerCase().includes(state.searchQuery));
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 32px; color: var(--text-muted);">
            Belum ada dokumen yang diunggah. Klik tombol <strong>Upload</strong> untuk menambahkan dokumen baru.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.slice(0, 5).map(doc => `
      <tr>
        <td>
          <div class="file-name-cell" style="cursor: pointer;" onclick="viewDocument(${doc.id})">
            <div class="file-type-icon ${doc.type}">${doc.type.toUpperCase()}</div>
            <div>
              <div style="font-weight: 600;">${doc.name}</div>
              <div class="file-meta">${doc.size} • ${doc.version || 'v1.0'}</div>
            </div>
          </div>
        </td>
        <td><span class="badge badge-category">${doc.category}</span></td>
        <td style="color: var(--text-muted); font-size: 13px;">${doc.date}</td>
        <td style="text-align: right;">
          <button class="icon-btn" onclick="deleteDocument(${doc.id})" title="Hapus Dokumen">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </td>
      </tr>
    `).join('');
  }

  function renderAllDocumentsTable() {
    const tbody = document.getElementById('documents-table-body');
    if (!tbody) return;

    let filtered = state.documents.filter(doc => {
      if (state.catFilter !== 'all' && doc.category !== state.catFilter) return false;
      if (state.typeFilter !== 'all' && doc.type !== state.typeFilter) return false;
      if (state.searchQuery && !doc.name.toLowerCase().includes(state.searchQuery) && !doc.category.toLowerCase().includes(state.searchQuery)) return false;
      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
            Belum ada dokumen. Klik tombol <strong>Upload</strong> untuk mengunggah dokumen resmi.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(doc => `
      <tr>
        <td><input type="checkbox" class="doc-checkbox" data-id="${doc.id}"></td>
        <td>
          <div class="file-name-cell" style="cursor: pointer;" onclick="viewDocument(${doc.id})">
            <div class="file-type-icon ${doc.type}">${doc.type.toUpperCase()}</div>
            <div>
              <div style="font-weight: 600;">${doc.name}</div>
              <div class="file-meta">${doc.size} • ${doc.version || 'v1.0'}</div>
            </div>
          </div>
        </td>
        <td><span class="badge badge-category">${doc.category}</span></td>
        <td><span class="badge-approval approved">Disetujui</span></td>
        <td style="color: var(--text-muted); font-size: 13px;">${doc.date}</td>
        <td>${doc.uploader}</td>
        <td style="text-align: right;">
          <button class="icon-btn" onclick="deleteDocument(${doc.id})" title="Hapus">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </td>
      </tr>
    `).join('');
  }

  function renderCategoriesGrid() {
    const container = document.getElementById('categories-cards-container');
    if (!container) return;

    container.innerHTML = state.categories.map(cat => {
      const count = state.documents.filter(d => d.category === cat.title).length;
      return `
        <div class="category-card">
          <div>
            <div class="category-card-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <h3 class="category-card-title">${cat.title}</h3>
            <p class="category-card-desc">${cat.desc}</p>
          </div>

          <div class="category-card-meta">
            <div class="category-meta-item">
              <span>DOCUMENTS</span>
              <strong>${count}</strong>
            </div>
            <div class="category-meta-item" style="text-align: right;">
              <span>STATUS</span>
              <strong style="color: var(--success);">Active</strong>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderStaffTable() {
    const tbody = document.getElementById('staff-table-body');
    if (!tbody) return;

    tbody.innerHTML = state.staff.map(s => `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${s.avatar}" alt="${s.name}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;">
            <div>
              <div style="font-weight: 700;">${s.name}</div>
              <div style="font-size: 11.5px; color: var(--text-muted);">${s.email}</div>
            </div>
          </div>
        </td>
        <td><span class="role-badge ${s.role.toLowerCase()}">${s.role}</span></td>
        <td>
          <div class="badge-status">
            <span class="status-dot ${s.status.toLowerCase()}"></span>
            <span>${s.status}</span>
          </div>
        </td>
        <td style="color: var(--text-muted); font-size: 13px;">${s.lastActive}</td>
        <td style="text-align: right;">
          <button class="icon-btn" onclick="toggleStaffStatus(${s.id})" title="Ganti Status Aktif/Nonaktif">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
        </td>
      </tr>
    `).join('');
  }

  window.deleteDocument = function(id) {
    state.documents = state.documents.filter(doc => doc.id !== id);
    renderDashboardTable();
    renderAllDocumentsTable();
    renderCategoriesGrid();
    showToast('Dokumen berhasil dihapus.');
  };

  window.toggleStaffStatus = function(id) {
    state.staff = state.staff.map(s => {
      if (s.id === id) {
        s.status = s.status === 'Active' ? 'Suspended' : 'Active';
      }
      return s;
    });
    renderStaffTable();
    showToast('Status akun staf diperbarui.');
  };

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    if (type === 'warning' || type === 'error') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px) scale(0.95)';
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Initial renders
  renderDashboardTable();
  renderAllDocumentsTable();
  renderCategoriesGrid();
  renderStaffTable();
  updateProfileUI();
});
