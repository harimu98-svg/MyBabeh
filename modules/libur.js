// ========== MODUL LIBUR & IZIN ==========
// ========================================

// Variabel global untuk modul libur
let currentKaryawanLibur = null;
let currentUserOutletLibur = null;
let isOwnerLibur = false;
let liburHistoryData = [];
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

// [1] Fungsi untuk tampilkan halaman libur
async function showLiburPage() {
    try {
        console.log('📅 Loading libur module...');
        
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
        
        currentKaryawanLibur = {
            nama_karyawan: namaKaryawan,
            role: karyawanData.role,
            outlet: karyawanData.outlet,
            posisi: karyawanData.posisi,
            nomor_wa: karyawanData.nomor_wa
        };
        
        currentUserOutletLibur = karyawanData.outlet;
        isOwnerLibur = karyawanData.role === 'owner';
        
        // Sembunyikan main app, tampilkan halaman libur
        document.getElementById('appScreen').style.display = 'none';
        
        // Buat container halaman libur
        createLiburPage();
        
        // Load data berdasarkan role
        if (isOwnerLibur) {
            await loadLiburRequestsForOwner();
        } else {
            await loadKasirLiburHistory();
        }
        
    } catch (error) {
        console.error('Error in showLiburPage:', error);
        showToast(`❌ Gagal memuat halaman libur: ${error.message}`, 'error');
    }
}

// [2] Fungsi untuk buat halaman libur
function createLiburPage() {
    // Hapus halaman libur sebelumnya jika ada
    const existingPage = document.getElementById('liburPage');
    if (existingPage) {
        existingPage.remove();
    }
    
    // Buat container halaman libur
    const liburPage = document.createElement('div');
    liburPage.id = 'liburPage';
    liburPage.className = 'libur-page';
    
    // Tentukan konten berdasarkan role
    const isKasir = currentKaryawanLibur?.role === 'kasir';
    const isBarberman = currentKaryawanLibur?.role === 'barberman';
    
    liburPage.innerHTML = `
        <!-- Header -->
        <header class="libur-header">
            <button class="back-btn" id="backToMainFromLibur">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h2><i class="fas fa-calendar-alt"></i> Libur & Izin</h2>
            <div class="header-actions">
                <button class="refresh-btn" id="refreshLibur" title="Refresh">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
        </header>
        
        <!-- Info Header -->
        <div class="libur-info-header">
            <div class="info-row">
                <div class="info-item">
                    <i class="fas fa-calendar-day"></i>
                    <span id="currentDateLibur">${new Date().toLocaleDateString('id-ID', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-user"></i>
                    <span id="userNameLibur">${currentKaryawanLibur?.nama_karyawan || '-'}</span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-item">
                    <i class="fas fa-briefcase"></i>
                    <span id="userPositionLibur">${currentKaryawanLibur?.posisi || '-'}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-store"></i>
                    <span id="userOutletLibur">${currentUserOutletLibur || '-'}</span>
                </div>
            </div>
        </div>
        
        <!-- Untuk KASIR/BARBERMAN: Form Ajukan Libur/Izin -->
        ${isKasir || isBarberman ? `
        <div class="kasir-libur-section">
            <!-- Form Ajukan Libur -->
            <div class="ajukan-libur-section">
                <div class="section-header">
                    <h3><i class="fas fa-paper-plane"></i> Ajukan Libur/Izin</h3>
                </div>
                
                <div class="ajukan-libur-form">
                    <!-- Jenis Libur -->
                    <div class="form-group">
                        <label for="jenisLibur"><i class="fas fa-tag"></i> Jenis:</label>
                        <select id="jenisLibur" class="form-control">
                            <option value="LIBUR">Libur</option>
                            <option value="IZIN">Izin</option>
                            <option value="SAKIT">Sakit</option>
                            <option value="CUTI">Cuti Tahunan</option>
                        </select>
                    </div>
                    
                    <!-- Tanggal Mulai & Selesai -->
                    <div class="form-row">
                        <div class="form-group">
                            <label for="startDate"><i class="fas fa-calendar-plus"></i> Tanggal Mulai:</label>
                            <input type="date" id="startDate" class="form-control" 
                                   min="${new Date().toISOString().split('T')[0]}"
                                   value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        
                        <div class="form-group">
                            <label for="endDate"><i class="fas fa-calendar-minus"></i> Tanggal Selesai:</label>
                            <input type="date" id="endDate" class="form-control" 
                                   min="${new Date().toISOString().split('T')[0]}"
                                   value="${new Date().toISOString().split('T')[0]}">
                        </div>
                    </div>
                    
                    <!-- Durasi Otomatis -->
                    <div class="form-group">
                        <label for="durasiLibur"><i class="far fa-clock"></i> Durasi:</label>
                        <div class="durasi-display" id="durasiDisplay">
                            <span id="durasiText">1 hari</span>
                            <small id="detailHari">(${formatDateToDisplay(new Date())})</small>
                        </div>
                    </div>
                    
                    <!-- Alasan -->
                    <div class="form-group">
                        <label for="alasanLibur"><i class="fas fa-sticky-note"></i> Alasan:</label>
                        <textarea id="alasanLibur" class="form-control" 
                                  placeholder="Masukkan alasan libur/izin..." 
                                  rows="3"></textarea>
                        <small class="form-text">Maksimal 500 karakter</small>
                    </div>
                    
                    <!-- Tombol Submit -->
                    <div class="form-submit">
                        <button class="submit-btn" id="submitLiburBtn">
                            <i class="fas fa-paper-plane"></i> Ajukan Libur/Izin
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Kalender Libur Saya -->
            <div class="kalender-libur-section">
                <div class="section-header">
                    <h3><i class="fas fa-calendar"></i> Kalender Libur Saya</h3>
                    <div class="kalender-controls">
                        <button class="btn-prev-month" onclick="changeLiburMonth(-1)">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <span id="currentMonthYear">${getMonthYearDisplay()}</span>
                        <button class="btn-next-month" onclick="changeLiburMonth(1)">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
                
                <div class="kalender-container">
                    <div class="kalender-grid-wrapper">
                        <div class="kalender-grid" id="kalenderGrid">
                            <!-- Kalender akan diisi secara dinamis -->
                        </div>
                    </div>
                </div>
                
                <div class="kalender-legend">
                    <div class="legend-item">
                        <span class="legend-color libur"></span>
                        <span>Libur</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color izin"></span>
                        <span>Izin</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color sakit"></span>
                        <span>Sakit</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color cuti"></span>
                        <span>Cuti</span>
                    </div>
                </div>
            </div>
            
            <!-- History Libur Saya -->
            <div class="history-libur-section">
                <div class="section-header">
                    <h3><i class="fas fa-history"></i> History Libur/Izin Saya</h3>
                    <button class="btn-refresh-history" onclick="loadKasirLiburHistory()">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
                
                <div class="history-table-container">
                    <div class="loading" id="loadingHistoryLibur">Memuat history libur...</div>
                    <div class="table-wrapper">
                        <table class="history-table horizontal-scroll" id="historyTableLibur" style="display: none;">
                            <thead>
                                <tr>
                                    <th width="100px">Jenis</th>
                                    <th width="100px">Mulai</th>
                                    <th width="100px">Selesai</th>
                                    <th width="80px">Durasi</th>
                                    <th>Alasan</th>
                                    <th width="100px">Status</th>
                                    <th width="120px">Disetujui Oleh</th>
                                    <th width="100px">Tanggal Approve</th>
                                    <th width="80px">Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="historyBodyLibur">
                                <!-- History akan diisi di sini -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        ` : `
        <!-- Untuk OWNER: Approval Libur Requests -->
        <div class="owner-libur-section">
            <!-- Filter untuk Owner -->
            <div class="owner-filter-section">
                <div class="filter-row">
                    <div class="filter-group">
                        <label for="filterOutletOwner"><i class="fas fa-store"></i> Outlet:</label>
                        <select id="filterOutletOwnerLibur" class="outlet-select">
                            <option value="all">Semua Outlet</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="filterStatusOwner"><i class="fas fa-filter"></i> Status:</label>
                        <select id="filterStatusOwnerLibur" class="status-select">
                            <option value="all">Semua Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="filterDateOwner"><i class="fas fa-calendar"></i> Periode:</label>
                        <select id="filterDateOwnerLibur" class="date-select">
                            <option value="today">Hari Ini</option>
                            <option value="week">7 Hari Terakhir</option>
                            <option value="month">Bulan Ini</option>
                            <option value="all">Semua</option>
                        </select>
                    </div>
                    <button class="btn-apply-filter" onclick="loadLiburRequestsForOwner()">
                        <i class="fas fa-filter"></i> Terapkan
                    </button>
                </div>
            </div>
            
            <!-- Pending Libur Requests -->
            <div class="pending-libur-section">
                <div class="section-header">
                    <h3><i class="fas fa-clock"></i> Permohonan Libur Pending</h3>
                    <div class="request-stats">
                        <span id="pendingCountLibur">0 requests</span>
                    </div>
                </div>
                <div class="pending-requests-container">
                    <div class="loading" id="loadingPendingLibur">Memuat data libur...</div>
                    <div id="pendingLiburGrid" style="display: none;">
                        <!-- Libur requests akan diisi di sini -->
                    </div>
                </div>
            </div>
            
            <!-- Libur History untuk Owner -->
            <div class="libur-history-section">
                <div class="section-header">
                    <h3><i class="fas fa-history"></i> History Libur (Semua Outlet)</h3>
                </div>
                <div class="history-table-container">
                    <div class="loading" id="loadingHistoryOwnerLibur">Memuat history...</div>
                    <div class="table-wrapper">
                        <table class="history-table horizontal-scroll" id="historyTableOwnerLibur" style="display: none;">
                            <thead>
                                <tr>
                                    <th width="100px">Tanggal</th>
                                    <th width="80px">Outlet</th>
                                    <th width="120px">Karyawan</th>
                                    <th width="80px">Jenis</th>
                                    <th width="100px">Mulai</th>
                                    <th width="100px">Selesai</th>
                                    <th width="80px">Durasi</th>
                                    <th>Alasan</th>
                                    <th width="100px">Status</th>
                                    <th width="120px">Disetujui Oleh</th>
                                    <th width="100px">Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="historyBodyOwnerLibur">
                                <!-- History akan diisi di sini -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        `}
        
        <!-- Footer -->
        <div class="libur-footer">
            <p><i class="fas fa-info-circle"></i> ${isKasir || isBarberman ? 
                'Ajukan libur/izin minimal 1 hari sebelumnya' : 
                'Review dan approve/reject permohonan libur dari karyawan'}</p>
        </div>
        
        <!-- Modal Detail Libur -->
        <div class="modal-overlay" id="liburDetailModal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-calendar-check"></i> Detail Libur</h3>
                    <button class="modal-close" onclick="closeLiburDetailModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" id="liburDetailContent">
                    <!-- Detail akan diisi di sini -->
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(liburPage);
    
    // Setup event listeners
    setupLiburPageEvents();
    
    // Untuk kasir/barberman: setup form events dan generate kalender
    if (isKasir || isBarberman) {
        setupLiburFormEvents();
        generateKalender();
    }
}

// [3] Setup event listeners untuk halaman libur
function setupLiburPageEvents() {
    // Tombol kembali
    document.getElementById('backToMainFromLibur').addEventListener('click', () => {
        document.getElementById('liburPage').remove();
        document.getElementById('appScreen').style.display = 'block';
    });
    
    // Tombol refresh
    const refreshBtn = document.getElementById('refreshLibur');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            if (isOwnerLibur) {
                await loadLiburRequestsForOwner();
            } else {
                await loadKasirLiburHistory();
                generateKalender();
            }
        });
    }
    
    // Filter untuk owner
    if (isOwnerLibur) {
        document.getElementById('filterOutletOwnerLibur')?.addEventListener('change', async () => {
            await loadLiburRequestsForOwner();
        });
        
        document.getElementById('filterStatusOwnerLibur')?.addEventListener('change', async () => {
            await loadLiburRequestsForOwner();
        });
        
        document.getElementById('filterDateOwnerLibur')?.addEventListener('change', async () => {
            await loadLiburRequestsForOwner();
        });
    }
}

// [4] Setup events untuk form libur (kasir/barberman)
function setupLiburFormEvents() {
    // Hitung durasi saat tanggal berubah
    document.getElementById('startDate').addEventListener('change', calculateDurasi);
    document.getElementById('endDate').addEventListener('change', calculateDurasi);
    
    // Submit button
    document.getElementById('submitLiburBtn').addEventListener('click', submitLiburRequest);
    
    // Validasi alasan saat typing
    document.getElementById('alasanLibur').addEventListener('input', function() {
        if (this.value.length > 500) {
            this.value = this.value.substring(0, 500);
            showToast('Maksimal 500 karakter', 'warning');
        }
    });
    
    // Set default end date sama dengan start date
    calculateDurasi();
}

// [5] Fungsi untuk hitung durasi libur
function calculateDurasi() {
    const startDateText = document.getElementById('startDate').value;
    const endDateText = document.getElementById('endDate').value;
    
    if (!startDateText || !endDateText) return;
    
    // Konversi dari input date (YYYY-MM-DD) ke Date object
    const start = new Date(startDateText);
    const end = new Date(endDateText);
    
    // Validasi: end date tidak boleh sebelum start date
    if (end < start) {
        document.getElementById('endDate').value = startDateText;
        showToast('Tanggal selesai tidak boleh sebelum tanggal mulai', 'warning');
        return calculateDurasi();
    }
    
    // Hitung selisih hari (termasuk hari pertama)
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    // Format ke text untuk display (dd/MM/yyyy)
    const startFormatted = formatDateToDisplay(start);
    const endFormatted = formatDateToDisplay(end);
    
    // Update display
    document.getElementById('durasiText').textContent = `${diffDays} hari`;
    document.getElementById('detailHari').textContent = `(${startFormatted} - ${endFormatted})`;
    
    return diffDays;
}

// [6] Fungsi untuk submit libur request
async function submitLiburRequest() {
    try {
        const jenisLibur = document.getElementById('jenisLibur').value;
        const startDateInput = document.getElementById('startDate').value; // Format: YYYY-MM-DD
        const endDateInput = document.getElementById('endDate').value;     // Format: YYYY-MM-DD
        const alasan = document.getElementById('alasanLibur').value.trim();
        
        // Validasi
        if (!alasan) {
            showToast('Harap masukkan alasan libur/izin', 'warning');
            document.getElementById('alasanLibur').focus();
            return;
        }
        
        if (alasan.length < 10) {
            showToast('Alasan minimal 10 karakter', 'warning');
            document.getElementById('alasanLibur').focus();
            return;
        }
        
        const durasi = calculateDurasi();
        if (!durasi || durasi < 1) {
            showToast('Durasi tidak valid', 'warning');
            return;
        }
        
        // Konversi ke Date object
        const startDate = new Date(startDateInput);
        const endDate = new Date(endDateInput);
        
        // Format untuk database: YYYY-MM-DD (DATE type)
        const tanggalMulaiDB = formatDateToDatabase(startDate);
        const tanggalSelesaiDB = formatDateToDatabase(endDate);
        
        // Format untuk display UI: dd/MM/yyyy
        const tanggalMulaiDisplay = formatDateToDisplay(startDate);
        const tanggalSelesaiDisplay = formatDateToDisplay(endDate);
        
        // Konfirmasi dengan format Indonesia
        const confirmMessage = `Ajukan ${jenisLibur} untuk:\n` +
                              `Tanggal: ${tanggalMulaiDisplay} - ${tanggalSelesaiDisplay}\n` +
                              `Durasi: ${durasi} hari\n` +
                              `Alasan: ${alasan.substring(0, 100)}${alasan.length > 100 ? '...' : ''}\n\n` +
                              `Apakah data sudah benar?`;
        
        if (!confirm(confirmMessage)) return;
        
        // Disable button dan show loading
        const submitBtn = document.getElementById('submitLiburBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
        
        // Generate unique ID
        const liburId = generateLiburId();
        
        // Insert ke database dengan DATE type (YYYY-MM-DD)
        const { data, error } = await supabase
            .from('libur_izin')
            .insert([{
                id: liburId,
                karyawan: currentKaryawanLibur.nama_karyawan,
                outlet: currentUserOutletLibur,
                jenis: jenisLibur,
                tanggal_mulai: tanggalMulaiDB,      // Simpan sebagai DATE: YYYY-MM-DD
                tanggal_selesai: tanggalSelesaiDB,  // Simpan sebagai DATE: YYYY-MM-DD
                durasi: durasi,
                alasan: alasan,
                status: 'pending',
                created_at: new Date().toISOString(),
                nomor_wa: currentKaryawanLibur.nomor_wa
            }]);
        
        if (error) throw error;
        
        // Success
        showToast('✅ Permohonan libur berhasil diajukan!', 'success');
        
        // Reset form
        document.getElementById('alasanLibur').value = '';
        document.getElementById('endDate').value = document.getElementById('startDate').value;
        calculateDurasi();
        
        // Reload history dan kalender
        await loadKasirLiburHistory();
        generateKalender();
        
    } catch (error) {
        console.error('Error submitting libur request:', error);
        showToast(`❌ Gagal mengajukan libur: ${error.message}`, 'error');
    } finally {
        // Reset button
        const submitBtn = document.getElementById('submitLiburBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Ajukan Libur/Izin';
        }
    }
}

// [7] Fungsi untuk load libur history untuk kasir/barberman
async function loadKasirLiburHistory() {
    try {
        const loadingEl = document.getElementById('loadingHistoryLibur');
        const tableEl = document.getElementById('historyTableLibur');
        
        if (loadingEl) loadingEl.style.display = 'block';
        if (tableEl) tableEl.style.display = 'none';
        
        // Query libur history untuk karyawan ini
        const { data: liburData, error } = await supabase
            .from('libur_izin')
            .select('*')
            .eq('karyawan', currentKaryawanLibur.nama_karyawan)
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) throw error;
        
        // Simpan untuk kalender
        liburHistoryData = liburData || [];
        
        // Tampilkan history
        displayKasirLiburHistory(liburData || []);
        
    } catch (error) {
        console.error('Error loading libur history:', error);
        const tbody = document.getElementById('historyBodyLibur');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        Gagal memuat history: ${error.message}
                    </td>
                </tr>
            `;
        }
    } finally {
        const loadingEl = document.getElementById('loadingHistoryLibur');
        const tableEl = document.getElementById('historyTableLibur');
        
        if (loadingEl) loadingEl.style.display = 'none';
        if (tableEl && tableEl.querySelector('tbody').children.length > 0) {
            tableEl.style.display = 'table';
        }
    }
}

// [8] Display libur history untuk kasir
function displayKasirLiburHistory(liburData) {
    const tbody = document.getElementById('historyBodyLibur');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!liburData || liburData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-message">
                    <i class="fas fa-calendar-times"></i>
                    Belum ada history libur/izin
                </td>
            </tr>
        `;
        return;
    }
    
    liburData.forEach(libur => {
        // Parse tanggal dari database DATE type (YYYY-MM-DD)
        const startDate = new Date(libur.tanggal_mulai);
        const endDate = new Date(libur.tanggal_selesai);
        const approveDate = libur.approved_at ? new Date(libur.approved_at) : null;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <span class="jenis-badge jenis-${libur.jenis.toLowerCase()}">
                    ${libur.jenis}
                </span>
            </td>
            <td>${formatDateToDisplay(startDate)}</td>
            <td>${formatDateToDisplay(endDate)}</td>
            <td>${libur.durasi} hari</td>
            <td class="alasan-cell" title="${libur.alasan}">
                ${libur.alasan.length > 50 ? libur.alasan.substring(0, 50) + '...' : libur.alasan}
            </td>
            <td>
                <span class="status-pill ${getLiburStatusClass(libur.status)}">
                    ${libur.status === 'approved' ? 'Disetujui' : 
                      libur.status === 'rejected' ? 'Ditolak' : 
                      libur.status === 'pending' ? 'Menunggu' : libur.status}
                </span>
            </td>
            <td>${libur.approved_by || '-'}</td>
            <td>${approveDate ? formatDateToDisplay(approveDate) : '-'}</td>
            <td>
                <button class="btn-action btn-view" onclick="showLiburDetail('${libur.id}')" title="View Detail">
                    <i class="fas fa-eye"></i>
                </button>
                ${libur.status === 'pending' ? `
                <button class="btn-action btn-cancel" onclick="cancelLiburRequest('${libur.id}')" title="Batalkan">
                    <i class="fas fa-times"></i>
                </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// [9] Fungsi untuk load libur requests untuk owner
async function loadLiburRequestsForOwner() {
    try {
        // Tampilkan loading
        const loadingPending = document.getElementById('loadingPendingLibur');
        const pendingGrid = document.getElementById('pendingLiburGrid');
        const loadingHistory = document.getElementById('loadingHistoryOwnerLibur');
        const historyTable = document.getElementById('historyTableOwnerLibur');
        
        if (loadingPending) loadingPending.style.display = 'block';
        if (pendingGrid) pendingGrid.style.display = 'none';
        if (loadingHistory) loadingHistory.style.display = 'block';
        if (historyTable) historyTable.style.display = 'none';
        
        // Get filter values
        const outletFilter = document.getElementById('filterOutletOwnerLibur')?.value || 'all';
        const statusFilter = document.getElementById('filterStatusOwnerLibur')?.value || 'all';
        const dateFilter = document.getElementById('filterDateOwnerLibur')?.value || 'month';
        
        // Build query
        let query = supabase
            .from('libur_izin')
            .select('*')
            .order('created_at', { ascending: false });
        
        // Apply filters
        if (outletFilter !== 'all') {
            query = query.eq('outlet', outletFilter);
        }
        
        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }
        
        if (dateFilter !== 'all') {
            const today = new Date();
            let startDate = new Date();
            
            if (dateFilter === 'today') {
                startDate.setHours(0, 0, 0, 0);
            } else if (dateFilter === 'week') {
                startDate.setDate(today.getDate() - 7);
            } else if (dateFilter === 'month') {
                startDate.setMonth(today.getMonth() - 1);
            }
            
            query = query.gte('created_at', startDate.toISOString());
        }
        
        const { data: liburData, error } = await query;
        
        if (error) throw error;
        
        // Pisahkan pending dan history
        const pendingLibur = (liburData || []).filter(item => item.status === 'pending');
        const historyLibur = (liburData || []).filter(item => item.status !== 'pending');
        
        // Display data
        displayPendingLiburRequests(pendingLibur);
        displayOwnerLiburHistory(historyLibur);
        
        // Load outlet dropdown options
        await loadOutletDropdownForLibur(liburData || []);
        
        // Update count
        const pendingCountEl = document.getElementById('pendingCountLibur');
        if (pendingCountEl) {
            pendingCountEl.textContent = `${pendingLibur.length} requests pending`;
        }
        
    } catch (error) {
        console.error('Error loading libur requests:', error);
        showToast(`Gagal memuat data libur: ${error.message}`, 'error');
    } finally {
        // Hide loading
        const loadingPending = document.getElementById('loadingPendingLibur');
        const pendingGrid = document.getElementById('pendingLiburGrid');
        const loadingHistory = document.getElementById('loadingHistoryOwnerLibur');
        const historyTable = document.getElementById('historyTableOwnerLibur');
        
        if (loadingPending) loadingPending.style.display = 'none';
        if (pendingGrid) pendingGrid.style.display = 'block';
        if (loadingHistory) loadingHistory.style.display = 'none';
        if (historyTable) historyTable.style.display = 'table';
    }
}

// [10] Display pending libur requests untuk owner
function displayPendingLiburRequests(liburData) {
    const pendingGrid = document.getElementById('pendingLiburGrid');
    if (!pendingGrid) return;
    
    if (!liburData || liburData.length === 0) {
        pendingGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h4>Tidak ada permohonan libur pending</h4>
                <p>Semua permohonan sudah diproses</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    liburData.forEach(libur => {
        const createdDate = new Date(libur.created_at);
        const startDate = new Date(libur.tanggal_mulai);
        const endDate = new Date(libur.tanggal_selesai);
        
        html += `
            <div class="libur-request-card" data-libur-id="${libur.id}">
                <div class="libur-card-header">
                    <div class="libur-info-compact">
                        <div class="libur-karyawan">
                            <i class="fas fa-user"></i>
                            <strong>${libur.karyawan}</strong>
                            <span class="libur-outlet">(${libur.outlet})</span>
                        </div>
                        <div class="libur-date">
                            <i class="far fa-calendar"></i>
                            <span>Diajukan: ${formatDateToDisplay(createdDate)}</span>
                        </div>
                        <div class="libur-jenis">
                            <span class="jenis-badge jenis-${libur.jenis.toLowerCase()}">
                                ${libur.jenis}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="libur-card-body">
                    <!-- Info Libur -->
                    <div class="libur-info-detail">
                        <div class="info-row">
                            <div class="info-item">
                                <i class="fas fa-calendar-day"></i>
                                <span>Tanggal: ${formatDateToDisplay(startDate)} - ${formatDateToDisplay(endDate)}</span>
                            </div>
                            <div class="info-item">
                                <i class="far fa-clock"></i>
                                <span>Durasi: ${libur.durasi} hari</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Alasan -->
                    <div class="libur-alasan">
                        <i class="fas fa-sticky-note"></i>
                        <div class="alasan-text">${libur.alasan}</div>
                    </div>
                    
                    <!-- Catatan Review (untuk owner mengisi) -->
                    <div class="review-section">
                        <label for="reviewNotes_${libur.id}">
                            <i class="fas fa-edit"></i> Catatan Review:
                        </label>
                        <textarea id="reviewNotes_${libur.id}" 
                                  placeholder="Masukkan catatan review (opsional)..." 
                                  rows="2"></textarea>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="libur-action-buttons">
                        <button class="btn-approve" onclick="approveLiburRequest('${libur.id}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn-reject" onclick="rejectLiburRequest('${libur.id}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                        <button class="btn-detail" onclick="showLiburDetail('${libur.id}')">
                            <i class="fas fa-info-circle"></i> Detail
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    pendingGrid.innerHTML = html;
}

// [11] Display libur history untuk owner
function displayOwnerLiburHistory(liburData) {
    const tbody = document.getElementById('historyBodyOwnerLibur');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!liburData || liburData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="empty-message">
                    <i class="fas fa-history"></i>
                    Tidak ada history libur
                </td>
            </tr>
        `;
        return;
    }
    
    // Batasi maksimal 15 baris
    const displayLibur = liburData.slice(0, 15);
    
    displayLibur.forEach(libur => {
        const createdDate = new Date(libur.created_at);
        const startDate = new Date(libur.tanggal_mulai);
        const endDate = new Date(libur.tanggal_selesai);
        const approveDate = libur.approved_at ? new Date(libur.approved_at) : null;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDateToDisplay(createdDate)}</td>
            <td>${libur.outlet || '-'}</td>
            <td>${libur.karyawan || '-'}</td>
            <td>
                <span class="jenis-badge jenis-${libur.jenis.toLowerCase()}">
                    ${libur.jenis}
                </span>
            </td>
            <td>${formatDateToDisplay(startDate)}</td>
            <td>${formatDateToDisplay(endDate)}</td>
            <td>${libur.durasi} hari</td>
            <td class="alasan-cell" title="${libur.alasan}">
                ${libur.alasan.length > 40 ? libur.alasan.substring(0, 40) + '...' : libur.alasan}
            </td>
            <td>
                <span class="status-pill ${getLiburStatusClass(libur.status)}">
                    ${libur.status === 'approved' ? 'Disetujui' : 
                      libur.status === 'rejected' ? 'Ditolak' : 
                      libur.status === 'pending' ? 'Menunggu' : libur.status}
                </span>
            </td>
            <td>${libur.approved_by || '-'}</td>
            <td>
                <button class="btn-action btn-view" onclick="showLiburDetail('${libur.id}')" title="View Detail">
                    <i class="fas fa-eye"></i>
                </button>
                ${libur.status === 'approved' ? `
                <button class="btn-action btn-wa" onclick="sendLiburReminder('${libur.id}')" title="Kirim Reminder WA">
                    <i class="fab fa-whatsapp"></i>
                </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// [12] Fungsi untuk approve libur request - FINAL VERSION
async function approveLiburRequest(liburId) {
    try {
        const reviewNotes = document.getElementById(`reviewNotes_${liburId}`)?.value || '';
        
        // Ambil data libur
        const { data: liburData, error: fetchError } = await supabase
            .from('libur_izin')
            .select('*')
            .eq('id', liburId)
            .single();
        
        if (fetchError) throw fetchError;
        
        const startDate = new Date(liburData.tanggal_mulai);
        const endDate = new Date(liburData.tanggal_selesai);
        
        // Konfirmasi
        if (!confirm(`Approve ${liburData.jenis} untuk ${liburData.karyawan}?\n\n` +
                   `Tanggal: ${formatDateToDisplay(startDate)} - ${formatDateToDisplay(endDate)}\n` +
                   `Durasi: ${liburData.durasi} hari\n` +
                   `Alasan: ${liburData.alasan.substring(0, 100)}${liburData.alasan.length > 100 ? '...' : ''}`)) {
            return;
        }
        
        // Update status libur di tabel libur_izin
        const { error: updateError } = await supabase
            .from('libur_izin')
            .update({
                status: 'approved',
                approved_at: new Date().toISOString(),
                approved_by: currentKaryawanLibur.nama_karyawan,
                review_notes: reviewNotes || null
            })
            .eq('id', liburId);
        
        if (updateError) throw updateError;
        
        console.log('✅ Libur status updated to approved');
        
        // **PILIH METODE BERDASARKAN KONDISI**
        let absenResult = false;
        
        // Metode 1: Update trigger dulu (jika bisa)
        try {
            await updateAttendanceTriggerIfPossible();
            
            // Gunakan metode dengan clockin khusus
            const processedCount = await insertAbsenRecordsForLibur(liburData);
            absenResult = processedCount > 0;
            
        } catch (triggerError) {
            console.log('⚠️ Cannot update trigger, using alternative...');
            
            // Metode 2: Langsung update status tanpa trigger
            absenResult = await forceUpdateAbsenStatus(liburData);
        }
        
        // Kirim notifikasi
        if (absenResult) {
            console.log('✅ Absen records updated successfully');
        } else {
            console.warn('⚠️ Absen records may not be updated correctly');
            showToast('Libur disetujui, tapi status absen mungkin perlu dicek manual', 'warning');
        }
        
        // WhatsApp notifications
        await sendWhatsAppNotification(liburData, 'approved', reviewNotes);
        await sendGroupWhatsAppNotification(liburData);
        
        showToast('✅ Libur berhasil disetujui!', 'success');
        
        // Reload data
        await loadLiburRequestsForOwner();
        
    } catch (error) {
        console.error('Error approving libur:', error);
        showToast(`❌ Gagal approve libur: ${error.message}`, 'error');
    }
}

// Helper: Force update tanpa trigger
async function forceUpdateAbsenStatus(liburData) {
    try {
        const clockinMap = {
            'LIBUR': 'Libur',
            'IZIN': 'Izin', 
            'SAKIT': 'Sakit',
            'CUTI': 'Cuti'
        };
        
        const statusValue = clockinMap[liburData.jenis] || 'Izin';
        const startDate = new Date(liburData.tanggal_mulai);
        const endDate = new Date(liburData.tanggal_selesai);
        
        let currentDate = new Date(startDate);
        let updatedCount = 0;
        
        while (currentDate <= endDate) {
            const tanggalText = formatDateForAbsen(currentDate);
            
            // Update langsung status_kehadiran
            const { error } = await supabase
                .from('absen')
                .update({
                    status_kehadiran: statusValue,
                    clockin: '00:00', // Minimal value
                    clockout: '00:00',
                    libur_id: liburData.id,
                    updated_at: new Date().toISOString()
                })
                .eq('nama', liburData.karyawan)
                .eq('tanggal', tanggalText);
            
            if (!error) updatedCount++;
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        console.log(`✅ Force updated ${updatedCount} records`);
        return updatedCount > 0;
        
    } catch (error) {
        console.error('Force update error:', error);
        return false;
    }
}

// [13] Fungsi untuk reject libur request
async function rejectLiburRequest(liburId) {
    try {
        const reviewNotes = document.getElementById(`reviewNotes_${liburId}`)?.value || '';
        
        if (!reviewNotes.trim()) {
            showToast('Harap masukkan alasan penolakan', 'warning');
            document.getElementById(`reviewNotes_${liburId}`).focus();
            return;
        }
        
        // Ambil data libur
        const { data: liburData, error: fetchError } = await supabase
            .from('libur_izin')
            .select('*')
            .eq('id', liburId)
            .single();
        
        if (fetchError) throw fetchError;
        
        if (!confirm(`Tolak libur untuk ${liburData.karyawan}?\n\n` +
                   `Alasan penolakan: ${reviewNotes}`)) {
            return;
        }
        
        // Update status libur
        const { error: updateError } = await supabase
            .from('libur_izin')
            .update({
                status: 'rejected',
                approved_at: new Date().toISOString(),
                approved_by: currentKaryawanLibur.nama_karyawan,
                review_notes: reviewNotes
            })
            .eq('id', liburId);
        
        if (updateError) throw updateError;
        
        // Kirim notifikasi WhatsApp
        await sendWhatsAppNotification(liburData, 'rejected', reviewNotes);
        
        showToast('❌ Libur berhasil ditolak!', 'success');
        
        // Reload data
        await loadLiburRequestsForOwner();
        
    } catch (error) {
        console.error('Error rejecting libur:', error);
        showToast(`❌ Gagal reject libur: ${error.message}`, 'error');
    }
}
// [14L] FUNGSI FINAL: Gunakan clockin "Libur", "Izin", dll
async function insertAbsenRecordsForLibur(liburData) {
    try {
        console.log(`📝 Processing absen untuk libur: ${liburData.karyawan}`);
        
        // Map jenis libur ke nilai clockin
        const clockinMap = {
            'LIBUR': 'Libur',
            'IZIN': 'Izin', 
            'SAKIT': 'Sakit',
            'CUTI': 'Cuti'
        };
        
        const clockinValue = clockinMap[liburData.jenis] || 'Izin';
        const clockoutValue = clockinValue; // Gunakan nilai yang sama
        
        console.log(`🎯 Menggunakan clockin: "${clockinValue}", clockout: "${clockoutValue}"`);
        
        const startDate = new Date(liburData.tanggal_mulai);
        const endDate = new Date(liburData.tanggal_selesai);
        let currentDate = new Date(startDate);
        let successCount = 0;
        
        // Untuk setiap hari dalam rentang
        while (currentDate <= endDate) {
            const tanggalText = formatDateForAbsen(currentDate);
            const hari = currentDate.toLocaleDateString('id-ID', { weekday: 'long' });
            
            console.log(`\n📅 Processing: ${tanggalText} (${hari})`);
            
            try {
                // **STRATEGI: Upsert dengan clockin khusus**
                const record = {
                    tanggal: tanggalText,
                    hari: hari,
                    nama: liburData.karyawan,
                    id_uniq: `LIBUR-${currentDate.getTime()}-${liburData.id.substring(0, 8)}`,
                    outlet: liburData.outlet,
                    // **KUNCI: Gunakan clockin khusus**
                    clockin: clockinValue,
                    clockout: clockoutValue,
                    jamkerja: '00:00',
                    over_time: '00:00',
                    over_time_rp: 0,
                    telat_menit: 0,
                    cepat_menit: 0,
                    // Biarkan status_kehadiran null, akan diisi trigger
                    status_kehadiran: null,
                    libur_id: liburData.id,
                    alasan_libur: liburData.alasan.substring(0, 200),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                
                // Coba upsert dulu
                const { error: upsertError } = await supabase
                    .from('absen')
                    .upsert([record], {
                        onConflict: 'id_uniq'
                    });
                
                if (upsertError) {
                    console.log(`   ⚠️ Upsert failed: ${upsertError.message}`);
                    
                    // Fallback 1: Coba update existing
                    const { data: existing } = await supabase
                        .from('absen')
                        .select('id')
                        .eq('nama', liburData.karyawan)
                        .eq('tanggal', tanggalText)
                        .maybeSingle();
                    
                    if (existing) {
                        // Update existing record
                        const { error: updateError } = await supabase
                            .from('absen')
                            .update({
                                clockin: clockinValue,
                                clockout: clockoutValue,
                                jamkerja: '00:00',
                                telat_menit: 0,
                                cepat_menit: 0,
                                status_kehadiran: clockinValue, // Langsung set
                                libur_id: liburData.id,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', existing.id);
                        
                        if (!updateError) {
                            console.log(`   ✅ Updated existing record`);
                            successCount++;
                        } else {
                            console.error(`   ❌ Update failed:`, updateError);
                        }
                        
                    } else {
                        // Insert new
                        const { error: insertError } = await supabase
                            .from('absen')
                            .insert([record]);
                        
                        if (!insertError) {
                            console.log(`   ✅ Inserted new record`);
                            successCount++;
                        } else {
                            console.error(`   ❌ Insert failed:`, insertError);
                        }
                    }
                    
                } else {
                    console.log(`   ✅ Upsert successful`);
                    successCount++;
                }
                
            } catch (dayError) {
                console.error(`   ❌ Error for ${tanggalText}:`, dayError);
                
                // Last resort: Update minimal
                try {
                    await supabase
                        .from('absen')
                        .update({
                            clockin: clockinValue,
                            status_kehadiran: clockinValue
                        })
                        .eq('nama', liburData.karyawan)
                        .eq('tanggal', tanggalText);
                    
                    successCount++;
                } catch (minimalError) {
                    // Ignore jika gagal juga
                }
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        console.log(`\n🎉 Successfully processed ${successCount} days`);
        
        // Verifikasi
        await verifyLiburStatusAfterUpdate(liburData, startDate, endDate, clockinValue);
        
        return successCount;
        
    } catch (error) {
        console.error('❌ Error in insertAbsenRecordsForLibur:', error);
        
        // Jangan throw error, biarkan approval libur tetap sukses
        showToast('Libur disetujui, tetapi ada masalah dengan pencatatan absen. Silakan cek manual.', 'warning');
        return 0;
    }
}

// Helper: Verifikasi setelah update
async function verifyLiburStatusAfterUpdate(liburData, startDate, endDate, expectedClockin) {
    try {
        console.log('\n🔍 Verifying updates...');
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Tunggu 1 detik
        
        const { data: absenRecords } = await supabase
            .from('absen')
            .select('tanggal, clockin, status_kehadiran')
            .eq('nama', liburData.karyawan)
            .gte('tanggal', formatDateForAbsen(startDate))
            .lte('tanggal', formatDateForAbsen(endDate))
            .order('tanggal');
        
        if (absenRecords && absenRecords.length > 0) {
            let correctCount = 0;
            let needsFix = [];
            
            absenRecords.forEach(record => {
                const clockinCorrect = record.clockin === expectedClockin;
                const statusCorrect = record.status_kehadiran === expectedClockin;
                const isCorrect = clockinCorrect && statusCorrect;
                
                console.log(`   ${record.tanggal}:`);
                console.log(`     clockin="${record.clockin}" ${clockinCorrect ? '✅' : '❌'}`);
                console.log(`     status="${record.status_kehadiran}" ${statusCorrect ? '✅' : '❌'}`);
                
                if (isCorrect) {
                    correctCount++;
                } else {
                    needsFix.push(record.tanggal);
                }
            });
            
            console.log(`\n📊 Result: ${correctCount}/${absenRecords.length} fully correct`);
            
            // Fix yang belum benar
            if (needsFix.length > 0) {
                console.log(`🔄 Need to fix: ${needsFix.join(', ')}`);
                await fixRemainingRecords(liburData, needsFix, expectedClockin);
            }
            
        } else {
            console.warn('⚠️ No records found for verification');
        }
        
    } catch (error) {
        console.error('Verification error:', error);
    }
}

// Helper: Fix records yang belum benar
async function fixRemainingRecords(liburData, datesToFix, expectedClockin) {
    let fixedCount = 0;
    
    for (const tanggalText of datesToFix) {
        try {
            const { error } = await supabase
                .from('absen')
                .update({
                    clockin: expectedClockin,
                    clockout: expectedClockin,
                    status_kehadiran: expectedClockin,
                    updated_at: new Date().toISOString()
                })
                .eq('nama', liburData.karyawan)
                .eq('tanggal', tanggalText);
            
            if (!error) fixedCount++;
            
        } catch (error) {
            console.error(`Failed to fix ${tanggalText}:`, error);
        }
    }
    
    console.log(`   Fixed ${fixedCount}/${datesToFix.length} records`);
}

// [14M] SIMPLE VERSION: Untuk testing cepat
async function simpleLiburAbsen(liburData) {
    try {
        const clockinMap = {
            'LIBUR': 'Libur',
            'IZIN': 'Izin', 
            'SAKIT': 'Sakit',
            'CUTI': 'Cuti'
        };
        
        const clockinValue = clockinMap[liburData.jenis] || 'Izin';
        
        console.log(`🔧 Simple method with clockin="${clockinValue}"`);
        
        const startDate = new Date(liburData.tanggal_mulai);
        const endDate = new Date(liburData.tanggal_selesai);
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            const tanggalText = formatDateForAbsen(currentDate);
            
            // Simple update langsung
            await supabase
                .from('absen')
                .update({
                    clockin: clockinValue,
                    status_kehadiran: clockinValue
                })
                .eq('nama', liburData.karyawan)
                .eq('tanggal', tanggalText);
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        console.log(`✅ Simple update completed`);
        return true;
        
    } catch (error) {
        console.error('Simple method error:', error);
        return false;
    }
}
// [15] Fungsi untuk kirim notifikasi WhatsApp ke karyawan
async function sendWhatsAppNotification(liburData, action, reviewNotes = '') {
    try {
        const WA_API_URL = 'https://waha-yetv8qi4e3zk.anakit.sumopod.my.id/api/sendText';
        const WA_API_KEY = 'sfcoGbpdLDkGZhKw2rx8sbb14vf4d8V6';
        
        // Format nomor WhatsApp
        let chatId = liburData.nomor_wa;
        if (chatId) {
            // Pastikan format 62xxxxxxxxxx@c.us
            chatId = chatId.replace(/^0/, '62').replace(/^\+62/, '62');
            if (!chatId.includes('@c.us')) {
                chatId += '@c.us';
            }
        } else {
            console.warn('Nomor WA tidak tersedia untuk', liburData.karyawan);
            return;
        }
        
        // Parse tanggal dari database DATE
        const startDate = new Date(liburData.tanggal_mulai);
        const endDate = new Date(liburData.tanggal_selesai);
        
        // Buat pesan
        let message = '';
        if (action === 'approved') {
            message = `✅ *LIBUR DISETUJUI*\n\n` +
                     `Halo ${liburData.karyawan},\n\n` +
                     `Permohonan libur/izin Anda telah *DISETUJUI*:\n\n` +
                     `• Jenis: ${liburData.jenis}\n` +
                     `• Tanggal: ${formatDateToDisplay(startDate)} - ${formatDateToDisplay(endDate)}\n` +
                     `• Durasi: ${liburData.durasi} hari\n` +
                     `• Alasan: ${liburData.alasan}\n\n` +
                     `${reviewNotes ? `Catatan: ${reviewNotes}\n\n` : ''}` +
                     `Disetujui oleh: ${currentKaryawanLibur.nama_karyawan}\n` +
                     `Pada: ${formatDateToDisplay(new Date())} ${new Date().toLocaleTimeString('id-ID')}\n\n` +
                     `_Status kehadiran telah dicatat sebagai ${liburData.jenis === 'LIBUR' ? 'LIBUR' : 'IZIN'}_`;
        } else {
            message = `❌ *LIBUR DITOLAK*\n\n` +
                     `Halo ${liburData.karyawan},\n\n` +
                     `Permohonan libur/izin Anda *DITOLAK*:\n\n` +
                     `• Jenis: ${liburData.jenis}\n` +
                     `• Tanggal: ${formatDateToDisplay(startDate)} - ${formatDateToDisplay(endDate)}\n` +
                     `• Alasan Anda: ${liburData.alasan}\n\n` +
                     `*Alasan Penolakan:*\n${reviewNotes}\n\n` +
                     `Ditolak oleh: ${currentKaryawanLibur.nama_karyawan}\n` +
                     `Pada: ${formatDateToDisplay(new Date())} ${new Date().toLocaleTimeString('id-ID')}\n\n` +
                     `Silakan hubungi atasan untuk informasi lebih lanjut.`;
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
        
        console.log(`📱 WhatsApp notification sent to ${liburData.karyawan}`);
        
    } catch (error) {
        console.error('Error sending WhatsApp notification:', error);
        // Tidak throw error agar tidak mengganggu proses utama
    }
}

// [16] Fungsi untuk kirim ke group WhatsApp (ambil dari tabel outlet)
async function sendGroupWhatsAppNotification(liburData) {
    try {
        const WA_API_URL = 'https://waha-yetv8qi4e3zk.anakit.sumopod.my.id/api/sendText';
        const WA_API_KEY = 'sfcoGbpdLDkGZhKw2rx8sbb14vf4d8V6';
        
        // Ambil group_wa dari tabel outlet
        const { data: outletData, error } = await supabase
            .from('outlet')
            .select('group_wa')
            .eq('nama_outlet', liburData.outlet)
            .single();
        
        if (error || !outletData?.group_wa) {
            console.warn(`Group WA tidak ditemukan untuk outlet ${liburData.outlet}`);
            return;
        }
        
        const GROUP_CHAT_ID = outletData.group_wa; // Format: 62811159429-1533260196@g.us
        
        // Parse tanggal dari database DATE
        const startDate = new Date(liburData.tanggal_mulai);
        const endDate = new Date(liburData.tanggal_selesai);
        
        // Buat pesan untuk group
        const message = `📢 *INFORMASI LIBUR KARYAWAN*\n\n` +
                       `*${liburData.karyawan}* akan ${liburData.jenis.toLowerCase()}:\n\n` +
                       `📍 Outlet: ${liburData.outlet}\n` +
                       `📅 Tanggal: ${formatDateToDisplay(startDate)} - ${formatDateToDisplay(endDate)}\n` +
                       `⏱️ Durasi: ${liburData.durasi} hari\n` +
                       `📝 Alasan: ${liburData.alasan}\n\n` +
                       `👥 *Kepada seluruh karyawan:*\n` +
                       `Mohon standby dan koordinasi untuk penjadwalan ulang.\n\n` +
                       `Disetujui oleh: ${currentKaryawanLibur.nama_karyawan}\n` +
                       `Pada: ${formatDateToDisplay(new Date())}`;
        
        // Kirim ke group
        const response = await fetch(WA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': WA_API_KEY
            },
            body: JSON.stringify({
                session: 'Session1',
                chatId: GROUP_CHAT_ID,
                text: message
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        console.log(`📱 Group WhatsApp notification sent to ${GROUP_CHAT_ID}`);
        
    } catch (error) {
        console.error('Error sending group WhatsApp:', error);
        // Tidak throw error agar tidak mengganggu proses utama
    }
}

// [17] Fungsi untuk generate kalender - DIPERBAIKI untuk include hari pertama
function generateKalender() {
    const kalenderGrid = document.getElementById('kalenderGrid');
    if (!kalenderGrid) return;
    
    // Update bulan/tahun display
    document.getElementById('currentMonthYear').textContent = getMonthYearDisplay();
    
    // Bersihkan kalender
    kalenderGrid.innerHTML = '';
    
    // Tambah header hari
    const hariHeaders = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    hariHeaders.forEach(hari => {
        const headerCell = document.createElement('div');
        headerCell.className = 'kalender-header';
        headerCell.textContent = hari;
        kalenderGrid.appendChild(headerCell);
    });
    
    // Generate tanggal
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Offset untuk hari pertama (Minggu = 0, Senin = 1, ..., Sabtu = 6)
    const firstDayIndex = firstDay.getDay();
    
    // Tambah sel kosong sebelum tanggal pertama
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'kalender-empty';
        kalenderGrid.appendChild(emptyCell);
    }
    
    // Tanggal-tanggal
    const today = new Date();
    const todayFormatted = formatDateToDatabase(today); // YYYY-MM-DD
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateCell = document.createElement('div');
        dateCell.className = 'kalender-day';
        
        const currentDate = new Date(currentYear, currentMonth, day);
        const currentDateFormatted = formatDateToDatabase(currentDate); // YYYY-MM-DD
        
        // Cek apakah hari ini
        const isToday = currentDateFormatted === todayFormatted;
        
        // Cek apakah ada libur di tanggal ini - PERBAIKAN DI SINI!
        const liburOnThisDay = liburHistoryData.filter(libur => {
            try {
                // Parse tanggal dari database dan format ke YYYY-MM-DD untuk konsistensi
                const liburStart = new Date(libur.tanggal_mulai);
                const liburEnd = new Date(libur.tanggal_selesai);
                
                // Format ke YYYY-MM-DD untuk compare apple-to-apple
                const liburStartFormatted = formatDateToDatabase(liburStart);
                const liburEndFormatted = formatDateToDatabase(liburEnd);
                const currentDateFormatted = formatDateToDatabase(currentDate);
                
                // Debug log untuk cek perbandingan
                console.log(`📅 Comparing:`, {
                    current: currentDateFormatted,
                    liburStart: liburStartFormatted,
                    liburEnd: liburEndFormatted,
                    isInRange: currentDateFormatted >= liburStartFormatted && 
                              currentDateFormatted <= liburEndFormatted
                });
                
                // PERBAIKAN: Compare formatted dates (YYYY-MM-DD)
                return currentDateFormatted >= liburStartFormatted && 
                       currentDateFormatted <= liburEndFormatted;
                
            } catch (error) {
                console.error('Error parsing date:', error);
                return false;
            }
        });
        
        // Add classes
        if (isToday) {
            dateCell.classList.add('today');
        }
        
        if (liburOnThisDay.length > 0) {
            dateCell.classList.add('has-libur');
            const jenis = liburOnThisDay[0].jenis.toLowerCase();
            dateCell.classList.add(`libur-${jenis}`);
            
            // Tambah data attribute untuk debugging
            dateCell.setAttribute('data-libur-start', liburOnThisDay[0].tanggal_mulai);
            dateCell.setAttribute('data-libur-end', liburOnThisDay[0].tanggal_selesai);
            dateCell.setAttribute('data-current-date', currentDateFormatted);
            
            // Tooltip dengan informasi libur
            const tooltipText = liburOnThisDay.map(l => 
                `${l.jenis}: ${formatDateToDisplay(new Date(l.tanggal_mulai))} - ${formatDateToDisplay(new Date(l.tanggal_selesai))}\nAlasan: ${l.alasan.substring(0, 30)}${l.alasan.length > 30 ? '...' : ''}`
            ).join('\n\n');
            
            dateCell.setAttribute('title', tooltipText);
            dateCell.setAttribute('data-tooltip', tooltipText);
        }
        
        // Add content
        dateCell.innerHTML = `
            <div class="day-number">${day}</div>
            ${liburOnThisDay.length > 0 ? 
                `<div class="libur-indicator ${liburOnThisDay[0].status}" 
                      title="${liburOnThisDay[0].jenis}: ${liburOnThisDay[0].status}"></div>` : ''}
        `;
        
        // Tambah event click untuk detail
        if (liburOnThisDay.length > 0) {
            dateCell.style.cursor = 'pointer';
            dateCell.addEventListener('click', () => {
                showLiburDetail(liburOnThisDay[0].id);
            });
        }
        
        kalenderGrid.appendChild(dateCell);
    }
    
    // Debug: Tampilkan data libur yang sedang diproses
    console.log('📅 Libur data for calendar:', liburHistoryData);
    console.log('📅 Calendar generated for:', getMonthYearDisplay());
}

// [18] Helper functions untuk format tanggal
function formatDateToDatabase(date) {
    // Format: YYYY-MM-DD untuk database DATE type
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateToDisplay(date) {
    // Format: dd/MM/yyyy untuk display UI
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatDateForAbsen(date) {
    // Format: dd/MM/yyyy untuk tabel absen.tanggal (TEXT)
    return formatDateToDisplay(date);
}

function getMonthYearDisplay() {
    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${monthNames[currentMonth]} ${currentYear}`;
}

function changeLiburMonth(delta) {
    currentMonth += delta;
    
    // Handle year change
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    
    generateKalender();
}

function getLiburStatusClass(status) {
    switch(status) {
        case 'approved': return 'status-approved';
        case 'pending': return 'status-pending';
        case 'rejected': return 'status-rejected';
        default: return 'status-unknown';
    }
}

// [19] Fungsi untuk show libur detail modal
async function showLiburDetail(liburId) {
    try {
        // Ambil data libur
        const { data: libur, error } = await supabase
            .from('libur_izin')
            .select('*')
            .eq('id', liburId)
            .single();
        
        if (error) throw error;
        
        const modal = document.getElementById('liburDetailModal');
        const content = document.getElementById('liburDetailContent');
        
        // Parse tanggal dari database DATE
        const startDate = new Date(libur.tanggal_mulai);
        const endDate = new Date(libur.tanggal_selesai);
        const createdDate = new Date(libur.created_at);
        const approveDate = libur.approved_at ? new Date(libur.approved_at) : null;
        
        content.innerHTML = `
            <div class="libur-detail">
                <div class="detail-section">
                    <h4><i class="fas fa-info-circle"></i> Informasi Libur</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Karyawan:</label>
                            <span>${libur.karyawan}</span>
                        </div>
                        <div class="detail-item">
                            <label>Outlet:</label>
                            <span>${libur.outlet}</span>
                        </div>
                        <div class="detail-item">
                            <label>Jenis:</label>
                            <span class="jenis-badge jenis-${libur.jenis.toLowerCase()}">
                                ${libur.jenis}
                            </span>
                        </div>
                        <div class="detail-item">
                            <label>Status:</label>
                            <span class="status-pill ${getLiburStatusClass(libur.status)}">
                                ${libur.status === 'approved' ? 'Disetujui' : 
                                  libur.status === 'rejected' ? 'Ditolak' : 
                                  libur.status === 'pending' ? 'Menunggu' : libur.status}
                            </span>
                        </div>
                        <div class="detail-item">
                            <label>Tanggal Mulai:</label>
                            <span>${formatDateToDisplay(startDate)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Tanggal Selesai:</label>
                            <span>${formatDateToDisplay(endDate)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Durasi:</label>
                            <span>${libur.durasi} hari</span>
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
                            <span>${libur.approved_by}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4><i class="fas fa-sticky-note"></i> Alasan</h4>
                    <div class="alasan-box">${libur.alasan}</div>
                </div>
                
                ${libur.review_notes ? `
                <div class="detail-section">
                    <h4><i class="fas fa-edit"></i> Catatan Review</h4>
                    <div class="notes-box">${libur.review_notes}</div>
                </div>
                ` : ''}
            </div>
        `;
        
        modal.style.display = 'flex';
        
    } catch (error) {
        console.error('Error showing libur detail:', error);
        showToast('❌ Gagal memuat detail libur', 'error');
    }
}

function closeLiburDetailModal() {
    document.getElementById('liburDetailModal').style.display = 'none';
}

// [20] Fungsi untuk cancel libur request (kasir/barberman)
async function cancelLiburRequest(liburId) {
    if (!confirm('Batalkan permohonan libur ini?')) return;
    
    try {
        const { error } = await supabase
            .from('libur_izin')
            .update({ 
                status: 'cancelled',
                approved_at: new Date().toISOString()
            })
            .eq('id', liburId);
        
        if (error) throw error;
        
        showToast('✅ Permohonan libur dibatalkan', 'success');
        await loadKasirLiburHistory();
        generateKalender();
        
    } catch (error) {
        console.error('Error cancelling libur:', error);
        showToast('❌ Gagal membatalkan libur', 'error');
    }
}

// [21] Fungsi untuk send libur reminder
async function sendLiburReminder(liburId) {
    try {
        // Ambil data libur
        const { data: libur, error } = await supabase
            .from('libur_izin')
            .select('*')
            .eq('id', liburId)
            .single();
        
        if (error) throw error;
        
        const startDate = new Date(libur.tanggal_mulai);
        const today = new Date();
        
        // Cek jika libur sudah lewat
        if (startDate < today) {
            showToast('❌ Libur sudah lewat, tidak bisa kirim reminder', 'warning');
            return;
        }
        
        // Hitung hari menuju libur
        const diffTime = startDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let reminderMessage = '';
        if (diffDays === 0) {
            reminderMessage = `⏰ *REMINDER LIBUR HARI INI*\n\n${libur.karyawan} libur hari ini (${formatDateToDisplay(startDate)}). Mohon disiapkan penggantinya.`;
        } else if (diffDays === 1) {
            reminderMessage = `⏰ *REMINDER LIBUR BESOK*\n\n${libur.karyawan} akan libur besok (${formatDateToDisplay(startDate)}). Mohon disiapkan penggantinya.`;
        } else {
            reminderMessage = `⏰ *REMINDER LIBUR*\n\n${libur.karyawan} akan libur dalam ${diffDays} hari (${formatDateToDisplay(startDate)}). Mohon disiapkan penggantinya.`;
        }
        
        // Kirim ke group WhatsApp
        await sendCustomGroupMessage(libur.outlet, reminderMessage);
        
        showToast(`✅ Reminder dikirim ke group WA`, 'success');
        
    } catch (error) {
        console.error('Error sending reminder:', error);
        showToast('❌ Gagal mengirim reminder', 'error');
    }
}

// [22] Fungsi untuk kirim custom message ke group
async function sendCustomGroupMessage(outletName, message) {
    try {
        const WA_API_URL = 'https://waha-yetv8qi4e3zk.anakit.sumopod.my.id/api/sendText';
        const WA_API_KEY = 'sfcoGbpdLDkGZhKw2rx8sbb14vf4d8V6';
        
        // Ambil group_wa dari tabel outlet
        const { data: outletData, error } = await supabase
            .from('outlet')
            .select('group_wa')
            .eq('nama_outlet', outletName)
            .single();
        
        if (error || !outletData?.group_wa) {
            console.warn(`Group WA tidak ditemukan untuk outlet ${outletName}`);
            return;
        }
        
        const GROUP_CHAT_ID = outletData.group_wa;
        
        // Kirim ke group
        const response = await fetch(WA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': WA_API_KEY
            },
            body: JSON.stringify({
                session: 'Session1',
                chatId: GROUP_CHAT_ID,
                text: message
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        console.log(`📱 Custom message sent to group ${GROUP_CHAT_ID}`);
        
    } catch (error) {
        console.error('Error sending custom group message:', error);
    }
}

// [23] Load outlet dropdown untuk owner
async function loadOutletDropdownForLibur(liburData) {
    const select = document.getElementById('filterOutletOwnerLibur');
    if (!select) return;
    
    try {
        // Get distinct outlets dari data libur
        const outlets = [...new Set(liburData.map(r => r.outlet).filter(Boolean))];
        
        // Juga ambil dari tabel outlet untuk opsi lengkap
        const { data: allOutlets } = await supabase
            .from('outlet')
            .select('nama_outlet')
            .order('nama_outlet');
        
        const allOutletNames = allOutlets?.map(o => o.nama_outlet) || [];
        const uniqueOutlets = [...new Set([...outlets, ...allOutletNames])];
        
        select.innerHTML = `
            <option value="all">Semua Outlet</option>
            ${uniqueOutlets.map(outlet => `<option value="${outlet}">${outlet}</option>`).join('')}
        `;
        
    } catch (error) {
        console.error('Error loading outlets:', error);
    }
}

// [24] Helper function lainnya
function generateLiburId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `LIBUR-${timestamp}-${random}`.toUpperCase();
}

// [25] Fungsi toast notification
function showToast(message, type = 'info') {
    // Hapus toast sebelumnya jika ada
    const existingToast = document.getElementById('liburToast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Buat toast element
    const toast = document.createElement('div');
    toast.id = 'liburToast';
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

// [26] Global functions untuk window object
window.changeLiburMonth = changeLiburMonth;
window.showLiburDetail = showLiburDetail;
window.closeLiburDetailModal = closeLiburDetailModal;
window.cancelLiburRequest = cancelLiburRequest;
window.sendLiburReminder = sendLiburReminder;
window.approveLiburRequest = approveLiburRequest;
window.rejectLiburRequest = rejectLiburRequest;
window.loadKasirLiburHistory = loadKasirLiburHistory;

// ========== END OF FILE ==========
