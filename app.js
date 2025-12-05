// ========== BAGIAN 1: KONFIGURASI & INISIALISASI ==========
// ========================================================

// Konfigurasi Supabase
const supabaseUrl = 'https://intzwjmlypmopzauxeqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImludHp3am1seXBtb3B6YXV4ZXF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MTc5MTIsImV4cCI6MjA3MDI5MzkxMn0.VwwVEDdHtYP5gui4epTcNfLXhPkmfFbRVb5y8mrXJiM';

// Inisialisasi Supabase
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Data menu berdasarkan role
const menuItems = {
    kasir: [
        { id: 'komisi', title: 'Komisi', icon: 'fa-money-bill-wave', colorClass: 'menu-komisi' },
        { id: 'slip', title: 'Slip Penghasilan', icon: 'fa-file-invoice-dollar', colorClass: 'menu-slip' },
        { id: 'libur', title: 'Libur & Izin', icon: 'fa-calendar-day', colorClass: 'menu-libur' },
        { id: 'absensi', title: 'Absensi', icon: 'fa-fingerprint', colorClass: 'menu-absensi' },
        { id: 'kas', title: 'Kas & Setoran', icon: 'fa-cash-register', colorClass: 'menu-kas' },
        { id: 'request', title: 'Request', icon: 'fa-comment-dots', colorClass: 'menu-request' },
        { id: 'stok', title: 'Tambah Stok', icon: 'fa-boxes', colorClass: 'menu-stok' }
    ],
    barberman: [
        { id: 'komisi', title: 'Komisi', icon: 'fa-money-bill-wave', colorClass: 'menu-komisi' },
        { id: 'slip', title: 'Slip Penghasilan', icon: 'fa-file-invoice-dollar', colorClass: 'menu-slip' },
        { id: 'libur', title: 'Libur & Izin', icon: 'fa-calendar-day', colorClass: 'menu-libur' },
        { id: 'absensi', title: 'Absensi', icon: 'fa-fingerprint', colorClass: 'menu-absensi' },
        { id: 'top', title: 'TOP', icon: 'fa-tools', colorClass: 'menu-top' },
        { id: 'sertifikasi', title: 'Sertifikasi', icon: 'fa-certificate', colorClass: 'menu-sertifikasi' }
    ],
    owner: [
        { id: 'komisi', title: 'Komisi', icon: 'fa-money-bill-wave', colorClass: 'menu-komisi' },
        { id: 'slip', title: 'Slip Penghasilan', icon: 'fa-file-invoice-dollar', colorClass: 'menu-slip' },
        { id: 'libur', title: 'Libur & Izin', icon: 'fa-calendar-day', colorClass: 'menu-libur' },
        { id: 'absensi', title: 'Absensi', icon: 'fa-fingerprint', colorClass: 'menu-absensi' },
        { id: 'kas', title: 'Kas & Setoran', icon: 'fa-cash-register', colorClass: 'menu-kas' },
        { id: 'top', title: 'TOP', icon: 'fa-tools', colorClass: 'menu-top' },
        { id: 'request', title: 'Request', icon: 'fa-comment-dots', colorClass: 'menu-request' },
        { id: 'stok', title: 'Tambah Stok', icon: 'fa-boxes', colorClass: 'menu-stok' },
        { id: 'sertifikasi', title: 'Sertifikasi', icon: 'fa-certificate', colorClass: 'menu-sertifikasi' }
    ]
};

// Data notifikasi contoh
const sampleNotifications = [
    {
        date: '01/12/25 10:00',
        text: 'karyawan Ahmad, Outlet Mall Ciputra, telah submit request',
        type: 'request'
    },
    {
        date: '01/12/25 09:45',
        text: 'karyawan Budi, Outlet Plaza Semanggi, telah submit Izin',
        type: 'izin'
    },
    {
        date: '01/12/25 09:30',
        text: 'karyawan Sari, Outlet Mall Kelapa Gading, telah submit Tambah Stok',
        type: 'stok'
    },
    {
        date: '01/12/25 09:15',
        text: 'karyawan Joko, Outlet Mall Taman Anggrek, telah submit TOP (Tools Ownership Program)',
        type: 'top'
    }
];

// ========== BAGIAN 2: FUNGSI AUTH & LOGIN ==========
// =================================================

// Cek status login saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    
    // Event listener untuk login
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    
    // Event listener untuk logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Enter untuk login
    document.getElementById('loginPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
});

// Fungsi untuk cek status auth
async function checkAuthStatus() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        showAppScreen();
        loadUserData(session.user);
    } else {
        showLoginScreen();
    }
}

// Fungsi untuk handle login
async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errorElement = document.getElementById('loginError');
    
    if (!email || !password) {
        errorElement.textContent = 'Email dan password harus diisi';
        return;
    }
    
    errorElement.textContent = '';
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        }, {
            expiresIn: 86400 // 24 JAM
        });
        
        if (error) {
            throw error;
        }
        
        showAppScreen();
        loadUserData(data.user);
        
    } catch (error) {
        errorElement.textContent = 'Login gagal. Periksa email dan password Anda.';
        console.error('Login error:', error.message);
    }
}

// Fungsi untuk handle logout
async function handleLogout() {
    await supabase.auth.signOut();
    showLoginScreen();
    clearForm();
}

// Fungsi untuk menampilkan login screen
function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('appScreen').style.display = 'none';
}

// Fungsi untuk menampilkan app screen
function showAppScreen() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'block';
}

// Fungsi untuk membersihkan form login
function clearForm() {
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginError').textContent = '';
}

// ========== BAGIAN 3: FUNGSI UTAMA APP ==========
// ==============================================

// Fungsi untuk load data karyawan dari tabel berdasarkan metadata
async function loadUserData(user) {
    // 1. Ambil nama_karyawan dari auth user metadata
    const namaKaryawan = user.user_metadata?.nama_karyawan;
    
    if (!namaKaryawan) {
        console.error('nama_karyawan tidak ditemukan di metadata');
        setDefaultProfile();
        return;
    }
    
    console.log('Loading data untuk karyawan:', namaKaryawan);
    
    // 2. Query ke tabel karyawan dengan nama yang sama
    const { data: karyawanData, error } = await supabase
        .from('karyawan')
        .select('*')
        .eq('nama_karyawan', namaKaryawan)
        .single();
    
    if (error) {
        console.error('Error loading karyawan data:', error);
        setDefaultProfile();
        return;
    }
    
    if (!karyawanData) {
        console.error('Data karyawan tidak ditemukan di tabel');
        setDefaultProfile();
        return;
    }
    
    // 3. Tampilkan data di UI
    updateProfile(karyawanData);
    loadMenu(karyawanData.role);
    
    // 4. Jika owner, tampilkan notifikasi
    if (karyawanData.role === 'owner') {
        showNotifications();
    }
    
    // 5. Load foto jika ada
    if (karyawanData.photo_url) {
        updateProfilePhoto(karyawanData.photo_url);
    }
}

// Fungsi untuk update profil di UI
function updateProfile(data) {
    document.getElementById('profileName').textContent = data.nama_karyawan;
    document.getElementById('profileOutlet').textContent = data.outlet || '-';
    document.getElementById('profileRole').textContent = data.role || '-';
    document.getElementById('profilePosition').textContent = data.posisi || '-';
    document.getElementById('joinDate').textContent = formatDate(data.tanggal_bergabung) || '-';
    document.getElementById('workPeriod').textContent = data.masa_kerja || '-';
    document.getElementById('birthInfo').textContent = data.tempat_tgl_lahir || '-';
    document.getElementById('whatsappNumber').textContent = data.nomor_wa || '-';
}

// Fungsi untuk set profil default (hanya jika error)
function setDefaultProfile() {
    document.getElementById('profileName').textContent = 'Karyawan Babeh';
    document.getElementById('profileOutlet').textContent = '-';
    document.getElementById('profileRole').textContent = '-';
    document.getElementById('profilePosition').textContent = '-';
    document.getElementById('joinDate').textContent = '-';
    document.getElementById('workPeriod').textContent = '-';
    document.getElementById('birthInfo').textContent = '-';
    document.getElementById('whatsappNumber').textContent = '-';
    
    // Load menu default (kasir)
    loadMenu('kasir');
}

// Fungsi untuk update foto profil
function updateProfilePhoto(photoUrl) {
    const profilePhoto = document.getElementById('profilePhoto');
    profilePhoto.innerHTML = '';
    
    const img = document.createElement('img');
    img.src = photoUrl;
    img.alt = 'Foto Profil';
    img.onerror = function() {
        // Jika gambar gagal load, tampilkan icon default
        profilePhoto.innerHTML = '<i class="fas fa-user-circle"></i>';
    };
    
    profilePhoto.appendChild(img);
}

// Fungsi untuk load menu berdasarkan role
function loadMenu(role) {
    const menuGrid = document.getElementById('menuGrid');
    menuGrid.innerHTML = '';
    
    const items = menuItems[role] || menuItems.kasir;
    
    items.forEach(item => {
        const menuItem = document.createElement('button');
        menuItem.className = `menu-item ${item.colorClass}`;
        menuItem.setAttribute('data-menu', item.id);
        
        menuItem.innerHTML = `
            <div class="menu-icon">
                <i class="fas ${item.icon}"></i>
            </div>
            <div class="menu-title">${item.title}</div>
        `;
        
        menuItem.addEventListener('click', () => handleMenuClick(item.id));
        menuGrid.appendChild(menuItem);
    });
}

// Fungsi untuk menampilkan notifikasi (hanya untuk owner)
function showNotifications() {
    const notificationSection = document.getElementById('notificationSection');
    const notificationList = document.getElementById('notificationList');
    
    notificationSection.style.display = 'block';
    notificationList.innerHTML = '';
    
    sampleNotifications.forEach(notification => {
        const notificationItem = document.createElement('div');
        notificationItem.className = 'notification-item';
        
        notificationItem.innerHTML = `
            <div class="notification-content">
                <div class="notification-date">${notification.date}</div>
                <div class="notification-text">${notification.text}</div>
            </div>
            <div class="notification-actions">
                <button class="notification-btn approve">Approve</button>
                <button class="notification-btn reject">Reject</button>
            </div>
        `;
        
        notificationList.appendChild(notificationItem);
    });
    
    // Event listener untuk tombol notifikasi
    document.querySelectorAll('.notification-btn.approve').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            alert('Permintaan telah disetujui!');
        });
    });
    
    document.querySelectorAll('.notification-btn.reject').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            alert('Permintaan telah ditolak!');
        });
    });
}

// Fungsi untuk format tanggal
function formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

// ========== BAGIAN 4: FUNGSI MENU KOMPONEN - KOMPISI ==========
// ============================================================

// Variabel global untuk state komisi
let currentKaryawan = null;
let isOwner = false;

// [4.1] Fungsi untuk tampilkan halaman komisi
async function showKomisiPage() {
    // Simpan data karyawan saat ini
    const { data: { user } } = await supabase.auth.getUser();
    const namaKaryawan = user?.user_metadata?.nama_karyawan;
    
    if (!namaKaryawan) return;
    
    // Ambil data karyawan lengkap
    const { data: karyawanData } = await supabase
        .from('karyawan')
        .select('*')
        .eq('nama_karyawan', namaKaryawan)
        .single();
    
    currentKaryawan = karyawanData;
    isOwner = karyawanData?.role === 'owner';
    
    // Sembunyikan main app, tampilkan halaman komisi
    document.getElementById('appScreen').style.display = 'none';
    
    // Buat container halaman komisi
    createKomisiPage();
    
    // Load data komisi
    await loadKomisiData();
}

// [4.2] Fungsi untuk buat halaman komisi
function createKomisiPage() {
    // Hapus halaman komisi sebelumnya jika ada
    const existingPage = document.getElementById('komisiPage');
    if (existingPage) {
        existingPage.remove();
    }
    
    // Buat container halaman komisi
    const komisiPage = document.createElement('div');
    komisiPage.id = 'komisiPage';
    komisiPage.className = 'komisi-page';
    komisiPage.innerHTML = `
        <!-- Header -->
        <header class="komisi-header">
            <button class="back-btn" id="backToMain">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h2><i class="fas fa-money-bill-wave"></i> Komisi</h2>
            <div class="header-actions">
                <button class="refresh-btn" id="refreshKomisi">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
        </header>
        
        <!-- Filter untuk Owner -->
        <div id="ownerFilterSection" class="owner-filter" style="display: none;">
            <div class="filter-group">
                <label for="selectKaryawan">Pilih Karyawan:</label>
                <select id="selectKaryawan" class="karyawan-select">
                    <option value="">Loading...</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="selectOutlet">Outlet:</label>
                <select id="selectOutlet" class="outlet-select">
                    <option value="all">Semua Outlet</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="dateRange">Periode:</label>
                <select id="dateRange" class="date-select">
                    <option value="today">Hari Ini</option>
                    <option value="week">7 Hari Terakhir</option>
                    <option value="month">Bulan Ini</option>
                    <option value="custom">Custom</option>
                </select>
            </div>
        </div>
        
        <!-- Komisi Hari Ini -->
        <section class="today-komisi-section">
            <h3><i class="fas fa-calendar-day"></i> Komisi Hari Ini</h3>
            <div class="today-komisi-card">
                <div class="loading" id="loadingToday">Loading data hari ini...</div>
                <div id="todayKomisiContent" style="display: none;">
                    <!-- Data akan diisi oleh JavaScript -->
                </div>
            </div>
        </section>
        
        <!-- Komisi 7 Hari Terakhir -->
        <section class="weekly-komisi-section">
            <div class="section-header">
                <h3><i class="fas fa-chart-line"></i> Komisi 7 Hari Terakhir</h3>
                <div class="total-summary">
                    <span>Total 7 Hari: <strong id="total7Hari">Rp 0</strong></span>
                </div>
            </div>
            <div class="weekly-komisi-table-container">
                <div class="loading" id="loadingWeekly">Loading data 7 hari...</div>
                <table class="weekly-komisi-table" id="weeklyKomisiTable" style="display: none;">
                    <thead>
                        <tr>
                            <th>Tanggal</th>
                            <th>Outlet</th>
                            <th>Serve By</th>
                            <th>Kasir</th>
                            <th>Jml Trans</th>
                            <th>Komisi</th>
                            <th>UOP</th>
                            <th>Tips QRIS</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody id="weeklyKomisiBody">
                        <!-- Data akan diisi oleh JavaScript -->
                    </tbody>
                </table>
            </div>
        </section>
        
        <!-- Footer -->
        <div class="komisi-footer">
            <p>Data diperbarui: <span id="lastUpdateTime">-</span></p>
        </div>
    `;
    
    document.body.appendChild(komisiPage);
    
    // Setup event listeners
    setupKomisiPageEvents();
}

// [4.3] Setup event listeners untuk halaman komisi
function setupKomisiPageEvents() {
    // Tombol kembali
    document.getElementById('backToMain').addEventListener('click', () => {
        document.getElementById('komisiPage').remove();
        document.getElementById('appScreen').style.display = 'block';
    });
    
    // Tombol refresh
    document.getElementById('refreshKomisi').addEventListener('click', async () => {
        await loadKomisiData();
    });
    
    // Filter untuk owner
    if (isOwner) {
        const filterSection = document.getElementById('ownerFilterSection');
        filterSection.style.display = 'block';
        
        // Load dropdown karyawan
        loadKaryawanDropdown();
        
        // Load dropdown outlet
        loadOutletDropdown();
        
        // Event listeners untuk filter
        document.getElementById('selectKaryawan').addEventListener('change', async () => {
            await loadKomisiData();
        });
        
        document.getElementById('selectOutlet').addEventListener('change', async () => {
            await loadKomisiData();
        });
        
        document.getElementById('dateRange').addEventListener('change', async (e) => {
            if (e.target.value === 'custom') {
                // Tampilkan date picker custom
                showCustomDatePicker();
            } else {
                await loadKomisiData();
            }
        });
    }
}

// [4.4] Fungsi untuk load data komisi
async function loadKomisiData() {
    try {
        console.log('=== START LOADING KOMISI DATA ===');
        
        // Tampilkan loading
        document.getElementById('loadingToday').style.display = 'block';
        document.getElementById('todayKomisiContent').style.display = 'none';
        document.getElementById('loadingWeekly').style.display = 'block';
        document.getElementById('weeklyKomisiTable').style.display = 'none';
        
        // Tentukan parameter filter
        const filterParams = getFilterParams();
        console.log('Filter params:', filterParams);
        
        // Load data hari ini
        await loadTodayKomisi(filterParams);
        
        // Load data 7 hari
        await loadWeeklyKomisi(filterParams);
        
        // Update waktu terakhir update
        const updateTime = new Date().toLocaleTimeString('id-ID');
        document.getElementById('lastUpdateTime').textContent = updateTime;
        
        console.log('=== FINISHED LOADING KOMISI DATA ===');
        
    } catch (error) {
        console.error('Error loading komisi data:', error);
        
        // Tampilkan error message ke user
        const todayContent = document.getElementById('todayKomisiContent');
        const weeklyTable = document.getElementById('weeklyKomisiTable');
        
        document.getElementById('loadingToday').style.display = 'none';
        document.getElementById('loadingWeekly').style.display = 'none';
        
        if (todayContent) {
            todayContent.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #ff4757;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>Gagal memuat data komisi</p>
                    <p style="font-size: 0.9rem; opacity: 0.7;">${error.message || 'Unknown error'}</p>
                </div>
            `;
            todayContent.style.display = 'block';
        }
        
        if (weeklyTable) {
            weeklyTable.style.display = 'table';
            const tbody = document.getElementById('weeklyKomisiBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" style="text-align: center; padding: 20px; color: #ff4757;">
                            Gagal memuat data
                        </td>
                    </tr>
                `;
            }
        }
    }
}

// [4.5] Fungsi untuk get filter parameters - UPDATE LOGIC
function getFilterParams() {
    const params = {
        namaKaryawan: currentKaryawan?.nama_karyawan,
        role: currentKaryawan?.role,
        isOwner: isOwner
    };
    
    if (isOwner) {
        const selectKaryawan = document.getElementById('selectKaryawan');
        const selectOutlet = document.getElementById('selectOutlet');
        const dateRange = document.getElementById('dateRange');
        
        // Untuk owner: gunakan value dari dropdown jika dipilih
        if (selectKaryawan && selectKaryawan.value) {
            params.namaKaryawan = selectKaryawan.value;
            params.filterByKaryawan = true;
        } else {
            params.namaKaryawan = null; // Owner lihat semua
            params.filterByKaryawan = false;
        }
        
        if (selectOutlet && selectOutlet.value !== 'all') {
            params.outlet = selectOutlet.value;
        }
        
        if (dateRange) {
            params.dateRange = dateRange.value;
        }
    } else {
        // Untuk non-owner: selalu filter berdasarkan serve_by = nama sendiri
        params.filterByKaryawan = true;
        params.outlet = null; // Non-owner tidak bisa filter outlet
    }
    
    console.log('Filter params refined:', params);
    return params;
}

// [4.6] Fungsi untuk load komisi hari ini - PERBAIKAN FILTER
async function loadTodayKomisi(filterParams) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    console.log('Loading today komisi for:', filterParams.namaKaryawan);
    
    // Query transaksi_order
    let orderQuery = supabase
        .from('transaksi_order')
        .select('*')
        .eq('order_date', todayStr);
    
    // PERBAIKAN: Filter HANYA serve_by = nama karyawan (kecuali owner)
    if (filterParams.namaKaryawan && !isOwner) {
        // Untuk non-owner: HANYA tampilkan data sendiri
        orderQuery = orderQuery.eq('serve_by', filterParams.namaKaryawan);
        console.log('Non-owner filter: serve_by =', filterParams.namaKaryawan);
    } else if (filterParams.namaKaryawan && isOwner) {
        // Untuk owner: Tampilkan semua atau sesuai filter dropdown
        if (filterParams.namaKaryawan && document.getElementById('selectKaryawan')?.value) {
            // Jika owner pilih karyawan tertentu di dropdown
            orderQuery = orderQuery.eq('serve_by', filterParams.namaKaryawan);
            console.log('Owner filter selected karyawan:', filterParams.namaKaryawan);
        } else {
            // Jika owner pilih "Semua Karyawan", tidak pakai filter serve_by
            console.log('Owner viewing all karyawan');
        }
    }
    
    // Filter outlet jika ada
    if (filterParams.outlet && filterParams.outlet !== 'all') {
        orderQuery = orderQuery.eq('outlet', filterParams.outlet);
    }
    
    const { data: orders, error: orderError } = await orderQuery;
    
    if (orderError) {
        console.error('Error loading today orders:', orderError);
        return;
    }
    
    console.log('Today orders found:', orders?.length || 0);
    
    // Jika tidak ada order
    if (!orders || orders.length === 0) {
        displayTodayKomisi({
            jumlahTransaksi: 0,
            komisi: 0,
            uop: 0,
            tips: 0,
            total: 0,
            outlet: filterParams.outlet || '-',
            serveBy: filterParams.namaKaryawan || '-',
            kasir: '-' // Kasir tidak relevan untuk serve_by view
        }, today);
        return;
    }
    
    // Ambil order_no untuk query detail
    const orderNumbers = orders.map(order => order.order_no).filter(Boolean);
    
    // Query transaksi_detail
    let detailQuery = supabase
        .from('transaksi_detail')
        .select('*')
        .in('order_no', orderNumbers);
    
    const { data: details, error: detailError } = await detailQuery;
    
    if (detailError) {
        console.error('Error loading transaction details:', detailError);
    }
    
    // Gabungkan data
    const ordersWithDetails = orders.map(order => {
        const orderDetails = details?.filter(detail => detail.order_no === order.order_no) || [];
        return {
            ...order,
            transaksi_detail: orderDetails
        };
    });
    
    // Hitung komisi
    const result = await calculateKomisiFromOrders(ordersWithDetails, filterParams.namaKaryawan || currentKaryawan?.nama_karyawan);
    
    // Tampilkan
    displayTodayKomisi(result, today);
}

// [4.7] Fungsi untuk load komisi 7 hari terakhir - DENGAN DEBUG DETAIL
async function loadWeeklyKomisi(filterParams) {
    console.log('=== DEBUG LOAD WEEKLY KOMISI START ===');
    
    const endDate = new Date();
    const startDate = new Date();
    
    // 7 hari sebelum hari ini (tidak termasuk hari ini)
    startDate.setDate(startDate.getDate() - 7); // 7 hari sebelum
    endDate.setDate(endDate.getDate() - 1);     // kemarin
    
    // Format dates untuk query
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    console.log('1. Date range calculation:');
    console.log('   Start (7 days ago):', startStr, startDate.toLocaleDateString('id-ID'));
    console.log('   End (yesterday):', endStr, endDate.toLocaleDateString('id-ID'));
    console.log('   Today:', new Date().toISOString().split('T')[0]);
    
    // FALLBACK nama karyawan
    const namaKaryawanAktif = filterParams.namaKaryawan || currentKaryawan?.nama_karyawan;
    console.log('2. Nama karyawan aktif:', namaKaryawanAktif);
    
    // TEST QUERY: Lihat semua data dulu tanpa filter tanggal
    console.log('3. Testing query without date filter...');
    const testQuery = supabase
        .from('transaksi_order')
        .select('order_date, order_no, serve_by')
        .eq('serve_by', namaKaryawanAktif)
        .order('order_date', { ascending: false })
        .limit(10);
    
    const { data: testData, error: testError } = await testQuery;
    
    if (testError) {
        console.error('Test query error:', testError);
    } else {
        console.log('4. Test query results (10 terbaru):', testData);
        console.log('5. Unique dates in data:', 
            [...new Set(testData?.map(d => d.order_date))].sort().reverse()
        );
    }
    
    // Query utama untuk 7 hari terakhir
    console.log('6. Executing main query with date range...');
    let orderQuery = supabase
        .from('transaksi_order')
        .select('*')
        .gte('order_date', startStr)  // ≥ 7 hari sebelum
        .lte('order_date', endStr)    // ≤ kemarin
        .order('order_date', { ascending: false });
    
    // Filter berdasarkan serve_by
    if (namaKaryawanAktif && !isOwner) {
        orderQuery = orderQuery.eq('serve_by', namaKaryawanAktif);
        console.log('7. Filter by serve_by:', namaKaryawanAktif);
    }
    
    const { data: orders, error: orderError } = await orderQuery;
    
    if (orderError) {
        console.error('8. Main query error:', orderError);
        return;
    }
    
    console.log('9. Main query results count:', orders?.length || 0);
    console.log('10. Orders found:', orders);
    
    // Jika tidak ada order dalam range tersebut
    if (!orders || orders.length === 0) {
        console.log('11. NO ORDERS FOUND in date range. Showing empty table...');
        
        // Buat data kosong untuk 7 hari
        const dailyResults = [];
        for (let i = 1; i <= 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            dailyResults.push({
                date: dateStr,
                dateFormatted: date.toLocaleDateString('id-ID'),
                jumlahTransaksi: 0,
                komisi: 0,
                uop: 0,
                tips: 0,
                total: 0,
                outlet: '-',
                serveBy: namaKaryawanAktif || '-',
                kasir: '-'
            });
        }
        
        console.log('12. Empty daily results:', dailyResults);
        displayWeeklyKomisi(dailyResults, 0);
        return;
    }
    
    // Ambil order_no untuk query detail
    const orderNumbers = orders.map(order => order.order_no).filter(Boolean);
    console.log('13. Order numbers to query details:', orderNumbers);
    
    // Query transaksi_detail
    let detailQuery = supabase
        .from('transaksi_detail')
        .select('*')
        .in('order_no', orderNumbers);
    
    const { data: details, error: detailError } = await detailQuery;
    
    if (detailError) {
        console.error('14. Details query error:', detailError);
    } else {
        console.log('15. Details found:', details?.length || 0);
    }
    
    // Group details by order_no
    const detailsByOrderNo = {};
    if (details) {
        details.forEach(detail => {
            if (!detailsByOrderNo[detail.order_no]) {
                detailsByOrderNo[detail.order_no] = [];
            }
            detailsByOrderNo[detail.order_no].push(detail);
        });
    }
    
    // Gabungkan data
    const ordersWithDetails = orders.map(order => {
        const orderDetails = detailsByOrderNo[order.order_no] || [];
        return {
            ...order,
            transaksi_detail: orderDetails
        };
    });
    
    // Group orders by date untuk memudahkan lookup
    const ordersByDate = {};
    ordersWithDetails.forEach(order => {
        const date = order.order_date;
        if (!ordersByDate[date]) {
            ordersByDate[date] = [];
        }
        ordersByDate[date].push(order);
    });
    
    console.log('16. Orders grouped by date:', Object.keys(ordersByDate));
    
    // Hitung komisi per hari untuk 7 hari terakhir
    const dailyResults = [];
    let total7Hari = 0;
    
    console.log('17. Calculating daily results...');
    
    // Loop 7 hari SEBELUM hari ini
    for (let i = 1; i <= 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayOrders = ordersByDate[dateStr] || [];
        
        console.log(`   Day ${i} (${dateStr}): ${dayOrders.length} orders`);
        
        const result = await calculateKomisiFromOrders(dayOrders, namaKaryawanAktif);
        
        result.date = dateStr;
        result.dateFormatted = date.toLocaleDateString('id-ID');
        dailyResults.push(result);
        
        total7Hari += result.total;
    }
    
    console.log('18. Final daily results:', dailyResults);
    console.log('19. Total 7 hari:', total7Hari);
    console.log('=== DEBUG LOAD WEEKLY KOMISI END ===');
    
    // Tampilkan di UI
    displayWeeklyKomisi(dailyResults, total7Hari);
}

// [4.8] Fungsi untuk hitung komisi dari orders - FIX VERSION
async function calculateKomisiFromOrders(orders, namaKaryawan) {
    console.log('=== DEBUG calculateKomisiFromOrders ===');
    console.log('1. Orders received:', orders?.length || 0);
    console.log('2. Nama karyawan param:', namaKaryawan);
    console.log('3. Sample order:', orders?.[0]);
    
    // Default return jika tidak ada orders
    if (!orders || orders.length === 0) {
        console.log('No orders, returning zero data');
        return {
            jumlahTransaksi: 0,
            komisi: 0,
            uop: 0,
            tips: 0,
            total: 0,
            outlet: '-',
            serveBy: namaKaryawan || '-',
            kasir: '-'
        };
    }
    
    let jumlahTransaksi = orders.length;
    let totalKomisi = 0;
    let totalUOP = 0;
    let totalTips = 0;
    let totalAmount = 0;
    
    let outlet = '';
    let serveBy = '';
    let kasir = '';
    
    // 1. HITUNG KOMISI DAN AMBIL INFO DASAR
    orders.forEach((order, index) => {
        // Komisi dari transaksi_order - FIX: comission dengan SATU 'm'
        const komisiOrder = order.comission || order.commission || 0;
        totalKomisi += komisiOrder;
        
        console.log(`Order ${index + 1}:`, {
            order_no: order.order_no,
            comission: order.comission,
            commission: order.commission,
            komisiUsed: komisiOrder
        });
        
        // Ambil outlet, serve_by, kasir dari order pertama yang ada
        if (!outlet && order.outlet) outlet = order.outlet;
        if (!serveBy && order.serve_by) serveBy = order.serve_by;
        if (!kasir && order.kasir) kasir = order.kasir;
    });
    
    console.log('4. After komisi calculation:', {
        totalKomisi,
        outlet,
        serveBy,
        kasir
    });
    
    // 2. CEK APAKAH ADA TRANSAKSI DENGAN ITEM_GROUP = 'UOP'
    let adaTransaksiDenganUOP = false;
    
    orders.forEach((order) => {
        if (order.transaksi_detail && order.transaksi_detail.length > 0) {
            // Debug detail transaksi
            console.log(`Order ${order.order_no} has ${order.transaksi_detail.length} details`);
            
            order.transaksi_detail.forEach((detail, idx) => {
                console.log(`  Detail ${idx + 1}:`, {
                    item_group: detail.item_group,
                    amount: detail.amount,
                    isUOP: detail.item_group === 'UOP',
                    isTips: detail.item_group === 'Tips'
                });
                
                if (detail.item_group === 'UOP') {
                    adaTransaksiDenganUOP = true;
                    console.log(`  FOUND UOP ITEM in order ${order.order_no}`);
                }
                
                if (detail.item_group === 'Tips') {
                    totalTips += detail.amount || 0;
                }
            });
        } else {
            console.log(`Order ${order.order_no} has NO details`);
        }
    });
    
    console.log('5. UOP check result:', adaTransaksiDenganUOP);
    console.log('6. Total tips:', totalTips);
    
    // 3. HITUNG UOP HANYA JIKA ADA TRANSAKSI DENGAN UOP
    if (adaTransaksiDenganUOP && namaKaryawan) {
        try {
            console.log('7. Loading UOP rate for:', namaKaryawan);
            
            const { data: karyawanData, error } = await supabase
                .from('karyawan')
                .select('uop')
                .eq('nama_karyawan', namaKaryawan)
                .single();
            
            console.log('8. UOP query result:', { data: karyawanData, error });
            
            if (error) {
                console.error('Error loading UOP:', error);
                totalUOP = 0;
            } else if (karyawanData && karyawanData.uop !== null && karyawanData.uop !== undefined) {
                totalUOP = Number(karyawanData.uop);
                console.log('9. UOP value found:', totalUOP);
            } else {
                totalUOP = 0;
                console.log('10. UOP column empty or null');
            }
        } catch (err) {
            console.error('Exception loading UOP:', err);
            totalUOP = 0;
        }
    } else {
        totalUOP = 0;
        console.log('11. No UOP items found or no namaKaryawan');
    }
    
    // 4. HITUNG TOTAL
    totalAmount = totalKomisi + totalUOP + totalTips;
    
    console.log('=== FINAL CALCULATION ===', {
        jumlahTransaksi,
        totalKomisi,
        totalUOP,
        totalTips,
        totalAmount,
        outlet,
        serveBy,
        kasir
    });
    
    return {
        jumlahTransaksi,
        komisi: totalKomisi,
        uop: totalUOP,
        tips: totalTips,
        total: totalAmount,
        outlet: outlet || '-',
        serveBy: serveBy || namaKaryawan || '-',
        kasir: kasir || '-'
    };
}

// [4.9] Fungsi untuk tampilkan komisi hari ini
function displayTodayKomisi(data, date) {
    const content = document.getElementById('todayKomisiContent');
    
    content.innerHTML = `
        <div class="today-header">
            <div class="date-display">
                <i class="fas fa-calendar-alt"></i>
                <span>${date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
        </div>
        
        <div class="today-grid">
            <div class="today-item">
                <div class="today-label">Outlet</div>
                <div class="today-value">${data.outlet || '-'}</div>
            </div>
            <div class="today-item">
                <div class="today-label">Serve By</div>
                <div class="today-value">${data.serveBy || '-'}</div>
            </div>
            <div class="today-item">
                <div class="today-label">Kasir</div>
                <div class="today-value">${data.kasir || '-'}</div>
            </div>
            <div class="today-item highlight">
                <div class="today-label">Jumlah Transaksi</div>
                <div class="today-value">${data.jumlahTransaksi}</div>
            </div>
        </div>
        
        <div class="today-totals">
            <div class="total-item">
                <div class="total-label">Komisi</div>
                <div class="total-value">${formatRupiah(data.komisi)}</div>
            </div>
            <div class="total-item">
                <div class="total-label">UOP</div>
                <div class="total-value">${formatRupiah(data.uop)}</div>
            </div>
            <div class="total-item">
                <div class="total-label">Tips QRIS</div>
                <div class="total-value">${formatRupiah(data.tips)}</div>
            </div>
            <div class="total-item grand-total">
                <div class="total-label">Total</div>
                <div class="total-value">${formatRupiah(data.total)}</div>
            </div>
        </div>
    `;
    
    // Sembunyikan loading, tampilkan content
    document.getElementById('loadingToday').style.display = 'none';
    content.style.display = 'block';
}

// [4.10] Fungsi untuk tampilkan komisi 7 hari
function displayWeeklyKomisi(dailyResults, total7Hari) {
    const tbody = document.getElementById('weeklyKomisiBody');
    tbody.innerHTML = '';
    
   dailyResults.forEach(result => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${result.dateFormatted}</td>
            <td>${result.outlet || '-'}</td>
            <td>${result.serveBy || '-'}</td>
            <td>${result.kasir || '-'}</td>
            <td>${result.jumlahTransaksi}</td>
            <td>${formatRupiah(result.komisi)}</td>
            <td>${formatRupiah(result.uop)}</td>
            <td>${formatRupiah(result.tips)}</td>
            <td class="total-column">${formatRupiah(result.total)}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Update total 7 hari
    document.getElementById('total7Hari').textContent = formatRupiah(total7Hari);
    
    // Sembunyikan loading, tampilkan table
    document.getElementById('loadingWeekly').style.display = 'none';
    document.getElementById('weeklyKomisiTable').style.display = 'table';
}

// [4.11] Fungsi untuk load dropdown karyawan (owner only)
async function loadKaryawanDropdown() {
    const select = document.getElementById('selectKaryawan');
    
    const { data: karyawanList, error } = await supabase
        .from('karyawan')
        .select('nama_karyawan, role')
        .order('nama_karyawan'); // PERBAIKAN: nama_karyawan bukan nama_karyaman
    
    if (error) {
        console.error('Error loading karyawan list:', error);
        select.innerHTML = `
            <option value="">Error loading data</option>
            ${currentKaryawan ? `<option value="${currentKaryawan.nama_karyawan}">${currentKaryawan.nama_karyawan}</option>` : ''}
        `;
        return;
    }
    
    select.innerHTML = `
        <option value="">Semua Karyawan</option>
        ${karyawanList.map(k => 
            `<option value="${k.nama_karyawan}">${k.nama_karyawan} (${k.role})</option>`
        ).join('')}
    `;
    
    // Select karyawan saat ini jika bukan "Semua Karyawan"
    if (!isOwner && currentKaryawan) {
        select.value = currentKaryawan.nama_karyawan;
    }
}

// [4.12] Fungsi untuk load dropdown outlet
async function loadOutletDropdown() {
    const select = document.getElementById('selectOutlet');
    
    const { data: outlets, error } = await supabase
        .from('transaksi_order')
        .select('outlet')
        .order('outlet');
    
    if (error) {
        console.error('Error loading outlets:', error);
        select.innerHTML = '<option value="all">Semua Outlet</option>';
        return;
    }
    
    // Get unique outlets
    const uniqueOutlets = [...new Set(outlets.map(o => o.outlet))].filter(Boolean);
    
    select.innerHTML = `
        <option value="all">Semua Outlet</option>
        ${uniqueOutlets.map(outlet => 
            `<option value="${outlet}">${outlet}</option>`
        ).join('')}
    `;
}

// [4.13] Fungsi format Rupiah
function formatRupiah(amount) {
    if (amount === 0 || !amount) return 'Rp 0';
    return 'Rp ' + amount.toLocaleString('id-ID');
}

// [4.14] Fungsi untuk custom date picker (placeholder)
function showCustomDatePicker() {
    alert('Fitur custom date picker akan diimplementasikan nanti.');
    document.getElementById('dateRange').value = 'week';
}

// ========== FUNGSI MENU KOMPONEN - ABSENSI ==========
// =================================================

// Variabel global untuk state absensi
let currentKaryawanAbsensi = null;
let isOwnerAbsensi = false;

// [1] Fungsi untuk tampilkan halaman absensi
async function showAbsensiPage() {
    // Simpan data karyawan saat ini
    const { data: { user } } = await supabase.auth.getUser();
    const namaKaryawan = user?.user_metadata?.nama_karyawan;
    
    if (!namaKaryawan) return;
    
    // Ambil data karyawan lengkap
    const { data: karyawanData } = await supabase
        .from('karyawan')
        .select('*')
        .eq('nama_karyawan', namaKaryawan)
        .single();
    
    currentKaryawanAbsensi = karyawanData;
    isOwnerAbsensi = karyawanData?.role === 'owner';
    
    // Sembunyikan main app, tampilkan halaman absensi
    document.getElementById('appScreen').style.display = 'none';
    
    // Buat container halaman absensi
    createAbsensiPage();
    
    // Load data absensi
    await loadAbsensiData();
}

// [2] Fungsi untuk buat halaman absensi
function createAbsensiPage() {
    // Hapus halaman absensi sebelumnya jika ada
    const existingPage = document.getElementById('absensiPage');
    if (existingPage) {
        existingPage.remove();
    }
    
    // Buat container halaman absensi
    const absensiPage = document.createElement('div');
    absensiPage.id = 'absensiPage';
    absensiPage.className = 'absensi-page';
    absensiPage.innerHTML = `
        <!-- Header -->
        <header class="absensi-header">
            <button class="back-btn" id="backToMainFromAbsensi">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h2><i class="fas fa-fingerprint"></i> Absensi</h2>
            <div class="header-actions">
                <button class="refresh-btn" id="refreshAbsensi">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
        </header>
        
        <!-- Filter untuk Owner -->
        <div id="ownerAbsensiFilterSection" class="owner-filter" style="display: none;">
            <div class="filter-group">
                <label for="selectKaryawanAbsensi">Pilih Karyawan:</label>
                <select id="selectKaryawanAbsensi" class="karyawan-select">
                    <option value="">Loading...</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="selectOutletAbsensi">Outlet:</label>
                <select id="selectOutletAbsensi" class="outlet-select">
                    <option value="all">Semua Outlet</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="dateRangeAbsensi">Periode:</label>
                <select id="dateRangeAbsensi" class="date-select">
                    <option value="today">Hari Ini</option>
                    <option value="week">7 Hari Terakhir</option>
                    <option value="month">Bulan Ini</option>
                </select>
            </div>
        </div>
        
        <!-- Absensi Hari Ini -->
        <section class="today-absensi-section">
            <h3><i class="fas fa-calendar-day"></i> Absensi Hari Ini</h3>
            <div class="today-absensi-card">
                <div class="loading" id="loadingTodayAbsensi">Loading data hari ini...</div>
                <div id="todayAbsensiContent" style="display: none;">
                    <!-- Data akan diisi oleh JavaScript -->
                </div>
            </div>
        </section>
        
        <!-- Absensi 7 Hari Terakhir -->
        <section class="weekly-absensi-section">
            <div class="section-header">
                <h3><i class="fas fa-history"></i> Absensi 7 Hari Terakhir</h3>
                <div class="total-summary">
                    <span>Total Hari: <strong id="totalHariAbsensi">7</strong> hari</span>
                  
                </div>
            </div>
            <div class="weekly-absensi-table-container">
                <div class="loading" id="loadingWeeklyAbsensi">Loading data 7 hari...</div>
                <table class="weekly-absensi-table" id="weeklyAbsensiTable" style="display: none;">
                    <thead>
                        <tr>
                            <th>Tanggal</th>
                            <th>Outlet</th>
                            <th>Karyawan</th>
                            <th>Jadwal Masuk</th>
                            <th>Jadwal Pulang</th>
                            <th>Clock In</th>
                            <th>Clock Out</th>
                            <th>Jam Kerja</th>
                            <th>Keterangan</th>
                        </tr>
                    </thead>
                    <tbody id="weeklyAbsensiBody">
                        <!-- Data akan diisi oleh JavaScript -->
                    </tbody>
                </table>
            </div>
        </section>
        
        <!-- Footer -->
        <div class="absensi-footer">
            <p>Data diperbarui: <span id="lastUpdateAbsensiTime">-</span></p>
        </div>
    `;
    
    document.body.appendChild(absensiPage);
    
    // Setup event listeners
    setupAbsensiPageEvents();
}

// [3] Setup event listeners untuk halaman absensi
function setupAbsensiPageEvents() {
    // Tombol kembali
    document.getElementById('backToMainFromAbsensi').addEventListener('click', () => {
        document.getElementById('absensiPage').remove();
        document.getElementById('appScreen').style.display = 'block';
    });
    
    // Tombol refresh
    document.getElementById('refreshAbsensi').addEventListener('click', async () => {
        await loadAbsensiData();
    });
    
    // Filter untuk owner
    if (isOwnerAbsensi) {
        const filterSection = document.getElementById('ownerAbsensiFilterSection');
        filterSection.style.display = 'block';
        
        // Load dropdown karyawan
        loadKaryawanDropdownAbsensi();
        
        // Load dropdown outlet
        loadOutletDropdownAbsensi();
        
        // Event listeners untuk filter
        document.getElementById('selectKaryawanAbsensi').addEventListener('change', async () => {
            await loadAbsensiData();
        });
        
        document.getElementById('selectOutletAbsensi').addEventListener('change', async () => {
            await loadAbsensiData();
        });
        
        document.getElementById('dateRangeAbsensi').addEventListener('change', async () => {
            await loadAbsensiData();
        });
    }
}

// [4] Fungsi untuk load data absensi
async function loadAbsensiData() {
    try {
        console.log('=== START LOADING ABSENSI DATA ===');
        
        // Tampilkan loading
        document.getElementById('loadingTodayAbsensi').style.display = 'block';
        document.getElementById('todayAbsensiContent').style.display = 'none';
        document.getElementById('loadingWeeklyAbsensi').style.display = 'block';
        document.getElementById('weeklyAbsensiTable').style.display = 'none';
        
        // Tentukan parameter filter
        const filterParams = getAbsensiFilterParams();
        console.log('Absensi filter params:', filterParams);
        
        // Load data hari ini
        await loadTodayAbsensi(filterParams);
        
        // Load data 7 hari
        await loadWeeklyAbsensi(filterParams);
        
        // Update waktu terakhir update
        const updateTime = new Date().toLocaleTimeString('id-ID');
        document.getElementById('lastUpdateAbsensiTime').textContent = updateTime;
        
        console.log('=== FINISHED LOADING ABSENSI DATA ===');
        
    } catch (error) {
        console.error('Error loading absensi data:', error);
        
        // Tampilkan error message ke user
        const todayContent = document.getElementById('todayAbsensiContent');
        const weeklyTable = document.getElementById('weeklyAbsensiTable');
        
        document.getElementById('loadingTodayAbsensi').style.display = 'none';
        document.getElementById('loadingWeeklyAbsensi').style.display = 'none';
        
        if (todayContent) {
            todayContent.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #ff4757;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>Gagal memuat data absensi</p>
                    <p style="font-size: 0.9rem; opacity: 0.7;">${error.message || 'Unknown error'}</p>
                </div>
            `;
            todayContent.style.display = 'block';
        }
        
        if (weeklyTable) {
            weeklyTable.style.display = 'table';
            const tbody = document.getElementById('weeklyAbsensiBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" style="text-align: center; padding: 20px; color: #ff4757;">
                            Gagal memuat data
                        </td>
                    </tr>
                `;
            }
        }
    }
}

// [5] Fungsi untuk get filter parameters absensi
function getAbsensiFilterParams() {
    const params = {
        namaKaryawan: currentKaryawanAbsensi?.nama_karyawan,
        role: currentKaryawanAbsensi?.role,
        isOwner: isOwnerAbsensi
    };
    
    if (isOwnerAbsensi) {
        const selectKaryawan = document.getElementById('selectKaryawanAbsensi');
        const selectOutlet = document.getElementById('selectOutletAbsensi');
        const dateRange = document.getElementById('dateRangeAbsensi');
        
        if (selectKaryawan && selectKaryawan.value) {
            params.namaKaryawan = selectKaryawan.value;
        }
        
        if (selectOutlet && selectOutlet.value !== 'all') {
            params.outlet = selectOutlet.value;
        }
        
        if (dateRange) {
            params.dateRange = dateRange.value;
        }
    }
    
    return params;
}

// [6] Fungsi untuk load absensi hari ini - SUPPORT DD/MM/YYYY
async function loadTodayAbsensi(filterParams) {
    console.log('=== DEBUG loadTodayAbsensi ===');
    
    // Format tanggal DD/MM/YYYY
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    const todayStr = `${day}/${month}/${year}`; // Format: 05/12/2025
    
    console.log('Today date (DD/MM/YYYY):', todayStr);
    
    const namaKaryawanAktif = filterParams.namaKaryawan || currentKaryawanAbsensi?.nama_karyawan;
    console.log('Nama karyawan:', namaKaryawanAktif);
    
    // Query data absensi hari ini dengan format DD/MM/YYYY
    let absensiQuery = supabase
        .from('absen')
        .select('*')
        .eq('tanggal', todayStr);  // Format: 05/12/2025
    
    // Filter berdasarkan nama jika bukan owner
    if (namaKaryawanAktif && !isOwnerAbsensi) {
        absensiQuery = absensiQuery.eq('nama', namaKaryawanAktif);
    }
    
    const { data: absensiToday, error } = await absensiQuery;
    
    if (error) {
        console.error('Error loading today absensi:', error);
        
        // Tampilkan data kosong
        const jadwalData = await getJadwalKaryawan(namaKaryawanAktif);
        displayTodayAbsensi(null, today, namaKaryawanAktif, jadwalData, false);
        return;
    }
    
    console.log('Today absensi found:', absensiToday?.length || 0);
    
    // Ambil jadwal dari tabel karyawan
    const jadwalData = await getJadwalKaryawan(namaKaryawanAktif);
    
    // Jika owner melihat semua, ambil data untuk karyawan tertentu
    let absensiData = null;
    if (isOwnerAbsensi && namaKaryawanAktif) {
        // Owner pilih karyawan tertentu di dropdown
        absensiData = absensiToday?.find(absensi => 
            absensi.nama === namaKaryawanAktif
        ) || absensiToday?.[0];
    } else {
        // Non-owner atau owner tanpa filter
        absensiData = absensiToday?.[0];
    }
    
    // Tampilkan data
    displayTodayAbsensi(absensiData, today, namaKaryawanAktif, jadwalData, false);
}

// [7] Fungsi untuk load absensi 7 hari terakhir - SUPPORT DD/MM/YYYY
async function loadWeeklyAbsensi(filterParams) {
    console.log('=== DEBUG loadWeeklyAbsensi ===');
    
    const namaKaryawanAktif = filterParams.namaKaryawan || currentKaryawanAbsensi?.nama_karyawan;
    
    // Query SEMUA data untuk karyawan ini
    let absensiQuery = supabase
        .from('absen')
        .select('*')
        .eq('nama', namaKaryawanAktif)
        .order('tanggal', { ascending: false });
    
    const { data: allAbsensi, error } = await absensiQuery;
    
    if (error) {
        console.error('Error loading all absensi:', error);
        return;
    }
    
    console.log('All absensi found:', allAbsensi?.length || 0);
    
    // Ambil jadwal karyawan
    const jadwalData = await getJadwalKaryawan(namaKaryawanAktif);
    
    // Buat array untuk 7 hari terakhir (tidak termasuk hari ini)
    const dateRange = [];
    for (let i = 1; i <= 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        dateRange.push({
            dateStr: `${day}/${month}/${year}`, // DD/MM/YYYY
            dateObj: date,
            dateDisplay: date.toLocaleDateString('id-ID') // 5/12/2025
        });
    }
    
    console.log('7 hari terakhir:', dateRange.map(d => d.dateStr));
    
    // Match data dengan tanggal
    const weeklyData = [];
    
    dateRange.forEach(dateInfo => {
        // Cari data untuk tanggal ini
        const absensiForDate = allAbsensi?.find(absensi => 
            absensi.tanggal === dateInfo.dateStr
        );
        
        weeklyData.push({
            dateInfo: dateInfo,
            absensi: absensiForDate || null
        });
    });
    
    // Tampilkan data
    displayWeeklyAbsensi(weeklyData, jadwalData);
}

// [8] Fungsi untuk ambil jadwal dari tabel karyawan
async function getJadwalKaryawan(namaKaryawan) {
    if (!namaKaryawan) {
        return { jadwal_masuk: '09:00', jadwal_pulang: '21:00' };
    }
    
    try {
        const { data, error } = await supabase
            .from('karyawan')
            .select('jadwal_masuk, jadwal_pulang')
            .eq('nama_karyawan', namaKaryawan)
            .single();
        
        if (error) {
            console.error('Error loading jadwal karyawan:', error);
            return { jadwal_masuk: '09:00', jadwal_pulang: '21:00' };
        }
        
        return {
            jadwal_masuk: data.jadwal_masuk || '09:00',
            jadwal_pulang: data.jadwal_pulang || '21:00'
        };
        
    } catch (err) {
        console.error('Exception loading jadwal:', err);
        return { jadwal_masuk: '09:00', jadwal_pulang: '21:00' };
    }
}

// [9] Fungsi untuk tampilkan absensi hari ini - LAYOUT 2 KOLOM
function displayTodayAbsensi(absensiData, date, namaKaryawan, jadwalData = null, isLatest = false) {
    const content = document.getElementById('todayAbsensiContent');
    
    // Jika tidak ada data absensi
    if (!absensiData) {
        content.innerHTML = `
            <div class="today-header">
                <div class="date-display">
                    <i class="fas fa-calendar-alt"></i>
                    <span>${date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>
            
            <div class="today-absensi-empty">
                <i class="fas fa-clock" style="font-size: 3rem; color: #ccc; margin-bottom: 15px;"></i>
                <p style="color: #666;">Belum ada data absensi hari ini</p>
                <p style="font-size: 0.9rem; color: #888;">Nama: ${namaKaryawan || '-'}</p>
            </div>
        `;
        
        document.getElementById('loadingTodayAbsensi').style.display = 'none';
        content.style.display = 'block';
        return;
    }
    
    // Format waktu dan hitung
    const clockinDisplay = formatWaktu(absensiData.clockin);
    const clockoutDisplay = formatWaktu(absensiData.clockout);
    const jadwal = jadwalData || { jadwal_masuk: '09:00', jadwal_pulang: '21:00' };
    
    // Parse tanggal dari format DD/MM/YYYY untuk perhitungan
    const [day, month, year] = absensiData.tanggal.split('/');
    const tanggalForCalculation = `${year}-${month}-${day}`;
    
    const jamKerjaInfo = hitungJamKerja(
        tanggalForCalculation,
        clockinDisplay,
        clockoutDisplay,
        jadwal.jadwal_masuk,
        jadwal.jadwal_pulang
    );
    
    content.innerHTML = `
        <div class="today-header">
            <div class="date-display">
                <i class="fas fa-calendar-alt"></i>
                <span>${date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
        </div>
        
        <!-- Info Dasar (Outlet & Karyawan) -->
        <div class="today-basic-info">
            <div class="basic-info-item">
                <div class="basic-label">Outlet</div>
                <div class="basic-value">${absensiData.outlet || '-'}</div>
            </div>
            <div class="basic-info-item">
                <div class="basic-label">Karyawan</div>
                <div class="basic-value">${absensiData.nama || namaKaryawan || '-'}</div>
            </div>
        </div>
        
        <!-- Jadwal & Clock In/Out - 2 Kolom -->
        <div class="today-schedule-section">
            <h4><i class="fas fa-calendar-check"></i> Jadwal & Absensi</h4>
            <div class="schedule-grid">
                <!-- Kolom Kiri: Jadwal -->
                <div class="schedule-column left-column">
                    <div class="schedule-item">
                        <div class="schedule-label">Jadwal Masuk</div>
                        <div class="schedule-value jadwal-masuk">
                            <i class="fas fa-sign-in-alt"></i>
                            <span>${jadwal.jadwal_masuk || '09:00'}</span>
                        </div>
                    </div>
                    <div class="schedule-item">
                        <div class="schedule-label">Jadwal Pulang</div>
                        <div class="schedule-value jadwal-pulang">
                            <i class="fas fa-sign-out-alt"></i>
                            <span>${jadwal.jadwal_pulang || '21:00'}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Kolom Kanan: Actual -->
                <div class="schedule-column right-column">
                    <div class="schedule-item">
                        <div class="schedule-label">Clock In</div>
                        <div class="schedule-value clock-in ${getClockStatusClass(clockinDisplay, jadwal.jadwal_masuk, 'in')}">
                            <i class="fas fa-fingerprint"></i>
                            <span>${clockinDisplay || '-'}</span>
                            ${getClockStatusBadge(clockinDisplay, jadwal.jadwal_masuk, 'in')}
                        </div>
                    </div>
                    <div class="schedule-item">
                        <div class="schedule-label">Clock Out</div>
                        <div class="schedule-value clock-out ${getClockStatusClass(clockoutDisplay, jadwal.jadwal_pulang, 'out')}">
                            <i class="fas fa-fingerprint"></i>
                            <span>${clockoutDisplay || '-'}</span>
                            ${getClockStatusBadge(clockoutDisplay, jadwal.jadwal_pulang, 'out')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Ringkasan -->
        <div class="today-summary-section">
            <h4><i class="fas fa-chart-bar"></i> Ringkasan</h4>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-label">Jam Kerja</div>
                    <div class="summary-value jam-kerja">${jamKerjaInfo.jamKerja}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Status</div>
                    <div class="summary-value keterangan ${jamKerjaInfo.keteranganClass || ''}">
                        ${jamKerjaInfo.keterangan}
                    </div>
                </div>
            </div>
        </div>
        
        ${isLatest ? `
            <div class="today-note">
                <i class="fas fa-info-circle"></i>
                <span>Menampilkan data terbaru (${absensiData.tanggal}) karena belum ada absensi hari ini</span>
            </div>
        ` : ''}
    `;
    
    document.getElementById('loadingTodayAbsensi').style.display = 'none';
    content.style.display = 'block';
}

// Helper function untuk status clock in/out
function getClockStatusClass(clockTime, scheduleTime, type) {
    if (!clockTime || !scheduleTime) return 'no-data';
    
    const clock = parseTime(clockTime);
    const schedule = parseTime(scheduleTime);
    
    if (type === 'in') {
        if (clock.hours > schedule.hours || 
            (clock.hours === schedule.hours && clock.minutes > schedule.minutes)) {
            return 'late';
        } else if (clock.hours < schedule.hours ||
                   (clock.hours === schedule.hours && clock.minutes < schedule.minutes)) {
            return 'early';
        }
    } else if (type === 'out') {
        if (!clockTime) return 'no-data';
        if (clock.hours < schedule.hours ||
            (clock.hours === schedule.hours && clock.minutes < schedule.minutes)) {
            return 'early-out';
        }
    }
    
    return 'on-time';
}

// Helper function untuk badge status
function getClockStatusBadge(clockTime, scheduleTime, type) {
    const statusClass = getClockStatusClass(clockTime, scheduleTime, type);
    
    const badges = {
        'late': '<span class="status-badge late-badge">Terlambat</span>',
        'early': '<span class="status-badge early-badge">Lebih Awal</span>',
        'early-out': '<span class="status-badge early-out-badge">Pulang Cepat</span>',
        'on-time': '<span class="status-badge on-time-badge">Tepat</span>',
        'no-data': '<span class="status-badge no-data-badge">-</span>'
    };
    
    return badges[statusClass] || '';
}

// Helper function untuk parse waktu
function parseTime(timeStr) {
    if (!timeStr) return { hours: 0, minutes: 0 };
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours: hours || 0, minutes: minutes || 0 };
}
// [10] Fungsi untuk tampilkan absensi 7 hari
function displayWeeklyAbsensi(weeklyData, jadwalData) {
    const tbody = document.getElementById('weeklyAbsensiBody');
    tbody.innerHTML = '';
    
    let foundCount = 0;
    
    weeklyData.forEach(item => {
        const { dateInfo, absensi } = item;
        
        let rowHTML = '';
        
        if (absensi) {
            foundCount++;
            
            const clockinDisplay = formatWaktu(absensi.clockin);
            const clockoutDisplay = formatWaktu(absensi.clockout);
            
            // Parse tanggal DD/MM/YYYY ke YYYY-MM-DD untuk perhitungan
            const [day, month, year] = absensi.tanggal.split('/');
            const tanggalForCalculation = `${year}-${month}-${day}`;
            
            const jamKerjaInfo = hitungJamKerja(
                tanggalForCalculation,
                clockinDisplay,
                clockoutDisplay,
                jadwalData.jadwal_masuk,
                jadwalData.jadwal_pulang
            );
            
            rowHTML = `
                <td>${dateInfo.dateDisplay}</td>
                <td>${absensi.outlet || '-'}</td>
                <td>${absensi.nama || '-'}</td>
                <td>${jadwalData.jadwal_masuk || '09:00'}</td>
                <td>${jadwalData.jadwal_pulang || '21:00'}</td>
                <td>${clockinDisplay || '-'}</td>
                <td>${clockoutDisplay || '-'}</td>
                <td>${jamKerjaInfo.jamKerja}</td>
                <td class="keterangan-cell ${jamKerjaInfo.keteranganClass || ''}">
                    ${jamKerjaInfo.keterangan}
                </td>
            `;
        } else {
            // Data kosong
            rowHTML = `
                <td>${dateInfo.dateDisplay}</td>
                <td>-</td>
                <td>-</td>
                <td>${jadwalData.jadwal_masuk || '09:00'}</td>
                <td>${jadwalData.jadwal_pulang || '21:00'}</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>Tidak absen</td>
            `;
        }
        
        const row = document.createElement('tr');
        row.innerHTML = rowHTML;
        tbody.appendChild(row);
    });
    
    // Update total hari dengan data
    document.getElementById('totalHariAbsensi').textContent = foundCount;
    
    // Sembunyikan loading, tampilkan table
    document.getElementById('loadingWeeklyAbsensi').style.display = 'none';
    document.getElementById('weeklyAbsensiTable').style.display = 'table';
}

// [11] Fungsi untuk format waktu
function formatWaktu(waktuString) {
    if (!waktuString) return null;
    
    try {
        // Jika waktu sudah dalam format HH:MM
        if (typeof waktuString === 'string' && waktuString.match(/^\d{2}:\d{2}$/)) {
            return waktuString;
        }
        
        // Jika waktu dalam format ISO atau timestamp
        if (typeof waktuString === 'string') {
            // Coba parse sebagai time
            if (waktuString.includes(':')) {
                const parts = waktuString.split(':');
                if (parts.length >= 2) {
                    const hours = parts[0].padStart(2, '0');
                    const minutes = parts[1].padStart(2, '0');
                    return `${hours}:${minutes}`;
                }
            }
            
            // Coba parse sebagai date
            const date = new Date(waktuString);
            if (!isNaN(date.getTime())) {
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                return `${hours}:${minutes}`;
            }
        }
        
        return null;
    } catch (e) {
        console.warn('Error formatting waktu:', e);
        return null;
    }
}

// [12] Fungsi untuk hitung jam kerja dan keterangan
function hitungJamKerja(tanggal, clockinDisplay, clockoutDisplay, jadwalMasuk, jadwalPulang) {
    let jamKerja = 'Masih bekerja';
    let keterangan = '';
    let keteranganClass = '';
    
    if (clockinDisplay && clockoutDisplay) {
        try {
            // Buat tanggal lengkap untuk perhitungan
            const clockinFull = `${tanggal}T${clockinDisplay}:00`;
            const clockoutFull = `${tanggal}T${clockoutDisplay}:00`;
            
            const clockin = new Date(clockinFull);
            const clockout = new Date(clockoutFull);
            
            if (!isNaN(clockin.getTime()) && !isNaN(clockout.getTime())) {
                const diffMs = clockout - clockin;
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                
                if (diffHours > 0 || diffMinutes > 0) {
                    jamKerja = `${diffHours} jam ${diffMinutes} menit`;
                } else {
                    jamKerja = '0 jam 0 menit';
                }
            }
        } catch (e) {
            console.warn('Error hitung jam kerja:', e);
            jamKerja = 'Error hitung';
        }
    }
    
    // Hitung keterangan
    if (clockinDisplay) {
        const [clockinHours, clockinMinutes] = clockinDisplay.split(':').map(Number);
        const [jadwalMasukHours, jadwalMasukMinutes] = (jadwalMasuk || '09:00').split(':').map(Number);
        
        if (clockinHours > jadwalMasukHours || 
            (clockinHours === jadwalMasukHours && clockinMinutes > jadwalMasukMinutes)) {
            const telatMenit = (clockinHours - jadwalMasukHours) * 60 + (clockinMinutes - jadwalMasukMinutes);
            keterangan = `Terlambat ${telatMenit} menit`;
            keteranganClass = 'terlambat';
        }
    }
    
    if (clockoutDisplay && keterangan === '') {
        const [clockoutHours, clockoutMinutes] = clockoutDisplay.split(':').map(Number);
        const [jadwalPulangHours, jadwalPulangMinutes] = (jadwalPulang || '21:00').split(':').map(Number);
        
        if (clockoutHours < jadwalPulangHours || 
            (clockoutHours === jadwalPulangHours && clockoutMinutes < jadwalPulangMinutes)) {
            const cepatMenit = (jadwalPulangHours - clockoutHours) * 60 + (jadwalPulangMinutes - clockoutMinutes);
            keterangan = `Pulang Cepat ${cepatMenit} menit`;
            keteranganClass = 'cepat';
        }
    }
    
    if (keterangan === '' && clockinDisplay) {
        keterangan = 'Tepat waktu';
        keteranganClass = 'tepat';
    }
    
    if (!clockinDisplay) {
        keterangan = 'Tidak absen';
        keteranganClass = 'tidak-absen';
    }
    
    return { jamKerja, keterangan, keteranganClass };
}

// [13] Fungsi untuk load dropdown karyawan (owner only)
async function loadKaryawanDropdownAbsensi() {
    const select = document.getElementById('selectKaryawanAbsensi');
    
    const { data: karyawanList, error } = await supabase
        .from('karyawan')
        .select('nama_karyawan, role')
        .order('nama_karyawan');
    
    if (error) {
        console.error('Error loading karyawan list for absensi:', error);
        select.innerHTML = `
            <option value="">Error loading data</option>
            ${currentKaryawanAbsensi ? `<option value="${currentKaryawanAbsensi.nama_karyawan}">${currentKaryawanAbsensi.nama_karyawan}</option>` : ''}
        `;
        return;
    }
    
    select.innerHTML = `
        <option value="">Semua Karyawan</option>
        ${karyawanList.map(k => 
            `<option value="${k.nama_karyawan}">${k.nama_karyawan} (${k.role})</option>`
        ).join('')}
    `;
    
    // Select karyawan saat ini jika bukan "Semua Karyawan"
    if (!isOwnerAbsensi && currentKaryawanAbsensi) {
        select.value = currentKaryawanAbsensi.nama_karyawan;
    }
}

// [14] Fungsi untuk load dropdown outlet
async function loadOutletDropdownAbsensi() {
    const select = document.getElementById('selectOutletAbsensi');
    
    const { data: outlets, error } = await supabase
        .from('absen')
        .select('outlet')
        .order('outlet');
    
    if (error) {
        console.error('Error loading outlets for absensi:', error);
        select.innerHTML = '<option value="all">Semua Outlet</option>';
        return;
    }
    
    // Get unique outlets
    const uniqueOutlets = [...new Set(outlets.map(o => o.outlet))].filter(Boolean);
    
    select.innerHTML = `
        <option value="all">Semua Outlet</option>
        ${uniqueOutlets.map(outlet => 
            `<option value="${outlet}">${outlet}</option>`
        ).join('')}
    `;
}

// ========== BAGIAN 5: FUNGSI HANDLE MENU CLICK ==========
// ======================================================

// Fungsi untuk handle klik menu
function handleMenuClick(menuId) {
    switch(menuId) {
        case 'komisi':
            showKomisiPage();
            break;
        case 'absensi':
            showAbsensiPage();
            break;
        case 'slip':
        case 'libur':
        case 'kas':
        case 'top':
        case 'request':
        case 'stok':
        case 'sertifikasi':
            // Menu lain akan diimplementasikan nanti
            const menuTitles = {
                'slip': 'Slip Penghasilan',
                'libur': 'Libur & Izin',
                'kas': 'Kas & Setoran',
                'top': 'TOP (Tools Ownership Program)',
                'request': 'Request',
                'stok': 'Tambah Stok',
                'sertifikasi': 'Sertifikasi'
            };
            alert(`Menu "${menuTitles[menuId]}" akan diimplementasikan nanti.`);
            break;
        default:
            console.log('Menu tidak dikenali:', menuId);
    }
}

// ========== BAGIAN 6: PWA SUPPORT ==========
// ==========================================

// PWA Support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registered:', registration);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
                // Optional: Buat file sw.js sederhana
                // createBasicServiceWorker();
            });
    });
}

// Fungsi untuk buat service worker sederhana jika file tidak ada
function createBasicServiceWorker() {
    if ('serviceWorker' in navigator) {
        const swContent = `
            self.addEventListener('install', event => {
                console.log('Service Worker installed');
            });
            
            self.addEventListener('fetch', event => {
                // Basic fetch handler
                event.respondWith(fetch(event.request));
            });
        `;
        
        const blob = new Blob([swContent], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(blob);
        
        navigator.serviceWorker.register(swUrl)
            .then(registration => {
                console.log('Basic ServiceWorker registered:', registration);
            })
            .catch(error => {
                console.log('Failed to register basic ServiceWorker:', error);
            });
    }
}

// ========== END OF FILE ==========
