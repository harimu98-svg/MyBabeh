// ========== FUNGSI MENU KOMPONEN - TRANSAKSI ==========
// ====================================================

// Variabel global
let currentKaryawanTransaksi = null;
let currentUserOutletTransaksi = null;
let isOwnerTransaksi = false;
let realtimeSubscription = null;
let lastUpdateTime = null;

// [1] Fungsi utama untuk tampilkan halaman transaksi
async function showTransaksiPage() {
    try {
        // Bersihkan subscription lama jika ada
        if (realtimeSubscription) {
            supabase.removeChannel(realtimeSubscription);
            realtimeSubscription = null;
        }
        
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
        
        // Load data awal
        await loadInitialData();
        
        // Setup realtime subscription untuk update otomatis
        setupRealtimeSubscription();
        
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
                <span class="realtime-badge" id="realtimeBadge">
                    <i class="fas fa-circle"></i> Live
                </span>
                <button class="refresh-btn" id="refreshTransaksi" title="Refresh Manual">
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
                <!-- Filter Outlet (untuk Owner) - dari tabel outlet -->
                ${isOwnerTransaksi ? `
                <div class="filter-group">
                    <label for="filterOutlet"><i class="fas fa-store"></i> Outlet:</label>
                    <select id="filterOutlet" class="outlet-select">
                        <option value="all">Semua Outlet</option>
                    </select>
                </div>
                ` : ''}
                
                <!-- Filter Karyawan / Serve By -->
                <div class="filter-group">
                    <label for="filterKaryawan"><i class="fas fa-user-tie"></i> Karyawan:</label>
                    <select id="filterKaryawan" class="karyawan-select">
                        <option value="all">Semua Karyawan</option>
                    </select>
                </div>
                
                <!-- Filter Tanggal dengan Date Picker -->
                <div class="filter-group date-filter-group">
                    <label for="filterDate"><i class="fas fa-calendar-alt"></i> Tanggal:</label>
                    <input type="date" id="filterDate" class="date-picker" value="${todayFormatted}" max="${todayFormatted}">
                </div>
                
                <!-- Tombol Terapkan Filter -->
                <button class="btn-apply-filter" id="applyTransaksiFilter">
                    <i class="fas fa-search"></i> Tampilkan
                </button>
            </div>
        </div>
        
        <!-- TRANSaksi Terakhir (1 transaksi terbaru) -->
        <section class="transaksi-terakhir-section">
            <div class="section-header">
                <h3><i class="fas fa-clock"></i> Transaksi Terakhir</h3>
                <span class="update-indicator" id="updateIndicator">Memperbarui otomatis...</span>
            </div>
            
            <div class="transaksi-terakhir-card" id="transaksiTerakhirCard">
                <div class="loading-small" id="loadingTerakhir">Memuat transaksi terakhir...</div>
                <div class="terakhir-content" id="terakhirContent" style="display: none;">
                    <!-- Konten akan diisi oleh JavaScript -->
                </div>
            </div>
        </section>
        
        <!-- Transaksi Harian -->
        <section class="transaksi-harian-section">
            <div class="section-header">
                <h3><i class="fas fa-calendar-day"></i> Transaksi Harian</h3>
                <div class="table-info" id="tableInfo">Memuat data...</div>
            </div>
            
            <div class="transaksi-table-container">
                <div class="loading" id="loadingTransaksi">Memuat data transaksi...</div>
                
                <div class="table-wrapper">
                    <table class="transaksi-table" id="transaksiTable" style="display: none;">
                        <thead>
                            <tr>
                                <th>No. Order</th>
                                <th>Jam</th>
                                <th>Outlet</th>
                                <th>Serve By</th>
                                <th>Kasir</th>
                                <th>Customer</th>
                                <th>Item</th>
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
        // Bersihkan subscription
        if (realtimeSubscription) {
            supabase.removeChannel(realtimeSubscription);
            realtimeSubscription = null;
        }
        document.getElementById('transaksiPage').remove();
        document.getElementById('appScreen').style.display = 'block';
    });
    
    // Tombol refresh manual
    document.getElementById('refreshTransaksi').addEventListener('click', async () => {
        const btn = document.getElementById('refreshTransaksi');
        btn.classList.add('loading');
        await loadTransaksiData();
        await loadTransaksiTerakhir();
        btn.classList.remove('loading');
    });
    
    // Tombol apply filter
    document.getElementById('applyTransaksiFilter').addEventListener('click', async () => {
        await loadTransaksiData();
        await loadTransaksiTerakhir();
    });
    
    // Enter key pada date picker
    document.getElementById('filterDate').addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            await loadTransaksiData();
            await loadTransaksiTerakhir();
        }
    });
    
    // Filter karyawan berubah
    document.getElementById('filterKaryawan').addEventListener('change', async () => {
        await loadTransaksiData();
        await loadTransaksiTerakhir();
    });
    
    // Jika owner, setup filter outlet
    if (isOwnerTransaksi) {
        const filterOutlet = document.getElementById('filterOutlet');
        if (filterOutlet) {
            filterOutlet.addEventListener('change', async () => {
                // Ketika outlet berubah, reload dropdown karyawan
                await loadKaryawanDropdownTransaksi();
                await loadTransaksiData();
                await loadTransaksiTerakhir();
            });
        }
    }
}

// [4] Fungsi untuk load initial data
async function loadInitialData() {
    try {
        // Load dropdown outlet (dari tabel outlet)
        if (isOwnerTransaksi) {
            await loadOutletDropdownTransaksi();
        }
        
        // Load dropdown karyawan
        await loadKaryawanDropdownTransaksi();
        
        // Load transaksi terakhir
        await loadTransaksiTerakhir();
        
        // Load transaksi harian
        await loadTransaksiData();
        
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

// [5] Fungsi untuk load dropdown outlet dari tabel OUTLET
async function loadOutletDropdownTransaksi() {
    const select = document.getElementById('filterOutlet');
    if (!select) return;
    
    try {
        // Ambil data dari tabel outlet
        const { data: outlets, error } = await supabase
            .from('outlet')
            .select('nama_outlet')
            .eq('status', 'active')
            .order('nama_outlet');
        
        if (error) throw error;
        
        select.innerHTML = `
            <option value="all">Semua Outlet</option>
            ${outlets.map(outlet => 
                `<option value="${outlet.nama_outlet}">${outlet.nama_outlet}</option>`
            ).join('')}
        `;
        
        // Set default ke outlet user saat ini jika ada
        if (currentUserOutletTransaksi) {
            const matchingOutlet = outlets.find(o => o.nama_outlet === currentUserOutletTransaksi);
            if (matchingOutlet) {
                select.value = currentUserOutletTransaksi;
            }
        }
        
    } catch (error) {
        console.error('Error loading outlets:', error);
        select.innerHTML = '<option value="all">Semua Outlet</option>';
    }
}

// [6] Fungsi untuk load dropdown karyawan berdasarkan outlet yang dipilih
async function loadKaryawanDropdownTransaksi() {
    const select = document.getElementById('filterKaryawan');
    if (!select) return;
    
    try {
        let query = supabase
            .from('karyawan')
            .select('nama_karyawan, role')
            .eq('status', 'active')
            .order('nama_karyawan');
        
        // Jika owner dan ada filter outlet, filter karyawan berdasarkan outlet
        if (isOwnerTransaksi) {
            const outletFilter = document.getElementById('filterOutlet')?.value;
            if (outletFilter && outletFilter !== 'all') {
                query = query.eq('outlet', outletFilter);
            }
        } else {
            // Untuk kasir/barberman: hanya tampilkan dirinya sendiri
            query = query.eq('nama_karyawan', currentKaryawanTransaksi.nama_karyawan);
        }
        
        const { data: karyawan, error } = await query;
        
        if (error) throw error;
        
        if (isOwnerTransaksi) {
            // Owner: tampilkan semua karyawan yang sesuai filter
            select.innerHTML = `
                <option value="all">Semua Karyawan</option>
                ${karyawan.map(k => 
                    `<option value="${k.nama_karyawan}">${k.nama_karyawan} (${k.role})</option>`
                ).join('')}
            `;
        } else {
            // Kasir/Barberman: hanya dirinya sendiri, otomatis terpilih
            select.innerHTML = `
                <option value="${currentKaryawanTransaksi.nama_karyawan}">
                    ${currentKaryawanTransaksi.nama_karyawan} (${currentKaryawanTransaksi.role})
                </option>
            `;
            select.disabled = true; // Disable karena hanya 1 pilihan
        }
        
    } catch (error) {
        console.error('Error loading karyawan:', error);
        select.innerHTML = '<option value="all">Error loading data</option>';
    }
}

// [7] Fungsi untuk load transaksi terakhir (1 transaksi terbaru)
async function loadTransaksiTerakhir() {
    try {
        const loadingEl = document.getElementById('loadingTerakhir');
        const contentEl = document.getElementById('terakhirContent');
        
        if (!loadingEl || !contentEl) return;
        
        loadingEl.style.display = 'block';
        contentEl.style.display = 'none';
        
        // Dapatkan filter
        const selectedDate = document.getElementById('filterDate').value;
        const karyawanFilter = document.getElementById('filterKaryawan').value;
        
        // Bangun query
        let query = supabase
            .from('transaksi_detail')
            .select('*')
            .order('order_date', { ascending: false })
            .order('order_time', { ascending: false })
            .limit(1); // Ambil 1 transaksi terbaru
        
        // Filter tanggal (opsional)
        if (selectedDate) {
            query = query.eq('order_date', selectedDate);
        }
        
        // Filter outlet untuk owner
        if (isOwnerTransaksi) {
            const outletFilter = document.getElementById('filterOutlet')?.value;
            if (outletFilter && outletFilter !== 'all') {
                query = query.eq('outlet', outletFilter);
            }
        } else {
            // Non-owner: filter outlet karyawan
            query = query.eq('outlet', currentUserOutletTransaksi);
        }
        
        // Filter karyawan
        if (karyawanFilter && karyawanFilter !== 'all') {
            query = query.eq('serve_by', karyawanFilter);
        }
        
        const { data: transaksi, error } = await query;
        
        if (error) throw error;
        
        // Tampilkan data
        displayTransaksiTerakhir(transaksi && transaksi.length > 0 ? transaksi[0] : null);
        
    } catch (error) {
        console.error('Error loading transaksi terakhir:', error);
        const contentEl = document.getElementById('terakhirContent');
        if (contentEl) {
            contentEl.innerHTML = `
                <div class="error-message-small">
                    <i class="fas fa-exclamation-triangle"></i>
                    Gagal memuat transaksi terakhir
                </div>
            `;
            contentEl.style.display = 'block';
        }
    } finally {
        const loadingEl = document.getElementById('loadingTerakhir');
        if (loadingEl) loadingEl.style.display = 'none';
    }
}

// [8] Fungsi untuk display transaksi terakhir dalam bentuk kartu
function displayTransaksiTerakhir(transaksi) {
    const contentEl = document.getElementById('terakhirContent');
    if (!contentEl) return;
    
    if (!transaksi) {
        contentEl.innerHTML = `
            <div class="empty-state-small">
                <i class="fas fa-receipt"></i>
                <p>Belum ada transaksi</p>
            </div>
        `;
        contentEl.style.display = 'block';
        return;
    }
    
    // Format tanggal dan waktu
    const orderDate = transaksi.order_date ? new Date(transaksi.order_date + 'T00:00:00') : null;
    const formattedDate = orderDate ? orderDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }) : '-';
    
    // Status badge
    let statusBadge = '';
    if (transaksi.status === 'completed') {
        statusBadge = '<span class="status-badge-small status-completed">Completed</span>';
    } else if (transaksi.status === 'pending') {
        statusBadge = '<span class="status-badge-small status-pending">Pending</span>';
    } else if (transaksi.status === 'cancelled') {
        statusBadge = '<span class="status-badge-small status-cancelled">Cancelled</span>';
    } else {
        statusBadge = `<span class="status-badge-small">${transaksi.status || '-'}</span>`;
    }
    
    // Payment badge
    let paymentBadge = '';
    if (transaksi.payment_type === 'cash') {
        paymentBadge = '<span class="payment-badge-small payment-cash">Cash</span>';
    } else if (transaksi.payment_type === 'qris') {
        paymentBadge = '<span class="payment-badge-small payment-qris">QRIS</span>';
    } else if (transaksi.payment_type === 'transfer') {
        paymentBadge = '<span class="payment-badge-small payment-transfer">Transfer</span>';
    } else {
        paymentBadge = transaksi.payment_type || '-';
    }
    
    contentEl.innerHTML = `
        <div class="terakhir-grid">
            <div class="terakhir-item">
                <div class="terakhir-label">No. Order</div>
                <div class="terakhir-value">${transaksi.order_no || '-'}</div>
            </div>
            <div class="terakhir-item">
                <div class="terakhir-label">Tanggal</div>
                <div class="terakhir-value">${formattedDate}</div>
            </div>
            <div class="terakhir-item">
                <div class="terakhir-label">Jam</div>
                <div class="terakhir-value">${transaksi.order_time || '-'}</div>
            </div>
            <div class="terakhir-item">
                <div class="terakhir-label">Outlet</div>
                <div class="terakhir-value">${transaksi.outlet || '-'}</div>
            </div>
            <div class="terakhir-item">
                <div class="terakhir-label">Serve By</div>
                <div class="terakhir-value">${transaksi.serve_by || '-'}</div>
            </div>
            <div class="terakhir-item">
                <div class="terakhir-label">Kasir</div>
                <div class="terakhir-value">${transaksi.kasir || '-'}</div>
            </div>
            <div class="terakhir-item">
                <div class="terakhir-label">Customer</div>
                <div class="terakhir-value">${transaksi.customer_name || 'Umum'}</div>
            </div>
            <div class="terakhir-item">
                <div class="terakhir-label">Item</div>
                <div class="terakhir-value">${transaksi.item_name || '-'}</div>
            </div>
            <div class="terakhir-item">
                <div class="terakhir-label">Qty</div>
                <div class="terakhir-value">${transaksi.qty || 0}</div>
            </div>
            <div class="terakhir-item">
                <div class="terakhir-label">Amount</div>
                <div class="terakhir-value amount">${formatRupiah(transaksi.amount || 0)}</div>
            </div>
            <div class="terakhir-item">
                <div class="terakhir-label">Komisi</div>
                <div class="terakhir-value commission">${formatRupiah(transaksi.comission || 0)}</div>
            </div>
            <div class="terakhir-item">
                <div class="terakhir-label">Payment</div>
                <div class="terakhir-value">${paymentBadge}</div>
            </div>
            <div class="terakhir-item">
                <div class="terakhir-label">Status</div>
                <div class="terakhir-value">${statusBadge}</div>
            </div>
        </div>
    `;
    
    contentEl.style.display = 'block';
}

// [9] Fungsi untuk load transaksi harian
async function loadTransaksiData() {
    try {
        console.log('=== LOADING TRANSAKSI HARIAN ===');
        
        // Tampilkan loading
        document.getElementById('loadingTransaksi').style.display = 'block';
        document.getElementById('transaksiTable').style.display = 'none';
        document.getElementById('noTransaksiData').style.display = 'none';
        document.getElementById('tableInfo').textContent = 'Memuat data...';
        
        // Dapatkan filter
        const selectedDate = document.getElementById('filterDate').value;
        const karyawanFilter = document.getElementById('filterKaryawan').value;
        
        if (!selectedDate) {
            alert('Pilih tanggal terlebih dahulu!');
            document.getElementById('loadingTransaksi').style.display = 'none';
            return;
        }
        
        console.log('Filter:', { 
            tanggal: selectedDate, 
            karyawan: karyawanFilter,
            isOwner: isOwnerTransaksi
        });
        
        // Bangun query
        let query = supabase
            .from('transaksi_detail')
            .select('*')
            .eq('order_date', selectedDate);
        
        // Filter outlet
        if (isOwnerTransaksi) {
            const outletFilter = document.getElementById('filterOutlet')?.value;
            if (outletFilter && outletFilter !== 'all') {
                query = query.eq('outlet', outletFilter);
            }
        } else {
            // Non-owner: filter outlet karyawan
            query = query.eq('outlet', currentUserOutletTransaksi);
        }
        
        // Filter karyawan (serve_by)
        if (karyawanFilter && karyawanFilter !== 'all') {
            query = query.eq('serve_by', karyawanFilter);
        }
        
        // Urutkan berdasarkan waktu
        query = query.order('order_time', { ascending: false });
        
        const { data: transaksi, error } = await query;
        
        if (error) throw error;
        
        console.log(`Ditemukan ${transaksi?.length || 0} record transaksi`);
        
        // Tampilkan data di tabel
        displayTransaksiHarian(transaksi || []);
        
        // Update table info
        document.getElementById('tableInfo').textContent = `${transaksi?.length || 0} record ditemukan`;
        
        // Update waktu terakhir update
        lastUpdateTime = new Date();
        document.getElementById('lastUpdateTime').textContent = lastUpdateTime.toLocaleTimeString('id-ID');
        
        console.log('=== FINISHED LOADING TRANSAKSI HARIAN ===');
        
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

// [10] Fungsi untuk tampilkan transaksi harian
function displayTransaksiHarian(transaksi) {
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
    
    let html = '';
    
    transaksi.forEach((item, index) => {
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
        
        // Payment badge
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
            <tr>
                <td>
                    <div class="order-no">${item.order_no || '-'}</div>
                </td>
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
                <td class="text-center">${item.qty || 0}</td>
                <td class="text-right">${formatRupiah(item.amount || 0)}</td>
                <td class="text-right commission-col">${formatRupiah(item.comission || 0)}</td>
                <td class="text-center">${paymentBadge}</td>
                <td class="text-center">${statusBadge}</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// [11] Setup realtime subscription untuk update otomatis
function setupRealtimeSubscription() {
    try {
        // Tentukan channel name
        const channelName = `transaksi-realtime-${Date.now()}`;
        
        // Buat subscription
        realtimeSubscription = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'transaksi_detail'
                },
                async (payload) => {
                    console.log('Transaksi baru detected:', payload);
                    
                    // Update indikator
                    const indicator = document.getElementById('updateIndicator');
                    if (indicator) {
                        indicator.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Update detected...';
                    }
                    
                    // Reload transaksi terakhir
                    await loadTransaksiTerakhir();
                    
                    // Reload transaksi harian jika tanggal sesuai filter
                    const selectedDate = document.getElementById('filterDate').value;
                    const newTransaksiDate = payload.new.order_date;
                    
                    if (newTransaksiDate === selectedDate) {
                        await loadTransaksiData();
                    }
                    
                    // Update indikator
                    if (indicator) {
                        indicator.innerHTML = '<i class="fas fa-check-circle"></i> Updated just now';
                        setTimeout(() => {
                            indicator.innerHTML = 'Memperbarui otomatis...';
                        }, 3000);
                    }
                    
                    // Update last update time
                    lastUpdateTime = new Date();
                    document.getElementById('lastUpdateTime').textContent = lastUpdateTime.toLocaleTimeString('id-ID');
                }
            )
            .subscribe((status) => {
                console.log('Realtime subscription status:', status);
                
                const badge = document.getElementById('realtimeBadge');
                if (badge) {
                    if (status === 'SUBSCRIBED') {
                        badge.className = 'realtime-badge connected';
                        badge.innerHTML = '<i class="fas fa-circle"></i> Live';
                    } else {
                        badge.className = 'realtime-badge disconnected';
                        badge.innerHTML = '<i class="fas fa-circle"></i> Disconnected';
                    }
                }
            });
            
    } catch (error) {
        console.error('Error setting up realtime:', error);
    }
}

// [12] Helper function: format rupiah
function formatRupiah(amount) {
    if (amount === 0 || !amount) return 'Rp 0';
    return 'Rp ' + amount.toLocaleString('id-ID');
}

// [13] Tambahkan CSS styling
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
            margin-left: 10px;
        }
        
        .refresh-btn:hover {
            background: linear-gradient(135deg, #495057 0%, #343a40 100%);
            transform: rotate(90deg);
        }
        
        .refresh-btn.loading i {
            animation: spin 1s linear infinite;
        }
        
        .realtime-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .realtime-badge.connected {
            background: #d4edda;
            color: #155724;
        }
        
        .realtime-badge.connected i {
            color: #28a745;
            font-size: 8px;
        }
        
        .realtime-badge.disconnected {
            background: #f8d7da;
            color: #721c24;
        }
        
        .realtime-badge.disconnected i {
            color: #dc3545;
            font-size: 8px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
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
        
        .date-picker, .outlet-select, .karyawan-select {
            padding: 8px 12px;
            border: 1px solid #ced4da;
            border-radius: 6px;
            font-size: 14px;
            background: white;
            cursor: pointer;
        }
        
        .date-picker:focus, .outlet-select:focus, .karyawan-select:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
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
        
        /* Transaksi Terakhir Section */
        .transaksi-terakhir-section {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            margin-bottom: 25px;
        }
        
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .section-header h3 {
            margin: 0;
            color: #2c3e50;
            font-size: 1.2rem;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .update-indicator {
            font-size: 12px;
            color: #28a745;
            font-style: italic;
        }
        
        .update-indicator i {
            margin-right: 5px;
        }
        
        .transaksi-terakhir-card {
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 15px;
            background: #f8f9fa;
        }
        
        .loading-small {
            text-align: center;
            padding: 20px;
            color: #6c757d;
            font-style: italic;
        }
        
        .loading-small:after {
            content: '';
            display: inline-block;
            width: 16px;
            height: 16px;
            margin-left: 10px;
            border: 2px solid #007bff;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            vertical-align: middle;
        }
        
        .empty-state-small {
            text-align: center;
            padding: 30px;
            color: #6c757d;
        }
        
        .empty-state-small i {
            font-size: 36px;
            margin-bottom: 10px;
            color: #adb5bd;
        }
        
        .error-message-small {
            text-align: center;
            padding: 20px;
            color: #ff4757;
        }
        
        .terakhir-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .terakhir-item {
            display: flex;
            flex-direction: column;
        }
        
        .terakhir-label {
            font-size: 11px;
            color: #6c757d;
            margin-bottom: 3px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .terakhir-value {
            font-size: 14px;
            font-weight: 600;
            color: #2c3e50;
        }
        
        .terakhir-value.amount {
            color: #007bff;
        }
        
        .terakhir-value.commission {
            color: #28a745;
        }
        
        .status-badge-small {
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            display: inline-block;
        }
        
        .payment-badge-small {
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            display: inline-block;
        }
        
        /* Transaksi Harian Section */
        .transaksi-harian-section {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            margin-bottom: 20px;
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
        
        .order-no {
            font-weight: 600;
            color: #007bff;
            font-size: 12px;
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
            font-size: 13px;
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
            
            .terakhir-grid {
                grid-template-columns: 1fr 1fr;
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
            
            .realtime-badge {
                font-size: 11px;
                padding: 4px 8px;
            }
        }
        
        @media (max-width: 480px) {
            .terakhir-grid {
                grid-template-columns: 1fr;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Export functions ke global scope
window.showTransaksiPage = showTransaksiPage;
window.loadTransaksiData = loadTransaksiData;
window.loadTransaksiTerakhir = loadTransaksiTerakhir;

// ========== END OF FILE ==========
