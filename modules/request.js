// ========== FUNGSI MENU KOMPONEN - REQUEST ==========
// =================================================

// Variabel global untuk request
let currentKaryawanRequest = null;
let currentUserOutletRequest = null;
let isOwnerRequest = false;
let selectedItems = []; // Untuk menyimpan items yang akan di-request
let batchId = null; // ID batch untuk grouping multi-item
let inventoryData = []; // Untuk menyimpan data inventory

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

// [2] Fungsi untuk buat halaman request - DIPERBAIKI (HAPUS PAGINATION)
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
        
        <!-- Untuk KASIR: Form Request Multi-Item -->
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
            
            <!-- Inventory List Table -->
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
            
            <!-- Selected Items Section -->
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
                
                <!-- Notes & Submit Button -->
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
            
            <!-- Request History untuk Kasir -->
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
                        <!-- Tombol Refresh Bulat -->
                        <button class="btn-refresh-history-round" id="refreshKasirHistory" title="Refresh History">
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
                                    <th width="100px">Tanggal</th>
                                    <th width="80px">Batch ID</th>
                                    <th width="100px">Karyawan</th>
                                    <th width="120px">Item</th>
                                    <th width="60px">Qty</th>
                                    <th width="90px">Harga Satuan</th>
                                    <th width="100px">Subtotal</th>
                                    <th width="90px">Status</th>
                                    <th width="100px">Disetujui Oleh</th>
                                    <th width="100px">Tanggal Approve</th>
                                    <th width="150px">Catatan</th>
                                </tr>
                            </thead>
                            <tbody id="historyBodyKasir">
                                <!-- History akan diisi di sini -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        ` : `
        <!-- Untuk OWNER: Approval Requests -->
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
                        <!-- Tombol Refresh Bulat -->
                        <button class="btn-refresh-history-round" id="refreshOwnerPending" title="Refresh">
                            <i class="fas fa-sync-alt"></i>
                        </button>
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
                    <!-- Tombol Refresh Bulat -->
                    <button class="btn-refresh-history-round" id="refreshOwnerHistory" title="Refresh History">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
                <div class="history-table-container">
                    <div class="loading" id="loadingHistory">Memuat history...</div>
                    <div class="table-wrapper">
                        <table class="history-table horizontal-scroll" id="historyTable" style="display: none;">
                            <thead>
                                <tr>
                                    <th width="100px">Tanggal</th>
                                    <th width="80px">Batch ID</th>
                                    <th width="80px">Outlet</th>
                                    <th width="100px">Karyawan</th>
                                    <th width="120px">Item</th>
                                    <th width="60px">Qty</th>
                                    <th width="90px">Harga Satuan</th>
                                    <th width="100px">Subtotal</th>
                                    <th width="90px">Status</th>
                                    <th width="100px">Disetujui Oleh</th>
                                    <th width="100px">Tanggal Approve</th>
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
    
    // Setup tombol refresh bulat
    setupRefreshButtons();
}

// [4] Setup events untuk KASIR
function setupKasirRequestEvents() {
    // Tombol submit request
    const submitBtn = document.getElementById('submitRequestBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitRequest);
    }
    
    // Tombol refresh header
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
    
    // TAMBAHKAN: Auto-refresh saat filter periode berubah
    const filterDateKasir = document.getElementById('filterDateKasir');
    if (filterDateKasir) {
        filterDateKasir.addEventListener('change', async () => {
            await loadKasirHistory();
        });
    }
}

// [5] Setup events untuk OWNER
function setupOwnerRequestEvents() {
    // Tombol refresh header
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
    
    // Tombol apply filter
    document.querySelector('.btn-apply-filter')?.addEventListener('click', async () => {
        await loadRequestsForOwner();
    });
}

// [6] Fungsi untuk load initial data kasir
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

// [9] Fungsi untuk load inventory dengan filter
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

// [10] Fungsi untuk display inventory table
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

// [11] Fungsi untuk clear inventory table
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

// [12] Fungsi untuk toggle item selection di inventory
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

// [13] Fungsi untuk add single item to request
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

// [14] Fungsi untuk load kasir history - DIPERBAIKI (TANPA PAGINATION)
async function loadKasirHistory() {
    try {
        const loadingEl = document.getElementById('loadingHistoryKasir');
        const tableEl = document.getElementById('historyTableKasir');
        const refreshBtn = document.getElementById('refreshKasirHistory');
        
        // Tambahkan animasi loading ke tombol refresh
        if (refreshBtn) {
            refreshBtn.classList.add('loading');
            refreshBtn.disabled = true;
        }
        
        if (loadingEl) loadingEl.style.display = 'block';
        if (tableEl) tableEl.style.display = 'none';
        
        // Get filter values
        const dateFilter = document.getElementById('filterDateKasir')?.value || 'today';
        
        // Query request history - SEMUA DATA TANPA PAGINATION
        let query = supabase
            .from('request_barang')
            .select('*')
            .eq('outlet', currentUserOutletRequest)
            .order('created_at', { ascending: false });
        
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
        
        // Display data
        displayKasirHistory(requests || []);
        
    } catch (error) {
        console.error('Error loading kasir history:', error);
        const tbody = document.getElementById('historyBodyKasir');
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
    } finally {
        const loadingEl = document.getElementById('loadingHistoryKasir');
        const tableEl = document.getElementById('historyTableKasir');
        const refreshBtn = document.getElementById('refreshKasirHistory');
        
        // Hapus animasi loading dari tombol refresh
        if (refreshBtn) {
            refreshBtn.classList.remove('loading');
            refreshBtn.disabled = false;
        }
        
        if (loadingEl) loadingEl.style.display = 'none';
        if (tableEl) tableEl.style.display = 'table';
    }
}

// [15] Fungsi untuk display kasir history
function displayKasirHistory(requests) {
    const tbody = document.getElementById('historyBodyKasir');
    const tableEl = document.getElementById('historyTableKasir');
    if (!tbody || !tableEl) return;
    
    tbody.innerHTML = '';
    
    if (!requests || requests.length === 0) {
        tableEl.style.display = 'table';
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="empty-message">
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
        
        // Tambahkan highlight jika request dibuat oleh karyawan yang login
        const isOwnRequest = request.karyawan === currentKaryawanRequest.nama_karyawan;
        
        // Format note
        const noteDisplay = request.notes || '-';
        
        // Status dengan icon
        let statusHTML = '';
        if (request.status === 'rejected') {
            statusHTML = `
                <span class="status-pill status-rejected">
                    <i class="fas fa-times-circle"></i> ${request.status}
                </span>
            `;
        } else if (request.status === 'approved') {
            statusHTML = `
                <span class="status-pill status-approved">
                    <i class="fas fa-check-circle"></i> ${request.status}
                </span>
            `;
        } else if (request.status === 'pending') {
            statusHTML = `
                <span class="status-pill status-pending">
                    <i class="fas fa-clock"></i> ${request.status}
                </span>
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
            <td class="notes-cell">
                <div class="notes-content" title="${noteDisplay}">
                    ${noteDisplay}
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    tableEl.style.display = 'table';
}

// [16] Fungsi untuk update selected items section
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

// [22] Fungsi untuk load requests untuk owner
async function loadRequestsForOwner() {
    try {
        // Tampilkan loading
        const loadingPending = document.getElementById('loadingPending');
        const pendingGrid = document.getElementById('pendingRequestsGrid');
        const loadingHistory = document.getElementById('loadingHistory');
        const historyTable = document.getElementById('historyTable');
        const refreshBtn = document.getElementById('refreshOwnerPending');
        
        // Tambahkan animasi loading ke tombol refresh
        if (refreshBtn) {
            refreshBtn.classList.add('loading');
            refreshBtn.disabled = true;
        }
        
        if (loadingPending) loadingPending.style.display = 'block';
        if (pendingGrid) pendingGrid.style.display = 'none';
        if (loadingHistory) loadingHistory.style.display = 'block';
        if (historyTable) historyTable.style.display = 'none';
        
        // Get filter values
        const outletFilter = document.getElementById('filterOutletOwner')?.value || 'all';
        const statusFilter = document.getElementById('filterStatusOwner')?.value || 'all';
        const dateFilter = document.getElementById('filterDateOwner')?.value || 'today';
        
        // 1. Load pending requests
        await loadPendingRequestsForOwner(outletFilter, dateFilter);
        
        // 2. Load history (semua status kecuali pending)
        await loadRequestHistoryForOwner(outletFilter, statusFilter, dateFilter);
        
        // 3. Load outlet dropdown options
        await loadOutletDropdownForOwner();
        
    } catch (error) {
        console.error('Error loading requests:', error);
        showToast(`Gagal memuat data request: ${error.message}`, 'error');
    } finally {
        // Hide loading
        const loadingPending = document.getElementById('loadingPending');
        const pendingGrid = document.getElementById('pendingRequestsGrid');
        const loadingHistory = document.getElementById('loadingHistory');
        const refreshBtn = document.getElementById('refreshOwnerPending');
        
        // Hapus animasi loading dari tombol refresh
        if (refreshBtn) {
            refreshBtn.classList.remove('loading');
            refreshBtn.disabled = false;
        }
        
        if (loadingPending) loadingPending.style.display = 'none';
        if (pendingGrid) pendingGrid.style.display = 'block';
        if (loadingHistory) loadingHistory.style.display = 'none';
    }
}

// Fungsi untuk load pending requests untuk Owner
async function loadPendingRequestsForOwner(outletFilter, dateFilter) {
    try {
        // Build query - HANYA AMBIL ITEM YANG STATUS PENDING
        let query = supabase
            .from('request_barang')
            .select('*')
            .eq('status', 'pending')
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
        
        // Display data
        displayPendingRequestsForRequestModule(groupedRequests);
        
    } catch (error) {
        console.error('Error loading pending requests:', error);
        showToast(`Gagal memuat pending requests: ${error.message}`, 'error');
    }
}

// Fungsi untuk load history untuk Owner - DIPERBAIKI (TANPA PAGINATION)
async function loadRequestHistoryForOwner(outletFilter, statusFilter, dateFilter) {
    try {
        const refreshBtn = document.getElementById('refreshOwnerHistory');
        
        // Tambahkan animasi loading ke tombol refresh
        if (refreshBtn) {
            refreshBtn.classList.add('loading');
            refreshBtn.disabled = true;
        }
        
        // Build query untuk history (semua status kecuali pending)
        let query = supabase
            .from('request_barang')
            .select('*')
            .neq('status', 'pending')
            .order('created_at', { ascending: false });
        
        // Apply outlet filter
        if (outletFilter !== 'all') {
            query = query.eq('outlet', outletFilter);
        }
        
        // Apply status filter
        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
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
                    <td colspan="12" class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        Gagal memuat history: ${error.message}
                    </td>
                </tr>
            `;
        }
    } finally {
        const refreshBtn = document.getElementById('refreshOwnerHistory');
        
        // Hapus animasi loading dari tombol refresh
        if (refreshBtn) {
            refreshBtn.classList.remove('loading');
            refreshBtn.disabled = false;
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

// [24] Display pending requests for REQUEST MODULE
function displayPendingRequestsForRequestModule(groupedRequests) {
    const pendingGrid = document.getElementById('pendingRequestsGrid');
    const pendingCountEl = document.getElementById('pendingCount');
    
    if (!pendingGrid) return;
    
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

// [25] Display request history untuk Owner
function displayRequestHistory(requests) {
    const tbody = document.getElementById('historyBody');
    const historyTable = document.getElementById('historyTable');
    
    if (!tbody || !historyTable) return;
    
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
        historyTable.style.display = 'table';
        return;
    }
    
    requests.forEach(request => {
        const createdDate = new Date(request.created_at);
        const approvedDate = request.approved_at ? new Date(request.approved_at) : null;
        
        // Format note
        const noteDisplay = request.notes || '-';
        
        // Status dengan icon
        let statusHTML = '';
        if (request.status === 'rejected') {
            statusHTML = `
                <span class="status-pill status-rejected">
                    <i class="fas fa-times-circle"></i> ${request.status}
                </span>
            `;
        } else if (request.status === 'approved') {
            statusHTML = `
                <span class="status-pill status-approved">
                    <i class="fas fa-check-circle"></i> ${request.status}
                </span>
            `;
        } else if (request.status === 'pending') {
            statusHTML = `
                <span class="status-pill status-pending">
                    <i class="fas fa-clock"></i> ${request.status}
                </span>
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
            <td><code>${request.batch_id ? request.batch_id.substring(0, 6) + '...' : '-'}</code></td>
            <td>${request.outlet || '-'}</td>
            <td>${request.karyawan || '-'}</td>
            <td>
                <div class="item-name">${request.item}</div>
                <div class="item-sku"><small>SKU: ${request.sku}</small></div>
            </td>
            <td>${request.qty} ${request.unit_type || 'pcs'}</td>
            <td>${formatRupiah(request.unit_price || 0)}</td>
            <td>${formatRupiah(request.total_price || 0)}</td>
            <td class="status-cell">
                ${statusHTML}
            </td>
            <td>
                ${request.approved_by || '-'}
                ${approvedDate ? `<br><small>${approvedDate.toLocaleDateString('id-ID')}</small>` : ''}
            </td>
            <td>
                ${approvedDate ? approvedDate.toLocaleDateString('id-ID') : '-'}<br>
                ${approvedDate ? `<small>${approvedDate.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</small>` : ''}
            </td>
            <td class="notes-cell">
                <div class="notes-content" title="${noteDisplay}">
                    ${noteDisplay}
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    historyTable.style.display = 'table';
}

// [26] Load outlet dropdown for owner
async function loadOutletDropdownForOwner() {
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

// [38] Tambahkan CSS untuk styling
function addRequestPageStyles() {
    const styleId = 'request-page-styles';
    
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) existingStyle.remove();
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        /* ===== STYLING UMUM ===== */
        .request-page {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f7fa;
            min-height: 100vh;
            padding: 20px;
        }
        
        /* Header */
        .request-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            margin-bottom: 20px;
        }
        
        .request-header h2 {
            margin: 0;
            color: #2c3e50;
            font-size: 1.5rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .back-btn {
            background: #6c757d;
            color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
        }
        
        .back-btn:hover {
            background: #5a6268;
            transform: translateX(-3px);
        }
        
        /* Info Header */
        .request-info-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        
        .info-row:last-child {
            margin-bottom: 0;
        }
        
        .info-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
        }
        
        /* ===== STYLING UNTUK STATUS ===== */
        .status-pill {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            text-transform: capitalize;
            white-space: nowrap;
            max-width: 120px;
        }
        
        .status-pill i {
            font-size: 10px;
        }
        
        /* Warna status */
        .status-approved {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .status-pending {
            background-color: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }
        
        .status-rejected {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .status-partial {
            background-color: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        
        .status-cell {
            min-width: 100px;
        }
        
        /* ===== STYLING UNTUK KOLOM CATATAN ===== */
        .notes-cell {
            max-width: 200px;
            min-width: 150px;
        }
        
        .notes-content {
            font-size: 12px;
            line-height: 1.4;
            color: #495057;
            word-wrap: break-word;
            white-space: normal;
            overflow: visible;
            max-height: none;
        }
        
        /* Highlight untuk catatan rejected */
        .status-rejected ~ .notes-cell .notes-content {
            color: #dc3545;
            font-weight: 500;
        }
        
        /* ===== STYLING TOMBOL REFRESH BULAT ===== */
        .btn-refresh-history-round {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: none;
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            box-shadow: 0 2px 5px rgba(0, 123, 255, 0.3);
            position: relative;
            overflow: hidden;
            flex-shrink: 0; /* Tambahkan ini agar tidak mengecil di mobile */
        }
        
        .btn-refresh-history-round:hover {
            background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 123, 255, 0.4);
        }
        
        .btn-refresh-history-round:active {
            transform: translateY(0);
            box-shadow: 0 1px 3px rgba(0, 123, 255, 0.3);
        }
        
        .btn-refresh-history-round i {
            font-size: 14px;
            transition: transform 0.3s ease;
        }
        
        .btn-refresh-history-round.loading i {
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Efek ripple saat klik */
        .btn-refresh-history-round::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: translate(-50%, -50%);
            transition: width 0.3s, height 0.3s;
        }
        
        .btn-refresh-history-round:active::after {
            width: 100%;
            height: 100%;
        }
        
        /* ===== STYLING UNTUK KASIR HISTORY SECTION ===== */
        .kasir-history-section .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            flex-wrap: wrap; /* Tambahkan agar responsive */
            gap: 10px; /* Tambahkan gap */
        }
        
        .kasir-history-section .section-header h3 {
            margin: 0;
            flex: 1;
            min-width: 250px; /* Tambahkan min-width agar tidak terlalu kecil */
        }
        
        .kasir-history-section .history-controls {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-shrink: 0; /* Tambahkan agar tidak mengecil */
        }
        
        /* Untuk filter date kasir */
        #filterDateKasir {
            min-width: 150px; /* Pastikan lebar minimum */
            height: 36px; /* Sama dengan tinggi tombol refresh */
            flex-shrink: 0;
        }
        
        /* Untuk owner section */
        .pending-requests-section .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .pending-requests-section .request-stats {
            display: flex;
            align-items: center;
            gap: 15px;
            flex-shrink: 0;
        }
        
        .request-history-section .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .request-history-section .section-header h3 {
            flex: 1;
            min-width: 250px;
        }
        
        /* Tombol refresh di header utama */
        .request-header .refresh-btn {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: none;
            background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            flex-shrink: 0;
        }
        
        .request-header .refresh-btn:hover {
            background: linear-gradient(135deg, #495057 0%, #343a40 100%);
            transform: translateY(-2px);
        }
        
        /* ===== KARYAWAN INFO ===== */
        .karyawan-info {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .own-request {
            color: #28a745;
            font-weight: 600;
        }
        
        .karyawan-info i.fa-user-check {
            color: #28a745;
            font-size: 12px;
        }
        
        /* ===== FILTER STYLES ===== */
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
        
        .date-select {
            padding: 8px 12px;
            border: 1px solid #ced4da;
            border-radius: 4px;
            background: white;
            font-size: 14px;
            min-width: 150px;
        }
        
        /* ===== RESPONSIVE ADJUSTMENTS UNTUK MOBILE ===== */
        @media (max-width: 768px) {
            .request-page {
                padding: 10px;
            }
            
            .info-row {
                flex-direction: column;
                gap: 10px;
            }
            
            .status-pill {
                padding: 5px 10px;
                font-size: 11px;
            }
            
            .notes-cell {
                max-width: 120px;
                min-width: 100px;
            }
            
            .notes-content {
                font-size: 11px;
            }
            
            /* TOMBOL REFRESH DI MOBILE - PERBAIKAN */
            .btn-refresh-history-round {
                width: 36px;
                height: 36px;
                display: flex !important; /* Force display */
                visibility: visible !important; /* Force visibility */
                opacity: 1 !important;
            }
            
            .btn-refresh-history-round i {
                font-size: 14px;
            }
            
            .request-header .refresh-btn {
                width: 36px;
                height: 36px;
            }
            
            /* SECTION HEADER DI MOBILE */
            .kasir-history-section .section-header {
                flex-direction: row; /* Tetap row, bukan column */
                align-items: center;
                justify-content: space-between;
            }
            
            .kasir-history-section .section-header h3 {
                font-size: 1.1rem;
                min-width: auto;
                flex: 1;
            }
            
            .kasir-history-section .history-controls {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-shrink: 0;
            }
            
            #filterDateKasir {
                min-width: 130px;
                height: 36px;
                font-size: 13px;
            }
            
            .request-history-section .section-header {
                flex-direction: row;
                align-items: center;
            }
            
            .request-history-section .section-header h3 {
                font-size: 1.1rem;
                min-width: auto;
            }
            
            .pending-requests-section .section-header {
                flex-direction: row;
                align-items: center;
            }
        }
        
        /* Untuk layar sangat kecil (mobile portrait) */
        @media (max-width: 480px) {
            .kasir-history-section .section-header {
                flex-direction: column;
                align-items: stretch;
                gap: 10px;
            }
            
            .kasir-history-section .section-header h3 {
                text-align: center;
                font-size: 1rem;
            }
            
            .kasir-history-section .history-controls {
                justify-content: center;
                width: 100%;
            }
            
            #filterDateKasir {
                min-width: 120px;
                font-size: 12px;
            }
            
            .btn-refresh-history-round {
                width: 34px;
                height: 34px;
            }
            
            .request-history-section .section-header {
                flex-direction: column;
                align-items: stretch;
                gap: 10px;
            }
            
            .request-history-section .section-header h3 {
                text-align: center;
            }
        }
        
        /* Animation untuk status */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .status-pill {
            animation: fadeIn 0.3s ease;
        }
    `;
    
    document.head.appendChild(style);
}

// [39] Setup tombol refresh
function setupRefreshButtons() {
    // Refresh kasir history
    const refreshKasirBtn = document.getElementById('refreshKasirHistory');
    if (refreshKasirBtn) {
        refreshKasirBtn.addEventListener('click', async function() {
            await loadKasirHistory();
        });
    }
    
    // Refresh owner pending
    const refreshOwnerPendingBtn = document.getElementById('refreshOwnerPending');
    if (refreshOwnerPendingBtn) {
        refreshOwnerPendingBtn.addEventListener('click', async function() {
            await loadRequestsForOwner();
        });
    }
    
    // Refresh owner history
    const refreshOwnerHistoryBtn = document.getElementById('refreshOwnerHistory');
    if (refreshOwnerHistoryBtn) {
        refreshOwnerHistoryBtn.addEventListener('click', async function() {
            await loadRequestsForOwner();
        });
    }
}

// [40] Global functions untuk onclick events
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

// ========== END OF FILE ==========
