// ========== MODULE STOK BATCH SYSTEM ==========
// ==============================================

// Variabel global untuk stok
let currentUserStok = null;
let currentOutletStok = null;
let isOwnerStok = false;
let selectedStokItems = []; // Untuk kasir request
let stokBatchId = null;
let stokInventoryData = [];
let selectedOwnerItems = {}; // Untuk owner approval {batch_id: [item_ids]}

// [1] Fungsi untuk tampilkan halaman stok
async function showStokPage() {
    try {
        console.log('=== SHOW STOK PAGE (BATCH SYSTEM) ===');
        
        // Reset items
        selectedStokItems = [];
        selectedOwnerItems = {};
        stokBatchId = generateStokBatchId();
        
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
        
        currentUserStok = {
            nama_karyawan: namaKaryawan,
            role: karyawanData.role,
            outlet: karyawanData.outlet,
            posisi: karyawanData.posisi
        };
        
        currentOutletStok = karyawanData.outlet;
        isOwnerStok = karyawanData.role === 'owner';
        
        console.log('User stok data:', currentUserStok);
        
        // Sembunyikan main app
        document.getElementById('appScreen').style.display = 'none';
        
        // Buat halaman stok
        createStokPage();
        
        // Load data berdasarkan role
        if (isOwnerStok) {
            await loadOwnerStokData();
        } else {
            await loadKasirStokData();
        }
        
    } catch (error) {
        console.error('Error in showStokPage:', error);
        alert('Gagal memuat halaman stok!');
    }
}

// [2] Fungsi untuk buat halaman stok - DIMODIFIKASI untuk batch system
function createStokPage() {
    // Hapus halaman sebelumnya jika ada
    const existingPage = document.getElementById('stokPage');
    if (existingPage) {
        existingPage.remove();
    }
    
    // Buat container halaman stok
    const stokPage = document.createElement('div');
    stokPage.id = 'stokPage';
    stokPage.className = 'stok-page';
    
    // Inline CSS untuk stok page
    const styles = `
        <style>
        /* Stok Page Styles */
        .stok-page {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #f5f7fa; /* Background solid, tidak gradient */
    z-index: 1000;
    overflow-y: auto;
}
        
        /* Header - PERBAIKAN: Tambah z-index lebih tinggi */
        .stok-header {
    background: #FF8C00 ;
    padding: 15px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    position: relative;
    z-index: 100;
    border-bottom: 2px solid #dee2e6;
}
        
        .stok-header h2 {
            margin: 0;
            color: #333;
            font-size: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
      .back-btn, .refresh-btn {
    background: #00008B  ;
    color: white;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: bold;
}

.refresh-btn {
    background: #007bff;
}

/* Hover effects */
.back-btn:hover {
    background: #5a6268;
    transform: scale(1.05);
}

.refresh-btn:hover {
    background: #0056b3;
    transform: scale(1.05);
}
        
        /* Info Header */
        .stok-info-header {
    background: white;
    padding: 5px;
    margin-top: 10px; /* Beri jarak dari header fixed */
    margin-left: 20px;
    margin-right: 20px;
    margin-bottom:10px;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.info-row {
    display: block; /* Ubah dari flex ke block */
    margin-bottom: 15px;
}

.info-row:last-child {
    margin-bottom: 0;
}

.info-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: #555;
    margin-bottom: 8px;
}

.info-item:last-child {
    margin-bottom: 0;
}
        
      
        /* Content Sections */
       .stok-content {
    padding: 20px;
    padding-top: 0; /* Header sudah fixed, kurangi padding atas */
    max-width: 1200px;
    margin: 0 auto;
}
        
        /* KASIR VIEW */
        .kasir-view {
            background: transparent;
        }
        
        /* Search Filter */
        .search-filter-section {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        
        .filter-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .filter-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .filter-group label {
            font-size: 14px;
            color: #666;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .form-select, .form-input {
            padding: 10px 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
            background: #f8f9fa;
        }
        
        .search-box {
            position: relative;
            flex: 1;
        }
        
        .search-box i {
            position: absolute;
            left: 15px;
            top: 50%;
            transform: translateY(-50%);
            color: #999;
        }
        
        .search-box input {
            padding: 12px 45px 12px 45px;
            width: 100%;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
        }
        
        .clear-search {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #999;
            cursor: pointer;
        }
        
        .btn-search-action {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .btn-search-action:hover {
            opacity: 0.9;
        }
        
        /* Inventory Table */
        .inventory-table-section {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .section-header h3 {
            margin: 0;
            color: #333;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .item-count {
            background: #007bff;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 14px;
        }
        
        .inventory-table-container {
            overflow-x: auto;
        }
        
        .table-wrapper {
            overflow-x: auto;
            max-height: 400px;
        }
        
        .inventory-table {
            width: 100%;
            border-collapse: collapse;
            min-width: 1000px;
        }
        
        .inventory-table th {
            background: #f8f9fa;
            padding: 12px 15px;
            text-align: left;
            font-weight: 600;
            color: #495057;
            border-bottom: 2px solid #dee2e6;
            position: sticky;
            top: 0;
        }
        
        .inventory-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #eee;
        }
        
        .inventory-table tr:hover {
            background: #f8f9fa;
        }
        
        .selected-row {
            background: #e3f2fd !important;
        }
        
        .status-pill {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            display: inline-block;
        }
        
        .status-active { background: #d4edda; color: #155724; }
        .status-inactive { background: #f8d7da; color: #721c24; }
        
        .btn-add-to-request {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .btn-add-to-request:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .btn-add-to-request:hover:not(:disabled) {
            opacity: 0.9;
        }
        
        /* Selected Items Section */
        .selected-items-section {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        
        .badge {
            background: #dc3545;
            color: white;
            padding: 2px 10px;
            border-radius: 10px;
            font-size: 12px;
            margin-left: 5px;
        }
        
        .btn-clear {
            background: #dc3545;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 14px;
        }
        
        .btn-clear:hover {
            background: #c82333;
        }
        
        .selected-items-table-container {
            overflow-x: auto;
            margin-bottom: 20px;
        }
        
        .selected-items-table {
            width: 100%;
            border-collapse: collapse;
            min-width: 800px;
        }
        
        .selected-items-table th {
            background: #f8f9fa;
            padding: 12px 15px;
            text-align: left;
            font-weight: 600;
            color: #495057;
            border-bottom: 2px solid #dee2e6;
        }
        
        .selected-items-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #eee;
        }
        
        .qty-control {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .qty-btn {
            background: #6c757d;
            color: white;
            border: none;
            width: 30px;
            height: 30px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .qty-btn:hover {
            background: #5a6268;
        }
        
        .qty-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .qty-input {
            width: 50px;
            text-align: center;
            padding: 5px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        .btn-remove {
            background: #dc3545;
            color: white;
            border: none;
            width: 30px;
            height: 30px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .btn-remove:hover {
            background: #c82333;
        }
        
        .selected-notes-submit {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            align-items: start;
        }
        
        .notes-section {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .notes-section textarea {
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
            resize: vertical;
            background: #f8f9fa;
        }
        
        .submit-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
        }
        
        .total-info {
            margin-bottom: 20px;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        
        .main-total {
            font-size: 18px;
            font-weight: bold;
            color: #007bff;
            border-bottom: none;
        }
        
        .submit-btn {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .submit-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .submit-btn:hover:not(:disabled) {
            opacity: 0.9;
        }
        
        /* History Section */
        .kasir-history-section {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        
        .history-table-container {
            overflow-x: auto;
        }
        
        .history-table {
            width: 100%;
            border-collapse: collapse;
            min-width: 1200px;
        }
        
        .history-table th {
            background: #f8f9fa;
            padding: 12px 15px;
            text-align: left;
            font-weight: 600;
            color: #495057;
            border-bottom: 2px solid #dee2e6;
            position: sticky;
            top: 0;
        }
        
        .history-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #eee;
        }
        
        .btn-refresh-history {
            background: #6c757d;
            color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .btn-refresh-history:hover {
            background: #5a6268;
        }
        
        /* OWNER VIEW */
        .owner-view {
            background: transparent;
        }
        
        /* Owner Filter */
        .owner-filter-section {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        
        .filter-row-owner {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            align-items: end;
        }
        
        .btn-apply-filter {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            height: 42px;
        }
        
        .btn-apply-filter:hover {
            opacity: 0.9;
        }
        
        /* Owner Stats */
        .owner-stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 15px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .stat-icon {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            width: 50px;
            height: 50px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }
        
        .stat-info {
            flex: 1;
        }
        
        .stat-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        
        /* Pending Requests - Batch Cards */
        .pending-requests-section {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        
        .batch-card {
            background: #f8f9fa;
            border-radius: 10px;
            margin-bottom: 20px;
            overflow: hidden;
            border: 1px solid #dee2e6;
        }
        
        .batch-header {
            background: #e9ecef;
            padding: 15px 20px;
            border-bottom: 1px solid #dee2e6;
        }
        
        .batch-info {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .batch-info .info-item {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
        }
        
        .batch-info strong {
            min-width: 120px;
            color: #495057;
        }
        
        .batch-items-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .batch-items-table th {
            background: #f1f3f5;
            padding: 12px 15px;
            text-align: left;
            font-weight: 600;
            color: #495057;
            border-bottom: 2px solid #dee2e6;
        }
        
        .batch-items-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #dee2e6;
        }
        
        .batch-items-table tfoot td {
            background: #f8f9fa;
            font-weight: bold;
        }
        
        /* Owner History */
        .owner-history-section {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        
        /* Loading & Empty States */
        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
            font-style: italic;
        }
        
        .no-data {
            text-align: center;
            padding: 40px;
            color: #999;
        }
        
        .no-data i {
            font-size: 48px;
            margin-bottom: 15px;
            color: #dee2e6;
        }
        
        .empty-state {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        .empty-state i {
            font-size: 48px;
            color: #28a745;
            margin-bottom: 15px;
        }
        
        .error-message {
            color: #dc3545;
            background: #f8d7da;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
        }
        
        /* Toast */
        .toast {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            z-index: 1000;
            transform: translateY(100px);
            opacity: 0;
            transition: all 0.3s ease;
        }
        
        .toast.show {
            transform: translateY(0);
            opacity: 1;
        }
        
        .toast-success {
            border-left: 4px solid #28a745;
        }
        
        .toast-error {
            border-left: 4px solid #dc3545;
        }
        
        .toast-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .toast-close {
            background: none;
            border: none;
            color: #999;
            cursor: pointer;
            padding: 0;
        }
        
        /* Footer */
        .stok-footer {
            background: rgba(255, 255, 255, 0.9);
            padding: 15px;
            margin: 10px;
            border-radius: 10px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        
        .stok-footer i {
            margin-right: 5px;
            color: #007bff;
        }
       
        /* Responsive */
        @media (max-width: 768px) {
            .selected-notes-submit {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .filter-row {
                grid-template-columns: 1fr;
            }
            
            .filter-row-owner {
                grid-template-columns: 1fr;
            }
        }
        
        /* Scrollbar Styling */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: #555;
        }
        
        /* Utility Classes */
        .text-success { color: #28a745; }
        .text-danger { color: #dc3545; }
        .text-warning { color: #ffc107; }
        .text-info { color: #17a2b8; }
        
        .status-approved { background: #d4edda; color: #155724; }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-rejected { background: #f8d7da; color: #721c24; }
        .status-partial { background: #cce5ff; color: #004085; }
        
        .type-in { color: #28a745; }
        .type-out { color: #dc3545; }
        
        .stock-low { color: #ffc107; font-weight: bold; }
        .stock-out { color: #dc3545; font-weight: bold; }
        .stock-ok { color: #28a745; }
        </style>
    `;
    
    // UI berdasarkan role
    const pageContent = isOwnerStok ? createOwnerStokUI() : createKasirStokUI();
    
    stokPage.innerHTML = styles + `
    <!-- HEADER - SAMA DENGAN REQUEST.JS -->
    <header class="stok-header">
        <button class="back-btn" id="backToMainFromStok">
            <i class="fas fa-arrow-left"></i>
        </button>
        <h2><i class="fas fa-boxes"></i> Update Stok</h2>
        <div class="header-actions">
            <button class="refresh-btn" id="refreshStok" title="Refresh">
                <i class="fas fa-sync-alt"></i>
            </button>
        </div>
    </header>
        
        <!-- INFO HEADER -->
        <div class="stok-info-header">
            <div class="info-row">
                <div class="info-item">
                    <i class="fas fa-calendar-day"></i>
                    <span id="stokCurrentDate">${new Date().toLocaleDateString('id-ID', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-user"></i>
                    <span id="stokUserName">${currentUserStok?.nama_karyawan || '-'}</span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-item">
                    <i class="fas fa-briefcase"></i>
                    <span id="stokUserPosition">${currentUserStok?.posisi || '-'}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-store"></i>
                    <span id="stokUserOutlet">${currentOutletStok || '-'}</span>
                </div>
            </div>
        </div>
        
        <!-- CONTENT -->
        ${pageContent}
        
        <!-- FOOTER -->
        <div class="stok-footer">
            <p><i class="fas fa-info-circle"></i> ${isOwnerStok ? 'Pilih item untuk approve/reject stok request dari karyawan' : 'Pilih produk untuk request update stok (batch system)'}</p>
        </div>
    `;
    
    document.body.appendChild(stokPage);
    
    // Setup event listeners
    setupStokPageEvents();
}

// [3] UI untuk KASIR - BATCH SYSTEM
function createKasirStokUI() {
    return `
        <div class="stok-content kasir-view">
            <!-- SEARCH & FILTER -->
            <div class="search-filter-section">
                <div class="filter-row">
                    <div class="filter-group">
                        <label for="filterGroupStok"><i class="fas fa-layer-group"></i> Group Produk:</label>
                        <select id="filterGroupStok" class="form-select">
                            <option value="">Semua Group</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label for="filterStatusStokKasir"><i class="fas fa-check-circle"></i> Status:</label>
                        <select id="filterStatusStokKasir" class="form-select">
                            <option value="active">Active</option>
                            <option value="all">Semua</option>
                        </select>
                    </div>
                </div>
                
                <div class="filter-row" style="margin-top: 15px;">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="searchInventoryStok" placeholder="Cari produk..." style="width: 100%;">
                        <button class="clear-search" id="clearSearchStokBtn" title="Clear search">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <button class="btn-search-action" id="applyFilterStokBtn">
                        <i class="fas fa-filter"></i> Terapkan
                    </button>
                </div>
            </div>
            
            <!-- INVENTORY TABLE -->
            <div class="inventory-table-section">
                <div class="section-header">
                    <h3><i class="fas fa-boxes"></i> Daftar Produk</h3>
                    <span class="item-count" id="inventoryStokCount">0 produk</span>
                </div>
                <div class="inventory-table-container">
                    <div class="loading" id="loadingInventoryStok">Memuat produk...</div>
                    <div class="table-wrapper">
                        <table class="inventory-table" id="inventoryTableStok" style="display: none;">
                            <thead>
                                <tr>
                                    <th width="50px">Pilih</th>
                                    <th width="200px">Nama Produk</th>
                                    <th width="120px">Group</th>
                                    <th width="80px">Stok</th>
                                    <th width="100px">Status</th>
                                    <th width="100px">Jenis</th>
                                    <th width="150px">Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="inventoryBodyStok">
                                <!-- Produk akan diisi di sini -->
                            </tbody>
                        </table>
                    </div>
                    <div class="no-data" id="noInventoryDataStok" style="display: none;">
                        <i class="fas fa-box-open"></i>
                        <p>Tidak ada data produk</p>
                    </div>
                </div>
            </div>
            
            <!-- SELECTED ITEMS SECTION -->
            <div class="selected-items-section" id="selectedStokItemsSection" style="display: none;">
                <div class="section-header">
                    <h3><i class="fas fa-shopping-cart"></i> Items yang akan di-Request <span class="badge" id="selectedStokCount">0</span></h3>
                    <button class="btn-clear" id="clearAllSelectedStok">
                        <i class="fas fa-trash"></i> Hapus Semua
                    </button>
                </div>
                
                <!-- Table Selected Items -->
                <div class="selected-items-table-container">
                    <table class="selected-items-table" id="selectedStokItemsTable">
                        <thead>
                            <tr>
                                <th width="200px">Produk</th>
                                <th width="120px">Group</th>
                                <th width="100px">Jenis</th>
                                <th width="80px">Qty</th>
                                <th width="120px">Stok Sebelum</th>
                                <th width="120px">Stok Sesudah</th>
                                <th width="80px">Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="selectedStokItemsBody">
                            <!-- Items terpilih akan diisi di sini -->
                        </tbody>
                    </table>
                </div>
                
                <!-- Notes & Submit Button -->
                <div class="selected-notes-submit">
                    <div class="notes-section">
                        <label for="stokRequestNotes"><i class="fas fa-sticky-note"></i> Catatan (opsional):</label>
                        <textarea id="stokRequestNotes" placeholder="Tambahkan catatan untuk request ini..." rows="2"></textarea>
                    </div>
                    
                    <div class="submit-section">
                        <div class="total-info">
                            <div class="total-row">
                                <span class="total-label">Total Items:</span>
                                <span class="total-value" id="totalStokItemsCount">0</span>
                            </div>
                            <div class="total-row">
                                <span class="total-label">Total Masuk:</span>
                                <span class="total-value text-success" id="totalMasukCount">0 unit</span>
                            </div>
                            <div class="total-row">
                                <span class="total-label">Total Keluar:</span>
                                <span class="total-value text-danger" id="totalKeluarCount">0 unit</span>
                            </div>
                            <div class="total-row main-total">
                                <span class="total-label">Batch ID:</span>
                                <span class="total-value" id="stokBatchIdDisplay">${stokBatchId}</span>
                            </div>
                        </div>
                        <button class="submit-btn" id="submitStokRequestBtn" disabled>
                            <i class="fas fa-paper-plane"></i> Submit Request
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- REQUEST HISTORY untuk Kasir -->
            <div class="kasir-history-section">
                <div class="section-header">
                    <h3><i class="fas fa-history"></i> Riwayat Request Stok</h3>
                    <div class="filter-row" style="margin-top: 15px; gap: 10px;">
                        <div class="filter-group" style="flex: 1;">
                            <label for="filterHistoryDate"><i class="fas fa-calendar"></i> Periode:</label>
                            <select id="filterHistoryDate" class="form-select">
                                <option value="today">Hari Ini</option>
                                <option value="week">7 Hari Terakhir</option>
                                <option value="month">Bulan Ini</option>
                                <option value="all">Semua</option>
                            </select>
                        </div>
                        <button class="btn-refresh-history" onclick="loadKasirStokHistory()">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>
                <div class="history-table-container">
                    <div class="loading" id="loadingHistoryStokKasir">Memuat riwayat...</div>
                    <div class="table-wrapper">
                        <table class="history-table" id="historyTableStokKasir" style="display: none;">
                            <thead>
                                <tr>
                                    <th width="120px">Tanggal</th>
                                    <th width="100px">Batch ID</th>
                                    <th width="150px">Produk</th>
                                    <th width="80px">Jenis</th>
                                    <th width="80px">Qty</th>
                                    <th width="120px">Stok Sebelum</th>
                                    <th width="120px">Stok Sesudah</th>
                                    <th width="100px">Status</th>
                                    <th width="150px">Disetujui Oleh</th>
                                </tr>
                            </thead>
                            <tbody id="historyBodyStokKasir">
                                <!-- History akan diisi di sini -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// [4] UI untuk OWNER - DENGAN CHECKLIST
function createOwnerStokUI() {
    return `
        <div class="stok-content owner-view">
            <!-- FILTER SECTION -->
            <div class="owner-filter-section">
                <div class="filter-row-owner">
                    <div class="filter-group">
                        <label for="filterOutletStokOwner"><i class="fas fa-store"></i> Outlet:</label>
                        <select id="filterOutletStokOwner" class="form-select">
                            <option value="all">Semua Outlet</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="filterStatusStokOwner"><i class="fas fa-filter"></i> Status:</label>
                        <select id="filterStatusStokOwner" class="form-select">
                            <option value="pending">Pending Approval</option>
                            <option value="all">Semua Status</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="filterDateStokOwner"><i class="fas fa-calendar"></i> Periode:</label>
                        <select id="filterDateStokOwner" class="form-select">
                            <option value="today">Hari Ini</option>
                            <option value="week">7 Hari Terakhir</option>
                            <option value="month">Bulan Ini</option>
                            <option value="all">Semua</option>
                        </select>
                    </div>
                    <button class="btn-apply-filter" onclick="loadOwnerStokData()">
                        <i class="fas fa-filter"></i> Terapkan
                    </button>
                </div>
            </div>
            
            <!-- STATISTICS -->
            <div class="owner-stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-label">Pending Requests</div>
                        <div class="stat-value" id="statPendingCount">0</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-label">Approved Today</div>
                        <div class="stat-value text-success" id="statApprovedToday">0</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-exchange-alt"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-label">Items Diproses</div>
                        <div class="stat-value" id="statItemsProcessed">0</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-store"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-label">Total Outlet</div>
                        <div class="stat-value" id="statTotalOutlets">0</div>
                    </div>
                </div>
            </div>
            
            <!-- PENDING REQUESTS dengan CHECKLIST -->
            <div class="pending-requests-section">
                <div class="section-header">
                    <h3><i class="fas fa-clock"></i> Pending Stok Requests</h3>
                    <div class="item-count" id="pendingStokCount">0 items</div>
                </div>
                <div class="pending-requests-container">
                    <div class="loading" id="loadingPendingStok">Memuat data request...</div>
                    <div id="pendingStokRequestsGrid" style="display: none;">
                        <!-- Batch cards akan diisi di sini -->
                    </div>
                </div>
            </div>
            
            <!-- REQUEST HISTORY untuk Owner -->
            <div class="owner-history-section">
                <div class="section-header">
                    <h3><i class="fas fa-history"></i> Riwayat Stok (Semua Outlet)</h3>
                    <div class="filter-row" style="margin-top: 15px; gap: 10px;">
                        <div class="filter-group" style="flex: 1;">
                            <label for="filterOwnerHistoryDate"><i class="fas fa-calendar"></i> Periode:</label>
                            <select id="filterOwnerHistoryDate" class="form-select">
                                <option value="today">Hari Ini</option>
                                <option value="week">7 Hari Terakhir</option>
                                <option value="month">Bulan Ini</option>
                                <option value="all">Semua</option>
                            </select>
                        </div>
                        <button class="btn-refresh-history" onclick="loadOwnerStokHistory()">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>
                <div class="history-table-container">
                    <div class="loading" id="loadingOwnerHistoryStok">Memuat riwayat...</div>
                    <div class="table-wrapper">
                        <table class="history-table" id="historyTableStokOwner" style="display: none;">
                            <thead>
                                <tr>
                                    <th width="120px">Tanggal</th>
                                    <th width="100px">Batch ID</th>
                                    <th width="100px">Outlet</th>
                                    <th width="120px">Karyawan</th>
                                    <th width="150px">Produk</th>
                                    <th width="80px">Jenis</th>
                                    <th width="80px">Qty</th>
                                    <th width="120px">Stok Sebelum</th>
                                    <th width="120px">Stok Sesudah</th>
                                    <th width="100px">Status</th>
                                    <th width="150px">Disetujui Oleh</th>
                                    <th width="150px">Catatan</th>
                                </tr>
                            </thead>
                            <tbody id="historyBodyStokOwner">
                                <!-- History akan diisi di sini -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// [5] Setup event listeners untuk halaman stok
function setupStokPageEvents() {
    // Tombol kembali
    document.getElementById('backToMainFromStok').addEventListener('click', () => {
        document.getElementById('stokPage').remove();
        document.getElementById('appScreen').style.display = 'block';
    });
    
    // Tombol refresh
    document.getElementById('refreshStok').addEventListener('click', () => {
        if (isOwnerStok) {
            loadOwnerStokData();
        } else {
            loadKasirStokData();
        }
    });
    
    if (isOwnerStok) {
        // OWNER: Setup event listeners
        setupOwnerStokEvents();
    } else {
        // KASIR: Setup event listeners
        setupKasirStokEvents();
    }
}

// [6] Setup events untuk KASIR
function setupKasirStokEvents() {
    // Tombol submit request
    const submitBtn = document.getElementById('submitStokRequestBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitStokBatch);
    }
    
    // Apply filter button
    const applyFilterBtn = document.getElementById('applyFilterStokBtn');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', async () => {
            await loadInventoryStokWithFilter();
        });
    }
    
    // Search input
    const searchInput = document.getElementById('searchInventoryStok');
    if (searchInput) {
        searchInput.addEventListener('keyup', debounce(async function(e) {
            if (e.key === 'Enter') {
                await loadInventoryStokWithFilter();
            }
        }, 500));
    }
    
    // Clear search button
    const clearSearchBtn = document.getElementById('clearSearchStokBtn');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            document.getElementById('searchInventoryStok').value = '';
        });
    }
    
    // Clear all selected button
    const clearAllBtn = document.getElementById('clearAllSelectedStok');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllSelectedStokItems);
    }
    
    // Filter tanggal history
    const dateFilter = document.getElementById('filterHistoryDate');
    if (dateFilter) {
        dateFilter.addEventListener('change', async () => {
            await loadKasirStokHistory();
        });
    }
}

// [7] Setup events untuk OWNER
function setupOwnerStokEvents() {
    // Filter dropdowns
    document.getElementById('filterOutletStokOwner')?.addEventListener('change', async () => {
        await loadOwnerStokData();
    });
    
    document.getElementById('filterStatusStokOwner')?.addEventListener('change', async () => {
        await loadOwnerStokData();
    });
    
    document.getElementById('filterDateStokOwner')?.addEventListener('change', async () => {
        await loadOwnerStokData();
    });
    
    // Filter tanggal history owner
    const dateFilter = document.getElementById('filterOwnerHistoryDate');
    if (dateFilter) {
        dateFilter.addEventListener('change', async () => {
            await loadOwnerStokHistory();
        });
    }
}

// [8] Fungsi untuk load data kasir - DIMODIFIKASI
async function loadKasirStokData() {
    try {
        console.log('Loading kasir stok data...');
        
        // Load filter options
        await loadGroupFilterOptions();
        
        // Kosongkan inventory table
        clearInventoryStokTable();
        
        // Load history request (default hari ini)
        await loadKasirStokHistory();
        
    } catch (error) {
        console.error('Error loading kasir data:', error);
        showStokToast(`Gagal memuat data: ${error.message}`, 'error');
    }
}

// [9] Fungsi untuk load filter options
async function loadGroupFilterOptions() {
    const groupSelect = document.getElementById('filterGroupStok');
    
    if (groupSelect) {
        try {
            // Load distinct groups dari database
            const { data: groupsData, error } = await supabase
                .from('produk')
                .select('group_produk')
                .eq('outlet', currentOutletStok)
                .eq('status', 'active')
                .eq('inventory', true)
                .not('group_produk', 'is', null)
                .order('group_produk');
            
            if (!error && groupsData) {
                const groups = [...new Set(groupsData.map(item => item.group_produk).filter(Boolean))];
                
                groupSelect.innerHTML = `
                    <option value="">Semua Group</option>
                    ${groups.map(grp => `<option value="${grp}">${grp}</option>`).join('')}
                `;
            } else {
                groupSelect.innerHTML = '<option value="">Error loading groups</option>';
            }
        } catch (error) {
            console.error('Error loading groups:', error);
            groupSelect.innerHTML = '<option value="">Error loading groups</option>';
        }
    }
}

// [10] Fungsi untuk load inventory dengan filter - PERBAIKAN: HAPUS SKU FILTER
async function loadInventoryStokWithFilter() {
    try {
        const loadingEl = document.getElementById('loadingInventoryStok');
        const tableEl = document.getElementById('inventoryTableStok');
        const noDataEl = document.getElementById('noInventoryDataStok');
        const countEl = document.getElementById('inventoryStokCount');
        
        if (loadingEl) loadingEl.style.display = 'block';
        if (tableEl) tableEl.style.display = 'none';
        if (noDataEl) noDataEl.style.display = 'none';
        
        // Get filter values
        const groupFilter = document.getElementById('filterGroupStok').value;
        const statusFilter = document.getElementById('filterStatusStokKasir').value;
        const searchTerm = document.getElementById('searchInventoryStok').value.trim();
        
        // Build query - PERBAIKAN: Hapus sku dari query
        let query = supabase
            .from('produk')
            .select('*')
            .eq('outlet', currentOutletStok)
            .eq('inventory', true)
            .order('nama_produk');
        
        // Apply filters
        if (groupFilter) {
            query = query.eq('group_produk', groupFilter);
        }
        
        if (statusFilter !== 'all') {
            query = query.eq('status', 'active');
        }
        
        // PERBAIKAN: Hanya search berdasarkan nama_produk saja (tanpa sku)
        if (searchTerm && searchTerm.length >= 2) {
            query = query.ilike('nama_produk', `%${searchTerm}%`);
        }
        
        const { data: items, error } = await query;
        
        if (error) throw error;
        
        // Simpan data untuk referensi
        stokInventoryData = items || [];
        
        // Tampilkan data
        displayInventoryStokTable(stokInventoryData);
        
        // Update count
        if (countEl) {
            countEl.textContent = `${stokInventoryData.length} produk${stokInventoryData.length !== 1 ? '' : ''}`;
        }
        
    } catch (error) {
        console.error('Error loading inventory stok:', error);
        const tbody = document.getElementById('inventoryBodyStok');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        Gagal memuat data: ${error.message}
                    </td>
                </tr>
            `;
        }
    } finally {
        const loadingEl = document.getElementById('loadingInventoryStok');
        if (loadingEl) loadingEl.style.display = 'none';
    }
}

// [11] Fungsi untuk display inventory table
function displayInventoryStokTable(items) {
    const tableEl = document.getElementById('inventoryTableStok');
    const tbody = document.getElementById('inventoryBodyStok');
    const noDataEl = document.getElementById('noInventoryDataStok');
    
    if (!tbody || !tableEl || !noDataEl) return;
    
    if (!items || items.length === 0) {
        tableEl.style.display = 'none';
        noDataEl.style.display = 'block';
        tbody.innerHTML = '';
        return;
    }
    
    let html = '';
    
    items.forEach((item, index) => {
        const isSelected = selectedStokItems.some(sel => sel.produk_id === item.id);
        const selectedType = isSelected ? selectedStokItems.find(sel => sel.produk_id === item.id).stok_type : 'masuk';
        const selectedQty = isSelected ? Math.abs(selectedStokItems.find(sel => sel.produk_id === item.id).qty_change) : 1;
        
        html += `
            <tr class="${isSelected ? 'selected-row' : ''}">
                <td>
                    <input type="checkbox" 
                           class="select-item-checkbox-stok"
                           data-id="${item.id}"
                           data-index="${index}"
                           ${isSelected ? 'checked' : ''}
                           onchange="toggleStokItemSelection('${item.id}', '${item.nama_produk}', '${item.group_produk}', ${item.stok}, this.checked)">
                </td>
                <td>
                    <div class="item-name">${item.nama_produk || '-'}</div>
                </td>
                <td>${item.group_produk || '-'}</td>
                <td class="${getStockStatusClass(item.stok)}">${item.stok || 0}</td>
                <td>
                    <span class="status-pill ${item.status === 'active' ? 'status-active' : 'status-inactive'}">
                        ${item.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    ${isSelected ? `
                        <select class="form-select" style="width: 100px; font-size: 12px; padding: 5px;"
                                onchange="updateSelectedStokItemType('${item.id}', this.value)">
                            <option value="masuk" ${selectedType === 'masuk' ? 'selected' : ''}>Masuk</option>
                            <option value="keluar" ${selectedType === 'keluar' ? 'selected' : ''}>Keluar</option>
                        </select>
                    ` : '-'}
                </td>
                <td>
                    <button class="btn-add-to-request" 
                            onclick="addSingleStokItemToRequest('${item.id}', '${item.nama_produk}', '${item.group_produk}', ${item.stok})"
                            ${isSelected ? 'disabled' : ''}>
                        <i class="fas fa-plus"></i> Tambah
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    tableEl.style.display = 'table';
    noDataEl.style.display = 'none';
}

// [12] Fungsi untuk toggle item selection
function toggleStokItemSelection(produkId, namaProduk, groupProduk, currentStock, isChecked) {
    if (isChecked) {
        // Cek apakah item sudah ada di selectedStokItems
        const existingIndex = selectedStokItems.findIndex(item => item.produk_id === produkId);
        
        if (existingIndex === -1) {
            // Tambah item baru
            selectedStokItems.push({
                produk_id: produkId,
                nama_produk: namaProduk,
                group_produk: groupProduk,
                stok_type: 'masuk',
                qty_change: 1,
                qty_before: currentStock,
                qty_after: currentStock + 1
            });
        }
    } else {
        // Hapus item dari selectedStokItems
        const index = selectedStokItems.findIndex(item => item.produk_id === produkId);
        if (index !== -1) {
            selectedStokItems.splice(index, 1);
        }
    }
    
    // Update UI
    updateSelectedStokItemsSection();
}

// [13] Fungsi untuk add single item to request
function addSingleStokItemToRequest(produkId, namaProduk, groupProduk, currentStock) {
    // Cek apakah item sudah ada di selectedStokItems
    const existingIndex = selectedStokItems.findIndex(item => item.produk_id === produkId);
    
    if (existingIndex === -1) {
        // Tambah item baru
        selectedStokItems.push({
            produk_id: produkId,
            nama_produk: namaProduk,
            group_produk: groupProduk,
            stok_type: 'masuk',
            qty_change: 1,
            qty_before: currentStock,
            qty_after: currentStock + 1
        });
        
        // Update UI
        updateSelectedStokItemsSection();
        
        // Update checkbox
        const checkbox = document.querySelector(`.select-item-checkbox-stok[data-id="${produkId}"]`);
        if (checkbox) {
            checkbox.checked = true;
        }
        
        // Feedback
        showStokToast(`"${namaProduk}" ditambahkan ke request`, 'success');
    }
}

// [14] Fungsi untuk update selected item type
function updateSelectedStokItemType(produkId, newType) {
    const index = selectedStokItems.findIndex(item => item.produk_id === produkId);
    if (index === -1) return;
    
    const item = selectedStokItems[index];
    const oldType = item.stok_type;
    
    if (oldType !== newType) {
        item.stok_type = newType;
        
        // Update quantities
        if (newType === 'keluar') {
            // Untuk stok keluar, default 1, tapi tidak boleh lebih dari stok
            item.qty_change = -Math.min(item.qty_change, item.qty_before);
            item.qty_after = item.qty_before + item.qty_change;
        } else {
            // Untuk stok masuk, tetap positif
            item.qty_change = Math.abs(item.qty_change);
            item.qty_after = item.qty_before + item.qty_change;
        }
        
        updateSelectedStokItemsSection();
    }
}

// [15] Fungsi untuk update selected items section
function updateSelectedStokItemsSection() {
    const section = document.getElementById('selectedStokItemsSection');
    const submitBtn = document.getElementById('submitStokRequestBtn');
    const selectedCountEl = document.getElementById('selectedStokCount');
    const totalItemsCountEl = document.getElementById('totalStokItemsCount');
    const totalMasukEl = document.getElementById('totalMasukCount');
    const totalKeluarEl = document.getElementById('totalKeluarCount');
    const tbody = document.getElementById('selectedStokItemsBody');
    
    if (!section || !submitBtn || !tbody) return;
    
    // Show/hide section based on selected items
    if (selectedStokItems.length > 0) {
        section.style.display = 'block';
        submitBtn.disabled = false;
        
        // Update count
        if (selectedCountEl) {
            selectedCountEl.textContent = selectedStokItems.length;
        }
        
        // Update table
        tbody.innerHTML = '';
        
        let totalMasuk = 0;
        let totalKeluar = 0;
        
        selectedStokItems.forEach((item, index) => {
            if (item.stok_type === 'masuk') {
                totalMasuk += Math.abs(item.qty_change);
            } else {
                totalKeluar += Math.abs(item.qty_change);
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="item-name">${item.nama_produk}</div>
                    <div class="item-sku"><small>Group: ${item.group_produk}</small></div>
                </td>
                <td>${item.group_produk}</td>
                <td>
                    <select class="form-select" style="width: 100px; font-size: 12px; padding: 5px;"
                            onchange="updateSelectedStokItemType('${item.produk_id}', this.value)">
                        <option value="masuk" ${item.stok_type === 'masuk' ? 'selected' : ''}>Masuk</option>
                        <option value="keluar" ${item.stok_type === 'keluar' ? 'selected' : ''}>Keluar</option>
                    </select>
                </td>
                <td>
                    <div class="qty-control">
                        <button class="qty-btn minus" onclick="adjustSelectedStokItemQty(${index}, -1)" 
                                ${(item.stok_type === 'keluar' && Math.abs(item.qty_change) <= 1) ? 'disabled' : ''}>
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" 
                               class="qty-input" 
                               value="${Math.abs(item.qty_change)}" 
                               min="1" 
                               max="${item.stok_type === 'keluar' ? item.qty_before : ''}"
                               onchange="updateSelectedStokItemQty(${index}, this.value)"
                               style="width: 50px;">
                        <button class="qty-btn plus" onclick="adjustSelectedStokItemQty(${index}, 1)"
                                ${(item.stok_type === 'keluar' && Math.abs(item.qty_change) >= item.qty_before) ? 'disabled' : ''}>
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </td>
                <td>${item.qty_before}</td>
                <td>${item.qty_after}</td>
                <td>
                    <button class="btn-remove" onclick="removeSelectedStokItem(${index})" title="Hapus item">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Update total info
        if (totalItemsCountEl) totalItemsCountEl.textContent = selectedStokItems.length;
        if (totalMasukEl) totalMasukEl.textContent = `${totalMasuk} unit`;
        if (totalKeluarEl) totalKeluarEl.textContent = `${totalKeluar} unit`;
        
    } else {
        section.style.display = 'none';
        submitBtn.disabled = true;
    }
}

// [16] Fungsi untuk adjust selected item quantity
function adjustSelectedStokItemQty(index, change) {
    if (index < 0 || index >= selectedStokItems.length) return;
    
    const item = selectedStokItems[index];
    let newQty = Math.abs(item.qty_change) + change;
    
    // Validasi
    if (newQty < 1) newQty = 1;
    
    if (item.stok_type === 'keluar' && newQty > item.qty_before) {
        newQty = item.qty_before;
    }
    
    item.qty_change = item.stok_type === 'masuk' ? newQty : -newQty;
    item.qty_after = item.qty_before + item.qty_change;
    
    updateSelectedStokItemsSection();
}

// [17] Fungsi untuk update selected item quantity
function updateSelectedStokItemQty(index, newQty) {
    if (index < 0 || index >= selectedStokItems.length) return;
    
    const item = selectedStokItems[index];
    const qty = parseInt(newQty) || 1;
    
    // Validasi
    let finalQty = Math.max(1, qty);
    
    if (item.stok_type === 'keluar' && finalQty > item.qty_before) {
        finalQty = item.qty_before;
    }
    
    item.qty_change = item.stok_type === 'masuk' ? finalQty : -finalQty;
    item.qty_after = item.qty_before + item.qty_change;
    
    updateSelectedStokItemsSection();
}

// [18] Fungsi untuk remove selected item
function removeSelectedStokItem(index) {
    if (index < 0 || index >= selectedStokItems.length) return;
    
    // Update checkbox
    const item = selectedStokItems[index];
    const checkbox = document.querySelector(`.select-item-checkbox-stok[data-id="${item.produk_id}"]`);
    if (checkbox) {
        checkbox.checked = false;
    }
    
    selectedStokItems.splice(index, 1);
    updateSelectedStokItemsSection();
}

// [19] Fungsi untuk clear all selected items
function clearAllSelectedStokItems() {
    if (selectedStokItems.length === 0) return;
    
    const confirmClear = confirm(`Hapus semua ${selectedStokItems.length} item yang dipilih?`);
    if (!confirmClear) return;
    
    // Uncheck semua checkbox
    document.querySelectorAll('.select-item-checkbox-stok:checked').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    selectedStokItems = [];
    updateSelectedStokItemsSection();
}

// [20] Fungsi untuk clear inventory table
function clearInventoryStokTable() {
    const tableEl = document.getElementById('inventoryTableStok');
    const tbody = document.getElementById('inventoryBodyStok');
    const noDataEl = document.getElementById('noInventoryDataStok');
    const countEl = document.getElementById('inventoryStokCount');
    
    if (tableEl) tableEl.style.display = 'none';
    if (tbody) tbody.innerHTML = '';
    if (noDataEl) noDataEl.style.display = 'block';
    if (countEl) countEl.textContent = '0 produk';
}

// [21] Fungsi untuk submit stok batch
async function submitStokBatch() {
    if (selectedStokItems.length === 0) {
        alert('Pilih minimal 1 item untuk di-request!');
        return;
    }
    
    try {
        const submitBtn = document.getElementById('submitStokRequestBtn');
        const originalText = submitBtn.innerHTML;
        
        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        
        const notes = document.getElementById('stokRequestNotes').value.trim();
        
        // Generate batch ID baru untuk setiap submit
        const batchId = generateStokBatchId();
        
        // Insert multiple records for each item
        const requests = selectedStokItems.map(item => ({
            batch_id: batchId,
            tanggal: new Date().toISOString().split('T')[0],
            outlet: currentOutletStok,
            stok_type: item.stok_type,
            updated_by: currentUserStok.nama_karyawan,
            nama_produk: item.nama_produk,
            group_produk: item.group_produk,
            qty_before: item.qty_before,
            qty_change: item.qty_change,
            qty_after: item.qty_after,
            approval_status: 'pending',
            notes: notes || null,
            created_at: new Date().toISOString()
        }));
        
        const { data, error } = await supabase
            .from('stok_update')
            .insert(requests);
        
        if (error) throw error;
        
        // Kirim notifikasi WA ke Owner
        try {
            await sendWAStokRequestNotification(requests, currentUserStok, notes, batchId);
        } catch (waError) {
            console.warn('Gagal kirim notifikasi WA:', waError);
        }
        
        // Success
        showStokToast(`✅ Request berhasil dikirim! Batch ID: ${batchId}`, 'success');
        
        // Reset form
        selectedStokItems = [];
        document.getElementById('stokRequestNotes').value = '';
        
        // Update UI
        updateSelectedStokItemsSection();
        
        // Uncheck semua checkbox
        document.querySelectorAll('.select-item-checkbox-stok:checked').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Reload history
        await loadKasirStokHistory();
        
        // Reload inventory
        await loadInventoryStokWithFilter();
        
    } catch (error) {
        console.error('Error submitting stok request:', error);
        showStokToast(`❌ Gagal mengirim request: ${error.message}`, 'error');
    } finally {
        // Reset button
        const submitBtn = document.getElementById('submitStokRequestBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Request';
        }
    }
}

// [22] Fungsi untuk load kasir history - DENGAN FILTER TANGGAL
async function loadKasirStokHistory() {
    try {
        const loadingEl = document.getElementById('loadingHistoryStokKasir');
        const tableEl = document.getElementById('historyTableStokKasir');
        
        if (loadingEl) loadingEl.style.display = 'block';
        if (tableEl) tableEl.style.display = 'none';
        
        // Get date filter
        const dateFilter = document.getElementById('filterHistoryDate').value;
        
        // Build query
        let query = supabase
            .from('stok_update')
            .select('*')
            .eq('outlet', currentOutletStok)
            .neq('approval_status', 'pending') // Hanya yang sudah diproses
            .order('created_at', { ascending: false });
        
        // Apply date filter
        applyDateFilter(query, dateFilter);
        
        const { data: requests, error } = await query;
        
        if (error) throw error;
        
        displayKasirStokHistory(requests || []);
        
    } catch (error) {
        console.error('Error loading kasir history:', error);
        const tbody = document.getElementById('historyBodyStokKasir');
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
        const loadingEl = document.getElementById('loadingHistoryStokKasir');
        const tableEl = document.getElementById('historyTableStokKasir');
        
        if (loadingEl) loadingEl.style.display = 'none';
        if (tableEl) tableEl.style.display = 'table';
    }
}

// [23] Display kasir history
function displayKasirStokHistory(requests) {
    const tbody = document.getElementById('historyBodyStokKasir');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!requests || requests.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-message">
                    <i class="fas fa-inbox"></i>
                    Belum ada riwayat request
                </td>
            </tr>
        `;
        return;
    }
    
    requests.forEach((request, index) => {
        const createdDate = new Date(request.created_at);
        const typeClass = request.stok_type === 'masuk' ? 'type-in' : 'type-out';
        const typeIcon = request.stok_type === 'masuk' ? 'fa-arrow-down' : 'fa-arrow-up';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                ${createdDate.toLocaleDateString('id-ID')}<br>
                <small>${createdDate.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</small>
            </td>
            <td><code title="${request.batch_id}">${request.batch_id ? request.batch_id.substring(0, 8) + '...' : '-'}</code></td>
            <td>
                <div class="item-name">${request.nama_produk}</div>
                <div class="item-sku"><small>Group: ${request.group_produk}</small></div>
            </td>
            <td>
                <span class="${typeClass}">
                    <i class="fas ${typeIcon}"></i>
                    ${request.stok_type === 'masuk' ? 'Masuk' : 'Keluar'}
                </span>
            </td>
            <td>${Math.abs(request.qty_change)}</td>
            <td>${request.qty_before}</td>
            <td>${request.qty_after}</td>
            <td>
                <span class="status-pill ${getApprovalStatusClass(request.approval_status)}">
                    ${getApprovalStatusText(request.approval_status)}
                </span>
            </td>
            <td>${request.approved_by || '-'}</td>
        `;
        tbody.appendChild(row);
    });
}

// [24] Fungsi untuk load data owner - DIMODIFIKASI untuk batch system
async function loadOwnerStokData() {
    try {
        console.log('=== LOAD OWNER STOK DATA ===');
        
        // Tampilkan loading
        const loadingPending = document.getElementById('loadingPendingStok');
        const pendingGrid = document.getElementById('pendingStokRequestsGrid');
        const loadingHistory = document.getElementById('loadingOwnerHistoryStok');
        
        if (loadingPending) loadingPending.style.display = 'block';
        if (pendingGrid) pendingGrid.style.display = 'none';
        if (loadingHistory) loadingHistory.style.display = 'block';
        
        // Get filter values
        const outletFilter = document.getElementById('filterOutletStokOwner')?.value || 'all';
        const statusFilter = document.getElementById('filterStatusStokOwner')?.value || 'pending';
        const dateFilter = document.getElementById('filterDateStokOwner')?.value || 'today';
        
        console.log('Active Filters:', { outlet: outletFilter, status: statusFilter, date: dateFilter });
        
        // Build query untuk pending requests
        let query = supabase
            .from('stok_update')
            .select('*')
            .eq('approval_status', 'pending') // HANYA YANG PENDING
            .order('created_at', { ascending: false });
        
        // Apply outlet filter
        if (outletFilter !== 'all') {
            query = query.eq('outlet', outletFilter);
        }
        
        // Apply date filter
        applyDateFilter(query, dateFilter);
        
        const { data: requests, error } = await query;
        
        if (error) throw error;
        
        console.log(`Pending requests loaded: ${requests?.length || 0}`);
        
        // Group requests by batch_id untuk pending section
        const groupedRequests = groupStokRequestsByBatch(requests || []);
        
        // Display pending requests dengan checklist
        displayPendingStokRequests(groupedRequests);
        
        // Load outlet dropdown
        await loadOutletDropdownStok();
        
        // Load statistics
        await loadOwnerStokStatistics(outletFilter, dateFilter);
        
        // Load history
        await loadOwnerStokHistory();
        
    } catch (error) {
        console.error('Error loading owner stok data:', error);
        showStokToast(`Gagal memuat data: ${error.message}`, 'error');
    } finally {
        // Hide loading
        const loadingPending = document.getElementById('loadingPendingStok');
        const pendingGrid = document.getElementById('pendingStokRequestsGrid');
        const loadingHistory = document.getElementById('loadingOwnerHistoryStok');
        
        if (loadingPending) loadingPending.style.display = 'none';
        if (pendingGrid) pendingGrid.style.display = 'block';
        if (loadingHistory) loadingHistory.style.display = 'none';
    }
}

// [25] Group stok requests by batch_id
function groupStokRequestsByBatch(requests) {
    const grouped = {};
    
    requests.forEach(request => {
        if (!request.batch_id) {
            // Jika tidak ada batch_id, gunakan ID sebagai batch individual
            request.batch_id = `IND-${request.id}`;
        }
        
        if (!grouped[request.batch_id]) {
            grouped[request.batch_id] = {
                batch_id: request.batch_id,
                outlet: request.outlet,
                updated_by: request.updated_by,
                created_at: request.created_at,
                notes: request.notes,
                items: [],
                total_items: 0,
                total_masuk: 0,
                total_keluar: 0
            };
        }
        
        grouped[request.batch_id].items.push(request);
        grouped[request.batch_id].total_items++;
        
        if (request.stok_type === 'masuk') {
            grouped[request.batch_id].total_masuk += Math.abs(request.qty_change);
        } else {
            grouped[request.batch_id].total_keluar += Math.abs(request.qty_change);
        }
    });
    
    return Object.values(grouped);
}

// [26] Display pending requests untuk Owner - DENGAN CHECKLIST
function displayPendingStokRequests(groupedRequests) {
    console.log('Displaying pending stok requests:', groupedRequests.length);
    
    const pendingGrid = document.getElementById('pendingStokRequestsGrid');
    const pendingCountEl = document.getElementById('pendingStokCount');
    
    if (!pendingGrid) return;
    
    // Update count - total items pending
    let totalPendingItems = 0;
    groupedRequests.forEach(group => {
        totalPendingItems += group.items.length;
    });
    
    if (pendingCountEl) {
        pendingCountEl.textContent = `${totalPendingItems} items (${groupedRequests.length} batch)`;
    }
    
    if (groupedRequests.length === 0) {
        pendingGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h4>Tidak ada request pending</h4>
                <p>Semua request sudah diproses</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    groupedRequests.forEach(group => {
        const date = new Date(group.created_at);
        const formattedDate = date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Inisialisasi selected items untuk batch ini
        if (!selectedOwnerItems[group.batch_id]) {
            selectedOwnerItems[group.batch_id] = [];
        }
        
        html += `
        <div class="batch-card" data-batch-id="${group.batch_id}">
            <div class="batch-header">
                <div class="batch-info">
                    <div class="info-row">
                        <div class="info-item">
                            <i class="fas fa-store"></i>
                            <strong>Outlet:</strong> ${group.outlet || '-'}
                        </div>
                        <div class="info-item">
                            <i class="fas fa-user"></i>
                            <strong>Requestor:</strong> ${group.updated_by || '-'}
                        </div>
                        <div class="info-item">
                            <i class="fas fa-calendar"></i>
                            <strong>Tanggal Request:</strong> ${formattedDate}
                        </div>
                    </div>
                    <div class="info-row">
                        <div class="info-item">
                            <i class="fas fa-hashtag"></i>
                            <strong>Batch ID:</strong> <code>${group.batch_id}</code>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-sticky-note"></i>
                            <strong>Catatan:</strong> ${group.notes || '-'}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="request-items-table">
                <div class="table-wrapper">
                    <table class="batch-items-table">
                        <thead>
                            <tr>
                                <th style="width: 50px; padding: 12px 15px;">
                                    <input type="checkbox" class="select-all-checkbox-stok" 
                                           data-batch-id="${group.batch_id}" 
                                           onchange="toggleSelectAllStokItems('${group.batch_id}', this.checked)">
                                </th>
                                <th style="width: 40px; padding: 12px 15px;">#</th>
                                <th style="padding: 12px 15px;">Produk</th>
                                <th style="width: 80px; padding: 12px 15px;">Jenis</th>
                                <th style="width: 80px; padding: 12px 15px;">Qty</th>
                                <th style="width: 100px; padding: 12px 15px;">Stok Sebelum</th>
                                <th style="width: 100px; padding: 12px 15px;">Stok Sesudah</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${group.items.map((item, index) => {
                                const isSelected = selectedOwnerItems[group.batch_id].includes(item.id);
                                const typeClass = item.stok_type === 'masuk' ? 'type-in' : 'type-out';
                                const typeText = item.stok_type === 'masuk' ? 'Masuk' : 'Keluar';
                                
                                return `
                                <tr data-item-id="${item.id}" data-batch-id="${group.batch_id}">
                                    <td style="padding: 12px 15px; text-align: center;">
                                        <input type="checkbox" 
                                               class="item-checkbox-stok" 
                                               data-item-id="${item.id}"
                                               data-batch-id="${group.batch_id}"
                                               ${isSelected ? 'checked' : ''}
                                               onchange="updateStokBatchSelection('${group.batch_id}')">
                                    </td>
                                    <td style="padding: 12px 15px;">${index + 1}</td>
                                    <td style="padding: 12px 15px;">
                                        <div class="item-name">${item.nama_produk}</div>
                                        <div class="item-sku">Group: ${item.group_produk || '-'}</div>
                                    </td>
                                    <td style="padding: 12px 15px;">
                                        <span class="${typeClass}">${typeText}</span>
                                    </td>
                                    <td style="padding: 12px 15px;" class="${typeClass}">
                                        ${item.stok_type === 'masuk' ? '+' : '-'}${Math.abs(item.qty_change)}
                                    </td>
                                    <td style="padding: 12px 15px;">${item.qty_before}</td>
                                    <td style="padding: 12px 15px;">${item.qty_after}</td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                        <tfoot>
                            <tr style="background: #f8f9fa;">
                                <td colspan="3" style="padding: 12px 15px;"><strong>Total Batch:</strong></td>
                                <td style="padding: 12px 15px;"></td>
                                <td style="padding: 12px 15px;">
                                    <span class="text-success">+${group.total_masuk}</span> | 
                                    <span class="text-danger">-${group.total_keluar}</span>
                                </td>
                                <td colspan="2" style="padding: 12px 15px;">
                                    <strong>${group.total_items} items</strong>
                                </td>
                                <td colspan="2" style="padding: 12px 15px;">
                                    <div class="action-buttons-row" style="display: flex; gap: 10px;">
                                        <button class="btn-approve-selected-stok" 
                                                data-batch-id="${group.batch_id}"
                                                onclick="approveSelectedStokItems('${group.batch_id}')"
                                                style="
                                                    flex-shrink: 0;
                                                    white-space: nowrap;
                                                    min-width: 120px;
                                                    width: auto;
                                                    display: inline-flex;
                                                    align-items: center;
                                                    justify-content: center;
                                                    gap: 8px;
                                                    height: 42px;
                                                    padding: 10px 16px;
                                                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                                                    color: white;
                                                    border: none;
                                                    border-radius: 6px;
                                                    cursor: pointer;
                                                    font-weight: 600;
                                                    font-size: 14px;
                                                ">
                                            <i class="fas fa-check"></i> Approve
                                        </button>
                                        <button class="btn-reject-selected-stok" 
                                                data-batch-id="${group.batch_id}"
                                                onclick="rejectSelectedStokItems('${group.batch_id}')"
                                                style="
                                                    flex-shrink: 0;
                                                    white-space: nowrap;
                                                    min-width: 120px;
                                                    width: auto;
                                                    display: inline-flex;
                                                    align-items: center;
                                                    justify-content: center;
                                                    gap: 8px;
                                                    height: 42px;
                                                    padding: 10px 16px;
                                                    background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
                                                    color: white;
                                                    border: none;
                                                    border-radius: 6px;
                                                    cursor: pointer;
                                                    font-weight: 600;
                                                    font-size: 14px;
                                                ">
                                            <i class="fas fa-times"></i> Reject
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
        `;
    });
    
    pendingGrid.innerHTML = html;
}

// [27] Fungsi untuk toggle select all items dalam batch
function toggleSelectAllStokItems(batchId, isChecked) {
    // Get all items in this batch
    const checkboxes = document.querySelectorAll(`
        .batch-card[data-batch-id="${batchId}"] 
        .item-checkbox-stok
    `);
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
        const itemId = checkbox.dataset.itemId;
        
        if (isChecked) {
            if (!selectedOwnerItems[batchId].includes(itemId)) {
                selectedOwnerItems[batchId].push(itemId);
            }
        } else {
            const index = selectedOwnerItems[batchId].indexOf(itemId);
            if (index > -1) {
                selectedOwnerItems[batchId].splice(index, 1);
            }
        }
    });
}

// [28] Fungsi untuk update batch selection status
function updateStokBatchSelection(batchId) {
    const checkboxes = document.querySelectorAll(`
        .batch-card[data-batch-id="${batchId}"] 
        .item-checkbox-stok
    `);
    
    const selectAllCheckbox = document.querySelector(`
        .batch-card[data-batch-id="${batchId}"] 
        .select-all-checkbox-stok
    `);
    
    if (checkboxes.length > 0 && selectAllCheckbox) {
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        const someChecked = Array.from(checkboxes).some(cb => cb.checked);
        
        selectAllCheckbox.checked = allChecked;
        selectAllCheckbox.indeterminate = someChecked && !allChecked;
        
        // Update selectedOwnerItems
        selectedOwnerItems[batchId] = [];
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                selectedOwnerItems[batchId].push(checkbox.dataset.itemId);
            }
        });
    }
}

// [29] Fungsi untuk approve selected items
async function approveSelectedStokItems(batchId) {
    try {
        const selectedItems = selectedOwnerItems[batchId] || [];
        
        if (selectedItems.length === 0) {
            alert('Pilih minimal 1 item untuk di-approve!');
            return;
        }
        
        const approveAll = confirm(`Approve ${selectedItems.length} item yang dipilih?\n\nItem yang tidak dipilih akan tetap status pending.`);
        if (!approveAll) return;
        
        // Get all selected items data
        const { data: itemsData } = await supabase
            .from('stok_update')
            .select('*')
            .in('id', selectedItems);
        
        if (!itemsData || itemsData.length === 0) {
            alert('Data item tidak ditemukan!');
            return;
        }
        
        // Update each item dengan REAL-TIME STOCK CHECK
        for (const item of itemsData) {
            // 1. Cek stok real-time
            const { data: produkData } = await supabase
                .from('produk')
                .select('stok')
                .eq('nama_produk', item.nama_produk)
                .eq('outlet', item.outlet)
                .single();
            
            if (!produkData) {
                console.warn(`Produk ${item.nama_produk} tidak ditemukan di outlet ${item.outlet}`);
                continue;
            }
            
            const stokSekarang = produkData.stok;
            const stokSetelah = stokSekarang + item.qty_change;
            
            // Validasi untuk stok keluar
            if (item.stok_type === 'keluar' && stokSetelah < 0) {
                alert(`❌ GAGAL APPROVE: Stok tidak cukup untuk ${item.nama_produk}!\n` +
                      `Stok saat ini: ${stokSekarang}\n` +
                      `Butuh keluar: ${Math.abs(item.qty_change)}`);
                return;
            }
            
            // 2. Update status request
            await supabase
                .from('stok_update')
                .update({
                    approval_status: 'approved',
                    approved_by: currentUserStok.nama_karyawan,
                    updated_at: new Date().toISOString(),
                    qty_before: stokSekarang,
                    qty_after: stokSetelah
                })
                .eq('id', item.id);
            
            // 3. Update stok produk
            await supabase
                .from('produk')
                .update({
                    stok: stokSetelah,
                    updated_at: new Date().toISOString()
                })
                .eq('nama_produk', item.nama_produk)
                .eq('outlet', item.outlet);
        }
        
        // Kirim notifikasi WA
        try {
            await sendWAStokApprovalNotification(itemsData, currentUserStok);
        } catch (waError) {
            console.warn('Gagal kirim notifikasi WA:', waError);
        }
        
        // Success message
        showStokToast(`✅ ${selectedItems.length} item berhasil di-approve!`, 'success');
        
        // Clear selection
        selectedOwnerItems[batchId] = [];
        
        // Reload data
        await loadOwnerStokData();
        
    } catch (error) {
        console.error('Error approving items:', error);
        showStokToast(`❌ Gagal approve items: ${error.message}`, 'error');
    }
}

// [30] Fungsi untuk reject selected items
async function rejectSelectedStokItems(batchId) {
    try {
        const selectedItems = selectedOwnerItems[batchId] || [];
        
        if (selectedItems.length === 0) {
            alert('Pilih minimal 1 item untuk di-reject!');
            return;
        }
        
        const reason = prompt('Masukkan alasan penolakan:');
        if (reason === null) return; // User cancelled
        if (!reason.trim()) {
            alert('Harap masukkan alasan penolakan');
            return;
        }
        
        const rejectAll = confirm(`Reject ${selectedItems.length} item yang dipilih?\n\nItem yang tidak dipilih akan tetap status pending.`);
        if (!rejectAll) return;
        
        // Update status in database
        const { error } = await supabase
            .from('stok_update')
            .update({
                approval_status: 'rejected',
                approved_by: currentUserStok.nama_karyawan,
                rejection_reason: reason,
                updated_at: new Date().toISOString()
            })
            .in('id', selectedItems);
        
        if (error) throw error;
        
        // Get rejected items for notification
        const { data: rejectedItems } = await supabase
            .from('stok_update')
            .select('*')
            .in('id', selectedItems);
        
        // Kirim notifikasi WA
        try {
            await sendWAStokRejectionNotification(rejectedItems || [], currentUserStok, reason);
        } catch (waError) {
            console.warn('Gagal kirim notifikasi WA:', waError);
        }
        
        showStokToast(`❌ ${selectedItems.length} item berhasil di-reject!`, 'success');
        
        // Clear selection
        selectedOwnerItems[batchId] = [];
        
        // Reload data
        await loadOwnerStokData();
        
    } catch (error) {
        console.error('Error rejecting items:', error);
        showStokToast(`❌ Gagal reject items: ${error.message}`, 'error');
    }
}

// [31] Fungsi untuk load owner statistics
async function loadOwnerStokStatistics(outletFilter, dateFilter) {
    try {
        // Pending count
        let pendingQuery = supabase
            .from('stok_update')
            .select('id', { count: 'exact', head: true })
            .eq('approval_status', 'pending');
        
        if (outletFilter !== 'all') {
            pendingQuery = pendingQuery.eq('outlet', outletFilter);
        }
        
        const { count: pendingCount } = await pendingQuery;
        
        // Approved today count
        let approvedQuery = supabase
            .from('stok_update')
            .select('id', { count: 'exact', head: true })
            .eq('approval_status', 'approved');
        
        if (outletFilter !== 'all') {
            approvedQuery = approvedQuery.eq('outlet', outletFilter);
        }
        
        // Apply today filter
        const today = new Date().toISOString().split('T')[0];
        approvedQuery = approvedQuery.gte('tanggal', today);
        
        const { count: approvedCount } = await approvedQuery;
        
        // Total items processed
        let processedQuery = supabase
            .from('stok_update')
            .select('id', { count: 'exact', head: true })
            .neq('approval_status', 'pending');
        
        if (outletFilter !== 'all') {
            processedQuery = processedQuery.eq('outlet', outletFilter);
        }
        
        applyDateFilter(processedQuery, dateFilter);
        
        const { count: processedCount } = await processedQuery;
        
        // Total outlets
        let outletsQuery = supabase
            .from('karyawan')
            .select('outlet')
            .not('outlet', 'is', null);
        
        const { data: outletsData } = await outletsQuery;
        const totalOutlets = outletsData ? [...new Set(outletsData.map(o => o.outlet).filter(Boolean))].length : 0;
        
        // Update UI
        document.getElementById('statPendingCount').textContent = pendingCount || 0;
        document.getElementById('statApprovedToday').textContent = approvedCount || 0;
        document.getElementById('statItemsProcessed').textContent = processedCount || 0;
        document.getElementById('statTotalOutlets').textContent = totalOutlets || 0;
        
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// [32] Load outlet dropdown untuk owner
async function loadOutletDropdownStok() {
    const select = document.getElementById('filterOutletStokOwner');
    if (!select) return;
    
    try {
        const { data: outlets, error } = await supabase
            .from('karyawan')
            .select('outlet')
            .not('outlet', 'is', null);
        
        if (error) {
            console.error('Error loading outlets:', error);
            return;
        }
        
        // Get unique outlets
        const outletsList = outlets ? [...new Set(outlets.map(o => o.outlet).filter(Boolean))] : [];
        
        let options = '<option value="all">Semua Outlet</option>';
        outletsList.forEach(outlet => {
            options += `<option value="${outlet}">${outlet}</option>`;
        });
        
        select.innerHTML = options;
        
    } catch (error) {
        console.error('Error loading outlets:', error);
        select.innerHTML = '<option value="all">Semua Outlet</option>';
    }
}

// [33] Fungsi untuk load owner history
async function loadOwnerStokHistory() {
    try {
        const loadingEl = document.getElementById('loadingOwnerHistoryStok');
        const tableEl = document.getElementById('historyTableStokOwner');
        
        if (loadingEl) loadingEl.style.display = 'block';
        if (tableEl) tableEl.style.display = 'none';
        
        // Get filter values
        const outletFilter = document.getElementById('filterOutletStokOwner')?.value || 'all';
        const dateFilter = document.getElementById('filterOwnerHistoryDate')?.value || 'today';
        
        // Build query
        let query = supabase
            .from('stok_update')
            .select('*')
            .neq('approval_status', 'pending') // Hanya yang sudah diproses
            .order('created_at', { ascending: false })
            .limit(50);
        
        // Apply outlet filter
        if (outletFilter !== 'all') {
            query = query.eq('outlet', outletFilter);
        }
        
        // Apply date filter
        applyDateFilter(query, dateFilter);
        
        const { data: requests, error } = await query;
        
        if (error) throw error;
        
        displayOwnerStokHistory(requests || []);
        
    } catch (error) {
        console.error('Error loading owner history:', error);
        const tbody = document.getElementById('historyBodyStokOwner');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="12" class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        Gagal memuat history: ${error.message}
                    </td>
                </tr>
            `;
        }
    } finally {
        const loadingEl = document.getElementById('loadingOwnerHistoryStok');
        const tableEl = document.getElementById('historyTableStokOwner');
        
        if (loadingEl) loadingEl.style.display = 'none';
        if (tableEl) tableEl.style.display = 'table';
    }
}

// [34] Display owner history
function displayOwnerStokHistory(requests) {
    const tbody = document.getElementById('historyBodyStokOwner');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!requests || requests.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="12" class="empty-message">
                    <i class="fas fa-history"></i>
                    Tidak ada history request
                </td>
            </tr>
        `;
        return;
    }
    
    requests.forEach(request => {
        const createdDate = new Date(request.created_at);
        const typeClass = request.stok_type === 'masuk' ? 'type-in' : 'type-out';
        const typeText = request.stok_type === 'masuk' ? 'Masuk' : 'Keluar';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                ${createdDate.toLocaleDateString('id-ID')}<br>
                <small>${createdDate.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</small>
            </td>
            <td><code title="${request.batch_id}">${request.batch_id ? request.batch_id.substring(0, 8) + '...' : '-'}</code></td>
            <td>${request.outlet || '-'}</td>
            <td>${request.updated_by || '-'}</td>
            <td>
                <div class="item-name">${request.nama_produk}</div>
                <div class="item-sku"><small>Group: ${request.group_produk}</small></div>
            </td>
            <td>
                <span class="${typeClass}">${typeText}</span>
            </td>
            <td>${Math.abs(request.qty_change)}</td>
            <td>${request.qty_before}</td>
            <td>${request.qty_after}</td>
            <td>
                <span class="status-pill ${getApprovalStatusClass(request.approval_status)}">
                    ${getApprovalStatusText(request.approval_status)}
                </span>
            </td>
            <td>${request.approved_by || '-'}</td>
            <td>${request.notes || '-'}</td>
        `;
        tbody.appendChild(row);
    });
}

// [35] Apply date filter to query
function applyDateFilter(query, dateFilter) {
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
    
    return query;
}

// [36] WA Notification Functions

// Helper function untuk mendapatkan WA config dari global scope
function getWAConfig() {
    return {
        apiUrl: typeof WA_API_URL !== 'undefined' ? WA_API_URL : window.WA_API_URL,
        apiKey: typeof WA_API_KEY !== 'undefined' ? WA_API_KEY : window.WA_API_KEY,
        chatId: typeof WA_CHAT_ID !== 'undefined' ? WA_CHAT_ID : window.WA_CHAT_ID,
        ownerPhone: typeof WA_OWNER_PHONE !== 'undefined' ? WA_OWNER_PHONE : window.WA_OWNER_PHONE
    };
}

// Kirim notifikasi saat kasir submit request
async function sendWAStokRequestNotification(requests, kasirData, notes, batchId) {
    try {
        console.log('📤 Mengirim notifikasi WhatsApp untuk request stok...');
        
        const waConfig = getWAConfig();
        
        if (!waConfig.apiUrl || !waConfig.apiKey) {
            console.warn('Konfigurasi WA API tidak ditemukan');
            return false;
        }
        
        // Format nomor owner
        let phoneNumber = waConfig.ownerPhone || '0811159429';
        if (phoneNumber.startsWith('0')) {
            phoneNumber = '62' + phoneNumber.substring(1);
        }
        const chatId = phoneNumber + '@c.us';
        
        // Format detail items
        let itemsList = '';
        let totalMasuk = 0;
        let totalKeluar = 0;
        
        requests.forEach((req, index) => {
            const typeIcon = req.stok_type === 'masuk' ? '⬆️' : '⬇️';
            const changeSign = req.stok_type === 'masuk' ? '+' : '-';
            
            if (req.stok_type === 'masuk') {
                totalMasuk += Math.abs(req.qty_change);
            } else {
                totalKeluar += Math.abs(req.qty_change);
            }
            
            itemsList += `${index + 1}. ${req.nama_produk} ${changeSign}${Math.abs(req.qty_change)} unit (${req.qty_before} → ${req.qty_after})\n`;
        });
        
        const message = `📦 *PERMINTAAN UPDATE STOK - MENUNGGU APPROVAL*
=============================
🏬 Outlet: ${requests[0].outlet}
👤 Kasir: ${kasirData.nama_karyawan}
🆔 Batch: ${batchId}
📅 Tanggal: ${formatDateStok(requests[0].tanggal)}
⏰ Waktu: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
=============================
📋 *DETAIL ITEMS:*
${itemsList}
=============================
📊 *SUMMARY:*
   📈 Stok Masuk: ${totalMasuk} unit
   📉 Stok Keluar: ${totalKeluar} unit
   📦 Total Items: ${requests.length}
=============================
📝 *Catatan:* ${notes || 'Tidak ada catatan'}
=============================
📋 *Status:* ⏳ MENUNGGU APPROVAL OWNER
=============================
⚠️ *Silakan buka aplikasi untuk approve/reject*
⏰ *Mohon segera diproses maksimal 24 jam*`;
        
        const response = await fetch(waConfig.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': waConfig.apiKey
            },
            body: JSON.stringify({
                session: 'Session1',
                chatId: chatId,
                text: message
            })
        });
        
        console.log('📤 Notifikasi request stok terkirim ke owner');
        return response.ok;
        
    } catch (error) {
        console.error('Error mengirim notifikasi request stok:', error);
        return false;
    }
}

// Kirim notifikasi saat owner approve
async function sendWAStokApprovalNotification(approvedItems, ownerData) {
    try {
        console.log('📤 Mengirim notifikasi WhatsApp untuk approval stok...');
        
        const waConfig = getWAConfig();
        
        if (!waConfig.apiUrl || !waConfig.apiKey) {
            console.warn('Konfigurasi WA API tidak ditemukan');
            return false;
        }
        
        // Group by batch
        const groupedByBatch = {};
        approvedItems.forEach(item => {
            if (!groupedByBatch[item.batch_id]) {
                groupedByBatch[item.batch_id] = {
                    outlet: item.outlet,
                    updated_by: item.updated_by,
                    items: []
                };
            }
            groupedByBatch[item.batch_id].items.push(item);
        });
        
        // Kirim untuk setiap batch
        for (const [batchId, batchData] of Object.entries(groupedByBatch)) {
            // Format detail items
            let itemsList = '';
            batchData.items.forEach((item, index) => {
                const typeIcon = item.stok_type === 'masuk' ? '⬆️' : '⬇️';
                const changeSign = item.stok_type === 'masuk' ? '+' : '-';
                
                itemsList += `${index + 1}. ${item.nama_produk} ${changeSign}${Math.abs(item.qty_change)} unit (${item.qty_before} → ${item.qty_after})\n`;
            });
            
            const message = `✅ *STOK UPDATE - DISETUJUI*
=============================
🏬 Outlet: ${batchData.outlet}
👤 Kasir: ${batchData.updated_by}
👑 Approver: ${ownerData.nama_karyawan}
🆔 Batch: ${batchId}
📅 Tanggal: ${formatDateStok(new Date())}
⏰ Waktu: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
=============================
📋 *ITEMS YANG DISETUJUI:*
${itemsList}
=============================
✅ *Status:* STOK BERHASIL DIPERBARUI
📱 *Aplikasi:* Babeh Barbershop POS`;
            
            // Kirim ke group
            const response1 = await fetch(waConfig.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': waConfig.apiKey
                },
                body: JSON.stringify({
                    session: 'Session1',
                    chatId: waConfig.chatId || '62811159429-1533260196@g.us',
                    text: message
                })
            });
            
            console.log(`📤 Notifikasi approval batch ${batchId} terkirim ke group`);
        }
        
        return true;
        
    } catch (error) {
        console.error('Error mengirim notifikasi approval stok:', error);
        return false;
    }
}
// Kirim notifikasi saat owner reject
async function sendWAStokRejectionNotification(rejectedItems, ownerData, reason) {
    try {
        console.log('📤 Mengirim notifikasi WhatsApp untuk rejection stok...');
        
        const waConfig = getWAConfig();
        
        if (!waConfig.apiUrl || !waConfig.apiKey) {
            console.warn('Konfigurasi WA API tidak ditemukan');
            return false;
        }
        
        // Group by batch
        const groupedByBatch = {};
        rejectedItems.forEach(item => {
            if (!groupedByBatch[item.batch_id]) {
                groupedByBatch[item.batch_id] = {
                    outlet: item.outlet,
                    updated_by: item.updated_by,
                    items: []
                };
            }
            groupedByBatch[item.batch_id].items.push(item);
        });
        
        // Kirim untuk setiap batch
        for (const [batchId, batchData] of Object.entries(groupedByBatch)) {
            // Format detail items
            let itemsList = '';
            batchData.items.forEach((item, index) => {
                const typeIcon = item.stok_type === 'masuk' ? '⬆️' : '⬇️';
                const changeSign = item.stok_type === 'masuk' ? '+' : '-';
                
                itemsList += `${index + 1}. ${item.nama_produk} ${changeSign}${Math.abs(item.qty_change)} unit\n`;
            });
            
            const message = `❌ *STOK UPDATE - DITOLAK*
=============================
🏬 Outlet: ${batchData.outlet}
👤 Kasir: ${batchData.updated_by}
👑 Rejector: ${ownerData.nama_karyawan}
🆔 Batch: ${batchId}
📅 Tanggal: ${formatDateStok(new Date())}
⏰ Waktu: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
=============================
📋 *ITEMS YANG DITOLAK:*
${itemsList}
=============================
📝 *Alasan Penolakan:*
${reason}
=============================
❌ *Status:* REQUEST DITOLAK
📱 *Aplikasi:* Babeh Barbershop POS`;
            
            // Kirim ke group
            const response = await fetch(waConfig.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': waConfig.apiKey
                },
                body: JSON.stringify({
                    session: 'Session1',
                    chatId: waConfig.chatId || '62811159429-1533260196@g.us',
                    text: message
                })
            });
            
            console.log(`📤 Notifikasi rejection batch ${batchId} terkirim ke group`);
        }
        
        return true;
        
    } catch (error) {
        console.error('Error mengirim notifikasi rejection stok:', error);
        return false;
    }
}

// [37] Helper Functions

function generateStokBatchId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `STK-${timestamp}-${random}`.toUpperCase();
}

function getStockStatusClass(currentStock) {
    if (!currentStock || currentStock <= 0) return 'stock-out';
    if (currentStock <= 10) return 'stock-low';
    return 'stock-ok';
}

function getApprovalStatusClass(status) {
    switch(status) {
        case 'approved': return 'status-approved';
        case 'pending': return 'status-pending';
        case 'rejected': return 'status-rejected';
        default: return 'status-unknown';
    }
}

function getApprovalStatusText(status) {
    switch(status) {
        case 'approved': return 'Disetujui';
        case 'pending': return 'Menunggu';
        case 'rejected': return 'Ditolak';
        default: return status;
    }
}

function formatDateStok(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

function showStokToast(message, type = 'info') {
    // Hapus toast sebelumnya jika ada
    const existingToast = document.getElementById('stokToast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Buat toast element
    const toast = document.createElement('div');
    toast.id = 'stokToast';
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
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

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// [38] Global functions untuk onclick events
window.toggleStokItemSelection = toggleStokItemSelection;
window.addSingleStokItemToRequest = addSingleStokItemToRequest;
window.updateSelectedStokItemType = updateSelectedStokItemType;
window.adjustSelectedStokItemQty = adjustSelectedStokItemQty;
window.updateSelectedStokItemQty = updateSelectedStokItemQty;
window.removeSelectedStokItem = removeSelectedStokItem;
window.clearAllSelectedStokItems = clearAllSelectedStokItems;
window.loadKasirStokHistory = loadKasirStokHistory;
window.loadOwnerStokData = loadOwnerStokData;
window.loadOwnerStokHistory = loadOwnerStokHistory;
window.toggleSelectAllStokItems = toggleSelectAllStokItems;
window.updateStokBatchSelection = updateStokBatchSelection;
window.approveSelectedStokItems = approveSelectedStokItems;
window.rejectSelectedStokItems = rejectSelectedStokItems;

// ========== END OF FILE ==========
