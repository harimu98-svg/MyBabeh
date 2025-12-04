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

// FUNGSI UTAMA: Load data karyawan dari tabel berdasarkan metadata
async function loadUserData(user) {
    // 1. Ambil nama_karyawan dari metadata auth user
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

// Fungsi untuk handle klik menu
function handleMenuClick(menuId) {
    const menuTitles = {
        'komisi': 'Komisi',
        'slip': 'Slip Penghasilan',
        'libur': 'Libur & Izin',
        'absensi': 'Absensi',
        'kas': 'Kas & Setoran',
        'top': 'TOP (Tools Ownership Program)',
        'request': 'Request',
        'stok': 'Tambah Stok',
        'sertifikasi': 'Sertifikasi'
    };
    
    alert(`Menu "${menuTitles[menuId]}" akan diimplementasikan nanti.`);
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

// PWA Support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registered:', registration);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}
