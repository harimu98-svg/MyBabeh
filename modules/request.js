// ========== FUNGSI MENU KOMPONEN - REQUEST ==========
// =================================================

// Variabel global untuk request
let currentKaryawanRequest = null;
let currentUserOutletRequest = null;
let isOwnerRequest = false;
let selectedItems = []; // Untuk menyimpan items yang akan di-request
let batchId = null; // ID batch untuk grouping multi-item
let inventoryData = []; // Untuk menyimpan data inventory

// Variabel untuk pagination history kasir
let currentKasirHistoryPage = 1;
let kasirHistoryTotalRecords = 0;
const KASIR_HISTORY_PER_PAGE = 10;

// [1] Fungsi untuk tampilkan halaman request
async function showRequestPage() {
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
        
        currentKaryawanRequest = {
            nama_karyawan: namaKaryawan,
            role: karyawanData.role,
            outlet: karyawanData.outlet,
            posisi: karyawanData.posisi
        };
        
        currentUserOutletRequest = karyawanData.outlet;
        isOwnerRequest = karyawanData.role === 'owner';
        
        // Sembunyikan main app, tampilkan halaman request
        document.getElementById('appScreen').style.display = 'none';
        
        // Buat container halaman request
        createRequestPage();
        
        // Generate batch ID untuk grouping
        batchId = generateBatchId();
        
        // Load data berdasarkan role
        if (isOwnerRequest) {
            await loadRequestsForOwner();
        } else {
            // Untuk kasir: load filter dan history
            await loadKasirInitialData();
        }
        
    } catch (error) {
        console.error('Error in showRequestPage:', error);
        alert('Gagal memuat halaman request!');
    }
}

// [2] Fungsi untuk buat halaman request - DIMODIFIKASI
function createRequestPage() {
    // Hapus halaman request sebelumnya jika ada
    const existingPage = document.getElementById('requestPage');
    if (existingPage) {
        existingPage.remove();
    }
    
    // Tentukan konten berdasarkan role
    const isKasir = currentKaryawanRequest?.role === 'kasir';
    
    // Buat container halaman request
    const requestPage = document.createElement('div');
    requestPage.id = 'requestPage';
    requestPage.className = 'request-page';
    
    requestPage.innerHTML = `
        <!-- Header -->
        <header class="request-header">
            <button class="back-btn" id="backToMainFromRequest">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h2><i class="fas fa-comment-dots"></i> Request Barang</h2>
            <div class="header-actions">
                ${isKasir ? `
                    <button class="refresh-btn" id="refreshRequestsKasir" title="Refresh">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                ` : `
                    <button class="refresh-btn" id="refreshRequests" title="Refresh">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                `}
            </div>
        </header>
        
        <!-- Info Header -->
        <div class="request-info-header">
            <div class="info-row">
                <div class="info-item">
                    <i class="fas fa-calendar-day"></i>
                    <span id="currentDate">${new Date().toLocaleDateString('id-ID', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-user"></i>
                    <span id="userName">${currentKaryawanRequest?.nama_karyawan || '-'}</span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-item">
                    <i class="fas fa-briefcase"></i>
                    <span id="userPosition">${currentKaryawanRequest?.posisi || '-'}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-store"></i>
                    <span id="userOutlet">${currentUserOutletRequest || '-'}</span>
                </div>
            </div>
        </div>
        
        <!-- Untuk KASIR: Form Request Multi-Item - DIMODIFIKASI -->
        ${isKasir ? `
        <div class="kasir-request-section">
            <!-- Filter Section - 2 BARIS -->
            <div class="search-filter-section">
                <!-- BARIS 1: 3 Filter -->
                <div class="filter-row-top">
                    <div class="filter-group">
                        <label for="filterGroup"><i class="fas fa-layer-group"></i> Group:</label>
                        <select id="filterGroup" class="group-select">
                            <option value="">Semua Group</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label for="filterCategory"><i class="fas fa-tags"></i> Kategori:</label>
                        <select id="filterCategory" class="category-select" disabled>
                            <option value="">Pilih Group dulu</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label for="filterStatus"><i class="fas fa-check-circle"></i> Status:</label>
                        <select id="filterStatus" class="status-select">
                            <option value="all">Semua Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
                
                <!-- BARIS 2: Search + Filter Button -->
                <div class="filter-row-bottom" style="display: flex; gap: 10px; align-items: stretch;">
                    <div class="search-box" style="flex: 1;">
                        <i class="fas fa-search"></i>
                        <input type="text" id="searchInventory" placeholder="Cari item..." style="width: 100%;">
                        <button class="clear-search" id="clearSearchBtn" title="Clear search">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <button class="btn-search-action" id="applyFilterBtn" style="flex-shrink: 0; min-width: 120px;">
                        <i class="fas fa-filter"></i> Terapkan
                    </button>
                </div>
            </div>
            
            <!-- Inventory List Table - DIMODIFIKASI: Scroll Horizontal -->
            <div class="inventory-table-section">
                <div class="section-header">
                    <h3><i class="fas fa-boxes"></i> Daftar Inventory</h3>
                    <span class="item-count" id="inventoryCount">0 item</span>
                </div>
                <div class="inventory-table-container">
                    <div class="loading" id="loadingInventory">Memuat inventory...</div>
                    <div class="table-wrapper">
                        <table class="inventory-table horizontal-scroll" id="inventoryTable" style="display: none;">
                            <thead>
                                <tr>
                                    <th width="50px">Pilih</th>
                                    <th width="150px">Nama Item</th>
                                    <th width="100px">SKU</th>
                                    <th width="120px">Kategori</th>
                                    <th width="100px">Group</th>
                                    <th width="80px">Status</th>
                                    <th width="100px">Harga Satuan</th>
                                    <th width="80px">Unit Type</th>
                                    <th width="100px">Action</th>
                                </tr>
                            </thead>
                            <tbody id="inventoryBody">
                                <!-- Inventory items akan diisi di sini -->
                            </tbody>
                        </table>
                    </div>
                    <div class="no-data" id="noInventoryData" style="display: none;">
                        <i class="fas fa-box-open"></i>
                        <p>Tidak ada data inventory</p>
                        <p class="hint">Gunakan filter atau search untuk menampilkan data</p>
                    </div>
                </div>
            </div>
            
            <!-- Selected Items Section - DIMODIFIKASI: Tombol Submit dipindah -->
            <div class="selected-items-section" id="selectedItemsSection" style="display: none;">
                <div class="section-header">
                    <h3><i class="fas fa-shopping-cart"></i> Items yang akan di-Request <span class="badge" id="selectedCount">0</span></h3>
                    <button class="btn-clear" id="clearAllSelected">
                        <i class="fas fa-trash"></i> Hapus Semua
                    </button>
                </div>
                
                <!-- Table Selected Items -->
                <div class="selected-items-table-container">
                    <table class="selected-items-table horizontal-scroll" id="selectedItemsTable">
                        <thead>
                            <tr>
                                <th width="150px">Item</th>
                                <th width="100px">Kategori</th>
                                <th width="80px">Qty</th>
                                <th width="120px">Harga Satuan</th>
                                <th width="120px">Subtotal</th>
                                <th width="80px">Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="selectedItemsBody">
                            <!-- Items terpilih akan diisi di sini -->
                        </tbody>
                    </table>
                </div>
                
                <!-- Notes & Submit Button - DIMODIFIKASI: Tombol Submit di sini -->
                <div class="selected-notes-submit">
                    <div class="notes-section">
                        <label for="requestNotes"><i class="fas fa-sticky-note"></i> Catatan (opsional):</label>
                        <textarea id="requestNotes" placeholder="Tambahkan catatan untuk request ini..." rows="2"></textarea>
                    </div>
                    
                    <div class="submit-section">
                        <div class="total-info">
                            <div class="total-row">
                                <span class="total-label">Total Items:</span>
                                <span class="total-value" id="totalItemsCount">0</span>
                            </div>
                            <div class="total-row">
                                <span class="total-label">Total Quantity:</span>
                                <span class="total-value" id="totalQuantity">0</span>
                            </div>
                            <div class="total-row main-total">
                                <span class="total-label">Total Amount:</span>
                                <span class="total-value" id="totalRequestAmount">Rp 0</span>
                            </div>
                        </div>
                        <button class="submit-btn" id="submitRequestBtn" disabled>
                            <i class="fas fa-paper-plane"></i> Submit Request
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Request History untuk Kasir - DIMODIFIKASI: Scroll Horizontal -->
            <div class="kasir-history-section">
                <div class="section-header">
                    <h3><i class="fas fa-history"></i> Request History - Semua Karyawan di Outlet ${currentUserOutletRequest}</h3>
                    <div class="history-controls">
                        <!-- Filter Tanggal -->
                        <div class="filter-group" style="margin-right: 10px;">
                            <select id="filterDateKasir" class="date-select">
                                <option value="today">Hari Ini</option>
                                <option value="week">7 Hari Terakhir</option>
                                <option value="month">Bulan Ini</option>
                                <option value="all">Semua</option>
                            </select>
                        </div>
                        <button class="btn-refresh-history" onclick="loadKasirHistory()">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>
                <div class="history-table-container">
                    <div class="loading" id="loadingHistoryKasir">Memuat history request...</div>
                    <div class="table-wrapper">
                        <table class="history-table horizontal-scroll" id="historyTableKasir" style="display: none;">
                            <thead>
                                <tr>
                                    <th width="120px">Tanggal</th>
                                    <th width="100px">Batch ID</th>
                                    <th width="120px">Karyawan</th>
                                    <th width="150px">Item</th>
                                    <th width="80px">Qty</th>
                                    <th width="100px">Harga Satuan</th>
                                    <th width="120px">Subtotal</th>
                                    <th width="100px">Status</th>
                                    <th width="150px">Disetujui Oleh</th>
                                    <th width="150px">Tanggal Approve</th>
                                </tr>
                            </thead>
                            <tbody id="historyBodyKasir">
                                <!-- History akan diisi di sini -->
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Pagination Controls -->
                <div class="pagination-section" id="kasirHistoryPagination" style="display: none;">
                    <div class="pagination-info">
                        Menampilkan <span id="kasirHistoryStart">0</span>-<span id="kasirHistoryEnd">0</span> dari <span id="kasirHistoryTotal">0</span> records
                    </div>
                    <div class="pagination-controls">
                        <button class="pagination-btn" id="firstPageKasir" disabled>
                            <i class="fas fa-angle-double-left"></i>
                        </button>
                        <button class="pagination-btn" id="prevPageKasir" disabled>
                            <i class="fas fa-angle-left"></i>
                        </button>
                        <span class="page-info">
                            Halaman <span id="currentPageKasir">1</span> dari <span id="totalPagesKasir">1</span>
                        </span>
                        <button class="pagination-btn" id="nextPageKasir" disabled>
                            <i class="fas fa-angle-right"></i>
                        </button>
                        <button class="pagination-btn" id="lastPageKasir" disabled>
                            <i class="fas fa-angle-double-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        ` : `
        <!-- Untuk OWNER: Approval Requests - DIMODIFIKASI: TAMBAH CHECKBOX -->
        <div class="owner-request-section">
            <!-- Filter untuk Owner -->
            <div class="owner-filter-section">
                <div class="filter-row">
                    <div class="filter-group">
                        <label for="filterOutletOwner"><i class="fas fa-store"></i> Outlet:</label>
                        <select id="filterOutletOwner" class="outlet-select">
                            <option value="all">Semua Outlet</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="filterStatusOwner"><i class="fas fa-filter"></i> Status:</label>
                        <select id="filterStatusOwner" class="status-select">
                            <option value="all">Semua Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="partially_approved">Partially Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="filterDateOwner"><i class="fas fa-calendar"></i> Periode:</label>
                        <select id="filterDateOwner" class="date-select">
                            <option value="today">Hari Ini</option>
                            <option value="week">7 Hari Terakhir</option>
                            <option value="month">Bulan Ini</option>
                            <option value="all">Semua</option>
                        </select>
                    </div>
                    <button class="btn-apply-filter" onclick="loadRequestsForOwner()">
                        <i class="fas fa-filter"></i> Terapkan
                    </button>
                </div>
            </div>
            
            <!-- Pending Requests -->
            <div class="pending-requests-section">
                <div class="section-header">
                    <h3><i class="fas fa-clock"></i> Pending Requests</h3>
                    <div class="request-stats">
                        <span id="pendingCount">0 requests</span>
                    </div>
                </div>
                <div class="pending-requests-container">
                    <div class="loading" id="loadingPending">Memuat data request...</div>
                    <div id="pendingRequestsGrid" style="display: none;">
                        <!-- Grouped requests akan diisi di sini -->
                    </div>
                </div>
            </div>
            
            <!-- Request History untuk Owner -->
            <div class="request-history-section">
                <div class="section-header">
                    <h3><i class="fas fa-history"></i> Request History (Semua Outlet)</h3>
                </div>
                <div class="history-table-container">
                    <div class="loading" id="loadingHistory">Memuat history...</div>
                    <div class="table-wrapper">
                        <table class="history-table horizontal-scroll" id="historyTable" style="display: none;">
                            <thead>
                                <tr>
                                    <th width="120px">Tanggal</th>
                                    <th width="100px">Batch ID</th>
                                    <th width="100px">Outlet</th>
                                    <th width="120px">Karyawan</th>
                                    <th width="150px">Item</th>
                                    <th width="80px">Qty</th>
                                    <th width="120px">Harga Satuan</th>
                                    <th width="120px">Subtotal</th>
                                    <th width="100px">Status</th>
                                    <th width="120px">Disetujui Oleh</th>
                                    <th width="150px">Catatan</th>
                                </tr>
                            </thead>
                            <tbody id="historyBody">
                                <!-- History akan diisi di sini -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        `}
        
        <!-- Footer -->
        <div class="request-footer">
            <p><i class="fas fa-info-circle"></i> ${isKasir ? 'Pilih item dari inventory dan tambahkan ke request' : 'Review dan approve/reject request dari karyawan'}</p>
        </div>
    `;
    
    document.body.appendChild(requestPage);
    
    // Setup event listeners
    setupRequestPageEvents();
    
    // Tambahkan CSS untuk styling
    addRequestPageStyles();
}

// [3] Setup event listeners untuk halaman request
function setupRequestPageEvents() {
    // Tombol kembali
    document.getElementById('backToMainFromRequest').addEventListener('click', () => {
        document.getElementById('requestPage').remove();
        document.getElementById('appScreen').style.display = 'block';
    });
    
    const isKasir = currentKaryawanRequest?.role === 'kasir';
    
    if (isKasir) {
        // KASIR: Setup event listeners
        setupKasirRequestEvents();
    } else {
        // OWNER: Setup event listeners
        setupOwnerRequestEvents();
    }
}

// [4] Setup events untuk KASIR - DIMODIFIKASI
function setupKasirRequestEvents() {
    // Tombol submit request
    const submitBtn = document.getElementById('submitRequestBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitRequest);
    }
    
    // Tombol refresh
    const refreshBtn = document.getElementById('refreshRequestsKasir');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await loadKasirInitialData();
        });
    }
    
    // Group filter - Ketika berubah, update category filter
    const groupFilter = document.getElementById('filterGroup');
    if (groupFilter) {
        groupFilter.addEventListener('change', async function() {
            const categoryFilter = document.getElementById('filterCategory');
            
            if (this.value) {
                // Enable category filter dan load options berdasarkan group
                categoryFilter.disabled = false;
                await loadCategoryOptionsByGroup(this.value);
            } else {
                // Disable category filter
                categoryFilter.disabled = true;
                categoryFilter.innerHTML = '<option value="">Pilih Group dulu</option>';
            }
        });
    }
    
    // Apply filter button
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', async () => {
            await loadInventoryWithFilter();
        });
    }
    
    // Search input
    const searchInput = document.getElementById('searchInventory');
    if (searchInput) {
        searchInput.addEventListener('keyup', debounce(async function(e) {
            if (e.key === 'Enter') {
                await loadInventoryWithFilter();
            }
        }, 500));
    }
    
    // Clear search button
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            document.getElementById('searchInventory').value = '';
        });
    }
    
    // Clear all selected button
    const clearAllBtn = document.getElementById('clearAllSelected');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllSelectedItems);
    }
    
    // Setup pagination events
    setupKasirPaginationEvents();
}

// [5] Setup events untuk OWNER - DIMODIFIKASI
function setupOwnerRequestEvents() {
    // Tombol refresh
    const refreshBtn = document.getElementById('refreshRequests');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await loadRequestsForOwner();
        });
    }
    
    // Filter dropdowns
    document.getElementById('filterOutletOwner')?.addEventListener('change', async () => {
        await loadRequestsForOwner();
    });
    
    document.getElementById('filterStatusOwner')?.addEventListener('change', async () => {
        await loadRequestsForOwner();
    });
    
    document.getElementById('filterDateOwner')?.addEventListener('change', async () => {
        await loadRequestsForOwner();
    });
}

// [6] Fungsi untuk load initial data kasir - DIMODIFIKASI
async function loadKasirInitialData() {
    try {
        // Load filter options
        await loadFilterOptions();
        
        // Kosongkan inventory table (sesuai permintaan)
        clearInventoryTable();
        
        // Load history request
        await loadKasirHistory();
        
    } catch (error) {
        console.error('Error loading kasir data:', error);
        alert('Gagal memuat data: ' + error.message);
    }
}

// [7] Fungsi untuk load filter options
async function loadFilterOptions() {
    const groupSelect = document.getElementById('filterGroup');
    
    if (groupSelect) {
        try {
            // Load distinct groups dari database
            const { data: groupsData, error } = await supabase
                .from('inventory')
                .select('item_group')
                .not('item_group', 'is', null)
                .eq('status', 'active')
                .order('item_group');
            
            if (!error && groupsData) {
                const groups = [...new Set(groupsData.map(item => item.item_group).filter(Boolean))];
                
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

// [8] Fungsi untuk load kategori berdasarkan group
async function loadCategoryOptionsByGroup(selectedGroup) {
    const categoryFilter = document.getElementById('filterCategory');
    
    try {
        // Query distinct categories untuk group tertentu
        const { data, error } = await supabase
            .from('inventory')
            .select('category')
            .eq('item_group', selectedGroup)
            .eq('status', 'active')
            .not('category', 'is', null)
            .order('category');
        
        if (error) throw error;
        
        // Get unique categories
        const categories = [...new Set(data.map(item => item.category).filter(Boolean))];
        
        categoryFilter.innerHTML = `
            <option value="">Semua Kategori</option>
            ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
        `;
        
    } catch (error) {
        console.error('Error loading categories:', error);
        categoryFilter.innerHTML = '<option value="">Error loading</option>';
    }
}

// [9] Fungsi untuk load inventory dengan filter - BARU
async function loadInventoryWithFilter() {
    try {
        const loadingEl = document.getElementById('loadingInventory');
        const tableEl = document.getElementById('inventoryTable');
        const noDataEl = document.getElementById('noInventoryData');
        const countEl = document.getElementById('inventoryCount');
        
        if (loadingEl) loadingEl.style.display = 'block';
        if (tableEl) tableEl.style.display = 'none';
        if (noDataEl) noDataEl.style.display = 'none';
        
        // Get filter values
        const groupFilter = document.getElementById('filterGroup').value;
        const categoryFilter = document.getElementById('filterCategory');
        const categoryValue = !categoryFilter.disabled ? categoryFilter.value : '';
        const statusFilter = document.getElementById('filterStatus').value;
        const searchTerm = document.getElementById('searchInventory').value.trim();
        
        // Build query
        let query = supabase
            .from('inventory')
            .select('*')
            .order('item');
        
        // Apply filters
        if (groupFilter) {
            query = query.eq('item_group', groupFilter);
        }
        
        if (categoryValue) {
            query = query.eq('category', categoryValue);
        }
        
        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }
        
        if (searchTerm && searchTerm.length >= 2) {
            query = query.or(`item.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
        }
        
        const { data: items, error } = await query;
        
        if (error) throw error;
        
        // Simpan data untuk referensi
        inventoryData = items || [];
        
        // Tampilkan data
        displayInventoryTable(inventoryData);
        
        // Update count
        if (countEl) {
            countEl.textContent = `${inventoryData.length} item${inventoryData.length !== 1 ? 's' : ''}`;
        }
        
    } catch (error) {
        console.error('Error loading inventory:', error);
        const tbody = document.getElementById('inventoryBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        Gagal memuat data: ${error.message}
                    </td>
                </tr>
            `;
        }
    } finally {
        const loadingEl = document.getElementById('loadingInventory');
        if (loadingEl) loadingEl.style.display = 'none';
    }
}

// [10] Fungsi untuk display inventory table - BARU
function displayInventoryTable(items) {
    const tableEl = document.getElementById('inventoryTable');
    const tbody = document.getElementById('inventoryBody');
    const noDataEl = document.getElementById('noInventoryData');
    
    if (!tbody || !tableEl || !noDataEl) return;
    
    if (!items || items.length === 0) {
        tableEl.style.display = 'none';
        noDataEl.style.display = 'block';
        tbody.innerHTML = '';
        return;
    }
    
    // Batasi maksimal 10 baris
    const displayItems = items.slice(0, 10);
    
    let html = '';
    
    displayItems.forEach((item, index) => {
        const isSelected = selectedItems.some(sel => sel.sku === item.sku);
        const selectedQty = isSelected ? selectedItems.find(sel => sel.sku === item.sku).qty : 1;
        
        html += `
            <tr class="${isSelected ? 'selected-row' : ''}">
                <td>
                    <input type="checkbox" 
                           class="select-item-checkbox"
                           data-sku="${item.sku}"
                           data-index="${index}"
                           ${isSelected ? 'checked' : ''}
                           onchange="toggleInventoryItemSelection('${item.sku}', ${item.unit_price || 0}, '${item.item}', '${item.category}', '${item.item_group}', '${item.unit_type || 'pcs'}', this.checked)">
                </td>
                <td>
                    <div class="item-name">${item.item || '-'}</div>
                </td>
                <td><code>${item.sku || '-'}</code></td>
                <td>${item.category || '-'}</td>
                <td>${item.item_group || '-'}</td>
                <td>
                    <span class="status-pill ${item.status === 'active' ? 'status-active' : 'status-inactive'}">
                        ${item.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>${formatRupiah(item.unit_price || 0)}</td>
                <td>${item.unit_type || 'pcs'}</td>
                <td>
                    <button class="btn-add-to-request" 
                            onclick="addSingleItemToRequest('${item.sku}', ${item.unit_price || 0}, '${item.item}', '${item.category}', '${item.item_group}', '${item.unit_type || 'pcs'}')"
                            ${isSelected ? 'disabled' : ''}>
                        <i class="fas fa-plus"></i> Tambah
                    </button>
                </td>
            </tr>
        `;
    });
    
    // Jika ada lebih dari 10 item, tambahkan note
    if (items.length > 10) {
        html += `
            <tr class="info-row">
                <td colspan="9" style="text-align: center; color: #6c757d; font-style: italic;">
                    <i class="fas fa-info-circle"></i> Menampilkan 10 dari ${items.length} item. Gunakan filter untuk menyempitkan hasil.
                </td>
            </tr>
        `;
    }
    
    tbody.innerHTML = html;
    tableEl.style.display = 'table';
    noDataEl.style.display = 'none';
}

// [11] Fungsi untuk clear inventory table - BARU
function clearInventoryTable() {
    const tableEl = document.getElementById('inventoryTable');
    const tbody = document.getElementById('inventoryBody');
    const noDataEl = document.getElementById('noInventoryData');
    const countEl = document.getElementById('inventoryCount');
    
    if (tableEl) tableEl.style.display = 'none';
    if (tbody) tbody.innerHTML = '';
    if (noDataEl) noDataEl.style.display = 'block';
    if (countEl) countEl.textContent = '0 items';
}

// [12] Fungsi untuk toggle item selection di inventory - BARU
function toggleInventoryItemSelection(sku, unitPrice, itemName, category, itemGroup, unitType, isChecked) {
    if (isChecked) {
        // Cek apakah item sudah ada di selectedItems
        const existingIndex = selectedItems.findIndex(item => item.sku === sku);
        
        if (existingIndex === -1) {
            // Tambah item baru
            selectedItems.push({
                sku: sku,
                item: itemName,
                category: category,
                item_group: itemGroup,
                qty: 1,
                unit_price: unitPrice,
                total_price: unitPrice,
                unit_type: unitType
            });
        }
    } else {
        // Hapus item dari selectedItems
        const index = selectedItems.findIndex(item => item.sku === sku);
        if (index !== -1) {
            selectedItems.splice(index, 1);
        }
    }
    
    // Update UI
    updateSelectedItemsSection();
    
    // Update checkbox di inventory table
    const checkbox = document.querySelector(`.select-item-checkbox[data-sku="${sku}"]`);
    if (checkbox) {
        checkbox.checked = isChecked;
    }
}

// [13] Fungsi untuk add single item to request - BARU
function addSingleItemToRequest(sku, unitPrice, itemName, category, itemGroup, unitType) {
    // Cek apakah item sudah ada di selectedItems
    const existingIndex = selectedItems.findIndex(item => item.sku === sku);
    
    if (existingIndex === -1) {
        // Tambah item baru
        selectedItems.push({
            sku: sku,
            item: itemName,
            category: category,
            item_group: itemGroup,
            qty: 1,
            unit_price: unitPrice,
            total_price: unitPrice,
            unit_type: unitType
        });
        
        // Update UI
        updateSelectedItemsSection();
        
        // Update checkbox di inventory table
        const checkbox = document.querySelector(`.select-item-checkbox[data-sku="${sku}"]`);
        if (checkbox) {
            checkbox.checked = true;
        }
        
        // Feedback
        showToast(`"${itemName}" ditambahkan ke request`);
    }
}

// [14] Fungsi untuk load kasir history - DIMODIFIKASI
async function loadKasirHistory() {
    try {
        const loadingEl = document.getElementById('loadingHistoryKasir');
        const tableEl = document.getElementById('historyTableKasir');
        
        if (loadingEl) loadingEl.style.display = 'block';
        if (tableEl) tableEl.style.display = 'none';
        
        // Get filter values
        const dateFilter = document.getElementById('filterDateKasir')?.value || 'today';
        const page = currentKasirHistoryPage || 1;
        const limit = KASIR_HISTORY_PER_PAGE;
        const offset = (page - 1) * limit;
        
        // Query request history untuk SEMUA karyawan di outlet yang sama
        let query = supabase
            .from('request_barang')
            .select('*', { count: 'exact' })
            .eq('outlet', currentUserOutletRequest) // Filter berdasarkan outlet, bukan karyawan
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        
        // Apply date filter
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
        
        const { data: requests, error, count } = await query;
        
        if (error) throw error;
        
        // Update total records untuk pagination
        kasirHistoryTotalRecords = count || 0;
        
        displayKasirHistory(requests || []);
        updateKasirHistoryPagination();
        
    } catch (error) {
        console.error('Error loading kasir history:', error);
        const tbody = document.getElementById('historyBodyKasir');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        Gagal memuat history: ${error.message}
                    </td>
                </tr>
            `;
        }
    } finally {
        const loadingEl = document.getElementById('loadingHistoryKasir');
        const tableEl = document.getElementById('historyTableKasir');
        
        if (loadingEl) loadingEl.style.display = 'none';
        if (tableEl) tableEl.style.display = 'table';
    }
}

// [15] Fungsi untuk display kasir history - DIMODIFIKASI
function displayKasirHistory(requests) {
    const tbody = document.getElementById('historyBodyKasir');
    const tableEl = document.getElementById('historyTableKasir');
    if (!tbody || !tableEl) return;
    
    tbody.innerHTML = '';
    
    if (!requests || requests.length === 0) {
        tableEl.style.display = 'table';
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="empty-message">
                    <i class="fas fa-inbox"></i>
                    Belum ada request
                </td>
            </tr>
        `;
        return;
    }
    
    requests.forEach((request, index) => {
        const createdDate = new Date(request.created_at);
        const approvedDate = request.approved_at ? new Date(request.approved_at) : null;
        
        const isOwnRequest = request.karyawan === currentKaryawanRequest.nama_karyawan;
        
        // Buat status dengan catatan jika ada
        let statusHTML = '';
        if (request.status === 'rejected' && request.notes) {
            statusHTML = `
                <div class="status-with-notes">
                    <span class="status-pill status-rejected">
                        ${request.status}
                    </span>
                    <div class="reject-reason" title="${request.notes}">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>${truncateText(request.notes, 25)}</span>
                    </div>
                </div>
            `;
        } else if (request.status === 'approved' && request.notes) {
            statusHTML = `
                <div class="status-with-notes">
                    <span class="status-pill status-approved">
                        ${request.status}
                    </span>
                    <div class="approve-notes" title="${request.notes}">
                        <i class="fas fa-sticky-note"></i>
                        <span>${truncateText(request.notes, 25)}</span>
                    </div>
                </div>
            `;
        } else {
            statusHTML = `
                <span class="status-pill ${getRequestStatusClass(request.status)}">
                    ${request.status}
                </span>
            `;
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                ${createdDate.toLocaleDateString('id-ID')}<br>
                <small>${createdDate.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</small>
            </td>
            <td><code title="${request.batch_id}">${request.batch_id ? request.batch_id.substring(0, 6) + '...' : '-'}</code></td>
            <td>
                <div class="karyawan-info ${isOwnRequest ? 'own-request' : ''}">
                    ${request.karyawan}
                    ${isOwnRequest ? ' <i class="fas fa-user-check" title="Request Anda"></i>' : ''}
                </div>
            </td>
            <td>
                <div class="item-name">${request.item}</div>
                <div class="item-sku"><small>SKU: ${request.sku}</small></div>
            </td>
            <td>${request.qty || 0}</td>
            <td>${formatRupiah(request.unit_price || 0)}</td>
            <td>${formatRupiah(request.total_price || 0)}</td>
            <td class="status-cell">
                ${statusHTML}
            </td>
            <td>${request.approved_by || '-'}</td>
            <td>
                ${approvedDate ? approvedDate.toLocaleDateString('id-ID') : '-'}<br>
                ${approvedDate ? `<small>${approvedDate.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</small>` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
    
    tableEl.style.display = 'table';
}
// [16] Fungsi untuk update selected items section - DIMODIFIKASI
function updateSelectedItemsSection() {
    const section = document.getElementById('selectedItemsSection');
    const submitBtn = document.getElementById('submitRequestBtn');
    const selectedCountEl = document.getElementById('selectedCount');
    const totalItemsCountEl = document.getElementById('totalItemsCount');
    const totalQuantityEl = document.getElementById('totalQuantity');
    const totalAmountEl = document.getElementById('totalRequestAmount');
    const tbody = document.getElementById('selectedItemsBody');
    
    if (!section || !submitBtn || !tbody) return;
    
    // Show/hide section based on selected items
    if (selectedItems.length > 0) {
        section.style.display = 'block';
        submitBtn.disabled = false;
        
        // Update count
        if (selectedCountEl) {
            selectedCountEl.textContent = selectedItems.length;
        }
        
        // Update table
        tbody.innerHTML = '';
        
        let totalAmount = 0;
        let totalQty = 0;
        
        selectedItems.forEach((item, index) => {
            totalAmount += item.total_price;
            totalQty += item.qty;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="item-name">${item.item}</div>
                    <div class="item-sku"><small>SKU: ${item.sku}</small></div>
                </td>
                <td>${item.category}</td>
                <td>
                    <div class="qty-control small">
                        <button class="qty-btn minus" onclick="adjustSelectedItemQty(${index}, -1)" ${item.qty <= 1 ? 'disabled' : ''}>
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" 
                               class="qty-input" 
                               value="${item.qty}" 
                               min="1" 
                               onchange="updateSelectedItemQty(${index}, this.value)"
                               style="width: 50px; text-align: center;">
                        <button class="qty-btn plus" onclick="adjustSelectedItemQty(${index}, 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                        <span style="margin-left: 5px; font-size: 0.9rem;">${item.unit_type}</span>
                    </div>
                </td>
                <td>${formatRupiah(item.unit_price)}</td>
                <td class="subtotal">${formatRupiah(item.total_price)}</td>
                <td>
                    <button class="btn-remove" onclick="removeSelectedItem(${index})" title="Hapus item">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Update total info
        if (totalItemsCountEl) totalItemsCountEl.textContent = selectedItems.length;
        if (totalQuantityEl) totalQuantityEl.textContent = totalQty;
        if (totalAmountEl) totalAmountEl.textContent = formatRupiah(totalAmount);
        
    } else {
        section.style.display = 'none';
        submitBtn.disabled = true;
    }
}

// [17] Fungsi untuk adjust selected item quantity
function adjustSelectedItemQty(index, change) {
    if (index < 0 || index >= selectedItems.length) return;
    
    const item = selectedItems[index];
    const newQty = Math.max(1, item.qty + change);
    
    item.qty = newQty;
    item.total_price = item.unit_price * newQty;
    
    updateSelectedItemsSection();
}

// [18] Fungsi untuk update selected item quantity
function updateSelectedItemQty(index, newQty) {
    if (index < 0 || index >= selectedItems.length) return;
    
    const item = selectedItems[index];
    const qty = parseInt(newQty) || 1;
    
    item.qty = Math.max(1, qty);
    item.total_price = item.unit_price * item.qty;
    
    updateSelectedItemsSection();
}

// [19] Fungsi untuk remove selected item
function removeSelectedItem(index) {
    if (index < 0 || index >= selectedItems.length) return;
    
    // Update checkbox di inventory table
    const item = selectedItems[index];
    const checkbox = document.querySelector(`.select-item-checkbox[data-sku="${item.sku}"]`);
    if (checkbox) {
        checkbox.checked = false;
    }
    
    selectedItems.splice(index, 1);
    updateSelectedItemsSection();
}

// [20] Fungsi untuk clear all selected items
function clearAllSelectedItems() {
    if (selectedItems.length === 0) return;
    
    const confirmClear = confirm(`Hapus semua ${selectedItems.length} item yang dipilih?`);
    if (!confirmClear) return;
    
    // Uncheck semua checkbox di inventory table
    document.querySelectorAll('.select-item-checkbox:checked').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    selectedItems = [];
    updateSelectedItemsSection();
}

// [21] Fungsi untuk submit request
async function submitRequest() {
    if (selectedItems.length === 0) {
        alert('Pilih minimal 1 item untuk di-request!');
        return;
    }
    
    try {
        const submitBtn = document.getElementById('submitRequestBtn');
        const originalText = submitBtn.innerHTML;
        
        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        
        const notes = document.getElementById('requestNotes').value.trim();
        
        // Insert multiple records for each item
        const requests = selectedItems.map(item => ({
            batch_id: batchId,
            outlet: currentUserOutletRequest,
            karyawan: currentKaryawanRequest.nama_karyawan,
            item: item.item,
            sku: item.sku,
            qty: item.qty,
            category: item.category,
            item_group: item.item_group,
            unit_price: item.unit_price,
            total_price: item.total_price,
            status: 'pending',
            notes: notes || null,
            created_at: new Date().toISOString()
        }));
        
        const { data, error } = await supabase
            .from('request_barang')
            .insert(requests);
        
        if (error) throw error;
        
        // Success
        showToast(`✅ Request berhasil dikirim! Batch ID: ${batchId}`, 'success');
        
        // Reset form
        selectedItems = [];
        document.getElementById('requestNotes').value = '';
        batchId = generateBatchId();
        
        // Update UI
        updateSelectedItemsSection();
        
        // Uncheck semua checkbox di inventory table
        document.querySelectorAll('.select-item-checkbox:checked').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Reload history
        await loadKasirHistory();
        
    } catch (error) {
        console.error('Error submitting request:', error);
        showToast(`❌ Gagal mengirim request: ${error.message}`, 'error');
    } finally {
        // Reset button
        const submitBtn = document.getElementById('submitRequestBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Request';
        }
    }
}

// [22] Fungsi untuk load requests untuk owner - DIMODIFIKASI
async function loadRequestsForOwner() {
    try {
        // Tampilkan loading
        const loadingPending = document.getElementById('loadingPending');
        const pendingGrid = document.getElementById('pendingRequestsGrid');
        const loadingHistory = document.getElementById('loadingHistory');
        const historyTable = document.getElementById('historyTable');
        
        if (loadingPending) loadingPending.style.display = 'block';
        if (pendingGrid) pendingGrid.style.display = 'none';
        if (loadingHistory) loadingHistory.style.display = 'block';
        if (historyTable) historyTable.style.display = 'none';
        
        // Get filter values
        const outletFilter = document.getElementById('filterOutletOwner')?.value || 'all';
        const statusFilter = document.getElementById('filterStatusOwner')?.value || 'all';
        const dateFilter = document.getElementById('filterDateOwner')?.value || 'today';
        
        // Build query - HANYA AMBIL ITEM YANG STATUS PENDING
        let query = supabase
            .from('request_barang')
            .select('*')
            .eq('status', 'pending') // HANYA YANG PENDING
            .order('created_at', { ascending: false });
        
        // Apply outlet filter
        if (outletFilter !== 'all') {
            query = query.eq('outlet', outletFilter);
        }
        
        // Date filter masih berlaku
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
        
        const { data: requests, error } = await query;
        
        if (error) throw error;
        
        // Group requests by batch_id untuk pending section
        const groupedRequests = groupRequestsByBatch(requests || []);
        
        // Display data - gunakan function yang sudah diperbaiki
        displayPendingRequestsForRequestModule(groupedRequests);
        
        // Load history (semua status)
        await loadRequestHistoryForOwner(outletFilter, dateFilter);
        
        // Load outlet dropdown options
        await loadOutletDropdownForOwner(requests || []);
        
    } catch (error) {
        console.error('Error loading requests:', error);
        showToast(`Gagal memuat data request: ${error.message}`, 'error');
    } finally {
        // Hide loading
        const loadingPending = document.getElementById('loadingPending');
        const pendingGrid = document.getElementById('pendingRequestsGrid');
        const loadingHistory = document.getElementById('loadingHistory');
        
        if (loadingPending) loadingPending.style.display = 'none';
        if (pendingGrid) pendingGrid.style.display = 'block';
        if (loadingHistory) loadingHistory.style.display = 'none';
    }
}

// Fungsi untuk load history untuk Owner
async function loadRequestHistoryForOwner(outletFilter, dateFilter) {
    try {
        // Build query untuk history (semua status kecuali pending)
        let query = supabase
            .from('request_barang')
            .select('*')
            .neq('status', 'pending') // HANYA YANG BUKAN PENDING
            .order('created_at', { ascending: false })
            .limit(50);
        
        // Apply outlet filter
        if (outletFilter !== 'all') {
            query = query.eq('outlet', outletFilter);
        }
        
        // Apply date filter
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
        
        const { data: requests, error } = await query;
        
        if (error) throw error;
        
        // Display history
        displayRequestHistory(requests || []);
        
    } catch (error) {
        console.error('Error loading history:', error);
        const tbody = document.getElementById('historyBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        Gagal memuat history: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
}

// [23] Group requests by batch_id
function groupRequestsByBatch(requests) {
    const grouped = {};
    
    requests.forEach(request => {
        if (!request.batch_id) return;
        
        if (!grouped[request.batch_id]) {
            grouped[request.batch_id] = {
                batch_id: request.batch_id,
                outlet: request.outlet,
                karyawan: request.karyawan,
                created_at: request.created_at,
                status: request.status,
                notes: request.notes,
                items: [],
                total_items: 0,
                total_qty: 0,
                total_amount: 0
            };
        }
        
        grouped[request.batch_id].items.push(request);
        grouped[request.batch_id].total_items++;
        grouped[request.batch_id].total_qty += (request.qty || 0);
        grouped[request.batch_id].total_amount += (request.total_price || 0);
    });
    
    return Object.values(grouped);
}

// [24] Display pending requests for REQUEST MODULE - PERBAIKAN BESAR
function displayPendingRequestsForRequestModule(groupedRequests) {
    console.log('📦 REQUEST MODULE: displayPendingRequestsForRequestModule called');
    
    const pendingGrid = document.getElementById('pendingRequestsGrid');
    const pendingCountEl = document.getElementById('pendingCount');
    
    if (!pendingGrid) {
        console.error('pendingRequestsGrid not found');
        return;
    }
    
    // Update count - hitung total item pending, bukan batch
    let totalPendingItems = 0;
    groupedRequests.forEach(group => {
        totalPendingItems += group.items.length;
    });
    
    if (pendingCountEl) {
        pendingCountEl.textContent = `${totalPendingItems} items pending (${groupedRequests.length} batch)`;
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
        
        // Header batch dengan informasi outlet, requestor, tanggal
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
                            <strong>Requestor:</strong> ${group.karyawan || '-'}
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
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th style="width: 40px; padding: 12px 15px;">
                                    <input type="checkbox" class="select-all-checkbox" data-batch-id="${group.batch_id}" 
                                           onchange="toggleSelectAllItemsInBatch('${group.batch_id}', this.checked)">
                                </th>
                                <th style="width: 40px; padding: 12px 15px;">#</th>
                                <th style="padding: 12px 15px;">Item</th>
                                <th style="width: 80px; padding: 12px 15px;">Qty</th>
                                <th style="width: 120px; padding: 12px 15px;">Harga</th>
                                <th style="width: 120px; padding: 12px 15px;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${group.items.map((item, index) => `
                                <tr data-item-id="${item.id}" data-batch-id="${group.batch_id}">
                                    <td style="padding: 12px 15px; text-align: center;">
                                        <input type="checkbox" 
                                               class="item-checkbox" 
                                               data-item-id="${item.id}"
                                               data-batch-id="${group.batch_id}"
                                               onchange="updateBatchSelection('${group.batch_id}')">
                                    </td>
                                    <td style="padding: 12px 15px;">${index + 1}</td>
                                    <td style="padding: 12px 15px;">
                                        <div class="item-name">${item.item}</div>
                                        <div class="item-sku">SKU: ${item.sku}</div>
                                    </td>
                                    <td style="padding: 12px 15px;">${item.qty} ${item.unit_type || 'pcs'}</td>
                                    <td style="padding: 12px 15px;">${formatRupiah(item.unit_price)}</td>
                                    <td style="padding: 12px 15px;">${formatRupiah(item.total_price)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr style="background: #f8f9fa;">
                                <td colspan="3" style="padding: 12px 15px;"><strong>Total:</strong></td>
                                <td style="padding: 12px 15px;"><strong>${group.total_qty}</strong></td>
                                <td style="padding: 12px 15px;"></td>
                                <td style="padding: 12px 15px;"><strong>${formatRupiah(group.total_amount)}</strong></td>
                                <td colspan="2" style="padding: 12px 15px;">
                                    <div class="action-buttons-row" style="display: flex; gap: 10px;">
                                        <button class="btn-approve-selected" 
                                                data-batch-id="${group.batch_id}"
                                                onclick="approveSelectedItemsInBatch('${group.batch_id}')"
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
                                        <button class="btn-reject-selected" 
                                                data-batch-id="${group.batch_id}"
                                                onclick="rejectSelectedItemsInBatch('${group.batch_id}')"
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

// [25] Display request history untuk Owner - DIMODIFIKASI
function displayRequestHistory(requests) {
    const tbody = document.getElementById('historyBody');
    const historyTable = document.getElementById('historyTable');
    
    if (!tbody || !historyTable) return;
    
    tbody.innerHTML = '';
    
    if (!requests || requests.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="empty-message">
                    <i class="fas fa-history"></i>
                    Tidak ada history request
                </td>
            </tr>
        `;
        historyTable.style.display = 'table';
        return;
    }
    
    // Batasi maksimal 10 baris untuk performance
    const displayRequests = requests.slice(0, 10);
    
    displayRequests.forEach(request => {
        const createdDate = new Date(request.created_at);
        const approvedDate = request.approved_at ? new Date(request.approved_at) : null;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                ${createdDate.toLocaleDateString('id-ID')}<br>
                <small>${createdDate.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</small>
            </td>
            <td><code>${request.batch_id ? request.batch_id.substring(0, 8) + '...' : '-'}</code></td>
            <td>${request.outlet || '-'}</td>
            <td>${request.karyawan || '-'}</td>
            <td>
                <div class="item-name">${request.item}</div>
                <div class="item-sku"><small>SKU: ${request.sku}</small></div>
            </td>
            <td>${request.qty} ${request.unit_type || 'pcs'}</td>
            <td>${formatRupiah(request.unit_price || 0)}</td>
            <td>${formatRupiah(request.total_price || 0)}</td>
            <td>
                <span class="status-pill ${getRequestStatusClass(request.status)}">
                    ${request.status}
                </span>
            </td>
            <td>
                ${request.approved_by || '-'}
                ${approvedDate ? `<br><small>${approvedDate.toLocaleDateString('id-ID')}</small>` : ''}
            </td>
            <td>${request.notes || '-'}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Jika ada lebih dari 10 item, tambahkan note
    if (requests.length > 10) {
        const infoRow = document.createElement('tr');
        infoRow.className = 'info-row';
        infoRow.innerHTML = `
            <td colspan="11" style="text-align: center; color: #6c757d; font-style: italic;">
                <i class="fas fa-info-circle"></i> Menampilkan 10 dari ${requests.length} history request.
            </td>
        `;
        tbody.appendChild(infoRow);
    }
    
    historyTable.style.display = 'table';
}

// [26] Load outlet dropdown for owner
async function loadOutletDropdownForOwner(requests) {
    const select = document.getElementById('filterOutletOwner');
    if (!select) return;
    
    try {
        const { data: outletsData, error } = await supabase
            .from('request_barang')
            .select('outlet')
            .not('outlet', 'is', null);
        
        if (error) {
            console.error('Error loading outlets:', error);
            return;
        }
        
        // Get unique outlets
        const outlets = [...new Set(outletsData.map(r => r.outlet).filter(Boolean))];
        
        select.innerHTML = `
            <option value="all">Semua Outlet</option>
            ${outlets.map(outlet => `<option value="${outlet}">${outlet}</option>`).join('')}
        `;
        
    } catch (error) {
        console.error('Error loading outlets:', error);
    }
}

// [27] Fungsi untuk approve selected items dalam batch
async function approveSelectedItemsInBatch(batchId) {
    try {
        // Get all checked items for this batch
        const checkboxes = document.querySelectorAll(`
            .batch-card[data-batch-id="${batchId}"] 
            .item-checkbox:checked
        `);
        
        if (checkboxes.length === 0) {
            alert('Pilih minimal 1 item untuk di-approve!');
            return;
        }
        
        const itemIds = Array.from(checkboxes).map(cb => cb.getAttribute('data-item-id'));
        const approveAll = confirm(`Approve ${itemIds.length} item yang dipilih?\n\nItem yang tidak dipilih akan tetap status pending.`);
        
        if (!approveAll) return;
        
        // Update status in database
        const { error } = await supabase
            .from('request_barang')
            .update({ 
                status: 'approved',
                approved_at: new Date().toISOString(),
                approved_by: currentKaryawanRequest.nama_karyawan
            })
            .in('id', itemIds);
        
        if (error) throw error;
        
        // Reload requests
        await loadRequestsForOwner();
        
        showToast(`✅ ${itemIds.length} item berhasil di-approve!`, 'success');
        
    } catch (error) {
        console.error('Error approving items:', error);
        showToast(`❌ Gagal approve items: ${error.message}`, 'error');
    }
}

// [28] Fungsi untuk reject selected items dalam batch
async function rejectSelectedItemsInBatch(batchId) {
    try {
        // Get all checked items for this batch
        const checkboxes = document.querySelectorAll(`
            .batch-card[data-batch-id="${batchId}"] 
            .item-checkbox:checked
        `);
        
        if (checkboxes.length === 0) {
            alert('Pilih minimal 1 item untuk di-reject!');
            return;
        }
        
        const itemIds = Array.from(checkboxes).map(cb => cb.getAttribute('data-item-id'));
        const reason = prompt('Masukkan alasan penolakan:');
        
        if (reason === null) return;
        
        const rejectAll = confirm(`Reject ${itemIds.length} item yang dipilih?\n\nItem yang tidak dipilih akan tetap status pending.`);
        
        if (!rejectAll) return;
        
        // Update status in database
        const { error } = await supabase
            .from('request_barang')
            .update({ 
                status: 'rejected',
                approved_at: new Date().toISOString(),
                approved_by: currentKaryawanRequest.nama_karyawan,
                notes: reason || 'Ditolak tanpa alasan'
            })
            .in('id', itemIds);
        
        if (error) throw error;
        
        // Reload requests
        await loadRequestsForOwner();
        
        showToast(`❌ ${itemIds.length} item berhasil di-reject!`, 'success');
        
    } catch (error) {
        console.error('Error rejecting items:', error);
        showToast(`❌ Gagal reject items: ${error.message}`, 'error');
    }
}

// [29] Fungsi untuk toggle select all items dalam batch
function toggleSelectAllItemsInBatch(batchId, isChecked) {
    const checkboxes = document.querySelectorAll(`
        .batch-card[data-batch-id="${batchId}"] 
        .item-checkbox
    `);
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
    });
}

// [30] Fungsi untuk update batch selection status
function updateBatchSelection(batchId) {
    const checkboxes = document.querySelectorAll(`
        .batch-card[data-batch-id="${batchId}"] 
        .item-checkbox
    `);
    
    const selectAllCheckbox = document.querySelector(`
        .batch-card[data-batch-id="${batchId}"] 
        .select-all-checkbox
    `);
    
    if (checkboxes.length > 0 && selectAllCheckbox) {
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        const someChecked = Array.from(checkboxes).some(cb => cb.checked);
        
        selectAllCheckbox.checked = allChecked;
        selectAllCheckbox.indeterminate = someChecked && !allChecked;
    }
}

// [31] Helper functions
function generateBatchId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `REQ-${timestamp}-${random}`.toUpperCase();
}

function getStockClass(currentStock) {
    if (!currentStock || currentStock <= 0) return 'out-of-stock';
    if (currentStock <= 10) return 'low-stock';
    if (currentStock <= 20) return 'medium-stock';
    return 'good-stock';
}

function getRequestStatusClass(status) {
    switch(status) {
        case 'approved': return 'status-approved';
        case 'pending': return 'status-pending';
        case 'partially_approved': return 'status-partial';
        case 'rejected': return 'status-rejected';
        default: return 'status-unknown';
    }
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

function showToast(message, type = 'info') {
    // Hapus toast sebelumnya jika ada
    const existingToast = document.getElementById('requestToast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Buat toast element
    const toast = document.createElement('div');
    toast.id = 'requestToast';
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

function formatRupiah(amount) {
    if (amount === 0 || !amount) return 'Rp 0';
    return 'Rp ' + amount.toLocaleString('id-ID');
}

// [32] Setup pagination events untuk kasir
function setupKasirPaginationEvents() {
    // First page
    document.getElementById('firstPageKasir')?.addEventListener('click', () => {
        goToKasirHistoryPage(1);
    });
    
    // Previous page
    document.getElementById('prevPageKasir')?.addEventListener('click', () => {
        goToKasirHistoryPage(currentKasirHistoryPage - 1);
    });
    
    // Next page
    document.getElementById('nextPageKasir')?.addEventListener('click', () => {
        goToKasirHistoryPage(currentKasirHistoryPage + 1);
    });
    
    // Last page
    document.getElementById('lastPageKasir')?.addEventListener('click', () => {
        const totalPages = Math.ceil(kasirHistoryTotalRecords / KASIR_HISTORY_PER_PAGE);
        goToKasirHistoryPage(totalPages);
    });
    
    // Filter date change
    document.getElementById('filterDateKasir')?.addEventListener('change', () => {
        currentKasirHistoryPage = 1; // Reset ke halaman 1 saat filter berubah
        loadKasirHistory();
    });
}

// [33] Fungsi untuk update pagination history kasir
function updateKasirHistoryPagination() {
    const paginationSection = document.getElementById('kasirHistoryPagination');
    const totalPages = Math.ceil(kasirHistoryTotalRecords / KASIR_HISTORY_PER_PAGE);
    
    if (!paginationSection) return;
    
    // Tampilkan/hide pagination
    if (kasirHistoryTotalRecords > 0) {
        paginationSection.style.display = 'flex';
    } else {
        paginationSection.style.display = 'none';
        return;
    }
    
    // Update info
    const start = Math.min((currentKasirHistoryPage - 1) * KASIR_HISTORY_PER_PAGE + 1, kasirHistoryTotalRecords);
    const end = Math.min(currentKasirHistoryPage * KASIR_HISTORY_PER_PAGE, kasirHistoryTotalRecords);
    
    document.getElementById('kasirHistoryStart').textContent = start;
    document.getElementById('kasirHistoryEnd').textContent = end;
    document.getElementById('kasirHistoryTotal').textContent = kasirHistoryTotalRecords;
    document.getElementById('currentPageKasir').textContent = currentKasirHistoryPage;
    document.getElementById('totalPagesKasir').textContent = totalPages;
    
    // Update button states
    document.getElementById('firstPageKasir').disabled = currentKasirHistoryPage === 1;
    document.getElementById('prevPageKasir').disabled = currentKasirHistoryPage === 1;
    document.getElementById('nextPageKasir').disabled = currentKasirHistoryPage >= totalPages;
    document.getElementById('lastPageKasir').disabled = currentKasirHistoryPage >= totalPages;
}

// [34] Fungsi untuk ganti halaman history kasir
function goToKasirHistoryPage(page) {
    if (page < 1) page = 1;
    
    const totalPages = Math.ceil(kasirHistoryTotalRecords / KASIR_HISTORY_PER_PAGE);
    if (page > totalPages) page = totalPages;
    
    currentKasirHistoryPage = page;
    loadKasirHistory();
}

// [35] Tambahkan CSS untuk styling
function addRequestPageStyles() {
    const styleId = 'request-page-styles';
    
    // Hapus style sebelumnya jika ada
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
        existingStyle.remove();
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        /* Pagination Styles */
        .pagination-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            background: #f8f9fa;
            border-top: 1px solid #dee2e6;
            margin-top: 10px;
            border-radius: 0 0 8px 8px;
        }
        
        .pagination-info {
            font-size: 14px;
            color: #6c757d;
        }
        
        .pagination-controls {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .pagination-btn {
            padding: 6px 12px;
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            cursor: pointer;
            color: #495057;
            font-size: 14px;
            transition: all 0.2s;
        }
        
        .pagination-btn:hover:not(:disabled) {
            background: #007bff;
            color: white;
            border-color: #007bff;
        }
        
        .pagination-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .page-info {
            padding: 6px 12px;
            font-size: 14px;
            color: #495057;
        }
        
        .history-controls {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .own-request {
            color: #28a745;
            font-weight: 600;
        }
        
        .date-select {
            padding: 8px 12px;
            border: 1px solid #ced4da;
            border-radius: 4px;
            background: white;
            font-size: 14px;
            min-width: 150px;
        }
        
        .karyawan-info {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .karyawan-info i.fa-user-check {
            color: #28a745;
            font-size: 12px;
        }
        
        /* Filter group styling */
        .filter-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .filter-group label {
            font-weight: 600;
            font-size: 14px;
            color: #495057;
            white-space: nowrap;
        }
    `;
    
    document.head.appendChild(style);
}

// [36] Global functions untuk onclick events
window.adjustSelectedItemQty = adjustSelectedItemQty;
window.updateSelectedItemQty = updateSelectedItemQty;
window.removeSelectedItem = removeSelectedItem;
window.toggleInventoryItemSelection = toggleInventoryItemSelection;
window.addSingleItemToRequest = addSingleItemToRequest;
window.loadKasirHistory = loadKasirHistory;
window.loadInventoryWithFilter = loadInventoryWithFilter;
window.toggleSelectAllItemsInBatch = toggleSelectAllItemsInBatch;
window.updateBatchSelection = updateBatchSelection;
window.approveSelectedItemsInBatch = approveSelectedItemsInBatch;
window.rejectSelectedItemsInBatch = rejectSelectedItemsInBatch;
window.clearAllSelectedItems = clearAllSelectedItems;
window.goToKasirHistoryPage = goToKasirHistoryPage;

// ========== END OF FILE ==========
