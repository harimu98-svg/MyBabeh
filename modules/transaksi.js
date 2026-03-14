// ========== FUNGSI MENU KOMPONEN - TRANSAKSI ==========
// =====================================================

// Variabel global
let currentKaryawanTransaksi = null;
let currentUserOutletTransaksi = null;
let isOwnerTransaksi = false;

// [1] Fungsi utama untuk tampilkan halaman transaksi
async function showTransaksiPage() {
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
            .select('role, outlet')
            .eq('nama_karyawan', namaKaryawan)
            .single();
        
        if (!karyawanData) {
            alert('Data karyawan tidak ditemukan!');
            return;
        }
        
        currentKaryawanTransaksi = {
            nama_karyawan: namaKaryawan,
            role: karyawanData.role,
            outlet: karyawanData.outlet
        };
        
        currentUserOutletTransaksi = karyawanData.outlet;
        isOwnerTransaksi = karyawanData.role === 'owner';
        
        // Sembunyikan main app, tampilkan halaman transaksi
        document.getElementById('appScreen').style.display = 'none';
        
        // Buat container halaman transaksi
        createTransaksiPage();
        
        // Load data transaksi
        await loadTransaksiData();
        
    } catch (error) {
        console.error('Error in showTransaksiPage:', error);
        alert('Gagal memuat halaman transaksi!');
    }
}

// [2] Fungsi untuk buat halaman transaksi
function createTransaksiPage() {
    // Hapus halaman transaksi sebelumnya jika ada
    const existingPage = document.getElementById('transaksiPage');
    if (existingPage) {
        existingPage.remove();
    }
    
    // Format tanggal hari ini untuk default value
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Buat container halaman transaksi
    const transaksiPage = document.createElement('div');
    transaksiPage.id = 'transaksiPage';
    transaksiPage.className = 'transaksi-page';
    transaksiPage.innerHTML = `
        <!-- Header -->
        <header class="transaksi-header">
            <button class="back-btn" id="backToMainFromTransaksi">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h2><i class="fas fa-receipt"></i> Transaksi</h2>
            <div class="header-actions">
                <button class="refresh-btn" id="refreshTransaksi">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
        </header>
        
        <!-- Info Header -->
        <div class="transaksi-info-header">
            <div class="info-row">
                <div class="info-item">
                    <i class="fas fa-user"></i>
                    <span id="userName">${currentKaryawanTransaksi?.nama_karyawan || '-'}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-store"></i>
                    <span id="userOutlet">${currentUserOutletTransaksi || '-'}</span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-item">
                    <i class="fas fa-tag"></i>
                    <span id="userRole">${currentKaryawanTransaksi?.role || '-'}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-calendar-alt"></i>
                    <span id="currentDate">${new Date().toLocaleDateString('id-ID', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</span>
                </div>
            </div>
        </div>
        
        <!-- Filter Section -->
        <div class="transaksi-filter-section">
            <div class="filter-row">
                <!-- Filter untuk Owner -->
                ${isOwnerTransaksi ? `
                <div class="filter-group">
                    <label for="filterOutlet"><i class="fas fa-store"></i> Outlet:</label>
                    <select id="filterOutlet" class="outlet-select">
                        <option value="all">Semua Outlet</option>
                    </select>
                </div>
                ` : ''}
                
                <!-- Filter Tanggal dengan Date Picker -->
                <div class="filter-group date-filter-group">
                    <label for="filterDate"><i class="fas fa-calendar-alt"></i> Tanggal:</label>
                    <input type="date" id="filterDate" class="date-picker" value="${todayFormatted}" max="${todayFormatted}">
                </div>
                
                <!-- Filter Status -->
                <div class="filter-group">
                    <label for="filterStatus"><i class="fas fa-filter"></i> Status:</label>
                    <select id="filterStatus" class="status-select">
                        <option value="all">Semua Status</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                
                <!-- Tombol Terapkan Filter -->
                <button class="btn-apply-filter" id="applyTransaksiFilter">
                    <i class="fas fa-search"></i> Tampilkan
                </button>
            </div>
        </div>
        
        <!-- Summary Cards -->
        <div class="transaksi-summary">
            <div class="summary-card">
                <div class="summary-icon bg-primary">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <div class="summary-content">
                    <div class="summary-label">Total Transaksi</div>
                    <div class="summary-value" id="totalTransaksi">0</div>
                </div>
            </div>
            <div class="summary-card">
                <div class="summary-icon bg-success">
                    <i class="fas fa-box"></i>
                </div>
                <div class="summary-content">
                    <div class="summary-label">Total Item</div>
                    <div class="summary-value" id="totalItem">0</div>
                </div>
            </div>
            <div class="summary-card">
                <div class="summary-icon bg-warning">
                    <i class="fas fa-money-bill-wave"></i>
                </div>
                <div class="summary-content">
                    <div class="summary-label">Total Amount</div>
                    <div class="summary-value" id="totalAmount">Rp 0</div>
                </div>
            </div>
            <div class="summary-card">
                <div class="summary-icon bg-info">
                    <i class="fas fa-hand-holding-usd"></i>
                </div>
                <div class="summary-content">
                    <div class="summary-label">Total Komisi</div>
                    <div class="summary-value" id="totalCommission">Rp 0</div>
                </div>
            </div>
        </div>
        
        <!-- Tabel Transaksi -->
        <section class="transaksi-table-section">
            <div class="section-header">
                <h3><i class="fas fa-list"></i> Detail Transaksi</h3>
                <div class="table-info" id="tableInfo">Memuat data...</div>
            </div>
            
            <div class="transaksi-table-container">
                <div class="loading" id="loadingTransaksi">Memuat data transaksi...</div>
                
                <div class="table-wrapper">
                    <table class="transaksi-table" id="transaksiTable" style="display: none;">
                        <thead>
                            <tr>
                                <th>No. Order</th>
                                <th>Tanggal</th>
                                <th>Jam</th>
                                <th>Outlet</th>
                                <th>Serve By</th>
                                <th>Kasir</th>
                                <th>Customer</th>
                                <th>Item</th>
                                <th>Group</th>
                                <th>Qty</th>
                                <th>Amount</th>
                                <th>Komisi</th>
                                <th>Payment</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="transaksiBody">
                            <!-- Data akan diisi oleh JavaScript -->
                        </tbody>
                    </table>
                </div>
                
                <div class="no-data" id="noTransaksiData" style="display: none;">
                    <i class="fas fa-receipt"></i>
                    <p>Tidak ada data transaksi</p>
                    <p class="hint">Pilih tanggal lain atau ubah filter</p>
                </div>
            </div>
        </section>
        
        <!-- Footer -->
        <div class="transaksi-footer">
            <p>Data diperbarui: <span id="lastUpdateTime">-</span></p>
        </div>
    `;
    
    document.body.appendChild(transaksiPage);
    
    // Setup event listeners
    setupTransaksiPageEvents();
    
    // Tambahkan CSS styling
    addTransaksiPageStyles();
}

// [3] Setup event listeners
function setupTransaksiPageEvents() {
    // Tombol kembali
    document.getElementById('backToMainFromTransaksi').addEventListener('click', () => {
        document.getElementById('transaksiPage').remove();
        document.getElementById('appScreen').style.display = 'block';
    });
    
    // Tombol refresh
    document.getElementById('refreshTransaksi').addEventListener('click', async () => {
        await loadTransaksiData();
    });
    
    // Tombol apply filter
    document.getElementById('applyTransaksiFilter').addEventListener('click', async () => {
        await loadTransaksiData();
    });
    
    // Enter key pada date picker
    document.getElementById('filterDate').addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            await loadTransaksiData();
        }
    });
    
    // Jika owner, load dropdown outlet
    if (isOwnerTransaksi) {
        loadOutletDropdownTransaksi();
    }
}

// [4] Fungsi untuk load data transaksi
async function loadTransaksiData() {
    try {
        console.log('=== LOADING TRANSAKSI DATA ===');
        
        // Tampilkan loading
        document.getElementById('loadingTransaksi').style.display = 'block';
        document.getElementById('transaksiTable').style.display = 'none';
        document.getElementById('noTransaksiData').style.display = 'none';
        document.getElementById('tableInfo').textContent = 'Memuat data...';
        
        // Reset summary
        document.getElementById('totalTransaksi').textContent = '0';
        document.getElementById('totalItem').textContent = '0';
        document.getElementById('totalAmount').textContent = 'Rp 0';
        document.getElementById('totalCommission').textContent = 'Rp 0';
        
        // Dapatkan filter
        const selectedDate = document.getElementById('filterDate').value;
        const statusFilter = document.getElementById('filterStatus').value;
        
        if (!selectedDate) {
            alert('Pilih tanggal terlebih dahulu!');
            document.getElementById('loadingTransaksi').style.display = 'none';
            return;
        }
        
        console.log('Filter:', { tanggal: selectedDate, status: statusFilter });
        
        // Bangun query
        let query = supabase
            .from('transaksi_detail')
            .select('*')
            .eq('order_date', selectedDate);
        
        // Filter berdasarkan outlet (untuk owner)
        if (isOwnerTransaksi) {
            const outletFilter = document.getElementById('filterOutlet').value;
            if (outletFilter !== 'all') {
                query = query.eq('outlet', outletFilter);
            }
        } else {
            // Untuk non-owner, filter berdasarkan outlet karyawan
            query = query.eq('outlet', currentUserOutletTransaksi);
        }
        
        // Filter berdasarkan status
        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }
        
        // Urutkan berdasarkan waktu
        query = query.order('order_time', { ascending: false });
        
        const { data: transaksi, error } = await query;
        
        if (error) throw error;
        
        console.log(`Ditemukan ${transaksi?.length || 0} record transaksi`);
        
        // Hitung summary
        calculateAndDisplaySummary(transaksi || []);
        
        // Tampilkan data di tabel
        displayTransaksiTable(transaksi || []);
        
        // Update waktu terakhir update
        const updateTime = new Date().toLocaleTimeString('id-ID');
        document.getElementById('lastUpdateTime').textContent = updateTime;
        document.getElementById('tableInfo').textContent = `${transaksi?.length || 0} record ditemukan`;
        
        console.log('=== FINISHED LOADING TRANSAKSI ===');
        
    } catch (error) {
        console.error('Error loading transaksi:', error);
        
        document.getElementById('loadingTransaksi').style.display = 'none';
        document.getElementById('transaksiTable').style.display = 'none';
        document.getElementById('noTransaksiData').style.display = 'block';
        document.getElementById('tableInfo').textContent = 'Gagal memuat data';
        
        // Tampilkan error di no data section
        const noDataEl = document.getElementById('noTransaksiData');
        noDataEl.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color: #ff4757;"></i>
            <p>Gagal memuat data</p>
            <p class="hint">${error.message}</p>
        `;
    }
}

// [5] Fungsi untuk hitung dan tampilkan summary
function calculateAndDisplaySummary(transaksi) {
    if (!transaksi || transaksi.length === 0) {
        document.getElementById('totalTransaksi').textContent = '0';
        document.getElementById('totalItem').textContent = '0';
        document.getElementById('totalAmount').textContent = 'Rp 0';
        document.getElementById('totalCommission').textContent = 'Rp 0';
        return;
    }
    
    // Hitung unique order numbers
    const uniqueOrders = new Set(transaksi.map(t => t.order_no)).size;
    
    // Hitung total qty, amount, commission
    let totalQty = 0;
    let totalAmount = 0;
    let totalCommission = 0;
    
    transaksi.forEach(t => {
        totalQty += t.qty || 0;
        totalAmount += t.amount || 0;
        totalCommission += t.comission || 0; // Perhatikan ejaan: comission (dari tabel)
    });
    
    // Update UI
    document.getElementById('totalTransaksi').textContent = uniqueOrders;
    document.getElementById('totalItem').textContent = totalQty;
    document.getElementById('totalAmount').textContent = formatRupiah(totalAmount);
    document.getElementById('totalCommission').textContent = formatRupiah(totalCommission);
}

// [6] Fungsi untuk tampilkan tabel transaksi
function displayTransaksiTable(transaksi) {
    const tbody = document.getElementById('transaksiBody');
    const tableEl = document.getElementById('transaksiTable');
    const noDataEl = document.getElementById('noTransaksiData');
    const loadingEl = document.getElementById('loadingTransaksi');
    
    if (!tbody || !tableEl || !noDataEl || !loadingEl) return;
    
    loadingEl.style.display = 'none';
    
    if (!transaksi || transaksi.length === 0) {
        tableEl.style.display = 'none';
        noDataEl.style.display = 'block';
        return;
    }
    
    tableEl.style.display = 'table';
    noDataEl.style.display = 'none';
    
    // Kelompokkan berdasarkan order_no untuk tampilan yang lebih rapi
    const groupedByOrder = {};
    transaksi.forEach(item => {
        if (!groupedByOrder[item.order_no]) {
            groupedByOrder[item.order_no] = [];
        }
        groupedByOrder[item.order_no].push(item);
    });
    
    let html = '';
    let rowNumber = 0;
    
    // Loop melalui setiap order
    Object.keys(groupedByOrder).forEach(orderNo => {
        const items = groupedByOrder[orderNo];
        const firstItem = items[0]; // Ambil data umum dari item pertama
        
        // Tampilkan setiap item dalam order
        items.forEach((item, index) => {
            const isFirstItem = index === 0;
            
            // Format tanggal dan waktu
            const orderDate = item.order_date ? new Date(item.order_date + 'T00:00:00') : null;
            const formattedDate = orderDate ? orderDate.toLocaleDateString('id-ID') : '-';
            
            // Status badge
            let statusBadge = '';
            if (item.status === 'completed') {
                statusBadge = '<span class="status-badge status-completed">Completed</span>';
            } else if (item.status === 'pending') {
                statusBadge = '<span class="status-badge status-pending">Pending</span>';
            } else if (item.status === 'cancelled') {
                statusBadge = '<span class="status-badge status-cancelled">Cancelled</span>';
            } else {
                statusBadge = `<span class="status-badge">${item.status || '-'}</span>`;
            }
            
            // Payment type badge
            let paymentBadge = '';
            if (item.payment_type === 'cash') {
                paymentBadge = '<span class="payment-badge payment-cash">Cash</span>';
            } else if (item.payment_type === 'qris') {
                paymentBadge = '<span class="payment-badge payment-qris">QRIS</span>';
            } else if (item.payment_type === 'transfer') {
                paymentBadge = '<span class="payment-badge payment-transfer">Transfer</span>';
            } else {
                paymentBadge = item.payment_type || '-';
            }
            
            html += `
                <tr class="${isFirstItem ? 'first-item-row' : ''}">
                    <td>
                        <div class="order-no">${item.order_no || '-'}</div>
                        ${isFirstItem ? `<div class="order-detail-badge">${items.length} item</div>` : ''}
                    </td>
                    <td>${formattedDate}</td>
                    <td>${item.order_time || '-'}</td>
                    <td>${item.outlet || '-'}</td>
                    <td>${item.serve_by || '-'}</td>
                    <td>${item.kasir || '-'}</td>
                    <td>
                        <div class="customer-info">
                            <div>${item.customer_name || 'Umum'}</div>
                            ${item.customer_id ? `<small>ID: ${item.customer_id}</small>` : ''}
                        </div>
                    </td>
                    <td>
                        <div class="item-name">${item.item_name || '-'}</div>
                        <small class="item-group">${item.item_group || ''}</small>
                    </td>
                    <td>${item.item_group || '-'}</td>
                    <td class="text-center">${item.qty || 0}</td>
                    <td class="text-right">${formatRupiah(item.amount || 0)}</td>
                    <td class="text-right commission-col">${formatRupiah(item.comission || 0)}</td>
                    <td class="text-center">${paymentBadge}</td>
                    <td class="text-center">${statusBadge}</td>
                </tr>
            `;
            
            rowNumber++;
        });
        
        // Tambahkan separator antar order
        html += `<tr class="order-separator"><td colspan="14"></td></tr>`;
    });
    
    tbody.innerHTML = html;
}

// [7] Fungsi untuk load dropdown outlet (owner only)
async function loadOutletDropdownTransaksi() {
    const select = document.getElementById('filterOutlet');
    if (!select) return;
    
    try {
        // Ambil daftar outlet unik dari tabel transaksi_detail
        const { data: outlets, error } = await supabase
            .from('transaksi_detail')
            .select('outlet')
            .not('outlet', 'is', null)
            .order('outlet');
        
        if (error) throw error;
        
        // Get unique outlets
        const uniqueOutlets = [...new Set(outlets.map(o => o.outlet))].filter(Boolean);
        
        select.innerHTML = `
            <option value="all">Semua Outlet</option>
            ${uniqueOutlets.map(outlet => 
                `<option value="${outlet}">${outlet}</option>`
            ).join('')}
        `;
        
        // Set default ke outlet user saat ini jika ada
        if (currentUserOutletTransaksi && uniqueOutlets.includes(currentUserOutletTransaksi)) {
            select.value = currentUserOutletTransaksi;
        }
        
    } catch (error) {
        console.error('Error loading outlets:', error);
        select.innerHTML = '<option value="all">Semua Outlet</option>';
    }
}

// [8] Helper function: format rupiah
function formatRupiah(amount) {
    if (amount === 0 || !amount) return 'Rp 0';
    return 'Rp ' + amount.toLocaleString('id-ID');
}

// [9] Tambahkan CSS styling
function addTransaksiPageStyles() {
    const styleId = 'transaksi-page-styles';
    
    // Hapus style sebelumnya jika ada
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) existingStyle.remove();
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        /* ===== TRANSAKSI PAGE STYLES ===== */
        .transaksi-page {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f7fa;
            min-height: 100vh;
            padding: 20px;
            color: #333;
        }
        
        /* Header */
        .transaksi-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            margin-bottom: 20px;
        }
        
        .transaksi-header h2 {
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
        
        .refresh-btn {
            background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
            color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
        }
        
        .refresh-btn:hover {
            background: linear-gradient(135deg, #495057 0%, #343a40 100%);
            transform: rotate(90deg);
        }
        
        /* Info Header */
        .transaksi-info-header {
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
        
        /* Filter Section */
        .transaksi-filter-section {
            background: white;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .filter-row {
            display: flex;
            flex-wrap: wrap;
            align-items: flex-end;
            gap: 15px;
        }
        
        .filter-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
            min-width: 150px;
        }
        
        .filter-group label {
            font-size: 13px;
            font-weight: 600;
            color: #495057;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .filter-group label i {
            color: #007bff;
            width: 16px;
        }
        
        .date-filter-group {
            min-width: 180px;
        }
        
        .date-picker {
            padding: 8px 12px;
            border: 1px solid #ced4da;
            border-radius: 6px;
            font-size: 14px;
            font-family: inherit;
            background: white;
            cursor: pointer;
        }
        
        .date-picker:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
        }
        
        .outlet-select, .status-select {
            padding: 8px 12px;
            border: 1px solid #ced4da;
            border-radius: 6px;
            font-size: 14px;
            background: white;
            cursor: pointer;
        }
        
        .btn-apply-filter {
            padding: 8px 20px;
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s;
            height: 38px;
            align-self: flex-end;
        }
        
        .btn-apply-filter:hover {
            background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,123,255,0.3);
        }
        
        /* Summary Cards */
        .transaksi-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 25px;
        }
        
        .summary-card {
            background: white;
            border-radius: 10px;
            padding: 15px;
            display: flex;
            align-items: center;
            gap: 15px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            transition: transform 0.3s;
        }
        
        .summary-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .summary-icon {
            width: 50px;
            height: 50px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: white;
        }
        
        .summary-icon.bg-primary { background: linear-gradient(135deg, #007bff, #0056b3); }
        .summary-icon.bg-success { background: linear-gradient(135deg, #28a745, #20c997); }
        .summary-icon.bg-warning { background: linear-gradient(135deg, #ffc107, #fd7e14); }
        .summary-icon.bg-info { background: linear-gradient(135deg, #17a2b8, #138496); }
        
        .summary-content {
            flex: 1;
        }
        
        .summary-label {
            font-size: 12px;
            color: #6c757d;
            margin-bottom: 3px;
        }
        
        .summary-value {
            font-size: 20px;
            font-weight: 700;
            color: #2c3e50;
        }
        
        /* Table Section */
        .transaksi-table-section {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            margin-bottom: 20px;
        }
        
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .section-header h3 {
            margin: 0;
            color: #2c3e50;
            font-size: 1.2rem;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .table-info {
            color: #6c757d;
            font-size: 14px;
            font-style: italic;
        }
        
        .transaksi-table-container {
            position: relative;
            min-height: 200px;
        }
        
        .table-wrapper {
            overflow-x: auto;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        
        .transaksi-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
            min-width: 1200px;
        }
        
        .transaksi-table th {
            background: #f8f9fa;
            color: #495057;
            font-weight: 600;
            padding: 12px 10px;
            text-align: left;
            border-bottom: 2px solid #dee2e6;
            white-space: nowrap;
        }
        
        .transaksi-table td {
            padding: 10px;
            border-bottom: 1px solid #e9ecef;
            vertical-align: top;
        }
        
        .transaksi-table tbody tr:hover {
            background: #f8f9fa;
        }
        
        .first-item-row {
            background: #f8f9fa;
        }
        
        .order-no {
            font-weight: 600;
            color: #007bff;
        }
        
        .order-detail-badge {
            font-size: 11px;
            color: #6c757d;
            margin-top: 3px;
        }
        
        .customer-info {
            display: flex;
            flex-direction: column;
        }
        
        .customer-info small {
            color: #6c757d;
            font-size: 11px;
        }
        
        .item-name {
            font-weight: 500;
        }
        
        .item-group {
            color: #6c757d;
            font-size: 11px;
        }
        
        .text-center {
            text-align: center;
        }
        
        .text-right {
            text-align: right;
        }
        
        .commission-col {
            color: #28a745;
            font-weight: 600;
        }
        
        /* Status Badges */
        .status-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            display: inline-block;
            white-space: nowrap;
        }
        
        .status-completed {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .status-pending {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeeba;
        }
        
        .status-cancelled {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        /* Payment Badges */
        .payment-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            display: inline-block;
            white-space: nowrap;
        }
        
        .payment-cash {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .payment-qris {
            background: #cce5ff;
            color: #004085;
            border: 1px solid #b8daff;
        }
        
        .payment-transfer {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        
        /* Order Separator */
        .order-separator td {
            padding: 5px 0;
            background: transparent;
            border-bottom: none;
        }
        
        /* Loading & No Data */
        .loading {
            text-align: center;
            padding: 40px;
            color: #6c757d;
            font-style: italic;
        }
        
        .loading:after {
            content: '';
            display: inline-block;
            width: 20px;
            height: 20px;
            margin-left: 10px;
            border: 2px solid #007bff;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            vertical-align: middle;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .no-data {
            text-align: center;
            padding: 60px 20px;
            color: #6c757d;
        }
        
        .no-data i {
            font-size: 48px;
            margin-bottom: 15px;
            color: #adb5bd;
        }
        
        .no-data p {
            margin: 5px 0;
            font-size: 16px;
        }
        
        .no-data .hint {
            font-size: 14px;
            color: #adb5bd;
        }
        
        /* Footer */
        .transaksi-footer {
            text-align: center;
            color: #6c757d;
            font-size: 12px;
            padding: 10px;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .transaksi-page {
                padding: 10px;
            }
            
            .filter-row {
                flex-direction: column;
                align-items: stretch;
            }
            
            .filter-group {
                width: 100%;
            }
            
            .btn-apply-filter {
                width: 100%;
                justify-content: center;
            }
            
            .transaksi-summary {
                grid-template-columns: 1fr 1fr;
            }
            
            .summary-card {
                padding: 10px;
            }
            
            .summary-icon {
                width: 40px;
                height: 40px;
                font-size: 18px;
            }
            
            .summary-value {
                font-size: 16px;
            }
            
            .info-row {
                flex-direction: column;
                gap: 8px;
            }
            
            .section-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
        }
        
        @media (max-width: 480px) {
            .transaksi-summary {
                grid-template-columns: 1fr;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Export functions ke global scope
window.showTransaksiPage = showTransaksiPage;
window.loadTransaksiData = loadTransaksiData;

// ========== END OF FILE ==========
