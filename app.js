// ========== BAGIAN 1: KONFIGURASI & INISIALISASI ==========
// ========================================================

// Konfigurasi Supabase
const supabaseUrl = 'https://intzwjmlypmopzauxeqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImludHp3am1seXBtb3B6YXV4ZXF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MTc5MTIsImV4cCI6MjA3MDI5MzkxMn0.VwwVEDdHtYP5gui4epTcNfLXhPkmfFbRVb5y8mrXJiM';

// Inisialisasi Supabase
var supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

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

// Variabel simple untuk announcement
let currentAnnouncement = "";

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
    
    // 4. Jika owner, setup announcement bar
    if (karyawanData.role === 'owner') {
        makeAnnouncementEditable();
    }
    
    // 5. Load saved announcement dari database
    await loadSavedAnnouncement();
    
    // 6. Load foto jika ada
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

// Fungsi untuk buat announcement bar bisa diklik (owner only)
function makeAnnouncementEditable() {
    const announcementBar = document.getElementById('announcementBar');
    if (announcementBar) {
        // Hapus event listener lama jika ada
        announcementBar.replaceWith(announcementBar.cloneNode(true));
        
        const newAnnouncementBar = document.getElementById('announcementBar');
        newAnnouncementBar.classList.add('owner-editable');
        newAnnouncementBar.title = "Klik untuk edit pengumuman";
        newAnnouncementBar.addEventListener('click', showEditPopup);
    }
}

// Fungsi untuk tampilkan popup edit announcement
function showEditPopup() {
    const announcementText = document.getElementById('announcementText');
    const marquee = announcementText.querySelector('marquee');
    const currentText = marquee ? marquee.textContent : '';
    
    // Buat popup
    const popupHTML = `
        <div class="edit-popup" id="editPopup">
            <div class="popup-content">
                <h3><i class="fas fa-edit"></i> Edit Pengumuman</h3>
                <textarea id="announcementInput" maxlength="200" placeholder="Masukkan teks pengumuman...">${currentText}</textarea>
                <div class="popup-buttons">
                    <button class="popup-btn cancel" id="cancelEdit">Batal</button>
                    <button class="popup-btn save" id="saveAnnouncement">Simpan</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    
    // Setup event listeners
    setupPopupEvents();
}

// Setup events untuk popup edit
function setupPopupEvents() {
    const popup = document.getElementById('editPopup');
    const cancelBtn = document.getElementById('cancelEdit');
    const saveBtn = document.getElementById('saveAnnouncement');
    const input = document.getElementById('announcementInput');
    
    if (!popup || !input) return;
    
    // Fokus ke input
    input.focus();
    input.select();
    
    // Cancel button
    cancelBtn.addEventListener('click', () => {
        popup.remove();
    });
    
    // Save button
    saveBtn.addEventListener('click', () => {
        saveAnnouncement();
    });
    
    // ESC key untuk close
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            popup.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
    
    // Click outside to close
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            popup.remove();
            document.removeEventListener('keydown', escHandler);
        }
    });
    
    // Enter key untuk save
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            saveAnnouncement();
        }
    });
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
        case 'kas':
            showKasPage();
            break;
        case 'slip':
            showSlipPage();  // <-- TAMBAHKAN INI
            break;
       case 'stok':  // <-- TAMBAHKAN INI
            showStokPage();
            break;
        case 'request':
            showRequestPage(); // <-- TAMBAHKAN INI
            break;
        case 'libur':
        case 'top':
        case 'sertifikasi':
            // Menu lain akan diimplementasikan nanti
            const menuTitles = {
                'libur': 'Libur & Izin',
                'top': 'TOP (Tools Ownership Program)',
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
// ========== FUNGSI PENGUMUMAN DATABASE ==========
// ==============================================

// Variabel global untuk menyimpan daftar outlet
let outletList = [];

// Fungsi untuk load daftar outlet dari database
async function loadOutletList() {
    try {
        console.log('Loading outlet list from database...');
        
        // Query untuk ambil semua outlet dari tabel outlet
        const { data: outlets, error } = await supabase
            .from('outlet')
            .select('outlet, id')
            .order('outlet');
        
        if (error) {
            console.error('Error loading outlets:', error);
            return [];
        }
        
        // Format data outlet
        outletList = outlets.map(outlet => ({
            id: outlet.id,
            name: outlet.outlet || `Outlet ${outlet.id}`,
            value: outlet.outlet || `outlet_${outlet.id}`
        }));
        
        console.log('Outlet list loaded:', outletList.length, 'outlets');
        return outletList;
        
    } catch (error) {
        console.error('Exception loading outlets:', error);
        return [];
    }
}

// Fungsi untuk get outlet user saat ini
async function getCurrentUserOutlet() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const namaKaryawan = user?.user_metadata?.nama_karyawan;
        
        if (!namaKaryawan) return null;
        
        const { data: karyawanData } = await supabase
            .from('karyawan')
            .select('outlet')
            .eq('nama_karyawan', namaKaryawan)
            .single();
        
        return karyawanData?.outlet || null;
        
    } catch (error) {
        console.error('Error getting user outlet:', error);
        return null;
    }
}

// Fungsi untuk tampilkan modal edit dengan checklist outlet
async function showEditPopup() {
    const announcementText = document.getElementById('announcementText');
    const marquee = announcementText?.querySelector('marquee');
    const currentText = marquee ? marquee.textContent : '';
    
    console.log('showEditPopup called');
    
    // Load daftar outlet
    const outlets = await loadOutletList();
    
    // Ambil outlet user saat ini
    const currentOutlet = await getCurrentUserOutlet();
    
    // Buat HTML untuk checklist outlet
    let outletCheckboxes = '';
    
    if (outlets.length > 0) {
        outletCheckboxes = `
            <div class="outlet-checklist-header">
                <label>
                    <i class="fas fa-store"></i> Pilih Outlet (${outlets.length} tersedia)
                </label>
                <div class="checklist-actions">
                    <button type="button" class="btn-small" id="selectAllBtn">
                        <i class="fas fa-check-square"></i> Semua
                    </button>
                    <button type="button" class="btn-small" id="clearAllBtn">
                        <i class="fas fa-times-circle"></i> Hapus
                    </button>
                </div>
            </div>
            
            <div class="outlet-checklist-container">
                <!-- Opsi Semua Outlet -->
                <div class="checklist-item all-outlets">
                    <label class="checklist-label">
                        <input type="checkbox" id="checkAllOutlets" class="checklist-checkbox" value="all">
                        <span class="custom-checkbox"></span>
                        <span class="checklist-text">
                            <i class="fas fa-bullhorn"></i> <strong>Semua Outlet</strong>
                        </span>
                    </label>
                </div>
                
                <!-- Daftar Outlet -->
                ${outlets.map(outlet => {
                    const isChecked = outlet.value === currentOutlet;
                    return `
                        <div class="checklist-item">
                            <label class="checklist-label">
                                <input type="checkbox" class="checklist-checkbox outlet-checkbox" 
                                    value="${outlet.value}" ${isChecked ? 'checked' : ''}>
                                <span class="custom-checkbox"></span>
                                <span class="checklist-text">
                                    <i class="fas fa-store"></i> ${outlet.name}
                                </span>
                            </label>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="selection-stats" id="selectionStats">
                <span id="selectedCount">0</span> outlet terpilih
            </div>
        `;
    } else {
        outletCheckboxes = `
            <div class="no-outlets">
                <i class="fas fa-exclamation-circle"></i>
                <p>Tidak ada outlet ditemukan</p>
            </div>
        `;
    }
    
    // Buat popup
    const popupHTML = `
        <div class="edit-popup" id="editPopup">
            <div class="popup-content">
                <div class="popup-header">
                    <h3><i class="fas fa-bullhorn"></i> Edit Pengumuman</h3>
                    <button class="close-popup" id="closePopup">&times;</button>
                </div>
                
                <!-- Pilihan Outlet dengan Checklist -->
                <div class="outlet-checklist-section">
                    ${outletCheckboxes}
                </div>
                
                <!-- Textarea untuk pengumuman -->
                <div class="announcement-input-section">
                    <label for="announcementInput">
                        <i class="fas fa-edit"></i> Teks Pengumuman:
                    </label>
                    <textarea 
                        id="announcementInput" 
                        maxlength="500" 
                        placeholder="Masukkan teks pengumuman..."
                        rows="4"
                    >${currentText}</textarea>
                    <div class="char-counter">
                        <span id="charCount">${currentText.length}</span>/500 karakter
                    </div>
                </div>
                
                <!-- Tombol Action -->
                <div class="popup-buttons">
                    <button class="btn-cancel" id="cancelEdit">
                        <i class="fas fa-times"></i> Batal
                    </button>
                    <button class="btn-save" id="saveAnnouncement">
                        <i class="fas fa-save"></i> Simpan
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    
    // Setup event listeners
    setupAnnouncementPopupEvents();
    
    // Inisialisasi
    setTimeout(() => {
        const input = document.getElementById('announcementInput');
        if (input) {
            input.focus();
            input.select();
            updateCharCounter(input.value.length);
            updateSelectionStats();
        }
    }, 100);
}

// Setup events untuk popup
function setupAnnouncementPopupEvents() {
    const popup = document.getElementById('editPopup');
    const cancelBtn = document.getElementById('cancelEdit');
    const saveBtn = document.getElementById('saveAnnouncement');
    const closeBtn = document.getElementById('closePopup');
    const input = document.getElementById('announcementInput');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const checkAllOutlets = document.getElementById('checkAllOutlets');
    
    if (!popup || !input) return;
    
    // Fungsi update character counter
    const updateCharCounter = (length) => {
        const charCount = document.getElementById('charCount');
        if (charCount) {
            charCount.textContent = length;
            charCount.style.color = length > 450 ? '#e74c3c' : length > 400 ? '#f39c12' : '#27ae60';
        }
    };
    
    // Fungsi update selection stats
    const updateSelectionStats = () => {
        const checkboxes = document.querySelectorAll('.outlet-checkbox:checked');
        const selectedCount = checkboxes.length;
        const statsEl = document.getElementById('selectedCount');
        const statsContainer = document.getElementById('selectionStats');
        
        if (statsEl) statsEl.textContent = selectedCount;
        if (statsContainer) {
            statsContainer.style.background = selectedCount === 0 ? '#f8d7da' : '#d4edda';
            statsContainer.style.color = selectedCount === 0 ? '#721c24' : '#155724';
        }
        
        // Update "Semua Outlet" checkbox state
        const allCheckboxes = document.querySelectorAll('.outlet-checkbox');
        if (checkAllOutlets && allCheckboxes.length > 0) {
            const allChecked = Array.from(allCheckboxes).every(cb => cb.checked);
            const noneChecked = Array.from(allCheckboxes).every(cb => !cb.checked);
            
            checkAllOutlets.checked = allChecked;
            checkAllOutlets.indeterminate = !allChecked && !noneChecked;
        }
    };
    
    // Character counter event
    input.addEventListener('input', (e) => {
        updateCharCounter(e.target.value.length);
    });
    
    // Event untuk "Semua Outlet" checkbox
    if (checkAllOutlets) {
        checkAllOutlets.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.outlet-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = this.checked;
            });
            updateSelectionStats();
        });
    }
    
    // Event untuk outlet checkboxes
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('outlet-checkbox')) {
            updateSelectionStats();
        }
    });
    
    // Tombol Pilih Semua
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('.outlet-checkbox');
            checkboxes.forEach(cb => cb.checked = true);
            if (checkAllOutlets) {
                checkAllOutlets.checked = true;
                checkAllOutlets.indeterminate = false;
            }
            updateSelectionStats();
        });
    }
    
    // Tombol Hapus Semua
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('.checklist-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = false;
                cb.indeterminate = false;
            });
            updateSelectionStats();
        });
    }
    
    // Close button
    if (closeBtn) closeBtn.addEventListener('click', () => popup.remove());
    
    // Cancel button
    cancelBtn.addEventListener('click', () => popup.remove());
    
    // Save button
    saveBtn.addEventListener('click', saveAnnouncement);
    
    // ESC key untuk close
    const escHandler = (e) => {
        if (e.key === 'Escape') popup.remove();
    };
    document.addEventListener('keydown', escHandler);
    
    // Click outside to close
    popup.addEventListener('click', (e) => {
        if (e.target === popup) popup.remove();
    });
    
    // Inisialisasi
    updateCharCounter(input.value.length);
    updateSelectionStats();
}

// Fungsi save announcement
async function saveAnnouncement() {
    const input = document.getElementById('announcementInput');
    const popup = document.getElementById('editPopup');
    
    if (!input || !popup) {
        alert('Elemen tidak ditemukan!');
        return;
    }
    
    const newText = input.value.trim();
    
    if (newText === '') {
        alert('Pengumuman tidak boleh kosong!');
        input.focus();
        return;
    }
    
    // Ambil outlet yang dipilih
    const checkboxes = document.querySelectorAll('.checklist-checkbox:checked');
    const selectedOutlets = Array.from(checkboxes).map(cb => cb.value);
    
    if (selectedOutlets.length === 0) {
        alert('Pilih minimal satu outlet!');
        return;
    }
    
    try {
        // Cek role user
        const { data: { user } } = await supabase.auth.getUser();
        const namaKaryawan = user?.user_metadata?.nama_karyawan;
        
        if (!namaKaryawan) throw new Error('User tidak ditemukan');
        
        const { data: karyawanData } = await supabase
            .from('karyawan')
            .select('role')
            .eq('nama_karyawan', namaKaryawan)
            .single();
        
        if (karyawanData?.role === 'owner') {
            // Tampilkan loading
            const saveBtn = document.getElementById('saveAnnouncement');
            const originalText = saveBtn.innerHTML;
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
            
            // Simpan ke database
            const result = await saveAnnouncementToSupabase(newText, selectedOutlets);
            
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
            
            if (result.success) {
                // Update UI
                const announcementText = document.getElementById('announcementText');
                if (announcementText) {
                    announcementText.innerHTML = `<marquee>${newText}</marquee>`;
                }
                
                // Simpan ke localStorage sebagai cache
                localStorage.setItem('babeh_announcement', newText);
                
                // Tampilkan pesan sukses
                let successMessage = 'Pengumuman berhasil disimpan!';
                if (selectedOutlets.includes('all')) {
                    successMessage = 'Pengumuman berhasil dikirim ke semua outlet!';
                } else if (selectedOutlets.length > 1) {
                    successMessage = `Pengumuman berhasil dikirim ke ${selectedOutlets.length} outlet`;
                }
                
                alert(successMessage);
                popup.remove();
                
            } else {
                alert(`Gagal menyimpan: ${result.error}`);
            }
        } else {
            // Non-owner: hanya simpan ke localStorage
            localStorage.setItem('babeh_announcement', newText);
            
            // Update UI
            const announcementText = document.getElementById('announcementText');
            if (announcementText) {
                announcementText.innerHTML = `<marquee>${newText}</marquee>`;
            }
            
            alert('Pengumuman berhasil disimpan!');
            popup.remove();
        }
        
    } catch (error) {
        console.error('Error saving announcement:', error);
        alert('Terjadi kesalahan: ' + error.message);
        
        // Reset button
        const saveBtn = document.getElementById('saveAnnouncement');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan';
        }
    }
}

// Fungsi save ke Supabase - VERSI SEDERHANA
async function saveAnnouncementToSupabase(announcementText, selectedOutlets) {
    try {
        console.log('Saving to outlets:', selectedOutlets);
        
        // Jika pilih "Semua Outlet"
        if (selectedOutlets.includes('all')) {
            // Ambil semua outlet dulu
            const { data: allOutlets, error: fetchError } = await supabase
                .from('outlet')
                .select('id');
            
            if (fetchError) throw new Error(`Gagal mengambil data outlet: ${fetchError.message}`);
            
            // Buat array update promises
            const updatePromises = allOutlets.map(outlet => 
                supabase
                    .from('outlet')
                    .update({ pengumuman_mybabeh: announcementText })
                    .eq('id', outlet.id)
            );
            
            // Jalankan semua update
            const results = await Promise.allSettled(updatePromises);
            
            const successCount = results.filter(r => r.status === 'fulfilled' && !r.value.error).length;
            const errors = results.filter(r => r.status === 'rejected' || r.value.error);
            
            console.log(`Updated ${successCount} out of ${allOutlets.length} outlets`);
            
            return { 
                success: successCount > 0, 
                outlets: 'all', 
                successCount,
                total: allOutlets.length 
            };
        }
        
        // Simpan ke outlet yang dipilih
        let successCount = 0;
        
        for (const outletValue of selectedOutlets) {
            try {
                // Cari ID outlet
                const { data: outletData } = await supabase
                    .from('outlet')
                    .select('id')
                    .eq('outlet', outletValue)
                    .single();
                
                if (outletData?.id) {
                    const { error } = await supabase
                        .from('outlet')
                        .update({ pengumuman_mybabeh: announcementText })
                        .eq('id', outletData.id);
                    
                    if (!error) successCount++;
                }
            } catch (err) {
                console.warn(`Failed to update ${outletValue}:`, err);
            }
        }
        
        return { 
            success: successCount > 0, 
            successCount,
            total: selectedOutlets.length 
        };
        
    } catch (error) {
        console.error('Error saving to Supabase:', error);
        return { success: false, error: error.message };
    }
}

// Fungsi load announcement
async function loadAnnouncementFromSupabase() {
    try {
        const currentOutlet = await getCurrentUserOutlet();
        if (!currentOutlet) return null;
        
        const { data: outletData } = await supabase
            .from('outlet')
            .select('pengumuman_mybabeh')
            .eq('outlet', currentOutlet)
            .single();
        
        return outletData?.pengumuman_mybabeh || null;
        
    } catch (error) {
        console.error('Error loading announcement:', error);
        return null;
    }
}

// Load saved announcement
async function loadSavedAnnouncement() {
    const announcementText = document.getElementById('announcementText');
    if (!announcementText) return;
    
    try {
        // Coba dari database
        const dbAnnouncement = await loadAnnouncementFromSupabase();
        
        if (dbAnnouncement) {
            announcementText.innerHTML = `<marquee>${dbAnnouncement}</marquee>`;
            localStorage.setItem('babeh_announcement', dbAnnouncement);
            return;
        }
        
        // Coba dari localStorage
        const savedText = localStorage.getItem('babeh_announcement');
        if (savedText) {
            announcementText.innerHTML = `<marquee>${savedText}</marquee>`;
            return;
        }
        
        // Default message
        const now = new Date();
        const defaultMsg = `Selamat datang di MyBabeh App - ${now.toLocaleDateString('id-ID')}`;
        announcementText.innerHTML = `<marquee>${defaultMsg}</marquee>`;
        
    } catch (error) {
        console.error('Error loading announcement:', error);
        const savedText = localStorage.getItem('babeh_announcement');
        if (savedText) {
            announcementText.innerHTML = `<marquee>${savedText}</marquee>`;
        }
    }
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

// ========== BAGIAN 4: FUNGSI MENU KOMPONEN - KOMISI ==========
// ============================================================

// Variabel global
let currentKaryawan = null;
let isOwner = false;
let currentUserOutlet = null;

// [4.1] Fungsi untuk tampilkan halaman komisi
async function showKomisiPage() {
    try {
        // Ambil data user
        const { data: { user } } = await supabase.auth.getUser();
        const namaKaryawan = user?.user_metadata?.nama_karyawan;
        
        if (!namaKaryawan) {
            alert('User tidak ditemukan!');
            return;
        }
        
        // Ambil data karyawan lengkap (untuk outlet dan role)
        const { data: karyawanData } = await supabase
            .from('karyawan')
            .select('role, outlet')
            .eq('nama_karyawan', namaKaryawan)
            .single();
        
        if (!karyawanData) {
            alert('Data karyawan tidak ditemukan!');
            return;
        }
        
        currentKaryawan = {
            nama_karyawan: namaKaryawan,
            role: karyawanData.role,
            outlet: karyawanData.outlet
        };
        
        currentUserOutlet = karyawanData.outlet;
        isOwner = karyawanData.role === 'owner';
        
        // Sembunyikan main app, tampilkan halaman komisi
        document.getElementById('appScreen').style.display = 'none';
        
        // Buat container halaman komisi
        createKomisiPage();
        
        // Load data komisi
        await loadKomisiData();
        
    } catch (error) {
        console.error('Error in showKomisiPage:', error);
        alert('Gagal memuat halaman komisi!');
    }
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
        <div id="ownerFilterSection" class="owner-filter" style="display: ${isOwner ? 'block' : 'none'};">
            <!-- BARIS PERTAMA: Outlet dan Periode -->
            <div class="filter-row first-row">
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
            
            <!-- BARIS KEDUA: Pilih Karyawan saja -->
            <div class="filter-row second-row">
                <div class="filter-group full-width">
                    <label for="selectKaryawan">Pilih Karyawan:</label>
                    <select id="selectKaryawan" class="karyawan-select">
                        <option value="">Semua Karyawan</option>
                    </select>
                </div>
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
                            <th>Alasan UOP</th>
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
        // Load dropdown outlet
        loadOutletDropdown();
        
        // Event listener untuk outlet change
        document.getElementById('selectOutlet').addEventListener('change', async () => {
            await loadKaryawanDropdown(); // Reload karyawan berdasarkan outlet
            await loadKomisiData();
        });
        
        // Event listener untuk karyawan change
        document.getElementById('selectKaryawan').addEventListener('change', async () => {
            await loadKomisiData();
        });
        
        // Event listener untuk date range
        document.getElementById('dateRange').addEventListener('change', async (e) => {
            if (e.target.value === 'custom') {
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
                        <td colspan="10" style="text-align: center; padding: 20px; color: #ff4757;">
                            Gagal memuat data
                        </td>
                    </tr>
                `;
            }
        }
    }
}

// [4.5] Fungsi untuk get filter parameters
function getFilterParams() {
    const params = {
        namaKaryawan: currentKaryawan?.nama_karyawan,
        role: currentKaryawan?.role,
        outlet: currentUserOutlet, // OUTLET DARI TABEL KARYAWAN
        isOwner: isOwner
    };
    
    if (isOwner) {
        const selectOutlet = document.getElementById('selectOutlet');
        const selectKaryawan = document.getElementById('selectKaryawan');
        const dateRange = document.getElementById('dateRange');
        
        // Untuk owner: gunakan filter dari dropdown
        if (selectOutlet && selectOutlet.value !== 'all') {
            params.outlet = selectOutlet.value;
        } else {
            params.outlet = null; // Semua outlet
        }
        
        if (selectKaryawan && selectKaryawan.value) {
            params.namaKaryawan = selectKaryawan.value;
            params.filterByKaryawan = true;
        } else {
            params.namaKaryawan = null;
            params.filterByKaryawan = false;
        }
        
        if (dateRange) {
            params.dateRange = dateRange.value;
        }
    } else {
        // Untuk non-owner: selalu filter berdasarkan nama sendiri
        params.filterByKaryawan = true;
        // Outlet tetap dari karyawan.outlet
    }
    
    console.log('Filter params refined:', params);
    return params;
}

// [4.6] Fungsi untuk load komisi hari ini - DARI TABEL KOMISI
async function loadTodayKomisi(filterParams) {
    const today = new Date().toISOString().split('T')[0];
    
    console.log('Loading today komisi from komisi table for:', {
        tanggal: today,
        namaKaryawan: filterParams.namaKaryawan,
        outlet: filterParams.outlet
    });
    
    // Query langsung dari tabel komisi
    let query = supabase
        .from('komisi')
        .select('*')
        .eq('tanggal', today);
    
    // Filter berdasarkan serve_by
    if (filterParams.filterByKaryawan && filterParams.namaKaryawan) {
        query = query.eq('serve_by', filterParams.namaKaryawan);
        console.log('Filter by serve_by:', filterParams.namaKaryawan);
    }
    
    // Filter berdasarkan outlet (jika bukan semua outlet)
    if (filterParams.outlet) {
        query = query.eq('outlet', filterParams.outlet);
        console.log('Filter by outlet:', filterParams.outlet);
    }
    
    const { data: komisiData, error } = await query;
    
    if (error) {
        console.error('Error loading today komisi:', error);
        throw error;
    }
    
    console.log('Komisi data found:', komisiData?.length || 0, 'records');
    
    // Jika tidak ada data di komisi, ambil info karyawan untuk outlet
    if (!komisiData || komisiData.length === 0) {
        const outletInfo = await getOutletInfo(filterParams.namaKaryawan || currentKaryawan.nama_karyawan);
        
        displayTodayKomisi({
            tanggal: today,
            outlet: outletInfo.outlet || currentUserOutlet || '-',
            serve_by: filterParams.namaKaryawan || currentKaryawan.nama_karyawan || '-',
            kasir: '-',
            jumlah_transaksi: 0,
            komisi: 0,
            uop: 0,
            tips_qris: 0,
            alasan_nouop: 'Belum ada transaksi hari ini',
            total_transaksi: 0
        }, new Date());
        return;
    }
    
    // Untuk non-owner: tampilkan data pertama (seharusnya cuma 1)
    // Untuk owner: mungkin banyak data, tampilkan summary
    if (isOwner && !filterParams.filterByKaryawan) {
        // Owner melihat semua karyawan: hitung total
        const summary = calculateSummary(komisiData);
        displayTodayKomisi(summary, new Date());
    } else {
        // Non-owner atau owner pilih karyawan tertentu
        const data = komisiData[0];
        displayTodayKomisi(data, new Date());
    }
}

// [4.7] Fungsi untuk load komisi 7 hari terakhir - DARI TABEL KOMISI
async function loadWeeklyKomisi(filterParams) {
    console.log('=== LOAD WEEKLY KOMISI FROM KOMISI TABLE ===');
    
    // Tanggal range: 7 hari sebelum hari ini
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1); // sampai kemarin
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // 7 hari sebelum
    
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    console.log('Date range:', startStr, 'to', endStr);
    
    // Query dari tabel komisi
    let query = supabase
        .from('komisi')
        .select('*')
        .gte('tanggal', startStr)
        .lte('tanggal', endStr)
        .order('tanggal', { ascending: false });
    
    // Filter berdasarkan serve_by
    if (filterParams.filterByKaryawan && filterParams.namaKaryawan) {
        query = query.eq('serve_by', filterParams.namaKaryawan);
    }
    
    // Filter berdasarkan outlet
    if (filterParams.outlet) {
        query = query.eq('outlet', filterParams.outlet);
    }
    
    const { data: komisiData, error } = await query;
    
    if (error) {
        console.error('Error loading weekly komisi:', error);
        throw error;
    }
    
    console.log('Weekly komisi found:', komisiData?.length || 0, 'records');
    
    // Group by tanggal untuk tampilan
    const groupedByDate = {};
    
    if (komisiData && komisiData.length > 0) {
        komisiData.forEach(item => {
            const date = item.tanggal;
            if (!groupedByDate[date]) {
                groupedByDate[date] = [];
            }
            groupedByDate[date].push(item);
        });
    }
    
    // Buat array untuk 7 hari
    const dailyResults = [];
    let total7Hari = 0;
    
    // Untuk owner melihat semua: hitung per hari (bukan per karyawan)
    if (isOwner && !filterParams.filterByKaryawan) {
        // Loop 7 hari terakhir
        for (let i = 1; i <= 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayData = groupedByDate[dateStr] || [];
            const summary = calculateSummary(dayData);
            
            summary.date = dateStr;
            summary.dateFormatted = formatDateLocal(date);
            dailyResults.push(summary);
            
            total7Hari += summary.total_transaksi || 0;
        }
    } else {
        // Non-owner atau owner pilih karyawan tertentu
        for (let i = 1; i <= 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayData = groupedByDate[dateStr] || [];
            
            // Ambil data untuk karyawan tertentu
            let karyawanData = null;
            if (filterParams.namaKaryawan) {
                karyawanData = dayData.find(item => item.serve_by === filterParams.namaKaryawan);
            } else if (dayData.length > 0) {
                karyawanData = dayData[0]; // Ambil pertama jika tidak filter
            }
            
            // Jika tidak ada data di komisi, ambil info outlet dari karyawan
            if (!karyawanData) {
                const outletInfo = await getOutletInfo(filterParams.namaKaryawan || currentKaryawan.nama_karyawan);
                
                karyawanData = {
                    tanggal: dateStr,
                    outlet: outletInfo.outlet || currentUserOutlet || '-',
                    serve_by: filterParams.namaKaryawan || currentKaryawan.nama_karyawan || '-',
                    kasir: '-',
                    jumlah_transaksi: 0,
                    komisi: 0,
                    uop: 0,
                    tips_qris: 0,
                    alasan_nouop: 'Belum ada transaksi',
                    total_transaksi: 0
                };
            }
            
            karyawanData.date = dateStr;
            karyawanData.dateFormatted = formatDateLocal(date);
            dailyResults.push(karyawanData);
            
            total7Hari += karyawanData.total_transaksi || 0;
        }
    }
    
    console.log('Daily results prepared:', dailyResults.length);
    
    // Tampilkan di UI
    displayWeeklyKomisi(dailyResults, total7Hari);
}

// [4.8] Fungsi helper: get outlet info dari tabel karyawan
async function getOutletInfo(namaKaryawan) {
    try {
        if (!namaKaryawan) return { outlet: currentUserOutlet || '-' };
        
        const { data, error } = await supabase
            .from('karyawan')
            .select('outlet')
            .eq('nama_karyawan', namaKaryawan)
            .single();
        
        if (error) {
            console.error('Error getting outlet info:', error);
            return { outlet: currentUserOutlet || '-' };
        }
        
        return { outlet: data.outlet || currentUserOutlet || '-' };
    } catch (error) {
        console.error('Exception getting outlet info:', error);
        return { outlet: currentUserOutlet || '-' };
    }
}

// [4.9] Fungsi helper: calculate summary untuk owner view
function calculateSummary(komisiDataArray) {
    if (!komisiDataArray || komisiDataArray.length === 0) {
        return {
            outlet: 'Multiple',
            serve_by: 'Multiple',
            kasir: '-',
            jumlah_transaksi: 0,
            komisi: 0,
            uop: 0,
            tips_qris: 0,
            alasan_nouop: 'Tidak ada data',
            total_transaksi: 0
        };
    }
    
    const summary = {
        outlet: 'Multiple Outlets',
        serve_by: `${komisiDataArray.length} Karyawan`,
        kasir: 'Multiple',
        jumlah_transaksi: 0,
        komisi: 0,
        uop: 0,
        tips_qris: 0,
        alasan_nouop: null,
        total_transaksi: 0
    };
    
    komisiDataArray.forEach(item => {
        summary.jumlah_transaksi += item.jumlah_transaksi || 0;
        summary.komisi += item.komisi || 0;
        summary.uop += item.uop || 0;
        summary.tips_qris += item.tips_qris || 0;
        summary.total_transaksi += item.total_transaksi || 0;
    });
    
    return summary;
}

// [4.10] Fungsi untuk load dropdown outlet (owner only)
async function loadOutletDropdown() {
    const select = document.getElementById('selectOutlet');
    
    try {
        const { data: outlets, error } = await supabase
            .from('karyawan')  // AMBIL DARI KARYAWAN, BUKAN TRANSAKSI
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
        
        // Set outlet user saat ini sebagai default jika bukan owner semua outlet
        if (currentUserOutlet && uniqueOutlets.includes(currentUserOutlet)) {
            select.value = currentUserOutlet;
        }
        
        // Setelah outlet di-load, load karyawan dropdown
        await loadKaryawanDropdown();
        
    } catch (error) {
        console.error('Error loading outlets:', error);
        select.innerHTML = '<option value="all">Semua Outlet</option>';
    }
}

// [4.11] Fungsi untuk load dropdown karyawan berdasarkan outlet (owner only)
async function loadKaryawanDropdown() {
    const select = document.getElementById('selectKaryawan');
    const outletSelect = document.getElementById('selectOutlet');
    const selectedOutlet = outletSelect ? outletSelect.value : null;
    
    try {
        let query = supabase
            .from('karyawan')
            .select('nama_karyawan, role')
            .order('nama_karyawan');
        
        // Filter berdasarkan outlet jika dipilih
        if (selectedOutlet && selectedOutlet !== 'all') {
            query = query.eq('outlet', selectedOutlet);
        }
        
        const { data: karyawanList, error } = await query;
        
        if (error) throw error;
        
        select.innerHTML = `
            <option value="">Semua Karyawan</option>
            ${karyawanList.map(k => 
                `<option value="${k.nama_karyawan}">${k.nama_karyawan} (${k.role})</option>`
            ).join('')}
        `;
        
        // Auto-select karyawan saat ini jika bukan owner mode all
        if (!isOwner && currentKaryawan) {
            select.value = currentKaryawan.nama_karyawan;
        }
        
    } catch (error) {
        console.error('Error loading karyawan list:', error);
        select.innerHTML = `
            <option value="">Error loading data</option>
            ${currentKaryawan ? `<option value="${currentKaryawan.nama_karyawan}">${currentKaryawan.nama_karyawan}</option>` : ''}
        `;
    }
}

// [4.12] Fungsi untuk tampilkan komisi hari ini
function displayTodayKomisi(data, date) {
    const content = document.getElementById('todayKomisiContent');
    
    const totalUop = data.uop || 0;
    const showUopReason = totalUop === 0 && data.alasan_nouop;
    
    content.innerHTML = `
        <div class="today-header">
            <div class="date-display">
                <i class="fas fa-calendar-alt"></i>
                <span>${formatDateLocal(date)}</span>
            </div>
            <div class="outlet-display">
                <i class="fas fa-store"></i>
                <span>Outlet: ${data.outlet || currentUserOutlet || '-'}</span>
            </div>
        </div>
        
        <div class="today-grid">
            <div class="today-item">
                <div class="today-label">Serve By</div>
                <div class="today-value">${data.serve_by || currentKaryawan?.nama_karyawan || '-'}</div>
            </div>
            <div class="today-item">
                <div class="today-label">Kasir</div>
                <div class="today-value">${data.kasir || '-'}</div>
            </div>
            <div class="today-item">
                <div class="today-label">Jumlah Transaksi</div>
                <div class="today-value">${data.jumlah_transaksi || 0}</div>
            </div>
            <div class="today-item">
                <div class="today-label">UOP</div>
                <div class="today-value ${totalUop === 0 ? 'text-danger' : ''}">
                    ${formatRupiah(totalUop)}
                </div>
            </div>
        </div>
        
        <div class="today-totals">
            <div class="total-item">
                <div class="total-label">Total Transaksi</div>
                <div class="total-value">${formatRupiah(data.total_transaksi || 0)}</div>
            </div>
            <div class="total-item">
                <div class="total-label">Komisi</div>
                <div class="total-value">${formatRupiah(data.komisi || 0)}</div>
            </div>
            <div class="total-item">
                <div class="total-label">UOP</div>
                <div class="total-value">${formatRupiah(totalUop)}</div>
            </div>
            <div class="total-item">
                <div class="total-label">Tips QRIS</div>
                <div class="total-value">${formatRupiah(data.tips_qris || 0)}</div>
            </div>
            <div class="total-item grand-total">
                <div class="total-label">Total Pendapatan</div>
                <div class="total-value">${formatRupiah((data.komisi || 0) + totalUop + (data.tips_qris || 0))}</div>
            </div>
        </div>
        
        ${showUopReason ? `
        <div class="uop-reason-notice">
            <i class="fas fa-exclamation-circle"></i>
            <span class="reason-text">UOP = 0, ${data.alasan_nouop}</span>
        </div>
        ` : ''}
    `;
    
    // Sembunyikan loading, tampilkan content
    document.getElementById('loadingToday').style.display = 'none';
    content.style.display = 'block';
}

// [4.13] Fungsi untuk tampilkan komisi 7 hari
function displayWeeklyKomisi(dailyResults, total7Hari) {
    const tbody = document.getElementById('weeklyKomisiBody');
    tbody.innerHTML = '';
    
    dailyResults.forEach(result => {
        const totalUop = result.uop || 0;
        const hasUopReason = totalUop === 0 && result.alasan_nouop;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${result.dateFormatted}</td>
            <td>${result.outlet || currentUserOutlet || '-'}</td>
            <td>${result.serve_by || currentKaryawan?.nama_karyawan || '-'}</td>
            <td>${result.kasir || '-'}</td>
            <td>${result.jumlah_transaksi || 0}</td>
            <td>${formatRupiah(result.komisi || 0)}</td>
            <td class="${totalUop === 0 ? 'text-danger' : ''}">${formatRupiah(totalUop)}</td>
            <td>${formatRupiah(result.tips_qris || 0)}</td>
            <td class="alasan-column">${result.alasan_nouop || '-'}</td>
            <td class="total-column">${formatRupiah((result.komisi || 0) + totalUop + (result.tips_qris || 0))}</td>
        `;
        tbody.appendChild(row);
        
        // Tambahkan row info alasan jika UOP = 0
        if (hasUopReason) {
            const reasonRow = document.createElement('tr');
            reasonRow.className = 'uop-reason-row';
            reasonRow.innerHTML = `
                <td colspan="10" class="uop-reason-cell">
                    <div class="uop-reason-info">
                        <i class="fas fa-info-circle"></i>
                        <span>UOP = 0, ${result.alasan_nouop}</span>
                    </div>
                </td>
            `;
            tbody.appendChild(reasonRow);
        }
    });
    
    // Update total 7 hari
    document.getElementById('total7Hari').textContent = formatRupiah(total7Hari);
    
    // Sembunyikan loading, tampilkan table
    document.getElementById('loadingWeekly').style.display = 'none';
    document.getElementById('weeklyKomisiTable').style.display = 'table';
}

// [4.13] Fungsi untuk tampilkan komisi 7 hari
function displayWeeklyKomisi(dailyResults, total7Hari) {
    const tbody = document.getElementById('weeklyKomisiBody');
    tbody.innerHTML = '';
    
    dailyResults.forEach(result => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${result.dateFormatted}</td>
            <td>${result.outlet || currentUserOutlet || '-'}</td>
            <td>${result.serve_by || currentKaryawan?.nama_karyawan || '-'}</td>
            <td>${result.kasir || '-'}</td>
            <td>${result.jumlah_transaksi || 0}</td>
            <td>${formatRupiah(result.komisi || 0)}</td>
            <td>${formatRupiah(result.uop || 0)}</td>
            <td>${formatRupiah(result.tips_qris || 0)}</td>
            <td class="alasan-column">${result.alasan_nouop || '-'}</td>
            <td class="total-column">${formatRupiah((result.komisi || 0) + (result.uop || 0) + (result.tips_qris || 0))}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Update total 7 hari
    document.getElementById('total7Hari').textContent = formatRupiah(total7Hari);
    
    // Sembunyikan loading, tampilkan table
    document.getElementById('loadingWeekly').style.display = 'none';
    document.getElementById('weeklyKomisiTable').style.display = 'table';
}

// [4.14] Helper functions
function formatRupiah(amount) {
    if (amount === 0 || !amount) return 'Rp 0';
    return 'Rp ' + amount.toLocaleString('id-ID');
}

function formatDateLocal(date) {
    return date.toLocaleDateString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function showCustomDatePicker() {
    alert('Fitur custom date picker akan diimplementasikan nanti.');
    document.getElementById('dateRange').value = 'week';
}

// ========== FUNGSI MENU KOMPONEN - ABSENSI ==========
// =================================================

// Variabel global untuk state absensi
let currentKaryawanAbsensi = null;
let isOwnerAbsensi = false;
let currentUserOutletAbsensi = null;

// [1] Fungsi untuk tampilkan halaman absensi
async function showAbsensiPage() {
    try {
        // Ambil data user
        const { data: { user } } = await supabase.auth.getUser();
        const namaKaryawan = user?.user_metadata?.nama_karyawan;
        
        if (!namaKaryawan) {
            alert('User tidak ditemukan!');
            return;
        }
        
        // Ambil data karyawan lengkap (untuk outlet dan role)
        const { data: karyawanData } = await supabase
            .from('karyawan')
            .select('role, outlet')
            .eq('nama_karyawan', namaKaryawan)
            .single();
        
        if (!karyawanData) {
            alert('Data karyawan tidak ditemukan!');
            return;
        }
        
        currentKaryawanAbsensi = {
            nama_karyawan: namaKaryawan,
            role: karyawanData.role,
            outlet: karyawanData.outlet
        };
        
        currentUserOutletAbsensi = karyawanData.outlet;
        isOwnerAbsensi = karyawanData.role === 'owner';
        
        // Sembunyikan main app, tampilkan halaman absensi
        document.getElementById('appScreen').style.display = 'none';
        
        // Buat container halaman absensi
        createAbsensiPage();
        
        // Load data absensi
        await loadAbsensiData();
        
    } catch (error) {
        console.error('Error in showAbsensiPage:', error);
        alert('Gagal memuat halaman absensi!');
    }
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
        <div id="ownerAbsensiFilterSection" class="owner-filter" style="display: ${isOwnerAbsensi ? 'block' : 'none'};">
            <!-- BARIS PERTAMA: Outlet dan Periode -->
            <div class="filter-row first-row">
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
            
            <!-- BARIS KEDUA: Pilih Karyawan saja -->
            <div class="filter-row second-row">
                <div class="filter-group full-width">
                    <label for="selectKaryawanAbsensi">Pilih Karyawan:</label>
                    <select id="selectKaryawanAbsensi" class="karyawan-select">
                        <option value="">Semua Karyawan</option>
                    </select>
                </div>
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
                            <th>Status Kehadiran</th>
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
        // Load dropdown outlet
        loadOutletDropdownAbsensi();
        
        // Event listener untuk outlet change
        document.getElementById('selectOutletAbsensi').addEventListener('change', async () => {
            await loadKaryawanDropdownAbsensi();
            await loadAbsensiData();
        });
        
        // Event listener untuk karyawan change
        document.getElementById('selectKaryawanAbsensi').addEventListener('change', async () => {
            await loadAbsensiData();
        });
        
        // Event listener untuk date range
        document.getElementById('dateRangeAbsensi').addEventListener('change', async () => {
            await loadAbsensiData();
        });
    }
}

// [4] Fungsi untuk load data absensi
async function loadAbsensiData() {
    try {
        // Tampilkan loading
        document.getElementById('loadingTodayAbsensi').style.display = 'block';
        document.getElementById('todayAbsensiContent').style.display = 'none';
        document.getElementById('loadingWeeklyAbsensi').style.display = 'block';
        document.getElementById('weeklyAbsensiTable').style.display = 'none';
        
        // Tentukan parameter filter
        const filterParams = getAbsensiFilterParams();
        
        // Load data hari ini
        await loadTodayAbsensi(filterParams);
        
        // Load data 7 hari
        await loadWeeklyAbsensi(filterParams);
        
        // Update waktu terakhir update
        const updateTime = new Date().toLocaleTimeString('id-ID');
        document.getElementById('lastUpdateAbsensiTime').textContent = updateTime;
        
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
                        <td colspan="8" style="text-align: center; padding: 20px; color: #ff4757;">
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
        outlet: currentUserOutletAbsensi,
        isOwner: isOwnerAbsensi
    };
    
    if (isOwnerAbsensi) {
        const selectOutlet = document.getElementById('selectOutletAbsensi');
        const selectKaryawan = document.getElementById('selectKaryawanAbsensi');
        const dateRange = document.getElementById('dateRangeAbsensi');
        
        // Untuk owner: gunakan filter dari dropdown
        if (selectOutlet && selectOutlet.value !== 'all') {
            params.outlet = selectOutlet.value;
        } else {
            params.outlet = null;
        }
        
        if (selectKaryawan && selectKaryawan.value) {
            params.namaKaryawan = selectKaryawan.value;
            params.filterByKaryawan = true;
        } else {
            params.namaKaryawan = null;
            params.filterByKaryawan = false;
        }
        
        if (dateRange) {
            params.dateRange = dateRange.value;
        }
    } else {
        // Untuk non-owner: selalu filter berdasarkan nama sendiri
        params.filterByKaryawan = true;
    }
    
    return params;
}

// [6] Fungsi untuk load absensi hari ini
async function loadTodayAbsensi(filterParams) {
    // Format tanggal DD/MM/YYYY
    const today = new Date();
    const todayStr = formatDateDDMMYYYY(today);
    
    // Query langsung dari tabel absen
    let query = supabase
        .from('absen')
        .select('*')
        .eq('tanggal', todayStr);
    
    // Filter berdasarkan nama
    if (filterParams.filterByKaryawan && filterParams.namaKaryawan) {
        query = query.eq('nama', filterParams.namaKaryawan);
    }
    
    // Filter berdasarkan outlet
    if (filterParams.outlet) {
        query = query.eq('outlet', filterParams.outlet);
    }
    
    const { data: absensiData, error } = await query;
    
    if (error) {
        console.error('Error loading today absensi:', error);
        // Tampilkan data kosong dengan jadwal default
        const jadwal = await getJadwalKaryawan(filterParams.namaKaryawan);
        displayTodayAbsensi(null, today, jadwal);
        return;
    }
    
    // Untuk owner melihat semua: ambil data pertama atau summary
    let displayData = null;
    if (isOwnerAbsensi && !filterParams.filterByKaryawan && absensiData && absensiData.length > 0) {
        // Owner melihat semua: ambil data pertama untuk preview
        displayData = absensiData[0];
    } else {
        // Non-owner atau owner pilih karyawan tertentu
        displayData = absensiData?.[0] || null;
    }
    
    // Ambil jadwal karyawan
    const jadwal = await getJadwalKaryawan(
        displayData?.nama || filterParams.namaKaryawan || currentKaryawanAbsensi?.nama_karyawan
    );
    
    // Tampilkan data
    displayTodayAbsensi(displayData, today, jadwal);
}

// [7] Fungsi untuk load absensi 7 hari terakhir
async function loadWeeklyAbsensi(filterParams) {
    // Tanggal range: 7 hari sebelum hari ini
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1); // sampai kemarin
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // 7 hari sebelum
    
    // Format ke array DD/MM/YYYY
    const dateRange = [];
    for (let i = 1; i <= 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dateRange.push(formatDateDDMMYYYY(date));
    }
    
    // Query untuk 7 hari terakhir
    let query = supabase
        .from('absen')
        .select('*')
        .in('tanggal', dateRange);
    
    // Filter berdasarkan nama
    if (filterParams.filterByKaryawan && filterParams.namaKaryawan) {
        query = query.eq('nama', filterParams.namaKaryawan);
    }
    
    // Filter berdasarkan outlet
    if (filterParams.outlet) {
        query = query.eq('outlet', filterParams.outlet);
    }
    
    query = query.order('tanggal', { ascending: false });
    
    const { data: absensiData, error } = await query;
    
    if (error) {
        console.error('Error loading weekly absensi:', error);
        displayWeeklyAbsensi([], filterParams.namaKaryawan);
        return;
    }
    
    // Ambil jadwal karyawan
    const jadwal = await getJadwalKaryawan(
        filterParams.namaKaryawan || currentKaryawanAbsensi?.nama_karyawan
    );
    
    // Untuk owner melihat semua, ambil berdasarkan filter
    let displayData = [];
    if (isOwnerAbsensi && !filterParams.filterByKaryawan) {
        // Owner melihat semua: ambil semua data dan group by tanggal
        displayData = processOwnerWeeklyData(absensiData, dateRange, jadwal);
    } else {
        // Non-owner atau owner pilih karyawan tertentu
        displayData = processKaryawanWeeklyData(absensiData, dateRange, filterParams.namaKaryawan, jadwal);
    }
    
    // Tampilkan data
    displayWeeklyAbsensi(displayData);
}

// [8] Helper: Process data untuk owner (semua karyawan)
function processOwnerWeeklyData(absensiData, dateRange, jadwalDefault) {
    const result = [];
    
    dateRange.forEach(dateStr => {
        const dataForDate = absensiData?.filter(item => item.tanggal === dateStr) || [];
        
        if (dataForDate.length > 0) {
            // Untuk owner: tampilkan summary atau data pertama
            const firstData = dataForDate[0];
            result.push({
                tanggal: dateStr,
                tanggal_display: formatAbsensiDateDisplay(dateStr),  // GANTI DI SINI
                outlet: 'Multiple',
                nama: `${dataForDate.length} Karyawan`,
                jadwal_masuk: jadwalDefault?.jadwal_masuk || '09:00',
                jadwal_pulang: jadwalDefault?.jadwal_pulang || '21:00',
                clockin: 'Multiple',
                clockout: 'Multiple',
                jamkerja: 'Multiple',
                status_kehadiran: 'Multiple'
            });
        } else {
            // Tidak ada data untuk tanggal ini
            result.push({
                tanggal: dateStr,
                tanggal_display: formatAbsensiDateDisplay(dateStr),  // GANTI DI SINI
                outlet: '-',
                nama: '-',
                jadwal_masuk: jadwalDefault?.jadwal_masuk || '09:00',
                jadwal_pulang: jadwalDefault?.jadwal_pulang || '21:00',
                clockin: '-',
                clockout: '-',
                jamkerja: '-',
                status_kehadiran: 'Tidak ada data'
            });
        }
    });
    
    return result;
}

// [9] Helper: Process data untuk karyawan tertentu
function processKaryawanWeeklyData(absensiData, dateRange, namaKaryawan, jadwal) {
    const result = [];
    
    dateRange.forEach(dateStr => {
        const dataForKaryawan = absensiData?.find(item => 
            item.tanggal === dateStr && 
            (!namaKaryawan || item.nama === namaKaryawan)
        );
        
        if (dataForKaryawan) {
            result.push({
                tanggal: dateStr,
                tanggal_display: formatAbsensiDateDisplay(dateStr),  // GANTI DI SINI
                outlet: dataForKaryawan.outlet || '-',
                nama: dataForKaryawan.nama || '-',
                jadwal_masuk: jadwal?.jadwal_masuk || '09:00',
                jadwal_pulang: jadwal?.jadwal_pulang || '21:00',
                clockin: formatWaktuSimple(dataForKaryawan.clockin),
                clockout: formatWaktuSimple(dataForKaryawan.clockout),
                jamkerja: dataForKaryawan.jamkerja || '-',
                status_kehadiran: dataForKaryawan.status_kehadiran || '-'
            });
        } else {
            // Tidak ada data untuk tanggal ini
            result.push({
                tanggal: dateStr,
                tanggal_display: formatAbsensiDateDisplay(dateStr),  // GANTI DI SINI
                outlet: '-',
                nama: namaKaryawan || '-',
                jadwal_masuk: jadwal?.jadwal_masuk || '09:00',
                jadwal_pulang: jadwal?.jadwal_pulang || '21:00',
                clockin: '-',
                clockout: '-',
                jamkerja: '-',
                status_kehadiran: 'Tidak absen'
            });
        }
    });
    
    return result;
}

// [10] Fungsi untuk tampilkan absensi hari ini
function displayTodayAbsensi(absensiData, date, jadwal) {
    const content = document.getElementById('todayAbsensiContent');
    
    // Jika tidak ada data absensi
    if (!absensiData) {
        content.innerHTML = `
            <div class="today-header">
                <div class="date-display">
                    <i class="fas fa-calendar-alt"></i>
                    <span>${formatDateLocal(date)}</span>
                </div>
            </div>
            
            <div class="today-absensi-empty">
                <i class="fas fa-clock" style="font-size: 3rem; color: #ccc; margin-bottom: 15px;"></i>
                <p style="color: #666;">Belum ada data absensi hari ini</p>
                <p style="font-size: 0.9rem; color: #888;">Nama: ${currentKaryawanAbsensi?.nama_karyawan || '-'}</p>
            </div>
            
            <!-- Tampilkan Jadwal meski tidak ada absensi -->
            <div class="today-schedule-info">
                <h4><i class="fas fa-calendar-check"></i> Jadwal Hari Ini</h4>
                <div class="schedule-grid">
                    <div class="schedule-item">
                        <div class="schedule-label">Jadwal Masuk</div>
                        <div class="schedule-value">
                            <i class="fas fa-sign-in-alt"></i>
                            <span>${jadwal?.jadwal_masuk || '09:00'}</span>
                        </div>
                    </div>
                    <div class="schedule-item">
                        <div class="schedule-label">Jadwal Pulang</div>
                        <div class="schedule-value">
                            <i class="fas fa-sign-out-alt"></i>
                            <span>${jadwal?.jadwal_pulang || '21:00'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('loadingTodayAbsensi').style.display = 'none';
        content.style.display = 'block';
        return;
    }
    
    // AMBIL DATA LANGSUNG DARI DATABASE + TAMPILKAN JADWAL
    content.innerHTML = `
        <div class="today-header">
            <div class="date-display">
                <i class="fas fa-calendar-alt"></i>
                <span>${formatDateLocal(date)}</span>
            </div>
        </div>
        
        <!-- Info Dasar -->
        <div class="today-basic-info">
            <div class="basic-info-item">
                <div class="basic-label">Outlet</div>
                <div class="basic-value">${absensiData.outlet || currentUserOutletAbsensi || '-'}</div>
            </div>
            <div class="basic-info-item">
                <div class="basic-label">Karyawan</div>
                <div class="basic-value">${absensiData.nama || currentKaryawanAbsensi?.nama_karyawan || '-'}</div>
            </div>
        </div>
        
        <!-- Jadwal & Absensi - 2 Kolom -->
        <div class="today-schedule-section">
            <h4><i class="fas fa-calendar-check"></i> Jadwal & Absensi</h4>
            <div class="schedule-grid">
                <!-- Kolom Kiri: Jadwal -->
                <div class="schedule-column left-column">
                    <div class="schedule-item">
                        <div class="schedule-label">Jadwal Masuk</div>
                        <div class="schedule-value jadwal-masuk">
                            <i class="fas fa-sign-in-alt"></i>
                            <span>${jadwal?.jadwal_masuk || '09:00'}</span>
                        </div>
                    </div>
                    <div class="schedule-item">
                        <div class="schedule-label">Jadwal Pulang</div>
                        <div class="schedule-value jadwal-pulang">
                            <i class="fas fa-sign-out-alt"></i>
                            <span>${jadwal?.jadwal_pulang || '21:00'}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Kolom Kanan: Actual Absensi -->
                <div class="schedule-column right-column">
                    <div class="schedule-item">
                        <div class="schedule-label">Clock In</div>
                        <div class="schedule-value clock-in ${absensiData.clockin ? 'has-data' : 'no-data'}">
                            <i class="fas fa-fingerprint"></i>
                            <span>${formatWaktuSimple(absensiData.clockin) || '-'}</span>
                        </div>
                    </div>
                    <div class="schedule-item">
                        <div class="schedule-label">Clock Out</div>
                        <div class="schedule-value clock-out ${absensiData.clockout ? 'has-data' : 'no-data'}">
                            <i class="fas fa-fingerprint"></i>
                            <span>${formatWaktuSimple(absensiData.clockout) || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Data dari Database -->
        <div class="today-data-section">
            <h4><i class="fas fa-chart-bar"></i> Data Absensi</h4>
            <div class="data-grid">
                <div class="data-item">
                    <div class="data-label">Jam Kerja</div>
                    <div class="data-value jam-kerja">
                        ${absensiData.jamkerja || '-'}
                    </div>
                </div>
                <div class="data-item">
                    <div class="data-label">Status Kehadiran</div>
                    <div class="data-value status ${getStatusClass(absensiData.status_kehadiran)}">
                        ${absensiData.status_kehadiran || 'Belum absen'}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('loadingTodayAbsensi').style.display = 'none';
    content.style.display = 'block';
}

// [11] Fungsi untuk tampilkan absensi 7 hari
function displayWeeklyAbsensi(weeklyData) {
    const tbody = document.getElementById('weeklyAbsensiBody');
    tbody.innerHTML = '';
    
    let foundCount = 0;
    
    weeklyData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.tanggal_display}</td>
            <td>${item.outlet || '-'}</td>
            <td>${item.nama || '-'}</td>
            <td>${item.jadwal_masuk || '09:00'}</td>
            <td>${item.jadwal_pulang || '21:00'}</td>
            <td>${item.clockin || '-'}</td>
            <td>${item.clockout || '-'}</td>
            <td>${item.jamkerja || '-'}</td>
            <td class="status-cell">
                <span class="status-pill ${getStatusClass(item.status_kehadiran)}">
                    ${item.status_kehadiran || '-'}
                </span>
            </td>
        `;
        tbody.appendChild(row);
        
        if (item.status_kehadiran && item.status_kehadiran !== 'Tidak ada data') {
            foundCount++;
        }
    });
    
    // Update total hari dengan data
    document.getElementById('totalHariAbsensi').textContent = foundCount;
    
    // Sembunyikan loading, tampilkan table
    document.getElementById('loadingWeeklyAbsensi').style.display = 'none';
    document.getElementById('weeklyAbsensiTable').style.display = 'table';
}

// [12] Fungsi untuk load dropdown outlet (owner only)
async function loadOutletDropdownAbsensi() {
    const select = document.getElementById('selectOutletAbsensi');
    
    try {
        const { data: outlets, error } = await supabase
            .from('karyawan')
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
        
        // Set outlet user saat ini sebagai default
        if (currentUserOutletAbsensi && uniqueOutlets.includes(currentUserOutletAbsensi)) {
            select.value = currentUserOutletAbsensi;
        }
        
        // Setelah outlet di-load, load karyawan dropdown
        await loadKaryawanDropdownAbsensi();
        
    } catch (error) {
        console.error('Error loading outlets for absensi:', error);
        select.innerHTML = '<option value="all">Semua Outlet</option>';
    }
}

// [13] Fungsi untuk load dropdown karyawan berdasarkan outlet (owner only)
async function loadKaryawanDropdownAbsensi() {
    const select = document.getElementById('selectKaryawanAbsensi');
    const outletSelect = document.getElementById('selectOutletAbsensi');
    const selectedOutlet = outletSelect ? outletSelect.value : null;
    
    try {
        let query = supabase
            .from('karyawan')
            .select('nama_karyawan, role')
            .order('nama_karyawan');
        
        // Filter berdasarkan outlet jika dipilih
        if (selectedOutlet && selectedOutlet !== 'all') {
            query = query.eq('outlet', selectedOutlet);
        }
        
        const { data: karyawanList, error } = await query;
        
        if (error) throw error;
        
        select.innerHTML = `
            <option value="">Semua Karyawan</option>
            ${karyawanList.map(k => 
                `<option value="${k.nama_karyawan}">${k.nama_karyawan} (${k.role})</option>`
            ).join('')}
        `;
        
        // Auto-select karyawan saat ini jika bukan owner mode all
        if (!isOwnerAbsensi && currentKaryawanAbsensi) {
            select.value = currentKaryawanAbsensi.nama_karyawan;
        }
        
    } catch (error) {
        console.error('Error loading karyawan list for absensi:', error);
        select.innerHTML = `
            <option value="">Error loading data</option>
            ${currentKaryawanAbsensi ? `<option value="${currentKaryawanAbsensi.nama_karyawan}">${currentKaryawanAbsensi.nama_karyawan}</option>` : ''}
        `;
    }
}

// [14] Fungsi untuk ambil jadwal dari tabel karyawan
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

// [15] Helper: Format tanggal DD/MM/YYYY
function formatDateDDMMYYYY(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// ========== HELPER FUNCTIONS KHUSUS ABSENSI ==========

// Format tanggal untuk display (khusus absensi)
function formatAbsensiDateDisplay(dateStr) {
    if (!dateStr) return '-';
    
    // Jika sudah format DD/MM/YYYY, tampilkan dengan format yang lebih baik
    if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = dateStr.split('/');
        
        try {
            const date = new Date(year, month - 1, day);
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString('id-ID', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                }).replace(/\./g, '');
            }
        } catch (e) {
            console.warn('Error formatting date:', e);
        }
        
        // Fallback: tampilkan format asli
        return dateStr;
    }
    
    // Jika bukan format yang diharapkan, return as-is
    return dateStr;
}

// Format tanggal untuk display (dalam halaman absensi)
function formatDateLocal(date) {
    return date.toLocaleDateString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Format waktu simple
function formatWaktuSimple(waktu) {
    if (!waktu) return null;
    // Jika sudah format HH:MM, return langsung
    if (typeof waktu === 'string' && waktu.match(/^\d{1,2}:\d{2}$/)) {
        return waktu;
    }
    // Jika timestamp atau ISO, parse
    try {
        const date = new Date(waktu);
        if (!isNaN(date.getTime())) {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        }
    } catch (e) {
        console.warn('Error formatting waktu:', e);
    }
    return waktu;
}

// Helper untuk class CSS berdasarkan status
function getStatusClass(status) {
    if (!status) return 'tidak-absen';
    
    if (status.includes('Terlambat') || status.includes('terlambat')) 
        return 'terlambat';
    if (status.includes('Pulang Cepat') || status.includes('pulang cepat')) 
        return 'pulang-cepat';
    if (status.includes('Tepat waktu') || status.includes('tepat waktu')) 
        return 'tepat-waktu';
    if (status.includes('Belum absen') || status.includes('Tidak absen') || status.includes('tidak absen')) 
        return 'tidak-absen';
    if (status.includes('Masih bekerja') || status.includes('masih bekerja')) 
        return 'masih-bekerja';
    if (status.includes('Libur') || status.includes('libur') || status.includes('Cuti')) 
        return 'libur';
    
    return 'tidak-absen';
}

// ========== FUNGSI MENU KOMPONEN - KAS & SETORAN ==========
// =========================================================

// Global variables untuk Kas
let currentKasUser = null;
let isOwnerKas = false;
let currentUserOutletKas = null;
let kasState = {
    outlets: [],
    kasirs: [],
    currentKasData: [],
    pemasukanItems: [],
    pengeluaranItems: [],
    currentSetoran: null,
    availablePeriods: [],
    selectedPeriod: null,
    selectedTanggal: '',
    existingKasData: null,
    autoGenerateData: {},
    selectedOutlet: null, // ← NEW: untuk filter outlet owner
    outletList: [], // ← NEW: daftar outlet untuk owner
    allOutletsData: {} // ← NEW: cache data semua outlet
};

// Konfigurasi WhatsApp API
const WA_API_URL = 'https://waha-yetv8qi4e3zk.anakit.sumopod.my.id/api/sendText';
const WA_API_KEY = 'sfcoGbpdLDkGZhKw2rx8sbb14vf4d8V6';
const WA_CHAT_ID = '62811159429-1533260196@g.us';

// [1] Fungsi untuk tampilkan halaman Kas & Setoran
async function showKasPage() {
    try {
        console.log('=== SHOW KAS PAGE ===');
        
        // Ambil data user dari auth
        const { data: { user } } = await supabase.auth.getUser();
        const namaKaryawan = user?.user_metadata?.nama_karyawan;
        
        if (!namaKaryawan) {
            alert('User tidak ditemukan!');
            return;
        }
        
        // Ambil data karyawan lengkap
        const { data: karyawanData } = await supabase
            .from('karyawan')
            .select('role, outlet, posisi, nama_karyawan')
            .eq('nama_karyawan', namaKaryawan)
            .single();
        
        if (!karyawanData) {
            alert('Data karyawan tidak ditemukan!');
            return;
        }
        
        // Set global variables
        currentKasUser = {
            nama_karyawan: karyawanData.nama_karyawan,
            role: karyawanData.role,
            outlet: karyawanData.outlet,
            posisi: karyawanData.posisi
        };
        
        currentUserOutletKas = karyawanData.outlet;
        isOwnerKas = karyawanData.role === 'owner';
        
        console.log('Kas User Data:', currentKasUser);
        
        // Jika owner, load daftar outlet
        if (isOwnerKas) {
            await loadOutletListForKas();
        }
        
        // Set selectedOutlet: untuk owner default outlet sendiri, non-owner outlet sendiri
        kasState.selectedOutlet = isOwnerKas ? currentUserOutletKas : currentUserOutletKas;
        
        // Sembunyikan main app, tampilkan halaman kas
        document.getElementById('appScreen').style.display = 'none';
        
        // Buat container halaman kas
        createKasPage();
        
        // Generate periode options
        generateKasPeriodOptions();
        
        // Setup tanggal input
        setupKasTanggalInput();
        
        // Load data kas
        await loadKasData();
        
    } catch (error) {
        console.error('Error in showKasPage:', error);
        alert('Gagal memuat halaman Kas & Setoran!');
    }
}

// [NEW] Fungsi untuk load daftar outlet (owner only)
async function loadOutletListForKas() {
    try {
        console.log('Loading outlet list for owner...');
        
        const { data: outlets, error } = await supabase
            .from('outlet')
            .select('outlet, id')
            .order('outlet');
        
        if (error) {
            console.error('Error loading outlets:', error);
            kasState.outletList = [];
            return;
        }
        
        kasState.outletList = outlets.map(outlet => ({
            id: outlet.id,
            name: outlet.outlet || `Outlet ${outlet.id}`,
            value: outlet.outlet || `outlet_${outlet.id}`
        }));
        
        console.log('Outlet list loaded:', kasState.outletList.length, 'outlets');
        
    } catch (error) {
        console.error('Exception loading outlets:', error);
        kasState.outletList = [];
    }
}

// [2] Fungsi untuk buat halaman Kas & Setoran
function createKasPage() {
    // Hapus halaman kas sebelumnya jika ada
    const existingPage = document.getElementById('kasPage');
    if (existingPage) existingPage.remove();
    
    // Buat container
    const kasPage = document.createElement('div');
    kasPage.id = 'kasPage';
    kasPage.className = 'kas-page';
    
    // Siapkan HTML untuk filter outlet (hanya owner)
    let outletFilterHTML = '';
    if (isOwnerKas && kasState.outletList.length > 0) {
        outletFilterHTML = `
            <div class="outlet-filter-section">
                <div class="section-header">
                    <h3><i class="fas fa-store"></i> Filter Outlet</h3>
                </div>
                <div class="filter-content">
                    <div class="outlet-selector-group">
                        <label for="outletFilterSelect">Pilih Outlet:</label>
                        <select id="outletFilterSelect" class="outlet-select">
                            <option value="">Semua Outlet</option>
                            ${kasState.outletList.map(outlet => `
                                <option value="${outlet.value}" 
                                        ${outlet.value === kasState.selectedOutlet ? 'selected' : ''}>
                                    ${outlet.name}
                                </option>
                            `).join('')}
                        </select>
                        <div class="outlet-info" id="outletInfoDisplay">
                            ${kasState.selectedOutlet ? `Outlet: ${kasState.selectedOutlet}` : 'Semua Outlet'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    kasPage.innerHTML = `
        <!-- Header -->
        <header class="kas-header">
            <button class="back-btn" id="backToMainFromKas">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h2><i class="fas fa-cash-register"></i> Kas & Setoran</h2>
            <div class="header-actions">
                <button class="refresh-btn" id="refreshKas">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
        </header>
        
        <!-- Main Content -->
        <div class="kas-content">
            <!-- Info User -->
            <div class="user-info-section">
                <div class="info-card">
                    <div class="info-grid">
                        <div class="info-item">
                            <i class="fas fa-store"></i>
                            <div>
                                <div class="info-label">Outlet</div>
                                <div class="info-value">${currentUserOutletKas || '-'}</div>
                            </div>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-user"></i>
                            <div>
                                <div class="info-label">Kasir</div>
                                <div class="info-value">${currentKasUser?.nama_karyawan || '-'}</div>
                            </div>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-user-tag"></i>
                            <div>
                                <div class="info-label">Role</div>
                                <div class="info-value">${currentKasUser?.role || '-'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- FILTER OUTLET untuk Owner -->
            ${outletFilterHTML}
            
            <!-- Ringkasan KAS -->
            <section class="ringkasan-section">
                <div class="section-header">
                    <h3><i class="fas fa-chart-bar"></i> Ringkasan KAS</h3>
                    <div class="periode-selector">
                        <select id="kasPeriodeSelect" class="periode-select">
                            <!-- Options akan diisi oleh JavaScript -->
                        </select>
                    </div>
                </div>
                
                <div id="ringkasanContainer" class="ringkasan-container">
                    <p class="empty-message">Pilih periode untuk melihat ringkasan KAS</p>
                </div>
                
                <!-- Status Setoran -->
                <div id="statusSetoran" class="status-setoran-card">
                    <div class="status-header">
                        <h4><i class="fas fa-info-circle"></i> Status Setoran</h4>
                        <div class="status-badge" id="statusBadge">Belum Setor</div>
                    </div>
                    <div class="status-grid">
                        <div class="status-item">
                            <div class="status-label">Metode</div>
                            <div class="status-value" id="statusMetode">-</div>
                        </div>
                        <div class="status-item">
                            <div class="status-label">Tanggal Setoran</div>
                            <div class="status-value" id="statusTanggalSetoran">-</div>
                        </div>
                        <div class="status-item">
                            <div class="status-label">Total Setoran</div>
                            <div class="status-value" id="statusTotalSetoran">-</div>
                        </div>
                        <div class="status-item">
                            <div class="status-label">Sisa Setoran</div>
                            <div class="status-value" id="statusSisaSetoran">-</div>
                        </div>
                    </div>
                </div>
                
                <!-- Tombol Setoran -->
                <div class="setoran-actions">
                    <button id="setorBtn" class="btn-setor" disabled>
                        <i class="fas fa-money-bill-wave"></i> SETOR
                    </button>
                    <button id="verifikasiSetoranBtn" class="btn-verifikasi" style="display: ${isOwnerKas ? 'inline-flex' : 'none'};">
                        <i class="fas fa-check-circle"></i> VERIFIKASI SETORAN
                    </button>
                </div>
            </section>
            
            <!-- Filter Tanggal Input Data -->
            <section class="filter-section">
                <h3><i class="fas fa-calendar-alt"></i> Filter Tanggal Input Data</h3>
                <div class="filter-content">
                    <div class="date-input-group">
                        <label for="kasFilterTanggal">Tanggal:</label>
                        <input type="date" id="kasFilterTanggal" class="date-input">
                        <div class="date-display" id="kasTanggalDisplay"></div>
                    </div>
                </div>
            </section>
            
            <!-- Input Pemasukan & Pengeluaran -->
            <div class="input-grid">
                <!-- Pemasukan -->
                <section class="pemasukan-section">
                    <div class="section-header">
                        <h3><i class="fas fa-arrow-down text-green-600"></i> Pemasukan</h3>
                        <button id="tambahPemasukan" class="btn-tambah" disabled>
                            <i class="fas fa-plus"></i> Tambah
                        </button>
                    </div>
                    
                    <div id="pemasukanContainer" class="input-container">
                        <p class="empty-message">Pilih tanggal terlebih dahulu</p>
                    </div>
                    
                    <div class="total-section">
                        <div class="total-label">TOTAL Pemasukan</div>
                        <div class="total-value" id="totalPemasukan">0</div>
                    </div>
                </section>
                
                <!-- Pengeluaran -->
                <section class="pengeluaran-section">
                    <div class="section-header">
                        <h3><i class="fas fa-arrow-up text-red-600"></i> Pengeluaran</h3>
                        <button id="tambahPengeluaran" class="btn-tambah" disabled>
                            <i class="fas fa-plus"></i> Tambah
                        </button>
                    </div>
                    
                    <div id="pengeluaranContainer" class="input-container">
                        <p class="empty-message">Pilih tanggal terlebih dahulu</p>
                    </div>
                    
                    <div class="total-section">
                        <div class="total-label">TOTAL Pengeluaran</div>
                        <div class="total-value" id="totalPengeluaran">0</div>
                    </div>
                </section>
            </div>
            
            <!-- Tombol Submit -->
            <div class="submit-section">
                <button id="kasSubmitBtn" class="btn-submit" disabled>
                    <i class="fas fa-paper-plane"></i> SUBMIT
                </button>
            </div>
        </div>
        
        <!-- Modal Setoran -->
        <div id="setoranModal" class="modal-overlay hidden">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-money-bill-wave"></i> Form Setoran</h3>
                    <button id="closeKasModal" class="modal-close">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="modal-info-grid">
                        <div class="modal-info-item">
                            <div class="modal-label">Outlet</div>
                            <div class="modal-value" id="modalOutletKas">-</div>
                        </div>
                        <div class="modal-info-item">
                            <div class="modal-label">Kasir</div>
                            <div class="modal-value" id="modalKasirKas">-</div>
                        </div>
                        <div class="modal-info-item">
                            <div class="modal-label">Periode</div>
                            <div class="modal-value" id="modalPeriodeKas">-</div>
                        </div>
                        <div class="modal-info-item">
                            <div class="modal-label">Total Kewajiban</div>
                            <div class="modal-value" id="modalKewajibanKas">-</div>
                        </div>
                    </div>
                    
                    <div class="modal-form">
                        <div class="form-group">
                            <label for="totalSetoranInput"><i class="fas fa-coins"></i> Total Setoran *</label>
                            <input type="number" id="totalSetoranInput" class="form-input" placeholder="Masukkan jumlah setoran">
                        </div>
                        
                        <div class="form-group">
                            <label for="metodeSetoranKas"><i class="fas fa-credit-card"></i> Metode Setoran *</label>
                            <select id="metodeSetoranKas" class="form-select">
                                <option value="">Pilih Metode</option>
                                <option value="Transfer BSI">Transfer BSI</option>
                                <option value="Transfer DANA">Transfer DANA</option>
                                <option value="Cash">Cash</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="buktiSetoranKas"><i class="fas fa-file-image"></i> Bukti Setoran (Opsional)</label>
                            <input type="file" id="buktiSetoranKas" class="form-input" accept="image/*">
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button id="submitSetoranBtnKas" class="btn-modal-submit">
                        <i class="fas fa-save"></i> SUBMIT SETORAN
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Loading Overlay -->
        <div id="kasLoadingOverlay" class="loading-overlay hidden">
            <div class="loading-content">
                <div class="spinner"></div>
                <p>Memuat data...</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(kasPage);
    setupKasPageEvents();
}

// [3] Setup event listeners untuk halaman kas - DITAMBAHKAN EVENT DELEGATION
function setupKasPageEvents() {
    // Tombol kembali
    document.getElementById('backToMainFromKas').addEventListener('click', () => {
        document.getElementById('kasPage').remove();
        document.getElementById('appScreen').style.display = 'block';
    });
    
    // Tombol refresh
    document.getElementById('refreshKas').addEventListener('click', async () => {
        await loadKasData();
    });
    
    // Filter outlet change (hanya untuk owner)
    const outletFilter = document.getElementById('outletFilterSelect');
    if (outletFilter) {
        outletFilter.addEventListener('change', async function() {
            kasState.selectedOutlet = this.value || null;
            document.getElementById('outletInfoDisplay').textContent = 
                kasState.selectedOutlet ? `Outlet: ${kasState.selectedOutlet}` : 'Semua Outlet';
            await loadKasData();
        });
    }
    
    // Periode change
    document.getElementById('kasPeriodeSelect').addEventListener('change', async function() {
        const selectedIndex = this.value;
        kasState.selectedPeriod = kasState.availablePeriods[selectedIndex];
        await loadRingkasanKas();
        await loadSetoranStatus();
    });
    
    // Filter tanggal change
    document.getElementById('kasFilterTanggal').addEventListener('change', async function() {
        kasState.selectedTanggal = this.value;
        const selectedDate = new Date(this.value);
        updateKasTanggalDisplay(selectedDate);
        
        // Load data auto-generate untuk tanggal ini
        await loadAutoGenerateData(kasState.selectedTanggal);
        
        // Load existing data
        await loadExistingKasData();
    });
    
    // Tambah pemasukan
    document.getElementById('tambahPemasukan').addEventListener('click', addPemasukanItem);
    
    // Tambah pengeluaran
    document.getElementById('tambahPengeluaran').addEventListener('click', addPengeluaranItem);
    
    // Submit data
    document.getElementById('kasSubmitBtn').addEventListener('click', submitKasData);
    
    // Setor button
    document.getElementById('setorBtn').addEventListener('click', openKasSetoranModal);
    
    // Verifikasi setoran button
    const verifikasiBtn = document.getElementById('verifikasiSetoranBtn');
    if (verifikasiBtn) {
        verifikasiBtn.addEventListener('click', verifikasiKasSetoran);
    }
    
    // Modal events
    document.getElementById('closeKasModal').addEventListener('click', closeKasSetoranModal);
    document.getElementById('submitSetoranBtnKas').addEventListener('click', submitKasSetoran);
    
    // PWA Install Button (jika ada)
    const installButton = document.getElementById('installButton');
    if (installButton) {
        installButton.addEventListener('click', () => {
            if (window.deferredPrompt) {
                window.deferredPrompt.prompt();
            }
        });
    }
    
    // ========== ✅ EVENT DELEGATION UNTUK PEMASUKAN ==========
    
    // Event delegation untuk change (select dan text input)
    document.addEventListener('change', function(e) {
        // Cek jika event berasal dari container pemasukan
        if (e.target.closest('#pemasukanItemsList')) {
            const target = e.target;
            const indexAttr = target.getAttribute('data-index');
            const typeAttr = target.getAttribute('data-type');
            
            if (!indexAttr || !typeAttr) return;
            
            const index = parseInt(indexAttr);
            
            // Cegah update untuk auto-generate
            if (kasState.pemasukanItems[index]?.isAutoGenerate) {
                return;
            }
            
            let value;
            if (typeAttr === 'jumlah') {
                value = parseInt(target.value) || 0;
            } else if (typeAttr === 'jenis') {
                value = target.value;
                // Jika jenis berubah, reset note jika bukan pemasukan lain-lain
                if (value !== 'Pemasukan Lain Lain') {
                    kasState.pemasukanItems[index].note = '';
                }
            } else {
                value = target.value;
            }
            
            kasState.pemasukanItems[index][typeAttr] = value;
            
            // Re-render jika jenis berubah untuk menampilkan/sembunyikan note
            if (typeAttr === 'jenis') {
                renderPemasukanItems();
            }
            
            updateKasTotals();
            updateKasButtonStates();
        }
        
        // Cek jika event berasal dari container pengeluaran
        if (e.target.closest('#pengeluaranItemsList')) {
            const target = e.target;
            const indexAttr = target.getAttribute('data-index');
            const typeAttr = target.getAttribute('data-type');
            
            if (!indexAttr || !typeAttr) return;
            
            const index = parseInt(indexAttr);
            
            // Cegah update untuk auto-generate
            if (kasState.pengeluaranItems[index]?.isAutoGenerate) {
                return;
            }
            
            let value;
            if (typeAttr === 'jumlah') {
                value = parseInt(target.value) || 0;
            } else if (typeAttr === 'jenis') {
                value = target.value;
                // Jika jenis berubah, reset note jika bukan pengeluaran lain-lain
                if (value !== 'Pengeluaran Lain Lain') {
                    kasState.pengeluaranItems[index].note = '';
                }
            } else {
                value = target.value;
            }
            
            kasState.pengeluaranItems[index][typeAttr] = value;
            
            // Re-render jika jenis berubah untuk menampilkan/sembunyikan note
            if (typeAttr === 'jenis') {
                renderPengeluaranItems();
            }
            
            updateKasTotals();
            updateKasButtonStates();
        }
    });
    
    // Event delegation untuk input real-time (hanya number input)
    document.addEventListener('input', function(e) {
        // Untuk pemasukan
        if (e.target.closest('#pemasukanItemsList') && 
            e.target.classList.contains('item-input') && 
            e.target.type === 'number') {
            
            const target = e.target;
            const indexAttr = target.getAttribute('data-index');
            const typeAttr = target.getAttribute('data-type');
            
            if (!indexAttr || !typeAttr) return;
            
            const index = parseInt(indexAttr);
            
            if (kasState.pemasukanItems[index]?.isAutoGenerate) {
                return;
            }
            
            const value = parseInt(target.value) || 0;
            kasState.pemasukanItems[index][typeAttr] = value;
            
            updateKasTotals();
            updateKasButtonStates();
        }
        
        // Untuk pengeluaran
        if (e.target.closest('#pengeluaranItemsList') && 
            e.target.classList.contains('item-input') && 
            e.target.type === 'number') {
            
            const target = e.target;
            const indexAttr = target.getAttribute('data-index');
            const typeAttr = target.getAttribute('data-type');
            
            if (!indexAttr || !typeAttr) return;
            
            const index = parseInt(indexAttr);
            
            if (kasState.pengeluaranItems[index]?.isAutoGenerate) {
                return;
            }
            
            const value = parseInt(target.value) || 0;
            kasState.pengeluaranItems[index][typeAttr] = value;
            
            updateKasTotals();
            updateKasButtonStates();
        }
    });
    
    // Event delegation untuk tombol delete
    document.addEventListener('click', function(e) {
        // Untuk delete pemasukan
        if (e.target.closest('#pemasukanItemsList')) {
            const deleteBtn = e.target.classList.contains('item-delete') ? 
                e.target : e.target.closest('.item-delete');
            
            if (deleteBtn && deleteBtn.classList.contains('item-delete')) {
                e.preventDefault();
                
                const index = parseInt(deleteBtn.getAttribute('data-index'));
                
                // Validasi index dan cegah hapus auto-generate
                if (isNaN(index) || kasState.pemasukanItems[index]?.isAutoGenerate) {
                    return;
                }
                
                // Hapus item
                kasState.pemasukanItems.splice(index, 1);
                renderPemasukanItems();
                updateKasTotals();
                updateKasButtonStates();
            }
        }
        
        // Untuk delete pengeluaran
        if (e.target.closest('#pengeluaranItemsList')) {
            const deleteBtn = e.target.classList.contains('item-delete') ? 
                e.target : e.target.closest('.item-delete');
            
            if (deleteBtn && deleteBtn.classList.contains('item-delete')) {
                e.preventDefault();
                
                const index = parseInt(deleteBtn.getAttribute('data-index'));
                
                // Validasi index dan cegah hapus auto-generate
                if (isNaN(index) || kasState.pengeluaranItems[index]?.isAutoGenerate) {
                    return;
                }
                
                // Hapus item
                kasState.pengeluaranItems.splice(index, 1);
                renderPengeluaranItems();
                updateKasTotals();
                updateKasButtonStates();
            }
        }
    });
}
// [4] Generate periode options (Selasa-Senin)
function generateKasPeriodOptions() {
    const periodeSelect = document.getElementById('kasPeriodeSelect');
    periodeSelect.innerHTML = '';
    
    const periods = [];
    const today = new Date();
    
    // LOGIKA SAMA PERSIS dengan index.html
    for (let i = 0; i < 5; i++) {
        const period = getKasPeriodByOffset(i);
        periods.push(period);
        
        const option = document.createElement('option');
        option.value = i;
        
        // FORMAT SAMA dengan index.html: "Selasa 9/Des/2025 - Senin 15/Des/2025"
        const label = formatKasPeriodDisplay(period);
        option.textContent = label;
        
        // Data attributes SAMA dengan index.html
        option.dataset.start = period.start;
        option.dataset.end = period.end;
        option.dataset.display = period.display;
        
        periodeSelect.appendChild(option);
    }
    
    kasState.availablePeriods = periods;
    
    // Default pilih periode pertama SAMA dengan index.html
    kasState.selectedPeriod = periods[0];
    periodeSelect.value = "0";
    
    console.log('📅 Periode options generated:', periods);
}

// [COPY DARI index.html] - Format display periode
function formatKasPeriodDisplay(period) {
    // FORMAT SAMA dengan index.html: "Selasa 9/Des/2025 - Senin 15/Des/2025"
    const startDate = new Date(period.start);
    const endDate = new Date(period.end);
    
    const startDay = startDate.toLocaleDateString('id-ID', { weekday: 'long' });
    const startDateStr = formatKasDateDisplay(startDate);
    const endDay = endDate.toLocaleDateString('id-ID', { weekday: 'long' });
    const endDateStr = formatKasDateDisplay(endDate);
    
    return `${startDay} ${startDateStr} - ${endDay} ${endDateStr}`;
}

// [COPY DARI index.html] - Format tanggal display
function formatKasDateDisplay(date) {
    // FORMAT SAMA dengan index.html: "9/Des/2025"
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// [5] Helper: Get periode berdasarkan offset
function getKasPeriodByOffset(offset) {
    const today = new Date();
    const targetDate = new Date();
    targetDate.setDate(today.getDate() - (offset * 7)); // Mundur per minggu
    
    return calculateKasPeriodForDate(targetDate);
}

// [6] Helper: Hitung periode Selasa-Senin untuk tanggal tertentu
function calculateKasPeriodForDate(date) {
    const currentDate = new Date(date);
    const dayOfWeek = currentDate.getDay(); // 0=Minggu, 1=Senin, ..., 6=Sabtu
    
    // Cari Selasa terdekat (mundur)
    let tuesday = new Date(currentDate);
    let daysToTuesday = (dayOfWeek + 5) % 7; // Hitung hari mundur ke Selasa
    if (daysToTuesday === 0 && dayOfWeek !== 2) daysToTuesday = 7;
    tuesday.setDate(currentDate.getDate() - daysToTuesday);
    
    // Cari Senin terdekat (maju)
    let monday = new Date(tuesday);
    monday.setDate(tuesday.getDate() + 6);
    
    return {
        start: formatKasDate(tuesday),
        end: formatKasDate(monday),
        display: `${formatKasDateID(tuesday)} - ${formatKasDateID(monday)}`
    };
}

// [8] Setup tanggal input
function setupKasTanggalInput() {
    const filterTanggal = document.getElementById('kasFilterTanggal');
    const today = new Date();
    const todayStr = formatKasDate(today);
    
    // Set default ke hari ini
    filterTanggal.value = todayStr;
    kasState.selectedTanggal = todayStr;
    
    // Update display tanggal
    updateKasTanggalDisplay(today);
    
    // Set min dan max date
    const minDate = new Date();
    minDate.setDate(today.getDate() - 30); // 30 hari kebelakang
    filterTanggal.min = formatKasDate(minDate);
    filterTanggal.max = formatKasDate(today);
}

// [9] Update display tanggal
function updateKasTanggalDisplay(date) {
    const displayElement = document.getElementById('kasTanggalDisplay');
    const dateStr = formatKasDateDisplay(date);
    displayElement.textContent = dateStr;
}

// [10] Load data kas
async function loadKasData() {
    try {
        showKasLoading(true);
        
        // Load ringkasan KAS untuk periode terpilih
        await loadRingkasanKas();
        
        // Load status setoran
        await loadSetoranStatus();
        
        // Untuk non-owner atau owner yang pilih outlet tertentu, load data input
        if (!isOwnerKas || kasState.selectedOutlet) {
            // Load auto-generate data untuk tanggal terpilih
            await loadAutoGenerateData(kasState.selectedTanggal);
            
            // Load existing data
            await loadExistingKasData();
        } else {
            // Owner melihat semua outlet, disable input form
            resetKasInputForms();
            document.getElementById('tambahPemasukan').disabled = true;
            document.getElementById('tambahPengeluaran').disabled = true;
            document.getElementById('kasSubmitBtn').disabled = true;
            document.getElementById('kasSubmitBtn').innerHTML = '<i class="fas fa-eye"></i> VIEW MODE';
        }
        
        // Update button states
        updateKasButtonStates();
        
    } catch (error) {
        console.error('Error loading kas data:', error);
        showKasNotification('Gagal memuat data KAS: ' + error.message, 'error');
    } finally {
        showKasLoading(false);
    }
}

// [11] Load ringkasan KAS - DIMODIFIKASI untuk support filter outlet
async function loadRingkasanKas() {
    try {
        if (!kasState.selectedPeriod) {
            return;
        }
        
        // Tentukan outlet untuk query
        let outletQuery = '';
        if (isOwnerKas) {
            // Owner: jika pilih outlet tertentu, query outlet itu saja
            // Jika pilih "Semua Outlet", query semua outlet
            outletQuery = kasState.selectedOutlet ? 
                supabase.from('kas').select('*').eq('outlet', kasState.selectedOutlet) :
                supabase.from('kas').select('*');
        } else {
            // Non-owner: query outlet sendiri
            outletQuery = supabase
                .from('kas')
                .select('*')
                .eq('outlet', currentUserOutletKas);
        }
        
        console.log('Loading ringkasan KAS:', {
            isOwner: isOwnerKas,
            selectedOutlet: kasState.selectedOutlet,
            userOutlet: currentUserOutletKas,
            periode: kasState.selectedPeriod.display
        });

        // Load data KAS untuk periode yang dipilih
        let query = outletQuery
            .gte('tanggal', kasState.selectedPeriod.start)
            .lte('tanggal', kasState.selectedPeriod.end)
            .order('tanggal', { ascending: true });

        const { data, error } = await query;

        if (error) {
            console.error('Error loading KAS data:', error);
            throw error;
        }

        kasState.currentKasData = data || [];
        console.log('Data KAS ditemukan:', kasState.currentKasData.length, 'records');

        renderRingkasanKas();
        
    } catch (error) {
        console.error('Error loading kas ringkasan:', error);
        document.getElementById('ringkasanContainer').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error memuat data ringkasan KAS</p>
            </div>
        `;
    }
}

// [12] Render ringkasan KAS - DIMODIFIKASI untuk multi-outlet
function renderRingkasanKas() {
    const container = document.getElementById('ringkasanContainer');
    
    if (kasState.currentKasData.length === 0) {
        container.innerHTML = `
            <div class="periode-info">
                <p class="periode-title">Periode: ${kasState.selectedPeriod.display}</p>
                <p class="periode-dates">${kasState.selectedPeriod.start} sampai ${kasState.selectedPeriod.end}</p>
                ${isOwnerKas && !kasState.selectedOutlet ? '<p class="periode-subtitle">Semua Outlet</p>' : ''}
            </div>
            <div class="empty-message">
                <i class="fas fa-database"></i>
                <p>Tidak ada data KAS untuk periode ini</p>
            </div>
        `;
        return;
    }
    
    // Group by outlet jika owner melihat semua outlet
    let dataToRender = kasState.currentKasData;
    let outletGroups = {};
    
    if (isOwnerKas && !kasState.selectedOutlet) {
        // Group data by outlet
        kasState.currentKasData.forEach(row => {
            if (!outletGroups[row.outlet]) {
                outletGroups[row.outlet] = [];
            }
            outletGroups[row.outlet].push(row);
        });
    }
    
    let html = `
        <div class="periode-info">
            <p class="periode-title">Periode: ${kasState.selectedPeriod.display}</p>
            <p class="periode-dates">${kasState.selectedPeriod.start} sampai ${kasState.selectedPeriod.end}</p>
            ${isOwnerKas && !kasState.selectedOutlet ? 
                `<p class="periode-subtitle">Semua Outlet (${Object.keys(outletGroups).length} outlet)</p>` : 
                isOwnerKas && kasState.selectedOutlet ? 
                `<p class="periode-subtitle">Outlet: ${kasState.selectedOutlet}</p>` : ''}
        </div>
    `;
    
    if (isOwnerKas && !kasState.selectedOutlet) {
        // Render grouped by outlet
        let allTotalPemasukan = 0;
        let allTotalPengeluaran = 0;
        let allTotalSaldo = 0;
        
        for (const [outletName, outletData] of Object.entries(outletGroups)) {
            let outletPemasukan = 0;
            let outletPengeluaran = 0;
            let outletSaldo = 0;
            
            html += `
                <div class="outlet-group">
                    <div class="outlet-header">
                        <i class="fas fa-store"></i>
                        <h4>${outletName}</h4>
                    </div>
                    <div class="table-container">
                        <table class="ringkasan-table">
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Hari</th>
                                    <th>Kasir</th>
                                    <th>Pemasukan</th>
                                    <th>Pengeluaran</th>
                                    <th>Saldo</th>
                                </tr>
                            </thead>
                            <tbody>
            `;
            
            outletData.forEach(row => {
                const pemasukan = parseInt(row.pemasukan) || 0;
                const pengeluaran = parseInt(row.pengeluaran) || 0;
                const saldo = parseInt(row.saldo) || 0;
                
                outletPemasukan += pemasukan;
                outletPengeluaran += pengeluaran;
                outletSaldo += saldo;
                
                const saldoClass = saldo < 0 ? 'text-danger' : 'text-success';
                
                html += `
                    <tr>
                        <td>${formatKasDisplayDate(row.tanggal)}</td>
                        <td>${row.hari || '-'}</td>
                        <td class="kasir-column">${row.kasir || '-'}</td>
                        <td class="text-right">${formatKasCurrency(pemasukan)}</td>
                        <td class="text-right">${formatKasCurrency(pengeluaran)}</td>
                        <td class="text-right ${saldoClass}">${formatKasCurrency(saldo)}</td>
                    </tr>
                `;
            });
            
            const outletTotalSaldoClass = outletSaldo < 0 ? 'text-danger font-bold' : 'text-success font-bold';
            
            html += `
                            <tr class="outlet-total-row">
                                <td colspan="3" class="text-right"><strong>TOTAL ${outletName}</strong></td>
                                <td class="text-right"><strong>${formatKasCurrency(outletPemasukan)}</strong></td>
                                <td class="text-right"><strong>${formatKasCurrency(outletPengeluaran)}</strong></td>
                                <td class="text-right ${outletTotalSaldoClass}"><strong>${formatKasCurrency(outletSaldo)}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            `;
            
            allTotalPemasukan += outletPemasukan;
            allTotalPengeluaran += outletPengeluaran;
            allTotalSaldo += outletSaldo;
        }
        
        // Total semua outlet
        const allTotalSaldoClass = allTotalSaldo < 0 ? 'text-danger font-bold' : 'text-success font-bold';
        html += `
            <div class="all-outlets-total">
                <h4><i class="fas fa-chart-pie"></i> TOTAL SEMUA OUTLET</h4>
                <div class="total-grid">
                    <div class="total-item">
                        <div class="total-label">Total Pemasukan</div>
                        <div class="total-value">${formatKasCurrency(allTotalPemasukan)}</div>
                    </div>
                    <div class="total-item">
                        <div class="total-label">Total Pengeluaran</div>
                        <div class="total-value">${formatKasCurrency(allTotalPengeluaran)}</div>
                    </div>
                    <div class="total-item">
                        <div class="total-label">Total Saldo</div>
                        <div class="total-value ${allTotalSaldoClass}">${formatKasCurrency(allTotalSaldo)}</div>
                    </div>
                </div>
            </div>
        `;
        
    } else {
        // Render single outlet (owner pilih outlet tertentu atau non-owner)
        let totalPemasukan = 0;
        let totalPengeluaran = 0;
        let totalSaldo = 0;
        
        html += `
            <div class="table-container">
                <table class="ringkasan-table">
                    <thead>
                        <tr>
                            <th>Tanggal</th>
                            <th>Hari</th>
                            <th>Outlet</th>
                            <th>Kasir</th>
                            <th>Pemasukan</th>
                            <th>Pengeluaran</th>
                            <th>Saldo</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        dataToRender.forEach(row => {
            const pemasukan = parseInt(row.pemasukan) || 0;
            const pengeluaran = parseInt(row.pengeluaran) || 0;
            const saldo = parseInt(row.saldo) || 0;
            
            totalPemasukan += pemasukan;
            totalPengeluaran += pengeluaran;
            totalSaldo += saldo;
            
            const saldoClass = saldo < 0 ? 'text-danger' : 'text-success';
            
            html += `
                <tr>
                    <td>${formatKasDisplayDate(row.tanggal)}</td>
                    <td>${row.hari || '-'}</td>
                    <td>${row.outlet || '-'}</td>
                    <td class="kasir-column">${row.kasir || '-'}</td>
                    <td class="text-right">${formatKasCurrency(pemasukan)}</td>
                    <td class="text-right">${formatKasCurrency(pengeluaran)}</td>
                    <td class="text-right ${saldoClass}">${formatKasCurrency(saldo)}</td>
                </tr>
            `;
        });
        
        const totalSaldoClass = totalSaldo < 0 ? 'text-danger font-bold' : 'text-success font-bold';
        
        html += `
                        <tr class="total-row">
                            <td colspan="4" class="text-right"><strong>TOTAL</strong></td>
                            <td class="text-right"><strong>${formatKasCurrency(totalPemasukan)}</strong></td>
                            <td class="text-right"><strong>${formatKasCurrency(totalPengeluaran)}</strong></td>
                            <td class="text-right ${totalSaldoClass}"><strong>${formatKasCurrency(totalSaldo)}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    // Enable/disable setor button (hanya untuk single outlet mode)
    if (!isOwnerKas || kasState.selectedOutlet) {
        const totalSaldo = dataToRender.reduce((sum, row) => {
            return sum + (parseInt(row.saldo) || 0);
        }, 0);
        
        const setorBtn = document.getElementById('setorBtn');
        setorBtn.disabled = totalSaldo <= 0 || !isFormValidKas();
    } else {
        // Owner melihat semua outlet, disable setor button
        document.getElementById('setorBtn').disabled = true;
        document.getElementById('setorBtn').innerHTML = '<i class="fas fa-eye"></i> VIEW MODE';
    }
}

// [13] Load data auto-generate dari berbagai tabel - VERSI SIMPLIFIED
async function loadAutoGenerateData(tanggal) {
    const outlet = kasState.selectedOutlet || currentUserOutletKas;
    if (!outlet || !tanggal) {
        kasState.autoGenerateData = {};
        return;
    }
    
    const data = {
        sisa_setoran: 0,
        omset_cash: 0,
        komisi: 0,
        uop: 0,
        tips_qris: 0
    };
    
    try {
        console.log('🔍 Loading auto-generate data untuk outlet:', outlet, 'tanggal:', tanggal);
        
        // 1. SISA SETORAN
        try {
            const { data: setoranData } = await supabase
                .from('setoran')
                .select('sisa_setoran')
                .eq('outlet', outlet)
                .eq('tanggal_setoran', tanggal)
                .single();
            
            if (setoranData) {
                data.sisa_setoran = parseInt(setoranData.sisa_setoran) || 0;
            }
        } catch (e) { console.warn('Sisa setoran:', e.message); }
        
        // 2. OMSET CASH
        try {
            const { data: transaksiData } = await supabase
                .from('transaksi_order')
                .select('total_amount')
                .eq('outlet', outlet)
                .eq('order_date', tanggal)
                .eq('status', 'completed')
                .eq('payment_type', 'cash');
            
            if (transaksiData && transaksiData.length > 0) {
                data.omset_cash = transaksiData.reduce((sum, item) => 
                    sum + (parseFloat(item.total_amount) || 0), 0);
            }
        } catch (e) { console.warn('Omset cash:', e.message); }
        
        // 3. KOMISI DAN TIPS QRIS (semua karyawan)
        try {
            const { data: komisiData } = await supabase
                .from('komisi')
                .select('komisi, tips_qris')
                .eq('outlet', outlet)
                .eq('tanggal', tanggal);
            
            if (komisiData && komisiData.length > 0) {
                data.komisi = komisiData.reduce((sum, item) => 
                    sum + (parseFloat(item.komisi) || 0), 0);
                data.tips_qris = komisiData.reduce((sum, item) => 
                    sum + (parseFloat(item.tips_qris) || 0), 0);
            }
        } catch (e) { console.warn('Komisi:', e.message); }
        
        // 4. UOP HANYA UNTUK BARBERMAN
        try {
            // Step 1: Dapatkan semua barberman
            const { data: barbermanData } = await supabase
                .from('karyawan')
                .select('nama_karyawan')
                .eq('outlet', outlet)
                .eq('role', 'barberman');
            
            if (barbermanData && barbermanData.length > 0) {
                const barbermanNames = barbermanData.map(b => b.nama_karyawan);
                
                // Step 2: Ambil UOP untuk barberman saja
                const { data: uopData } = await supabase
                    .from('komisi')
                    .select('uop, serve_by')
                    .eq('outlet', outlet)
                    .eq('tanggal', tanggal)
                    .not('uop', 'is', null);
                
                if (uopData && uopData.length > 0) {
                    // Filter berdasarkan serve_by yang ada di daftar barberman
                    const filteredUop = uopData.filter(item => 
                        item.serve_by && barbermanNames.includes(item.serve_by)
                    );
                    
                    if (filteredUop.length > 0) {
                        data.uop = filteredUop.reduce((sum, item) => 
                            sum + (parseFloat(item.uop) || 0), 0);
                    }
                }
            }
        } catch (e) { 
            console.warn('UOP:', e.message); 
            data.uop = 0; // Pastikan 0 jika error
        }
        
        console.log('✅ Auto-generate data loaded:', data);
        kasState.autoGenerateData = data;
        
    } catch (error) {
        console.error('❌ Error loading auto-generate data:', error);
        kasState.autoGenerateData = {
            sisa_setoran: 0,
            omset_cash: 0,
            komisi: 0,
            uop: 0,
            tips_qris: 0
        };
    }
}
// [14] Load existing data untuk tanggal terpilih
async function loadExistingKasData() {
    const outlet = kasState.selectedOutlet || currentUserOutletKas;
    if (!outlet || !kasState.selectedTanggal) {
        kasState.existingKasData = null;
        resetKasInputForms();
        return;
    }

    try {
        const { data, error } = await supabase
            .from('kas')
            .select('*')
            .eq('outlet', outlet)
            .eq('tanggal', kasState.selectedTanggal)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            console.warn('⚠️ Error loading kas data:', error);
            await tryAlternativeKasQuery(outlet);
            return;
        }

        kasState.existingKasData = data || null;
        
        if (data) {
            console.log('✅ Existing KAS data ditemukan:', data);
            showExistingKasData(data);
            document.getElementById('kasSubmitBtn').disabled = true;
            document.getElementById('kasSubmitBtn').innerHTML = '<i class="fas fa-check"></i> DATA SUDAH ADA';
        } else {
            console.log('ℹ️ Tidak ada existing KAS data');
            resetKasInputForms();
            document.getElementById('kasSubmitBtn').disabled = !isFormValidKas();
            document.getElementById('kasSubmitBtn').innerHTML = '<i class="fas fa-paper-plane"></i> SUBMIT';
        }

    } catch (error) {
        console.error('❌ Exception loading existing kas data:', error);
        kasState.existingKasData = null;
        resetKasInputForms();
    }
}

// [FUNGSI BARU] Coba query alternatif untuk KAS
async function tryAlternativeKasQuery(outlet) {
    try {
        // Cari data KAS tanpa filter tanggal exact
        const { data, error } = await supabase
            .from('kas')
            .select('*')
            .eq('outlet', outlet)
            .order('tanggal', { ascending: false })
            .limit(5);
        
        if (!error && data && data.length > 0) {
            console.log('📋 Data KAS terbaru:', data);
            // Cari yang mendekati tanggal
            const targetDate = new Date(kasState.selectedTanggal);
            const matched = data.find(item => {
                const itemDate = new Date(item.tanggal);
                return itemDate.toDateString() === targetDate.toDateString();
            });
            
            if (matched) {
                console.log('✅ KAS data matching ditemukan:', matched);
                kasState.existingKasData = matched;
                showExistingKasData(matched);
                document.getElementById('kasSubmitBtn').disabled = true;
                document.getElementById('kasSubmitBtn').innerHTML = '<i class="fas fa-check"></i> DATA SUDAH ADA';
            }
        }
    } catch (e) {
        console.error('Error dalam alternative KAS query:', e);
    }
}

// [15] Tampilkan data existing ke form
function showExistingKasData(data) {
    resetKasInputForms();
    
    // Process pemasukan dari data existing
    if (data.omset_cash > 0) {
        kasState.pemasukanItems.push({ 
            jenis: 'Omset Cash', 
            jumlah: data.omset_cash, 
            note: '',
            isAutoGenerate: true 
        });
    }
    if (data.top_up_kas > 0) {
        kasState.pemasukanItems.push({ 
            jenis: 'Top Up Kas', 
            jumlah: data.top_up_kas, 
            note: '' 
        });
    }
    if (data.sisa_setoran > 0) {
        kasState.pemasukanItems.push({ 
            jenis: 'Sisa Setoran', 
            jumlah: data.sisa_setoran, 
            note: '',
            isAutoGenerate: true 
        });
    }
    if (data.hutang_komisi > 0) {
        kasState.pemasukanItems.push({ 
            jenis: 'Hutang Komisi', 
            jumlah: data.hutang_komisi, 
            note: '' 
        });
    }
    if (data.pemasukan_lain_lain > 0) {
        kasState.pemasukanItems.push({ 
            jenis: 'Pemasukan Lain Lain', 
            jumlah: data.pemasukan_lain_lain, 
            note: data.note_pemasukan_lain || '' 
        });
    }
    
    // Process pengeluaran dari data existing
    if (data.komisi > 0) {
        kasState.pengeluaranItems.push({ 
            jenis: 'Komisi', 
            jumlah: data.komisi, 
            note: '',
            isAutoGenerate: true 
        });
    }
    if (data.uop > 0) {
        kasState.pengeluaranItems.push({ 
            jenis: 'UoP', 
            jumlah: data.uop, 
            note: '',
            isAutoGenerate: true 
        });
    }
    if (data.tips_qris > 0) {
        kasState.pengeluaranItems.push({ 
            jenis: 'Tips QRIS', 
            jumlah: data.tips_qris, 
            note: '',
            isAutoGenerate: true 
        });
    }
    if (data.bayar_hutang_komisi > 0) {
        kasState.pengeluaranItems.push({ 
            jenis: 'Bayar Hutang komisi', 
            jumlah: data.bayar_hutang_komisi, 
            note: '' 
        });
    }
    if (data.iuran_rt > 0) {
        kasState.pengeluaranItems.push({ 
            jenis: 'Iuran RT', 
            jumlah: data.iuran_rt, 
            note: '' 
        });
    }
    if (data.sumbangan > 0) {
        kasState.pengeluaranItems.push({ 
            jenis: 'Sumbangan', 
            jumlah: data.sumbangan, 
            note: '' 
        });
    }
    if (data.iuran_sampah > 0) {
        kasState.pengeluaranItems.push({ 
            jenis: 'Iuran Sampah', 
            jumlah: data.iuran_sampah, 
            note: '' 
        });
    }
    if (data.galon > 0) {
        kasState.pengeluaranItems.push({ 
            jenis: 'Galon', 
            jumlah: data.galon, 
            note: '' 
        });
    }
    if (data.biaya_admin_setoran > 0) {
        kasState.pengeluaranItems.push({ 
            jenis: 'Biaya Admin Setoran', 
            jumlah: data.biaya_admin_setoran, 
            note: '' 
        });
    }
    if (data.yakult > 0) {
        kasState.pengeluaranItems.push({ 
            jenis: 'Yakult', 
            jumlah: data.yakult, 
            note: '' 
        });
    }
    if (data.pengeluaran_lain_lain > 0) {
        kasState.pengeluaranItems.push({ 
            jenis: 'Pengeluaran Lain Lain', 
            jumlah: data.pengeluaran_lain_lain, 
            note: data.note_pengeluaran_lain || '' 
        });
    }
    
    renderPemasukanItems();
    renderPengeluaranItems();
    updateKasTotals();
    
    document.getElementById('tambahPemasukan').disabled = true;
    document.getElementById('tambahPengeluaran').disabled = true;
}

// [16] Reset form input
function resetKasInputForms() {
    kasState.pemasukanItems = [];
    kasState.pengeluaranItems = [];
    
    // Add auto-generate items jika ada data
    if (kasState.autoGenerateData) {
        // Pemasukan auto-generate
        if (kasState.autoGenerateData.sisa_setoran > 0) {
            kasState.pemasukanItems.push({
                jenis: 'Sisa Setoran',
                jumlah: kasState.autoGenerateData.sisa_setoran,
                note: '',
                isAutoGenerate: true
            });
        }
        
        if (kasState.autoGenerateData.omset_cash > 0) {
            kasState.pemasukanItems.push({
                jenis: 'Omset Cash',
                jumlah: kasState.autoGenerateData.omset_cash,
                note: '',
                isAutoGenerate: true
            });
        }
        
        // Pengeluaran auto-generate
        if (kasState.autoGenerateData.komisi > 0) {
            kasState.pengeluaranItems.push({
                jenis: 'Komisi',
                jumlah: kasState.autoGenerateData.komisi,
                note: '',
                isAutoGenerate: true
            });
        }
        
        if (kasState.autoGenerateData.uop > 0) {
            kasState.pengeluaranItems.push({
                jenis: 'UoP',
                jumlah: kasState.autoGenerateData.uop,
                note: '',
                isAutoGenerate: true
            });
        }
        
        if (kasState.autoGenerateData.tips_qris > 0) {
            kasState.pengeluaranItems.push({
                jenis: 'Tips QRIS',
                jumlah: kasState.autoGenerateData.tips_qris,
                note: '',
                isAutoGenerate: true
            });
        }
    }
    
    renderPemasukanItems();
    renderPengeluaranItems();
    updateKasTotals();
    
    // Update button states
    updateKasButtonStates();
}

// [17] Render items pemasukan - VERSI DIPERBAIKI dengan Event Delegation
function renderPemasukanItems() {
    const container = document.getElementById('pemasukanContainer');
    
    if (kasState.pemasukanItems.length === 0) {
        container.innerHTML = '<p class="empty-message">Klik + untuk menambah pemasukan</p>';
        return;
    }
    
    let html = '<div class="items-list" id="pemasukanItemsList">'; // ✅ TAMBAH ID untuk delegasi
    
    kasState.pemasukanItems.forEach((item, index) => {
        const showNote = item.jenis === 'Pemasukan Lain Lain';
        const isDisabled = kasState.existingKasData || item.isAutoGenerate;
        const disabledAttr = isDisabled ? 'disabled' : '';
        const readonlyAttr = item.isAutoGenerate ? 'readonly' : '';
        
        html += `
            <div class="input-item ${item.isAutoGenerate ? 'auto-generate' : ''}">
                <div class="item-header">
                    <select class="item-select" data-index="${index}" data-type="jenis" ${disabledAttr}>
                        <option value="Omset Cash" ${item.jenis === 'Omset Cash' ? 'selected' : ''}>Omset Cash</option>
                        <option value="Top Up Kas" ${item.jenis === 'Top Up Kas' ? 'selected' : ''}>Top Up Kas</option>
                        <option value="Sisa Setoran" ${item.jenis === 'Sisa Setoran' ? 'selected' : ''}>Sisa Setoran</option>
                        <option value="Hutang Komisi" ${item.jenis === 'Hutang Komisi' ? 'selected' : ''}>Hutang Komisi</option>
                        <option value="Pemasukan Lain Lain" ${item.jenis === 'Pemasukan Lain Lain' ? 'selected' : ''}>Pemasukan Lain Lain</option>
                    </select>
                    
                    <div class="item-controls">
                        <input type="number" class="item-input" 
                               value="${item.jumlah}" data-index="${index}" data-type="jumlah" 
                               placeholder="Jumlah" min="0" ${disabledAttr} ${readonlyAttr}>
                        <button class="item-delete" data-index="${index}" ${disabledAttr ? 'disabled' : ''}>
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                ${showNote ? `
                <div class="item-note">
                    <input type="text" class="note-input" 
                           value="${item.note || ''}" data-index="${index}" data-type="note"
                           placeholder="Keterangan pemasukan lain-lain *" ${disabledAttr}>
                </div>
                ` : ''}
                
                ${item.isAutoGenerate ? `
                <div class="auto-badge">
                    <i class="fas fa-robot"></i> Auto-generate
                </div>
                ` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // ❌ HAPUS SELURUH BLOK INI (event listener per elemen):
    // if (!kasState.existingKasData) {
    //     // Add event listeners
    //     container.querySelectorAll('.item-select, .item-input, .note-input').forEach(element => {
    //         element.addEventListener('change', handlePemasukanChange);
    //         element.addEventListener('input', handlePemasukanChange);
    //     });
    //     
    //     container.querySelectorAll('.item-delete').forEach(button => {
    //         button.addEventListener('click', function() {
    //             const index = parseInt(this.getAttribute('data-index'));
    //             // Jangan hapus jika auto-generate
    //             if (!kasState.pemasukanItems[index]?.isAutoGenerate) {
    //                 kasState.pemasukanItems.splice(index, 1);
    //                 renderPemasukanItems();
    //                 updateKasTotals();
    //             }
    //         });
    //     });
    // }
}

// [18] Render items pengeluaran - VERSI DIPERBAIKI dengan Event Delegation
function renderPengeluaranItems() {
    const container = document.getElementById('pengeluaranContainer');
    
    if (kasState.pengeluaranItems.length === 0) {
        container.innerHTML = '<p class="empty-message">Klik + untuk menambah pengeluaran</p>';
        return;
    }
    
    let html = '<div class="items-list" id="pengeluaranItemsList">'; // ✅ TAMBAH ID untuk delegasi
    
    kasState.pengeluaranItems.forEach((item, index) => {
        const showNote = item.jenis === 'Pengeluaran Lain Lain';
        const isDisabled = kasState.existingKasData || item.isAutoGenerate;
        const disabledAttr = isDisabled ? 'disabled' : '';
        const readonlyAttr = item.isAutoGenerate ? 'readonly' : '';
        
        html += `
            <div class="input-item ${item.isAutoGenerate ? 'auto-generate' : ''}">
                <div class="item-header">
                    <select class="item-select" data-index="${index}" data-type="jenis" ${disabledAttr}>
                        <option value="Komisi" ${item.jenis === 'Komisi' ? 'selected' : ''}>Komisi</option>
                        <option value="UoP" ${item.jenis === 'UoP' ? 'selected' : ''}>UoP</option>
                        <option value="Tips QRIS" ${item.jenis === 'Tips QRIS' ? 'selected' : ''}>Tips QRIS</option>
                        <option value="Bayar Hutang komisi" ${item.jenis === 'Bayar Hutang komisi' ? 'selected' : ''}>Bayar Hutang komisi</option>
                        <option value="Iuran RT" ${item.jenis === 'Iuran RT' ? 'selected' : ''}>Iuran RT</option>
                        <option value="Sumbangan" ${item.jenis === 'Sumbangan' ? 'selected' : ''}>Sumbangan</option>
                        <option value="Iuran Sampah" ${item.jenis === 'Iuran Sampah' ? 'selected' : ''}>Iuran Sampah</option>
                        <option value="Galon" ${item.jenis === 'Galon' ? 'selected' : ''}>Galon</option>
                        <option value="Biaya Admin Setoran" ${item.jenis === 'Biaya Admin Setoran' ? 'selected' : ''}>Biaya Admin Setoran</option>
                        <option value="Yakult" ${item.jenis === 'Yakult' ? 'selected' : ''}>Yakult</option>
                        <option value="Pengeluaran Lain Lain" ${item.jenis === 'Pengeluaran Lain Lain' ? 'selected' : ''}>Pengeluaran Lain Lain</option>
                    </select>
                    
                    <div class="item-controls">
                        <input type="number" class="item-input" 
                               value="${item.jumlah}" data-index="${index}" data-type="jumlah" 
                               placeholder="Jumlah" min="0" ${disabledAttr} ${readonlyAttr}>
                        <button class="item-delete" data-index="${index}" ${disabledAttr ? 'disabled' : ''}>
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                ${showNote ? `
                <div class="item-note">
                    <input type="text" class="note-input" 
                           value="${item.note || ''}" data-index="${index}" data-type="note"
                           placeholder="Keterangan pengeluaran lain-lain *" ${disabledAttr}>
                </div>
                ` : ''}
                
                ${item.isAutoGenerate ? `
                <div class="auto-badge">
                    <i class="fas fa-robot"></i> Auto-generate
                </div>
                ` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // ❌ HAPUS SELURUH BLOK INI:
    // if (!kasState.existingKasData) {
    //     // Add event listeners
    //     container.querySelectorAll('.item-select, .item-input, .note-input').forEach(element => {
    //         element.addEventListener('change', handlePengeluaranChange);
    //         element.addEventListener('input', handlePengeluaranChange);
    //     });
    //     
    //     container.querySelectorAll('.item-delete').forEach(button => {
    //         button.addEventListener('click', function() {
    //             const index = parseInt(this.getAttribute('data-index'));
    //             // Jangan hapus jika auto-generate
    //             if (!kasState.pengeluaranItems[index]?.isAutoGenerate) {
    //                 kasState.pengeluaranItems.splice(index, 1);
    //                 renderPengeluaranItems();
    //                 updateKasTotals();
    //             }
    //         });
    //     });
    // }
}

// [19] Tambah item pemasukan
function addPemasukanItem() {
    kasState.pemasukanItems.push({
        jenis: 'Top Up Kas',
        jumlah: 0,
        note: '',
        isAutoGenerate: false
    });
    renderPemasukanItems();
    updateKasButtonStates();
}

// [20] Tambah item pengeluaran
function addPengeluaranItem() {
    kasState.pengeluaranItems.push({
        jenis: 'Bayar Hutang komisi',
        jumlah: 0,
        note: '',
        isAutoGenerate: false
    });
    renderPengeluaranItems();
    updateKasButtonStates();
}

// [21] ❌ HAPUS fungsi handlePemasukanChange yang lama:
// function handlePemasukanChange(e) {
//     const index = parseInt(e.target.getAttribute('data-index'));
//     const type = e.target.getAttribute('data-type');
//     
//     if (kasState.pemasukanItems[index]?.isAutoGenerate) {
//         return; // Jangan update jika auto-generate
//     }
//     
//     let value;
//     if (type === 'jumlah') {
//         value = parseInt(e.target.value) || 0;
//     } else if (type === 'jenis') {
//         value = e.target.value;
//         // Jika jenis berubah, reset note jika bukan pemasukan lain-lain
//         if (value !== 'Pemasukan Lain Lain') {
//             kasState.pemasukanItems[index].note = '';
//         }
//     } else {
//         value = e.target.value;
//     }
//     
//     kasState.pemasukanItems[index][type] = value;
//     
//     // Re-render jika jenis berubah untuk menampilkan/sembunyikan note
//     if (type === 'jenis') {
//         renderPemasukanItems();
//     }
//     
//     updateKasTotals();
//     updateKasButtonStates();
// }

// [22] Handle perubahan pengeluaran
function handlePengeluaranChange(e) {
    const index = parseInt(e.target.getAttribute('data-index'));
    const type = e.target.getAttribute('data-type');
    
    if (kasState.pengeluaranItems[index]?.isAutoGenerate) {
        return; // Jangan update jika auto-generate
    }
    
    let value;
    if (type === 'jumlah') {
        value = parseInt(e.target.value) || 0;
    } else if (type === 'jenis') {
        value = e.target.value;
        // Jika jenis berubah, reset note jika bukan pengeluaran lain-lain
        if (value !== 'Pengeluaran Lain Lain') {
            kasState.pengeluaranItems[index].note = '';
        }
    } else {
        value = e.target.value;
    }
    
    kasState.pengeluaranItems[index][type] = value;
    
    // Re-render jika jenis berubah untuk menampilkan/sembunyikan note
    if (type === 'jenis') {
        renderPengeluaranItems();
    }
    
    updateKasTotals();
    updateKasButtonStates();
}

// [23] Update total
function updateKasTotals() {
    const totalPemasukan = kasState.pemasukanItems.reduce((sum, item) => sum + (item.jumlah || 0), 0);
    const totalPengeluaran = kasState.pengeluaranItems.reduce((sum, item) => sum + (item.jumlah || 0), 0);
    
    document.getElementById('totalPemasukan').textContent = formatKasCurrency(totalPemasukan);
    document.getElementById('totalPengeluaran').textContent = formatKasCurrency(totalPengeluaran);
}

// [24] Update button states
function updateKasButtonStates() {
    const isValid = isFormValidKas();
    const hasData = kasState.pemasukanItems.length > 0 || kasState.pengeluaranItems.length > 0;
    const isDataValid = validateKasData();
    
    document.getElementById('tambahPemasukan').disabled = !isValid || kasState.existingKasData;
    document.getElementById('tambahPengeluaran').disabled = !isValid || kasState.existingKasData;
    document.getElementById('kasSubmitBtn').disabled = !isValid || !hasData || !isDataValid || kasState.existingKasData;
    
    // Validasi form
    if (!isDataValid) {
        document.getElementById('kasSubmitBtn').title = 'Harap lengkapi keterangan untuk Pemasukan/Pengeluaran Lain Lain';
    } else {
        document.getElementById('kasSubmitBtn').title = '';
    }
}

// [25] Validasi data
function validateKasData() {
    // Validasi: Pemasukan/Pengeluaran Lain Lain wajib keterangan jika jumlah > 0
    for (const item of kasState.pemasukanItems) {
        if (item.jenis === 'Pemasukan Lain Lain' && item.jumlah > 0 && !item.note.trim()) {
            return false;
        }
    }
    
    for (const item of kasState.pengeluaranItems) {
        if (item.jenis === 'Pengeluaran Lain Lain' && item.jumlah > 0 && !item.note.trim()) {
            return false;
        }
    }
    
    return true;
}

// [26] Check apakah form valid
function isFormValidKas() {
    // Tentukan outlet yang valid
    const outlet = kasState.selectedOutlet || currentUserOutletKas;
    return outlet && currentKasUser?.nama_karyawan && kasState.selectedTanggal;
}

// [27] Submit data ke Supabase - DITAMBAHKAN CEK CLOCK OUT
async function submitKasData() {
    try {
        const outlet = kasState.selectedOutlet || currentUserOutletKas;
        if (!outlet || !currentKasUser?.nama_karyawan) {
            showKasNotification('User tidak ditemukan!', 'error');
            return;
        }
        
        // ✅ CEK CLOCK OUT STATUS SEBELUM SUBMIT
        showKasLoading(true, 'Memeriksa status clock out...');
        
        const clockOutStatus = await checkClockOutStatus();
        
        if (!clockOutStatus.semuaClockOut && clockOutStatus.karyawanBelumClockOut.length > 0) {
            showKasLoading(false);
            showClockOutWarningPopup(clockOutStatus.karyawanBelumClockOut);
            return; // Jangan lanjut submit
        }
        
        // Lanjutkan validasi data seperti biasa
        if (!validateKasData()) {
            showKasNotification('Harap lengkapi keterangan untuk Pemasukan/Pengeluaran Lain Lain!', 'error');
            showKasLoading(false);
            return;
        }
        
        if (kasState.pemasukanItems.length === 0 && kasState.pengeluaranItems.length === 0) {
            showKasNotification('Tidak ada data pemasukan atau pengeluaran!', 'warning');
            showKasLoading(false);
            return;
        }
        
        // Validasi: Cek apakah sudah ada data untuk tanggal ini
        const { data: existingData } = await supabase
            .from('kas')
            .select('id')
            .eq('outlet', outlet)
            .eq('tanggal', kasState.selectedTanggal)
            .single();
        
        if (existingData) {
            showKasNotification('Data untuk tanggal ini sudah ada. Tidak bisa submit lagi.', 'error');
            showKasLoading(false);
            return;
        }
        
        showKasLoading(true, 'Menyimpan data KAS...');
        
        const selectedDate = new Date(kasState.selectedTanggal);
        const dayName = selectedDate.toLocaleDateString('id-ID', { weekday: 'long' });
        
        // Hitung total pemasukan dan pengeluaran
        const totalPemasukan = kasState.pemasukanItems.reduce((sum, item) => sum + (item.jumlah || 0), 0);
        const totalPengeluaran = kasState.pengeluaranItems.reduce((sum, item) => sum + (item.jumlah || 0), 0);
        
        // Siapkan data untuk kolom detail
        const dataDetail = {};
        let notePemasukanLain = '';
        let notePengeluaranLain = '';
        
        // Process pemasukan items
        kasState.pemasukanItems.forEach(item => {
            const key = getKasPemasukanKey(item.jenis);
            dataDetail[key] = item.jumlah;
            
            // Simpan note jika pemasukan lain-lain
            if (item.jenis === 'Pemasukan Lain Lain' && item.note) {
                notePemasukanLain = item.note;
            }
        });
        
        // Process pengeluaran items
        kasState.pengeluaranItems.forEach(item => {
            const key = getKasPengeluaranKey(item.jenis);
            dataDetail[key] = item.jumlah;
            
            // Simpan note jika pengeluaran lain-lain
            if (item.jenis === 'Pengeluaran Lain Lain' && item.note) {
                notePengeluaranLain = item.note;
            }
        });
        
        // Data untuk insert
        const kasData = {
            tanggal: kasState.selectedTanggal,
            hari: dayName,
            outlet: outlet,
            kasir: currentKasUser.nama_karyawan,
            pemasukan: totalPemasukan,
            pengeluaran: totalPengeluaran,
            saldo: totalPemasukan - totalPengeluaran,
            note_pemasukan_lain: notePemasukanLain,
            note_pengeluaran_lain: notePengeluaranLain,
            ...dataDetail
        };
        
        console.log('Data KAS yang akan disimpan:', kasData);
        
        // Insert new record
        const { error } = await supabase
            .from('kas')
            .insert([kasData]);
        
        if (error) throw error;
        
        // Kirim notifikasi WhatsApp dengan tanggal input data
        const notificationMessage = formatKasNotification(kasData);
        await sendKasWhatsAppNotification(notificationMessage);
        
        showKasNotification('Data KAS berhasil disimpan!', 'success');
        
        // Refresh data
        await loadRingkasanKas();
        await loadExistingKasData();
        
    } catch (error) {
        console.error('Error submitting kas data:', error);
        showKasNotification('Gagal menyimpan data: ' + error.message, 'error');
    } finally {
        showKasLoading(false);
    }
}

// [28] Map jenis pemasukan ke kolom database
function getKasPemasukanKey(jenis) {
    const mapping = {
        'Omset Cash': 'omset_cash',
        'Top Up Kas': 'top_up_kas',
        'Sisa Setoran': 'sisa_setoran',
        'Hutang Komisi': 'hutang_komisi',
        'Pemasukan Lain Lain': 'pemasukan_lain_lain'
    };
    return mapping[jenis] || 'pemasukan_lain_lain';
}

// [29] Map jenis pengeluaran ke kolom database
function getKasPengeluaranKey(jenis) {
    const mapping = {
        'Komisi': 'komisi',
        'UoP': 'uop',
        'Tips QRIS': 'tips_qris',
        'Bayar Hutang komisi': 'bayar_hutang_komisi',
        'Iuran RT': 'iuran_rt',
        'Sumbangan': 'sumbangan',
        'Iuran Sampah': 'iuran_sampah',
        'Galon': 'galon',
        'Biaya Admin Setoran': 'biaya_admin_setoran',
        'Yakult': 'yakult',
        'Pengeluaran Lain Lain': 'pengeluaran_lain_lain'
    };
    return mapping[jenis] || 'pengeluaran_lain_lain';
}

// [30] Load status setoran - DIMODIFIKASI untuk support filter outlet
async function loadSetoranStatus() {
    try {
        const outlet = kasState.selectedOutlet || currentUserOutletKas;
        if (!outlet) return;
        
        const periodeDisplay = kasState.selectedPeriod.display;
        
        console.log('🔍 Cari setoran:', { 
            outlet, 
            periode: periodeDisplay
        });

        let query;
        if (isOwnerKas && !kasState.selectedOutlet) {
            // Owner melihat semua outlet, load semua setoran untuk periode ini
            query = supabase
                .from('setoran')
                .select('*')
                .eq('periode', periodeDisplay);
        } else {
            // Single outlet mode
            query = supabase
                .from('setoran')
                .select('*')
                .eq('outlet', outlet)
                .eq('periode', periodeDisplay);
        }
        
        const { data, error } = await query;
        
        console.log('📊 Hasil query setoran:', { 
            data, 
            error: error?.message,
            code: error?.code 
        });
        
        if (error) {
            console.error('Error loading setoran:', error);
            kasState.currentSetoran = null;
        } else {
            // Jika owner melihat semua outlet, simpan array setoran
            // Jika single outlet, simpan single setoran
            if (isOwnerKas && !kasState.selectedOutlet && data && data.length > 0) {
                // Owner melihat semua outlet, simpan array
                kasState.currentSetoran = data;
                console.log('✅ Setoran ditemukan:', data.length, 'records');
            } else if (data && data.length > 0) {
                // Single outlet, ambil yang pertama
                kasState.currentSetoran = data[0];
                console.log('✅ Setoran ditemukan:', data[0]);
            } else {
                kasState.currentSetoran = null;
                console.log('ℹ️ Tidak ada setoran ditemukan');
            }
        }
        
        renderSetoranStatus();
        
    } catch (error) {
        console.error('Error in loadSetoranStatus:', error);
    }
}

// [31] Render status setoran - DIMODIFIKASI untuk multi-outlet
function renderSetoranStatus() {
    const container = document.getElementById('statusSetoran');
    
    if (!kasState.currentSetoran || (Array.isArray(kasState.currentSetoran) && kasState.currentSetoran.length === 0)) {
        // Status "Belum Setor"
        container.innerHTML = `
            <div class="status-header">
                <h4><i class="fas fa-info-circle"></i> Status Setoran</h4>
                <div class="status-badge status-pending">Belum Setor</div>
            </div>
            <div class="status-grid">
                <div class="status-item">
                    <div class="status-label">Metode</div>
                    <div class="status-value" id="statusMetode">-</div>
                </div>
                <div class="status-item">
                    <div class="status-label">Tanggal Setoran</div>
                    <div class="status-value" id="statusTanggalSetoran">-</div>
                </div>
                <div class="status-item">
                    <div class="status-label">Total Setoran</div>
                    <div class="status-value" id="statusTotalSetoran">-</div>
                </div>
                <div class="status-item">
                    <div class="status-label">Sisa Setoran</div>
                    <div class="status-value" id="statusSisaSetoran">-</div>
                </div>
            </div>
        `;
        
        // Enable/disable setor button
        if (!isOwnerKas || kasState.selectedOutlet) {
            const totalSaldo = kasState.currentKasData.reduce((sum, row) => {
                return sum + (parseInt(row.saldo) || 0);
            }, 0);
            
            const setorBtn = document.getElementById('setorBtn');
            setorBtn.disabled = totalSaldo <= 0 || !isFormValidKas();
        }
        
        return;
    }
    
    // Jika owner melihat semua outlet dan ada multiple setoran
    if (isOwnerKas && !kasState.selectedOutlet && Array.isArray(kasState.currentSetoran)) {
        const setorans = kasState.currentSetoran;
        let totalSetoranAll = 0;
        let totalKewajibanAll = 0;
        let totalSisaSetoranAll = 0;
        let verifiedCount = 0;
        let inProcessCount = 0;
        let pendingCount = 0;
        
        setorans.forEach(setoran => {
            totalSetoranAll += parseFloat(setoran.total_setoran) || 0;
            totalKewajibanAll += parseFloat(setoran.total_kewajiban) || 0;
            totalSisaSetoranAll += parseFloat(setoran.sisa_setoran) || 0;
            
            if (setoran.status_setoran === 'Verified') verifiedCount++;
            else if (setoran.status_setoran === 'In Process') inProcessCount++;
            else pendingCount++;
        });
        
        container.innerHTML = `
            <div class="status-header">
                <h4><i class="fas fa-info-circle"></i> Status Setoran (${setorans.length} Outlet)</h4>
                <div class="status-badge status-multiple">
                    <i class="fas fa-layer-group"></i> Multi Outlet
                </div>
            </div>
            <div class="status-grid-multi">
                <div class="status-item">
                    <div class="status-label">Total Outlet</div>
                    <div class="status-value">${setorans.length}</div>
                </div>
                <div class="status-item">
                    <div class="status-label">Verified</div>
                    <div class="status-value status-verified-count">${verifiedCount}</div>
                </div>
                <div class="status-item">
                    <div class="status-label">In Process</div>
                    <div class="status-value status-process-count">${inProcessCount}</div>
                </div>
                <div class="status-item">
                    <div class="status-label">Pending</div>
                    <div class="status-value status-pending-count">${pendingCount}</div>
                </div>
                <div class="status-item full-width">
                    <div class="status-label">Total Setoran Semua Outlet</div>
                    <div class="status-value">${formatKasCurrency(totalSetoranAll)}</div>
                </div>
                <div class="status-item full-width">
                    <div class="status-label">Total Kewajiban Semua Outlet</div>
                    <div class="status-value">${formatKasCurrency(totalKewajibanAll)}</div>
                </div>
                <div class="status-item full-width">
                    <div class="status-label">Total Sisa Setoran Semua Outlet</div>
                    <div class="status-value">${formatKasCurrency(totalSisaSetoranAll)}</div>
                </div>
            </div>
            <div class="setoran-list">
                <h5><i class="fas fa-list"></i> Detail per Outlet:</h5>
                <div class="setoran-items">
                    ${setorans.map(setoran => {
                        const statusClass = {
                            'Verified': 'status-verified',
                            'In Process': 'status-process',
                            'Belum Setor': 'status-pending'
                        }[setoran.status_setoran] || 'status-pending';
                        
                        return `
                            <div class="setoran-item">
                                <div class="setoran-outlet">
                                    <i class="fas fa-store"></i> ${setoran.outlet}
                                </div>
                                <div class="setoran-details">
                                    <span class="setoran-amount">${formatKasCurrency(setoran.total_setoran)}</span>
                                    <span class="setoran-status ${statusClass}">${setoran.status_setoran}</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        return;
    }
    
    // Single setoran (baik owner pilih outlet tertentu atau non-owner)
    const setoran = Array.isArray(kasState.currentSetoran) ? kasState.currentSetoran[0] : kasState.currentSetoran;
    
    // Format hari setoran
    let hariSetoran = '-';
    if (setoran.tanggal_setoran) {
        const date = new Date(setoran.tanggal_setoran);
        hariSetoran = date.toLocaleDateString('id-ID', { weekday: 'long' });
    }
    
    // Status class
    const statusClass = {
        'Belum Setor': 'status-pending',
        'In Process': 'status-process',
        'Verified': 'status-verified'
    }[setoran.status_setoran] || 'status-pending';
    
    container.innerHTML = `
        <div class="status-header">
            <h4><i class="fas fa-info-circle"></i> Status Setoran</h4>
            <div class="status-badge ${statusClass}">${setoran.status_setoran}</div>
        </div>
        <div class="status-grid">
            <div class="status-item">
                <div class="status-label">Metode</div>
                <div class="status-value" id="statusMetode">${setoran.metode_setoran || '-'}</div>
            </div>
            <div class="status-item">
                <div class="status-label">Tanggal Setoran</div>
                <div class="status-value" id="statusTanggalSetoran">
                    ${setoran.tanggal_setoran ? formatKasDisplayDate(setoran.tanggal_setoran) : '-'}
                </div>
            </div>
            <div class="status-item">
                <div class="status-label">Total Setoran</div>
                <div class="status-value" id="statusTotalSetoran">
                    ${formatKasCurrency(setoran.total_setoran || 0)}
                </div>
            </div>
            <div class="status-item">
                <div class="status-label">Sisa Setoran</div>
                <div class="status-value" id="statusSisaSetoran">
                    ${formatKasCurrency(setoran.sisa_setoran || 0)}
                </div>
            </div>
        </div>
    `;
    
    // Update setor button
    const setorBtn = document.getElementById('setorBtn');
    if (setoran.status_setoran === 'Verified') {
        setorBtn.disabled = true;
        setorBtn.innerHTML = '<i class="fas fa-check-circle"></i> SUDAH DISETOR';
    } else if (setoran.status_setoran === 'In Process') {
        setorBtn.disabled = true;
        setorBtn.innerHTML = '<i class="fas fa-clock"></i> MENUNGGU VERIFIKASI';
    }
}

// [32] Buka modal setoran
function openKasSetoranModal() {
    const outlet = kasState.selectedOutlet || currentUserOutletKas;
    if (!outlet || !currentKasUser?.nama_karyawan) {
        showKasNotification('User tidak ditemukan!', 'error');
        return;
    }
    
    // Hitung total kewajiban (total saldo dari ringkasan)
    const totalKewajiban = kasState.currentKasData.reduce((sum, row) => {
        return sum + (parseInt(row.saldo) || 0);
    }, 0);
    
    if (totalKewajiban <= 0) {
        showKasNotification('Tidak ada kewajiban setoran!', 'warning');
        return;
    }
    
    // Update modal content
    document.getElementById('modalOutletKas').textContent = outlet;
    document.getElementById('modalKasirKas').textContent = currentKasUser.nama_karyawan;
    document.getElementById('modalPeriodeKas').textContent = kasState.selectedPeriod.display;
    document.getElementById('modalKewajibanKas').textContent = formatKasCurrency(totalKewajiban);
    document.getElementById('totalSetoranInput').value = totalKewajiban;
    
    // Reset form
    document.getElementById('metodeSetoranKas').value = '';
    document.getElementById('buktiSetoranKas').value = '';
    
    // Tampilkan modal
    document.getElementById('setoranModal').classList.remove('hidden');
}

// [33] Tutup modal setoran
function closeKasSetoranModal() {
    document.getElementById('setoranModal').classList.add('hidden');
}

// [34] Submit setoran
async function submitKasSetoran() {
    try {
        const outlet = kasState.selectedOutlet || currentUserOutletKas;
        const totalSetoran = parseInt(document.getElementById('totalSetoranInput').value) || 0;
        const metodeSetoran = document.getElementById('metodeSetoranKas').value;
        
        if (!totalSetoran || !metodeSetoran) {
            showKasNotification('Harap isi total setoran dan pilih metode setoran!', 'error');
            return;
        }
        
        // Hitung total kewajiban
        const totalKewajiban = kasState.currentKasData.reduce((sum, row) => {
            return sum + (parseInt(row.saldo) || 0);
        }, 0);
        
        if (totalSetoran > totalKewajiban) {
            showKasNotification('Total setoran tidak boleh lebih besar dari total kewajiban!', 'error');
            return;
        }
        
        // Validasi: Cek apakah sudah ada setoran untuk periode ini
        const { data: existingSetoran } = await supabase
            .from('setoran')
            .select('id')
            .eq('outlet', outlet)
            .eq('periode', kasState.selectedPeriod.display)
            .single();
        
        if (existingSetoran) {
            showKasNotification('Setoran untuk periode ini sudah ada. Tidak bisa submit lagi.', 'error');
            closeKasSetoranModal();
            return;
        }
        
        showKasLoading(true);
        
        const now = new Date();
        const today = formatKasDate(now);
        
        // Hitung sisa setoran
        const sisaSetoran = totalKewajiban - totalSetoran;
        
        // Data setoran
        const setoranData = {
            outlet: outlet,
            periode: kasState.selectedPeriod.display,
            kasir: currentKasUser.nama_karyawan,
            total_kewajiban: totalKewajiban,
            total_setoran: totalSetoran,
            tanggal_setoran: today,
            metode_setoran: metodeSetoran,
            status_setoran: 'In Process',
            sisa_setoran: sisaSetoran
        };
        
        console.log('Data setoran yang akan disimpan:', setoranData);
        
        // Insert data setoran
        const { error } = await supabase
            .from('setoran')
            .insert([setoranData]);
        
        if (error) throw error;
        
        // Kirim notifikasi WhatsApp dengan tanggal setoran
        const notificationMessage = formatSetoranNotification(setoranData);
        await sendKasWhatsAppNotification(notificationMessage);
        
        showKasNotification('Setoran berhasil disimpan!', 'success');
        closeKasSetoranModal();
        
        // Refresh status setoran
        await loadSetoranStatus();
        
    } catch (error) {
        console.error('Error submitting setoran:', error);
        showKasNotification('Gagal menyimpan setoran: ' + error.message, 'error');
    } finally {
        showKasLoading(false);
    }
}

// [35] Verifikasi setoran (owner only) - DIMODIFIKASI untuk multi-outlet
async function verifikasiKasSetoran() {
    try {
        if (!kasState.currentSetoran) {
            showKasNotification('Tidak ada setoran untuk diverifikasi!', 'warning');
            return;
        }
        
        // Jika owner melihat semua outlet, tampilkan modal pilih setoran
        if (isOwnerKas && !kasState.selectedOutlet && Array.isArray(kasState.currentSetoran)) {
            const inProcessSetorans = kasState.currentSetoran.filter(s => s.status_setoran === 'In Process');
            
            if (inProcessSetorans.length === 0) {
                showKasNotification('Tidak ada setoran dengan status "In Process"!', 'warning');
                return;
            }
            
            // Tampilkan modal pilih setoran untuk diverifikasi
            showVerificationSelectionModal(inProcessSetorans);
            return;
        }
        
        // Single outlet verification
        const setoran = Array.isArray(kasState.currentSetoran) ? kasState.currentSetoran[0] : kasState.currentSetoran;
        
        if (setoran.status_setoran !== 'In Process') {
            showKasNotification('Hanya setoran dengan status "In Process" yang bisa diverifikasi!', 'warning');
            return;
        }
        
        showKasLoading(true);
        
        const { error } = await supabase
            .from('setoran')
            .update({ status_setoran: 'Verified' })
            .eq('id', setoran.id);
        
        if (error) throw error;
        
        showKasNotification('Setoran telah diverifikasi!', 'success');
        await loadSetoranStatus();
        
    } catch (error) {
        console.error('Error verifying setoran:', error);
        showKasNotification('Gagal memverifikasi setoran: ' + error.message, 'error');
    } finally {
        showKasLoading(false);
    }
}

// [NEW] Modal untuk pilih setoran yang akan diverifikasi (multi-outlet)
function showVerificationSelectionModal(setorans) {
    const modalHTML = `
        <div id="verificationSelectionModal" class="modal-overlay">
            <div class="modal-content wide-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-check-circle"></i> Verifikasi Setoran (${setorans.length} tersedia)</h3>
                    <button class="modal-close" id="closeVerificationModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="verification-list">
                        ${setorans.map((setoran, index) => `
                            <div class="verification-item" data-id="${setoran.id}">
                                <div class="verification-check">
                                    <input type="checkbox" id="verify_${index}" class="verify-checkbox">
                                </div>
                                <div class="verification-details">
                                    <div class="verification-outlet">
                                        <i class="fas fa-store"></i> <strong>${setoran.outlet}</strong>
                                    </div>
                                    <div class="verification-info">
                                        <div class="info-row">
                                            <span class="info-label">Kasir:</span>
                                            <span class="info-value">${setoran.kasir}</span>
                                        </div>
                                        <div class="info-row">
                                            <span class="info-label">Periode:</span>
                                            <span class="info-value">${setoran.periode}</span>
                                        </div>
                                        <div class="info-row">
                                            <span class="info-label">Total Setoran:</span>
                                            <span class="info-value amount">${formatKasCurrency(setoran.total_setoran)}</span>
                                        </div>
                                        <div class="info-row">
                                            <span class="info-label">Metode:</span>
                                            <span class="info-value">${setoran.metode_setoran}</span>
                                        </div>
                                        <div class="info-row">
                                            <span class="info-label">Tanggal Setoran:</span>
                                            <span class="info-value">${setoran.tanggal_setoran}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="selection-actions">
                        <button id="selectAllVerify" class="btn-small">
                            <i class="fas fa-check-square"></i> Pilih Semua
                        </button>
                        <button id="deselectAllVerify" class="btn-small">
                            <i class="fas fa-times-circle"></i> Batalkan Semua
                        </button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="cancelVerification" class="btn-cancel">
                        <i class="fas fa-times"></i> Batal
                    </button>
                    <button id="submitBulkVerification" class="btn-modal-submit">
                        <i class="fas fa-check-double"></i> VERIFIKASI YANG DIPILIH
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Setup events
    const modal = document.getElementById('verificationSelectionModal');
    const closeBtn = document.getElementById('closeVerificationModal');
    const cancelBtn = document.getElementById('cancelVerification');
    const selectAllBtn = document.getElementById('selectAllVerify');
    const deselectAllBtn = document.getElementById('deselectAllVerify');
    const submitBtn = document.getElementById('submitBulkVerification');
    
    closeBtn.addEventListener('click', () => modal.remove());
    cancelBtn.addEventListener('click', () => modal.remove());
    
    selectAllBtn.addEventListener('click', () => {
        document.querySelectorAll('.verify-checkbox').forEach(cb => cb.checked = true);
    });
    
    deselectAllBtn.addEventListener('click', () => {
        document.querySelectorAll('.verify-checkbox').forEach(cb => cb.checked = false);
    });
    
    submitBtn.addEventListener('click', async () => {
        const selectedCheckboxes = document.querySelectorAll('.verify-checkbox:checked');
        if (selectedCheckboxes.length === 0) {
            alert('Pilih minimal satu setoran untuk diverifikasi!');
            return;
        }
        
        const selectedIds = [];
        selectedCheckboxes.forEach(cb => {
            const item = cb.closest('.verification-item');
            selectedIds.push(item.dataset.id);
        });
        
        await submitBulkVerification(selectedIds);
        modal.remove();
    });
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// [NEW] Submit bulk verification
async function submitBulkVerification(setoranIds) {
    try {
        showKasLoading(true);
        
        console.log('Verifying setoran IDs:', setoranIds);
        
        // Update all selected setoran to Verified
        const { error } = await supabase
            .from('setoran')
            .update({ status_setoran: 'Verified' })
            .in('id', setoranIds);
        
        if (error) throw error;
        
        showKasNotification(`${setoranIds.length} setoran berhasil diverifikasi!`, 'success');
        await loadSetoranStatus();
        
    } catch (error) {
        console.error('Error in bulk verification:', error);
        showKasNotification('Gagal memverifikasi setoran: ' + error.message, 'error');
    } finally {
        showKasLoading(false);
    }
}

// [36] Fungsi notifikasi WhatsApp
async function sendKasWhatsAppNotification(message) {
    try {
        console.log('Mengirim notifikasi WhatsApp...');
        
        if (!navigator.onLine) {
            console.log('Tidak ada koneksi internet, notifikasi ditunda');
            return false;
        }
        
        const response = await fetch(WA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': WA_API_KEY
            },
            body: JSON.stringify({
                session: 'Session1',
                chatId: WA_CHAT_ID,
                text: message
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Notifikasi WhatsApp berhasil dikirim:', result);
        return true;
    } catch (error) {
        console.error('Gagal mengirim notifikasi WhatsApp:', error);
        return false;
    }
}

// [37] Format notifikasi untuk submit pemasukan & pengeluaran
function formatKasNotification(kasData) {
    const date = new Date(kasData.tanggal);
    const hariTanggal = date.toLocaleDateString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
    
    return `*LAPORAN KAS BABEH BARBERSHOP*
=============================
💈 Outlet : ${kasData.outlet}
📅 Tanggal : ${hariTanggal}
👩‍💼 Kasir : ${kasData.kasir}
=============================
💰 Pemasukan : Rp. ${formatKasCurrencyForWA(kasData.pemasukan)}
💸 Pengeluaran: Rp. ${formatKasCurrencyForWA(kasData.pengeluaran)}
💎 Saldo    : Rp. ${formatKasCurrencyForWA(kasData.saldo)}
=============================
✅ Status: Berhasil disimpan`;
}

// [38] Format notifikasi untuk submit setoran
function formatSetoranNotification(setoranData) {
    const date = new Date(setoranData.tanggal_setoran);
    const hariTanggal = date.toLocaleDateString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
    
    return `*SETORAN KAS BABEH BARBERSHOP*
=============================
💈 Outlet : ${setoranData.outlet}
📅 Hari/Tanggal : ${hariTanggal}
📊 Periode : ${setoranData.periode}
👩‍💼 Kasir : ${setoranData.kasir}
=============================
💰 Total Setoran : Rp. ${formatKasCurrencyForWA(setoranData.total_setoran)}
🏦 Metode Setoran : ${setoranData.metode_setoran}
💸 Sisa Setoran : Rp. ${formatKasCurrencyForWA(setoranData.sisa_setoran)}
=============================
⏳ Status : Menunggu Verifikasi`;
}

// [39] Helper functions
function formatKasCurrency(amount) {
    if (amount === 0 || !amount) return '0';
    return new Intl.NumberFormat('id-ID').format(amount);
}

function formatKasCurrencyForWA(amount) {
    return new Intl.NumberFormat('id-ID').format(amount).replace(/\./g, ',');
}

function formatKasDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatKasDateID(date) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    const dayName = days[date.getDay()];
    return `${dayName} ${date.getDate()}/${months[date.getMonth()]}/${date.getFullYear()}`;
}

function formatKasDisplayDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

// [40] Loading functions
function showKasLoading(show) {
    const overlay = document.getElementById('kasLoadingOverlay');
    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

// [41] Notification function
function showKasNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotif = document.querySelector('.kas-notification');
    if (existingNotif) existingNotif.remove();
    
    const notification = document.createElement('div');
    notification.className = `kas-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.getElementById('kasPage').appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 3000);
}

// ========== FUNGSI CEK CLOCK OUT ==========
// ==========================================

// [42] Fungsi untuk cek karyawan yang belum clock out - VERSI FINAL FIXED
async function checkClockOutStatus() {
    try {
        const outlet = kasState.selectedOutlet || currentUserOutletKas;
        let tanggal = kasState.selectedTanggal; // Format: YYYY-MM-DD
        
        console.log('🔍 Checking clock out status:', { outlet, tanggal });
        
        if (!outlet || !tanggal) {
            return { semuaClockOut: true, karyawanBelumClockOut: [] };
        }
        
        // 1. Konversi format tanggal
        const tanggalParts = tanggal.split('-');
        const tanggalAbsenFormat = `${tanggalParts[2]}/${tanggalParts[1]}/${tanggalParts[0]}`;
        
        console.log(`📅 Tanggal format: ${tanggal} → ${tanggalAbsenFormat}`);
        
        // 2. Query langsung ke tabel absen (HANYA ambil kolom yang ada: nama, clockin, clockout)
        const { data: absenData, error } = await supabase
            .from('absen')
            .select('nama, clockin, clockout') // ✅ HAPUS 'role' dari select
            .eq('outlet', outlet)
            .eq('tanggal', tanggalAbsenFormat)
            .not('clockin', 'is', null)  // hanya yang sudah clock in
            .is('clockout', null);       // dan belum clock out
        
        if (error) {
            console.error('❌ Error query absen:', error);
            return { semuaClockOut: true, karyawanBelumClockOut: [] };
        }
        
        console.log(`📊 Data absen ditemukan: ${absenData?.length || 0} karyawan belum clock out`);
        
        if (!absenData || absenData.length === 0) {
            return { semuaClockOut: true, karyawanBelumClockOut: [] };
        }
        
        // 3. Ambil data karyawan lengkap untuk yang belum clock out
        const karyawanBelumClockOut = [];
        const namaKaryawanList = absenData.map(item => item.nama);
        
        if (namaKaryawanList.length > 0) {
            const { data: karyawanData } = await supabase
                .from('karyawan')
                .select('nama_karyawan, role, posisi')
                .eq('outlet', outlet)
                .in('nama_karyawan', namaKaryawanList);
            
            if (karyawanData) {
                // Gabungkan data
                absenData.forEach(absen => {
                    const karyawan = karyawanData.find(k => k.nama_karyawan === absen.nama);
                    if (karyawan) {
                        karyawanBelumClockOut.push({
                            nama: absen.nama,
                            role: karyawan.role,
                            posisi: karyawan.posisi,
                            clock_in: absen.clockin,
                            clock_out: absen.clockout || 'BELUM'
                        });
                    }
                });
            }
        }
        
        console.log('✅ Check clock out selesai:', {
            belumClockOut: karyawanBelumClockOut.length,
            detail: karyawanBelumClockOut
        });
        
        return {
            semuaClockOut: karyawanBelumClockOut.length === 0,
            karyawanBelumClockOut: karyawanBelumClockOut
        };
        
    } catch (error) {
        console.error('❌ Error in checkClockOutStatus:', error);
        return { semuaClockOut: true, karyawanBelumClockOut: [] };
    }
}
 // [43] Fungsi untuk tampilkan popup clock out warning - VERSI FINAL DIPERBAIKI
function showClockOutWarningPopup(karyawanList) {
    console.log('🔄 showClockOutWarningPopup dipanggil dengan data:', karyawanList);
    
    try {
        // ========== FIX 1: HAPUS SEMUA POPUP/MODAL SEBELUMNYA ==========
        // Hapus berdasarkan ID
        const existingPopup = document.getElementById('clockOutWarningPopup');
        if (existingPopup && existingPopup.parentNode) {
            existingPopup.remove();
            console.log('🧹 Hapus popup sebelumnya berdasarkan ID');
        }
        
        // Hapus berdasarkan class modal-overlay (kecuali setoranModal)
        document.querySelectorAll('.modal-overlay').forEach(el => {
            if (el && el.parentNode && el.id !== 'setoranModal' && el.id !== 'clockOutWarningPopup') {
                el.remove();
                console.log('🧹 Hapus modal overlay lain');
            }
        });
        
        // Validasi input
        if (!karyawanList || karyawanList.length === 0) {
            console.error('❌ Data karyawan kosong!');
            return;
        }
        
        // ========== FIX 2: DAPATKAN DATA KAS UNTUK DISPLAY ==========
        const outlet = kasState.selectedOutlet || currentUserOutletKas || 'N/A';
        const tanggal = kasState.selectedTanggal || 'N/A';
        
        // ========== FIX 3: BUAT POPUP DENGAN INLINE STYLE UNIK ==========
        // Pakai class unik "clock-warning" untuk menghindari CSS conflict
        const popupHTML = `
            <div id="clockOutWarningPopup" class="clock-warning-overlay">
                <div class="clock-warning-modal">
                    <!-- Header -->
                    <div class="clock-warning-header">
                        <h3>
                            <i class="fas fa-exclamation-triangle"></i> 
                            PERINGATAN: Clock Out Belum Lengkap
                        </h3>
                    </div>
                    
                    <!-- Body -->
                    <div class="clock-warning-body">
                        <!-- Icon & Title -->
                        <div class="clock-warning-icon-section">
                            <div class="clock-warning-icon">
                                <i class="fas fa-user-clock"></i>
                            </div>
                            <h4 class="clock-warning-title">
                                ${karyawanList.length} Karyawan Belum Clock Out!
                            </h4>
                            <div class="clock-warning-info">
                                <p><i class="fas fa-calendar-day"></i> Tanggal: <strong>${tanggal}</strong></p>
                                <p><i class="fas fa-store"></i> Outlet: <strong>${outlet}</strong></p>
                            </div>
                        </div>
                        
                        <!-- Karyawan List -->
                        <div class="clock-warning-list-container">
                            <div class="clock-warning-list">
                                ${karyawanList.map((karyawan, index) => `
                                    <div class="clock-warning-item" data-index="${index}">
                                        <div class="clock-warning-item-header">
                                            <div class="clock-warning-name">
                                                <i class="fas fa-user"></i> ${karyawan.nama || 'N/A'}
                                            </div>
                                            <div class="clock-warning-badges">
                                                <span class="clock-warning-role">${karyawan.role || 'N/A'}</span>
                                                <span class="clock-warning-position">${karyawan.posisi || 'N/A'}</span>
                                            </div>
                                        </div>
                                        
                                        <div class="clock-warning-times">
                                            <div class="clock-in-info">
                                                <i class="fas fa-sign-in-alt"></i> Clock In: ${karyawan.clock_in || 'N/A'}
                                            </div>
                                            <div class="clock-out-status">
                                                <i class="fas fa-exclamation-circle"></i> 
                                                Clock Out: <span class="clock-out-warning">${karyawan.clock_out || 'BELUM'}</span>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <!-- Instruction -->
                        <div class="clock-warning-instruction">
                            <div class="clock-warning-instruction-icon">
                                <i class="fas fa-info-circle"></i>
                            </div>
                            <div class="clock-warning-instruction-text">
                                <p><strong>PENTING!</strong> Harap minta karyawan tersebut untuk melakukan <strong>Clock Out</strong> terlebih dahulu sebelum melanjutkan submit data KAS.</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="clock-warning-footer">
                        <button id="closeClockOutPopup" class="clock-warning-close-btn">
                            <i class="fas fa-times"></i> Tutup Peringatan
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Tambahkan ke body
        document.body.insertAdjacentHTML('beforeend', popupHTML);
        console.log('✅ Popup berhasil ditambahkan ke DOM');
        
        // ========== FIX 4: SETUP EVENT LISTENERS ==========
        setTimeout(() => {
            const popup = document.getElementById('clockOutWarningPopup');
            const closeBtn = document.getElementById('closeClockOutPopup');
            
            if (!popup) {
                console.error('❌ Popup tidak ditemukan setelah ditambahkan!');
                return;
            }
            
            // Close button event
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔘 Tombol tutup diklik');
                    popup.remove();
                });
                
                // Auto focus untuk aksesibilitas
                closeBtn.focus();
            }
            
            // Close on click outside
            popup.addEventListener('click', (e) => {
                if (e.target === popup) {
                    console.log('🌐 Klik di luar modal');
                    popup.remove();
                }
            });
            
            // Close on ESC key
            const escHandler = (e) => {
                if (e.key === 'Escape' && popup.parentNode) {
                    console.log('⌨️ ESC key pressed');
                    popup.remove();
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
            
            console.log('🎯 Popup seharusnya terlihat sekarang!');
            
        }, 100); // Timeout untuk memastikan DOM sudah ready
        
    } catch (error) {
        console.error('❌ Error dalam showClockOutWarningPopup:', error);
        console.error('Stack trace:', error.stack);
        
        // Fallback: tampilkan alert jika popup gagal
        const names = karyawanList.map(k => `• ${k.nama} (${k.role}) - Clock In: ${k.clock_in}`).join('\n');
        alert(`⚠️ PERINGATAN CLOCK OUT\n\n${karyawanList.length} karyawan belum clock out:\n\n${names}\n\nHarap minta mereka clock out terlebih dahulu sebelum submit KAS.`);
    }
}
// ========== SLIP PENGHASILAN ==========
// =====================================

// Global variables untuk slip
let currentSlipKaryawan = null;
let isOwnerSlip = false;
let currentUserOutletSlip = null;

// [1] Fungsi untuk tampilkan halaman slip
async function showSlipPage() {
    try {
        console.log('showSlipPage called');
        
        // Ambil data user
        const { data: { user } } = await supabase.auth.getUser();
        const namaKaryawan = user?.user_metadata?.nama_karyawan;
        
        if (!namaKaryawan) {
            alert('User tidak ditemukan!');
            return;
        }
        
        // Ambil data karyawan lengkap
        const { data: karyawanData, error } = await supabase
            .from('karyawan')
            .select('role, outlet, posisi, gaji')
            .eq('nama_karyawan', namaKaryawan)
            .single();
        
        if (error) {
            console.error('Error loading karyawan data:', error);
            throw new Error('Data karyawan tidak ditemukan!');
        }
        
        if (!karyawanData) {
            throw new Error('Data karyawan tidak ditemukan!');
        }
        
        currentSlipKaryawan = {
            nama_karyawan: namaKaryawan,
            role: karyawanData.role,
            outlet: karyawanData.outlet,
            posisi: karyawanData.posisi,
            gaji_harian: karyawanData.gaji || 0
        };
        
        currentUserOutletSlip = karyawanData.outlet;
        isOwnerSlip = karyawanData.role === 'owner';
        
         // Set global variables untuk diakses oleh fungsi lain
        window.isOwnerSlip = isOwnerSlip;
        window.currentSlipKaryawan = currentSlipKaryawan;
        window.currentUserOutletSlip = currentUserOutletSlip;
        
        console.log('Slip karyawan data:', currentSlipKaryawan);
        console.log('Global isOwnerSlip set to:', window.isOwnerSlip);
        
        // Sembunyikan main app, tampilkan halaman slip
        document.getElementById('appScreen').style.display = 'none';
        
        // Buat container halaman slip
        createSlipPage();
        
        // Load data slip untuk bulan berjalan sebagai default
        const now = new Date();
        await loadSlipData(now.getMonth() + 1, now.getFullYear());
        
    } catch (error) {
        console.error('Error in showSlipPage:', error);
        alert('Gagal memuat halaman slip gaji: ' + error.message);
        
        // Kembali ke main app jika error
        try {
            document.getElementById('slipPage')?.remove();
        } catch (e) {
            // Ignore
        }
        
        document.getElementById('appScreen').style.display = 'block';
    }
}

// [2] Fungsi untuk buat halaman slip
function createSlipPage() {
    // Hapus halaman slip sebelumnya jika ada
    const existingPage = document.getElementById('slipPage');
    if (existingPage) {
        existingPage.remove();
    }
    
    // Buat dropdown bulan dan tahun
    const bulanSekarang = new Date().getMonth() + 1;
    const tahunSekarang = new Date().getFullYear();
    
    const bulanOptions = Array.from({length: 12}, (_, i) => {
        const bulan = i + 1;
        const namaBulan = new Date(2024, i, 1).toLocaleDateString('id-ID', { month: 'long' });
        return `<option value="${bulan}" ${bulan === bulanSekarang ? 'selected' : ''}>${namaBulan}</option>`;
    }).join('');
    
    const tahunOptions = Array.from({length: 5}, (_, i) => {
        const tahun = tahunSekarang - 2 + i;
        return `<option value="${tahun}" ${tahun === tahunSekarang ? 'selected' : ''}>${tahun}</option>`;
    }).join('');
    
    // Buat container halaman slip
    const slipPage = document.createElement('div');
    slipPage.id = 'slipPage';
    slipPage.className = 'slip-page';
    slipPage.innerHTML = `
        <!-- Header Navigation -->
        <header class="slip-header">
            <button class="back-btn" id="backToMainFromSlip">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h2><i class="fas fa-file-invoice-dollar"></i> Slip Penghasilan</h2>
            <div class="header-actions">
                <button class="refresh-btn" id="refreshSlip">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
        </header>
        
        <!-- Filter Section -->
        <section class="slip-filter-section">
            <div class="filter-container">
                <!-- Untuk Owner: Filter Outlet & Karyawan -->
              <div id="ownerSlipFilterSection" class="owner-filter" style="display: ${isOwnerSlip ? 'flex' : 'none'}; flex-direction: column; gap: 10px; margin-bottom: 15px; background: #f8f9ff; padding: 12px; border-radius: 8px;">
    <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
        <div class="filter-group" style="flex: 1; min-width: 200px;">
            <label for="selectOutletSlip" style="display: block; margin-bottom: 5px; font-weight: 600; color: #333; font-size: 0.9rem;">
                <i class="fas fa-store"></i> Outlet:
            </label>
            <select id="selectOutletSlip" class="outlet-select" style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 0.9rem;">
                <option value="all">Semua Outlet</option>
            </select>
        </div>
    </div>
    <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
        <div class="filter-group" style="flex: 1; min-width: 200px;">
            <label for="selectKaryawanSlip" style="display: block; margin-bottom: 5px; font-weight: 600; color: #333; font-size: 0.9rem;">
                <i class="fas fa-user"></i> Karyawan:
            </label>
            <select id="selectKaryawanSlip" class="karyawan-select" style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 0.9rem;">
                <option value="">Pilih Karyawan</option>
            </select>
        </div>
    </div>
</div>
                <!-- Periode Selection -->
                <div class="periode-selection">
                    <div class="filter-group">
                        <label for="selectBulan"><i class="fas fa-calendar-alt"></i> Periode:</label>
                        <div class="periode-inputs">
                            <select id="selectBulan" class="bulan-select">
                                ${bulanOptions}
                            </select>
                            <select id="selectTahun" class="tahun-select">
                                ${tahunOptions}
                            </select>
                            <button class="btn-load" id="loadSlipData">
                                <i class="fas fa-search"></i> Tampilkan
                            </button>
                        </div>
                    </div>
                    
                    <div class="data-source-badge" id="dataSourceBadge">
                        <i class="fas fa-database"></i>
                        <span id="sourceText">Loading...</span>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Main Content -->
        <main class="slip-main-content">
            <!-- Loading State -->
            <div class="loading-section" id="loadingSlip">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>Memuat data slip gaji...</p>
            </div>
            
            <!-- Content -->
            <div id="slipContent" style="display: none;">
                <!-- Konten akan diisi oleh JavaScript -->
            </div>
            
            <!-- Empty State -->
            <div class="empty-state" id="emptySlip" style="display: none;">
                <i class="fas fa-file-invoice"></i>
                <h3>Data tidak ditemukan</h3>
                <p>Tidak ada data slip gaji untuk periode yang dipilih.</p>
            </div>
        </main>
        
        <!-- Footer -->
<div class="slip-footer">
    <p class="footer-note">
        <i class="fas fa-info-circle"></i> 
        Data slip akan difinalkan setiap tanggal 1 jam 12:00
    </p>
</div>
     `;
    document.body.appendChild(slipPage);
    
    // Setup event listeners
    setupSlipPageEvents();
}

// [3] Setup event listeners
function setupSlipPageEvents() {
    // Tombol kembali
    document.getElementById('backToMainFromSlip').addEventListener('click', () => {
        document.getElementById('slipPage').remove();
        document.getElementById('appScreen').style.display = 'block';
    });
    
    // Tombol refresh
    document.getElementById('refreshSlip').addEventListener('click', async () => {
        const bulan = parseInt(document.getElementById('selectBulan').value);
        const tahun = parseInt(document.getElementById('selectTahun').value);
        await loadSlipData(bulan, tahun);
    });
    
    // Tombol load data
    document.getElementById('loadSlipData').addEventListener('click', async () => {
        const bulan = parseInt(document.getElementById('selectBulan').value);
        const tahun = parseInt(document.getElementById('selectTahun').value);
        await loadSlipData(bulan, tahun);
    });
    
    // Filter untuk owner
    if (isOwnerSlip) {
        // Load dropdown outlet
        loadOutletDropdownSlip();
        
        // Event listener untuk outlet change
        document.getElementById('selectOutletSlip').addEventListener('change', async () => {
            await loadKaryawanDropdownSlip();
        });
        
        // Event listener untuk karyawan change
        document.getElementById('selectKaryawanSlip').addEventListener('change', async () => {
            const bulan = parseInt(document.getElementById('selectBulan').value);
            const tahun = parseInt(document.getElementById('selectTahun').value);
            await loadSlipData(bulan, tahun);
        });
    }
}

// [4] Load dropdown outlet (owner only)
async function loadOutletDropdownSlip() {
    const select = document.getElementById('selectOutletSlip');
    
    try {
        const { data: outlets, error } = await supabase
            .from('karyawan')
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
        
        // Set outlet user saat ini sebagai default
        if (currentUserOutletSlip && uniqueOutlets.includes(currentUserOutletSlip)) {
            select.value = currentUserOutletSlip;
        }
        
        // Setelah outlet di-load, load karyawan dropdown
        await loadKaryawanDropdownSlip();
        
    } catch (error) {
        console.error('Error loading outlets for slip:', error);
        select.innerHTML = '<option value="all">Semua Outlet</option>';
    }
}

// [5] Load dropdown karyawan berdasarkan outlet (owner only)
async function loadKaryawanDropdownSlip() {
    const select = document.getElementById('selectKaryawanSlip');
    const outletSelect = document.getElementById('selectOutletSlip');
    const selectedOutlet = outletSelect ? outletSelect.value : null;
    
    try {
        let query = supabase
            .from('karyawan')
            .select('nama_karyawan, role, posisi')
            .order('nama_karyawan');
        
        // Filter berdasarkan outlet jika dipilih
        if (selectedOutlet && selectedOutlet !== 'all') {
            query = query.eq('outlet', selectedOutlet);
        }
        
        const { data: karyawanList, error } = await query;
        
        if (error) throw error;
        
        select.innerHTML = `
            <option value="">Pilih Karyawan</option>
            ${karyawanList.map(k => 
                `<option value="${k.nama_karyawan}">${k.nama_karyawan} (${k.posisi || k.role})</option>`
            ).join('')}
        `;
        
        // Auto-select karyawan saat ini jika bukan owner mode all
        if (!isOwnerSlip && currentSlipKaryawan) {
            select.value = currentSlipKaryawan.nama_karyawan;
        }
        
    } catch (error) {
        console.error('Error loading karyawan list for slip:', error);
        select.innerHTML = `
            <option value="">Error loading data</option>
            ${currentSlipKaryawan ? `<option value="${currentSlipKaryawan.nama_karyawan}">${currentSlipKaryawan.nama_karyawan}</option>` : ''}
        `;
    }
}

// [6] Fungsi utama untuk load data slip
async function loadSlipData(bulan, tahun) {
    try {
        console.log('Loading slip data for:', { bulan, tahun });
        
        // Tampilkan loading
        showLoadingSlip(true);
        
        // Tentukan karyawan yang akan ditampilkan
        let namaKaryawan = currentSlipKaryawan?.nama_karyawan;
        let outlet = currentUserOutletSlip;
        
        // Jika owner, gunakan filter yang dipilih
        if (isOwnerSlip) {
            const selectKaryawan = document.getElementById('selectKaryawanSlip');
            const selectOutlet = document.getElementById('selectOutletSlip');
            
            if (selectKaryawan && selectKaryawan.value) {
                namaKaryawan = selectKaryawan.value;
                
                // Ambil data karyawan yang dipilih
                try {
                    const { data: karyawanData, error } = await supabase
                        .from('karyawan')
                        .select('outlet, posisi, gaji, role')
                        .eq('nama_karyawan', namaKaryawan)
                        .single();
                    
                    if (error) throw error;
                    
                    if (karyawanData) {
                        outlet = karyawanData.outlet;
                        currentSlipKaryawan = {
                            ...currentSlipKaryawan,
                            outlet: outlet,
                            posisi: karyawanData.posisi,
                            gaji_harian: karyawanData.gaji || 0,
                            role: karyawanData.role || currentSlipKaryawan?.role || 'kasir'
                        };
                    }
                } catch (error) {
                    console.error('Error loading karyawan data:', error);
                }
            }
            
            if (selectOutlet && selectOutlet.value !== 'all') {
                outlet = selectOutlet.value;
            }
        }
        
        if (!namaKaryawan) {
            throw new Error('Pilih karyawan terlebih dahulu!');
        }
        
        // Cek sumber data
        const dataSource = await checkDataSource(namaKaryawan, bulan, tahun);
        updateDataSourceBadge(dataSource);
        
        // Load data berdasarkan sumber
        let slipData;
        if (dataSource === 'final') {
            slipData = await loadFinalSlipData(namaKaryawan, bulan, tahun);
        } else {
            slipData = await calculateRealTimeSlip(namaKaryawan, outlet, bulan, tahun);
        }
        
        // Tampilkan data
        displaySlipData(slipData, dataSource);
        
    } catch (error) {
        console.error('Error loading slip data:', error);
        showErrorSlip(error.message || 'Gagal memuat data slip');
    }
}

// [7] Cek sumber data (real-time vs final)
async function checkDataSource(namaKaryawan, bulan, tahun) {
    const periode = `${bulan.toString().padStart(2, '0')}/${tahun}`;
    
    try {
        // Cek apakah sudah melewati tanggal 1 jam 06:00
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const currentDay = now.getDate();
        const currentHour = now.getHours();
        
        // Jika periode BULAN INI atau MASA DEPAN
        if (tahun > currentYear || (tahun === currentYear && bulan > currentMonth)) {
            return 'realtime'; // Belum bisa final
        }
        
        // Jika periode BULAN INI
        if (bulan === currentMonth && tahun === currentYear) {
            // Cek apakah sudah lewat tanggal 1 jam 06:00
            if (currentDay > 1 || (currentDay === 1 && currentHour >= 6)) {
                // Sudah lewat tanggal 1 jam 06:00 bulan ini
                // Tapi data final untuk bulan ini belum ada (masih diproses)
                return 'realtime';
            } else {
                // Masih tanggal 1 sebelum jam 06:00
                return 'realtime';
            }
        }
        
        // Jika periode SEBELUMNYA (sudah harus ada data final)
        try {
            const { data: finalData, error } = await supabase
                .from('penghasilan')
                .select('id, finalized_at')
                .eq('nama_karyawan', namaKaryawan)
                .eq('periode', periode)
                .not('finalized_at', 'is', null)
                .single();
            
            if (finalData && !error) {
                return 'final';
            } else {
                // Data final belum ada, tapi periode sudah lewat
                // Tampilkan real-time sebagai fallback
                return 'realtime';
            }
        } catch (tableError) {
            // Tabel penghasilan belum ada atau error
            return 'realtime';
        }
        
    } catch (error) {
        console.error('Error checking data source:', error);
        return 'realtime';
    }
}

// [8] Update badge sumber data
function updateDataSourceBadge(source) {
    const badge = document.getElementById('dataSourceBadge');
    const sourceText = document.getElementById('sourceText');
    
    if (!badge || !sourceText) return;
    
    if (source === 'final') {
        badge.style.background = 'linear-gradient(135deg, #4CAF50, #2E7D32)';
        badge.style.color = 'white';
        sourceText.textContent = 'Data Final';
        badge.title = 'Data sudah difinalkan per tanggal 1';
    } else {
        badge.style.background = 'linear-gradient(135deg, #FF9800, #F57C00)';
        badge.style.color = 'white';
        sourceText.textContent = 'Real-time';
        badge.title = 'Data real-time (akan berubah hingga tanggal 1)';
    }
}

// [9] Load data final dari tabel penghasilan
async function loadFinalSlipData(namaKaryawan, bulan, tahun) {
    const periode = `${bulan.toString().padStart(2, '0')}/${tahun}`;
    
    try {
        const { data: finalData, error } = await supabase
            .from('penghasilan')
            .select('*')
            .eq('nama_karyawan', namaKaryawan)
            .eq('periode', periode)
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                throw new Error('Data final tidak ditemukan untuk periode ini');
            } else {
                throw new Error(`Error loading final data: ${error.message}`);
            }
        }
        
        // Konversi JSONB fields
        if (finalData.adjustments && typeof finalData.adjustments === 'string') {
            try {
                finalData.adjustments = JSON.parse(finalData.adjustments);
            } catch (e) {
                finalData.adjustments = [];
            }
        }
        
        if (finalData.detail_harian && typeof finalData.detail_harian === 'string') {
            try {
                finalData.detail_harian = JSON.parse(finalData.detail_harian);
            } catch (e) {
                finalData.detail_harian = [];
            }
        }
        
        return {
            source: 'final',
            data: finalData,
            role: finalData.role || 'kasir'
        };
        
    } catch (error) {
        console.error('Error in loadFinalSlipData:', error);
        throw error;
    }
}

// [10] Hitung real-time slip gaji - DIPERBAIKI untuk semua perubahan
async function calculateRealTimeSlip(namaKaryawan, outlet, bulan, tahun) {
    console.log('Calculating real-time slip for:', { namaKaryawan, outlet, bulan, tahun });
    
    const monthStr = bulan.toString().padStart(2, '0');
    const yearStr = tahun.toString();
    
    // Untuk kolom DATE, gunakan range query (gte/lte)
    const startDate = `${yearStr}-${monthStr}-01`;
    const endDate = `${yearStr}-${monthStr}-31`;
    
    // Query semua data secara paralel
    const [
        absenData,
        komisiData,
        transaksiData,
        membercardData,
        kasData,
        outletTargetData,
        karyawanData,
        semuaKasirAbsen,
        omsetData,
        produkData // Tambah query produk untuk validasi komisi
    ] = await Promise.all([
        // 1. Data absensi (tanggal: TEXT)
        supabase
            .from('absen')
            .select('*')
            .eq('nama', namaKaryawan)
            .like('tanggal', `%/${monthStr}/${yearStr}`),
        
        // 2. Data komisi (tanggal: DATE) - HAPUS FILTER comission >= 5000
        supabase
            .from('komisi')
            .select('*')
            .eq('serve_by', namaKaryawan)
            .gte('tanggal', startDate)
            .lte('tanggal', endDate),
        
        // 3. Data transaksi produk - HAPUS FILTER comission >= 5000
        supabase
            .from('transaksi_detail')
            .select('*')
            .eq('serve_by', namaKaryawan)
            .eq('status', 'completed')
            .gte('order_date', startDate)
            .lte('order_date', endDate),
        
        // 4. Data membercard (tanggal_create: TEXT)
        supabase
            .from('membercard')
            .select('id_member, tanggal_create, kasir_create')
            .eq('kasir_create', namaKaryawan)
            .like('tanggal_create', `%/${monthStr}/${yearStr}`),
        
        // 5. Data kas (tanggal: DATE)
        supabase
            .from('kas')
            .select('fee_trf_setoran, tanggal, kasir')
            .eq('kasir', namaKaryawan)
            .gte('tanggal', startDate)
            .lte('tanggal', endDate),
        
        // 6. Data target outlet
        supabase
            .from('outlet')
            .select('target_weekdays, target_weekends, target_omset')
            .eq('outlet', outlet)
            .single(),
        
        // 7. Data karyawan lengkap
        supabase
            .from('karyawan')
            .select('gaji, posisi, role')
            .eq('nama_karyawan', namaKaryawan)
            .single(),
        
        // 8. Data semua kasir di outlet (tanggal: TEXT)
        supabase
            .from('absen')
            .select('nama, tanggal')
            .eq('outlet', outlet)
            .not('status_kehadiran', 'is', null)
            .not('status_kehadiran', 'eq', '')
            .like('tanggal', `%/${monthStr}/${yearStr}`),
        
        // 9. Data omset
        supabase
            .from('transaksi_order')
            .select('total_amount, harga_beli, status')
            .eq('outlet', outlet)
            .eq('status', 'completed')
            .gte('order_date', startDate)
            .lte('order_date', endDate),
        
        // 10. Data produk untuk validasi komisi >= 5000 (KASIR ONLY)
        supabase
            .from('produk')
            .select('nama_produk, komisi')
            .gte('komisi', 5000)
    ]);
    
    // Proses data
    const absenList = absenData.data || [];
    const komisiList = komisiData.data || [];
    const transaksiList = transaksiData.data || [];
    const membercardList = membercardData.data || [];
    const kasList = kasData.data || [];
    const target = outletTargetData.data || {};
    const karyawan = karyawanData.data || {};
    const semuaKasirList = semuaKasirAbsen.data || [];
    const omsetList = omsetData.data || [];
    const produkList = produkData.data || [];
    
    const role = karyawan.role || currentSlipKaryawan?.role || 'kasir';
    
    // Hitung berdasarkan role
    if (role === 'kasir' || role === 'owner') {
        return await calculateKasirSlip({
            namaKaryawan,
            outlet,
            bulan,
            tahun,
            absenList,
            komisiList,
            transaksiList,
            membercardList,
            kasList,
            target,
            karyawan,
            semuaKasirList,
            omsetList,
            produkList
        });
    } else if (role === 'barberman') {
        return await calculateBarbermanSlip({
            namaKaryawan,
            outlet,
            bulan,
            tahun,
            absenList,
            komisiList,
            transaksiList,
            target,
            karyawan
        });
    } else {
        throw new Error(`Role ${role} tidak didukung untuk slip gaji`);
    }
}

// [11] Hitung slip untuk KASIR - DIPERBAIKI sesuai permintaan
async function calculateKasirSlip(params) {
    const {
        namaKaryawan,
        outlet,
        bulan,
        tahun,
        absenList,
        komisiList,
        transaksiList,
        membercardList,
        kasList,
        target,
        karyawan,
        semuaKasirList,
        omsetList,
        produkList
    } = params;
    
    // 1. HITUNG HARI KERJA (PERBAIKAN: Exclude Izin, Libur case insensitive)
    const hariKerja = absenList.filter(a => {
        if (!a.status_kehadiran) return false;
        
        const statusLower = a.status_kehadiran.toLowerCase().trim();
        const excludedStatuses = ['', 'belum absen', 'izin', 'libur'];
        
        return !excludedStatuses.includes(statusLower);
    }).length;
    
    const gajiPerHari = karyawan.gaji || 0;
    const totalGaji = absenList.filter(a => {
        if (!a.status_kehadiran) return false;
        const statusLower = a.status_kehadiran.toLowerCase().trim();
        return !['', 'belum absen', 'izin', 'libur'].includes(statusLower);
    }).reduce((sum, a) => sum + (a.gaji_pokok || 0), 0);
    
    // 2. OVERTIME
    const totalOvertimeMenit = absenList.reduce((sum, a) => {
        if (a.over_time && a.over_time.includes(':')) {
            const [jam, menit] = a.over_time.split(':').map(Number);
            return sum + (jam * 60) + menit;
        }
        return sum;
    }, 0);
    
    const totalOvertimeRupiah = absenList.reduce((sum, a) => sum + (a.over_time_rp || 0), 0);
    
    // 3. PENJUALAN PRODUK & KOMISI (PERBAIKAN: Filter produk.komisi >= 5000)
    const produkDenganKomisiTinggi = new Set(
        produkList.filter(p => p.komisi >= 5000).map(p => p.nama_produk)
    );
    
    const transaksiProdukValid = transaksiList.filter(t => 
        t.item_name && produkDenganKomisiTinggi.has(t.item_name)
    );
    
    const penjualanProduk = transaksiProdukValid.reduce((sum, t) => sum + (t.qty || 0), 0);
    const komisiProduk = transaksiProdukValid.reduce((sum, t) => sum + (t.comission || 0), 0);
    
    // 4. MEMBERCARD
    const membercardCreated = membercardList.length;
    const komisiMembercard = membercardCreated * 500;
    
    // 5. UOP, TIPS QRIS, FEE TRANSFER
    const totalUOP = komisiList.reduce((sum, k) => sum + (k.uop || 0), 0);
    const totalTipsQRIS = komisiList.reduce((sum, k) => sum + (k.tips_qris || 0), 0);
    const totalFeeTransfer = kasList.reduce((sum, k) => sum + (k.fee_trf_setoran || 0), 0);
    
    // 6. TARGET & ACHIEVEMENT (PERBAIKAN: Hitung hanya hari yang ada absennya)
    const targetAchievement = await calculateTargetAchievement(
        namaKaryawan,
        outlet,
        bulan,
        tahun,
        membercardList,
        transaksiProdukValid, // Gunakan transaksi yang sudah difilter
        target,
        semuaKasirList,
        hariKerja,
        omsetList,
        absenList // Kirim absenList untuk hitung hari kerja aktual
    );
    
    // 7. ADJUSTMENT
    const adjustments = komisiList
        .filter(k => k.adjustment && k.adjustment_amount)
        .map(k => ({
            type: k.adjustment,
            amount: k.adjustment_amount
        }));
    
    const totalAdjustment = adjustments.reduce((sum, adj) => sum + (adj.amount || 0), 0);
    
    // 8. DETAIL HARIAN
    const detailHarian = calculateDetailHarian(
        absenList,
        komisiList,
        transaksiList,
        membercardList,
        kasList
    );
    
    // 9. SUB TOTAL & TOTAL
    const subTotalPenghasilan = totalGaji + totalOvertimeRupiah + komisiProduk + 
                               komisiMembercard + totalUOP + totalFeeTransfer + totalTipsQRIS;
    
    // PERBAIKAN: Sub total target hanya dari omset
    const subTotalTarget = (targetAchievement.bonus_omset || 0);
    
    const totalPenghasilan = subTotalPenghasilan + subTotalTarget + totalAdjustment;
    const penghasilanDiambil = komisiProduk;
    const takeHomePay = totalPenghasilan - penghasilanDiambil;
    
    return {
        source: 'realtime',
        role: 'kasir',
        data: {
            // Header
            nama_karyawan: namaKaryawan,
            outlet: outlet,
            posisi: karyawan.posisi || '-',
            periode: `${bulan.toString().padStart(2, '0')}/${tahun}`,
            
            // Summary
            hari_kerja: hariKerja,
            gaji_per_hari: gajiPerHari,
            total_gaji: totalGaji,
            overtime_menit: totalOvertimeMenit,
            overtime_rupiah: totalOvertimeRupiah,
            penjualan_produk: penjualanProduk,
            komisi_produk: komisiProduk,
            membercard_created: membercardCreated,
            komisi_membercard: komisiMembercard,
            uop: totalUOP,
            fee_transfer: totalFeeTransfer,
            tips_qris: totalTipsQRIS,
            sub_total_penghasilan: subTotalPenghasilan,
            
            // Target & Achievement
            target_membercard: targetAchievement.target_membercard,
            achievement_membercard: targetAchievement.achievement_membercard,
            status_membercard: targetAchievement.status_membercard,
            bonus_membercard: targetAchievement.bonus_membercard,
            target_produk: targetAchievement.target_produk,
            achievement_produk: targetAchievement.achievement_produk,
            status_produk: targetAchievement.status_produk,
            bonus_produk: targetAchievement.bonus_produk,
            target_omset: targetAchievement.target_omset,
            achievement_omset: targetAchievement.achievement_omset,
            status_omset: targetAchievement.status_omset,
            bonus_omset: targetAchievement.bonus_omset,
            sub_total_target: subTotalTarget,
            
            // Adjustment
            adjustments: adjustments,
            total_adjustment: totalAdjustment,
            
            // Totals
            total_penghasilan: totalPenghasilan,
            penghasilan_diambil: penghasilanDiambil,
            take_home_pay: takeHomePay,
            
            // Detail Harian
            detail_harian: detailHarian
        }
    };
}

// [12] Hitung slip untuk BARBERMAN - DIPERBAIKI
async function calculateBarbermanSlip(params) {
    const {
        namaKaryawan,
        outlet,
        bulan,
        tahun,
        absenList,
        komisiList,
        transaksiList,
        target,
        karyawan
    } = params;
    
    // 1. HARI KERJA (PERBAIKAN: Exclude Izin, Libur case insensitive)
    const hariKerja = absenList.filter(a => {
        if (!a.status_kehadiran) return false;
        
        const statusLower = a.status_kehadiran.toLowerCase().trim();
        const excludedStatuses = ['', 'belum absen', 'izin', 'libur'];
        
        return !excludedStatuses.includes(statusLower);
    }).length;
    
    // 2. UOP & TIPS QRIS
    const totalUOP = komisiList.reduce((sum, k) => sum + (k.uop || 0), 0);
    const totalTipsQRIS = komisiList.reduce((sum, k) => sum + (k.tips_qris || 0), 0);
    
    // 3. KOMISI & ITEM DETAIL (PERBAIKAN: Exclude item_group UOP dan Tips)
    const itemDetails = [];
    const komisiMap = {};
    
    // Filter transaksi: exclude item_group = 'UOP' atau 'Tips'
    const filteredTransaksi = transaksiList.filter(t => {
        const itemGroup = (t.item_group || '').toLowerCase();
        return !['uop', 'tips', 'tips qris'].includes(itemGroup);
    });
    
    // Group by item_name
    filteredTransaksi.forEach(t => {
        const itemName = t.item_name || 'Layanan';
        if (!komisiMap[itemName]) {
            komisiMap[itemName] = {
                item: itemName,
                qty: 0,
                komisi: 0
            };
        }
        komisiMap[itemName].qty += t.qty || 1;
        komisiMap[itemName].komisi += t.comission || 0;
    });
    
    // Convert to array
    Object.values(komisiMap).forEach(item => {
        itemDetails.push(item);
    });
    
    const totalKomisi = itemDetails.reduce((sum, item) => sum + (item.komisi || 0), 0);
    const subTotal = totalUOP + totalTipsQRIS + totalKomisi;
    
    // 4. ADJUSTMENT
    const adjustments = komisiList
        .filter(k => k.adjustment && k.adjustment_amount)
        .map(k => ({
            type: k.adjustment,
            amount: k.adjustment_amount
        }));
    
    const totalAdjustment = adjustments.reduce((sum, adj) => sum + (adj.amount || 0), 0);
    
    // 5. TARGET & ACHIEVEMENT (untuk barberman mungkin tidak ada)
    const targetAchievement = await calculateTargetAchievementBarberman(
        absenList,
        target
    );
    
    // 6. TOTAL
    const totalPenghasilan = subTotal + totalAdjustment;
    
    return {
        source: 'realtime',
        role: 'barberman',
        data: {
            // Header
            nama_karyawan: namaKaryawan,
            outlet: outlet,
            posisi: karyawan.posisi || '-',
            periode: `${bulan.toString().padStart(2, '0')}/${tahun}`,
            
            // Summary
            hari_kerja: hariKerja,
            uop: totalUOP,
            tips_qris: totalTipsQRIS,
            komisi: totalKomisi,
            sub_total: subTotal,
            
            // Item Details
            item_details: itemDetails,
            
            // Target (opsional untuk barberman)
            target_produk: targetAchievement.target_produk || 0,
            achievement_produk: targetAchievement.achievement_produk || 0,
            status_produk: targetAchievement.status_produk || 0,
            bonus_produk: targetAchievement.bonus_produk || '-',
            
            // Adjustment
            adjustments: adjustments,
            total_adjustment: totalAdjustment,
            
            // Totals
            total_penghasilan: totalPenghasilan
        }
    };
}

// [13] Fungsi helper: Hitung Target & Achievement untuk KASIR - DIPERBAIKI
async function calculateTargetAchievement(namaKaryawan, outlet, bulan, tahun, 
                                         membercardList, transaksiList, target, 
                                         semuaKasirList, hariKerjaKasir, omsetList,
                                         absenList) {
    
    const result = {
        target_membercard: 0,
        achievement_membercard: membercardList.length,
        status_membercard: 0,
        bonus_membercard: '-',
        
        target_produk: 0,
        achievement_produk: transaksiList.reduce((sum, t) => sum + (t.qty || 0), 0),
        status_produk: 0,
        bonus_produk: '-',
        
        target_omset: target.target_omset || 20000000,
        achievement_omset: 0,
        status_omset: 0,
        bonus_omset: 0,
        proporsi_kasir: 0
    };
    
    // 1. ANALISA HARI KERJA AKTUAL untuk hitung target
    const hariKerjaAktual = [];
    
    absenList.forEach(absen => {
        if (!absen.status_kehadiran || !absen.tanggal) return;
        
        const statusLower = absen.status_kehadiran.toLowerCase().trim();
        if (['', 'belum absen', 'izin', 'libur'].includes(statusLower)) return;
        
        // Parse tanggal dari format DD/MM/YYYY
        const [day, month, year] = absen.tanggal.split('/').map(Number);
        if (month === bulan && year === tahun) {
            const date = new Date(year, month - 1, day);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            
            hariKerjaAktual.push({
                tanggal: absen.tanggal,
                isWeekend: isWeekend,
                date: date
            });
        }
    });
    
    // 2. TARGET PRODUK (hanya hari yang ada absennya)
    let totalTargetProduk = 0;
    
    hariKerjaAktual.forEach(hari => {
        if (hari.isWeekend) {
            totalTargetProduk += target.target_weekends || 1.5;
        } else {
            totalTargetProduk += target.target_weekdays || 0.5;
        }
    });
    
    result.target_produk = totalTargetProduk;
    result.status_produk = result.target_produk > 0 ? 
        (result.achievement_produk / result.target_produk) * 100 : 0;
    
    // Bonus produk: "Hadiah Menarik" jika mencapai target (tanpa nilai)
    if (result.status_produk >= 100) {
        result.bonus_produk = 'Hadiah Menarik';
    }
    
    // 3. TARGET MEMBERCARD (2x target produk)
    result.target_membercard = result.target_produk * 2;
    result.status_membercard = result.target_membercard > 0 ? 
        (result.achievement_membercard / result.target_membercard) * 100 : 0;
    
    // Bonus membercard: "Hadiah Menarik" jika mencapai target (tanpa nilai)
    if (result.status_membercard >= 100) {
        result.bonus_membercard = 'Hadiah Menarik';
    }
    
    // 4. TARGET OMSET
    try {
        // Hitung omset bersih
        const totalOmsetKotor = omsetList.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        const totalHargaBeli = omsetList.reduce((sum, o) => sum + (o.harga_beli || 0), 0);
        result.achievement_omset = totalOmsetKotor - totalHargaBeli;
        
        result.status_omset = result.target_omset > 0 ? 
            (result.achievement_omset / result.target_omset) * 100 : 0;
        
        // Hitung proporsi hari kerja kasir
        const uniqueKasirDays = new Set(
            semuaKasirList.map(a => `${a.nama}-${a.tanggal}`)
        ).size;
        
        result.proporsi_kasir = uniqueKasirDays > 0 ? 
            hariKerjaKasir / uniqueKasirDays : 0;
        
        // Bonus omset 1% dari omset bersih * proporsi
        if (result.status_omset >= 100) {
            result.bonus_omset = result.achievement_omset * 0.01 * result.proporsi_kasir;
        }
    } catch (error) {
        console.error('Error calculating omset target:', error);
    }
    
    return result;
}

// Fungsi helper: Hitung Target & Achievement untuk BARBERMAN (simplified)
async function calculateTargetAchievementBarberman(absenList, target) {
    // Untuk barberman, hitung target berdasarkan hari kerja aktual juga
    const hariKerjaAktual = [];
    
    absenList.forEach(absen => {
        if (!absen.status_kehadiran || !absen.tanggal) return;
        
        const statusLower = absen.status_kehadiran.toLowerCase().trim();
        if (['', 'belum absen', 'izin', 'libur'].includes(statusLower)) return;
        
        // Parse tanggal dari format DD/MM/YYYY
        const [day, month, year] = absen.tanggal.split('/').map(Number);
        const date = new Date(year, month - 1, day);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        
        hariKerjaAktual.push({
            isWeekend: isWeekend
        });
    });
    
    // Hitung target produk
    let totalTargetProduk = 0;
    
    hariKerjaAktual.forEach(hari => {
        if (hari.isWeekend) {
            totalTargetProduk += target.target_weekends || 1.5;
        } else {
            totalTargetProduk += target.target_weekdays || 0.5;
        }
    });
    
    return {
        target_produk: totalTargetProduk,
        achievement_produk: 0, // Barberman tidak track achievement produk
        status_produk: 0,
        bonus_produk: '-'
    };
}

// [14] Fungsi helper: Hitung Detail Harian
function calculateDetailHarian(absenList, komisiList, transaksiList, membercardList, kasList) {
    // Group by date
    const dateMap = {};
    
    // Process absen
    absenList.forEach(a => {
        const dateKey = a.tanggal;
        if (!dateMap[dateKey]) {
            dateMap[dateKey] = {
                tanggal: dateKey,
                hari: a.hari,
                gaji: a.gaji_pokok || 0,
                uop: 0,
                komisi_produk: 0,
                komisi_membercard: 0,
                overtime: a.over_time_rp || 0,
                fee_trf: 0,
                tips_qris: 0,
                total: 0
            };
        }
    });
    
    // Process komisi
    komisiList.forEach(k => {
        // Convert YYYY-MM-DD to DD/MM/YYYY
        const dateParts = k.tanggal?.split('-');
        if (dateParts?.length === 3) {
            const dateKey = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
            
            if (!dateMap[dateKey]) {
                dateMap[dateKey] = {
                    tanggal: dateKey,
                    hari: getHariFromDate(k.tanggal),
                    gaji: 0,
                    uop: 0,
                    komisi_produk: 0,
                    komisi_membercard: 0,
                    overtime: 0,
                    fee_trf: 0,
                    tips_qris: 0,
                    total: 0
                };
            }
            
            dateMap[dateKey].uop += k.uop || 0;
            dateMap[dateKey].tips_qris += k.tips_qris || 0;
        }
    });
    
    // Process transaksi produk
    const transaksiByDate = {};
    transaksiList.forEach(t => {
        const dateStr = t.order_date;
        if (dateStr) {
            if (!transaksiByDate[dateStr]) {
                transaksiByDate[dateStr] = 0;
            }
            transaksiByDate[dateStr] += t.comission || 0;
        }
    });
    
    // Add produk komisi to dateMap
    Object.entries(transaksiByDate).forEach(([dateStr, komisi]) => {
        const dateParts = dateStr.split('-');
        if (dateParts.length === 3) {
            const dateKey = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
            
            if (!dateMap[dateKey]) {
                dateMap[dateKey] = {
                    tanggal: dateKey,
                    hari: getHariFromDate(dateStr),
                    gaji: 0,
                    uop: 0,
                    komisi_produk: 0,
                    komisi_membercard: 0,
                    overtime: 0,
                    fee_trf: 0,
                    tips_qris: 0,
                    total: 0
                };
            }
            
            dateMap[dateKey].komisi_produk += komisi;
        }
    });
    
    // Process membercard
    membercardList.forEach(m => {
        const dateKey = m.tanggal_create;
        if (dateKey && !dateMap[dateKey]) {
            dateMap[dateKey] = {
                tanggal: dateKey,
                hari: getHariFromDateDDMMYYYY(dateKey),
                gaji: 0,
                uop: 0,
                komisi_produk: 0,
                komisi_membercard: 0,
                overtime: 0,
                fee_trf: 0,
                tips_qris: 0,
                total: 0
            };
        }
        if (dateMap[dateKey]) {
            dateMap[dateKey].komisi_membercard += 500;
        }
    });
    
    // Process kas (fee transfer)
    kasList.forEach(k => {
        const dateStr = k.tanggal;
        if (dateStr) {
            const dateParts = dateStr.split('-');
            if (dateParts.length === 3) {
                const dateKey = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                
                if (!dateMap[dateKey]) {
                    dateMap[dateKey] = {
                        tanggal: dateKey,
                        hari: getHariFromDate(dateStr),
                        gaji: 0,
                        uop: 0,
                        komisi_produk: 0,
                        komisi_membercard: 0,
                        overtime: 0,
                        fee_trf: 0,
                        tips_qris: 0,
                        total: 0
                    };
                }
                
                dateMap[dateKey].fee_trf += k.fee_trf_setoran || 0;
            }
        }
    });
    
    // Calculate total for each date
    Object.values(dateMap).forEach(day => {
        day.total = day.gaji + day.uop + day.komisi_produk + 
                   day.komisi_membercard + day.overtime + 
                   day.fee_trf + day.tips_qris;
    });
    
    // Convert to array and sort by date
    return Object.values(dateMap)
        .sort((a, b) => {
            const [dayA, monthA, yearA] = a.tanggal.split('/').map(Number);
            const [dayB, monthB, yearB] = b.tanggal.split('/').map(Number);
            
            if (yearA !== yearB) return yearA - yearB;
            if (monthA !== monthB) return monthA - monthB;
            return dayA - dayB;
        });
}

// [15] Helper: Get hari from YYYY-MM-DD
function getHariFromDate(dateStr) {
    try {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('id-ID', { weekday: 'long' });
    } catch (e) {
        return '-';
    }
}

// [16] Helper: Get hari from DD/MM/YYYY
function getHariFromDateDDMMYYYY(dateStr) {
    try {
        const [day, month, year] = dateStr.split('/').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('id-ID', { weekday: 'long' });
    } catch (e) {
        return '-';
    }
}

// [17] Tampilkan data slip ke UI - DIPERBAIKI untuk perubahan bonus
function displaySlipData(slipData, dataSource) {
    const content = document.getElementById('slipContent');
    const emptyState = document.getElementById('emptySlip');
    
    // Hide loading
    showLoadingSlip(false);
    
    if (!slipData || !slipData.data) {
        content.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    // Tampilkan berdasarkan role DAN source
    if (dataSource === 'final') {
        // Data dari tabel penghasilan (sudah final)
        content.innerHTML = renderFinalSlip(slipData.data);
    } else if (slipData.role === 'kasir' || slipData.role === 'owner') {
        // Data real-time untuk kasir/owner
        content.innerHTML = renderKasirSlip(slipData.data, dataSource);
    } else if (slipData.role === 'barberman') {
        // Data real-time untuk barberman
        content.innerHTML = renderBarbermanSlip(slipData.data, dataSource);
    }
    
   // Setup UI events
    setTimeout(() => {
        setupSlipUIEvents(dataSource);
    }, 100);
    
    content.style.display = 'block';
    emptyState.style.display = 'none';
}

// Fungsi render untuk data final
function renderFinalSlip(data) {
    const isFinal = true;
    
    return `
        <div class="slip-container final-slip">
            <div class="final-banner">
                <i class="fas fa-lock"></i>
                <span>DATA FINAL - Tidak dapat diubah</span>
                <small>Difinalisasi pada: ${formatDateTime(data.finalized_at)}</small>
            </div>
            
            <!-- Gunakan renderKasirSlip dengan parameter final -->
            ${renderKasirSlip(data, 'final')}
        </div>
    `;
}

// Helper untuk format datetime
function formatDateTime(datetimeStr) {
    if (!datetimeStr) return '-';
    
    try {
        const date = new Date(datetimeStr);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return datetimeStr;
    }
}

// [18] Render slip untuk KASIR - DIPERBAIKI untuk perubahan bonus
function renderKasirSlip(data, dataSource) {
    const isFinal = dataSource === 'final';
    
    return `
        <div class="slip-container">
            <!-- Header Info -->
            <div class="slip-header-info">
                <div class="header-left">
                    <h3 class="margin-tight">SLIP PENGHASILAN</h3>
                    <div class="header-details">
                        <div class="detail-item">
                            <span class="detail-label">Nama:</span>
                            <span class="detail-value text-small">${data.nama_karyawan}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Posisi:</span>
                            <span class="detail-value text-small">${data.posisi}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Outlet:</span>
                            <span class="detail-value text-small">${data.outlet}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Periode:</span>
                            <span class="detail-value text-small">${data.periode}</span>
                        </div>
                    </div>
                </div>
                <div class="header-right">
                    <div class="status-badge ${isFinal ? 'status-final' : 'status-realtime'}">
                        <i class="fas ${isFinal ? 'fa-lock' : 'fa-sync-alt'}"></i>
                        ${isFinal ? 'Final' : 'Real-time'}
                    </div>
                </div>
            </div>
            
           <!-- Summary Table -->
            <section class="summary-table-section">
                <h4 class="section-title">
                    <i class="fas fa-calculator"></i> SUMMARY PENGHASILAN
                </h4>
                <div class="summary-table-container">
                    <table class="summary-table">
                       <tbody>
    <!-- BARIS 1: Kiri=Hari Kerja, Kanan=Penjualan Produk -->
    <tr>
        <td>Hari Kerja</td>
        <td class="summary-value-cell">${data.hari_kerja} Hari</td>
        <td>Penjualan Produk</td>
        <td class="summary-value-cell">${data.penjualan_produk} pcs</td>
    </tr>
    
    <!-- BARIS 2: Kiri=Gaji per Hari, Kanan=Komisi Produk -->
    <tr>
        <td>Gaji per Hari</td>
        <td class="summary-value-cell">${formatRupiah(data.gaji_per_hari)}</td>
        <td>Komisi Produk</td>
        <td class="summary-value-cell highlight">${formatRupiah(data.komisi_produk)}</td>
    </tr>
    
    <!-- BARIS 3: Kiri=Total Gaji, Kanan=Membercard Created -->
    <tr>
        <td>Total Gaji</td>
        <td class="summary-value-cell">${formatRupiah(data.total_gaji)}</td>
        <td>Membercard Created</td>
        <td class="summary-value-cell">${data.membercard_created} card</td>
    </tr>
    
    <!-- BARIS 4: Kiri=Over Time (menit), Kanan=Komisi Membercard -->
    <tr>
        <td>Over Time (menit)</td>
        <td class="summary-value-cell">${data.overtime_menit} menit</td>
        <td>Komisi Membercard</td>
        <td class="summary-value-cell">${formatRupiah(data.komisi_membercard)}</td>
    </tr>
    
    <!-- BARIS 5: Kiri=Over Time Rupiah, Kanan=Fee Transfer -->
    <tr>
        <td>Over Time Rupiah</td>
        <td class="summary-value-cell">${formatRupiah(data.overtime_rupiah)}</td>
        <td>Fee Transfer</td>
        <td class="summary-value-cell">${formatRupiah(data.fee_transfer)}</td>
    </tr>
    
    <!-- BARIS 6: Kiri=UOP, Kanan=Tips QRIS -->
    <tr>
        <td>UOP</td>
        <td class="summary-value-cell">${formatRupiah(data.uop)}</td>
        <td>Tips QRIS</td>
        <td class="summary-value-cell">${formatRupiah(data.tips_qris)}</td>
    </tr>
    
    <!-- BARIS 7: Sub Total (full width) -->
    <tr class="summary-total-row">
        <td colspan="3"><strong>Sub Total Penghasilan</strong></td>
        <td class="summary-value-cell"><strong>${formatRupiah(data.sub_total_penghasilan)}</strong></td>
    </tr>
</tbody>
                    </table>
                </div>
            </section>
            
            <!-- Target & Achievement -->
            <section class="target-section">
                <h4 class="section-title">
                    <i class="fas fa-bullseye"></i> TARGET & ACHIEVEMENT
                </h4>
                <div class="target-table-container">
                    <table class="target-table">
                        <thead>
                            <tr>
                                <th>KPI</th>
                                <th>Target</th>
                                <th>Actual</th>
                                <th>Status</th>
                                <th>Bonus</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="text-small">Membercard</td>
                                <td class="text-small">${data.target_membercard?.toFixed(1) || 0}</td>
                                <td class="text-small">${data.achievement_membercard || 0}</td>
                                <td class="status-cell ${getStatusColor(data.status_membercard || 0)} text-xs">
                                    ${(data.status_membercard || 0).toFixed(1)}%
                                </td>
                                <td class="text-small">
                                    ${data.bonus_membercard || '-'}
                                </td>
                            </tr>
                            <tr>
                                <td class="text-small">Produk</td>
                                <td class="text-small">${data.target_produk?.toFixed(1) || 0}</td>
                                <td class="text-small">${data.achievement_produk || 0}</td>
                                <td class="status-cell ${getStatusColor(data.status_produk || 0)} text-xs">
                                    ${(data.status_produk || 0).toFixed(1)}%
                                </td>
                                <td class="text-small">
                                    ${data.bonus_produk || '-'}
                                </td>
                            </tr>
                            <tr>
                                <td class="text-small">Omset</td>
                                <td class="text-small">${formatRupiahShort(data.target_omset || 0)}</td>
                                <td class="text-small">${formatRupiahShort(data.achievement_omset || 0)}</td>
                                <td class="status-cell ${getStatusColor(data.status_omset || 0)} text-xs">
                                    ${(data.status_omset || 0).toFixed(1)}%
                                </td>
                                <td class="text-small">${formatRupiahShort(data.bonus_omset || 0)}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr class="summary-total-row">
                                <td colspan="4" class="text-right text-small"><strong>Sub Total Bonus:</strong></td>
                                <td class="text-small"><strong>${formatRupiahShort(data.bonus_omset || 0)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </section>
            
            <!-- Adjustment -->
            <section class="adjustment-section">
                <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 class="section-title" style="margin: 0;">
                        <i class="fas fa-adjust"></i> ADJUSTMENT
                    </h4>
                    ${isOwnerSlip && !isFinal ? `
                    <button class="btn-add-adjustment" id="addAdjustmentBtn">
                        <i class="fas fa-plus"></i> Tambah
                    </button>
                    ` : ''}
                </div>
                
                <div class="adjustment-container">
                    ${data.adjustments && data.adjustments.length > 0 ? `
                    <table class="adjustment-table">
                        <thead>
                            <tr>
                                <th>Jenis</th>
                                <th>Amount</th>
                                ${isOwnerSlip && !isFinal ? '<th style="width: 70px;">Aksi</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
                            ${data.adjustments.map((adj, index) => `
                            <tr data-index="${index}">
                                <td class="text-small">${adj.type || '-'}</td>
                                <td class="text-small ${adj.amount < 0 ? 'text-danger' : 'text-success'}">
                                    ${formatRupiahShort(adj.amount || 0)}
                                </td>
                                ${isOwnerSlip && !isFinal ? `
                                <td>
                                    <button class="btn-edit-adj" data-index="${index}" title="Edit" style="padding: 4px; font-size: 0.8rem;">
                                        <i class="fas fa-edit fa-sm"></i>
                                    </button>
                                    <button class="btn-delete-adj" data-index="${index}" title="Hapus" style="padding: 4px; font-size: 0.8rem;">
                                        <i class="fas fa-trash fa-sm"></i>
                                    </button>
                                </td>
                                ` : ''}
                            </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="summary-total-row">
                                <td class="text-small"><strong>Total Adjustment:</strong></td>
                                <td colspan="${isOwnerSlip && !isFinal ? '2' : '1'}" class="text-small">
                                    <strong class="${data.total_adjustment < 0 ? 'text-danger' : 'text-success'}">
                                        ${formatRupiahShort(data.total_adjustment || 0)}
                                    </strong>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                    ` : `
                    <div class="no-adjustment">
                        <i class="fas fa-info-circle"></i>
                        <p class="text-small">Tidak ada adjustment</p>
                    </div>
                    `}
                </div>
            </section>
            
            <!-- Total Penghasilan -->
            <section class="total-section">
                <div class="total-compact-grid">
                    <div class="total-item-compact">
                        <span class="total-label">Total Penghasilan</span>
                        <span class="total-value highlight">${formatRupiah(data.total_penghasilan || 0)}</span>
                    </div>
                    <div class="total-item-compact">
                        <span class="total-label">Penghasilan Diambil</span>
                        <span class="total-value text-danger">${formatRupiah(data.penghasilan_diambil || 0)}</span>
                    </div>
                    <div class="total-item-compact grand-total">
                        <span class="total-label">TAKE HOME PAY</span>
                        <span class="total-value">${formatRupiah(data.take_home_pay || 0)}</span>
                    </div>
                </div>
            </section>
            
            <!-- Detail Harian (Toggle) -->
            <section class="detail-section" id="detailSection">
                <div class="detail-header" id="toggleDetail">
                    <h4>
                        <i class="fas fa-calendar-alt"></i> DETAIL HARIAN
                        <span class="badge-count" style="background: #4CAF50; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; margin-left: 8px;">
                            ${data.detail_harian?.length || 0} hari
                        </span>
                    </h4>
                    <span class="detail-toggle">
                        <i class="fas fa-chevron-down"></i>
                        <span class="toggle-text" style="font-size: 0.8rem; color: #666;">Klik untuk lihat</span>
                    </span>
                </div>
                <div class="detail-content" id="detailContent">
                    ${data.detail_harian && data.detail_harian.length > 0 ? `
                    <div class="detail-table-container">
                <table class="detail-table">
                <thead>
               <tr>
                <th>Tanggal</th>
                <th>Hari</th>
                <th>Gaji</th>
                <th>UoP</th>
                <th>Komisi</th>
                <th>Member</th>
                <th>O/T</th>
                <th>Fee</th>
                <th>Tips</th>
                <th>Total</th>
            </tr>
        </thead>
                            <tbody>
                                ${data.detail_harian.map(day => `
                                <tr>
                                    <td class="text-xs">${day.tanggal || '-'}</td>
                                    <td class="text-xs">${day.hari?.substring(0, 3) || '-'}</td>
                                    <td class="text-xs">${formatRupiahShort(day.gaji || 0)}</td>
                                    <td class="text-xs">${formatRupiahShort(day.uop || 0)}</td>
                                    <td class="text-xs">${formatRupiahShort(day.komisi_produk || 0)}</td>
                                    <td class="text-xs">${formatRupiahShort(day.komisi_membercard || 0)}</td>
                                    <td class="text-xs">${formatRupiahShort(day.overtime || 0)}</td>
                                    <td class="text-xs">${formatRupiahShort(day.fee_trf || 0)}</td>
                                    <td class="text-xs">${formatRupiahShort(day.tips_qris || 0)}</td>
                                    <td class="text-xs" style="font-weight: 600; color: #4CAF50;">
                                        ${formatRupiahShort(day.total || 0)}
                                    </td>
                                </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr style="background: #f8f9ff;">
                                    <td colspan="9" class="text-right text-small" style="font-weight: 600;">
                                        Total Harian:
                                    </td>
                                    <td class="text-xs" style="font-weight: 700; color: #2E7D32;">
                                        ${formatRupiahShort(data.detail_harian.reduce((sum, day) => sum + (day.total || 0), 0))}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    ` : `
                    <div class="no-data" style="text-align: center; padding: 20px; color: #999; background: #f9f9f9; border-radius: 8px;">
                        <i class="fas fa-calendar-times" style="font-size: 2rem; margin-bottom: 10px;"></i>
                        <p style="font-size: 0.9rem;">Tidak ada data harian untuk periode ini</p>
                    </div>
                    `}
                </div>
            </section>
            
            <!-- Save Button -->
            <div class="save-section">
                <button class="btn-save" id="saveSlipBtn">
                    <i class="fas fa-camera"></i> Save Screen Capture
                </button>
            </div>
        </div>
    `;
}

// [19] Render slip untuk BARBERMAN - DIPERBAIKI untuk item detail
function renderBarbermanSlip(data, dataSource) {
    const isFinal = dataSource === 'final';
    
    return `
        <div class="slip-container barberman-slip">
            <!-- Header Info -->
            <div class="slip-header-info">
                <div class="header-left">
                    <h3 class="margin-tight">SLIP BARBERMAN</h3>
                    <div class="header-details">
                        <div class="detail-item">
                            <span class="detail-label">Nama:</span>
                            <span class="detail-value text-small">${data.nama_karyawan}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Posisi:</span>
                            <span class="detail-value text-small">${data.posisi}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Outlet:</span>
                            <span class="detail-value text-small">${data.outlet}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Periode:</span>
                            <span class="detail-value text-small">${data.periode}</span>
                        </div>
                    </div>
                </div>
                <div class="header-right">
                    <div class="status-badge ${isFinal ? 'status-final' : 'status-realtime'}">
                        <i class="fas ${isFinal ? 'fa-lock' : 'fa-sync-alt'}"></i>
                        ${isFinal ? 'Final' : 'Real-time'}
                    </div>
                </div>
            </div>
            
            <!-- Summary Table -->
            <section class="summary-table-section">
                <h4 class="section-title">
                    <i class="fas fa-calculator"></i> SUMMARY PENGHASILAN
                </h4>
                <div class="summary-table-container">
                    <table class="summary-table">
                        <tbody>
                            <tr>
                                <td>Hari Kerja</td>
                                <td class="summary-value-cell">${data.hari_kerja} Hari</td>
                                <td>UOP</td>
                                <td class="summary-value-cell">${formatRupiah(data.uop)}</td>
                            </tr>
                            <tr>
                                <td>Tips QRIS</td>
                                <td class="summary-value-cell">${formatRupiah(data.tips_qris)}</td>
                                <td>Komisi</td>
                                <td class="summary-value-cell highlight">${formatRupiah(data.komisi)}</td>
                            </tr>
                            <tr class="summary-total-row">
                                <td colspan="3"><strong>Sub Total</strong></td>
                                <td class="summary-value-cell"><strong>${formatRupiah(data.sub_total || 0)}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
            
            <!-- Item Details -->
            <section class="target-section">
                <h4 class="section-title">
                    <i class="fas fa-list"></i> DETAIL ITEM (Exclude UOP & Tips)
                </h4>
                <div class="target-table-container">
                    ${data.item_details && data.item_details.length > 0 ? `
                    <table class="target-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Komisi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.item_details.map(item => `
                            <tr>
                                <td class="text-small">${item.item}</td>
                                <td class="text-small">${item.qty}</td>
                                <td class="text-small">${formatRupiahShort(item.komisi)}</td>
                            </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="summary-total-row">
                                <td colspan="2" class="text-right text-small"><strong>Total Komisi:</strong></td>
                                <td class="text-small"><strong>${formatRupiahShort(data.komisi || 0)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                    ` : `
                    <div class="no-adjustment">
                        <i class="fas fa-box-open"></i>
                        <p class="text-small">Tidak ada data item</p>
                    </div>
                    `}
                </div>
            </section>
            
            <!-- Adjustment -->
            <section class="adjustment-section">
                <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 class="section-title" style="margin: 0;">
                        <i class="fas fa-adjust"></i> ADJUSTMENT
                    </h4>
                    ${isOwnerSlip && !isFinal ? `
                    <button class="btn-add-adjustment" id="addAdjustmentBtn">
                        <i class="fas fa-plus"></i> Tambah
                    </button>
                    ` : ''}
                </div>
                
                <div class="adjustment-container">
                    ${data.adjustments && data.adjustments.length > 0 ? `
                    <table class="adjustment-table">
                        <thead>
                            <tr>
                                <th>Jenis</th>
                                <th>Amount</th>
                                ${isOwnerSlip && !isFinal ? '<th style="width: 70px;">Aksi</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
                            ${data.adjustments.map((adj, index) => `
                            <tr>
                                <td class="text-small">${adj.type || '-'}</td>
                                <td class="text-small ${adj.amount < 0 ? 'text-danger' : 'text-success'}">
                                    ${formatRupiahShort(adj.amount || 0)}
                                </td>
                                ${isOwnerSlip && !isFinal ? `
                                <td>
                                    <button class="btn-edit-adj" data-index="${index}" title="Edit" style="padding: 4px; font-size: 0.8rem;">
                                        <i class="fas fa-edit fa-sm"></i>
                                    </button>
                                    <button class="btn-delete-adj" data-index="${index}" title="Hapus" style="padding: 4px; font-size: 0.8rem;">
                                        <i class="fas fa-trash fa-sm"></i>
                                    </button>
                                </td>
                                ` : ''}
                            </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="summary-total-row">
                                <td class="text-small"><strong>Total Adjustment:</strong></td>
                                <td colspan="${isOwnerSlip && !isFinal ? '2' : '1'}" class="text-small">
                                    <strong class="${data.total_adjustment < 0 ? 'text-danger' : 'text-success'}">
                                        ${formatRupiahShort(data.total_adjustment || 0)}
                                    </strong>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                    ` : `
                    <div class="no-adjustment">
                        <i class="fas fa-info-circle"></i>
                        <p class="text-small">Tidak ada adjustment</p>
                    </div>
                    `}
                </div>
            </section>
            
            <!-- Total -->
            <section class="total-section">
                <div class="total-compact-grid">
                    <div class="total-item-compact grand-total">
                        <span class="total-label">TOTAL PENGHASILAN</span>
                        <span class="total-value">${formatRupiah(data.total_penghasilan || 0)}</span>
                    </div>
                </div>
            </section>
            
            <!-- Save Button -->
            <div class="save-section">
                <button class="btn-save" id="saveSlipBtn">
                    <i class="fas fa-camera"></i> Save Screen Capture
                </button>
            </div>
        </div>
    `;
}

// [20] Setup UI events - DIPERBAIKI
function setupSlipUIEvents(dataSource) {
    console.log('setupSlipUIEvents called with dataSource:', dataSource);
    
    // Toggle Detail Harian
    const toggleDetail = document.getElementById('toggleDetail');
    const detailContent = document.getElementById('detailContent');
    
    if (toggleDetail && detailContent) {
        // Reset state setiap render
        detailContent.classList.remove('expanded');
        const toggleIcon = toggleDetail.querySelector('.detail-toggle i');
        const toggleText = toggleDetail.querySelector('.toggle-text');
        
        if (toggleIcon) toggleIcon.className = 'fas fa-chevron-down';
        if (toggleText) toggleText.textContent = 'Klik untuk lihat';
        
        toggleDetail.addEventListener('click', () => {
            const isExpanded = detailContent.classList.contains('expanded');
            
            if (isExpanded) {
                // Collapse
                detailContent.classList.remove('expanded');
                toggleDetail.querySelector('.detail-toggle').classList.remove('rotated');
                
                if (toggleIcon) {
                    toggleIcon.className = 'fas fa-chevron-down';
                }
                if (toggleText) {
                    toggleText.textContent = 'Klik untuk lihat';
                    toggleText.style.color = '#666';
                }
                
                // Scroll ke section detail
                toggleDetail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                // Expand
                detailContent.classList.add('expanded');
                toggleDetail.querySelector('.detail-toggle').classList.add('rotated');
                
                if (toggleIcon) {
                    toggleIcon.className = 'fas fa-chevron-up';
                }
                if (toggleText) {
                    toggleText.textContent = 'Klik untuk sembunyikan';
                    toggleText.style.color = '#4CAF50';
                }
                
                // Scroll ke tabel
                setTimeout(() => {
                    detailContent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 300);
            }
        });
        
        // Tambah hover effect
        toggleDetail.addEventListener('mouseenter', () => {
            toggleDetail.style.background = '#e8f5e9';
        });
        
        toggleDetail.addEventListener('mouseleave', () => {
            if (!detailContent.classList.contains('expanded')) {
                toggleDetail.style.background = '#f5f5f5';
            }
        });
    }
    
    // Save Screen Capture
    const saveBtn = document.getElementById('saveSlipBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveSlipCapture);
    }
    
    // Setup adjustment buttons jika ada
    const isFinal = dataSource === 'final';
    const slipContainer = document.querySelector('.slip-container');
    
    if (slipContainer) {
        const hasFinalClass = slipContainer.classList.contains('final-slip');
        const shouldShowAdjustment = !isFinal && !hasFinalClass;
        
        if (window.isOwnerSlip && shouldShowAdjustment) {
            console.log('Setting up adjustment buttons for owner');
            setupAdjustmentButtons();
        }
    }
    
    // Setup event delegation sebagai fallback
    setupEventDelegation();
}

// Helper: Event delegation untuk handle dynamic buttons
function setupEventDelegation() {
    // Hapus listener lama jika ada
    if (window._slipEventDelegationHandler) {
        document.removeEventListener('click', window._slipEventDelegationHandler);
    }
    
    // Buat handler baru
    const clickHandler = function(e) {
        // Tombol Tambah Adjustment
        if (e.target.id === 'addAdjustmentBtn' || e.target.closest('#addAdjustmentBtn')) {
            console.log('Event delegation: Add adjustment button clicked');
            e.preventDefault();
            e.stopPropagation();
            
            if (typeof showAddAdjustmentModal === 'function') {
                showAddAdjustmentModal();
            }
            return false;
        }
        
        // Tombol Edit Adjustment
        if (e.target.classList.contains('btn-edit-adj') || e.target.closest('.btn-edit-adj')) {
            const btn = e.target.closest('.btn-edit-adj');
            const index = btn?.dataset?.index;
            if (index !== undefined && typeof showEditAdjustmentModal === 'function') {
                e.preventDefault();
                e.stopPropagation();
                showEditAdjustmentModal(parseInt(index));
                return false;
            }
        }
        
        // Tombol Delete Adjustment
        if (e.target.classList.contains('btn-delete-adj') || e.target.closest('.btn-delete-adj')) {
            const btn = e.target.closest('.btn-delete-adj');
            const index = btn?.dataset?.index;
            if (index !== undefined && typeof deleteAdjustment === 'function') {
                e.preventDefault();
                e.stopPropagation();
                
                if (confirm('Hapus adjustment ini?')) {
                    deleteAdjustment(parseInt(index));
                }
                return false;
            }
        }
        
        // Tombol Retry Error
        if (e.target.id === 'retrySlip' || e.target.closest('#retrySlip')) {
            e.preventDefault();
            e.stopPropagation();
            
            const bulan = parseInt(document.getElementById('selectBulan').value);
            const tahun = parseInt(document.getElementById('selectTahun').value);
            
            if (typeof loadSlipData === 'function') {
                loadSlipData(bulan, tahun);
            }
            return false;
        }
    };
    
    // Simpan reference untuk bisa di-remove nanti
    window._slipEventDelegationHandler = clickHandler;
    
    // Pasang listener dengan capture phase (lebih reliable)
    document.addEventListener('click', clickHandler, true);
}

// Setup adjustment buttons
function setupAdjustmentButtons() {
    console.log('setupAdjustmentButtons called');
    
    // 1. TOMBOL TAMBAH ADJUSTMENT
    const addBtn = document.getElementById('addAdjustmentBtn');
    if (addBtn) {
        console.log('Found add adjustment button, setting up...');
        
        // Clone tombol untuk reset event listeners
        const newBtn = addBtn.cloneNode(true);
        addBtn.parentNode.replaceChild(newBtn, addBtn);
        
        // Dapatkan tombol baru
        const freshBtn = document.getElementById('addAdjustmentBtn');
        
        // Tambah onclick attribute
        freshBtn.setAttribute('onclick', `
            event.preventDefault();
            event.stopPropagation();
            console.log('Add adjustment button clicked (inline onclick)');
            if (typeof showAddAdjustmentModal === 'function') {
                showAddAdjustmentModal();
            } else if (typeof window.showAddAdjustmentModal === 'function') {
                window.showAddAdjustmentModal();
            } else {
                console.error('showAddAdjustmentModal function not found!');
                alert('Error: Fungsi modal tidak ditemukan');
            }
            return false;
        `);
        
        // Juga tambah event listener sebagai backup
        freshBtn.addEventListener('click', function(e) {
            console.log('Add adjustment button clicked (addEventListener)');
            e.preventDefault();
            e.stopImmediatePropagation();
        }, true);
        
        // Visual feedback
        freshBtn.style.cursor = 'pointer';
        freshBtn.title = 'Klik untuk menambah adjustment';
        
        console.log('✅ Add adjustment button setup complete');
    } else {
        console.warn('Add adjustment button not found in setupAdjustmentButtons');
    }
    
    // 2. TOMBOL EDIT ADJUSTMENT
    const editBtns = document.querySelectorAll('.btn-edit-adj');
    console.log(`Found ${editBtns.length} edit buttons`);
    
    editBtns.forEach((btn, index) => {
        const dataIndex = btn.dataset.index;
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.setAttribute('onclick', `
            event.preventDefault();
            event.stopPropagation();
            console.log('Edit adjustment button ${dataIndex} clicked');
            if (typeof showEditAdjustmentModal === 'function') {
                showEditAdjustmentModal(${dataIndex});
            }
            return false;
        `);
    });
    
    // 3. TOMBOL DELETE ADJUSTMENT
    const deleteBtns = document.querySelectorAll('.btn-delete-adj');
    console.log(`Found ${deleteBtns.length} delete buttons`);
    
    deleteBtns.forEach((btn, index) => {
        const dataIndex = btn.dataset.index;
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.setAttribute('onclick', `
            event.preventDefault();
            event.stopPropagation();
            console.log('Delete adjustment button ${dataIndex} clicked');
            if (confirm('Hapus adjustment ini?')) {
                if (typeof deleteAdjustment === 'function') {
                    deleteAdjustment(${dataIndex});
                }
            }
            return false;
        `);
    });
    
    console.log('✅ All adjustment buttons setup complete');
}

// [21] Fungsi untuk save screen capture
function saveSlipCapture() {
    try {
        // Hide elements yang tidak ingin di-capture
        const elementsToHide = [
            document.querySelector('.detail-section'),
            document.querySelector('.save-section'),
            document.querySelector('.slip-filter-section'),
            document.querySelector('.slip-header')
        ];
        
        const originalDisplay = [];
        elementsToHide.forEach(el => {
            if (el) {
                originalDisplay.push({
                    element: el,
                    display: el.style.display
                });
                el.style.display = 'none';
            }
        });
        
        // Ambil element slip container
        const slipContainer = document.querySelector('.slip-container');
        if (!slipContainer) {
            throw new Error('Slip container tidak ditemukan');
        }
        
        // Gunakan html2canvas untuk capture
        if (typeof html2canvas === 'undefined') {
            alert('Sedang memuat library capture...');
            loadHtml2CanvasLibrary().then(() => {
                captureAndSave(slipContainer, originalDisplay);
            });
        } else {
            captureAndSave(slipContainer, originalDisplay);
        }
        
    } catch (error) {
        console.error('Error capturing slip:', error);
        alert('Gagal menyimpan slip: ' + error.message);
        restoreHiddenElements(originalDisplay);
    }
}

async function captureAndSave(slipContainer, originalDisplay) {
    try {
        // Tampilkan loading
        const saveBtn = document.getElementById('saveSlipBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        
        // Capture menggunakan html2canvas
        const canvas = await html2canvas(slipContainer, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false
        });
        
        // Convert ke blob
        canvas.toBlob((blob) => {
            if (!blob) {
                throw new Error('Gagal membuat blob dari canvas');
            }
            
            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // Generate filename
            const slipData = currentSlipKaryawan;
            const bulan = document.getElementById('selectBulan').value;
            const tahun = document.getElementById('selectTahun').value;
            const filename = `Slip_${slipData?.nama_karyawan || 'karyawan'}_${bulan}_${tahun}_${new Date().getTime()}.png`;
            
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            // Restore button
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
            
            // Restore hidden elements
            restoreHiddenElements(originalDisplay);
            
            // Show success message
            alert('Slip berhasil disimpan sebagai gambar!');
            
        }, 'image/png');
        
    } catch (error) {
        console.error('Error in captureAndSave:', error);
        alert('Gagal menyimpan: ' + error.message);
        
        // Restore button
        const saveBtn = document.getElementById('saveSlipBtn');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-camera"></i> Save Screen Capture';
        }
        
        // Restore hidden elements
        restoreHiddenElements(originalDisplay);
    }
}

function restoreHiddenElements(originalDisplay) {
    originalDisplay.forEach(item => {
        if (item.element) {
            item.element.style.display = item.display;
        }
    });
}

// [22] Load html2canvas library
function loadHtml2CanvasLibrary() {
    return new Promise((resolve, reject) => {
        if (typeof html2canvas !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.integrity = 'sha512-BNaRQnYJYiPSqHHDb58B0yaPfCu+Wgds8Gp/gU33kqBtgNS4tSPHuGibyoeqMV/TJlSKda6FXzoEyYGjTe+vXA==';
        script.crossOrigin = 'anonymous';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// [23] Helper Functions
function showLoadingSlip(show) {
    const loading = document.getElementById('loadingSlip');
    const content = document.getElementById('slipContent');
    const empty = document.getElementById('emptySlip');
    
    if (show) {
        loading.style.display = 'flex';
        content.style.display = 'none';
        empty.style.display = 'none';
    } else {
        loading.style.display = 'none';
    }
}

function showErrorSlip(message) {
    const content = document.getElementById('slipContent');
    content.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Terjadi Kesalahan</h3>
            <p>${message}</p>
            <button class="btn-retry" id="retrySlip" style="margin-top: 15px; padding: 8px 20px; background: #4CAF50; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
                <i class="fas fa-redo"></i> Coba Lagi
            </button>
        </div>
    `;
    content.style.display = 'block';
    
    document.getElementById('retrySlip').addEventListener('click', async () => {
        const bulan = parseInt(document.getElementById('selectBulan').value);
        const tahun = parseInt(document.getElementById('selectTahun').value);
        await loadSlipData(bulan, tahun);
    });
}

function formatRupiah(amount) {
    if (amount === 0 || !amount) return 'Rp 0';
    return 'Rp ' + amount.toLocaleString('id-ID');
}

function formatRupiahShort(amount) {
    if (amount === 0 || !amount) return 'Rp 0';
    
    if (Math.abs(amount) < 1000000) {
        return 'Rp ' + amount.toLocaleString('id-ID');
    }
    
    if (Math.abs(amount) >= 1000000000) {
        return 'Rp ' + (amount / 1000000000).toFixed(1).replace('.', ',') + 'M';
    }
    
    if (Math.abs(amount) >= 1000000) {
        return 'Rp ' + (amount / 1000000).toFixed(1).replace('.', ',') + 'jt';
    }
    
    return 'Rp ' + amount.toLocaleString('id-ID');
}

// Helper untuk mendapatkan outlet dari karyawan
async function getOutletByKaryawan(namaKaryawan) {
    try {
        const { data, error } = await supabase
            .from('karyawan')
            .select('outlet')
            .eq('nama_karyawan', namaKaryawan)
            .single();
            
        if (error) {
            console.error('Error getting outlet for', namaKaryawan, ':', error);
            return currentUserOutletSlip || 'Outlet Tidak Diketahui';
        }
        
        return data?.outlet || currentUserOutletSlip || 'Outlet Tidak Diketahui';
    } catch (error) {
        console.error('Error getting outlet:', error);
        return currentUserOutletSlip || 'Outlet Tidak Diketahui';
    }
}

function getStatusColor(percentage) {
    if (percentage >= 100) return 'status-achieved';
    if (percentage >= 80) return 'status-good';
    if (percentage >= 60) return 'status-warning';
    return 'status-failed';
}

function parseAmountFromRupiah(rupiahString) {
    if (!rupiahString) return 0;
    
    // Remove "Rp", dots, spaces, and convert to number
    const cleanString = rupiahString
        .replace('Rp', '')
        .replace(/\./g, '')
        .replace(',', '.')
        .trim();
    
    return parseFloat(cleanString) || 0;
}

// [25] Modal untuk tambah/edit adjustment
function showAddAdjustmentModal() {
    showAdjustmentModal(null);
}

function showEditAdjustmentModal(index) {
    // Ambil data adjustment dari UI
    const adjustmentRows = document.querySelectorAll('tr[data-index]');
    const row = adjustmentRows[index];
    
    if (!row) return;
    
    const type = row.querySelector('td:nth-child(1)').textContent.trim();
    const amountText = row.querySelector('td:nth-child(2)').textContent.trim();
    
    // Parse amount dari string "Rp xxx.xxx"
    const amount = parseAmountFromRupiah(amountText);
    
    // Untuk edit, kita butuh tanggal asli dari database
    const bulan = parseInt(document.getElementById('selectBulan').value);
    const tahun = parseInt(document.getElementById('selectTahun').value);
    
    // Format tanggal: tanggal 1 bulan berjalan
    const tanggal = `${tahun}-${bulan.toString().padStart(2, '0')}-01`;
    
    showAdjustmentModal({ index, type, amount, tanggal });
}

function showAdjustmentModal(adjustmentData) {
    // Hapus modal sebelumnya jika ada
    const existingModal = document.getElementById('adjustmentModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const isEditMode = adjustmentData !== null;
    const bulan = parseInt(document.getElementById('selectBulan').value);
    const tahun = parseInt(document.getElementById('selectTahun').value);
    
    // Hitung tanggal range untuk info
    const daysInMonth = new Date(tahun, bulan, 0).getDate();
    
    // Format tanggal default: YYYY-MM-DD
    const defaultDate = adjustmentData?.tanggal || `${tahun}-${bulan.toString().padStart(2, '0')}-01`;
    
    // Buat modal HTML dengan input tanggal
    const modalHTML = `
        <div class="adjustment-modal ${isEditMode ? 'edit-mode' : 'add-mode'}" id="adjustmentModal">
            <div class="adjustment-modal-content">
                <div class="modal-header">
                    <h3>
                        <i class="fas fa-${isEditMode ? 'edit' : 'plus'}"></i>
                        ${isEditMode ? 'Edit Adjustment' : 'Tambah Adjustment'}
                    </h3>
                    <button class="close-modal" id="closeAdjustmentModal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
               <div class="form-group">
    <label for="adjustmentDate">
        <i class="fas fa-calendar-alt"></i> Tanggal Adjustment
    </label>
    
    <input type="date" 
           id="adjustmentDate" 
           class="form-input date-input"
           value="${defaultDate}"
           min="${tahun}-${bulan.toString().padStart(2, '0')}-01"
           max="${tahun}-${bulan.toString().padStart(2, '0')}-${daysInMonth.toString().padStart(2, '0')}"
           style="width: 100%; padding: 12px; font-size: 1rem;">
</div>
                    
                    <div class="form-group">
                        <label for="adjustmentType">
                            <i class="fas fa-tag"></i> Jenis Adjustment
                        </label>
                        <select id="adjustmentType" class="form-select">
                            <option value="">Pilih Jenis</option>
                            <option value="Fee Trainer" ${adjustmentData?.type === 'Fee Trainer' ? 'selected' : ''}>Fee Trainer</option>
                            <option value="Fee Backup" ${adjustmentData?.type === 'Fee Backup' ? 'selected' : ''}>Fee Backup</option>
                            <option value="Denda" ${adjustmentData?.type === 'Denda' ? 'selected' : ''}>Denda</option>
                            <option value="Bonus Khusus" ${adjustmentData?.type === 'Bonus Khusus' ? 'selected' : ''}>Bonus Khusus</option>
                            <option value="Lainnya" ${adjustmentData?.type === 'Lainnya' ? 'selected' : ''}>Lainnya</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="adjustmentCustomType" style="display: ${adjustmentData?.type && !['Fee Trainer', 'Fee Backup', 'Denda', 'Bonus Khusus', 'Lainnya'].includes(adjustmentData.type) ? 'block' : 'none'};">
                            <i class="fas fa-pen"></i> Jenis Lainnya
                        </label>
                        <input type="text" 
                               id="adjustmentCustomType" 
                               class="form-input" 
                               placeholder="Masukkan jenis adjustment..."
                               value="${adjustmentData?.type && !['Fee Trainer', 'Fee Backup', 'Denda', 'Bonus Khusus', 'Lainnya'].includes(adjustmentData.type) ? adjustmentData.type : ''}"
                               style="display: ${adjustmentData?.type && !['Fee Trainer', 'Fee Backup', 'Denda', 'Bonus Khusus', 'Lainnya'].includes(adjustmentData.type) ? 'block' : 'none'};">
                    </div>
                    
                    <div class="form-group">
                        <label for="adjustmentAmount">
                            <i class="fas fa-money-bill-wave"></i> Amount
                        </label>
                        <div class="amount-input-group">
                            <span class="currency-prefix">Rp</span>
                            <input type="number" 
                                   id="adjustmentAmount" 
                                   class="form-input currency-input"
                                   placeholder="0"
                                   value="${adjustmentData?.amount || ''}"
                                   step="1000">
                        </div>
                        <small style="color: #666; font-size: 0.8rem; display: block; margin-top: 5px;">
                            Gunakan nilai negatif untuk pengurangan (contoh: -50000)
                        </small>
                    </div>
                    
                    <div class="form-group">
                        <label for="adjustmentNote">
                            <i class="fas fa-sticky-note"></i> Catatan (Opsional)
                        </label>
                        <textarea id="adjustmentNote" 
                                  class="form-input" 
                                  rows="2"
                                  placeholder="Tambahkan catatan jika diperlukan..."></textarea>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-modal-cancel" id="cancelAdjustment">
                        Batal
                    </button>
                    <button class="btn-modal-save" id="saveAdjustment">
                        <i class="fas fa-save"></i> ${isEditMode ? 'Update' : 'Simpan'}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Setup modal events
    setupAdjustmentModalEvents(adjustmentData);
    
    // Tampilkan modal dengan animasi
    setTimeout(() => {
        document.getElementById('adjustmentModal').classList.add('active');
    }, 10);
    
    // Auto focus ke input tanggal
    setTimeout(() => {
        document.getElementById('adjustmentDate').focus();
    }, 100);
}

function setupAdjustmentModalEvents(adjustmentData) {
    const modal = document.getElementById('adjustmentModal');
    const closeBtn = document.getElementById('closeAdjustmentModal');
    const cancelBtn = document.getElementById('cancelAdjustment');
    const saveBtn = document.getElementById('saveAdjustment');
    const dateInput = document.getElementById('adjustmentDate');
    const typeSelect = document.getElementById('adjustmentType');
    const customTypeInput = document.getElementById('adjustmentCustomType');
    const amountInput = document.getElementById('adjustmentAmount');
    const noteInput = document.getElementById('adjustmentNote');
    
    if (!modal) return;
    
    // Close modal
    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    };
    
    // Close button
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Close on escape key
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Handle type selection change
    typeSelect.addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        const customTypeLabel = document.querySelector('label[for="adjustmentCustomType"]');
        const customTypeInput = document.getElementById('adjustmentCustomType');
        
        if (selectedValue === 'Lainnya') {
            customTypeLabel.style.display = 'block';
            customTypeInput.style.display = 'block';
            customTypeInput.focus();
        } else if (selectedValue === '') {
            customTypeLabel.style.display = 'none';
            customTypeInput.style.display = 'none';
        } else {
            customTypeLabel.style.display = 'none';
            customTypeInput.style.display = 'none';
        }
    });
    
    // Handle custom type input
    customTypeInput.addEventListener('input', (e) => {
        if (e.target.value.trim()) {
            typeSelect.value = 'Lainnya';
        }
    });
    
    // Save button
    saveBtn.addEventListener('click', async () => {
        await saveAdjustment(adjustmentData?.index);
    });
    
    // Enter key to save
    amountInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveAdjustment(adjustmentData?.index);
        }
    });
    
    // Tab navigation
    setupTabNavigation([dateInput, typeSelect, customTypeInput, amountInput, noteInput, saveBtn]);
}

// Helper untuk tab navigation
function setupTabNavigation(elements) {
    elements.forEach((element, index) => {
        if (!element) return;
        
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                
                // Shift + Tab: ke elemen sebelumnya
                if (e.shiftKey) {
                    const prevIndex = index > 0 ? index - 1 : elements.length - 1;
                    if (elements[prevIndex]) elements[prevIndex].focus();
                } 
                // Tab: ke elemen berikutnya
                else {
                    const nextIndex = index < elements.length - 1 ? index + 1 : 0;
                    if (elements[nextIndex]) elements[nextIndex].focus();
                }
            }
        });
    });
}

// [26] Fungsi untuk save adjustment
async function saveAdjustment(index) {
    try {
        const dateInput = document.getElementById('adjustmentDate');
        const typeSelect = document.getElementById('adjustmentType');
        const customTypeInput = document.getElementById('adjustmentCustomType');
        const amountInput = document.getElementById('adjustmentAmount');
        const noteInput = document.getElementById('adjustmentNote');
        
        // Validasi input
        if (!dateInput.value) {
            alert('Pilih tanggal!');
            dateInput.focus();
            return;
        }
        
        const selectedDate = dateInput.value;
        console.log('DEBUG - Selected date:', selectedDate);
        
        let adjustmentType = '';
        
        if (typeSelect.value === 'Lainnya') {
            adjustmentType = customTypeInput.value.trim();
            if (!adjustmentType) {
                alert('Masukkan jenis adjustment!');
                customTypeInput.focus();
                return;
            }
        } else if (typeSelect.value) {
            adjustmentType = typeSelect.value;
        } else {
            alert('Pilih jenis adjustment!');
            typeSelect.focus();
            return;
        }
        
        const amount = parseFloat(amountInput.value);
        if (isNaN(amount)) {
            alert('Masukkan jumlah yang valid!');
            amountInput.focus();
            return;
        }
        
        // Tampilkan loading
        const saveBtn = document.getElementById('saveAdjustment');
        const originalText = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        
        // Dapatkan nama karyawan
        let namaKaryawan = currentSlipKaryawan?.nama_karyawan;
        if (isOwnerSlip) {
            const selectKaryawan = document.getElementById('selectKaryawanSlip');
            if (selectKaryawan && selectKaryawan.value) {
                namaKaryawan = selectKaryawan.value;
            }
        }
        
        if (!namaKaryawan) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
            throw new Error('Nama karyawan tidak ditemukan');
        }
        
        // Cek apakah tanggal sesuai dengan periode yang dipilih
        const selectedBulan = parseInt(document.getElementById('selectBulan').value);
        const selectedTahun = parseInt(document.getElementById('selectTahun').value);
        
        // Parse tanggal untuk validasi
        const [inputYear, inputMonth, inputDay] = selectedDate.split('-').map(Number);
        
        if (inputMonth !== selectedBulan || inputYear !== selectedTahun) {
            const confirm = window.confirm(
                `Tanggal yang dipilih (${inputDay}/${inputMonth}/${inputYear}) tidak sesuai dengan periode yang ditampilkan (${selectedBulan}/${selectedTahun}).\n\n` +
                `Apakah Anda ingin tetap menyimpan?`
            );
            
            if (!confirm) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalText;
                dateInput.focus();
                return;
            }
        }
        
        // Dapatkan outlet karyawan
        const karyawanOutlet = await getOutletByKaryawan(namaKaryawan);
        if (!karyawanOutlet) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
            alert('Error: Outlet karyawan tidak ditemukan!');
            throw new Error('Outlet tidak ditemukan untuk karyawan: ' + namaKaryawan);
        }
        
        // Cek apakah sudah ada data komisi untuk tanggal ini
        const { data: existingKomisi, error: checkKomisiError } = await supabase
            .from('komisi')
            .select('id, tanggal, outlet, adjustment, adjustment_amount')
            .eq('serve_by', namaKaryawan)
            .eq('tanggal', selectedDate)
            .maybeSingle();
            
        console.log('DEBUG - Query result:', {
            tanggal: selectedDate,
            existingKomisi,
            error: checkKomisiError
        });
        
        if (checkKomisiError && checkKomisiError.code !== 'PGRST116') {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
            throw checkKomisiError;
        }
        
        let result;
        
        if (existingKomisi && existingKomisi.id) {
            // UPDATE existing line
            const updateData = {
                adjustment: adjustmentType,
                adjustment_amount: amount,
                note: noteInput?.value?.trim() || null,
                updated_at: new Date().toISOString()
            };
            
            // Pastikan outlet tidak null
            if (!existingKomisi.outlet) {
                updateData.outlet = karyawanOutlet;
            }
            
            console.log('DEBUG - Updating:', updateData);
            
            const { error: updateError } = await supabase
                .from('komisi')
                .update(updateData)
                .eq('id', existingKomisi.id);
            
            if (updateError) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalText;
                throw updateError;
            }
            
            result = { success: true, action: 'updated', id: existingKomisi.id };
            
        } else {
            // INSERT new line
            const newKomisiData = {
                serve_by: namaKaryawan,
                tanggal: selectedDate,
                outlet: karyawanOutlet,
                kasir: namaKaryawan,
                adjustment: adjustmentType,
                adjustment_amount: amount,
                note: noteInput?.value?.trim() || null,
                uop: 0,
                tips_qris: 0,
                komisi: 0,
                total_transaksi: 0,
                jumlah_transaksi: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            console.log('DEBUG - Inserting:', newKomisiData);
            
            const { error: insertError } = await supabase
                .from('komisi')
                .insert([newKomisiData]);
            
            if (insertError) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalText;
                throw insertError;
            }
            
            result = { success: true, action: 'inserted' };
        }
        
        // Tutup modal dan refresh
        const modal = document.getElementById('adjustmentModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
        
        // Refresh data slip
        setTimeout(async () => {
            await loadSlipData(selectedBulan, selectedTahun);
            
            // Restore button
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
            
            // Show success message
            const message = result.action === 'updated' 
                ? `Adjustment berhasil diperbarui untuk tanggal ${inputDay}/${inputMonth}/${inputYear}!`
                : `Adjustment berhasil ditambahkan untuk tanggal ${inputDay}/${inputMonth}/${inputYear}!`;
            
            alert(message);
        }, 500);
        
    } catch (error) {
        console.error('Error saving adjustment:', error);
        
        // Restore button
        const saveBtn = document.getElementById('saveAdjustment');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan';
        }
        
        alert('Gagal menyimpan adjustment: ' + error.message);
    }
}

// [27] Fungsi untuk delete adjustment
async function deleteAdjustment(index) {
    // Ambil data dari UI untuk mendapatkan type
    const adjustmentRows = document.querySelectorAll('tr[data-index]');
    const row = adjustmentRows[index];
    
    if (!row) {
        alert('Data adjustment tidak ditemukan!');
        return false;
    }
    
    const type = row.querySelector('td:nth-child(1)').textContent.trim();
    const amountText = row.querySelector('td:nth-child(2)').textContent.trim();
    const amount = parseAmountFromRupiah(amountText);
    
    // Dapatkan tanggal dari periode yang dipilih (default tanggal 1)
    const bulan = parseInt(document.getElementById('selectBulan').value);
    const tahun = parseInt(document.getElementById('selectTahun').value);
    const tanggal = `${tahun}-${bulan.toString().padStart(2, '0')}-01`;
    
    // Dapatkan nama karyawan
    let namaKaryawan = currentSlipKaryawan?.nama_karyawan;
    if (isOwnerSlip) {
        const selectKaryawan = document.getElementById('selectKaryawanSlip');
        if (selectKaryawan && selectKaryawan.value) {
            namaKaryawan = selectKaryawan.value;
        }
    }
    
    if (!namaKaryawan) {
        alert('Nama karyawan tidak ditemukan!');
        return false;
    }
    
    // Buat modal konfirmasi dengan info detail
    const confirmHTML = `
        <div class="adjustment-modal delete-confirm-modal" id="deleteConfirmModal">
            <div class="adjustment-modal-content">
                <div class="modal-header">
                    <h3>
                        <i class="fas fa-exclamation-triangle"></i>
                        Konfirmasi Hapus
                    </h3>
                    <button class="close-modal" id="closeDeleteModal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <i class="fas fa-trash-alt" style="color: #ff4757;"></i>
                    <p>Hapus adjustment ini?</p>
                    
                    <div style="background: #f8f9ff; border-radius: 8px; padding: 10px; margin: 15px 0; text-align: left;">
                        <div style="margin-bottom: 5px;">
                            <strong>Jenis:</strong> ${type}
                        </div>
                        <div style="margin-bottom: 5px;">
                            <strong>Amount:</strong> ${amountText}
                        </div>
                        <div>
                            <strong>Karyawan:</strong> ${namaKaryawan}
                        </div>
                    </div>
                    
                    <div class="date-range-info">
                        <i class="fas fa-info-circle"></i>
                        Data akan dihapus berdasarkan kombinasi: Nama + Jenis + Amount
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-modal-cancel" id="cancelDelete">
                        Batal
                    </button>
                    <button class="btn-modal-save" id="confirmDelete" style="background: linear-gradient(135deg, #ff4757, #ff3838);">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', confirmHTML);
    
    // Tampilkan modal
    setTimeout(() => {
        document.getElementById('deleteConfirmModal').classList.add('active');
    }, 10);
    
    // Setup modal events dan eksekusi delete
    return new Promise((resolve) => {
        const modal = document.getElementById('deleteConfirmModal');
        const closeBtn = document.getElementById('closeDeleteModal');
        const cancelBtn = document.getElementById('cancelDelete');
        const confirmBtn = document.getElementById('confirmDelete');
        
        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
                resolve(false); // User cancelled
            }, 300);
        };
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        confirmBtn.addEventListener('click', async () => {
            // Tampilkan loading
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghapus...';
            
            try {
                // Hapus dari database berdasarkan nama, type, amount dan tanggal
                const { error, count } = await supabase
                    .from('komisi')
                    .delete()
                    .eq('serve_by', namaKaryawan)
                    .eq('adjustment', type)
                    .eq('adjustment_amount', amount)
                    .gte('tanggal', `${tahun}-${bulan.toString().padStart(2, '0')}-01`)
                    .lte('tanggal', `${tahun}-${bulan.toString().padStart(2, '0')}-31`);
                
                if (error) throw error;
                
                // Tutup modal
                modal.classList.remove('active');
                setTimeout(() => {
                    modal.remove();
                }, 300);
                
                // Refresh data
                setTimeout(async () => {
                    await loadSlipData(bulan, tahun);
                    alert(`Adjustment berhasil dihapus! (${count} data terhapus)`);
                    resolve(true); // Success
                }, 500);
                
            } catch (error) {
                console.error('Error deleting adjustment:', error);
                alert('Gagal menghapus adjustment: ' + error.message);
                
                // Restore button
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '<i class="fas fa-trash"></i> Hapus';
                
                resolve(false); // Failed
            }
        });
        
        // ESC key untuk close
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    });
}
// ========== FUNGSI MENU KOMPONEN - UPDATE STOK (FINAL VERSION) ==========
// =======================================================================

// Variabel global untuk stok
let currentUserStok = null;
let isOwnerStok = false;
let currentOutletStok = null;
let requestItems = []; // Untuk menyimpan multiple items
let selectedOutletFilter = 'all'; // Untuk owner filter

// [1] Fungsi utama untuk tampilkan halaman stok
async function showStokPage() {
    try {
        console.log('=== SHOW STOK PAGE ===');
        
        // Reset items
        requestItems = [];
        
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
        
        currentUserStok = {
            nama_karyawan: namaKaryawan,
            role: karyawanData.role,
            outlet: karyawanData.outlet
        };
        
        currentOutletStok = karyawanData.outlet;
        isOwnerStok = karyawanData.role === 'owner';
        
        console.log('User data:', currentUserStok);
        
        // Sembunyikan main app
        document.getElementById('appScreen').style.display = 'none';
        
        // Buat halaman stok
        createStokPage();
        
    } catch (error) {
        console.error('Error in showStokPage:', error);
        alert('Gagal memuat halaman stok!');
    }
}

// [2] Fungsi untuk buat halaman stok
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
    
    // UI berdasarkan role
    const pageContent = isOwnerStok ? createOwnerStokUI() : createKasirStokUI();
    
    stokPage.innerHTML = `
        <!-- HEADER -->
        <header class="stok-header">
            <button class="back-btn" id="backToMainFromStok">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h2><i class="fas fa-boxes"></i> Update Stok</h2>
            <div class="header-actions">
                <button class="refresh-btn" id="refreshStok">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
        </header>
        
        <!-- CONTENT -->
        ${pageContent}
    `;
    
    document.body.appendChild(stokPage);
    
    // Setup event listeners
    setupStokPageEvents();
    
    // Load initial data
    setTimeout(() => {
        loadStokData();
    }, 100);
}

// [3] UI untuk KASIR
function createKasirStokUI() {
    return `
        <div class="stok-content kasir-view">
            <!-- SUMMARY & ACTION BUTTON -->
            <div class="kasir-action-section">
                <button class="btn-update-stok" id="btnUpdateStok">
                    <i class="fas fa-plus-circle"></i>
                    <span>Update Stok</span>
                </button>
                
                <div class="summary-stats">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-box"></i>
                        </div>
                        <div class="stat-info">
                            <div class="stat-label">Total Produk</div>
                            <div class="stat-value" id="totalProduk">0</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-cubes"></i>
                        </div>
                        <div class="stat-info">
                            <div class="stat-label">Total Stok</div>
                            <div class="stat-value" id="totalStok">0</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="stat-info">
                            <div class="stat-label">Stok Rendah</div>
                            <div class="stat-value" id="stokRendah">0</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- PRODUCT SUMMARY TABLE -->
            <section class="product-summary-section">
                <div class="section-header">
                    <h3><i class="fas fa-list-alt"></i> Ringkasan Stok - ${currentOutletStok}</h3>
                </div>
                
                <div class="summary-table-container">
                    <table class="summary-table" id="summaryTable">
                        <thead>
                            <tr>
                                <th>Group Produk</th>
                                <th>Nama Produk</th>
                                <th>Stok</th>
                            </tr>
                        </thead>
                        <tbody id="summaryTableBody">
                            <tr>
                                <td colspan="3" class="loading-cell">
                                    <i class="fas fa-spinner fa-spin"></i> Memuat data...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
            
            <!-- REQUEST HISTORY -->
            <section class="request-history-section">
                <div class="section-header">
                    <h3><i class="fas fa-history"></i> Riwayat Request</h3>
                </div>
                
                <div class="requests-list" id="requestsList">
                    <div class="loading">Memuat riwayat request...</div>
                </div>
            </section>
        </div>
        
        <!-- MODAL REQUEST STOK (MULTIPLE ITEMS) -->
        <div class="modal-overlay" id="requestModal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-cart-plus"></i> Request Update Stok</h3>
                    <button class="close-modal" id="closeRequestModal">&times;</button>
                </div>
                
                <div class="modal-body">
                    <!-- ADD ITEM FORM -->
                    <div class="add-item-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="selectProdukRequest">Pilih Produk:</label>
                                <select id="selectProdukRequest" class="form-select">
                                    <option value="">-- Pilih Produk --</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="stokType">Jenis:</label>
                                <select id="stokType" class="form-select">
                                    <option value="masuk">Stok Masuk</option>
                                    <option value="keluar">Stok Keluar</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="qtyChange">Jumlah:</label>
                                <input type="number" id="qtyChange" min="1" value="1" 
                                       class="form-input" placeholder="Jumlah">
                                <div class="form-hint" id="currentStockInfo" style="display: none;">
                                    Stok saat ini: <span id="currentStockValue">0</span>
                                </div>
                            </div>
                        </div>
                        
                        <button type="button" class="btn-add-item" id="btnAddItem">
                            <i class="fas fa-plus"></i> Tambah ke List
                        </button>
                    </div>
                    
                    <!-- ITEMS LIST -->
                    <div class="items-list-section">
                        <h4><i class="fas fa-list"></i> Items dalam Request</h4>
                        
                        <div class="items-list-container">
                            <div class="items-list" id="itemsList">
                                <div class="empty-list">
                                    <i class="fas fa-clipboard-list"></i>
                                    <p>Belum ada item ditambahkan</p>
                                </div>
                            </div>
                            
                            <div class="items-summary" id="itemsSummary" style="display: none;">
                                <div class="summary-row">
                                    <span>Total Items:</span>
                                    <strong id="totalItemsCount">0</strong>
                                </div>
                                <div class="summary-row">
                                    <span>Total Stok Masuk:</span>
                                    <strong class="text-success" id="totalMasukCount">0</strong>
                                </div>
                                <div class="summary-row">
                                    <span>Total Stok Keluar:</span>
                                    <strong class="text-danger" id="totalKeluarCount">0</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- KETERANGAN -->
                    <div class="form-group">
                        <label for="requestNotes">Keterangan (Opsional):</label>
                        <textarea id="requestNotes" class="form-textarea" 
                                  rows="3" placeholder="Contoh: Restock bulanan, permintaan pelanggan"></textarea>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" id="cancelRequest">
                        <i class="fas fa-times"></i> Batal
                    </button>
                    <button type="button" class="btn-primary" id="submitRequest" disabled>
                        <i class="fas fa-paper-plane"></i> Simpan Request
                    </button>
                </div>
            </div>
        </div>
    `;
}

// [4] UI untuk OWNER
function createOwnerStokUI() {
    return `
        <div class="stok-content owner-view">
            <!-- FILTER SECTION -->
            <div class="owner-filter-section">
                <div class="filter-row">
                    <div class="filter-group">
                        <label for="filterOutletStok">Outlet:</label>
                        <select id="filterOutletStok" class="outlet-select">
                            <option value="all">Semua Outlet</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label for="filterStatusStok">Status:</label>
                        <select id="filterStatusStok" class="status-select">
                            <option value="pending">Pending Approval</option>
                            <option value="all">Semua Status</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label for="filterDateStok">Periode:</label>
                        <select id="filterDateStok" class="date-select">
                            <option value="today">Hari Ini</option>
                            <option value="week">7 Hari</option>
                            <option value="month">Bulan Ini</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- SUMMARY STATS -->
            <div class="owner-summary-stats">
                <div class="summary-card pending">
                    <div class="card-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="card-content">
                        <div class="card-label">Pending</div>
                        <div class="card-value" id="statPending">0</div>
                    </div>
                </div>
                
                <div class="summary-card approved">
                    <div class="card-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="card-content">
                        <div class="card-label">Approved Today</div>
                        <div class="card-value" id="statApproved">0</div>
                    </div>
                </div>
                
                <div class="summary-card adjustment">
                    <div class="card-icon">
                        <i class="fas fa-exchange-alt"></i>
                    </div>
                    <div class="card-content">
                        <div class="card-label">Adjustments</div>
                        <div class="card-value" id="statAdjustments">0</div>
                    </div>
                </div>
            </div>
            
            <!-- PENDING REQUESTS -->
            <section class="pending-requests-section">
                <div class="section-header">
                    <h3><i class="fas fa-clock"></i> Permintaan Pending</h3>
                    <div class="section-badge" id="pendingRequestsCount">
                        0 requests
                    </div>
                </div>
                
                <div class="pending-table-container">
                    <table class="pending-table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Outlet</th>
                                <th>Produk</th>
                                <th>Kasir</th>
                                <th>Jenis</th>
                                <th>Jumlah</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="pendingRequestsBody">
                            <tr>
                                <td colspan="8" class="loading-cell">
                                    <i class="fas fa-spinner fa-spin"></i> Memuat data...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
            
            <!-- QUICK ADJUSTMENT -->
            <section class="quick-adjust-section">
                <div class="section-header">
                    <h3><i class="fas fa-exchange-alt"></i> Quick Adjustment</h3>
                    <button class="btn-primary btn-small" id="btnToggleAdjust">
                        <i class="fas fa-edit"></i> Buat Adjustment
                    </button>
                </div>
                
                <div class="adjust-form-container" id="adjustFormContainer" style="display: none;">
                    <form id="quickAdjustForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="adjustOutlet">Outlet:</label>
                                <select id="adjustOutlet" class="form-select">
                                    <option value="${currentOutletStok}">${currentOutletStok}</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="adjustProduk">Produk:</label>
                                <select id="adjustProduk" class="form-select">
                                    <option value="">-- Pilih Produk --</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="adjustType">Jenis:</label>
                                <select id="adjustType" class="form-select">
                                    <option value="masuk">Stok Masuk</option>
                                    <option value="keluar">Stok Keluar</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="adjustQty">Jumlah:</label>
                                <input type="number" id="adjustQty" min="1" value="1" 
                                       class="form-input" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="adjustNotes">Alasan Adjustment:</label>
                            <input type="text" id="adjustNotes" class="form-input" 
                                   placeholder="Contoh: Barang rusak, stok opname, koreksi" required>
                        </div>
                        
                        <div class="form-buttons">
                            <button type="button" class="btn-secondary" id="cancelAdjust">
                                <i class="fas fa-times"></i> Batal
                            </button>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-check"></i> Simpan Adjustment
                            </button>
                        </div>
                    </form>
                </div>
                
                <!-- RECENT ADJUSTMENTS -->
                <div class="recent-adjustments">
                    <h4><i class="fas fa-history"></i> Adjustment Terakhir</h4>
                    <div class="adjustments-list" id="recentAdjustments">
                        <div class="loading">Memuat data...</div>
                    </div>
                </div>
            </section>
        </div>
        
        <!-- MODAL APPROVAL DETAIL -->
        <div class="modal-overlay" id="approvalModal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-clipboard-check"></i> Detail Request</h3>
                    <button class="close-modal" id="closeApprovalModal">&times;</button>
                </div>
                
                <div class="modal-body" id="approvalModalBody">
                    <!-- Detail akan diisi -->
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
    document.getElementById('refreshStok').addEventListener('click', loadStokData);
    
    // Jika owner, setup filter events
    if (isOwnerStok) {
        setupOwnerStokEvents();
    } else {
        setupKasirStokEvents();
    }
}

// [6] Setup events khusus untuk KASIR
function setupKasirStokEvents() {
    // Tombol Update Stok
    const btnUpdate = document.getElementById('btnUpdateStok');
    if (btnUpdate) {
        btnUpdate.addEventListener('click', showRequestModal);
    }
    
    // Modal events
    setupRequestModalEvents();
}

// [7] Setup events khusus untuk OWNER
function setupOwnerStokEvents() {
    // Filter events
    const filterOutlet = document.getElementById('filterOutletStok');
    const filterStatus = document.getElementById('filterStatusStok');
    const filterDate = document.getElementById('filterDateStok');
    
    if (filterOutlet) {
        filterOutlet.addEventListener('change', function() {
            selectedOutletFilter = this.value;
            loadStokData();
        });
    }
    
    if (filterStatus) {
        filterStatus.addEventListener('change', loadStokData);
    }
    
    if (filterDate) {
        filterDate.addEventListener('change', loadStokData);
    }
    
    // Toggle adjustment form
    document.getElementById('btnToggleAdjust')?.addEventListener('click', function() {
        const container = document.getElementById('adjustFormContainer');
        container.style.display = container.style.display === 'none' ? 'block' : 'none';
        
        if (container.style.display === 'block') {
            loadProdukForAdjustment();
        }
    });
    
    // Cancel adjust
    document.getElementById('cancelAdjust')?.addEventListener('click', function() {
        document.getElementById('adjustFormContainer').style.display = 'none';
        document.getElementById('quickAdjustForm').reset();
    });
    
    // Quick adjust form submit
    const adjustForm = document.getElementById('quickAdjustForm');
    if (adjustForm) {
        adjustForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleQuickAdjust();
        });
    }
}

// [8] Setup modal request events (MULTIPLE ITEMS)
function setupRequestModalEvents() {
    // Close modal buttons
    document.getElementById('closeRequestModal')?.addEventListener('click', closeRequestModal);
    document.getElementById('cancelRequest')?.addEventListener('click', closeRequestModal);
    
    // Produk select change
    const produkSelect = document.getElementById('selectProdukRequest');
    if (produkSelect) {
        produkSelect.addEventListener('change', function() {
            updateCurrentStockInfo(this.value);
        });
    }
    
    // Stok type change
    const stokTypeSelect = document.getElementById('stokType');
    if (stokTypeSelect) {
        stokTypeSelect.addEventListener('change', updateQtyLimits);
    }
    
    // Add item button
    document.getElementById('btnAddItem')?.addEventListener('click', addItemToList);
    
    // Submit request button
    document.getElementById('submitRequest')?.addEventListener('click', submitStokRequest);
    
    // Close modal on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeRequestModal();
        }
    });
}

// [9] Fungsi utama untuk load data stok
async function loadStokData() {
    try {
        console.log('Loading stok data...');
        
        if (isOwnerStok) {
            await loadOwnerStokData();
        } else {
            await loadKasirStokData();
        }
        
    } catch (error) {
        console.error('Error loading stok data:', error);
        showError('Gagal memuat data stok');
    }
}

// [10] Load data untuk KASIR
async function loadKasirStokData() {
    try {
        // Load produk untuk summary (hanya inventory=TRUE)
        const { data: produkData, error: produkError } = await supabase
            .from('produk')
            .select('id, nama_produk, group_produk, stok, inventory')
            .eq('outlet', currentOutletStok)
            .eq('status', 'active')
            .eq('inventory', true) // Hanya produk inventory
            .order('group_produk')
            .order('nama_produk');
        
        if (produkError) throw produkError;
        
        // Load riwayat request
        const { data: requestData, error: requestError } = await supabase
            .from('stok_update')
            .select('*')
            .eq('outlet', currentOutletStok)
            .eq('updated_by', currentUserStok.nama_karyawan)
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (requestError) throw requestError;
        
        // Update UI
        updateKasirSummary(produkData || []);
        displayRequestHistory(requestData || []);
        
        // Load produk untuk dropdown modal
        await loadProdukForRequest();
        
    } catch (error) {
        console.error('Error loading kasir stok data:', error);
        showError('Gagal memuat data produk');
    }
}

// [11] Update summary untuk KASIR
function updateKasirSummary(products) {
    if (!products || products.length === 0) {
        document.getElementById('totalProduk').textContent = '0';
        document.getElementById('totalStok').textContent = '0';
        document.getElementById('stokRendah').textContent = '0';
        
        const tbody = document.getElementById('summaryTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="no-data-cell">
                        <i class="fas fa-box-open"></i>
                        <p>Tidak ada produk inventory</p>
                    </td>
                </tr>
            `;
        }
        return;
    }
    
    // Calculate statistics
    const totalProduk = products.length;
    const totalStok = products.reduce((sum, p) => sum + (p.stok || 0), 0);
    const stokRendah = products.filter(p => (p.stok || 0) <= 10).length;
    
    // Update stats
    document.getElementById('totalProduk').textContent = totalProduk;
    document.getElementById('totalStok').textContent = totalStok.toLocaleString();
    document.getElementById('stokRendah').textContent = stokRendah;
    
    // Group products by group_produk
    const groupedProducts = {};
    products.forEach(product => {
        const group = product.group_produk || 'Lainnya';
        if (!groupedProducts[group]) {
            groupedProducts[group] = [];
        }
        groupedProducts[group].push(product);
    });
    
    // Display in table
    const tbody = document.getElementById('summaryTableBody');
    if (!tbody) return;
    
    let html = '';
    
    // Sort groups alphabetically
    const sortedGroups = Object.keys(groupedProducts).sort();
    
    sortedGroups.forEach((group, groupIndex) => {
        const groupProducts = groupedProducts[group];
        
        groupProducts.forEach((product, productIndex) => {
            const isFirstInGroup = productIndex === 0;
            const stockClass = getStockStatusClass(product.stok);
            
            html += `
                <tr class="${stockClass}">
                    ${isFirstInGroup ? 
                        `<td rowspan="${groupProducts.length}" class="group-cell">
                            <strong>${group}</strong>
                        </td>` : ''
                    }
                    <td class="product-cell">
                        <div class="product-name">${product.nama_produk}</div>
                        ${product.inventory === false ? 
                            '<span class="non-inventory-badge">Non-Inventory</span>' : ''
                        }
                    </td>
                    <td class="stock-cell ${stockClass}">
                        ${product.stok || 0}
                        ${product.stok <= 10 ? 
                            '<span class="low-stock-badge"><i class="fas fa-exclamation-circle"></i></span>' : ''
                        }
                    </td>
                </tr>
            `;
        });
    });
    
    tbody.innerHTML = html || `
        <tr>
            <td colspan="3" class="no-data-cell">
                <i class="fas fa-box-open"></i>
                <p>Tidak ada produk inventory</p>
            </td>
        </tr>
    `;
}

// [12] Display request history untuk KASIR
function displayRequestHistory(requests) {
    const requestsList = document.getElementById('requestsList');
    if (!requestsList) return;
    
    if (!requests || requests.length === 0) {
        requestsList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-history"></i>
                <p>Belum ada riwayat request</p>
            </div>
        `;
        return;
    }
    
    requestsList.innerHTML = requests.map(request => {
        const statusClass = getApprovalStatusClass(request.approval_status);
        const typeClass = request.stok_type === 'masuk' ? 'type-in' : 'type-out';
        const typeIcon = request.stok_type === 'masuk' ? 'fa-arrow-down' : 'fa-arrow-up';
        const typeText = request.stok_type === 'masuk' ? 'Stok Masuk' : 'Stok Keluar';
        
        return `
            <div class="request-item ${statusClass}">
                <div class="request-header">
                    <div class="request-date">
                        <i class="fas fa-calendar"></i>
                        ${formatDateStok(request.tanggal)}
                    </div>
                    <div class="request-status ${statusClass}">
                        ${getApprovalStatusText(request.approval_status)}
                    </div>
                </div>
                
                <div class="request-body">
                    <div class="request-product">
                        <strong>${request.nama_produk}</strong>
                        <span class="request-type ${typeClass}">
                            <i class="fas ${typeIcon}"></i>
                            ${typeText}
                        </span>
                    </div>
                    
                    <div class="request-details">
                        <div class="detail-item">
                            <span>Jumlah:</span>
                            <strong class="${typeClass}">
                                ${request.stok_type === 'masuk' ? '+' : '-'}${Math.abs(request.qty_change)}
                            </strong>
                        </div>
                        <div class="detail-item">
                            <span>Stok:</span>
                            <span>${request.qty_before} → ${request.qty_after}</span>
                        </div>
                    </div>
                    
                    ${request.notes ? `
                    <div class="request-notes">
                        <i class="fas fa-sticky-note"></i>
                        ${request.notes}
                    </div>
                    ` : ''}
                    
                    ${request.rejection_reason ? `
                    <div class="request-rejection">
                        <i class="fas fa-times-circle"></i>
                        <strong>Alasan ditolak:</strong> ${request.rejection_reason}
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// [13] Load data untuk OWNER - PERBAIKI BAGIAN ADJUSTMENTS
async function loadOwnerStokData() {
  console.log('=== LOAD OWNER STOK DATA ===');
  
  try {
    // 1. DAPATKAN FILTER DARI UI
    const outletSelect = document.getElementById('filterOutletStok');
    const statusSelect = document.getElementById('filterStatusStok');
    const dateSelect = document.getElementById('filterDateStok');
    
    const outletFilter = outletSelect ? outletSelect.value : 'all';
    const statusFilter = statusSelect ? statusSelect.value : 'pending';
    const dateFilter = dateSelect ? dateSelect.value : 'today';
    
    console.log('Active Filters:', { outlet: outletFilter, status: statusFilter, date: dateFilter });
    
    // 2. LOAD OUTLET DROPDOWN (SIMPLE VERSION)
    try {
      if (outletSelect) {
        const { data: outlets } = await supabase
          .from('karyawan')
          .select('outlet')
          .not('outlet', 'is', null);
        
        if (outlets && outlets.length > 0) {
          const uniqueOutlets = [...new Set(outlets.map(o => o.outlet))].filter(Boolean);
          let options = '<option value="all">Semua Outlet</option>';
          uniqueOutlets.forEach(outlet => {
            const selected = outlet === outletFilter ? 'selected' : '';
            options += `<option value="${outlet}" ${selected}>${outlet}</option>`;
          });
          outletSelect.innerHTML = options;
          outletSelect.value = outletFilter;
        }
      }
    } catch (dropdownErr) {
      console.warn('Outlet dropdown error:', dropdownErr.message);
    }
    
    // 3. QUERY UTAMA UNTUK DATA
    let requestQuery = supabase
      .from('stok_update')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (outletFilter !== 'all') {
      requestQuery = requestQuery.eq('outlet', outletFilter);
    }
    
    if (statusFilter !== 'all') {
      requestQuery = requestQuery.eq('approval_status', statusFilter);
    }
    // Jika statusFilter = 'all', TIDAK ADA FILTER approval_status
    
    // Date filter (sementara non-aktif karena bug)
    // if (dateFilter === 'today') { ... }
    
    const { data: requests, error: requestError } = await requestQuery;
    
    if (requestError) {
      console.error('Query error:', requestError);
      throw requestError;
    }
    
    console.log(`Query success: ${requests?.length || 0} records`);
    
    // 4. LOAD STATS (DENGAN PERBAIKAN ERROR)
    try {
      await loadOwnerStats(outletFilter, null, null); // Non-aktifkan date filter dulu
    } catch (statsError) {
      console.warn('Stats loading skipped:', statsError.message);
      // Tetap lanjut meski stats error
    }
    
    // 5. LOAD RECENT ADJUSTMENTS - PERBAIKAN UTAMA DI SINI
    try {
      // Determine which outlet to show
      const adjOutlet = outletFilter !== 'all' ? outletFilter : (currentOutletStok || 'Rempoa');
      
      let adjQuery = supabase
        .from('stok_update')
        .select('*')
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(5);
      
      // Filter by selected outlet
      if (adjOutlet && adjOutlet !== 'all') {
        adjQuery = adjQuery.eq('outlet', adjOutlet);
      }
      
      // PERBAIKAN: Gunakan updated_by, bukan requested_by
      // Hapus filter ini jika tidak ada kolom tersebut
      // adjQuery = adjQuery.not('requested_by', 'is', null);
      
      // Sebagai ganti, filter hanya adjustment yang dilakukan oleh owner
      // Atau tampilkan semua yang approved
      adjQuery = adjQuery.not('updated_by', 'is', null);
      
      const { data: adjustments, error: adjError } = await adjQuery;
      
      if (adjError) {
        console.error('Error loading adjustments:', adjError);
        throw adjError;
      }
      
      console.log(`Adjustments loaded: ${adjustments?.length || 0}`);
      displayRecentAdjustments(adjustments || []);
      
    } catch (adjustError) {
      console.warn('Adjustments loading skipped:', adjustError.message);
      // Tampilkan pesan kosong jika error
      displayRecentAdjustments([]);
    }
    
    // 6. TAMPILKAN DATA
    displayPendingRequests(requests || []);
    
  } catch (error) {
    console.error('Error in loadOwnerStokData:', error);
    showError('Gagal memuat data requests');
  }
}
// [14] Load owner statistics
async function loadOwnerStats(outletFilter, dateStart, dateEnd) {
    try {
        // Pending requests count
        let pendingQuery = supabase
            .from('stok_update')
            .select('id', { count: 'exact', head: true })
            .eq('approval_status', 'pending');
        
        if (outletFilter !== 'all') {
            pendingQuery = pendingQuery.eq('outlet', outletFilter);
        }
        
        const { count: pendingCount, error: pendingError } = await pendingQuery;
        
        if (pendingError) throw pendingError;
        
        // Approved today count
        let approvedQuery = supabase
            .from('stok_update')
            .select('id', { count: 'exact', head: true })
            .eq('approval_status', 'approved')
            .eq('tanggal', new Date().toISOString().split('T')[0]);
        
        if (outletFilter !== 'all') {
            approvedQuery = approvedQuery.eq('outlet', outletFilter);
        }
        
        const { count: approvedCount, error: approvedError } = await approvedQuery;
        
        if (approvedError) throw approvedError;
        
        // Adjustments count (owner initiated)
        let adjustQuery = supabase
            .from('stok_update')
            .select('id', { count: 'exact', head: true })
            .eq('approval_status', 'approved')
            .not('approved_by', 'is', null);
        
        if (outletFilter !== 'all') {
            adjustQuery = adjustQuery.eq('outlet', outletFilter);
        }
        
        if (dateStart && dateEnd) {
            adjustQuery = adjustQuery.gte('tanggal', dateStart).lte('tanggal', dateEnd);
        }
        
        const { count: adjustCount, error: adjustError } = await adjustQuery;
        
        if (adjustError) throw adjustError;
        
        // Update UI
        document.getElementById('statPending').textContent = pendingCount || 0;
        document.getElementById('statApproved').textContent = approvedCount || 0;
        document.getElementById('statAdjustments').textContent = adjustCount || 0;
        
    } catch (error) {
        console.error('Error loading owner stats:', error);
    }
}

// [15] Display pending requests untuk OWNER
function displayPendingRequests(requests) {
    const pendingBody = document.getElementById('pendingRequestsBody');
    const pendingCount = document.getElementById('pendingRequestsCount');
    
    if (!pendingBody) return;
    
    if (!requests || requests.length === 0) {
        pendingBody.innerHTML = `
            <tr>
                <td colspan="8" class="no-data-cell">
                    <i class="fas fa-check-circle"></i>
                    <p>Tidak ada data request</p>
                </td>
            </tr>
        `;
        if (pendingCount) pendingCount.textContent = '0 requests';
        return;
    }
    
    // Update count
    const pendingOnly = requests.filter(r => r.approval_status === 'pending');
    if (pendingCount) {
        pendingCount.textContent = `${pendingOnly.length} pending`;
    }
    
    pendingBody.innerHTML = requests.map(request => {
        const typeClass = request.stok_type === 'masuk' ? 'type-in' : 'type-out';
        const typeText = request.stok_type === 'masuk' ? 'Masuk' : 'Keluar';
        const statusClass = getApprovalStatusClass(request.approval_status);
        const statusText = getApprovalStatusText(request.approval_status);
        
        // Check if already approved/rejected to disable buttons
        const isActionable = request.approval_status === 'pending';
        
        return `
            <tr data-id="${request.id}" data-status="${request.approval_status}">
                <td>${formatDateStok(request.tanggal)}</td>
                <td>${request.outlet}</td>
                <td>
                    <div class="product-info">
                        <strong>${request.nama_produk}</strong>
                        <div class="product-group">${request.group_produk || '-'}</div>
                    </div>
                </td>
                <td>${request.updated_by}</td>
                <td>
                    <span class="type-badge ${typeClass}">
                        ${typeText}
                    </span>
                </td>
                <td>
                    <strong class="${typeClass}">
                        ${request.stok_type === 'masuk' ? '+' : '-'}${Math.abs(request.qty_change)}
                    </strong>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${statusText}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        ${isActionable ? `
                            <button class="btn-action btn-approve" data-id="${request.id}" 
                                    title="Approve">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn-action btn-reject" data-id="${request.id}" 
                                    title="Reject">
                                <i class="fas fa-times"></i>
                            </button>
                            <button class="btn-action btn-view" data-id="${request.id}" 
                                    title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                        ` : `
                            <button class="btn-action btn-view" data-id="${request.id}" 
                                    title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                        `}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // Add event listeners to action buttons
    setupRequestActionButtons();
}

// [16] Setup request action buttons (OWNER)
function setupRequestActionButtons() {
    // Approve buttons
    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', function() {
            const requestId = this.dataset.id;
            approveStokRequest(requestId);
        });
    });
    
    // Reject buttons
    document.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', function() {
            const requestId = this.dataset.id;
            showRejectModal(requestId);
        });
    });
    
    // View buttons
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', function() {
            const requestId = this.dataset.id;
            showRequestDetail(requestId);
        });
    });
}

// [17] Approve stok request (OWNER) - UPDATE PRODUK.STOK
async function approveStokRequest(requestId) {
    if (!confirm('Approve request ini? Stok produk akan diupdate.')) return;
    
    try {
        // Get request data
        const { data: request, error: getError } = await supabase
            .from('stok_update')
            .select('*')
            .eq('id', requestId)
            .single();
        
        if (getError) throw getError;
        
        // Check if already approved/rejected
        if (request.approval_status !== 'pending') {
            alert('Request ini sudah diproses sebelumnya.');
            return;
        }
        
        // Update request status
        const { error: updateError } = await supabase
            .from('stok_update')
            .update({
                approval_status: 'approved',
                approved_by: currentUserStok.nama_karyawan,
                updated_at: new Date().toISOString()
            })
            .eq('id', requestId);
        
        if (updateError) throw updateError;
        
        // UPDATE PRODUK.STOK
        const { error: produkError } = await supabase
            .from('produk')
            .update({ 
                stok: request.qty_after,
                updated_at: new Date().toISOString()
            })
            .eq('nama_produk', request.nama_produk)
            .eq('outlet', request.outlet);
        
        if (produkError) {
            console.error('Error updating produk.stok:', produkError);
            alert('Request approved tapi gagal update stok produk. Silakan cek manual.');
        } else {
            // Success
            alert('Request approved! Stok produk berhasil diperbarui.');
        }
        
        // Disable action buttons for this row
        const row = document.querySelector(`tr[data-id="${requestId}"]`);
        if (row) {
            const buttons = row.querySelectorAll('.btn-approve, .btn-reject');
            buttons.forEach(btn => btn.disabled = true);
            
            // Update status badge
            const statusBadge = row.querySelector('.status-badge');
            if (statusBadge) {
                statusBadge.className = 'status-badge status-approved';
                statusBadge.textContent = 'Disetujui';
            }
        }
        
        // Refresh stats
        loadStokData();
        
    } catch (error) {
        console.error('Error approving request:', error);
        alert('Gagal approve request: ' + error.message);
    }
}

// [18] Show reject modal
async function showRejectModal(requestId) {
    const reason = prompt('Masukkan alasan penolakan:');
    if (reason === null) return; // User cancelled
    if (!reason.trim()) {
        alert('Harap masukkan alasan penolakan');
        return;
    }
    
    await rejectStokRequest(requestId, reason);
}

// [19] Reject stok request (OWNER)
async function rejectStokRequest(requestId, rejectionReason) {
    try {
        // Get request data to check status
        const { data: request } = await supabase
            .from('stok_update')
            .select('approval_status')
            .eq('id', requestId)
            .single();
        
        if (request.approval_status !== 'pending') {
            alert('Request ini sudah diproses sebelumnya.');
            return;
        }
        
        const { error } = await supabase
            .from('stok_update')
            .update({
                approval_status: 'rejected',
                approved_by: currentUserStok.nama_karyawan,
                rejection_reason: rejectionReason,
                updated_at: new Date().toISOString()
            })
            .eq('id', requestId);
        
        if (error) throw error;
        
        alert('Request telah ditolak.');
        
        // Disable action buttons for this row
        const row = document.querySelector(`tr[data-id="${requestId}"]`);
        if (row) {
            const buttons = row.querySelectorAll('.btn-approve, .btn-reject');
            buttons.forEach(btn => btn.disabled = true);
            
            // Update status badge
            const statusBadge = row.querySelector('.status-badge');
            if (statusBadge) {
                statusBadge.className = 'status-badge status-rejected';
                statusBadge.textContent = 'Ditolak';
            }
        }
        
        loadStokData(); // Refresh
        
    } catch (error) {
        console.error('Error rejecting request:', error);
        alert('Gagal menolak request: ' + error.message);
    }
}

// [20] Show request detail (OWNER)
async function showRequestDetail(requestId) {
    try {
        const { data: request, error } = await supabase
            .from('stok_update')
            .select('*')
            .eq('id', requestId)
            .single();
        
        if (error) throw error;
        
        const modal = document.getElementById('approvalModal');
        const modalBody = document.getElementById('approvalModalBody');
        
        if (!modal || !modalBody) return;
        
        const typeText = request.stok_type === 'masuk' ? 'Stok Masuk' : 'Stok Keluar';
        const typeClass = request.stok_type === 'masuk' ? 'type-in' : 'type-out';
        const statusText = getApprovalStatusText(request.approval_status);
        const statusClass = getApprovalStatusClass(request.approval_status);
        
        const isActionable = request.approval_status === 'pending';
        
        modalBody.innerHTML = `
            <div class="request-detail">
                <div class="detail-section">
                    <h4>Informasi Request</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="label">Tanggal:</span>
                            <span class="value">${formatDateStok(request.tanggal)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">Outlet:</span>
                            <span class="value">${request.outlet}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">Dibuat Oleh:</span>
                            <span class="value">${request.updated_by}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">Status:</span>
                            <span class="value ${statusClass}">${statusText}</span>
                        </div>
                        ${request.approved_by ? `
                        <div class="detail-item">
                            <span class="label">Disetujui Oleh:</span>
                            <span class="value">${request.approved_by}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">Waktu Approval:</span>
                            <span class="value">${formatDateTime(request.updated_at)}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Detail Produk</h4>
                    <div class="product-detail">
                        <div class="product-name">${request.nama_produk}</div>
                        <div class="product-group">${request.group_produk || '-'}</div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Perubahan Stok</h4>
                    <div class="stock-change ${typeClass}">
                        <div class="stock-before">
                            <span>Stok Sebelum:</span>
                            <strong>${request.qty_before}</strong>
                        </div>
                        <div class="stock-arrow">
                            <i class="fas fa-arrow-right"></i>
                            <span class="change-amount ${typeClass}">
                                ${request.qty_change > 0 ? '+' : ''}${request.qty_change}
                            </span>
                        </div>
                        <div class="stock-after">
                            <span>Stok Sesudah:</span>
                            <strong>${request.qty_after}</strong>
                        </div>
                    </div>
                </div>
                
                ${request.notes ? `
                <div class="detail-section">
                    <h4>Keterangan</h4>
                    <div class="notes-box">${request.notes}</div>
                </div>
                ` : ''}
                
                ${request.rejection_reason ? `
                <div class="detail-section">
                    <h4>Alasan Penolakan</h4>
                    <div class="rejection-box">${request.rejection_reason}</div>
                </div>
                ` : ''}
                
                ${isActionable ? `
                <div class="detail-actions">
                    <button class="btn-primary btn-approve-action" data-id="${request.id}">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn-secondary btn-reject-action" data-id="${request.id}">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
                ` : ''}
            </div>
        `;
        
        // Show modal
        modal.style.display = 'flex';
        
        // Add event listeners for action buttons in modal
        document.querySelector('.btn-approve-action')?.addEventListener('click', function() {
            approveStokRequest(this.dataset.id);
            modal.style.display = 'none';
        });
        
        document.querySelector('.btn-reject-action')?.addEventListener('click', function() {
            modal.style.display = 'none';
            showRejectModal(this.dataset.id);
        });
        
    } catch (error) {
        console.error('Error showing request detail:', error);
        alert('Gagal memuat detail request');
    }
}

// [21] Display recent adjustments untuk OWNER - FIXED
function displayRecentAdjustments(adjustments) {
    const recentEl = document.getElementById('recentAdjustments');
    if (!recentEl) {
        console.log('Recent adjustments element not found');
        return;
    }
    
    if (!adjustments || adjustments.length === 0) {
        recentEl.innerHTML = `
            <div class="no-data">
                <i class="fas fa-history"></i>
                <p>Belum ada adjustment</p>
            </div>
        `;
        console.log('No adjustments to display');
        return;
    }
    
    console.log(`Displaying ${adjustments.length} adjustments`);
    
    recentEl.innerHTML = adjustments.map(adj => {
        const typeClass = adj.stok_type === 'masuk' ? 'type-in' : 'type-out';
        const typeIcon = adj.stok_type === 'masuk' ? 'fa-arrow-down' : 'fa-arrow-up';
        
        // Format date
        const date = formatDateStok(adj.tanggal) || adj.tanggal;
        
        return `
            <div class="adjustment-item">
                <div class="adjustment-header">
                    <div class="adjustment-date">
                        <i class="fas fa-calendar"></i>
                        ${date}
                    </div>
                    <div class="adjustment-type ${typeClass}">
                        <i class="fas ${typeIcon}"></i>
                    </div>
                </div>
                <div class="adjustment-body">
                    <div class="adjustment-product">
                        <strong>${adj.nama_produk}</strong>
                        <span class="adjustment-outlet">${adj.outlet}</span>
                    </div>
                    <div class="adjustment-qty ${typeClass}">
                        ${adj.stok_type === 'masuk' ? '+' : '-'}${Math.abs(adj.qty_change)} unit
                    </div>
                    <div class="adjustment-info">
                        <span class="adjustment-by">Oleh: ${adj.updated_by || '-'}</span>
                        ${adj.notes ? `
                        <div class="adjustment-notes">
                            <i class="fas fa-sticky-note"></i>
                            ${adj.notes}
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// [22] Load outlet dropdown untuk OWNER (FIX TIDAK RESET)
async function loadOutletDropdownStok() {
    const select = document.getElementById('filterOutletStok');
    if (!select) return;
    
    try {
        const { data: outlets, error } = await supabase
            .from('karyawan')
            .select('outlet')
            .not('outlet', 'is', null)
            .order('outlet');
        
        if (error) throw error;
        
        // Get unique outlets
        const uniqueOutlets = [...new Set(outlets.map(o => o.outlet))].filter(Boolean);
        
        let options = '<option value="all">Semua Outlet</option>';
        uniqueOutlets.forEach(outlet => {
            // Check if this outlet should be selected
            const shouldSelect = selectedOutletFilter === outlet || 
                               (selectedOutletFilter === 'all' && outlet === currentOutletStok);
            const selected = shouldSelect ? 'selected' : '';
            options += `<option value="${outlet}" ${selected}>${outlet}</option>`;
        });
        
        select.innerHTML = options;
        
        // Force update selected value
        if (selectedOutletFilter && selectedOutletFilter !== 'all') {
            select.value = selectedOutletFilter;
        }
        
    } catch (error) {
        console.error('Error loading outlets for stok:', error);
        select.innerHTML = '<option value="all">Semua Outlet</option>';
    }
}

// [23] Show request modal untuk KASIR (MULTIPLE ITEMS)
async function showRequestModal() {
    const modal = document.getElementById('requestModal');
    if (!modal) return;
    
    // Reset items list
    requestItems = [];
    updateItemsList();
    
    // Load produk untuk dropdown
    await loadProdukForRequest();
    
    // Reset form
    document.getElementById('stokRequestForm')?.reset();
    document.getElementById('currentStockInfo').style.display = 'none';
    document.getElementById('submitRequest').disabled = true;
    
    // Show modal
    modal.style.display = 'flex';
}

// [24] Close request modal
function closeRequestModal() {
    const modal = document.getElementById('requestModal');
    if (modal) {
        modal.style.display = 'none';
        
        // Reset items
        requestItems = [];
        updateItemsList();
        
        // Reset form
        const form = document.getElementById('stokRequestForm');
        if (form) form.reset();
    }
}

// [25] Load produk untuk request dropdown (HANYA INVENTORY=TRUE)
async function loadProdukForRequest() {
    const select = document.getElementById('selectProdukRequest');
    if (!select) return;
    
    try {
        const { data: produkData, error } = await supabase
            .from('produk')
            .select('id, nama_produk, stok, group_produk')
            .eq('outlet', currentOutletStok)
            .eq('status', 'active')
            .eq('inventory', true) // Hanya produk inventory
            .order('nama_produk');
        
        if (error) throw error;
        
        select.innerHTML = `
            <option value="">-- Pilih Produk --</option>
            ${produkData.map(p => `
                <option value="${p.id}" data-stock="${p.stok}">
                    ${p.nama_produk} (Stok: ${p.stok})
                </option>
            `).join('')}
        `;
        
    } catch (error) {
        console.error('Error loading produk for request:', error);
        select.innerHTML = '<option value="">Error loading produk</option>';
    }
}

// [26] Load produk untuk owner adjustment (HANYA INVENTORY=TRUE) - FIXED
async function loadProdukForAdjustment() {
    const outletSelect = document.getElementById('adjustOutlet');
    const produkSelect = document.getElementById('adjustProduk');
    
    if (!outletSelect || !produkSelect) return;
    
    try {
        // Load semua outlet untuk owner
        const { data: outlets } = await supabase
            .from('karyawan')
            .select('outlet')
            .not('outlet', 'is', null);
        
        if (outlets && outlets.length > 0) {
            const uniqueOutlets = [...new Set(outlets.map(o => o.outlet))].filter(Boolean);
            let options = '<option value="">-- Pilih Outlet --</option>';
            uniqueOutlets.forEach(outlet => {
                options += `<option value="${outlet}">${outlet}</option>`;
            });
            outletSelect.innerHTML = options;
        } else {
            outletSelect.innerHTML = `<option value="${currentOutletStok}">${currentOutletStok}</option>`;
        }
        
        // Reset produk dropdown dulu
        produkSelect.innerHTML = '<option value="">-- Pilih Outlet terlebih dahulu --</option>';
        
        // Event listener untuk load produk ketika outlet dipilih
        outletSelect.addEventListener('change', async function() {
            const selectedOutlet = this.value;
            if (!selectedOutlet) {
                produkSelect.innerHTML = '<option value="">-- Pilih Outlet terlebih dahulu --</option>';
                return;
            }
            
            // Load produk untuk outlet yang dipilih
            const { data: produkData, error } = await supabase
                .from('produk')
                .select('id, nama_produk, stok')
                .eq('outlet', selectedOutlet)
                .eq('status', 'active')
                .eq('inventory', true)
                .order('nama_produk');
            
            if (error) {
                console.error('Error loading produk:', error);
                produkSelect.innerHTML = '<option value="">Error loading produk</option>';
                return;
            }
            
            if (produkData && produkData.length > 0) {
                produkSelect.innerHTML = `
                    <option value="">-- Pilih Produk --</option>
                    ${produkData.map(p => `
                        <option value="${p.id}">
                            ${p.nama_produk} (Stok: ${p.stok})
                        </option>
                    `).join('')}
                `;
            } else {
                produkSelect.innerHTML = '<option value="">Tidak ada produk inventory</option>';
            }
        });
        
    } catch (error) {
        console.error('Error loading produk for adjustment:', error);
        outletSelect.innerHTML = '<option value="">Error loading outlets</option>';
        produkSelect.innerHTML = '<option value="">Error loading produk</option>';
    }
}

// [27] Update current stock info in modal
async function updateCurrentStockInfo(productId) {
    const stockValue = document.getElementById('currentStockValue');
    const stockInfo = document.getElementById('currentStockInfo');
    
    if (!productId) {
        stockInfo.style.display = 'none';
        return;
    }
    
    try {
        const { data: produk, error } = await supabase
            .from('produk')
            .select('stok')
            .eq('id', productId)
            .single();
        
        if (error) throw error;
        
        if (stockValue) stockValue.textContent = produk.stok;
        if (stockInfo) stockInfo.style.display = 'block';
        
        // Update qty limits
        updateQtyLimits();
        
    } catch (error) {
        console.error('Error getting current stock:', error);
        if (stockValue) stockValue.textContent = 'Error';
    }
}

// [28] Update quantity limits based on stok type
function updateQtyLimits() {
    const stokType = document.getElementById('stokType')?.value;
    const qtyInput = document.getElementById('qtyChange');
    const currentStock = parseInt(document.getElementById('currentStockValue')?.textContent || 0);
    
    if (!qtyInput) return;
    
    if (stokType === 'keluar') {
        // Untuk stok keluar, maksimal tidak boleh melebihi stok saat ini
        qtyInput.max = currentStock;
        qtyInput.title = `Maksimal: ${currentStock} unit (stok saat ini)`;
    } else {
        // Untuk stok masuk, tidak ada batas maksimal
        qtyInput.removeAttribute('max');
        qtyInput.title = '';
    }
}

// [29] Add item to list (MULTIPLE ITEMS)
async function addItemToList() {
    try {
        const productId = document.getElementById('selectProdukRequest')?.value;
        const productSelect = document.getElementById('selectProdukRequest');
        const productName = productSelect?.selectedOptions[0]?.text.split(' (Stok:')[0] || '';
        const stokType = document.getElementById('stokType')?.value;
        const qtyChange = parseInt(document.getElementById('qtyChange')?.value || 0);
        
        if (!productId) {
            alert('Pilih produk terlebih dahulu');
            return;
        }
        
        if (qtyChange <= 0) {
            alert('Jumlah harus lebih dari 0');
            return;
        }
        
        // Get current stock
        const { data: produk, error } = await supabase
            .from('produk')
            .select('stok, group_produk')
            .eq('id', productId)
            .single();
        
        if (error) throw error;
        
        // Check for stok keluar
        if (stokType === 'keluar' && qtyChange > produk.stok) {
            alert(`Stok tidak mencukupi! Stok saat ini: ${produk.stok}`);
            return;
        }
        
        // Check if product already in list
        const existingItemIndex = requestItems.findIndex(item => 
            item.produk_id === productId && item.stok_type === stokType
        );
        
        if (existingItemIndex !== -1) {
            // Update existing item
            requestItems[existingItemIndex].qty_change += stokType === 'masuk' ? qtyChange : -qtyChange;
            
            // Check stock again for updated quantity
            if (stokType === 'keluar') {
                const totalQty = Math.abs(requestItems[existingItemIndex].qty_change);
                if (totalQty > produk.stok) {
                    alert(`Total stok keluar (${totalQty}) melebihi stok saat ini (${produk.stok})`);
                    requestItems[existingItemIndex].qty_change = stokType === 'masuk' ? qtyChange : -qtyChange;
                    return;
                }
            }
        } else {
            // Add new item
            requestItems.push({
                produk_id: productId,
                nama_produk: productName,
                group_produk: produk.group_produk || '',
                stok_type: stokType,
                qty_change: stokType === 'masuk' ? qtyChange : -qtyChange,
                current_stock: produk.stok,
                qty_before: produk.stok,
                qty_after: stokType === 'masuk' ? produk.stok + qtyChange : produk.stok - qtyChange
            });
        }
        
        // Update UI
        updateItemsList();
        
        // Reset form
        document.getElementById('qtyChange').value = 1;
        
    } catch (error) {
        console.error('Error adding item:', error);
        alert('Gagal menambah item: ' + error.message);
    }
}

// [30] Update items list display
function updateItemsList() {
    const itemsList = document.getElementById('itemsList');
    const itemsSummary = document.getElementById('itemsSummary');
    const submitBtn = document.getElementById('submitRequest');
    
    if (!itemsList || !itemsSummary || !submitBtn) return;
    
    if (requestItems.length === 0) {
        itemsList.innerHTML = `
            <div class="empty-list">
                <i class="fas fa-clipboard-list"></i>
                <p>Belum ada item ditambahkan</p>
            </div>
        `;
        itemsSummary.style.display = 'none';
        submitBtn.disabled = true;
        return;
    }
    
    // Display items
    itemsList.innerHTML = requestItems.map((item, index) => {
        const typeClass = item.stok_type === 'masuk' ? 'type-in' : 'type-out';
        const typeIcon = item.stok_type === 'masuk' ? 'fa-arrow-down' : 'fa-arrow-up';
        const typeText = item.stok_type === 'masuk' ? 'Stok Masuk' : 'Stok Keluar';
        
        return `
            <div class="item-row" data-index="${index}">
                <div class="item-info">
                    <div class="item-name">${item.nama_produk}</div>
                    <div class="item-details">
                        <span class="item-type ${typeClass}">
                            <i class="fas ${typeIcon}"></i> ${typeText}
                        </span>
                        <span class="item-qty ${typeClass}">
                            ${item.stok_type === 'masuk' ? '+' : '-'}${Math.abs(item.qty_change)} unit
                        </span>
                        <span class="item-stock">
                            Stok: ${item.qty_before} → ${item.qty_after}
                        </span>
                    </div>
                </div>
                <button class="btn-remove-item" data-index="${index}" title="Hapus item">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }).join('');
    
    // Calculate summary
    const totalItems = requestItems.length;
    const totalMasuk = requestItems
        .filter(item => item.stok_type === 'masuk')
        .reduce((sum, item) => sum + Math.abs(item.qty_change), 0);
    const totalKeluar = requestItems
        .filter(item => item.stok_type === 'keluar')
        .reduce((sum, item) => sum + Math.abs(item.qty_change), 0);
    
    // Update summary
    document.getElementById('totalItemsCount').textContent = totalItems;
    document.getElementById('totalMasukCount').textContent = totalMasuk;
    document.getElementById('totalKeluarCount').textContent = totalKeluar;
    
    itemsSummary.style.display = 'block';
    submitBtn.disabled = false;
    
    // Add event listeners for remove buttons
    document.querySelectorAll('.btn-remove-item').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            removeItemFromList(index);
        });
    });
}

// [31] Remove item from list
function removeItemFromList(index) {
    if (index >= 0 && index < requestItems.length) {
        requestItems.splice(index, 1);
        updateItemsList();
    }
}

// [32] Submit stok request (MULTIPLE ITEMS)
async function submitStokRequest() {
    try {
        if (requestItems.length === 0) {
            alert('Tambah minimal satu item sebelum submit');
            return;
        }
        
        const notes = document.getElementById('requestNotes')?.value || '';
        
        // Create requests for all items
        const requests = requestItems.map(item => ({
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
            notes: notes,
            created_at: new Date().toISOString()
        }));
        
        const { data, error } = await supabase
            .from('stok_update')
            .insert(requests)
            .select();
        
        if (error) throw error;
        
        // Success
        alert(`Request berhasil dikirim! Total ${requestItems.length} item menunggu approval.`);
        closeRequestModal();
        
        // Refresh data
        loadStokData();
        
    } catch (error) {
        console.error('Error submitting stok request:', error);
        alert('Gagal mengirim request: ' + error.message);
    }
}

// [33] Handle quick adjustment (OWNER) - UPDATE PRODUK.STOK - FIXED
async function handleQuickAdjust() {
    try {
        const outlet = document.getElementById('adjustOutlet')?.value;
        const productId = document.getElementById('adjustProduk')?.value;
        const stokType = document.getElementById('adjustType')?.value;
        const qtyChange = parseInt(document.getElementById('adjustQty')?.value || 0);
        const notes = document.getElementById('adjustNotes')?.value;
        
        if (!outlet) {
            alert('Pilih outlet terlebih dahulu');
            return;
        }
        
        if (!productId) {
            alert('Pilih produk terlebih dahulu');
            return;
        }
        
        if (qtyChange <= 0) {
            alert('Jumlah harus lebih dari 0');
            return;
        }
        
        if (!notes) {
            alert('Harap isi alasan adjustment');
            return;
        }
        
        // Get product info (dengan outlet yang spesifik)
        const { data: produk, error: produkError } = await supabase
            .from('produk')
            .select('nama_produk, group_produk, stok')
            .eq('id', productId)
            .eq('outlet', outlet) // PASTIKAN outlet sesuai
            .single();
        
        if (produkError) {
            console.error('Product error:', produkError);
            alert('Produk tidak ditemukan di outlet ini!');
            return;
        }
        
        // Calculate quantities
        const qtyBefore = produk.stok;
        const qtyChangeFinal = stokType === 'masuk' ? qtyChange : -qtyChange;
        const qtyAfter = qtyBefore + qtyChangeFinal;
        
        // Validate untuk stok keluar
        if (stokType === 'keluar' && qtyAfter < 0) {
            alert('Stok tidak mencukupi! Stok saat ini: ' + qtyBefore);
            return;
        }
        
        // Create adjustment (auto approved for owner)
        const adjustmentData = {
            tanggal: new Date().toISOString().split('T')[0],
            outlet: outlet,
            stok_type: stokType,
            updated_by: currentUserStok.nama_karyawan,
            nama_produk: produk.nama_produk,
            group_produk: produk.group_produk || '',
            qty_before: qtyBefore,
            qty_change: qtyChangeFinal,
            qty_after: qtyAfter,
            approval_status: 'approved',
            approved_by: currentUserStok.nama_karyawan,
            notes: notes,
            created_at: new Date().toISOString()
        };
        
        // Insert ke stok_update
        const { data, error } = await supabase
            .from('stok_update')
            .insert([adjustmentData]);
        
        if (error) throw error;
        
        // UPDATE PRODUK.STOK
        const { error: updateError } = await supabase
            .from('produk')
            .update({ 
                stok: qtyAfter,
                updated_at: new Date().toISOString()
            })
            .eq('id', productId)
            .eq('outlet', outlet); // PASTIKAN outlet sesuai
        
        if (updateError) {
            console.error('Update produk error:', updateError);
            throw updateError;
        }
        
        // Success
        alert('Adjustment berhasil disimpan! Stok produk diperbarui.');
        
        // Reset form
        document.getElementById('quickAdjustForm').reset();
        document.getElementById('adjustFormContainer').style.display = 'none';
        
        // Refresh data
        loadStokData();
        
    } catch (error) {
        console.error('Error handling quick adjustment:', error);
        alert('Gagal menyimpan adjustment: ' + error.message);
    }
}

// [34] Helper: Get stock status class
function getStockStatusClass(stock) {
    if (stock === 0) return 'stock-out';
    if (stock <= 10) return 'stock-low';
    return 'stock-ok';
}

// [35] Helper: Get approval status class
function getApprovalStatusClass(status) {
    switch(status) {
        case 'approved': return 'status-approved';
        case 'rejected': return 'status-rejected';
        default: return 'status-pending';
    }
}

// [36] Helper: Get approval status text
function getApprovalStatusText(status) {
    switch(status) {
        case 'approved': return 'Disetujui';
        case 'rejected': return 'Ditolak';
        default: return 'Menunggu';
    }
}

// [37] Helper: Format date for stok
function formatDateStok(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short'
        });
    } catch (error) {
        return dateString;
    }
}

// [38] Helper: Format date time
function formatDateTime(dateTimeString) {
    if (!dateTimeString) return '-';
    
    try {
        const date = new Date(dateTimeString);
        return date.toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateTimeString;
    }
}

// [39] Helper: Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    
    const content = document.querySelector('.stok-content');
    if (content) {
        content.prepend(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

// [40] Close modals on outside click
document.addEventListener('click', function(e) {
    // Close approval modal
    if (e.target.id === 'closeApprovalModal' || e.target.id === 'approvalModal') {
        document.getElementById('approvalModal').style.display = 'none';
    }
    
    // Close request modal on outside click
    const requestModal = document.getElementById('requestModal');
    if (e.target === requestModal) {
        closeRequestModal();
    }
});
// ========== END OF STOK FUNCTIONS ==========
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
                    <button class="refresh-btn" id="refreshRequestsKasir">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                ` : `
                    <button class="refresh-btn" id="refreshRequests">
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
            <!-- Filter Section - URUTAN DIMODIFIKASI -->
            <div class="search-filter-section">
                <div class="filter-row">
                    <!-- GROUP Filter (Urutan 1) -->
                    <div class="filter-group">
                        <label for="filterGroup"><i class="fas fa-layer-group"></i> Group:</label>
                        <select id="filterGroup" class="group-select">
                            <option value="">Semua Group</option>
                        </select>
                    </div>
                    
                    <!-- CATEGORY Filter (Urutan 2) -->
                    <div class="filter-group">
                        <label for="filterCategory"><i class="fas fa-tags"></i> Kategori:</label>
                        <select id="filterCategory" class="category-select" disabled>
                            <option value="">Pilih Group dulu</option>
                        </select>
                    </div>
                    
                    <!-- STATUS Filter (Urutan 3) -->
                    <div class="filter-group">
                        <label for="filterStatus"><i class="fas fa-check-circle"></i> Status:</label>
                        <select id="filterStatus" class="status-select">
                            <option value="all">Semua Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    
                    <!-- Search Box -->
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="searchInventory" placeholder="Ketik nama item atau SKU... (min. 2 karakter)">
                        <button class="clear-search" id="clearSearchBtn" title="Clear search">
                            <i class="fas fa-times"></i>
                        </button>
                        <button class="btn-search-action" id="applyFilterBtn">
                            <i class="fas fa-filter"></i> Terapkan Filter
                        </button>
                    </div>
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
                    <h3><i class="fas fa-history"></i> Request History</h3>
                    <button class="btn-refresh-history" onclick="loadKasirHistory()">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
                <div class="history-table-container">
                    <div class="loading" id="loadingHistoryKasir">Memuat history request...</div>
                    <div class="table-wrapper">
                        <table class="history-table horizontal-scroll" id="historyTableKasir" style="display: none;">
                            <thead>
                                <tr>
                                    <th width="120px">Tanggal</th>
                                    <th width="100px">Batch ID</th>
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
            </div>
        </div>
        ` : `
        <!-- Untuk OWNER: Approval Requests - DIMODIFIKASI: Tambah Reject Selected -->
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
        
        // Query request history untuk karyawan ini
        const { data: requests, error } = await supabase
            .from('request_barang')
            .select('*')
            .eq('karyawan', currentKaryawanRequest.nama_karyawan)
            .order('created_at', { ascending: false })
            .limit(50); // Tampilkan lebih banyak data
        
        if (error) throw error;
        
        displayKasirHistory(requests || []);
        
    } catch (error) {
        console.error('Error loading kasir history:', error);
        const tbody = document.getElementById('historyBodyKasir');
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
        const loadingEl = document.getElementById('loadingHistoryKasir');
        const tableEl = document.getElementById('historyTableKasir');
        
        if (loadingEl) loadingEl.style.display = 'none';
        if (tableEl) tableEl.style.display = 'table';
    }
}

// [15] Fungsi untuk display kasir history - DIMODIFIKASI
function displayKasirHistory(requests) {
    const tbody = document.getElementById('historyBodyKasir');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!requests || requests.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-message">
                    <i class="fas fa-inbox"></i>
                    Belum ada request
                </td>
            </tr>
        `;
        return;
    }
    
    // Batasi maksimal 10 baris untuk performance
    const displayRequests = requests.slice(0, 10);
    
    displayRequests.forEach((request, index) => {
        const createdDate = new Date(request.created_at);
        const approvedDate = request.approved_at ? new Date(request.approved_at) : null;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                ${createdDate.toLocaleDateString('id-ID')}<br>
                <small>${createdDate.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</small>
            </td>
            <td><code title="${request.batch_id}">${request.batch_id ? request.batch_id.substring(0, 8) + '...' : '-'}</code></td>
            <td>
                <div class="item-name">${request.item}</div>
                <div class="item-sku"><small>SKU: ${request.sku}</small></div>
            </td>
            <td>${request.qty || 0}</td>
            <td>${formatRupiah(request.unit_price || 0)}</td>
            <td>${formatRupiah(request.total_price || 0)}</td>
            <td>
                <span class="status-pill ${getRequestStatusClass(request.status)}">
                    ${request.status}
                </span>
            </td>
            <td>${request.approved_by || '-'}</td>
            <td>
                ${approvedDate ? approvedDate.toLocaleDateString('id-ID') : '-'}<br>
                ${approvedDate ? `<small>${approvedDate.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</small>` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Jika ada lebih dari 10 item, tambahkan note
    if (requests.length > 10) {
        const infoRow = document.createElement('tr');
        infoRow.className = 'info-row';
        infoRow.innerHTML = `
            <td colspan="9" style="text-align: center; color: #6c757d; font-style: italic;">
                <i class="fas fa-info-circle"></i> Menampilkan 10 dari ${requests.length} history request.
            </td>
        `;
        tbody.appendChild(infoRow);
    }
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
        
        // Build query
        let query = supabase
            .from('request_barang')
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
        
        const { data: requests, error } = await query;
        
        if (error) throw error;
        
        // Group requests by batch_id for pending section
        const groupedRequests = groupRequestsByBatch(requests || []);
        
        // Display data
        displayPendingRequests(groupedRequests);
        displayRequestHistory(requests || []);
        
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
        const historyTable = document.getElementById('historyTable');
        
        if (loadingPending) loadingPending.style.display = 'none';
        if (pendingGrid) pendingGrid.style.display = 'block';
        if (loadingHistory) loadingHistory.style.display = 'none';
        if (historyTable) historyTable.style.display = 'table';
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

// [24] Display pending requests for owner - DIMODIFIKASI: Tambah Reject Selected
function displayPendingRequests(groupedRequests) {
    const pendingGrid = document.getElementById('pendingRequestsGrid');
    const pendingCountEl = document.getElementById('pendingCount');
    
    if (!pendingGrid) return;
    
    // Filter hanya yang status pending
    const pendingRequests = groupedRequests.filter(group => group.status === 'pending');
    
    // Update count
    if (pendingCountEl) {
        pendingCountEl.textContent = `${pendingRequests.length} requests pending`;
    }
    
    if (pendingRequests.length === 0) {
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
    
    pendingRequests.forEach(group => {
        const date = new Date(group.created_at);
        const formattedDate = date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        html += `
            <div class="request-card" data-batch-id="${group.batch_id}">
                <div class="request-card-header">
                    <div class="request-id">
                        <i class="fas fa-hashtag"></i>
                        <span>Batch: ${group.batch_id.substring(0, 8)}...</span>
                    </div>
                    <div class="request-date">
                        <i class="far fa-clock"></i>
                        <span>${formattedDate}</span>
                    </div>
                </div>
                
                <div class="request-card-body">
                    <div class="request-info">
                        <div class="info-item">
                            <i class="fas fa-store"></i>
                            <span>${group.outlet || '-'}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-user"></i>
                            <span>${group.karyawan || '-'}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-box"></i>
                            <span>${group.total_items} items</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-calculator"></i>
                            <span>Total: ${formatRupiah(group.total_amount)}</span>
                        </div>
                    </div>
                    
                    ${group.notes ? `
                    <div class="request-notes">
                        <i class="fas fa-sticky-note"></i>
                        <span>${group.notes}</span>
                    </div>
                    ` : ''}
                    
                    <div class="request-items">
                        <h5>Items Requested:</h5>
                        <div class="table-wrapper">
                            <table class="items-table horizontal-scroll">
                                <thead>
                                    <tr>
                                        <th width="30px">
                                            <input type="checkbox" class="select-all-checkbox" 
                                                onchange="toggleSelectAllItems('${group.batch_id}', this.checked)">
                                        </th>
                                        <th>Item</th>
                                        <th width="80px">Qty</th>
                                        <th width="120px">Harga</th>
                                        <th width="120px">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${group.items.map(item => `
                                        <tr data-item-id="${item.id}" data-batch-id="${group.batch_id}">
                                            <td>
                                                <input type="checkbox" class="approve-checkbox" 
                                                    data-item-id="${item.id}"
                                                    data-batch-id="${group.batch_id}"
                                                    onchange="toggleItemSelection('${item.id}', '${group.batch_id}', this.checked)">
                                            </td>
                                            <td>
                                                <div class="item-name">${item.item}</div>
                                                <div class="item-sku">SKU: ${item.sku}</div>
                                            </td>
                                            <td>${item.qty} ${item.unit_type || 'pcs'}</td>
                                            <td>${formatRupiah(item.unit_price)}</td>
                                            <td>${formatRupiah(item.total_price)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <div class="request-card-footer">
                    <button class="btn-reject" onclick="rejectSelectedItems('${group.batch_id}')">
                        <i class="fas fa-times"></i> Reject Selected
                    </button>
                    <button class="btn-reject-all" onclick="rejectRequest('${group.batch_id}')">
                        <i class="fas fa-ban"></i> Reject All
                    </button>
                    <button class="btn-approve" onclick="approveSelectedItems('${group.batch_id}')">
                        <i class="fas fa-check"></i> Approve Selected
                    </button>
                    <button class="btn-approve-all" onclick="approveAllItems('${group.batch_id}')">
                        <i class="fas fa-check-double"></i> Approve All
                    </button>
                </div>
            </div>
        `;
    });
    
    pendingGrid.innerHTML = html;
}

// [25] Display request history untuk Owner - DIMODIFIKASI
function displayRequestHistory(requests) {
    const tbody = document.getElementById('historyBody');
    if (!tbody) return;
    
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

// [27] Fungsi untuk approve selected items
async function approveSelectedItems(batchId) {
    try {
        // Get all checked items for this batch
        const checkboxes = document.querySelectorAll(`
            .request-card[data-batch-id="${batchId}"] 
            .approve-checkbox:checked
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
        
        // Check if all items in batch are approved
        await checkBatchCompleteStatus(batchId);
        
        // Reload requests
        await loadRequestsForOwner();
        
        showToast(`✅ ${itemIds.length} item berhasil di-approve!`, 'success');
        
    } catch (error) {
        console.error('Error approving items:', error);
        showToast(`❌ Gagal approve items: ${error.message}`, 'error');
    }
}

// [28] Fungsi untuk approve all items
async function approveAllItems(batchId) {
    try {
        const approveAll = confirm('Approve semua item dalam batch ini?');
        
        if (!approveAll) return;
        
        // Update all items in batch
        const { error } = await supabase
            .from('request_barang')
            .update({ 
                status: 'approved',
                approved_at: new Date().toISOString(),
                approved_by: currentKaryawanRequest.nama_karyawan
            })
            .eq('batch_id', batchId)
            .eq('status', 'pending');
        
        if (error) throw error;
        
        // Reload requests
        await loadRequestsForOwner();
        
        showToast('✅ Semua item dalam batch berhasil di-approve!', 'success');
        
    } catch (error) {
        console.error('Error approving all items:', error);
        showToast(`❌ Gagal approve semua items: ${error.message}`, 'error');
    }
}

// [29] Fungsi untuk reject selected items - BARU
async function rejectSelectedItems(batchId) {
    try {
        // Get all checked items for this batch
        const checkboxes = document.querySelectorAll(`
            .request-card[data-batch-id="${batchId}"] 
            .approve-checkbox:checked
        `);
        
        if (checkboxes.length === 0) {
            alert('Pilih minimal 1 item untuk di-reject!');
            return;
        }
        
        const itemIds = Array.from(checkboxes).map(cb => cb.getAttribute('data-item-id'));
        const rejectAll = confirm(`Reject ${itemIds.length} item yang dipilih?\n\nItem yang tidak dipilih akan tetap status pending.`);
        
        if (!rejectAll) return;
        
        // Update status in database
        const { error } = await supabase
            .from('request_barang')
            .update({ 
                status: 'rejected',
                approved_at: new Date().toISOString(),
                approved_by: currentKaryawanRequest.nama_karyawan
            })
            .in('id', itemIds);
        
        if (error) throw error;
        
        // Check if all items in batch are approved
        await checkBatchCompleteStatus(batchId);
        
        // Reload requests
        await loadRequestsForOwner();
        
        showToast(`❌ ${itemIds.length} item berhasil di-reject!`, 'success');
        
    } catch (error) {
        console.error('Error rejecting items:', error);
        showToast(`❌ Gagal reject items: ${error.message}`, 'error');
    }
}

// [30] Fungsi untuk reject request
async function rejectRequest(batchId) {
    try {
        const rejectAll = confirm('Tolak semua item dalam batch ini?\n\nSemua item akan berstatus rejected.');
        
        if (!rejectAll) return;
        
        // Update all items in batch
        const { error } = await supabase
            .from('request_barang')
            .update({ 
                status: 'rejected',
                approved_at: new Date().toISOString(),
                approved_by: currentKaryawanRequest.nama_karyawan
            })
            .eq('batch_id', batchId)
            .eq('status', 'pending');
        
        if (error) throw error;
        
        // Reload requests
        await loadRequestsForOwner();
        
        showToast('❌ Batch request telah ditolak!', 'success');
        
    } catch (error) {
        console.error('Error rejecting request:', error);
        showToast(`❌ Gagal reject request: ${error.message}`, 'error');
    }
}

// [31] Check if batch is partially or fully approved
async function checkBatchCompleteStatus(batchId) {
    try {
        // Get remaining pending items in batch
        const { data: pendingItems, error } = await supabase
            .from('request_barang')
            .select('id')
            .eq('batch_id', batchId)
            .eq('status', 'pending');
        
        if (error) throw error;
        
        // If there are still pending items, update batch to partially_approved
        if (pendingItems && pendingItems.length > 0) {
            await supabase
                .from('request_barang')
                .update({ 
                    status: 'partially_approved'
                })
                .eq('batch_id', batchId)
                .eq('status', 'pending');
        }
        
    } catch (error) {
        console.error('Error checking batch status:', error);
    }
}

// [32] Helper functions - DITAMBAHKAN
function toggleSelectAllItems(batchId, isChecked) {
    const checkboxes = document.querySelectorAll(`
        .request-card[data-batch-id="${batchId}"] 
        .approve-checkbox
    `);
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
        const row = checkbox.closest('tr');
        if (row) {
            row.classList.toggle('selected', isChecked);
        }
    });
}

function toggleItemSelection(itemId, batchId, isChecked) {
    const row = document.querySelector(`tr[data-item-id="${itemId}"][data-batch-id="${batchId}"]`);
    if (row) {
        row.classList.toggle('selected', isChecked);
    }
}

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

// [33] Global functions untuk onclick events
window.adjustSelectedItemQty = adjustSelectedItemQty;
window.updateSelectedItemQty = updateSelectedItemQty;
window.removeSelectedItem = removeSelectedItem;
window.approveSelectedItems = approveSelectedItems;
window.rejectSelectedItems = rejectSelectedItems;
window.approveAllItems = approveAllItems;
window.rejectRequest = rejectRequest;
window.toggleSelectAllItems = toggleSelectAllItems;
window.toggleItemSelection = toggleItemSelection;
window.toggleInventoryItemSelection = toggleInventoryItemSelection;
window.addSingleItemToRequest = addSingleItemToRequest;
window.loadKasirHistory = loadKasirHistory;
window.loadInventoryWithFilter = loadInventoryWithFilter;

// ========== END OF REQUEST IMPLEMENTATION ==========
// ========== END OF FILE ==========
