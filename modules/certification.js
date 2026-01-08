// ========== MODUL CERTIFICATION ==========
// ========================================

// Variabel global untuk modul sertifikasi
let currentKaryawanCertification = null;
let currentUserOutletCertification = null;
let isOwnerCertification = false;
let certificationData = [];
let certificationMenus = [];

// [1] Fungsi untuk tampilkan halaman sertifikasi
async function showCertificationPage() {
    try {
        console.log('🎓 Loading certification module...');
        
        // Ambil data user
        const { data: { user } } = await supabase.auth.getUser();
        const namaKaryawan = user?.user_metadata?.nama_karyawan;
        
        if (!namaKaryawan) {
            alert('User tidak ditemukan!');
            return;
        }
        
        // Ambil data karyawan lengkap
        const { data: karyawanData } = await supabase
            .from('karyawan')
            .select('role, outlet, posisi, nomor_wa')
            .eq('nama_karyawan', namaKaryawan)
            .single();
        
        if (!karyawanData) {
            alert('Data karyawan tidak ditemukan!');
            return;
        }
        
        currentKaryawanCertification = {
            nama_karyawan: namaKaryawan,
            role: karyawanData.role,
            outlet: karyawanData.outlet,
            posisi: karyawanData.posisi,
            nomor_wa: karyawanData.nomor_wa
        };
        
        currentUserOutletCertification = karyawanData.outlet;
        isOwnerCertification = karyawanData.role === 'owner';
        
        // Sembunyikan main app, tampilkan halaman sertifikasi
        document.getElementById('appScreen').style.display = 'none';
        
        // Buat container halaman sertifikasi
        createCertificationPage();
        
        // Load data berdasarkan role
        await loadCertificationData();
        
        if (isOwnerCertification) {
            await loadAllCertificationRequests();
        }
        
    } catch (error) {
        console.error('Error in showCertificationPage:', error);
        showCertificationToast(`❌ Gagal memuat halaman sertifikasi: ${error.message}`, 'error');
    }
}

// [2] Fungsi untuk buat halaman sertifikasi
function createCertificationPage() {
    // Hapus halaman sertifikasi sebelumnya jika ada
    const existingPage = document.getElementById('certificationPage');
    if (existingPage) {
        existingPage.remove();
    }
    
    // Buat container halaman sertifikasi
    const certificationPage = document.createElement('div');
    certificationPage.id = 'certificationPage';
    certificationPage.className = 'certification-page';
    
    const isBarberman = currentKaryawanCertification?.role === 'barberman';
    const isOwner = currentKaryawanCertification?.role === 'owner';
    
    certificationPage.innerHTML = `
        <!-- Header -->
        <header class="certification-header">
            <button class="back-btn" id="backToMainFromCertification">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h2><i class="fas fa-award"></i> Sertifikasi Barber</h2>
            <div class="header-actions">
                <button class="refresh-btn" id="refreshCertification" title="Refresh">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
        </header>
        
        <!-- Info Header -->
        <div class="certification-info-header">
            <div class="info-row">
                <div class="info-item">
                    <i class="fas fa-user"></i>
                    <span id="userNameCertification">${currentKaryawanCertification?.nama_karyawan || '-'}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-award"></i>
                    <span id="userStatusCertification">${isBarberman ? 'Belum Tersertifikasi' : 'Supervisor'}</span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-item">
                    <i class="fas fa-briefcase"></i>
                    <span id="userPositionCertification">${currentKaryawanCertification?.posisi || '-'}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-store"></i>
                    <span id="userOutletCertification">${currentUserOutletCertification || '-'}</span>
                </div>
            </div>
        </div>
        
        <!-- Untuk BARBERMAN: Menu Sertifikasi -->
        ${isBarberman ? `
        <div class="barberman-certification-section">
            <!-- Menu Sertifikasi -->
            <div class="certification-menu-section">
                <div class="section-header">
                    <h3><i class="fas fa-list"></i> Menu Sertifikasi</h3>
                    <div class="menu-stats">
                        <span id="certificationCount">0/0 tersertifikasi</span>
                    </div>
                </div>
                
                <div class="certification-grid" id="certificationGrid">
                    <!-- Menu sertifikasi akan diisi di sini -->
                    <div class="loading">Memuat menu sertifikasi...</div>
                </div>
                
                <div class="certification-info-footer">
                    <p><i class="fas fa-info-circle"></i> Klik menu untuk ajukan sertifikasi</p>
                </div>
            </div>
            
            <!-- History Sertifikasi Saya -->
            <div class="history-certification-section">
                <div class="section-header">
                    <h3><i class="fas fa-history"></i> History Sertifikasi Saya</h3>
                    <button class="btn-refresh-history" onclick="loadCertificationData()">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
                
                <div class="history-table-container">
                    <div class="loading" id="loadingHistoryCertification">Memuat history sertifikasi...</div>
                    <div class="table-wrapper">
                        <table class="history-table horizontal-scroll" id="historyTableCertification" style="display: none;">
                            <thead>
                                <tr>
                                    <th width="150px">Menu</th>
                                    <th width="120px">Tanggal Ajuan</th>
                                    <th>Catatan</th>
                                    <th width="100px">Status</th>
                                    <th width="120px">Disetujui Oleh</th>
                                    <th width="120px">Tanggal Approve</th>
                                    <th width="100px">Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="historyBodyCertification">
                                <!-- History akan diisi di sini -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        ` : ''}
        
        <!-- Untuk OWNER: Management Sertifikasi -->
        ${isOwner ? `
        <div class="owner-certification-section">
            <!-- Management Menu Sertifikasi -->
            <div class="menu-management-section">
                <div class="section-header">
                    <h3><i class="fas fa-cogs"></i> Management Menu Sertifikasi</h3>
                    <button class="btn-add-menu" onclick="showAddMenuModal()">
                        <i class="fas fa-plus"></i> Tambah Menu
                    </button>
                </div>
                
                <div class="menu-management-grid" id="menuManagementGrid">
                    <!-- Daftar menu sertifikasi akan diisi di sini -->
                    <div class="loading">Memuat menu sertifikasi...</div>
                </div>
            </div>
            
            <!-- Pending Sertifikasi Requests -->
            <div class="pending-certification-section">
                <div class="section-header">
                    <h3><i class="fas fa-clock"></i> Permohonan Sertifikasi Pending</h3>
                    <div class="request-stats">
                        <span id="pendingCountCertification">0 requests</span>
                    </div>
                </div>
                <div class="pending-requests-container">
                    <div class="loading" id="loadingPendingCertification">Memuat data sertifikasi...</div>
                    <div id="pendingCertificationGrid" style="display: none;">
                        <!-- Sertifikasi requests akan diisi di sini -->
                    </div>
                </div>
            </div>
            
            <!-- History Sertifikasi -->
            <div class="all-certification-history-section">
                <div class="section-header">
                    <h3><i class="fas fa-history"></i> History Sertifikasi (Semua Karyawan)</h3>
                </div>
                <div class="history-table-container">
                    <div class="loading" id="loadingHistoryAllCertification">Memuat history...</div>
                    <div class="table-wrapper">
                        <table class="history-table horizontal-scroll" id="historyTableAllCertification" style="display: none;">
                            <thead>
                                <tr>
                                    <th width="100px">Tanggal</th>
                                    <th width="120px">Karyawan</th>
                                    <th width="150px">Menu</th>
                                    <th>Catatan</th>
                                    <th width="100px">Status</th>
                                    <th width="120px">Disetujui Oleh</th>
                                    <th width="100px">Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="historyBodyAllCertification">
                                <!-- History akan diisi di sini -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        ` : ''}
        
        <!-- Modal Form Sertifikasi -->
        <div class="modal-overlay" id="certificationFormModal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-file-upload"></i> Form Sertifikasi</h3>
                    <button class="modal-close" onclick="closeCertificationFormModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="certificationForm">
                        <input type="hidden" id="certificationMenuId">
                        <input type="hidden" id="certificationMenuName">
                        
                        <div class="form-group">
                            <label for="certificationNotes"><i class="fas fa-sticky-note"></i> Catatan:</label>
                            <textarea id="certificationNotes" class="form-control" 
                                      placeholder="Tambahkan catatan tentang hasil pekerjaan..." 
                                      rows="3"></textarea>
                            <small class="form-text">Deskripsi singkat tentang hasil pekerjaan</small>
                        </div>
                        
                        <!-- Upload Foto Before -->
                        <div class="form-group upload-group">
                            <label for="beforePhoto"><i class="fas fa-camera"></i> Foto Before:</label>
                            <div class="upload-area" id="beforeUploadArea">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <p>Klik untuk upload foto before</p>
                                <small>Format: JPG, PNG (max 5MB)</small>
                                <input type="file" id="beforePhoto" accept="image/*" style="display: none;">
                            </div>
                            <div class="preview-container" id="beforePreview" style="display: none;">
                                <img id="beforePreviewImage">
                                <button type="button" class="btn-remove-preview" onclick="removePreview('before')">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Upload Foto After -->
                        <div class="form-group upload-group">
                            <label for="afterPhoto"><i class="fas fa-camera-retro"></i> Foto After:</label>
                            <div class="upload-area" id="afterUploadArea">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <p>Klik untuk upload foto after</p>
                                <small>Format: JPG, PNG (max 5MB)</small>
                                <input type="file" id="afterPhoto" accept="image/*" style="display: none;">
                            </div>
                            <div class="preview-container" id="afterPreview" style="display: none;">
                                <img id="afterPreviewImage">
                                <button type="button" class="btn-remove-preview" onclick="removePreview('after')">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Upload Video Process -->
                        <div class="form-group upload-group">
                            <label for="processVideo"><i class="fas fa-video"></i> Video Proses:</label>
                            <div class="upload-area" id="videoUploadArea">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <p>Klik untuk upload video proses</p>
                                <small>Format: MP4, MOV (max 20MB)</small>
                                <input type="file" id="processVideo" accept="video/*" style="display: none;">
                            </div>
                            <div class="preview-container" id="videoPreview" style="display: none;">
                                <video id="videoPreviewPlayer" controls></video>
                                <button type="button" class="btn-remove-preview" onclick="removePreview('video')">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="form-submit">
                            <button type="button" class="cancel-btn" onclick="closeCertificationFormModal()">
                                <i class="fas fa-times"></i> Batal
                            </button>
                            <button type="submit" class="submit-btn" id="submitCertificationBtn">
                                <i class="fas fa-paper-plane"></i> Ajukan Sertifikasi
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        
        <!-- Modal Add/Edit Menu -->
        <div class="modal-overlay" id="menuModal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-plus-circle"></i> Tambah Menu Sertifikasi</h3>
                    <button class="modal-close" onclick="closeMenuModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="menuForm">
                        <input type="hidden" id="menuId">
                        
                        <div class="form-group">
                            <label for="menuName"><i class="fas fa-list"></i> Nama Menu:</label>
                            <input type="text" id="menuName" class="form-control" 
                                   placeholder="Contoh: Hair Highlight, Face Mask" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="menuDescription"><i class="fas fa-align-left"></i> Deskripsi:</label>
                            <textarea id="menuDescription" class="form-control" 
                                      placeholder="Deskripsi singkat tentang menu ini..." 
                                      rows="3"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="menuCategory"><i class="fas fa-tags"></i> Kategori:</label>
                            <select id="menuCategory" class="form-control">
                                <option value="hair">Hair Treatment</option>
                                <option value="face">Face Treatment</option>
                                <option value="massage">Massage</option>
                                <option value="shaving">Shaving</option>
                                <option value="coloring">Coloring</option>
                                <option value="other">Lainnya</option>
                            </select>
                        </div>
                        
                        <div class="form-submit">
                            <button type="button" class="cancel-btn" onclick="closeMenuModal()">
                                <i class="fas fa-times"></i> Batal
                            </button>
                            <button type="submit" class="submit-btn" id="submitMenuBtn">
                                <i class="fas fa-save"></i> Simpan Menu
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        
        <!-- Modal Detail Sertifikasi -->
        <div class="modal-overlay" id="certificationDetailModal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-eye"></i> Detail Sertifikasi</h3>
                    <button class="modal-close" onclick="closeCertificationDetailModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" id="certificationDetailContent">
                    <!-- Detail akan diisi di sini -->
                </div>
            </div>
        </div>
        
        <!-- Modal Review Sertifikasi (Owner) -->
        <div class="modal-overlay" id="certificationReviewModal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-clipboard-check"></i> Review Sertifikasi</h3>
                    <button class="modal-close" onclick="closeCertificationReviewModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" id="certificationReviewContent">
                    <!-- Review content akan diisi di sini -->
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="certification-footer">
            <p><i class="fas fa-info-circle"></i> ${isBarberman ? 
                'Upload foto before/after dan video proses untuk pengajuan sertifikasi' : 
                'Kelola menu sertifikasi dan approve/reject pengajuan dari barberman'}</p>
        </div>
    `;
    
    document.body.appendChild(certificationPage);
    
    // Setup event listeners
    setupCertificationPageEvents();
    
    // Setup upload events untuk barberman
    if (isBarberman) {
        setupUploadEvents();
    }
}

// [3] Setup event listeners untuk halaman sertifikasi
function setupCertificationPageEvents() {
    // Tombol kembali
    document.getElementById('backToMainFromCertification').addEventListener('click', () => {
        document.getElementById('certificationPage').remove();
        document.getElementById('appScreen').style.display = 'block';
    });
    
    // Tombol refresh
    const refreshBtn = document.getElementById('refreshCertification');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await loadCertificationData();
            if (isOwnerCertification) {
                await loadAllCertificationRequests();
            }
        });
    }
}

// [4] Load data sertifikasi
async function loadCertificationData() {
    try {
        // Load menu sertifikasi
        await loadCertificationMenus();
        
        // Load history sertifikasi
        if (currentKaryawanCertification?.role === 'barberman') {
            await loadBarbermanCertificationHistory();
        }
        
    } catch (error) {
        console.error('Error loading certification data:', error);
        showCertificationToast(`❌ Gagal memuat data sertifikasi: ${error.message}`, 'error');
    }
}

// [5] Load menu sertifikasi
async function loadCertificationMenus() {
    try {
        const certificationGrid = document.getElementById('certificationGrid');
        const menuManagementGrid = document.getElementById('menuManagementGrid');
        
        // Load dari database atau gunakan default
        const { data: existingMenus, error } = await supabase
            .from('sertifikasi_menu')
            .select('*')
            .order('nama_menu');
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = tabel tidak ada
            throw error;
        }
        
        if (existingMenus && existingMenus.length > 0) {
            certificationMenus = existingMenus;
        } else {
            // Default menu untuk barberman
            certificationMenus = [
                { id: 1, nama_menu: 'Kids Cut', kategori: 'hair', deskripsi: 'Potongan rambut untuk anak-anak' },
                { id: 2, nama_menu: 'Fade Cut', kategori: 'hair', deskripsi: 'Potongan fade style' },
                { id: 3, nama_menu: 'Botak Licin', kategori: 'shaving', deskripsi: 'Cukur botak dengan hasil licin' },
                { id: 4, nama_menu: 'Shaving', kategori: 'shaving', deskripsi: 'Cukur jenggot/kumis' },
                { id: 5, nama_menu: 'Semir', kategori: 'coloring', deskripsi: 'Semir rambut' },
                { id: 6, nama_menu: 'Colouring', kategori: 'coloring', deskripsi: 'Warna rambut' },
                { id: 7, nama_menu: 'Bleaching', kategori: 'coloring', deskripsi: 'Bleaching rambut' },
                { id: 8, nama_menu: 'Creambath', kategori: 'hair', deskripsi: 'Creambath treatment' }
            ];
            
            // Simpan default menu ke database jika tabel ada
            try {
                await supabase.from('sertifikasi_menu').insert(certificationMenus);
            } catch (insertError) {
                console.log('Tabel sertifikasi_menu belum dibuat, menggunakan data default');
            }
        }
        
        // Tampilkan untuk barberman
        if (certificationGrid) {
            displayCertificationMenusForBarberman();
        }
        
        // Tampilkan untuk owner (management)
        if (menuManagementGrid) {
            displayCertificationMenusForOwner();
        }
        
    } catch (error) {
        console.error('Error loading certification menus:', error);
        showCertificationToast(`❌ Gagal memuat menu sertifikasi: ${error.message}`, 'error');
    }
}

// [6] Display menu sertifikasi untuk barberman
function displayCertificationMenusForBarberman() {
    const certificationGrid = document.getElementById('certificationGrid');
    if (!certificationGrid) return;
    
    if (!certificationMenus || certificationMenus.length === 0) {
        certificationGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h4>Belum ada menu sertifikasi</h4>
                <p>Hubungi owner untuk menambahkan menu</p>
            </div>
        `;
        return;
    }
    
    // Hitung sertifikasi yang sudah approved
    let certifiedCount = 0;
    if (certificationData && certificationData.length > 0) {
        certifiedCount = certificationData.filter(item => item.status === 'approved').length;
    }
    
    // Update count
    const countElement = document.getElementById('certificationCount');
    if (countElement) {
        countElement.textContent = `${certifiedCount}/${certificationMenus.length} tersertifikasi`;
    }
    
    let html = '';
    
    certificationMenus.forEach(menu => {
        // Cek status sertifikasi untuk menu ini
        let status = 'Belum Tersertifikasi';
        let statusClass = 'status-pending';
        let certificationItem = null;
        
        if (certificationData && certificationData.length > 0) {
            certificationItem = certificationData.find(item => 
                item.menu_id === menu.id || item.menu_nama === menu.nama_menu);
            
            if (certificationItem) {
                if (certificationItem.status === 'approved') {
                    status = 'Babeh Certified';
                    statusClass = 'status-approved';
                } else if (certificationItem.status === 'pending') {
                    status = 'Menunggu Review';
                    statusClass = 'status-pending';
                } else if (certificationItem.status === 'rejected') {
                    status = 'Ditolak';
                    statusClass = 'status-rejected';
                }
            }
        }
        
        html += `
            <div class="certification-menu-card ${statusClass}" 
                 onclick="openCertificationForm('${menu.id}', '${menu.nama_menu.replace(/'/g, "\\'")}')">
                <div class="menu-icon">
                    <i class="${getMenuIcon(menu.kategori)}"></i>
                </div>
                <div class="menu-info">
                    <h4>${menu.nama_menu}</h4>
                    <p class="menu-description">${menu.deskripsi || ''}</p>
                    <div class="menu-status">
                        <span class="status-badge ${statusClass}">${status}</span>
                    </div>
                </div>
                <div class="menu-action">
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>
        `;
    });
    
    certificationGrid.innerHTML = html;
}

// [7] Display menu sertifikasi untuk owner (management)
function displayCertificationMenusForOwner() {
    const menuManagementGrid = document.getElementById('menuManagementGrid');
    if (!menuManagementGrid) return;
    
    if (!certificationMenus || certificationMenus.length === 0) {
        menuManagementGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h4>Belum ada menu sertifikasi</h4>
                <p>Tambahkan menu baru menggunakan tombol di atas</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    certificationMenus.forEach(menu => {
        // Hitung berapa barberman yang sudah certified untuk menu ini
        // Ini akan diimplementasikan nanti setelah ada data sertifikasi
        
        html += `
            <div class="management-menu-card">
                <div class="management-menu-header">
                    <div class="menu-title">
                        <i class="${getMenuIcon(menu.kategori)}"></i>
                        <h4>${menu.nama_menu}</h4>
                        <span class="menu-category">${getCategoryName(menu.kategori)}</span>
                    </div>
                    <div class="menu-actions">
                        <button class="btn-edit-menu" onclick="editMenu('${menu.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete-menu" onclick="deleteMenu('${menu.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="management-menu-body">
                    <p>${menu.deskripsi || 'Tidak ada deskripsi'}</p>
                    <div class="menu-stats">
                        <span class="stat-item">
                            <i class="fas fa-users"></i>
                            <span>0 barberman certified</span>
                        </span>
                        <span class="stat-item">
                            <i class="fas fa-clock"></i>
                            <span>0 pending</span>
                        </span>
                    </div>
                </div>
            </div>
        `;
    });
    
    menuManagementGrid.innerHTML = html;
}

// [8] Load history sertifikasi untuk barberman
async function loadBarbermanCertificationHistory() {
    try {
        const loadingEl = document.getElementById('loadingHistoryCertification');
        const tableEl = document.getElementById('historyTableCertification');
        
        if (loadingEl) loadingEl.style.display = 'block';
        if (tableEl) tableEl.style.display = 'none';
        
        // Query history sertifikasi untuk barberman ini
        const { data: historyData, error } = await supabase
            .from('sertifikasi')
            .select('*')
            .eq('karyawan', currentKaryawanCertification.nama_karyawan)
            .order('created_at', { ascending: false });
        
        if (error) {
            // Jika tabel tidak ada, gunakan array kosong
            if (error.code === 'PGRST116') {
                certificationData = [];
            } else {
                throw error;
            }
        } else {
            certificationData = historyData || [];
        }
        
        // Tampilkan history
        displayBarbermanCertificationHistory();
        
    } catch (error) {
        console.error('Error loading certification history:', error);
        const tbody = document.getElementById('historyBodyCertification');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        Gagal memuat history: ${error.message}
                    </td>
                </tr>
            `;
        }
    } finally {
        const loadingEl = document.getElementById('loadingHistoryCertification');
        const tableEl = document.getElementById('historyTableCertification');
        
        if (loadingEl) loadingEl.style.display = 'none';
        if (tableEl && tableEl.querySelector('tbody').children.length > 0) {
            tableEl.style.display = 'table';
        }
    }
}

// [9] Display history sertifikasi untuk barberman
function displayBarbermanCertificationHistory() {
    const tbody = document.getElementById('historyBodyCertification');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!certificationData || certificationData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-message">
                    <i class="fas fa-history"></i>
                    Belum ada history sertifikasi
                </td>
            </tr>
        `;
        return;
    }
    
    certificationData.forEach(cert => {
        const createdDate = new Date(cert.created_at);
        const approveDate = cert.approved_at ? new Date(cert.approved_at) : null;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${cert.menu_nama}</strong></td>
            <td>${formatDateToDisplay(createdDate)}</td>
            <td class="notes-cell" title="${cert.catatan || '-'}">
                ${cert.catatan ? (cert.catatan.length > 50 ? cert.catatan.substring(0, 50) + '...' : cert.catatan) : '-'}
            </td>
            <td>
                <span class="status-pill ${getCertificationStatusClass(cert.status)}">
                    ${cert.status === 'approved' ? 'Babeh Certified' : 
                      cert.status === 'rejected' ? 'Ditolak' : 
                      cert.status === 'pending' ? 'Menunggu' : cert.status}
                </span>
            </td>
            <td>${cert.approved_by || '-'}</td>
            <td>${approveDate ? formatDateToDisplay(approveDate) : '-'}</td>
            <td>
                <button class="btn-action btn-view" onclick="showCertificationDetail('${cert.id}')" title="View Detail">
                    <i class="fas fa-eye"></i>
                </button>
                ${cert.status === 'pending' ? `
                <button class="btn-action btn-cancel" onclick="cancelCertificationRequest('${cert.id}')" title="Batalkan">
                    <i class="fas fa-times"></i>
                </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// [10] Load semua permohonan sertifikasi untuk owner
async function loadAllCertificationRequests() {
    try {
        // Tampilkan loading
        const loadingPending = document.getElementById('loadingPendingCertification');
        const pendingGrid = document.getElementById('pendingCertificationGrid');
        const loadingHistory = document.getElementById('loadingHistoryAllCertification');
        const historyTable = document.getElementById('historyTableAllCertification');
        
        if (loadingPending) loadingPending.style.display = 'block';
        if (pendingGrid) pendingGrid.style.display = 'none';
        if (loadingHistory) loadingHistory.style.display = 'block';
        if (historyTable) historyTable.style.display = 'none';
        
        // Query semua sertifikasi
        const { data: allCertifications, error } = await supabase
            .from('sertifikasi')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            // Jika tabel tidak ada, gunakan array kosong
            if (error.code === 'PGRST116') {
                return;
            } else {
                throw error;
            }
        }
        
        // Pisahkan pending dan history
        const pendingCertifications = (allCertifications || []).filter(item => item.status === 'pending');
        const historyCertifications = (allCertifications || []).filter(item => item.status !== 'pending');
        
        // Display data
        displayPendingCertificationRequests(pendingCertifications);
        displayAllCertificationHistory(historyCertifications);
        
        // Update count
        const pendingCountEl = document.getElementById('pendingCountCertification');
        if (pendingCountEl) {
            pendingCountEl.textContent = `${pendingCertifications.length} requests pending`;
        }
        
    } catch (error) {
        console.error('Error loading certification requests:', error);
        showCertificationToast(`❌ Gagal memuat data sertifikasi: ${error.message}`, 'error');
    } finally {
        // Hide loading
        const loadingPending = document.getElementById('loadingPendingCertification');
        const pendingGrid = document.getElementById('pendingCertificationGrid');
        const loadingHistory = document.getElementById('loadingHistoryAllCertification');
        const historyTable = document.getElementById('historyTableAllCertification');
        
        if (loadingPending) loadingPending.style.display = 'none';
        if (pendingGrid) pendingGrid.style.display = 'block';
        if (loadingHistory) loadingHistory.style.display = 'none';
        if (historyTable) historyTable.style.display = 'table';
    }
}

// [11] Display pending sertifikasi requests untuk owner
function displayPendingCertificationRequests(certifications) {
    const pendingGrid = document.getElementById('pendingCertificationGrid');
    if (!pendingGrid) return;
    
    if (!certifications || certifications.length === 0) {
        pendingGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h4>Tidak ada permohonan sertifikasi pending</h4>
                <p>Semua permohonan sudah diproses</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    certifications.forEach(cert => {
        const createdDate = new Date(cert.created_at);
        
        html += `
            <div class="certification-request-card" data-cert-id="${cert.id}">
                <div class="certification-card-header">
                    <div class="certification-info-compact">
                        <div class="certification-karyawan">
                            <i class="fas fa-user"></i>
                            <strong>${cert.karyawan}</strong>
                            <span class="certification-outlet">(${cert.outlet})</span>
                        </div>
                        <div class="certification-menu">
                            <i class="fas fa-list"></i>
                            <span><strong>${cert.menu_nama}</strong></span>
                        </div>
                        <div class="certification-date">
                            <i class="far fa-calendar"></i>
                            <span>Diajukan: ${formatDateToDisplay(createdDate)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="certification-card-body">
                    <!-- Catatan -->
                    <div class="certification-notes">
                        <i class="fas fa-sticky-note"></i>
                        <div class="notes-text">${cert.catatan || 'Tidak ada catatan'}</div>
                    </div>
                    
                    <!-- Media Preview -->
                    <div class="certification-media-preview">
                        <div class="media-item">
                            <label><i class="fas fa-camera"></i> Foto Before:</label>
                            ${cert.foto_before ? 
                                `<button class="btn-view-media" onclick="viewMedia('${cert.foto_before}', 'image')">Lihat Foto</button>` : 
                                '<span class="no-media">Tidak ada</span>'}
                        </div>
                        <div class="media-item">
                            <label><i class="fas fa-camera-retro"></i> Foto After:</label>
                            ${cert.foto_after ? 
                                `<button class="btn-view-media" onclick="viewMedia('${cert.foto_after}', 'image')">Lihat Foto</button>` : 
                                '<span class="no-media">Tidak ada</span>'}
                        </div>
                        <div class="media-item">
                            <label><i class="fas fa-video"></i> Video Proses:</label>
                            ${cert.video_proses ? 
                                `<button class="btn-view-media" onclick="viewMedia('${cert.video_proses}', 'video')">Lihat Video</button>` : 
                                '<span class="no-media">Tidak ada</span>'}
                        </div>
                    </div>
                    
                    <!-- Catatan Review (untuk owner mengisi) -->
                    <div class="review-section">
                        <label for="certReviewNotes_${cert.id}">
                            <i class="fas fa-edit"></i> Catatan Review:
                        </label>
                        <textarea id="certReviewNotes_${cert.id}" 
                                  placeholder="Masukkan catatan review..." 
                                  rows="2"></textarea>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="certification-action-buttons">
                        <button class="btn-approve" onclick="approveCertificationRequest('${cert.id}')">
                            <i class="fas fa-check"></i> Approve (Babeh Certified)
                        </button>
                        <button class="btn-reject" onclick="rejectCertificationRequest('${cert.id}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                        <button class="btn-detail" onclick="showCertificationDetail('${cert.id}')">
                            <i class="fas fa-info-circle"></i> Detail Lengkap
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    pendingGrid.innerHTML = html;
}

// [12] Display history sertifikasi untuk owner
function displayAllCertificationHistory(certifications) {
    const tbody = document.getElementById('historyBodyAllCertification');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!certifications || certifications.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-message">
                    <i class="fas fa-history"></i>
                    Tidak ada history sertifikasi
                </td>
            </tr>
        `;
        return;
    }
    
    // Batasi maksimal 15 baris
    const displayCerts = certifications.slice(0, 15);
    
    displayCerts.forEach(cert => {
        const createdDate = new Date(cert.created_at);
        const approveDate = cert.approved_at ? new Date(cert.approved_at) : null;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDateToDisplay(createdDate)}</td>
            <td>${cert.karyawan || '-'}</td>
            <td><strong>${cert.menu_nama || '-'}</strong></td>
            <td class="notes-cell" title="${cert.catatan || '-'}">
                ${cert.catatan ? (cert.catatan.length > 40 ? cert.catatan.substring(0, 40) + '...' : cert.catatan) : '-'}
            </td>
            <td>
                <span class="status-pill ${getCertificationStatusClass(cert.status)}">
                    ${cert.status === 'approved' ? 'Babeh Certified' : 
                      cert.status === 'rejected' ? 'Ditolak' : 
                      cert.status === 'pending' ? 'Menunggu' : cert.status}
                </span>
            </td>
            <td>${cert.approved_by || '-'}</td>
            <td>
                <button class="btn-action btn-view" onclick="showCertificationDetail('${cert.id}')" title="View Detail">
                    <i class="fas fa-eye"></i>
                </button>
                ${cert.status === 'approved' ? `
                <button class="btn-action btn-wa" onclick="sendCertificationCongrats('${cert.id}')" title="Kirim Selamat WA">
                    <i class="fab fa-whatsapp"></i>
                </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// [13] Setup upload events
function setupUploadEvents() {
    // Before photo upload
    const beforeUploadArea = document.getElementById('beforeUploadArea');
    const beforePhotoInput = document.getElementById('beforePhoto');
    
    beforeUploadArea.addEventListener('click', () => {
        beforePhotoInput.click();
    });
    
    beforePhotoInput.addEventListener('change', function(e) {
        handleFileUpload(e.target.files[0], 'before');
    });
    
    // After photo upload
    const afterUploadArea = document.getElementById('afterUploadArea');
    const afterPhotoInput = document.getElementById('afterPhoto');
    
    afterUploadArea.addEventListener('click', () => {
        afterPhotoInput.click();
    });
    
    afterPhotoInput.addEventListener('change', function(e) {
        handleFileUpload(e.target.files[0], 'after');
    });
    
    // Video upload
    const videoUploadArea = document.getElementById('videoUploadArea');
    const videoInput = document.getElementById('processVideo');
    
    videoUploadArea.addEventListener('click', () => {
        videoInput.click();
    });
    
    videoInput.addEventListener('change', function(e) {
        handleFileUpload(e.target.files[0], 'video');
    });
    
    // Form submission
    const form = document.getElementById('certificationForm');
    form.addEventListener('submit', submitCertificationRequest);
}

// [14] Handle file upload preview
function handleFileUpload(file, type) {
    if (!file) return;
    
    // Validasi ukuran file
    const maxSize = type === 'video' ? 20 * 1024 * 1024 : 5 * 1024 * 1024; // 20MB untuk video, 5MB untuk foto
    if (file.size > maxSize) {
        showCertificationToast(`File terlalu besar (max ${type === 'video' ? '20MB' : '5MB'})`, 'error');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const previewId = type + 'Preview';
        const previewElement = document.getElementById(previewId);
        const uploadArea = document.getElementById(type + 'UploadArea');
        
        if (type === 'video') {
            const videoPreview = document.getElementById('videoPreviewPlayer');
            videoPreview.src = e.target.result;
            previewElement.style.display = 'block';
        } else {
            const imgPreview = document.getElementById(type + 'PreviewImage');
            imgPreview.src = e.target.result;
            previewElement.style.display = 'block';
        }
        
        uploadArea.style.display = 'none';
        
        // Simpan file ke variable global untuk nanti diupload ke Supabase Storage
        if (type === 'before') window.beforeFile = file;
        if (type === 'after') window.afterFile = file;
        if (type === 'video') window.videoFile = file;
    };
    
    if (type === 'video') {
        reader.readAsDataURL(file);
    } else {
        reader.readAsDataURL(file);
    }
}

// [15] Remove preview
function removePreview(type) {
    const previewId = type + 'Preview';
    const uploadArea = document.getElementById(type + 'UploadArea');
    const fileInput = document.getElementById(type === 'video' ? 'processVideo' : type + 'Photo');
    
    document.getElementById(previewId).style.display = 'none';
    uploadArea.style.display = 'flex';
    fileInput.value = '';
    
    // Hapus file dari variable global
    if (type === 'before') window.beforeFile = null;
    if (type === 'after') window.afterFile = null;
    if (type === 'video') window.videoFile = null;
}

// [16] Open certification form
function openCertificationForm(menuId, menuName) {
    // Cek apakah sudah ada sertifikasi untuk menu ini
    const existingCert = certificationData?.find(item => 
        (item.menu_id === menuId || item.menu_nama === menuName) && item.status === 'approved');
    
    if (existingCert) {
        showCertificationToast('Anda sudah tersertifikasi untuk menu ini!', 'info');
        return;
    }
    
    // Cek apakah ada pending request untuk menu ini
    const pendingCert = certificationData?.find(item => 
        (item.menu_id === menuId || item.menu_nama === menuName) && item.status === 'pending');
    
    if (pendingCert) {
        showCertificationToast('Anda sudah mengajukan sertifikasi untuk menu ini, menunggu review!', 'warning');
        return;
    }
    
    // Set form values
    document.getElementById('certificationMenuId').value = menuId;
    document.getElementById('certificationMenuName').value = menuName;
    
    // Reset form
    document.getElementById('certificationNotes').value = '';
    document.getElementById('beforePhoto').value = '';
    document.getElementById('afterPhoto').value = '';
    document.getElementById('processVideo').value = '';
    
    // Reset previews
    document.getElementById('beforePreview').style.display = 'none';
    document.getElementById('afterPreview').style.display = 'none';
    document.getElementById('videoPreview').style.display = 'none';
    document.getElementById('beforeUploadArea').style.display = 'flex';
    document.getElementById('afterUploadArea').style.display = 'flex';
    document.getElementById('videoUploadArea').style.display = 'flex';
    
    // Clear file variables
    window.beforeFile = null;
    window.afterFile = null;
    window.videoFile = null;
    
    // Show modal
    document.getElementById('certificationFormModal').style.display = 'flex';
}

// [17] Submit certification request
async function submitCertificationRequest(e) {
    e.preventDefault();
    
    try {
        const menuId = document.getElementById('certificationMenuId').value;
        const menuName = document.getElementById('certificationMenuName').value;
        const notes = document.getElementById('certificationNotes').value.trim();
        
        // Validasi
        if (!notes) {
            showCertificationToast('Harap masukkan catatan tentang hasil pekerjaan', 'warning');
            return;
        }
        
        if (!window.beforeFile || !window.afterFile) {
            showCertificationToast('Harap upload foto before dan after', 'warning');
            return;
        }
        
        // Disable button dan show loading
        const submitBtn = document.getElementById('submitCertificationBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
        
        // Generate unique ID
        const certId = generateCertificationId();
        
        // Upload files ke Supabase Storage
        let beforeUrl = null;
        let afterUrl = null;
        let videoUrl = null;
        
        // Upload before photo
        const beforeFileName = `certifications/${certId}/before_${Date.now()}.jpg`;
        const { data: beforeData, error: beforeError } = await supabase.storage
            .from('media')
            .upload(beforeFileName, window.beforeFile);
        
        if (beforeError) throw beforeError;
        beforeUrl = supabase.storage.from('media').getPublicUrl(beforeFileName).data.publicUrl;
        
        // Upload after photo
        const afterFileName = `certifications/${certId}/after_${Date.now()}.jpg`;
        const { data: afterData, error: afterError } = await supabase.storage
            .from('media')
            .upload(afterFileName, window.afterFile);
        
        if (afterError) throw afterError;
        afterUrl = supabase.storage.from('media').getPublicUrl(afterFileName).data.publicUrl;
        
        // Upload video jika ada
        if (window.videoFile) {
            const videoFileName = `certifications/${certId}/video_${Date.now()}.mp4`;
            const { data: videoData, error: videoError } = await supabase.storage
                .from('media')
                .upload(videoFileName, window.videoFile);
            
            if (!videoError) {
                videoUrl = supabase.storage.from('media').getPublicUrl(videoFileName).data.publicUrl;
            }
        }
        
        // Simpan ke database
        const { data, error } = await supabase
            .from('sertifikasi')
            .insert([{
                id: certId,
                karyawan: currentKaryawanCertification.nama_karyawan,
                outlet: currentUserOutletCertification,
                menu_id: menuId,
                menu_nama: menuName,
                catatan: notes,
                foto_before: beforeUrl,
                foto_after: afterUrl,
                video_proses: videoUrl,
                status: 'pending',
                created_at: new Date().toISOString(),
                nomor_wa: currentKaryawanCertification.nomor_wa
            }]);
        
        if (error) {
            // Jika tabel tidak ada, buat tabel dulu
            if (error.code === '42P01') {
                await createCertificationTable();
                // Coba insert lagi
                await supabase
                    .from('sertifikasi')
                    .insert([{
                        id: certId,
                        karyawan: currentKaryawanCertification.nama_karyawan,
                        outlet: currentUserOutletCertification,
                        menu_id: menuId,
                        menu_nama: menuName,
                        catatan: notes,
                        foto_before: beforeUrl,
                        foto_after: afterUrl,
                        video_proses: videoUrl,
                        status: 'pending',
                        created_at: new Date().toISOString(),
                        nomor_wa: currentKaryawanCertification.nomor_wa
                    }]);
            } else {
                throw error;
            }
        }
        
        // Success
        showCertificationToast('✅ Permohonan sertifikasi berhasil diajukan!', 'success');
        
        // Tutup modal
        closeCertificationFormModal();
        
        // Reload data
        await loadCertificationData();
        
    } catch (error) {
        console.error('Error submitting certification request:', error);
        showCertificationToast(`❌ Gagal mengajukan sertifikasi: ${error.message}`, 'error');
    } finally {
        // Reset button
        const submitBtn = document.getElementById('submitCertificationBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Ajukan Sertifikasi';
        }
    }
}

// [18] Fungsi untuk approve certification request
async function approveCertificationRequest(certId) {
    try {
        const reviewNotes = document.getElementById(`certReviewNotes_${certId}`)?.value || '';
        
        if (!reviewNotes.trim()) {
            showCertificationToast('Harap masukkan catatan review', 'warning');
            document.getElementById(`certReviewNotes_${certId}`).focus();
            return;
        }
        
        // Ambil data sertifikasi
        const { data: certData, error: fetchError } = await supabase
            .from('sertifikasi')
            .select('*')
            .eq('id', certId)
            .single();
        
        if (fetchError) throw fetchError;
        
        // Konfirmasi
        if (!confirm(`Approve sertifikasi untuk ${certData.karyawan}?\n\n` +
                   `Menu: ${certData.menu_nama}\n` +
                   `Status: Babeh Certified`)) {
            return;
        }
        
        // Update status sertifikasi
        const { error: updateError } = await supabase
            .from('sertifikasi')
            .update({
                status: 'approved',
                approved_at: new Date().toISOString(),
                approved_by: currentKaryawanCertification.nama_karyawan,
                review_notes: reviewNotes
            })
            .eq('id', certId);
        
        if (updateError) throw updateError;
        
        // Kirim notifikasi WhatsApp
        await sendCertificationWhatsAppNotification(certData, 'approved', reviewNotes);
        
        showCertificationToast('✅ Sertifikasi berhasil disetujui! Status: Babeh Certified', 'success');
        
        // Reload data
        await loadAllCertificationRequests();
        
    } catch (error) {
        console.error('Error approving certification:', error);
        showCertificationToast(`❌ Gagal approve sertifikasi: ${error.message}`, 'error');
    }
}

// [19] Fungsi untuk reject certification request
async function rejectCertificationRequest(certId) {
    try {
        const reviewNotes = document.getElementById(`certReviewNotes_${certId}`)?.value || '';
        
        if (!reviewNotes.trim()) {
            showCertificationToast('Harap masukkan alasan penolakan', 'warning');
            document.getElementById(`certReviewNotes_${certId}`).focus();
            return;
        }
        
        // Ambil data sertifikasi
        const { data: certData, error: fetchError } = await supabase
            .from('sertifikasi')
            .select('*')
            .eq('id', certId)
            .single();
        
        if (fetchError) throw fetchError;
        
        // Konfirmasi
        if (!confirm(`Tolak sertifikasi untuk ${certData.karyawan}?\n\n` +
                   `Menu: ${certData.menu_nama}\n` +
                   `Alasan penolakan: ${reviewNotes}`)) {
            return;
        }
        
        // Update status sertifikasi
        const { error: updateError } = await supabase
            .from('sertifikasi')
            .update({
                status: 'rejected',
                approved_at: new Date().toISOString(),
                approved_by: currentKaryawanCertification.nama_kariyawan,
                review_notes: reviewNotes
            })
            .eq('id', certId);
        
        if (updateError) throw updateError;
        
        // Kirim notifikasi WhatsApp
        await sendCertificationWhatsAppNotification(certData, 'rejected', reviewNotes);
        
        showCertificationToast('❌ Sertifikasi berhasil ditolak!', 'success');
        
        // Reload data
        await loadAllCertificationRequests();
        
    } catch (error) {
        console.error('Error rejecting certification:', error);
        showCertificationToast(`❌ Gagal reject sertifikasi: ${error.message}`, 'error');
    }
}

// [20] Kirim notifikasi WhatsApp untuk sertifikasi
async function sendCertificationWhatsAppNotification(certData, action, reviewNotes = '') {
    try {
        const WA_API_URL = 'https://waha-yetv8qi4e3zk.anakit.sumopod.my.id/api/sendText';
        const WA_API_KEY = 'sfcoGbpdLDkGZhKw2rx8sbb14vf4d8V6';
        
        // Format nomor WhatsApp
        let chatId = certData.nomor_wa;
        if (chatId) {
            // Pastikan format 62xxxxxxxxxx@c.us
            chatId = chatId.replace(/^0/, '62').replace(/^\+62/, '62');
            if (!chatId.includes('@c.us')) {
                chatId += '@c.us';
            }
        } else {
            console.warn('Nomor WA tidak tersedia untuk', certData.karyawan);
            return;
        }
        
        let message = '';
        if (action === 'approved') {
            message = `🎉 *SERTIFIKASI DISETUJUI - Babeh Certified!*\n\n` +
                     `👋 Halo ${certData.karyawan},\n\n` +
                     `🎯 Selamat! Sertifikasi Anda untuk:\n` +
                     `✂️ *${certData.menu_nama}*\n\n` +
                     `✅ Telah *DISETUJUI* dan Anda sekarang **Babeh Certified**!\n\n` +
                     `${reviewNotes ? `💭 *Catatan dari Owner*: ${reviewNotes}\n\n` : ''}` +
                     `👤 *Disetujui oleh*: ${currentKaryawanCertification.nama_karyawan}\n` +
                     `⏰ *Waktu*: ${formatDateToDisplay(new Date())} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}\n\n` +
                     `🎊 *Selamat atas pencapaian ini!*`;
        } else {
            message = `❌ *SERTIFIKASI DITOLAK*\n\n` +
                     `👋 Halo ${certData.karyawan},\n\n` +
                     `⚠️ Maaf, sertifikasi Anda untuk:\n` +
                     `✂️ *${certData.menu_nama}*\n\n` +
                     `Telah *DITOLAK*. Status: **Belum Tersertifikasi**\n\n` +
                     `📌 *Alasan Penolakan*:\n${reviewNotes}\n\n` +
                     `💡 *Saran*: Silakan perbaiki dan ajukan kembali\n\n` +
                     `👤 *Ditolak oleh*: ${currentKaryawanCertification.nama_karyawan}\n` +
                     `⏰ *Waktu*: ${formatDateToDisplay(new Date())} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        // Kirim via API
        const response = await fetch(WA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': WA_API_KEY
            },
            body: JSON.stringify({
                session: 'Session1',
                chatId: chatId,
                text: message
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        console.log(`📱 WhatsApp certification notification sent to ${certData.karyawan}`);
        
    } catch (error) {
        console.error('Error sending WhatsApp notification:', error);
    }
}

// [21] Modal functions
function closeCertificationFormModal() {
    document.getElementById('certificationFormModal').style.display = 'none';
}

function showCertificationDetail(certId) {
    // Implementasi detail modal
    const certData = certificationData.find(c => c.id === certId);
    if (!certData) return;
    
    const modal = document.getElementById('certificationDetailModal');
    const content = document.getElementById('certificationDetailContent');
    
    const createdDate = new Date(certData.created_at);
    const approveDate = certData.approved_at ? new Date(certData.approved_at) : null;
    
    content.innerHTML = `
        <div class="certification-detail">
            <div class="detail-section">
                <h4><i class="fas fa-info-circle"></i> Informasi Sertifikasi</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Karyawan:</label>
                        <span>${certData.karyawan}</span>
                    </div>
                    <div class="detail-item">
                        <label>Outlet:</label>
                        <span>${certData.outlet}</span>
                    </div>
                    <div class="detail-item">
                        <label>Menu:</label>
                        <span><strong>${certData.menu_nama}</strong></span>
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <span class="status-pill ${getCertificationStatusClass(certData.status)}">
                            ${certData.status === 'approved' ? 'Babeh Certified' : 
                              certData.status === 'rejected' ? 'Ditolak' : 
                              certData.status === 'pending' ? 'Menunggu' : certData.status}
                        </span>
                    </div>
                    <div class="detail-item">
                        <label>Diajukan Pada:</label>
                        <span>${formatDateToDisplay(createdDate)} ${createdDate.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    ${approveDate ? `
                    <div class="detail-item">
                        <label>Disetujui Pada:</label>
                        <span>${formatDateToDisplay(approveDate)} ${approveDate.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div class="detail-item">
                        <label>Disetujui Oleh:</label>
                        <span>${certData.approved_by}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-sticky-note"></i> Catatan Karyawan</h4>
                <div class="notes-box">${certData.catatan || 'Tidak ada catatan'}</div>
            </div>
            
            ${certData.review_notes ? `
            <div class="detail-section">
                <h4><i class="fas fa-edit"></i> Catatan Review</h4>
                <div class="notes-box">${certData.review_notes}</div>
            </div>
            ` : ''}
            
            <div class="detail-section">
                <h4><i class="fas fa-images"></i> Media</h4>
                <div class="media-gallery">
                    ${certData.foto_before ? `
                    <div class="media-item">
                        <label>Foto Before:</label>
                        <img src="${certData.foto_before}" alt="Before" class="media-preview">
                        <a href="${certData.foto_before}" target="_blank" class="btn-view-full">Lihat Full</a>
                    </div>
                    ` : ''}
                    
                    ${certData.foto_after ? `
                    <div class="media-item">
                        <label>Foto After:</label>
                        <img src="${certData.foto_after}" alt="After" class="media-preview">
                        <a href="${certData.foto_after}" target="_blank" class="btn-view-full">Lihat Full</a>
                    </div>
                    ` : ''}
                    
                    ${certData.video_proses ? `
                    <div class="media-item">
                        <label>Video Proses:</label>
                        <video controls class="media-preview">
                            <source src="${certData.video_proses}" type="video/mp4">
                        </video>
                        <a href="${certData.video_proses}" target="_blank" class="btn-view-full">Buka di Tab Baru</a>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

function closeCertificationDetailModal() {
    document.getElementById('certificationDetailModal').style.display = 'none';
}

function closeCertificationReviewModal() {
    document.getElementById('certificationReviewModal').style.display = 'none';
}

// [22] Menu management functions
function showAddMenuModal() {
    document.getElementById('menuId').value = '';
    document.getElementById('menuName').value = '';
    document.getElementById('menuDescription').value = '';
    document.getElementById('menuCategory').value = 'hair';
    document.getElementById('menuModal').style.display = 'flex';
}

function closeMenuModal() {
    document.getElementById('menuModal').style.display = 'none';
}

async function editMenu(menuId) {
    const menu = certificationMenus.find(m => m.id == menuId);
    if (!menu) return;
    
    document.getElementById('menuId').value = menu.id;
    document.getElementById('menuName').value = menu.nama_menu;
    document.getElementById('menuDescription').value = menu.deskripsi || '';
    document.getElementById('menuCategory').value = menu.kategori || 'hair';
    
    document.getElementById('menuModal').style.display = 'flex';
}

async function deleteMenu(menuId) {
    if (!confirm('Hapus menu sertifikasi ini?')) return;
    
    try {
        // Hapus dari database
        const { error } = await supabase
            .from('sertifikasi_menu')
            .delete()
            .eq('id', menuId);
        
        if (error) throw error;
        
        // Hapus dari array lokal
        certificationMenus = certificationMenus.filter(m => m.id != menuId);
        
        // Refresh display
        displayCertificationMenusForBarberman();
        displayCertificationMenusForOwner();
        
        showCertificationToast('✅ Menu berhasil dihapus', 'success');
        
    } catch (error) {
        console.error('Error deleting menu:', error);
        showCertificationToast('❌ Gagal menghapus menu', 'error');
    }
}

// [23] Cancel certification request
async function cancelCertificationRequest(certId) {
    if (!confirm('Batalkan permohonan sertifikasi ini?')) return;
    
    try {
        const { error } = await supabase
            .from('sertifikasi')
            .update({ 
                status: 'cancelled',
                approved_at: new Date().toISOString()
            })
            .eq('id', certId);
        
        if (error) throw error;
        
        showCertificationToast('✅ Permohonan sertifikasi dibatalkan', 'success');
        await loadCertificationData();
        
    } catch (error) {
        console.error('Error cancelling certification:', error);
        showCertificationToast('❌ Gagal membatalkan sertifikasi', 'error');
    }
}

// [24] Helper functions
function getMenuIcon(category) {
    switch(category) {
        case 'hair': return 'fas fa-cut';
        case 'face': return 'fas fa-smile';
        case 'massage': return 'fas fa-hand-holding-heart';
        case 'shaving': return 'fas fa-razor';
        case 'coloring': return 'fas fa-palette';
        default: return 'fas fa-spa';
    }
}

function getCategoryName(category) {
    switch(category) {
        case 'hair': return 'Hair Treatment';
        case 'face': return 'Face Treatment';
        case 'massage': return 'Massage';
        case 'shaving': return 'Shaving';
        case 'coloring': return 'Coloring';
        default: return 'Lainnya';
    }
}

function getCertificationStatusClass(status) {
    switch(status) {
        case 'approved': return 'status-approved';
        case 'pending': return 'status-pending';
        case 'rejected': return 'status-rejected';
        case 'cancelled': return 'status-cancelled';
        default: return 'status-unknown';
    }
}

function formatDateToDisplay(date) {
    // Format: dd/MM/yyyy untuk display UI
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function generateCertificationId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `CERT-${timestamp}-${random}`.toUpperCase();
}

async function createCertificationTable() {
    // Fungsi untuk membuat tabel sertifikasi jika belum ada
    // Ini adalah placeholder - implementasi sebenarnya tergantung pada setup database
    console.log('Creating certification table...');
    // Implementasi sebenarnya akan berupa SQL migration
}

function viewMedia(url, type) {
    window.open(url, '_blank');
}

async function sendCertificationCongrats(certId) {
    // Implementasi kirim selamat via WhatsApp
    const certData = certificationData.find(c => c.id === certId);
    if (!certData) return;
    
    showCertificationToast('Fitur WhatsApp selamat akan diimplementasikan', 'info');
}

function showCertificationToast(message, type = 'info') {
    // Hapus toast sebelumnya jika ada
    const existingToast = document.getElementById('certificationToast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Buat toast element
    const toast = document.createElement('div');
    toast.id = 'certificationToast';
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                           type === 'error' ? 'fa-exclamation-circle' : 
                           type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Tambahkan ke body
    document.body.appendChild(toast);
    
    // Tampilkan toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto remove setelah 5 detik
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }
    }, 5000);
}

// [25] Global functions untuk window object
window.openCertificationForm = openCertificationForm;
window.closeCertificationFormModal = closeCertificationFormModal;
window.removePreview = removePreview;
window.showCertificationDetail = showCertificationDetail;
window.closeCertificationDetailModal = closeCertificationDetailModal;
window.cancelCertificationRequest = cancelCertificationRequest;
window.approveCertificationRequest = approveCertificationRequest;
window.rejectCertificationRequest = rejectCertificationRequest;
window.loadCertificationData = loadCertificationData;
window.showAddMenuModal = showAddMenuModal;
window.closeMenuModal = closeMenuModal;
window.editMenu = editMenu;
window.deleteMenu = deleteMenu;
window.viewMedia = viewMedia;
window.sendCertificationCongrats = sendCertificationCongrats;

// ========== END OF FILE ==========
