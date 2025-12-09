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

// [2] Fungsi untuk buat halaman absensi - TAMBAHKAN KOLOM JADWAL
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
        
        <!-- Filter untuk Owner - SAMAKAN DENGAN KOMISI -->
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
            await loadKaryawanDropdownAbsensi(); // Reload karyawan berdasarkan outlet
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

// [6] Fungsi untuk load absensi hari ini - DENGAN JADWAL
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

// [7] Fungsi untuk load absensi 7 hari terakhir - DENGAN JADWAL
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

// [8] Helper: Process data untuk owner (semua karyawan) - DENGAN JADWAL
function processOwnerWeeklyData(absensiData, dateRange, jadwalDefault) {
    const result = [];
    
    dateRange.forEach(dateStr => {
        const dataForDate = absensiData?.filter(item => item.tanggal === dateStr) || [];
        
        if (dataForDate.length > 0) {
            // Untuk owner: tampilkan summary atau data pertama
            const firstData = dataForDate[0];
            result.push({
                tanggal: dateStr,
                tanggal_display: formatDateDisplay(dateStr),
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
                tanggal_display: formatDateDisplay(dateStr),
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

// [9] Helper: Process data untuk karyawan tertentu - DENGAN JADWAL
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
                tanggal_display: formatDateDisplay(dateStr),
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
                tanggal_display: formatDateDisplay(dateStr),
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

// [10] Fungsi untuk tampilkan absensi hari ini - DENGAN JADWAL & ABSENSI
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

// [11] Fungsi untuk tampilkan absensi 7 hari - DENGAN KOLOM JADWAL
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



// [12] Fungsi untuk load dropdown outlet (owner only) - DARI KARYAWAN
async function loadOutletDropdownAbsensi() {
    const select = document.getElementById('selectOutletAbsensi');
    
    try {
        const { data: outlets, error } = await supabase
            .from('karyawan')  // AMBIL DARI KARYAWAN
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
// ========== FUNGSI BARU/REVISI ==========

// [14] Fungsi untuk ambil jadwal dari tabel karyawan - DIHIDUPKAN KEMBALI
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

// [16] Helper: Format tanggal untuk display
function formatDateDisplay(dateStr) {
    if (!dateStr) return '-';
    const [day, month, year] = dateStr.split('/');
    return `${day}/${month}/${year}`;
}
// ========== HELPER FUNCTIONS YANG DIPERTAHANKAN ==========

// Format tanggal untuk display
function formatDateLocal(date) {
    return date.toLocaleDateString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Format tanggal DD/MM/YYYY ke tampilan
function formatDateDisplay(dateStr) {
    if (!dateStr) return '-';
    const [day, month, year] = dateStr.split('/');
    return `${day}/${month}/${year}`;
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
// ========== FUNGSI MENU KOMPONEN - KAS & SETORAN ==========
// ==========================================================

// Variabel global untuk state Kas & Setoran
let currentKasUser = null;
let isOwnerKas = false;
let currentOutletKas = null;

// State untuk data manual
let manualPemasukanItems = [];
let manualPengeluaranItems = [];
let isAddingPemasukan = false;
let isAddingPengeluaran = false;

// Konfigurasi WhatsApp API
const WA_API_URL = 'https://waha-yetv8qi4e3zk.anakit.sumopod.my.id/api/sendText';
const WA_API_KEY = 'sfcoGbpdLDkGZhKw2rx8sbb14vf4d8V6';
const WA_CHAT_ID = '62811159429-1533260196@g.us';

// [1] Fungsi untuk tampilkan halaman Kas & Setoran
async function showKasPage() {
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
        
        currentKasUser = {
            nama_karyawan: namaKaryawan,
            role: karyawanData.role,
            outlet: karyawanData.outlet
        };
        
        currentOutletKas = karyawanData.outlet;
        isOwnerKas = karyawanData.role === 'owner';
        
        // Reset state manual
        manualPemasukanItems = [];
        manualPengeluaranItems = [];
        isAddingPemasukan = false;
        isAddingPengeluaran = false;
        
        // Sembunyikan main app, tampilkan halaman Kas
        document.getElementById('appScreen').style.display = 'none';
        
        // Buat container halaman Kas
        createKasPage();
        
        // Load data awal
        await loadKasData();
        
    } catch (error) {
        console.error('Error in showKasPage:', error);
        alert('Gagal memuat halaman Kas & Setoran!');
    }
}

// [2] Fungsi untuk buat halaman Kas & Setoran
function createKasPage() {
    // Hapus halaman Kas sebelumnya jika ada
    const existingPage = document.getElementById('kasPage');
    if (existingPage) {
        existingPage.remove();
    }
    
    // Buat container halaman Kas
    const kasPage = document.createElement('div');
    kasPage.id = 'kasPage';
    kasPage.className = 'kas-page';
    
    // Buat header dengan back button
    const headerHTML = `
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
    `;
    
    // Buat konten utama
    const mainContentHTML = `
        <div class="kas-main-container">
            <!-- Header dengan tanggal -->
            <div class="kas-main-header">
                <h1>Laporan KAS & Setoran Babeh Barbershop</h1>
                <div class="kas-header-grid">
                    <div class="kas-date-box" id="currentDateKas">Memuat...</div>
                    
                    <!-- Filter untuk Owner -->
                    <div id="ownerKasFilterSection" style="display: ${isOwnerKas ? 'block' : 'none'};">
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <select id="selectOutletKas" class="period-select">
                                <option value="all">Semua Outlet</option>
                            </select>
                            <select id="selectKasirKas" class="period-select">
                                <option value="">Semua Kasir</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Ringkasan KAS -->
            <section class="kas-ringkasan-section">
                <div class="section-header">
                    <div>
                        <h2 class="section-title">Ringkasan KAS</h2>
                        <select id="periodeSelectKas" class="period-select period-select-container">
                            <!-- Options akan diisi oleh JavaScript -->
                        </select>
                    </div>
                    
                    <div class="action-buttons-row">
                        <button class="kas-action-btn setor" id="setorBtnKas">
                            <i class="fas fa-money-bill-wave"></i> SETOR
                        </button>
                        <button class="kas-action-btn verifikasi" id="verifikasiSetoranBtnKas" style="display: ${isOwnerKas ? 'flex' : 'none'};">
                            <i class="fas fa-check-circle"></i> VERIFIKASI SETORAN
                        </button>
                    </div>
                </div>
                
                <div id="ringkasanContainer">
                    <div class="loading" id="loadingRingkasan">Pilih outlet dan periode untuk melihat ringkasan KAS</div>
                    <div id="ringkasanContent" style="display: none;"></div>
                </div>
                
                <!-- Status Setoran -->
                <div class="status-setoran-card" id="statusSetoranCard" style="display: none;">
                    <h3><i class="fas fa-info-circle"></i> Status Setoran</h3>
                    <div class="status-grid" id="statusSetoranContent">
                        <!-- Data akan diisi oleh JavaScript -->
                    </div>
                </div>
            </section>
            
            <!-- Filter Tanggal untuk Input Data -->
            <section class="filter-tanggal-section">
                <h3><i class="fas fa-filter"></i> Filter Tanggal Input Data</h3>
                <div class="date-input-group">
                    <input type="date" id="filterTanggalKas" class="date-input">
                </div>
                <div class="tanggal-display-info" id="tanggalDisplayKas">
                    <i class="fas fa-calendar-alt"></i>
                    Hari ini: <span id="displayTanggalKas">-</span>
                </div>
            </section>
            
            <!-- Grid Pemasukan & Pengeluaran -->
            <div class="pemasukan-pengeluaran-grid">
                <!-- Pemasukan -->
                <div class="data-card pemasukan">
                    <div class="card-header">
                        <h2><i class="fas fa-arrow-down"></i> Pemasukan</h2>
                        <button class="tambah-btn" id="tambahPemasukanBtn">
                            <i class="fas fa-plus"></i> Tambah
                        </button>
                    </div>
                    
                    <div class="data-items-container" id="pemasukanContainer">
                        <div class="loading" id="loadingPemasukan">Loading data pemasukan...</div>
                    </div>
                    
                    <!-- Form Tambah Pemasukan Manual (hidden by default) -->
                    <div class="manual-input-form" id="formTambahPemasukan" style="display: none;">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="jenisPemasukan">Jenis Pemasukan</label>
                                <select id="jenisPemasukan" class="form-select">
                                    <option value="Top Up Kas">Top Up Kas</option>
                                    <option value="Pemasukan Lain Lain">Pemasukan Lain Lain</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="jumlahPemasukan">Jumlah</label>
                                <input type="number" id="jumlahPemasukan" class="form-input" placeholder="Masukkan jumlah">
                            </div>
                        </div>
                        <div class="form-row" id="notePemasukanRow" style="display: none;">
                            <div class="form-group" style="flex: 1;">
                                <label for="notePemasukan">Keterangan</label>
                                <input type="text" id="notePemasukan" class="form-input" placeholder="Keterangan pemasukan lain-lain">
                            </div>
                        </div>
                        <div class="form-actions">
                            <button class="save-btn" id="simpanPemasukanBtn">Simpan</button>
                            <button class="cancel-btn" id="batalPemasukanBtn">Batal</button>
                        </div>
                    </div>
                    
                    <!-- Manual Items Container -->
                    <div id="manualPemasukanContainer"></div>
                    
                    <!-- Total Section -->
                    <div class="total-with-manual pemasukan" id="totalPemasukanSection">
                        <div class="total-breakdown">
                            <div class="total-breakdown-item">
                                <span class="breakdown-label">Total Auto-generate</span>
                                <span class="breakdown-value auto" id="totalAutoPemasukan">0</span>
                            </div>
                            <div class="total-breakdown-item">
                                <span class="breakdown-label">Total Manual</span>
                                <span class="breakdown-value manual" id="totalManualPemasukan">0</span>
                            </div>
                        </div>
                        <div class="grand-total">
                            <span class="grand-total-label">TOTAL PEMASUKAN</span>
                            <span class="grand-total-value pemasukan" id="totalPemasukanDisplay">0</span>
                        </div>
                    </div>
                </div>
                
                <!-- Pengeluaran -->
                <div class="data-card pengeluaran">
                    <div class="card-header">
                        <h2><i class="fas fa-arrow-up"></i> Pengeluaran</h2>
                        <button class="tambah-btn" id="tambahPengeluaranBtn">
                            <i class="fas fa-plus"></i> Tambah
                        </button>
                    </div>
                    
                    <div class="data-items-container" id="pengeluaranContainer">
                        <div class="loading" id="loadingPengeluaran">Loading data pengeluaran...</div>
                    </div>
                    
                    <!-- Form Tambah Pengeluaran Manual (hidden by default) -->
                    <div class="manual-input-form" id="formTambahPengeluaran" style="display: none;">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="jenisPengeluaran">Jenis Pengeluaran</label>
                                <select id="jenisPengeluaran" class="form-select">
                                    <option value="Bayar Hutang Komisi">Bayar Hutang Komisi</option>
                                    <option value="Iuran RT">Iuran RT</option>
                                    <option value="Sumbangan">Sumbangan</option>
                                    <option value="Iuran Sampah">Iuran Sampah</option>
                                    <option value="Galon">Galon</option>
                                    <option value="Biaya Admin Setoran">Biaya Admin Setoran</option>
                                    <option value="Yakult">Yakult</option>
                                    <option value="Pengeluaran Lain Lain">Pengeluaran Lain Lain</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="jumlahPengeluaran">Jumlah</label>
                                <input type="number" id="jumlahPengeluaran" class="form-input" placeholder="Masukkan jumlah">
                            </div>
                        </div>
                        <div class="form-row" id="notePengeluaranRow" style="display: none;">
                            <div class="form-group" style="flex: 1;">
                                <label for="notePengeluaran">Keterangan</label>
                                <input type="text" id="notePengeluaran" class="form-input" placeholder="Keterangan pengeluaran lain-lain">
                            </div>
                        </div>
                        <div class="form-actions">
                            <button class="save-btn" id="simpanPengeluaranBtn">Simpan</button>
                            <button class="cancel-btn" id="batalPengeluaranBtn">Batal</button>
                        </div>
                    </div>
                    
                    <!-- Manual Items Container -->
                    <div id="manualPengeluaranContainer"></div>
                    
                    <!-- Total Section -->
                    <div class="total-with-manual pengeluaran" id="totalPengeluaranSection">
                        <div class="total-breakdown">
                            <div class="total-breakdown-item">
                                <span class="breakdown-label">Total Auto-generate</span>
                                <span class="breakdown-value pengeluaran-auto" id="totalAutoPengeluaran">0</span>
                            </div>
                            <div class="total-breakdown-item">
                                <span class="breakdown-label">Total Manual</span>
                                <span class="breakdown-value pengeluaran-manual" id="totalManualPengeluaran">0</span>
                            </div>
                        </div>
                        <div class="grand-total pengeluaran">
                            <span class="grand-total-label">TOTAL PENGELUARAN</span>
                            <span class="grand-total-value pengeluaran" id="totalPengeluaranDisplay">0</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Submit Button -->
            <div class="submit-section">
                <button class="submit-btn" id="submitBtnKas">
                    <i class="fas fa-paper-plane"></i> SUBMIT
                </button>
            </div>
            
            <!-- Modal Setoran -->
            <div class="modal-overlay" id="setoranModalKas">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-money-bill-wave"></i> Form Setoran</h3>
                        <button class="close-modal" id="closeModalKas">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="modal-info-item">
                            <div class="modal-label">Outlet</div>
                            <div class="modal-value" id="modalOutletKas">${currentOutletKas || '-'}</div>
                        </div>
                        
                        <div class="modal-info-item">
                            <div class="modal-label">Kasir</div>
                            <div class="modal-value" id="modalKasirKas">${currentKasUser?.nama_karyawan || '-'}</div>
                        </div>
                        
                        <div class="modal-info-item">
                            <div class="modal-label">Periode</div>
                            <div class="modal-value" id="modalPeriodeKas">-</div>
                        </div>
                        
                        <div class="modal-info-item">
                            <div class="modal-label">Total Kewajiban</div>
                            <div class="modal-value" id="modalKewajibanKas">-</div>
                        </div>
                        
                        <div class="modal-form-group">
                            <label for="totalSetoranInputKas">Total Setoran *</label>
                            <input type="number" id="totalSetoranInputKas" placeholder="Masukkan jumlah setoran">
                        </div>
                        
                        <div class="modal-form-group">
                            <label for="metodeSetoranKas">Metode Setoran *</label>
                            <select id="metodeSetoranKas">
                                <option value="">Pilih Metode</option>
                                <option value="Transfer BSI">Transfer BSI</option>
                                <option value="Transfer DANA">Transfer DANA</option>
                                <option value="Cash">Cash</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="modal-submit-btn" id="submitSetoranBtnKas">
                            <i class="fas fa-check"></i> SUBMIT SETORAN
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Loading Overlay -->
            <div class="kas-loading-overlay" id="kasLoadingOverlay" style="display: none;">
                <div class="kas-loading-spinner"></div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="kas-footer" style="text-align: center; padding: 20px; color: #718096; font-size: 0.9rem;">
            <p>Data diperbarui: <span id="lastUpdateKasTime">-</span></p>
        </div>
    `;
    
    kasPage.innerHTML = headerHTML + mainContentHTML;
    document.body.appendChild(kasPage);
    
    // Setup event listeners
    setupKasPageEvents();
    
    // Setup tanggal default dan periode
    setupTanggalDefault();
    generatePeriodOptionsKas();
    
    // Update waktu real-time
    updateDateTimeKas();
    setInterval(updateDateTimeKas, 1000);
}

// [3] Setup event listeners untuk halaman Kas
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
    
    // Filter untuk owner
    if (isOwnerKas) {
        // Load dropdown outlet
        loadOutletDropdownKas();
        
        // Event listener untuk outlet change
        document.getElementById('selectOutletKas').addEventListener('change', async () => {
            await loadKasirDropdownKas();
            await loadKasData();
        });
        
        // Event listener untuk kasir change
        document.getElementById('selectKasirKas').addEventListener('change', async () => {
            await loadKasData();
        });
    }
    
    // Periode change
    document.getElementById('periodeSelectKas').addEventListener('change', async function() {
        await loadKasData();
    });
    
    // Filter tanggal
    document.getElementById('filterTanggalKas').addEventListener('change', async function() {
        const selectedDate = new Date(this.value);
        updateTanggalDisplayKas(selectedDate);
        await loadKasData();
    });
    
    // Tombol setor
    document.getElementById('setorBtnKas').addEventListener('click', openSetoranModalKas);
    
    // Tombol verifikasi (owner only)
    document.getElementById('verifikasiSetoranBtnKas').addEventListener('click', verifikasiSetoranKas);
    
    // Tombol submit data
    document.getElementById('submitBtnKas').addEventListener('click', submitDataKas);
    
    // Modal events
    document.getElementById('closeModalKas').addEventListener('click', closeSetoranModalKas);
    document.getElementById('submitSetoranBtnKas').addEventListener('click', submitSetoranKas);
    
    // ===== EVENT LISTENERS UNTUK INPUT MANUAL =====
    
    // Pemasukan
    document.getElementById('tambahPemasukanBtn').addEventListener('click', () => {
        showTambahPemasukanForm();
    });
    
    document.getElementById('jenisPemasukan').addEventListener('change', function() {
        const noteRow = document.getElementById('notePemasukanRow');
        noteRow.style.display = this.value === 'Pemasukan Lain Lain' ? 'block' : 'none';
    });
    
    document.getElementById('simpanPemasukanBtn').addEventListener('click', tambahPemasukanManual);
    document.getElementById('batalPemasukanBtn').addEventListener('click', batalTambahPemasukan);
    
    // Pengeluaran
    document.getElementById('tambahPengeluaranBtn').addEventListener('click', () => {
        showTambahPengeluaranForm();
    });
    
    document.getElementById('jenisPengeluaran').addEventListener('change', function() {
        const noteRow = document.getElementById('notePengeluaranRow');
        noteRow.style.display = this.value === 'Pengeluaran Lain Lain' ? 'block' : 'none';
    });
    
    document.getElementById('simpanPengeluaranBtn').addEventListener('click', tambahPengeluaranManual);
    document.getElementById('batalPengeluaranBtn').addEventListener('click', batalTambahPengeluaran);
}

// [4] Setup tanggal default
function setupTanggalDefault() {
    const filterTanggal = document.getElementById('filterTanggalKas');
    const today = new Date();
    const todayStr = formatDateForInput(today);
    
    // Set default ke hari ini
    filterTanggal.value = todayStr;
    filterTanggal.max = todayStr; // Tidak boleh lebih dari hari ini
    
    // Update display tanggal
    updateTanggalDisplayKas(today);
}

// [5] Format tanggal untuk input date (YYYY-MM-DD)
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// [6] Format tanggal untuk display
function updateTanggalDisplayKas(date) {
    const displayElement = document.getElementById('displayTanggalKas');
    const dayName = date.toLocaleDateString('id-ID', { weekday: 'long' });
    const dateStr = formatDateDisplayKas(date);
    displayElement.textContent = `${dayName}, ${dateStr}`;
}

function formatDateDisplayKas(date) {
    const day = date.getDate();
    const month = date.toLocaleDateString('id-ID', { month: 'short' });
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// [7] Fungsi untuk generate periode options
function generatePeriodOptionsKas() {
    const periodeSelect = document.getElementById('periodeSelectKas');
    
    // Generate 5 periode terakhir (sekarang + 4 sebelumnya)
    const periods = [];
    const today = new Date();
    
    for (let i = 0; i < 5; i++) {
        const period = getPeriodByOffsetKas(i);
        periods.push(period);
        
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${formatPeriodDisplayFull(period)}`;
        option.dataset.start = period.start;
        option.dataset.end = period.end;
        option.dataset.display = period.display;
        periodeSelect.appendChild(option);
    }
    
    // Set default ke periode pertama
    periodeSelect.value = "0";
}

// [8] Format tampilan periode lengkap
function formatPeriodDisplayFull(period) {
    const startDate = new Date(period.start);
    const endDate = new Date(period.end);
    
    const startDay = startDate.toLocaleDateString('id-ID', { weekday: 'long' });
    const startDateStr = formatDateDisplayKas(startDate);
    const endDay = endDate.toLocaleDateString('id-ID', { weekday: 'long' });
    const endDateStr = formatDateDisplayKas(endDate);
    
    return `${startDay} ${startDateStr} - ${endDay} ${endDateStr}`;
}

// [9] Get periode berdasarkan offset
function getPeriodByOffsetKas(offset) {
    const today = new Date();
    const targetDate = new Date();
    targetDate.setDate(today.getDate() - (offset * 7)); // Mundur per minggu
    
    return calculatePeriodForDateKas(targetDate);
}

// [10] Hitung periode untuk tanggal tertentu
function calculatePeriodForDateKas(date) {
    const currentDate = new Date(date);
    const dayOfWeek = currentDate.getDay(); // 0=Minggu, 1=Senin, ..., 6=Sabtu
    
    // Cari Selasa terdekat (mundur)
    let tuesday = new Date(currentDate);
    let daysToTuesday = (dayOfWeek + 5) % 7;
    tuesday.setDate(currentDate.getDate() - daysToTuesday);
    
    // Cari Senin terdekat (maju)
    let monday = new Date(tuesday);
    monday.setDate(tuesday.getDate() + 6);
    
    return {
        start: formatDateForDatabase(tuesday),
        end: formatDateForDatabase(monday),
        display: `${formatDateID(tuesday)} - ${formatDateID(monday)}`
    };
}

function formatDateForDatabase(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateID(date) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    const dayName = days[date.getDay()];
    return `${dayName} ${date.getDate()}/${months[date.getMonth()]}/${date.getFullYear()}`;
}

// [11] Update tanggal dan waktu
function updateDateTimeKas() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    const dateStr = now.toLocaleDateString('id-ID', options);
    const timeStr = now.toLocaleTimeString('id-ID');
    
    const element = document.getElementById('currentDateKas');
    if (element) {
        element.textContent = `${dateStr} | ${timeStr}`;
    }
}

// [12] Load dropdown outlet untuk owner
async function loadOutletDropdownKas() {
    const select = document.getElementById('selectOutletKas');
    
    try {
        const { data: outlets, error } = await supabase
            .from('outlet')
            .select('outlet')
            .order('outlet');
        
        if (error) throw error;
        
        select.innerHTML = `
            <option value="all">Semua Outlet</option>
            ${outlets.map(outlet => 
                `<option value="${outlet.outlet}">${outlet.outlet}</option>`
            ).join('')}
        `;
        
        // Set outlet user saat ini sebagai default jika bukan owner semua outlet
        if (currentOutletKas) {
            select.value = currentOutletKas;
        }
        
        // Setelah outlet di-load, load kasir dropdown
        await loadKasirDropdownKas();
        
    } catch (error) {
        console.error('Error loading outlets for Kas:', error);
        select.innerHTML = '<option value="all">Semua Outlet</option>';
    }
}

// [13] Load dropdown kasir untuk owner
async function loadKasirDropdownKas() {
    const select = document.getElementById('selectKasirKas');
    const outletSelect = document.getElementById('selectOutletKas');
    const selectedOutlet = outletSelect ? outletSelect.value : null;
    
    try {
        let query = supabase
            .from('karyawan')
            .select('nama_karyawan')
            .eq('posisi', 'Kasir')
            .order('nama_karyawan');
        
        // Filter berdasarkan outlet jika dipilih
        if (selectedOutlet && selectedOutlet !== 'all') {
            query = query.eq('outlet', selectedOutlet);
        }
        
        const { data: kasirList, error } = await query;
        
        if (error) throw error;
        
        select.innerHTML = `
            <option value="">Semua Kasir</option>
            ${kasirList.map(k => 
                `<option value="${k.nama_karyawan}">${k.nama_karyawan}</option>`
            ).join('')}
        `;
        
    } catch (error) {
        console.error('Error loading kasir list for Kas:', error);
        select.innerHTML = '<option value="">Error loading data</option>';
    }
}

// [14] Fungsi utama untuk load data Kas
async function loadKasData() {
    try {
        showKasLoading(true);
        
        // Reset state manual setiap load data baru
        manualPemasukanItems = [];
        manualPengeluaranItems = [];
        
        // Tampilkan loading state
        document.getElementById('loadingRingkasan').style.display = 'block';
        document.getElementById('ringkasanContent').style.display = 'none';
        document.getElementById('loadingPemasukan').style.display = 'block';
        document.getElementById('loadingPengeluaran').style.display = 'block';
        
        // Tentukan filter parameters
        const filterParams = getKasFilterParams();
        
        // 1. Load ringkasan KAS berdasarkan periode yang dipilih
        const periodeIndex = document.getElementById('periodeSelectKas').value;
        const periods = [];
        for (let i = 0; i < 5; i++) {
            periods.push(getPeriodByOffsetKas(i));
        }
        const selectedPeriod = periods[periodeIndex];
        
        // Load data ringkasan untuk periode tersebut
        await loadRingkasanKasByPeriod(filterParams, selectedPeriod);
        
        // 2. Load data pemasukan dan pengeluaran untuk tanggal yang dipilih
        await Promise.all([
            loadPemasukanData(filterParams),
            loadPengeluaranData(filterParams)
        ]);
        
        // 3. Render data manual
        renderManualPemasukanItems();
        renderManualPengeluaranItems();
        
        // 4. Update total
        updateTotalPemasukan();
        updateTotalPengeluaran();
        
        // 5. Cek apakah data sudah ada untuk tanggal ini
        await checkExistingData(filterParams);
        
        // Update waktu terakhir update
        const updateTime = new Date().toLocaleTimeString('id-ID');
        document.getElementById('lastUpdateKasTime').textContent = updateTime;
        
    } catch (error) {
        console.error('Error loading Kas data:', error);
        showNotificationKas('Gagal memuat data Kas', 'error');
    } finally {
        showKasLoading(false);
    }
}

// [15] Get filter parameters untuk Kas
function getKasFilterParams() {
    const params = {
        outlet: currentOutletKas,
        kasir: currentKasUser?.nama_karyawan,
        tanggal: document.getElementById('filterTanggalKas').value,
        isOwner: isOwnerKas
    };
    
    if (isOwnerKas) {
        const selectOutlet = document.getElementById('selectOutletKas');
        const selectKasir = document.getElementById('selectKasirKas');
        
        // Untuk owner: gunakan filter dari dropdown
        if (selectOutlet && selectOutlet.value !== 'all') {
            params.outlet = selectOutlet.value;
        } else {
            params.outlet = null; // Semua outlet
        }
        
        if (selectKasir && selectKasir.value) {
            params.kasir = selectKasir.value;
            params.filterByKasir = true;
        } else {
            params.kasir = null;
            params.filterByKasir = false;
        }
    } else {
        // Untuk non-owner: selalu filter berdasarkan kasir sendiri
        params.filterByKasir = true;
    }
    
    return params;
}

// [16] Load ringkasan KAS berdasarkan periode
async function loadRingkasanKasByPeriod(filterParams, periode) {
    try {
        // Query data KAS untuk periode tersebut
        let query = supabase
            .from('kas')
            .select('*')
            .gte('tanggal', periode.start)
            .lte('tanggal', periode.end);
        
        // Filter berdasarkan outlet
        if (filterParams.outlet) {
            query = query.eq('outlet', filterParams.outlet);
        }
        
        // Filter berdasarkan kasir
        if (filterParams.filterByKasir && filterParams.kasir) {
            query = query.eq('kasir', filterParams.kasir);
        }
        
        query = query.order('tanggal', { ascending: true });
        
        const { data: kasData, error } = await query;
        
        if (error) throw error;
        
        // Tampilkan ringkasan dengan tabel
        displayRingkasanKas(kasData || [], periode);
        
        // Load status setoran untuk periode ini
        await loadSetoranStatus(filterParams, periode);
        
    } catch (error) {
        console.error('Error loading ringkasan KAS:', error);
        document.getElementById('ringkasanContainer').innerHTML = `
            <div style="text-align: center; padding: 20px; color: #e53e3e;">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Gagal memuat ringkasan KAS</p>
            </div>
        `;
    }
}

// [17] Display ringkasan KAS dengan tabel
function displayRingkasanKas(kasData, periode) {
    const container = document.getElementById('ringkasanContainer');
    
    if (kasData.length === 0) {
        container.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #718096;">
                <i class="fas fa-chart-bar" style="font-size: 2rem; opacity: 0.3; margin-bottom: 10px;"></i>
                <p>Tidak ada data KAS untuk periode ini</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div style="margin-bottom: 15px; padding: 15px; background: #f0fff4; border-radius: 10px;">
            <p style="font-weight: 600; color: #2d3748;">Periode: ${periode.display}</p>
            <p style="font-size: 0.9rem; color: #718096;">Tanggal: ${periode.start} sampai ${periode.end}</p>
        </div>
        
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
    
    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    let totalSaldo = 0;
    
    kasData.forEach(row => {
        const pemasukan = parseInt(row.pemasukan) || 0;
        const pengeluaran = parseInt(row.pengeluaran) || 0;
        const saldo = parseInt(row.saldo) || 0;
        
        totalPemasukan += pemasukan;
        totalPengeluaran += pengeluaran;
        totalSaldo += saldo;
        
        const saldoClass = saldo < 0 ? 'text-red' : 'text-green';
        
        html += `
            <tr>
                <td>${formatDisplayDate(row.tanggal)}</td>
                <td>${row.hari}</td>
                <td>${row.outlet}</td>
                <td style="min-width: 180px;">${row.kasir}</td>
                <td style="text-align: right;">${formatNumber(pemasukan)}</td>
                <td style="text-align: right;">${formatNumber(pengeluaran)}</td>
                <td style="text-align: right;" class="${saldoClass}">${formatNumber(saldo)}</td>
            </tr>
        `;
    });
    
    const totalSaldoClass = totalSaldo < 0 ? 'text-red' : 'text-green';
    
    html += `
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="4" style="text-align: right; font-weight: 600;">TOTAL</td>
                        <td style="text-align: right; font-weight: 600;">${formatNumber(totalPemasukan)}</td>
                        <td style="text-align: right; font-weight: 600;">${formatNumber(totalPengeluaran)}</td>
                        <td style="text-align: right; font-weight: 600;" class="${totalSaldoClass}">${formatNumber(totalSaldo)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

// [18] Load status setoran
async function loadSetoranStatus(filterParams, periode) {
    try {
        // Query data setoran
        let query = supabase
            .from('setoran')
            .select('*')
            .eq('periode', periode.display);
        
        // Filter berdasarkan outlet
        if (filterParams.outlet) {
            query = query.eq('outlet', filterParams.outlet);
        }
        
        // Filter berdasarkan kasir
        if (filterParams.filterByKasir && filterParams.kasir) {
            query = query.eq('kasir', filterParams.kasir);
        }
        
        const { data: setoranData, error } = await query;
        
        if (error) throw error;
        
        // Tampilkan status setoran
        displaySetoranStatus(setoranData?.[0] || null);
        
    } catch (error) {
        console.error('Error loading setoran status:', error);
    }
}

// [19] Display status setoran
function displaySetoranStatus(setoranData) {
    const card = document.getElementById('statusSetoranCard');
    const content = document.getElementById('statusSetoranContent');
    
    if (!setoranData) {
        card.style.display = 'none';
        return;
    }
    
    card.style.display = 'block';
    
    // Format hari setoran
    let hariSetoran = '-';
    if (setoranData.tanggal_setoran) {
        const date = new Date(setoranData.tanggal_setoran);
        hariSetoran = date.toLocaleDateString('id-ID', { weekday: 'long' });
    }
    
    // Status class
    const statusClass = {
        'Belum Setor': 'status-belum',
        'In Process': 'status-in-process',
        'Verified': 'status-verified'
    }[setoranData.status_setoran] || 'status-belum';
    
    content.innerHTML = `
        <div class="status-item">
            <span class="status-label">Metode:</span>
            <span class="status-value">${setoranData.metode_setoran || '-'}</span>
        </div>
        <div class="status-item">
            <span class="status-label">Hari Setoran:</span>
            <span class="status-value">${hariSetoran}</span>
        </div>
        <div class="status-item">
            <span class="status-label">Tanggal Setoran:</span>
            <span class="status-value">${setoranData.tanggal_setoran ? formatDisplayDate(setoranData.tanggal_setoran) : '-'}</span>
        </div>
        <div class="status-item">
            <span class="status-label">Total Setoran:</span>
            <span class="status-value">${formatNumber(setoranData.total_setoran || 0)}</span>
        </div>
        <div class="status-item">
            <span class="status-label">Sisa Setoran:</span>
            <span class="status-value">${formatNumber(setoranData.sisa_setoran || 0)}</span>
        </div>
        <div class="status-item">
            <span class="status-label">Status:</span>
            <span class="status-value ${statusClass}">${setoranData.status_setoran}</span>
        </div>
    `;
    
    // Update tombol verifikasi
    updateVerifikasiButton(setoranData);
}

// [20] Update tombol verifikasi berdasarkan status setoran
function updateVerifikasiButton(setoranData) {
    const verifikasiBtn = document.getElementById('verifikasiSetoranBtnKas');
    
    if (isOwnerKas && setoranData && setoranData.status_setoran === 'In Process') {
        verifikasiBtn.disabled = false;
        verifikasiBtn.title = 'Verifikasi setoran ini';
    } else {
        verifikasiBtn.disabled = true;
        if (setoranData && setoranData.status_setoran === 'Verified') {
            verifikasiBtn.title = 'Setoran sudah diverifikasi';
        } else {
            verifikasiBtn.title = 'Tidak ada setoran yang bisa diverifikasi';
        }
    }
}

// [21] Load data pemasukan (auto-generate)
async function loadPemasukanData(filterParams) {
    try {
        const tanggal = filterParams.tanggal;
        const outlet = filterParams.outlet || currentOutletKas;
        
        if (!tanggal || !outlet) {
            throw new Error('Tanggal dan outlet diperlukan');
        }
        
        // Array untuk menyimpan data pemasukan
        const pemasukanItems = [];
        
        // 1. SISA SETORAN (dari tabel setoran)
        const sisaSetoran = await getSisaSetoran(outlet, tanggal);
        if (sisaSetoran > 0) {
            pemasukanItems.push({
                jenis: 'Sisa Setoran',
                jumlah: sisaSetoran,
                note: 'Auto-generate dari setoran sebelumnya',
                type: 'auto'
            });
        }
        
        // 2. OMSET CASH (dari tabel transaksi_order)
        const omsetCash = await getOmsetCash(outlet, tanggal);
        if (omsetCash > 0) {
            pemasukanItems.push({
                jenis: 'Omset Cash',
                jumlah: omsetCash,
                note: 'Auto-generate dari transaksi cash',
                type: 'auto'
            });
        }
        
        // 3. HUTANG KOMISI (dari tabel komisi yang belum dibayar)
        const hutangKomisi = await getHutangKomisi(outlet, tanggal);
        if (hutangKomisi > 0) {
            pemasukanItems.push({
                jenis: 'Hutang Komisi',
                jumlah: hutangKomisi,
                note: 'Auto-generate dari hutang komisi',
                type: 'auto'
            });
        }
        
        // Tampilkan data pemasukan auto-generate
        displayPemasukanAutoData(pemasukanItems);
        
    } catch (error) {
        console.error('Error loading pemasukan data:', error);
        document.getElementById('loadingPemasukan').style.display = 'none';
        document.getElementById('pemasukanContainer').innerHTML = `
            <div style="text-align: center; padding: 20px; color: #e53e3e;">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Gagal memuat data pemasukan</p>
            </div>
        `;
    }
}

// [22] Fungsi helper: Get Sisa Setoran
async function getSisaSetoran(outlet, tanggal) {
    try {
        // Cari setoran sebelumnya yang memiliki sisa
        const { data: setoranData, error } = await supabase
            .from('setoran')
            .select('sisa_setoran, tanggal_setoran')
            .eq('outlet', outlet)
            .gt('sisa_setoran', 0)
            .order('tanggal_setoran', { ascending: false })
            .limit(1);
        
        if (error) throw error;
        
        return setoranData?.[0]?.sisa_setoran || 0;
        
    } catch (error) {
        console.error('Error getting sisa setoran:', error);
        return 0;
    }
}

// [23] Fungsi helper: Get Omset Cash
async function getOmsetCash(outlet, tanggal) {
    try {
        const { data: transaksiData, error } = await supabase
            .from('transaksi_order')
            .select('total_amount')
            .eq('outlet', outlet)
            .eq('order_date', tanggal)
            .eq('payment_type', 'cash')
            .eq('status', 'completed');
        
        if (error) throw error;
        
        // Hitung total omset cash
        const totalOmset = transaksiData?.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0) || 0;
        return Math.round(totalOmset);
        
    } catch (error) {
        console.error('Error getting omset cash:', error);
        return 0;
    }
}

// [24] Fungsi helper: Get Hutang Komisi
async function getHutangKomisi(outlet, tanggal) {
    try {
        // Logika untuk menghitung hutang komisi
        // Untuk sekarang return 0 dulu
        return 0;
        
    } catch (error) {
        console.error('Error getting hutang komisi:', error);
        return 0;
    }
}

// [25] Display data pemasukan auto-generate
function displayPemasukanAutoData(pemasukanItems) {
    const container = document.getElementById('pemasukanContainer');
    
    if (pemasukanItems.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #718096;">
                <i class="fas fa-arrow-down" style="font-size: 1.5rem; opacity: 0.3;"></i>
                <p>Tidak ada data pemasukan auto-generate</p>
            </div>
        `;
    } else {
        let html = '';
        
        pemasukanItems.forEach((item, index) => {
            html += `
                <div class="data-item pemasukan">
                    <div class="data-item-header">
                        <span class="data-item-label">${item.jenis}</span>
                        <span class="data-item-value">${formatNumber(item.jumlah)}</span>
                    </div>
                    <div class="data-item-note">${item.note}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Hitung total pemasukan auto-generate
        const totalAutoPemasukan = pemasukanItems.reduce((sum, item) => sum + item.jumlah, 0);
        document.getElementById('totalAutoPemasukan').textContent = formatNumber(totalAutoPemasukan);
    }
    
    // Sembunyikan loading
    document.getElementById('loadingPemasukan').style.display = 'none';
}

// [26] Load data pengeluaran (auto-generate)
async function loadPengeluaranData(filterParams) {
    try {
        const tanggal = filterParams.tanggal;
        const outlet = filterParams.outlet || currentOutletKas;
        
        if (!tanggal || !outlet) {
            throw new Error('Tanggal dan outlet diperlukan');
        }
        
        // Array untuk menyimpan data pengeluaran
        const pengeluaranItems = [];
        
        // 1. KOMISI (dari tabel komisi)
        const komisiData = await getKomisiData(outlet, tanggal);
        if (komisiData.komisi > 0) {
            pengeluaranItems.push({
                jenis: 'Komisi',
                jumlah: komisiData.komisi,
                note: 'Auto-generate dari data komisi',
                type: 'auto'
            });
        }
        
        // 2. UOP (dari tabel komisi)
        if (komisiData.uop > 0) {
            pengeluaranItems.push({
                jenis: 'UOP',
                jumlah: komisiData.uop,
                note: 'Auto-generate dari data komisi',
                type: 'auto'
            });
        }
        
        // 3. TIPS QRIS (dari tabel komisi)
        if (komisiData.tips_qris > 0) {
            pengeluaranItems.push({
                jenis: 'Tips QRIS',
                jumlah: komisiData.tips_qris,
                note: 'Auto-generate dari data komisi',
                type: 'auto'
            });
        }
        
        // Tampilkan data pengeluaran auto-generate
        displayPengeluaranAutoData(pengeluaranItems);
        
    } catch (error) {
        console.error('Error loading pengeluaran data:', error);
        document.getElementById('loadingPengeluaran').style.display = 'none';
        document.getElementById('pengeluaranContainer').innerHTML = `
            <div style="text-align: center; padding: 20px; color: #e53e3e;">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Gagal memuat data pengeluaran</p>
            </div>
        `;
    }
}

// [27] Fungsi helper: Get Komisi Data
async function getKomisiData(outlet, tanggal) {
    try {
        const { data: komisiData, error } = await supabase
            .from('komisi')
            .select('komisi, uop, tips_qris')
            .eq('outlet', outlet)
            .eq('tanggal', tanggal)
            .eq('status', 'complete');
        
        if (error) throw error;
        
        // Hitung total untuk semua data komisi hari itu
        const totals = {
            komisi: 0,
            uop: 0,
            tips_qris: 0
        };
        
        if (komisiData && komisiData.length > 0) {
            komisiData.forEach(item => {
                totals.komisi += parseFloat(item.komisi) || 0;
                totals.uop += parseFloat(item.uop) || 0;
                totals.tips_qris += parseFloat(item.tips_qris) || 0;
            });
        }
        
        // Round to integer
        totals.komisi = Math.round(totals.komisi);
        totals.uop = Math.round(totals.uop);
        totals.tips_qris = Math.round(totals.tips_qris);
        
        return totals;
        
    } catch (error) {
        console.error('Error getting komisi data:', error);
        return { komisi: 0, uop: 0, tips_qris: 0 };
    }
}

// [28] Display data pengeluaran auto-generate
function displayPengeluaranAutoData(pengeluaranItems) {
    const container = document.getElementById('pengeluaranContainer');
    
    if (pengeluaranItems.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #718096;">
                <i class="fas fa-arrow-up" style="font-size: 1.5rem; opacity: 0.3;"></i>
                <p>Tidak ada data pengeluaran auto-generate</p>
            </div>
        `;
    } else {
        let html = '';
        
        pengeluaranItems.forEach((item, index) => {
            html += `
                <div class="data-item pengeluaran">
                    <div class="data-item-header">
                        <span class="data-item-label">${item.jenis}</span>
                        <span class="data-item-value">${formatNumber(item.jumlah)}</span>
                    </div>
                    <div class="data-item-note">${item.note}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Hitung total pengeluaran auto-generate
        const totalAutoPengeluaran = pengeluaranItems.reduce((sum, item) => sum + item.jumlah, 0);
        document.getElementById('totalAutoPengeluaran').textContent = formatNumber(totalAutoPengeluaran);
    }
    
    // Sembunyikan loading
    document.getElementById('loadingPengeluaran').style.display = 'none';
}

// ===== FUNGSI UNTUK INPUT MANUAL =====

// [29] Show form tambah pemasukan manual
function showTambahPemasukanForm() {
    if (isAddingPemasukan) return;
    
    isAddingPemasukan = true;
    const form = document.getElementById('formTambahPemasukan');
    const button = document.getElementById('tambahPemasukanBtn');
    
    form.style.display = 'block';
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-plus"></i> Menambah...';
    
    // Reset form
    document.getElementById('jenisPemasukan').value = 'Top Up Kas';
    document.getElementById('jumlahPemasukan').value = '';
    document.getElementById('notePemasukan').value = '';
    document.getElementById('notePemasukanRow').style.display = 'none';
    
    // Focus ke input jumlah
    setTimeout(() => {
        document.getElementById('jumlahPemasukan').focus();
    }, 100);
}

// [30] Tambah pemasukan manual
function tambahPemasukanManual() {
    const jenis = document.getElementById('jenisPemasukan').value;
    const jumlah = parseInt(document.getElementById('jumlahPemasukan').value) || 0;
    const note = document.getElementById('notePemasukan').value;
    
    if (!jenis || jumlah <= 0) {
        showNotificationKas('Harap isi jenis dan jumlah pemasukan', 'error');
        return;
    }
    
    // Tambah ke array
    manualPemasukanItems.push({
        jenis: jenis,
        jumlah: jumlah,
        note: jenis === 'Pemasukan Lain Lain' ? note : '',
        type: 'manual'
    });
    
    // Reset form
    batalTambahPemasukan();
    
    // Render ulang items
    renderManualPemasukanItems();
    
    // Update total
    updateTotalPemasukan();
    
    showNotificationKas('Pemasukan manual berhasil ditambahkan', 'success');
}

// [31] Batal tambah pemasukan
function batalTambahPemasukan() {
    isAddingPemasukan = false;
    const form = document.getElementById('formTambahPemasukan');
    const button = document.getElementById('tambahPemasukanBtn');
    
    form.style.display = 'none';
    button.disabled = false;
    button.innerHTML = '<i class="fas fa-plus"></i> Tambah';
}

// [32] Render manual pemasukan items
function renderManualPemasukanItems() {
    const container = document.getElementById('manualPemasukanContainer');
    
    if (manualPemasukanItems.length === 0) {
        container.innerHTML = `
            <div class="manual-empty">
                <i class="fas fa-edit"></i>
                <p>Belum ada pemasukan manual</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="data-divider"><span>Pemasukan Manual</span></div>';
    
    manualPemasukanItems.forEach((item, index) => {
        html += `
            <div class="manual-item" data-index="${index}">
                <button class="delete-btn" onclick="hapusPemasukanManual(${index})">
                    <i class="fas fa-trash"></i>
                </button>
                <div class="manual-item-header">
                    <span class="manual-item-label">${item.jenis}</span>
                    <span class="manual-item-value">${formatNumber(item.jumlah)}</span>
                </div>
                ${item.note ? `<div class="manual-item-note">${item.note}</div>` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// [33] Hapus pemasukan manual
function hapusPemasukanManual(index) {
    if (confirm('Hapus pemasukan manual ini?')) {
        manualPemasukanItems.splice(index, 1);
        renderManualPemasukanItems();
        updateTotalPemasukan();
        showNotificationKas('Pemasukan manual berhasil dihapus', 'success');
    }
}

// [34] Show form tambah pengeluaran manual
function showTambahPengeluaranForm() {
    if (isAddingPengeluaran) return;
    
    isAddingPengeluaran = true;
    const form = document.getElementById('formTambahPengeluaran');
    const button = document.getElementById('tambahPengeluaranBtn');
    
    form.style.display = 'block';
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-plus"></i> Menambah...';
    
    // Reset form
    document.getElementById('jenisPengeluaran').value = 'Bayar Hutang Komisi';
    document.getElementById('jumlahPengeluaran').value = '';
    document.getElementById('notePengeluaran').value = '';
    document.getElementById('notePengeluaranRow').style.display = 'none';
    
    // Focus ke input jumlah
    setTimeout(() => {
        document.getElementById('jumlahPengeluaran').focus();
    }, 100);
}

// [35] Tambah pengeluaran manual
function tambahPengeluaranManual() {
    const jenis = document.getElementById('jenisPengeluaran').value;
    const jumlah = parseInt(document.getElementById('jumlahPengeluaran').value) || 0;
    const note = document.getElementById('notePengeluaran').value;
    
    if (!jenis || jumlah <= 0) {
        showNotificationKas('Harap isi jenis dan jumlah pengeluaran', 'error');
        return;
    }
    
    // Tambah ke array
    manualPengeluaranItems.push({
        jenis: jenis,
        jumlah: jumlah,
        note: jenis === 'Pengeluaran Lain Lain' ? note : '',
        type: 'manual'
    });
    
    // Reset form
    batalTambahPengeluaran();
    
    // Render ulang items
    renderManualPengeluaranItems();
    
    // Update total
    updateTotalPengeluaran();
    
    showNotificationKas('Pengeluaran manual berhasil ditambahkan', 'success');
}

// [36] Batal tambah pengeluaran
function batalTambahPengeluaran() {
    isAddingPengeluaran = false;
    const form = document.getElementById('formTambahPengeluaran');
    const button = document.getElementById('tambahPengeluaranBtn');
    
    form.style.display = 'none';
    button.disabled = false;
    button.innerHTML = '<i class="fas fa-plus"></i> Tambah';
}

// [37] Render manual pengeluaran items
function renderManualPengeluaranItems() {
    const container = document.getElementById('manualPengeluaranContainer');
    
    if (manualPengeluaranItems.length === 0) {
        container.innerHTML = `
            <div class="manual-empty">
                <i class="fas fa-edit"></i>
                <p>Belum ada pengeluaran manual</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="data-divider"><span>Pengeluaran Manual</span></div>';
    
    manualPengeluaranItems.forEach((item, index) => {
        html += `
            <div class="manual-item" data-index="${index}">
                <button class="delete-btn" onclick="hapusPengeluaranManual(${index})">
                    <i class="fas fa-trash"></i>
                </button>
                <div class="manual-item-header">
                    <span class="manual-item-label">${item.jenis}</span>
                    <span class="manual-item-value">${formatNumber(item.jumlah)}</span>
                </div>
                ${item.note ? `<div class="manual-item-note">${item.note}</div>` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// [38] Hapus pengeluaran manual
function hapusPengeluaranManual(index) {
    if (confirm('Hapus pengeluaran manual ini?')) {
        manualPengeluaranItems.splice(index, 1);
        renderManualPengeluaranItems();
        updateTotalPengeluaran();
        showNotificationKas('Pengeluaran manual berhasil dihapus', 'success');
    }
}

// [39] Update total pemasukan
function updateTotalPemasukan() {
    // Hitung total auto
    const autoItems = document.querySelectorAll('#pemasukanContainer .data-item.pemasukan');
    let totalAuto = 0;
    autoItems.forEach(item => {
        const valueElement = item.querySelector('.data-item-value');
        if (valueElement) {
            const valueText = valueElement.textContent.replace(/[^0-9]/g, '');
            totalAuto += parseInt(valueText) || 0;
        }
    });
    
    // Hitung total manual
    const totalManual = manualPemasukanItems.reduce((sum, item) => sum + item.jumlah, 0);
    
    // Update display
    document.getElementById('totalAutoPemasukan').textContent = formatNumber(totalAuto);
    document.getElementById('totalManualPemasukan').textContent = formatNumber(totalManual);
    
    const totalPemasukan = totalAuto + totalManual;
    document.getElementById('totalPemasukanDisplay').textContent = formatNumber(totalPemasukan);
}

// [40] Update total pengeluaran
function updateTotalPengeluaran() {
    // Hitung total auto
    const autoItems = document.querySelectorAll('#pengeluaranContainer .data-item.pengeluaran');
    let totalAuto = 0;
    autoItems.forEach(item => {
        const valueElement = item.querySelector('.data-item-value');
        if (valueElement) {
            const valueText = valueElement.textContent.replace(/[^0-9]/g, '');
            totalAuto += parseInt(valueText) || 0;
        }
    });
    
    // Hitung total manual
    const totalManual = manualPengeluaranItems.reduce((sum, item) => sum + item.jumlah, 0);
    
    // Update display
    document.getElementById('totalAutoPengeluaran').textContent = formatNumber(totalAuto);
    document.getElementById('totalManualPengeluaran').textContent = formatNumber(totalManual);
    
    const totalPengeluaran = totalAuto + totalManual;
    document.getElementById('totalPengeluaranDisplay').textContent = formatNumber(totalPengeluaran);
}

// ===== FUNGSI UTAMA KAS & SETORAN =====

// [41] Cek apakah data sudah ada untuk tanggal ini
async function checkExistingData(filterParams) {
    try {
        let query = supabase
            .from('kas')
            .select('id')
            .eq('tanggal', filterParams.tanggal);
        
        if (filterParams.outlet) {
            query = query.eq('outlet', filterParams.outlet);
        }
        
        if (filterParams.filterByKasir && filterParams.kasir) {
            query = query.eq('kasir', filterParams.kasir);
        }
        
        const { data: existingData } = await query;
        
        const submitBtn = document.getElementById('submitBtnKas');
        if (existingData && existingData.length > 0) {
            // Data sudah ada
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> DATA SUDAH ADA';
            submitBtn.style.background = 'linear-gradient(to right, #38a169, #2f855a)';
            
            // Disable tombol tambah
            document.getElementById('tambahPemasukanBtn').disabled = true;
            document.getElementById('tambahPengeluaranBtn').disabled = true;
        } else {
            // Data belum ada
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> SUBMIT';
            submitBtn.style.background = 'linear-gradient(to right, #805ad5, #6b46c1)';
            
            // Enable tombol tambah
            document.getElementById('tambahPemasukanBtn').disabled = false;
            document.getElementById('tambahPengeluaranBtn').disabled = false;
        }
        
    } catch (error) {
        console.error('Error checking existing data:', error);
    }
}

// [42] Buka modal setoran
async function openSetoranModalKas() {
    try {
        // Hitung total kewajiban (saldo dari ringkasan)
        const filterParams = getKasFilterParams();
        const periodeIndex = document.getElementById('periodeSelectKas').value;
        const periods = [];
        for (let i = 0; i < 5; i++) {
            periods.push(getPeriodByOffsetKas(i));
        }
        const periode = periods[periodeIndex];
        
        // Query total saldo untuk periode ini
        let query = supabase
            .from('kas')
            .select('saldo')
            .gte('tanggal', periode.start)
            .lte('tanggal', periode.end);
        
        if (filterParams.outlet) {
            query = query.eq('outlet', filterParams.outlet);
        }
        
        if (filterParams.filterByKasir && filterParams.kasir) {
            query = query.eq('kasir', filterParams.kasir);
        }
        
        const { data: kasData, error } = await query;
        
        if (error) throw error;
        
        // Hitung total kewajiban
        const totalKewajiban = kasData?.reduce((sum, item) => sum + (parseInt(item.saldo) || 0), 0) || 0;
        
        // Update modal content
        document.getElementById('modalOutletKas').textContent = filterParams.outlet || currentOutletKas || '-';
        document.getElementById('modalKasirKas').textContent = filterParams.kasir || currentKasUser?.nama_karyawan || '-';
        document.getElementById('modalPeriodeKas').textContent = periode.display;
        document.getElementById('modalKewajibanKas').textContent = formatNumber(totalKewajiban);
        document.getElementById('totalSetoranInputKas').value = totalKewajiban;
        
        // Tampilkan modal
        document.getElementById('setoranModalKas').style.display = 'flex';
        
    } catch (error) {
        console.error('Error opening setoran modal:', error);
        showNotificationKas('Gagal membuka form setoran', 'error');
    }
}

// [43] Tutup modal setoran
function closeSetoranModalKas() {
    document.getElementById('setoranModalKas').style.display = 'none';
}

// [44] Submit setoran
async function submitSetoranKas() {
    try {
        const totalSetoran = parseInt(document.getElementById('totalSetoranInputKas').value) || 0;
        const metodeSetoran = document.getElementById('metodeSetoranKas').value;
        
        if (!totalSetoran || !metodeSetoran) {
            showNotificationKas('Harap isi total setoran dan pilih metode setoran', 'error');
            return;
        }
        
        const filterParams = getKasFilterParams();
        const periodeIndex = document.getElementById('periodeSelectKas').value;
        const periods = [];
        for (let i = 0; i < 5; i++) {
            periods.push(getPeriodByOffsetKas(i));
        }
        const periode = periods[periodeIndex];
        
        // Validasi: Cek apakah sudah ada setoran untuk periode ini
        let query = supabase
            .from('setoran')
            .select('id')
            .eq('periode', periode.display);
        
        if (filterParams.outlet) {
            query = query.eq('outlet', filterParams.outlet);
        }
        
        if (filterParams.filterByKasir && filterParams.kasir) {
            query = query.eq('kasir', filterParams.kasir);
        }
        
        const { data: existingSetoran } = await query;
        
        if (existingSetoran && existingSetoran.length > 0) {
            showNotificationKas('Setoran untuk periode ini sudah ada. Tidak bisa submit lagi.', 'error');
            closeSetoranModalKas();
            return;
        }
        
        showKasLoading(true);
        
        const now = new Date();
        const today = formatDateForDatabase(now);
        
        // Hitung sisa setoran (total kewajiban - total setoran)
        const totalKewajibanElement = document.getElementById('modalKewajibanKas');
        const totalKewajibanText = totalKewajibanElement.textContent.replace(/[^0-9]/g, '');
        const totalKewajiban = parseInt(totalKewajibanText) || 0;
        const sisaSetoran = Math.max(0, totalKewajiban - totalSetoran);
        
        // Data setoran
        const setoranData = {
            outlet: filterParams.outlet || currentOutletKas,
            periode: periode.display,
            kasir: filterParams.kasir || currentKasUser?.nama_karyawan,
            total_kewajiban: totalKewajiban,
            total_setoran: totalSetoran,
            sisa_setoran: sisaSetoran,
            tanggal_setoran: today,
            metode_setoran: metodeSetoran,
            status_setoran: 'In Process'
        };
        
        console.log('Data setoran yang akan disimpan:', setoranData);
        
        // Insert data setoran
        const { error } = await supabase
            .from('setoran')
            .insert([setoranData]);
        
        if (error) throw error;
        
        // Kirim notifikasi WhatsApp
        await sendWhatsAppNotificationKas(setoranData, 'setoran');
        
        showNotificationKas('Setoran berhasil disimpan', 'success');
        closeSetoranModalKas();
        
        // Refresh data
        await loadKasData();
        
    } catch (error) {
        console.error('Error submitting setoran:', error);
        showNotificationKas('Gagal menyimpan setoran: ' + error.message, 'error');
    } finally {
        showKasLoading(false);
    }
}

// [45] Verifikasi setoran (hanya untuk owner)
async function verifikasiSetoranKas() {
    try {
        const filterParams = getKasFilterParams();
        const periodeIndex = document.getElementById('periodeSelectKas').value;
        const periods = [];
        for (let i = 0; i < 5; i++) {
            periods.push(getPeriodByOffsetKas(i));
        }
        const periode = periods[periodeIndex];
        
        // Cari setoran yang akan diverifikasi
        let query = supabase
            .from('setoran')
            .select('*')
            .eq('periode', periode.display)
            .eq('status_setoran', 'In Process');
        
        if (filterParams.outlet) {
            query = query.eq('outlet', filterParams.outlet);
        }
        
        if (filterParams.filterByKasir && filterParams.kasir) {
            query = query.eq('kasir', filterParams.kasir);
        }
        
        const { data: setoranData, error } = await query;
        
        if (error) throw error;
        
        if (!setoranData || setoranData.length === 0) {
            showNotificationKas('Tidak ada setoran untuk diverifikasi', 'warning');
            return;
        }
        
        showKasLoading(true);
        
        // Update status menjadi Verified
        const { error: updateError } = await supabase
            .from('setoran')
            .update({ status_setoran: 'Verified' })
            .eq('id', setoranData[0].id);
        
        if (updateError) throw updateError;
        
        showNotificationKas('Setoran telah diverifikasi', 'success');
        
        // Refresh data
        await loadKasData();
        
    } catch (error) {
        console.error('Error verifying setoran:', error);
        showNotificationKas('Gagal memverifikasi setoran: ' + error.message, 'error');
    } finally {
        showKasLoading(false);
    }
}

// [46] Submit data KAS
async function submitDataKas() {
    try {
        const filterParams = getKasFilterParams();
        
        // Validasi: Cek apakah sudah ada data untuk tanggal ini
        let query = supabase
            .from('kas')
            .select('id')
            .eq('tanggal', filterParams.tanggal);
        
        if (filterParams.outlet) {
            query = query.eq('outlet', filterParams.outlet);
        }
        
        if (filterParams.filterByKasir && filterParams.kasir) {
            query = query.eq('kasir', filterParams.kasir);
        }
        
        const { data: existingData } = await query;
        
        if (existingData && existingData.length > 0) {
            showNotificationKas('Data untuk tanggal ini sudah ada. Tidak bisa submit lagi.', 'error');
            return;
        }
        
        showKasLoading(true);
        
        // Hitung total pemasukan dan pengeluaran
        const totalPemasukan = await calculateTotalPemasukan(filterParams);
        const totalPengeluaran = await calculateTotalPengeluaran(filterParams);
        const saldo = totalPemasukan - totalPengeluaran;
        
        // Get data auto-generate
        const omsetCash = await getOmsetCash(filterParams.outlet, filterParams.tanggal);
        const sisaSetoran = await getSisaSetoran(filterParams.outlet, filterParams.tanggal);
        const komisiData = await getKomisiData(filterParams.outlet, filterParams.tanggal);
        
        // Hitung total manual
        const totalManualPemasukan = manualPemasukanItems.reduce((sum, item) => sum + item.jumlah, 0);
        const totalManualPengeluaran = manualPengeluaranItems.reduce((sum, item) => sum + item.jumlah, 0);
        
        // Pisahkan manual items berdasarkan jenis
        const topUpKas = manualPemasukanItems.find(item => item.jenis === 'Top Up Kas')?.jumlah || 0;
        const pemasukanLainLain = manualPemasukanItems.find(item => item.jenis === 'Pemasukan Lain Lain')?.jumlah || 0;
        const notePemasukanLain = manualPemasukanItems.find(item => item.jenis === 'Pemasukan Lain Lain')?.note || '';
        
        const bayarHutangKomisi = manualPengeluaranItems.find(item => item.jenis === 'Bayar Hutang Komisi')?.jumlah || 0;
        const iuranRt = manualPengeluaranItems.find(item => item.jenis === 'Iuran RT')?.jumlah || 0;
        const sumbangan = manualPengeluaranItems.find(item => item.jenis === 'Sumbangan')?.jumlah || 0;
        const iuranSampah = manualPengeluaranItems.find(item => item.jenis === 'Iuran Sampah')?.jumlah || 0;
        const galon = manualPengeluaranItems.find(item => item.jenis === 'Galon')?.jumlah || 0;
        const biayaAdminSetoran = manualPengeluaranItems.find(item => item.jenis === 'Biaya Admin Setoran')?.jumlah || 0;
        const yakult = manualPengeluaranItems.find(item => item.jenis === 'Yakult')?.jumlah || 0;
        const pengeluaranLainLain = manualPengeluaranItems.find(item => item.jenis === 'Pengeluaran Lain Lain')?.jumlah || 0;
        const notePengeluaranLain = manualPengeluaranItems.find(item => item.jenis === 'Pengeluaran Lain Lain')?.note || '';
        
        // Data untuk tabel kas
        const kasData = {
            tanggal: filterParams.tanggal,
            hari: new Date(filterParams.tanggal).toLocaleDateString('id-ID', { weekday: 'long' }),
            outlet: filterParams.outlet || currentOutletKas,
            kasir: filterParams.kasir || currentKasUser?.nama_karyawan,
            pemasukan: totalPemasukan,
            pengeluaran: totalPengeluaran,
            saldo: saldo,
            
            // Auto-generate fields
            omset_cash: omsetCash,
            sisa_setoran: sisaSetoran,
            hutang_komisi: await getHutangKomisi(filterParams.outlet, filterParams.tanggal),
            komisi: komisiData.komisi,
            uop: komisiData.uop,
            tips_qris: komisiData.tips_qris,
            
            // Manual fields
            top_up_kas: topUpKas,
            pemasukan_lain_lain: pemasukanLainLain,
            note_pemasukan_lain: notePemasukanLain,
            bayar_hutang_komisi: bayarHutangKomisi,
            iuran_rt: iuranRt,
            sumbangan: sumbangan,
            iuran_sampah: iuranSampah,
            galon: galon,
            biaya_admin_setoran: biayaAdminSetoran,
            yakult: yakult,
            pengeluaran_lain_lain: pengeluaranLainLain,
            note_pengeluaran_lain: notePengeluaranLain
        };
        
        console.log('Data KAS yang akan disimpan:', kasData);
        
        // Insert new record
        const { error } = await supabase
            .from('kas')
            .insert([kasData]);
        
        if (error) throw error;
        
        // Kirim notifikasi WhatsApp
        await sendWhatsAppNotificationKas(kasData, 'kas');
        
        showNotificationKas('Data KAS berhasil disimpan', 'success');
        
        // Reset form dan refresh data
        manualPemasukanItems = [];
        manualPengeluaranItems = [];
        await loadKasData();
        
    } catch (error) {
        console.error('Error submitting KAS data:', error);
        showNotificationKas('Gagal menyimpan data: ' + error.message, 'error');
    } finally {
        showKasLoading(false);
    }
}

// [47] Helper: Calculate total pemasukan
async function calculateTotalPemasukan(filterParams) {
    const sisaSetoran = await getSisaSetoran(filterParams.outlet, filterParams.tanggal);
    const omsetCash = await getOmsetCash(filterParams.outlet, filterParams.tanggal);
    const hutangKomisi = await getHutangKomisi(filterParams.outlet, filterParams.tanggal);
    const totalManual = manualPemasukanItems.reduce((sum, item) => sum + item.jumlah, 0);
    
    return sisaSetoran + omsetCash + hutangKomisi + totalManual;
}

// [48] Helper: Calculate total pengeluaran
async function calculateTotalPengeluaran(filterParams) {
    const komisiData = await getKomisiData(filterParams.outlet, filterParams.tanggal);
    const totalManual = manualPengeluaranItems.reduce((sum, item) => sum + item.jumlah, 0);
    
    return komisiData.komisi + komisiData.uop + komisiData.tips_qris + totalManual;
}

// [49] Fungsi untuk mengirim notifikasi WhatsApp
async function sendWhatsAppNotificationKas(data, type = 'setoran') {
    try {
        if (!navigator.onLine) {
            console.log('Tidak ada koneksi internet, notifikasi ditunda');
            return false;
        }
        
        let message = '';
        
        if (type === 'setoran') {
            message = formatSetoranNotificationKas(data);
        } else if (type === 'kas') {
            message = formatKasNotificationKas(data);
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
        
        console.log('Notifikasi WhatsApp berhasil dikirim');
        return true;
        
    } catch (error) {
        console.error('Gagal mengirim notifikasi WhatsApp:', error);
        return false;
    }
}

// [50] Format notifikasi untuk setoran
function formatSetoranNotificationKas(setoranData) {
    const now = new Date();
    const hariTanggal = now.toLocaleDateString('id-ID', { 
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
💰 Total Setoran : Rp. ${formatCurrencyForWA(setoranData.total_setoran)}
🏦 Metode Setoran : ${setoranData.metode_setoran}
💸 Sisa Setoran : Rp. ${formatCurrencyForWA(setoranData.sisa_setoran)}
=============================
⏳ Status : Menunggu Verifikasi`;
}

// [51] Format notifikasi untuk KAS
function formatKasNotificationKas(kasData) {
    const hariTanggal = new Date(kasData.tanggal).toLocaleDateString('id-ID', { 
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
💰 Pemasukan : Rp. ${formatCurrencyForWA(kasData.pemasukan)}
💸 Pengeluaran: Rp. ${formatCurrencyForWA(kasData.pengeluaran)}
💎 Saldo    : Rp. ${formatCurrencyForWA(kasData.saldo)}
=============================
✅ Status: Berhasil disimpan`;
}

// [52] Format currency untuk WhatsApp
function formatCurrencyForWA(amount) {
    return new Intl.NumberFormat('id-ID').format(amount).replace(/\./g, ',');
}

// [53] Show/hide loading
function showKasLoading(show) {
    const overlay = document.getElementById('kasLoadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

// [54] Show notification
function showNotificationKas(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 300px;
    `;
    
    // Set color based on type
    if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    } else if (type === 'error') {
        notification.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
    } else if (type === 'warning') {
        notification.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
    } else {
        notification.style.background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
    }
    
    notification.textContent = message;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
    
    // Add CSS for animations if not exists
    if (!document.getElementById('notification-animations')) {
        const style = document.createElement('style');
        style.id = 'notification-animations';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// [55] Helper functions
function formatNumber(amount) {
    return new Intl.NumberFormat('id-ID').format(amount);
}

function formatDisplayDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// [56] Update handleMenuClick untuk menambahkan Kas & Setoran
// Pastikan fungsi ini ada di file utama app.js
// function handleMenuClick(menuId) {
//     switch(menuId) {
//         case 'komisi':
//             showKomisiPage();
//             break;
//         case 'absensi':
//             showAbsensiPage();
//             break;
//         case 'kas':
//             showKasPage(); // INI YANG DITAMBAHKAN
//             break;
//         // ... menu lainnya
//     }
// }
// ========== END OF FILE ==========
