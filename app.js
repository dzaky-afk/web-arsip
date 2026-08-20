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
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
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
      { id: 1, name: 'Budi Santoso', email: 'budi.s@setda.gov.id', role: 'Admin', status: 'Active', lastActive: 'Just now', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80' }
    ]
  };

  const loginView = document.getElementById('login-view');
  const appView = document.getElementById('app-view');

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

    if (viewName === 'dashboard') renderDashboardTable();
    if (viewName === 'all-documents') renderAllDocumentsTable();
    if (viewName === 'categories') renderCategoriesGrid();
    if (viewName === 'management') renderStaffTable();
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (loginView) loginView.style.display = 'none';
      if (appView) appView.style.display = 'flex';
      switchView('dashboard');
      showToast('Selamat datang kembali, Budi Santoso!', 'success');
    });
  }

  const profileToggle = document.getElementById('user-profile-toggle');
  const profileDropdown = document.getElementById('profile-menu-dropdown');
  const btnLogout = document.getElementById('btn-logout');

  if (profileToggle && profileDropdown) {
    profileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = profileDropdown.style.display === 'block';
      profileDropdown.style.display = isVisible ? 'none' : 'block';
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

  document.querySelectorAll('.nav-item[data-view]').forEach(nav => {
    nav.addEventListener('click', () => {
      const view = nav.getAttribute('data-view');
      switchView(view);
    });
  });

  function renderDashboardTable() {
    const tbody = document.getElementById('dashboard-recent-table-body');
    if (!tbody) return;

    if (state.documents.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 32px; color: var(--text-muted);">
            Belum ada dokumen yang diunggah. Klik tombol <strong>Upload</strong> untuk menambahkan dokumen baru.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = state.documents.map(doc => `
      <tr>
        <td>
          <div class="file-name-cell">
            <div class="file-type-icon ${doc.type}">${doc.type.toUpperCase()}</div>
            <div>
              <div>${doc.name}</div>
              <div class="file-meta">${doc.size} • ${doc.version}</div>
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

    if (state.documents.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
            Belum ada dokumen. Klik tombol <strong>Upload</strong> untuk mengunggah dokumen resmi.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = state.documents.map(doc => `
      <tr>
        <td><input type="checkbox"></td>
        <td>
          <div class="file-name-cell">
            <div class="file-type-icon ${doc.type}">${doc.type.toUpperCase()}</div>
            <div>
              <div style="font-weight: 600;">${doc.name}</div>
              <div class="file-meta">${doc.size} • ${doc.version}</div>
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
          <button class="icon-btn" onclick="toggleStaffStatus(${s.id})" title="Ubah Status">
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
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Initial renders
  renderDashboardTable();
  renderAllDocumentsTable();
  renderCategoriesGrid();
  renderStaffTable();
});
