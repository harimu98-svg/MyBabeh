// ========== MODULE TOP (Tools Ownership Program) ==========
// ========================================================

// Konfigurasi
const TOP_CONFIG = {
    SUBSIDI_PERCENT: 0.25,      // 25%
    MAX_HARGA: 500000,          // Rp 500.000
    MIN_PERIODE: 1,
    MAX_PERIODE: 24
};

// Variabel global
let currentKaryawanTOP = null;
let currentUserOutletTOP = null;
let isOwnerTOP = false;
let isKasirTOP = false;
let isBarbermanTOP = false;
let selectedPhotoFile = null;
let topBatchId = null;

// [1] Fungsi utama - tampilkan halaman TOP
async function showTOPPage() {
    try {
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
            .select('role, outlet, posisi')
            .eq('nama_karyawan', namaKaryawan)
            .single();
        
        if (!karyawanData) {
            alert('Data karyawan tidak ditemukan!');
            return;
        }
        
        currentKaryawanTOP = {
            nama_karyawan: namaKaryawan,
            role: karyawanData.role,
            outlet: karyawanData.outlet,
            posisi: karyawanData.posisi
        };
        
        currentUserOutletTOP = karyawanData.outlet;
        isOwnerTOP = karyawanData.role === 'owner';
        isKasirTOP = karyawanData.role === 'kasir';
        isBarbermanTOP = karyawanData.role === 'barberman';
        
        // Sembunyikan main app, tampilkan halaman TOP
        document.getElementById('appScreen').style.display = 'none';
        
        // Buat container halaman TOP
        createTOPPage();
        
        // Generate batch ID untuk pengajuan baru
        topBatchId = generateBatchId();
        
        // Load data berdasarkan role
        if (isOwnerTOP) {
            await loadTOPForOwner();
        } else if (isKasirTOP) {
            await loadTOPForKasir();
        } else {
            await loadMyTOPRiwayat();
        }
        
    } catch (error) {
        console.error('Error in showTOPPage:', error);
        alert('Gagal memuat halaman TOP!');
    }
}

// [2] Buat halaman TOP
function createTOPPage() {
    // Hapus halaman sebelumnya
    const existingPage = document.getElementById('topPage');
    if (existingPage) existingPage.remove();
    
    // Buat container
    const topPage = document.createElement('div');
    topPage.id = 'topPage';
    topPage.className = 'top-page';
    
    topPage.innerHTML = `
        <!-- Header -->
        <header class="top-header">
            <button class="back-btn" id="backToMainFromTOP">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h2><i class="fas fa-tools"></i> Tools Ownership Program (TOP)</h2>
            <div class="header-actions">
                <button class="refresh-btn" id="refreshTOP" title="Refresh">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
        </header>
        
        <!-- Info Header -->
        <div class="top-info-header">
            <div class="info-row">
                <div class="info-item">
                    <i class="fas fa-calendar-day"></i>
                    <span id="currentDateTOP">${formatDateDisplay(new Date())}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-user"></i>
                    <span id="userNameTOP">${currentKaryawanTOP?.nama_karyawan || '-'}</span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-item">
                    <i class="fas fa-briefcase"></i>
                    <span id="userPositionTOP">${currentKaryawanTOP?.posisi || '-'}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-store"></i>
                    <span id="userOutletTOP">${currentUserOutletTOP || '-'}</span>
                </div>
            </div>
        </div>
        
        <!-- Konten berdasarkan Role -->
        ${isBarbermanTOP ? createBarbermanTOPContent() : ''}
        ${isOwnerTOP ? createOwnerTOPContent() : ''}
        ${isKasirTOP ? createKasirTOPContent() : ''}
        
        <!-- Footer -->
        <div class="top-footer">
            <p><i class="fas fa-info-circle"></i> ${getTOPFooterMessage()}</p>
        </div>
        
        <!-- Modal Preview Foto -->
        <div id="photoPreviewModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Preview Foto Alat</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <img id="previewImage" src="" alt="Preview Foto">
                    <div class="preview-actions">
                        <button id="changePhotoBtn" class="btn-secondary">
                            <i class="fas fa-sync"></i> Ganti Foto
                        </button>
                        <button id="usePhotoBtn" class="btn-primary">
                            <i class="fas fa-check"></i> Gunakan Foto Ini
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modal Detail Cicilan -->
        <div id="cicilanDetailModal" class="modal">
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>Detail Pembayaran Cicilan</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="cicilanDetailContent"></div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(topPage);
    setupTOPEvents();
}

// [3] Buat konten untuk Barberman
function createBarbermanTOPContent() {
    return `
        <div class="top-section-container">
            <!-- Form Pengajuan -->
            <div class="top-form-section">
                <div class="section-header">
                    <h3><i class="fas fa-plus-circle"></i> Pengajuan Alat Baru</h3>
                </div>
                <div class="form-container">
                    <form id="topForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="namaAlat"><i class="fas fa-toolbox"></i> Nama Alat</label>
                                <input type="text" id="namaAlat" placeholder="Contoh: Hair Clipper Philips" required>
                            </div>
                            <div class="form-group">
                                <label for="hargaAlat"><i class="fas fa-tag"></i> Harga Alat (Maks Rp ${TOP_CONFIG.MAX_HARGA.toLocaleString('id-ID')})</label>
                                <input type="number" id="hargaAlat" min="1000" max="${TOP_CONFIG.MAX_HARGA}" step="500" placeholder="Contoh: 350000" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="periodeCicilan"><i class="fas fa-calendar-alt"></i> Periode Cicilan (1-24)</label>
                                <select id="periodeCicilan" required>
                                    <option value="">Pilih periode...</option>
                                    ${Array.from({length: TOP_CONFIG.MAX_PERIODE}, (_, i) => 
                                        `<option value="${i+1}">${i+1} bulan</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="fotoAlat"><i class="fas fa-camera"></i> Foto Alat</label>
                                <div class="file-upload-area" id="uploadArea">
                                    <i class="fas fa-cloud-upload-alt"></i>
                                    <p>Klik untuk upload foto alat</p>
                                    <p class="file-hint">Format: JPG, PNG (Maks 5MB)</p>
                                    <input type="file" id="fotoAlat" accept="image/*" hidden>
                                </div>
                                <div id="photoPreview" class="photo-preview" style="display: none;">
                                    <img id="previewThumbnail" src="" alt="Preview">
                                    <button type="button" id="removePhotoBtn" class="btn-remove">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Auto Calculation -->
                        <div class="calculation-section">
                            <h4><i class="fas fa-calculator"></i> Perhitungan Cicilan</h4>
                            <div class="calculation-grid">
                                <div class="calc-item">
                                    <span class="calc-label">Harga Alat:</span>
                                    <span id="calcHarga" class="calc-value">Rp 0</span>
                                </div>
                                <div class="calc-item">
                                    <span class="calc-label">Subsidi (25%):</span>
                                    <span id="calcSubsidi" class="calc-value">Rp 0</span>
                                </div>
                                <div class="calc-item">
                                    <span class="calc-label">Total Cicilan:</span>
                                    <span id="calcTotalCicilan" class="calc-value highlight">Rp 0</span>
                                </div>
                                <div class="calc-item">
                                    <span class="calc-label">Cicilan per Bulan:</span>
                                    <span id="calcPerBulan" class="calc-value highlight">Rp 0</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" id="resetFormBtn" class="btn-secondary">
                                <i class="fas fa-redo"></i> Reset
                            </button>
                            <button type="submit" id="submitTOPBtn" class="btn-primary" disabled>
                                <i class="fas fa-paper-plane"></i> Ajukan TOP
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- Riwayat Pengajuan -->
            <div class="top-history-section">
                <div class="section-header">
                    <h3><i class="fas fa-history"></i> Riwayat Pengajuan TOP</h3>
                    <button class="btn-refresh" onclick="loadMyTOPRiwayat()">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
                <div class="history-container">
                    <div class="loading" id="loadingHistory">Memuat riwayat...</div>
                    <div class="table-responsive">
                        <table class="top-history-table" id="topHistoryTable" style="display: none;">
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Nama Alat</th>
                                    <th>Harga</th>
                                    <th>Periode</th>
                                    <th>Cicilan/Bulan</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="topHistoryBody">
                                <!-- Data akan diisi -->
                            </tbody>
                        </table>
                    </div>
                    <div class="no-data" id="noHistoryData" style="display: none;">
                        <i class="fas fa-inbox"></i>
                        <p>Belum ada pengajuan TOP</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// [4] Buat konten untuk Owner
function createOwnerTOPContent() {
    return `
        <div class="owner-top-section">
            <!-- Filter -->
            <div class="owner-filter-section">
                <div class="filter-row">
                    <div class="filter-group">
                        <label for="filterOutletOwnerTOP"><i class="fas fa-store"></i> Outlet:</label>
                        <select id="filterOutletOwnerTOP" class="outlet-select">
                            <option value="all">Semua Outlet</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="filterStatusOwnerTOP"><i class="fas fa-filter"></i> Status:</label>
                        <select id="filterStatusOwnerTOP" class="status-select">
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="all">Semua Status</option>
                        </select>
                    </div>
                    <button class="btn-apply-filter" onclick="loadTOPForOwner()">
                        <i class="fas fa-filter"></i> Terapkan
                    </button>
                </div>
            </div>
            
            <!-- Daftar Pending -->
            <div class="pending-top-section">
                <div class="section-header">
                    <h3><i class="fas fa-clock"></i> Pengajuan Menunggu Approval</h3>
                    <div class="request-stats">
                        <span id="pendingCountTOP">0 pengajuan</span>
                    </div>
                </div>
                <div class="pending-container">
                    <div class="loading" id="loadingPending">Memuat data...</div>
                    <div id="pendingTOPList" class="pending-list">
                        <!-- Data akan diisi -->
                    </div>
                </div>
            </div>
            
            <!-- Riwayat Semua TOP -->
            <div class="top-history-section">
                <div class="section-header">
                    <h3><i class="fas fa-history"></i> Riwayat Semua TOP</h3>
                </div>
                <div class="history-container">
                    <div class="loading" id="loadingAllHistory">Memuat riwayat...</div>
                    <div class="table-responsive">
                        <table class="top-history-table" id="allHistoryTable" style="display: none;">
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Outlet</th>
                                    <th>Karyawan</th>
                                    <th>Alat</th>
                                    <th>Harga</th>
                                    <th>Periode</th>
                                    <th>Status</th>
                                    <th>Progress</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="allHistoryBody">
                                <!-- Data akan diisi -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// [5] Buat konten untuk Kasir
function createKasirTOPContent() {
    return `
        <div class="kasir-top-section">
            <!-- Daftar TOP untuk Pembayaran -->
            <div class="top-payment-section">
                <div class="section-header">
                    <h3><i class="fas fa-credit-card"></i> Pembayaran Cicilan TOP</h3>
                    <div class="section-info">
                        <span id="activeTopCount">0 TOP aktif</span>
                    </div>
                </div>
                <div class="payment-container">
                    <div class="loading" id="loadingPayment">Memuat data TOP...</div>
                    <div id="topPaymentList" class="payment-list">
                        <!-- Data akan diisi -->
                    </div>
                </div>
            </div>
            
            <!-- Riwayat Pembayaran -->
            <div class="payment-history-section">
                <div class="section-header">
                    <h3><i class="fas fa-receipt"></i> Riwayat Pembayaran</h3>
                    <button class="btn-refresh" onclick="loadTOPForKasir()">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
                <div class="history-container">
                    <div class="loading" id="loadingPaymentHistory">Memuat riwayat...</div>
                    <div class="table-responsive">
                        <table class="payment-history-table" id="paymentHistoryTable" style="display: none;">
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Barberman</th>
                                    <th>Alat</th>
                                    <th>Cicilan ke</th>
                                    <th>Jumlah</th>
                                    <th>Penerima</th>
                                    <th>Sisa</th>
                                </tr>
                            </thead>
                            <tbody id="paymentHistoryBody">
                                <!-- Data akan diisi -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Modal Pembayaran -->
            <div id="paymentModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Pembayaran Cicilan</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div id="paymentInfo"></div>
                        <form id="paymentForm">
                            <div class="form-group">
                                <label for="cicilanKe"><i class="fas fa-list-ol"></i> Bayar Cicilan ke-</label>
                                <input type="number" id="cicilanKe" min="1" required>
                                <small>Masukkan cicilan yang akan dibayar</small>
                            </div>
                            <div class="form-group">
                                <label for="jumlahCicilan"><i class="fas fa-money-bill-wave"></i> Jumlah Cicilan yang Dibayar</label>
                                <input type="number" id="jumlahCicilan" min="1" required>
                                <small>Bisa bayar lebih dari 1 cicilan sekaligus</small>
                            </div>
                            <div class="form-group">
                                <label for="jumlahBayar"><i class="fas fa-calculator"></i> Total Bayar</label>
                                <input type="text" id="jumlahBayar" readonly>
                            </div>
                            <div class="form-group">
                                <label for="metodeBayar"><i class="fas fa-wallet"></i> Metode Pembayaran</label>
                                <select id="metodeBayar">
                                    <option value="cash">Cash</option>
                                    <option value="transfer">Transfer</option>
                                </select>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn-secondary modal-close">Batal</button>
                                <button type="submit" class="btn-primary">Proses Pembayaran</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// [6] Setup Events
function setupTOPEvents() {
    // Tombol kembali
    document.getElementById('backToMainFromTOP').addEventListener('click', () => {
        document.getElementById('topPage').remove();
        document.getElementById('appScreen').style.display = 'block';
    });
    
    // Tombol refresh
    document.getElementById('refreshTOP').addEventListener('click', async () => {
        if (isOwnerTOP) {
            await loadTOPForOwner();
        } else if (isKasirTOP) {
            await loadTOPForKasir();
        } else {
            await loadMyTOPRiwayat();
        }
    });
    
    // Setup events berdasarkan role
    if (isBarbermanTOP) {
        setupBarbermanEvents();
    } else if (isOwnerTOP) {
        setupOwnerEvents();
    } else if (isKasirTOP) {
        setupKasirEvents();
    }
}

// [7] Setup events untuk Barberman
function setupBarbermanEvents() {
    const form = document.getElementById('topForm');
    const hargaInput = document.getElementById('hargaAlat');
    const periodeSelect = document.getElementById('periodeCicilan');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fotoAlat');
    const previewArea = document.getElementById('photoPreview');
    const submitBtn = document.getElementById('submitTOPBtn');
    
    // Auto calculate saat harga/periode berubah
    hargaInput.addEventListener('input', calculateTOP);
    periodeSelect.addEventListener('change', calculateTOP);
    
    // File upload
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handlePhotoUpload);
    
    // Form submission
    form.addEventListener('submit', handleTOPSubmission);
    
    // Reset form
    document.getElementById('resetFormBtn').addEventListener('click', resetTOPForm);
    
    // Remove photo
    document.getElementById('removePhotoBtn')?.addEventListener('click', () => {
        selectedPhotoFile = null;
        previewArea.style.display = 'none';
        uploadArea.style.display = 'block';
        fileInput.value = '';
    });
    
    // Initial calculation
    calculateTOP();
}

// [8] Handle photo upload
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validasi file
    if (!file.type.startsWith('image/')) {
        alert('Hanya file gambar yang diizinkan!');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB!');
        return;
    }
    
    selectedPhotoFile = file;
    
    // Preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('previewThumbnail');
        preview.src = e.target.result;
        
        document.getElementById('photoPreview').style.display = 'block';
        document.getElementById('uploadArea').style.display = 'none';
        
        // Show preview modal
        showPhotoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
}

// [9] Show photo preview modal
function showPhotoPreview(imageSrc) {
    const modal = document.getElementById('photoPreviewModal');
    const img = document.getElementById('previewImage');
    img.src = imageSrc;
    
    modal.style.display = 'block';
    
    // Close buttons
    modal.querySelectorAll('.modal-close').forEach(btn => {
        btn.onclick = () => modal.style.display = 'none';
    });
    
    // Change photo button
    document.getElementById('changePhotoBtn').onclick = () => {
        modal.style.display = 'none';
        document.getElementById('fotoAlat').click();
    };
    
    // Use photo button
    document.getElementById('usePhotoBtn').onclick = () => {
        modal.style.display = 'none';
    };
}

// [10] Calculate TOP values
function calculateTOP() {
    const harga = parseFloat(document.getElementById('hargaAlat').value) || 0;
    const periode = parseInt(document.getElementById('periodeCicilan').value) || 0;
    const submitBtn = document.getElementById('submitTOPBtn');
    
    // Validasi harga maksimal
    if (harga > TOP_CONFIG.MAX_HARGA) {
        document.getElementById('hargaAlat').value = TOP_CONFIG.MAX_HARGA;
        alert(`Harga maksimal Rp ${TOP_CONFIG.MAX_HARGA.toLocaleString('id-ID')}`);
        return calculateTOP();
    }
    
    // Hitung
    const subsidi = harga * TOP_CONFIG.SUBSIDI_PERCENT;
    const totalCicilan = harga - subsidi;
    const cicilanPerBulan = periode > 0 ? totalCicilan / periode : 0;
    
    // Update display
    document.getElementById('calcHarga').textContent = formatRupiah(harga);
    document.getElementById('calcSubsidi').textContent = formatRupiah(subsidi);
    document.getElementById('calcTotalCicilan').textContent = formatRupiah(totalCicilan);
    document.getElementById('calcPerBulan').textContent = formatRupiah(cicilanPerBulan);
    
    // Enable/disable submit button
    const namaAlat = document.getElementById('namaAlat').value.trim();
    const isFormValid = namaAlat && harga >= 1000 && periode >= 1 && periode <= 24 && selectedPhotoFile;
    submitBtn.disabled = !isFormValid;
}

// [11] Reset form
function resetTOPForm() {
    document.getElementById('topForm').reset();
    selectedPhotoFile = null;
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('uploadArea').style.display = 'block';
    calculateTOP();
}

// [12] Handle TOP submission
async function handleTOPSubmission(event) {
    event.preventDefault();
    
    const namaAlat = document.getElementById('namaAlat').value.trim();
    const hargaAlat = parseFloat(document.getElementById('hargaAlat').value);
    const periodeCicilan = parseInt(document.getElementById('periodeCicilan').value);
    
    // Validasi
    if (hargaAlat > TOP_CONFIG.MAX_HARGA) {
        alert(`Harga maksimal Rp ${TOP_CONFIG.MAX_HARGA.toLocaleString('id-ID')}`);
        return;
    }
    
    if (!selectedPhotoFile) {
        alert('Harap upload foto alat!');
        return;
    }
    
    const submitBtn = document.getElementById('submitTOPBtn');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Disable button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengupload...';
        
        // 1. Upload foto ke Supabase Storage
        const fileName = `top_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('top_photos')
            .upload(fileName, selectedPhotoFile);
        
        if (uploadError) throw uploadError;
        
        // 2. Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('top_photos')
            .getPublicUrl(fileName);
        
        // 3. Calculate values
        const subsidi = hargaAlat * TOP_CONFIG.SUBSIDI_PERCENT;
        const totalCicilan = hargaAlat - subsidi;
        const cicilanPerBulan = totalCicilan / periodeCicilan;
        
        // 4. Insert ke database
        const { data, error } = await supabase
            .from('top_program')
            .insert([{
                batch_id: topBatchId,
                karyawan: currentKaryawanTOP.nama_karyawan,
                outlet: currentUserOutletTOP,
                nama_alat: namaAlat,
                harga_alat: hargaAlat,
                foto_url: publicUrl,
                periode_cicilan: periodeCicilan,
                subsidi: subsidi,
                total_cicilan: totalCicilan,
                cicilan_per_periode: cicilanPerBulan,
                status: 'pending',
                sisa_cicilan: totalCicilan,
                pembayaran: [],
                created_at: new Date().toISOString()
            }]);
        
        if (error) throw error;
        
        // Success
        alert('✅ Pengajuan TOP berhasil dikirim!');
        
        // Reset form dan reload data
        resetTOPForm();
        topBatchId = generateBatchId();
        await loadMyTOPRiwayat();
        
    } catch (error) {
        console.error('Error submitting TOP:', error);
        alert(`❌ Gagal mengajukan TOP: ${error.message}`);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// [13] Load riwayat untuk Barberman
async function loadMyTOPRiwayat() {
    try {
        const loadingEl = document.getElementById('loadingHistory');
        const tableEl = document.getElementById('topHistoryTable');
        const noDataEl = document.getElementById('noHistoryData');
        
        if (loadingEl) loadingEl.style.display = 'block';
        if (tableEl) tableEl.style.display = 'none';
        if (noDataEl) noDataEl.style.display = 'none';
        
        const { data: topList, error } = await supabase
            .from('top_program')
            .select('*')
            .eq('karyawan', currentKaryawanTOP.nama_karyawan)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        displayMyTOPRiwayat(topList || []);
        
    } catch (error) {
        console.error('Error loading TOP riwayat:', error);
        const tbody = document.getElementById('topHistoryBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="error">Gagal memuat data</td></tr>`;
        }
    } finally {
        const loadingEl = document.getElementById('loadingHistory');
        if (loadingEl) loadingEl.style.display = 'none';
    }
}

// [14] Display riwayat Barberman
function displayMyTOPRiwayat(topList) {
    const tbody = document.getElementById('topHistoryBody');
    const tableEl = document.getElementById('topHistoryTable');
    const noDataEl = document.getElementById('noHistoryData');
    
    if (!tbody) return;
    
    if (!topList || topList.length === 0) {
        tableEl.style.display = 'none';
        noDataEl.style.display = 'block';
        tbody.innerHTML = '';
        return;
    }
    
    let html = '';
    
    topList.forEach((top, index) => {
        const createdDate = new Date(top.created_at);
        const progress = calculateProgress(top);
        
        html += `
            <tr>
                <td>${formatDate(createdDate)}</td>
                <td>
                    <div class="item-name">${top.nama_alat}</div>
                    ${top.foto_url ? `<small><a href="${top.foto_url}" target="_blank">Lihat foto</a></small>` : ''}
                </td>
                <td>${formatRupiah(top.harga_alat)}</td>
                <td>${top.periode_cicilan} bulan</td>
                <td>${formatRupiah(top.cicilan_per_periode)}</td>
                <td>
                    <span class="status-pill ${getTOPStatusClass(top.status)}">
                        ${getTOPStatusText(top)}
                    </span>
                    ${top.status !== 'pending' && top.status !== 'rejected' ? `
                        <div class="progress-small">
                            <div class="progress-bar" style="width: ${progress.percentage}%"></div>
                            <span>${progress.text}</span>
                        </div>
                    ` : ''}
                </td>
                <td>
                    <button class="btn-action" onclick="showTOPDetail('${top.id}')" title="Detail">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${top.status === 'pending' ? `
                        <button class="btn-action btn-cancel" onclick="cancelTOP('${top.id}')" title="Batalkan">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    tableEl.style.display = 'table';
    noDataEl.style.display = 'none';
}

// [15] Load data untuk Owner
async function loadTOPForOwner() {
    try {
        // Tampilkan loading
        const loadingPending = document.getElementById('loadingPending');
        const loadingAll = document.getElementById('loadingAllHistory');
        
        if (loadingPending) loadingPending.style.display = 'block';
        if (loadingAll) loadingAll.style.display = 'block';
        
        // Get filter values
        const outletFilter = document.getElementById('filterOutletOwnerTOP')?.value || 'all';
        const statusFilter = document.getElementById('filterStatusOwnerTOP')?.value || 'pending';
        
        // Build query
        let query = supabase
            .from('top_program')
            .select('*')
            .order('created_at', { ascending: false });
        
        // Apply filters
        if (outletFilter !== 'all') {
            query = query.eq('outlet', outletFilter);
        }
        
        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }
        
        const { data: topList, error } = await query;
        
        if (error) throw error;
        
        // Display data
        displayPendingTOP(topList || []);
        displayAllTOPRiwayat(topList || []);
        
        // Load outlet options
        await loadOutletDropdownForTOP(topList || []);
        
    } catch (error) {
        console.error('Error loading TOP for owner:', error);
        alert('Gagal memuat data TOP: ' + error.message);
    } finally {
        // Hide loading
        const loadingPending = document.getElementById('loadingPending');
        const loadingAll = document.getElementById('loadingAllHistory');
        
        if (loadingPending) loadingPending.style.display = 'none';
        if (loadingAll) loadingAll.style.display = 'none';
    }
}

// [16] Display pending TOP untuk Owner
function displayPendingTOP(topList) {
    const container = document.getElementById('pendingTOPList');
    const countEl = document.getElementById('pendingCountTOP');
    
    if (!container) return;
    
    const pendingList = topList.filter(top => top.status === 'pending');
    
    if (countEl) {
        countEl.textContent = `${pendingList.length} pengajuan pending`;
    }
    
    if (pendingList.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h4>Tidak ada pengajuan pending</h4>
                <p>Semua pengajuan sudah diproses</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    pendingList.forEach(top => {
        const createdDate = new Date(top.created_at);
        
        html += `
            <div class="pending-card" data-top-id="${top.id}">
                <div class="card-header">
                    <div class="card-title">
                        <h4>${top.nama_alat}</h4>
                        <span class="card-date">${formatDate(createdDate)}</span>
                    </div>
                    <div class="card-outlet">
                        <i class="fas fa-store"></i> ${top.outlet}
                    </div>
                </div>
                
                <div class="card-body">
                    <div class="card-info">
                        <div class="info-item">
                            <i class="fas fa-user"></i>
                            <span>${top.karyawan}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-tag"></i>
                            <span>${formatRupiah(top.harga_alat)}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${top.periode_cicilan} bulan</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-money-bill-wave"></i>
                            <span>${formatRupiah(top.cicilan_per_periode)}/bulan</span>
                        </div>
                    </div>
                    
                    ${top.foto_url ? `
                        <div class="card-photo">
                            <img src="${top.foto_url}" alt="Foto Alat" onclick="previewImage('${top.foto_url}')">
                        </div>
                    ` : ''}
                    
                    <div class="card-calc">
                        <h5>Perhitungan:</h5>
                        <div class="calc-grid">
                            <div class="calc-item">
                                <span>Harga:</span>
                                <span>${formatRupiah(top.harga_alat)}</span>
                            </div>
                            <div class="calc-item">
                                <span>Subsidi (25%):</span>
                                <span>${formatRupiah(top.subsidi)}</span>
                            </div>
                            <div class="calc-item">
                                <span>Total Cicilan:</span>
                                <span class="highlight">${formatRupiah(top.total_cicilan)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card-actions">
                    <button class="btn-approve" onclick="approveTOP('${top.id}')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn-reject" onclick="rejectTOP('${top.id}')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                    <button class="btn-view" onclick="showTOPDetail('${top.id}')">
                        <i class="fas fa-eye"></i> Detail
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// [17] Approve TOP
async function approveTOP(topId) {
    const note = prompt('Masukkan catatan approval (opsional):');
    
    if (note === null) return; // User cancelled
    
    try {
        const { error } = await supabase
            .from('top_program')
            .update({
                status: 'approved',
                approved_by: currentKaryawanTOP.nama_karyawan,
                approved_at: new Date().toISOString(),
                approve_note: note || null
            })
            .eq('id', topId);
        
        if (error) throw error;
        
        alert('TOP berhasil diapprove!');
        await loadTOPForOwner();
        
    } catch (error) {
        console.error('Error approving TOP:', error);
        alert('Gagal approve TOP: ' + error.message);
    }
}

// [18] Reject TOP
async function rejectTOP(topId) {
    const note = prompt('Masukkan alasan penolakan:');
    
    if (note === null) return;
    
    if (!note.trim()) {
        alert('Harap masukkan alasan penolakan');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('top_program')
            .update({
                status: 'rejected',
                approved_by: currentKaryawanTOP.nama_karyawan,
                approved_at: new Date().toISOString(),
                reject_note: note
            })
            .eq('id', topId);
        
        if (error) throw error;
        
        alert('TOP ditolak!');
        await loadTOPForOwner();
        
    } catch (error) {
        console.error('Error rejecting TOP:', error);
        alert('Gagal reject TOP: ' + error.message);
    }
}

// [19] Load data untuk Kasir
async function loadTOPForKasir() {
    try {
        const loadingPayment = document.getElementById('loadingPayment');
        const loadingHistory = document.getElementById('loadingPaymentHistory');
        
        if (loadingPayment) loadingPayment.style.display = 'block';
        if (loadingHistory) loadingHistory.style.display = 'block';
        
        // Get TOP yang approved untuk outlet yang sama dengan kasir
        const { data: topList, error } = await supabase
            .from('top_program')
            .select('*')
            .eq('outlet', currentUserOutletTOP)
            .in('status', ['approved', 'cicilan_1', 'cicilan_2', 'cicilan_3', 'cicilan_4', 'cicilan_5', 'cicilan_6', 'cicilan_7', 'cicilan_8', 'cicilan_9', 'cicilan_10', 'cicilan_11', 'cicilan_12', 'cicilan_13', 'cicilan_14', 'cicilan_15', 'cicilan_16', 'cicilan_17', 'cicilan_18', 'cicilan_19', 'cicilan_20', 'cicilan_21', 'cicilan_22', 'cicilan_23'])
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Filter hanya yang belum lunas
        const activeTOP = (topList || []).filter(top => top.status !== 'lunas');
        
        // Display
        displayTOPForPayment(activeTOP);
        displayPaymentHistory(activeTOP);
        
    } catch (error) {
        console.error('Error loading TOP for kasir:', error);
        alert('Gagal memuat data TOP: ' + error.message);
    } finally {
        const loadingPayment = document.getElementById('loadingPayment');
        const loadingHistory = document.getElementById('loadingPaymentHistory');
        
        if (loadingPayment) loadingPayment.style.display = 'none';
        if (loadingHistory) loadingHistory.style.display = 'none';
    }
}

// [20] Display TOP untuk pembayaran (Kasir)
function displayTOPForPayment(topList) {
    const container = document.getElementById('topPaymentList');
    const countEl = document.getElementById('activeTopCount');
    
    if (!container) return;
    
    if (countEl) {
        countEl.textContent = `${topList.length} TOP aktif`;
    }
    
    if (topList.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h4>Tidak ada TOP aktif</h4>
                <p>Semua TOP sudah lunas</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    topList.forEach(top => {
        const progress = calculateProgress(top);
        const nextCicilan = getNextCicilan(top);
        
        html += `
            <div class="payment-card" data-top-id="${top.id}">
                <div class="payment-header">
                    <div class="payment-title">
                        <h4>${top.nama_alat}</h4>
                        <div class="payment-subtitle">
                            <span class="barberman-name">
                                <i class="fas fa-user"></i> ${top.karyawan}
                            </span>
                            <span class="payment-status ${getTOPStatusClass(top.status)}">
                                ${getTOPStatusText(top)}
                            </span>
                        </div>
                    </div>
                    <button class="btn-pay" onclick="showPaymentForm('${top.id}')">
                        <i class="fas fa-credit-card"></i> Bayar Cicilan
                    </button>
                </div>
                
                <div class="payment-body">
                    <div class="payment-info">
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Harga Alat:</label>
                                <span>${formatRupiah(top.harga_alat)}</span>
                            </div>
                            <div class="info-item">
                                <label>Subsidi 25%:</label>
                                <span>${formatRupiah(top.subsidi)}</span>
                            </div>
                            <div class="info-item">
                                <label>Total Cicilan:</label>
                                <span>${formatRupiah(top.total_cicilan)}</span>
                            </div>
                            <div class="info-item">
                                <label>Cicilan/Bulan:</label>
                                <span class="highlight">${formatRupiah(top.cicilan_per_periode)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="payment-progress">
                        <div class="progress-header">
                            <h5>Progress Cicilan</h5>
                            <button class="btn-view-detail" onclick="showCicilanDetail('${top.id}')">
                                <i class="fas fa-list"></i> Lihat Detail
                            </button>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${progress.percentage}%"></div>
                            <div class="progress-text">${progress.text}</div>
                        </div>
                        <div class="progress-info">
                            <div class="progress-item">
                                <span>Sudah Dibayar:</span>
                                <span class="paid">${formatRupiah(top.total_dibayar || 0)}</span>
                            </div>
                            <div class="progress-item">
                                <span>Sisa Cicilan:</span>
                                <span class="remaining">${formatRupiah(top.sisa_cicilan || top.total_cicilan)}</span>
                            </div>
                            ${nextCicilan > 0 ? `
                                <div class="progress-item">
                                    <span>Cicilan Berikutnya:</span>
                                    <span class="next">Cicilan ke-${nextCicilan} (${formatRupiah(top.cicilan_per_periode)})</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// [21] Show payment form (Kasir)
async function showPaymentForm(topId) {
    try {
        // Get TOP data
        const { data: top, error } = await supabase
            .from('top_program')
            .select('*')
            .eq('id', topId)
            .single();
        
        if (error) throw error;
        
        const modal = document.getElementById('paymentModal');
        const paymentInfo = document.getElementById('paymentInfo');
        const cicilanKeInput = document.getElementById('cicilanKe');
        const jumlahCicilanInput = document.getElementById('jumlahCicilan');
        const jumlahBayarInput = document.getElementById('jumlahBayar');
        
        // Calculate next cicilan
        const nextCicilan = getNextCicilan(top);
        const maxCicilan = top.periode_cicilan - (nextCicilan - 1);
        
        // Set payment info
        paymentInfo.innerHTML = `
            <div class="payment-summary">
                <h4>${top.nama_alat}</h4>
                <p><i class="fas fa-user"></i> ${top.karyawan}</p>
                <div class="summary-grid">
                    <div class="summary-item">
                        <span>Cicilan per Bulan:</span>
                        <strong>${formatRupiah(top.cicilan_per_periode)}</strong>
                    </div>
                    <div class="summary-item">
                        <span>Sudah Dibayar:</span>
                        <strong>${formatRupiah(top.total_dibayar || 0)}</strong>
                    </div>
                    <div class="summary-item">
                        <span>Sisa Cicilan:</span>
                        <strong>${formatRupiah(top.sisa_cicilan || top.total_cicilan)}</strong>
                    </div>
                    <div class="summary-item">
                        <span>Cicilan Berikutnya:</span>
                        <strong class="highlight">Cicilan ke-${nextCicilan}</strong>
                    </div>
                </div>
            </div>
        `;
        
        // Set form values
        cicilanKeInput.value = nextCicilan;
        cicilanKeInput.min = nextCicilan;
        cicilanKeInput.max = top.periode_cicilan;
        
        jumlahCicilanInput.value = 1;
        jumlahCicilanInput.min = 1;
        jumlahCicilanInput.max = maxCicilan;
        
        // Calculate total
        calculatePaymentTotal();
        
        // Setup form submission
        const form = document.getElementById('paymentForm');
        form.onsubmit = async (e) => {
            e.preventDefault();
            await processPayment(topId, top);
        };
        
        // Show modal
        modal.style.display = 'block';
        
        // Setup close buttons
        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.onclick = () => modal.style.display = 'none';
        });
        
        // Auto calculate on input change
        cicilanKeInput.addEventListener('input', calculatePaymentTotal);
        jumlahCicilanInput.addEventListener('input', calculatePaymentTotal);
        
    } catch (error) {
        console.error('Error showing payment form:', error);
        alert('Gagal memuat data pembayaran');
    }
}

// [22] Calculate payment total
function calculatePaymentTotal() {
    const cicilanKe = parseInt(document.getElementById('cicilanKe').value) || 1;
    const jumlahCicilan = parseInt(document.getElementById('jumlahCicilan').value) || 1;
    
    // In actual implementation, get cicilan_per_periode from data
    // For now, we'll use a placeholder
    const cicilanPerPeriode = 15000; // This should come from actual data
    
    const totalBayar = cicilanPerPeriode * jumlahCicilan;
    document.getElementById('jumlahBayar').value = formatRupiah(totalBayar);
}

// [23] Process payment
async function processPayment(topId, topData) {
    try {
        const cicilanKe = parseInt(document.getElementById('cicilanKe').value);
        const jumlahCicilan = parseInt(document.getElementById('jumlahCicilan').value);
        const metodeBayar = document.getElementById('metodeBayar').value;
        
        if (jumlahCicilan < 1) {
            alert('Jumlah cicilan minimal 1');
            return;
        }
        
        // Calculate payment details
        const jumlahBayar = topData.cicilan_per_periode * jumlahCicilan;
        const cicilanTerakhir = cicilanKe + jumlahCicilan - 1;
        
        // Create payment records
        const pembayaranBaru = [];
        for (let i = cicilanKe; i <= cicilanTerakhir; i++) {
            pembayaranBaru.push({
                cicilan_ke: i,
                tanggal_bayar: new Date().toISOString(),
                jumlah_bayar: topData.cicilan_per_periode,
                penerima: currentKaryawanTOP.nama_karyawan,
                metode_bayar: metodeBayar
            });
        }
        
        // Get existing payments
        const existingPayments = topData.pembayaran || [];
        const allPayments = [...existingPayments, ...pembayaranBaru];
        
        // Calculate totals
        const totalDibayar = allPayments.reduce((sum, p) => sum + p.jumlah_bayar, 0);
        const sisaCicilan = topData.total_cicilan - totalDibayar;
        
        // Determine new status
        let newStatus;
        if (sisaCicilan <= 0) {
            newStatus = 'lunas';
        } else {
            newStatus = `cicilan_${cicilanTerakhir}`;
        }
        
        // Update database
        const { error } = await supabase
            .from('top_program')
            .update({
                pembayaran: allPayments,
                total_dibayar: totalDibayar,
                sisa_cicilan: sisaCicilan,
                status: newStatus
            })
            .eq('id', topId);
        
        if (error) throw error;
        
        // Close modal and refresh
        document.getElementById('paymentModal').style.display = 'none';
        alert(`✅ Pembayaran berhasil! Cicilan ke-${cicilanKe}-${cicilanTerakhir}`);
        await loadTOPForKasir();
        
    } catch (error) {
        console.error('Error processing payment:', error);
        alert('❌ Gagal memproses pembayaran: ' + error.message);
    }
}

// [24] Helper functions
function generateBatchId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 6);
    return `TOP-${timestamp}-${random}`.toUpperCase();
}

function formatDate(date) {
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function formatDateDisplay(date) {
    return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatRupiah(amount) {
    if (!amount && amount !== 0) return 'Rp 0';
    return 'Rp ' + amount.toLocaleString('id-ID');
}

function getTOPStatusClass(status) {
    switch (status) {
        case 'pending': return 'status-pending';
        case 'approved': return 'status-approved';
        case 'rejected': return 'status-rejected';
        case 'lunas': return 'status-lunas';
        default:
            if (status.startsWith('cicilan_')) return 'status-inprogress';
            return 'status-unknown';
    }
}

function getTOPStatusText(top) {
    if (top.status === 'lunas') return 'LUNAS';
    if (top.status === 'pending') return 'Menunggu';
    if (top.status === 'approved') return 'Disetujui';
    if (top.status === 'rejected') return 'Ditolak';
    if (top.status.startsWith('cicilan_')) {
        const cicilanKe = parseInt(top.status.split('_')[1]) || 0;
        return `Cicilan ke-${cicilanKe}`;
    }
    return top.status;
}

function calculateProgress(top) {
    if (top.status === 'pending' || top.status === 'rejected') {
        return { percentage: 0, text: 'Belum mulai' };
    }
    
    if (top.status === 'approved') {
        return { percentage: 0, text: 'Belum mulai cicilan' };
    }
    
    if (top.status === 'lunas') {
        return { percentage: 100, text: 'LUNAS 100%' };
    }
    
    if (top.status.startsWith('cicilan_')) {
        const cicilanKe = parseInt(top.status.split('_')[1]) || 0;
        const percentage = (cicilanKe / top.periode_cicilan) * 100;
        return {
            percentage: percentage,
            text: `${cicilanKe}/${top.periode_cicilan} cicilan (${Math.round(percentage)}%)`
        };
    }
    
    return { percentage: 0, text: 'Unknown' };
}

function getNextCicilan(top) {
    if (top.status === 'approved') return 1;
    if (top.status.startsWith('cicilan_')) {
        const current = parseInt(top.status.split('_')[1]) || 0;
        return current + 1;
    }
    return 0;
}

function getTOPFooterMessage() {
    if (isBarbermanTOP) return 'Ajukan alat baru atau lihat progress cicilan alat Anda';
    if (isOwnerTOP) return 'Approve atau reject pengajuan TOP dari karyawan';
    if (isKasirTOP) return 'Proses pembayaran cicilan TOP untuk barberman';
    return 'Tools Ownership Program';
}
// [24.1] Display payment history untuk Kasir
function displayPaymentHistory(topList) {
    const tbody = document.getElementById('paymentHistoryBody');
    const tableEl = document.getElementById('paymentHistoryTable');
    
    if (!tbody) return;
    
    // Collect all payments from all TOP
    const allPayments = [];
    
    topList.forEach(top => {
        const payments = top.pembayaran || [];
        payments.forEach(payment => {
            allPayments.push({
                ...payment,
                barberman: top.karyawan,
                alat: top.nama_alat,
                sisa_cicilan: top.sisa_cicilan || top.total_cicilan
            });
        });
    });
    
    // Sort by tanggal bayar (newest first)
    allPayments.sort((a, b) => new Date(b.tanggal_bayar) - new Date(a.tanggal_bayar));
    
    if (allPayments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-message">
                    <i class="fas fa-receipt"></i>
                    Belum ada riwayat pembayaran
                </td>
            </tr>
        `;
        if (tableEl) tableEl.style.display = 'table';
        return;
    }
    
    // Limit to 20 entries for performance
    const displayPayments = allPayments.slice(0, 20);
    
    let html = '';
    
    displayPayments.forEach(payment => {
        const tanggal = new Date(payment.tanggal_bayar);
        
        html += `
            <tr>
                <td>
                    ${formatDate(tanggal)}<br>
                    <small>${tanggal.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</small>
                </td>
                <td>${payment.barberman}</td>
                <td>
                    <div class="item-name">${payment.alat}</div>
                </td>
                <td>
                    <span class="badge">${payment.cicilan_ke}</span>
                </td>
                <td>${formatRupiah(payment.jumlah_bayar)}</td>
                <td>${payment.penerima || '-'}</td>
                <td>${formatRupiah(payment.sisa_cicilan)}</td>
            </tr>
        `;
    });
    
    // Jika ada lebih dari 20 pembayaran, tambahkan note
    if (allPayments.length > 20) {
        html += `
            <tr class="info-row">
                <td colspan="7" style="text-align: center; color: #6c757d; font-style: italic;">
                    <i class="fas fa-info-circle"></i> Menampilkan 20 dari ${allPayments.length} pembayaran.
                </td>
            </tr>
        `;
    }
    
    tbody.innerHTML = html;
    if (tableEl) tableEl.style.display = 'table';
}
// [24.2] Display all TOP riwayat untuk Owner
function displayAllTOPRiwayat(topList) {
    const tbody = document.getElementById('allHistoryBody');
    const tableEl = document.getElementById('allHistoryTable');
    
    if (!tbody) return;
    
    if (!topList || topList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-message">
                    <i class="fas fa-history"></i>
                    Tidak ada data TOP
                </td>
            </tr>
        `;
        if (tableEl) tableEl.style.display = 'table';
        return;
    }
    
    // Limit to 20 entries
    const displayList = topList.slice(0, 20);
    
    let html = '';
    
    displayList.forEach(top => {
        const createdDate = new Date(top.created_at);
        const progress = calculateProgress(top);
        
        html += `
            <tr>
                <td>${formatDate(createdDate)}</td>
                <td>${top.outlet}</td>
                <td>${top.karyawan}</td>
                <td>
                    <div class="item-name">${top.nama_alat}</div>
                    ${top.foto_url ? `<small><a href="${top.foto_url}" target="_blank">Lihat foto</a></small>` : ''}
                </td>
                <td>${formatRupiah(top.harga_alat)}</td>
                <td>${top.periode_cicilan} bln</td>
                <td>
                    <span class="status-pill ${getTOPStatusClass(top.status)}">
                        ${getTOPStatusText(top)}
                    </span>
                </td>
                <td>
                    <div class="progress-small">
                        <div class="progress-bar" style="width: ${progress.percentage}%"></div>
                        <span>${progress.text}</span>
                    </div>
                </td>
                <td>
                    <button class="btn-action" onclick="showTOPDetail('${top.id}')" title="Detail">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${top.status === 'pending' ? `
                        <button class="btn-action btn-approve" onclick="approveTOP('${top.id}')" title="Approve">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-action btn-reject" onclick="rejectTOP('${top.id}')" title="Reject">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    });
    
    // Jika ada lebih dari 20 item
    if (topList.length > 20) {
        html += `
            <tr class="info-row">
                <td colspan="9" style="text-align: center; color: #6c757d; font-style: italic;">
                    <i class="fas fa-info-circle"></i> Menampilkan 20 dari ${topList.length} data TOP.
                </td>
            </tr>
        `;
    }
    
    tbody.innerHTML = html;
    if (tableEl) tableEl.style.display = 'table';
}
// [24.3] Load outlet dropdown untuk Owner
async function loadOutletDropdownForTOP(topList) {
    const select = document.getElementById('filterOutletOwnerTOP');
    if (!select) return;
    
    try {
        // Get unique outlets from existing data
        const outlets = [...new Set(topList.map(top => top.outlet).filter(Boolean))];
        
        let options = '<option value="all">Semua Outlet</option>';
        
        outlets.forEach(outlet => {
            options += `<option value="${outlet}">${outlet}</option>`;
        });
        
        select.innerHTML = options;
        
    } catch (error) {
        console.error('Error loading outlets:', error);
    }
}
// [25] Setup events untuk Owner dan Kasir
function setupOwnerEvents() {
    // Filter events sudah di-handle di HTML
}

function setupKasirEvents() {
    // Events sudah di-handle di HTML
}

// [26] Global functions
window.showTOPPage = showTOPPage;
window.loadMyTOPRiwayat = loadMyTOPRiwayat;
window.loadTOPForOwner = loadTOPForOwner;
window.loadTOPForKasir = loadTOPForKasir;
window.approveTOP = approveTOP;
window.rejectTOP = rejectTOP;
window.showPaymentForm = showPaymentForm;
window.showCicilanDetail = showCicilanDetail;
window.showTOPDetail = showTOPDetail;
window.cancelTOP = cancelTOP;
window.previewImage = previewImage;

// Tambahkan fungsi baru
window.displayPaymentHistory = displayPaymentHistory;
window.displayAllTOPRiwayat = displayAllTOPRiwayat;
window.loadOutletDropdownForTOP = loadOutletDropdownForTOP;

// Placeholder functions for features to be implemented
async function showCicilanDetail(topId) {
    alert('Detail cicilan akan ditampilkan di sini');
}

async function showTOPDetail(topId) {
    alert('Detail TOP akan ditampilkan di sini');
}

async function cancelTOP(topId) {
    if (confirm('Batalkan pengajuan TOP ini?')) {
        alert('Fitur pembatalan akan diimplementasikan');
    }
}

function previewImage(url) {
    window.open(url, '_blank');
}

// ========== END OF TOP MODULE ==========
