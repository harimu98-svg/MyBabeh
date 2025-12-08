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

// Konfigurasi WhatsApp API (sama seperti di index.html)
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
        
        <!-- User Info -->
        <div class="kas-user-info">
            <div class="kas-user-info-grid">
                <div class="kas-user-item">
                    <i class="fas fa-store"></i>
                    <div>
                        <div class="kas-user-label">Outlet</div>
                        <div class="kas-user-value" id="kasOutletDisplay">${currentOutletKas || '-'}</div>
                    </div>
                </div>
                <div class="kas-user-item">
                    <i class="fas fa-user"></i>
                    <div>
                        <div class="kas-user-label">Kasir</div>
                        <div class="kas-user-value" id="kasKasirDisplay">${currentKasUser?.nama_karyawan || '-'}</div>
                    </div>
                </div>
                <div class="kas-user-item">
                    <i class="fas fa-user-tag"></i>
                    <div>
                        <div class="kas-user-label">Role</div>
                        <div class="kas-user-value" id="kasRoleDisplay">${currentKasUser?.role || '-'}</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Filter untuk Owner -->
        <div id="ownerKasFilterSection" class="owner-filter" style="display: ${isOwnerKas ? 'block' : 'none'};">
            <div class="filter-row first-row">
                <div class="filter-group">
                    <label for="selectOutletKas">Outlet:</label>
                    <select id="selectOutletKas" class="outlet-select">
                        <option value="all">Semua Outlet</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="selectKasirKas">Pilih Kasir:</label>
                    <select id="selectKasirKas" class="karyawan-select">
                        <option value="">Semua Kasir</option>
                    </select>
                </div>
            </div>
        </div>
        
        <!-- Filter Tanggal -->
        <div class="date-filter-section">
            <div class="date-filter-group">
                <label for="filterTanggalKas">Pilih Tanggal:</label>
                <input type="date" id="filterTanggalKas" class="date-input">
            </div>
            <div class="tanggal-display">
                <i class="fas fa-calendar-alt"></i>
                <span id="displayTanggalKas">Hari ini: -</span>
            </div>
        </div>
        
        <!-- Ringkasan KAS -->
        <section class="ringkasan-kas-section">
            <h3><i class="fas fa-chart-bar"></i> Ringkasan KAS</h3>
            <div class="ringkasan-card">
                <div class="loading" id="loadingRingkasan">Loading ringkasan...</div>
                <div id="ringkasanContent" style="display: none;">
                    <!-- Data akan diisi oleh JavaScript -->
                </div>
            </div>
        </section>
        
        <!-- Status Setoran -->
        <section class="ringkasan-kas-section">
            <h3><i class="fas fa-money-bill-wave"></i> Status Setoran</h3>
            <div class="status-setoran-card">
                <div class="loading" id="loadingSetoran">Loading status setoran...</div>
                <div id="setoranStatusContent" style="display: none;">
                    <!-- Data akan diisi oleh JavaScript -->
                </div>
            </div>
        </section>
        
        <!-- Pemasukan -->
        <section class="pemasukan-pengeluaran-section">
            <h3 class="section-title-kas"><i class="fas fa-arrow-down"></i> Pemasukan</h3>
            <div class="pemasukan-card">
                <div class="loading" id="loadingPemasukan">Loading data pemasukan...</div>
                <div id="pemasukanContent" style="display: none;">
                    <!-- Data auto-generate akan ditampilkan di sini -->
                </div>
                <div class="total-section">
                    <div class="total-label">TOTAL PEMASUKAN</div>
                    <div class="total-amount pemasukan" id="totalPemasukanDisplay">Rp 0</div>
                </div>
            </div>
        </section>
        
        <!-- Pengeluaran -->
        <section class="pemasukan-pengeluaran-section">
            <h3 class="section-title-kas"><i class="fas fa-arrow-up"></i> Pengeluaran</h3>
            <div class="pengeluaran-card">
                <div class="loading" id="loadingPengeluaran">Loading data pengeluaran...</div>
                <div id="pengeluaranContent" style="display: none;">
                    <!-- Data auto-generate akan ditampilkan di sini -->
                </div>
                <div class="total-section">
                    <div class="total-label">TOTAL PENGELUARAN</div>
                    <div class="total-amount pengeluaran" id="totalPengeluaranDisplay">Rp 0</div>
                </div>
            </div>
        </section>
        
        <!-- Action Buttons -->
        <div class="kas-action-buttons">
            <button class="kas-btn setor" id="setorBtnKas">
                <i class="fas fa-money-bill-wave"></i> SETOR
            </button>
            <button class="kas-btn verifikasi" id="verifikasiSetoranBtnKas" style="display: ${isOwnerKas ? 'flex' : 'none'};">
                <i class="fas fa-check-circle"></i> VERIFIKASI
            </button>
        </div>
        
        <!-- Submit Button -->
        <div class="kas-action-buttons">
            <button class="kas-btn submit" id="submitBtnKas">
                <i class="fas fa-paper-plane"></i> SUBMIT DATA KAS
            </button>
        </div>
        
        <!-- Modal Setoran -->
        <div class="setoran-modal-overlay" id="setoranModalKas" style="display: none;">
            <div class="setoran-modal">
                <div class="setoran-modal-header">
                    <h3><i class="fas fa-money-bill-wave"></i> Form Setoran</h3>
                    <button class="close-modal-btn" id="closeModalKas">&times;</button>
                </div>
                <div class="setoran-modal-body">
                    <div class="modal-info-grid">
                        <div class="modal-info-item">
                            <div class="modal-info-label">Outlet</div>
                            <div class="modal-info-value" id="modalOutletKas">${currentOutletKas || '-'}</div>
                        </div>
                        <div class="modal-info-item">
                            <div class="modal-info-label">Kasir</div>
                            <div class="modal-info-value" id="modalKasirKas">${currentKasUser?.nama_karyawan || '-'}</div>
                        </div>
                        <div class="modal-info-item">
                            <div class="modal-info-label">Periode</div>
                            <div class="modal-info-value" id="modalPeriodeKas">-</div>
                        </div>
                        <div class="modal-info-item">
                            <div class="modal-info-label">Total Kewajiban</div>
                            <div class="modal-info-value" id="modalKewajibanKas">Rp 0</div>
                        </div>
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
                <div class="setoran-modal-footer">
                    <button class="kas-btn submit" id="submitSetoranBtnKas">
                        <i class="fas fa-check"></i> SUBMIT SETORAN
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Loading Overlay -->
        <div class="kas-loading-overlay" id="kasLoadingOverlay" style="display: none;">
            <div class="kas-loading-spinner"></div>
        </div>
        
        <!-- Footer -->
        <div class="kas-footer">
            <p>Data diperbarui: <span id="lastUpdateKasTime">-</span></p>
        </div>
    `;
    
    document.body.appendChild(kasPage);
    
    // Setup event listeners
    setupKasPageEvents();
    
    // Setup tanggal default
    setupTanggalDefault();
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

// Format tanggal untuk input date (YYYY-MM-DD)
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format tanggal untuk display
function updateTanggalDisplayKas(date) {
    const displayElement = document.getElementById('displayTanggalKas');
    const dayName = date.toLocaleDateString('id-ID', { weekday: 'long' });
    const dateStr = formatDateDisplayKas(date);
    displayElement.textContent = `${dayName}, ${dateStr}`;
}

function formatDateDisplayKas(date) {
    const day = date.getDate();
    const month = date.toLocaleDateString('id-ID', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

// [5] Load dropdown outlet untuk owner
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

// [6] Load dropdown kasir untuk owner
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

// [7] Fungsi utama untuk load data Kas
async function loadKasData() {
    try {
        showKasLoading(true);
        
        // Tampilkan semua loading state
        document.querySelectorAll('#loadingRingkasan, #loadingSetoran, #loadingPemasukan, #loadingPengeluaran')
            .forEach(el => el.style.display = 'block');
        document.querySelectorAll('#ringkasanContent, #setoranStatusContent, #pemasukanContent, #pengeluaranContent')
            .forEach(el => el.style.display = 'none');
        
        // Tentukan filter parameters
        const filterParams = getKasFilterParams();
        
        // Load semua data secara paralel
        await Promise.all([
            loadRingkasanKas(filterParams),
            loadSetoranStatus(filterParams),
            loadPemasukanData(filterParams),
            loadPengeluaranData(filterParams)
        ]);
        
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

// [8] Get filter parameters untuk Kas
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
    
    console.log('Kas Filter params:', params);
    return params;
}

// [9] Load data ringkasan KAS
async function loadRingkasanKas(filterParams) {
    try {
        // Hitung periode (Selasa - Senin)
        const selectedDate = new Date(filterParams.tanggal);
        const periode = calculatePeriodForDate(selectedDate);
        
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
        
        const { data: kasData, error } = await query;
        
        if (error) throw error;
        
        // Tampilkan ringkasan
        displayRingkasanKas(kasData || [], periode);
        
    } catch (error) {
        console.error('Error loading ringkasan KAS:', error);
        document.getElementById('loadingRingkasan').style.display = 'none';
        document.getElementById('ringkasanContent').innerHTML = `
            <div style="text-align: center; padding: 20px; color: #ff4757;">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Gagal memuat ringkasan KAS</p>
            </div>
        `;
        document.getElementById('ringkasanContent').style.display = 'block';
    }
}

// [10] Hitung periode (Selasa - Senin)
function calculatePeriodForDate(date) {
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

// [11] Display ringkasan KAS
function displayRingkasanKas(kasData, periode) {
    const content = document.getElementById('ringkasanContent');
    
    if (kasData.length === 0) {
        content.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-chart-bar" style="font-size: 2rem; color: #ccc; margin-bottom: 10px;"></i>
                <p style="color: #666;">Tidak ada data KAS untuk periode ini</p>
                <p style="font-size: 0.9rem; color: #888;">${periode.display}</p>
            </div>
        `;
    } else {
        // Hitung total
        const totalPemasukan = kasData.reduce((sum, item) => sum + (parseInt(item.pemasukan) || 0), 0);
        const totalPengeluaran = kasData.reduce((sum, item) => sum + (parseInt(item.pengeluaran) || 0), 0);
        const totalSaldo = totalPemasukan - totalPengeluaran;
        
        content.innerHTML = `
            <div style="margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <i class="fas fa-calendar-alt" style="color: #8A2BE2;"></i>
                    <span style="font-weight: 600; color: #333;">${periode.display}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px; color: #666; font-size: 0.9rem;">
                    <i class="fas fa-calendar-day"></i>
                    <span>${periode.start} sampai ${periode.end}</span>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                <div style="background: linear-gradient(135deg, #f0f9ff, #e6f7ff); padding: 15px; border-radius: 12px; border: 1px solid rgba(14, 165, 233, 0.1);">
                    <div style="font-size: 0.85rem; color: #0369a1; margin-bottom: 8px; font-weight: 600;">Total Pemasukan</div>
                    <div style="font-size: 1.3rem; font-weight: 700; color: #10b981;">${formatRupiah(totalPemasukan)}</div>
                </div>
                <div style="background: linear-gradient(135deg, #fff5f5, #ffeaea); padding: 15px; border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.1);">
                    <div style="font-size: 0.85rem; color: #dc2626; margin-bottom: 8px; font-weight: 600;">Total Pengeluaran</div>
                    <div style="font-size: 1.3rem; font-weight: 700; color: #ef4444;">${formatRupiah(totalPengeluaran)}</div>
                </div>
                <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); padding: 15px; border-radius: 12px; border: 1px solid rgba(34, 197, 94, 0.1);">
                    <div style="font-size: 0.85rem; color: #059669; margin-bottom: 8px; font-weight: 600;">Total Saldo</div>
                    <div style="font-size: 1.3rem; font-weight: 700; color: ${totalSaldo >= 0 ? '#059669' : '#ef4444'};">${formatRupiah(totalSaldo)}</div>
                </div>
            </div>
            
            <div style="margin-top: 20px; font-size: 0.9rem; color: #666;">
                <i class="fas fa-info-circle" style="margin-right: 5px;"></i>
                ${kasData.length} hari tercatat dalam periode ini
            </div>
        `;
    }
    
    // Sembunyikan loading, tampilkan content
    document.getElementById('loadingRingkasan').style.display = 'none';
    content.style.display = 'block';
}

// [12] Load status setoran
async function loadSetoranStatus(filterParams) {
    try {
        // Hitung periode
        const selectedDate = new Date(filterParams.tanggal);
        const periode = calculatePeriodForDate(selectedDate);
        
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
        displaySetoranStatus(setoranData?.[0] || null, periode);
        
    } catch (error) {
        console.error('Error loading setoran status:', error);
        document.getElementById('loadingSetoran').style.display = 'none';
        document.getElementById('setoranStatusContent').innerHTML = `
            <div style="text-align: center; padding: 20px; color: #ff4757;">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Gagal memuat status setoran</p>
            </div>
        `;
        document.getElementById('setoranStatusContent').style.display = 'block';
    }
}

// [13] Display status setoran
function displaySetoranStatus(setoranData, periode) {
    const content = document.getElementById('setoranStatusContent');
    
    if (!setoranData) {
        content.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-money-bill-wave" style="font-size: 2rem; color: #fbbf24; margin-bottom: 10px;"></i>
                <p style="color: #92400e; font-weight: 600;">Belum ada setoran untuk periode ini</p>
                <p style="font-size: 0.9rem; color: #888; margin-top: 10px;">${periode.display}</p>
            </div>
        `;
    } else {
        const statusClass = {
            'Belum Setor': 'status-belum',
            'In Process': 'status-process',
            'Verified': 'status-verified'
        }[setoranData.status_setoran] || 'status-belum';
        
        // Format tanggal setoran
        let tanggalSetoranDisplay = '-';
        if (setoranData.tanggal_setoran) {
            const date = new Date(setoranData.tanggal_setoran);
            tanggalSetoranDisplay = date.toLocaleDateString('id-ID', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
        content.innerHTML = `
            <h4 style="color: #0369a1; margin-bottom: 16px; font-size: 1rem;">Periode: ${setoranData.periode}</h4>
            
            <div class="status-grid">
                <div class="status-item">
                    <div class="status-label">Metode Setoran</div>
                    <div class="status-value">${setoranData.metode_setoran || '-'}</div>
                </div>
                <div class="status-item">
                    <div class="status-label">Tanggal Setoran</div>
                    <div class="status-value">${tanggalSetoranDisplay}</div>
                </div>
                <div class="status-item">
                    <div class="status-label">Total Setoran</div>
                    <div class="status-value">${formatRupiah(setoranData.total_setoran || 0)}</div>
                </div>
                <div class="status-item">
                    <div class="status-label">Sisa Setoran</div>
                    <div class="status-value">${formatRupiah(setoranData.sisa_setoran || 0)}</div>
                </div>
                <div class="status-item">
                    <div class="status-label">Status</div>
                    <div class="status-value ${statusClass}" style="padding: 6px 12px; border-radius: 20px; display: inline-block;">
                        ${setoranData.status_setoran}
                    </div>
                </div>
            </div>
        `;
        
        // Update tombol verifikasi
        updateVerifikasiButton(setoranData);
    }
    
    // Sembunyikan loading, tampilkan content
    document.getElementById('loadingSetoran').style.display = 'none';
    content.style.display = 'block';
}

// [14] Update tombol verifikasi berdasarkan status setoran
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

// [15] Load data pemasukan (auto-generate)
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
                icon: 'fa-money-bill-wave',
                color: '#10b981'
            });
        }
        
        // 2. OMSET CASH (dari tabel transaksi_order)
        const omsetCash = await getOmsetCash(outlet, tanggal);
        if (omsetCash > 0) {
            pemasukanItems.push({
                jenis: 'Omset Cash',
                jumlah: omsetCash,
                note: 'Auto-generate dari transaksi cash',
                icon: 'fa-cash-register',
                color: '#059669'
            });
        }
        
        // 3. TOP UP KAS (dari tabel kas sebelumnya atau default 0)
        pemasukanItems.push({
            jenis: 'Top Up Kas',
            jumlah: 0,
            note: 'Manual input',
            icon: 'fa-wallet',
            color: '#3b82f6'
        });
        
        // 4. HUTANG KOMISI (dari tabel komisi yang belum dibayar)
        const hutangKomisi = await getHutangKomisi(outlet, tanggal);
        if (hutangKomisi > 0) {
            pemasukanItems.push({
                jenis: 'Hutang Komisi',
                jumlah: hutangKomisi,
                note: 'Auto-generate dari hutang komisi',
                icon: 'fa-hand-holding-usd',
                color: '#8b5cf6'
            });
        }
        
        // 5. PEMASUKAN LAIN-LAIN (default 0)
        pemasukanItems.push({
            jenis: 'Pemasukan Lain Lain',
            jumlah: 0,
            note: 'Manual input',
            icon: 'fa-plus-circle',
            color: '#ec4899'
        });
        
        // Tampilkan data pemasukan
        displayPemasukanData(pemasukanItems);
        
    } catch (error) {
        console.error('Error loading pemasukan data:', error);
        document.getElementById('loadingPemasukan').style.display = 'none';
        document.getElementById('pemasukanContent').innerHTML = `
            <div style="text-align: center; padding: 20px; color: #ff4757;">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Gagal memuat data pemasukan</p>
            </div>
        `;
        document.getElementById('pemasukanContent').style.display = 'block';
    }
}

// [16] Fungsi helper: Get Sisa Setoran
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

// [17] Fungsi helper: Get Omset Cash
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

// [18] Fungsi helper: Get Hutang Komisi
async function getHutangKomisi(outlet, tanggal) {
    try {
        // Logika untuk menghitung hutang komisi
        // Ini bisa dari tabel hutang atau komisi yang belum dibayar
        // Untuk sekarang return 0 dulu
        return 0;
        
    } catch (error) {
        console.error('Error getting hutang komisi:', error);
        return 0;
    }
}

// [19] Display data pemasukan
function displayPemasukanData(pemasukanItems) {
    const content = document.getElementById('pemasukanContent');
    
    if (pemasukanItems.length === 0) {
        content.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #666;">
                <i class="fas fa-arrow-down" style="font-size: 2rem; margin-bottom: 10px; opacity: 0.3;"></i>
                <p>Tidak ada data pemasukan</p>
            </div>
        `;
    } else {
        let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';
        
        pemasukanItems.forEach((item, index) => {
            const isAuto = item.note.includes('Auto-generate');
            
            html += `
                <div class="auto-item ${isAuto ? '' : 'disabled'}">
                    <div class="auto-item-label">
                        <div class="auto-item-icon pemasukan" style="background: ${item.color};">
                            <i class="fas ${item.icon}"></i>
                        </div>
                        <div>
                            <div class="auto-item-text">${item.jenis}</div>
                            <div class="auto-item-note">${item.note}</div>
                        </div>
                    </div>
                    <div class="auto-item-value pemasukan">${formatRupiah(item.jumlah)}</div>
                </div>
            `;
        });
        
        html += '</div>';
        content.innerHTML = html;
        
        // Hitung total pemasukan
        const totalPemasukan = pemasukanItems.reduce((sum, item) => sum + item.jumlah, 0);
        document.getElementById('totalPemasukanDisplay').textContent = formatRupiah(totalPemasukan);
    }
    
    // Sembunyikan loading, tampilkan content
    document.getElementById('loadingPemasukan').style.display = 'none';
    content.style.display = 'block';
}

// [20] Load data pengeluaran (auto-generate)
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
                icon: 'fa-money-bill-wave',
                color: '#ef4444'
            });
        }
        
        // 2. UOP (dari tabel komisi)
        if (komisiData.uop > 0) {
            pengeluaranItems.push({
                jenis: 'UOP',
                jumlah: komisiData.uop,
                note: 'Auto-generate dari data komisi',
                icon: 'fa-tools',
                color: '#f59e0b'
            });
        }
        
        // 3. TIPS QRIS (dari tabel komisi)
        if (komisiData.tips_qris > 0) {
            pengeluaranItems.push({
                jenis: 'Tips QRIS',
                jumlah: komisiData.tips_qris,
                note: 'Auto-generate dari data komisi',
                icon: 'fa-qrcode',
                color: '#8b5cf6'
            });
        }
        
        // 4. BAYAR HUTANG KOMISI (default 0)
        pengeluaranItems.push({
            jenis: 'Bayar Hutang Komisi',
            jumlah: 0,
            note: 'Manual input',
            icon: 'fa-hand-holding-usd',
            color: '#dc2626'
        });
        
        // 5. PENGELUARAN LAIN-LAIN (default 0)
        pengeluaranItems.push({
            jenis: 'Pengeluaran Lain Lain',
            jumlah: 0,
            note: 'Manual input',
            icon: 'fa-minus-circle',
            color: '#9333ea'
        });
        
        // Tampilkan data pengeluaran
        displayPengeluaranData(pengeluaranItems);
        
    } catch (error) {
        console.error('Error loading pengeluaran data:', error);
        document.getElementById('loadingPengeluaran').style.display = 'none';
        document.getElementById('pengeluaranContent').innerHTML = `
            <div style="text-align: center; padding: 20px; color: #ff4757;">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Gagal memuat data pengeluaran</p>
            </div>
        `;
        document.getElementById('pengeluaranContent').style.display = 'block';
    }
}

// [21] Fungsi helper: Get Komisi Data
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

// [22] Display data pengeluaran
function displayPengeluaranData(pengeluaranItems) {
    const content = document.getElementById('pengeluaranContent');
    
    if (pengeluaranItems.length === 0) {
        content.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #666;">
                <i class="fas fa-arrow-up" style="font-size: 2rem; margin-bottom: 10px; opacity: 0.3;"></i>
                <p>Tidak ada data pengeluaran</p>
            </div>
        `;
    } else {
        let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';
        
        pengeluaranItems.forEach((item, index) => {
            const isAuto = item.note.includes('Auto-generate');
            
            html += `
                <div class="auto-item ${isAuto ? '' : 'disabled'}">
                    <div class="auto-item-label">
                        <div class="auto-item-icon pengeluaran" style="background: ${item.color};">
                            <i class="fas ${item.icon}"></i>
                        </div>
                        <div>
                            <div class="auto-item-text">${item.jenis}</div>
                            <div class="auto-item-note">${item.note}</div>
                        </div>
                    </div>
                    <div class="auto-item-value pengeluaran">${formatRupiah(item.jumlah)}</div>
                </div>
            `;
        });
        
        html += '</div>';
        content.innerHTML = html;
        
        // Hitung total pengeluaran
        const totalPengeluaran = pengeluaranItems.reduce((sum, item) => sum + item.jumlah, 0);
        document.getElementById('totalPengeluaranDisplay').textContent = formatRupiah(totalPengeluaran);
    }
    
    // Sembunyikan loading, tampilkan content
    document.getElementById('loadingPengeluaran').style.display = 'none';
    content.style.display = 'block';
}

// [23] Buka modal setoran
async function openSetoranModalKas() {
    try {
        // Hitung total kewajiban (saldo dari ringkasan)
        const filterParams = getKasFilterParams();
        const selectedDate = new Date(filterParams.tanggal);
        const periode = calculatePeriodForDate(selectedDate);
        
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
        document.getElementById('modalKewajibanKas').textContent = formatRupiah(totalKewajiban);
        document.getElementById('totalSetoranInputKas').value = totalKewajiban;
        
        // Tampilkan modal
        document.getElementById('setoranModalKas').style.display = 'flex';
        
    } catch (error) {
        console.error('Error opening setoran modal:', error);
        showNotificationKas('Gagal membuka form setoran', 'error');
    }
}

// [24] Tutup modal setoran
function closeSetoranModalKas() {
    document.getElementById('setoranModalKas').style.display = 'none';
}

// [25] Submit setoran
async function submitSetoranKas() {
    try {
        const totalSetoran = parseInt(document.getElementById('totalSetoranInputKas').value) || 0;
        const metodeSetoran = document.getElementById('metodeSetoranKas').value;
        
        if (!totalSetoran || !metodeSetoran) {
            showNotificationKas('Harap isi total setoran dan pilih metode setoran', 'error');
            return;
        }
        
        const filterParams = getKasFilterParams();
        const selectedDate = new Date(filterParams.tanggal);
        const periode = calculatePeriodForDate(selectedDate);
        
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
            sisa_setoran: sisaSetoran, // TAMBAHKAN SISA SETORAN
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
        await sendWhatsAppNotificationKas(setoranData);
        
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

// [26] Verifikasi setoran (hanya untuk owner)
async function verifikasiSetoranKas() {
    try {
        const filterParams = getKasFilterParams();
        const selectedDate = new Date(filterParams.tanggal);
        const periode = calculatePeriodForDate(selectedDate);
        
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

// [27] Submit data KAS
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
        
        // Hitung total pemasukan dan pengeluaran dari auto-generated data
        const totalPemasukan = await calculateTotalPemasukan(filterParams);
        const totalPengeluaran = await calculateTotalPengeluaran(filterParams);
        const saldo = totalPemasukan - totalPengeluaran;
        
        // Data untuk tabel kas
        const kasData = {
            tanggal: filterParams.tanggal,
            hari: new Date(filterParams.tanggal).toLocaleDateString('id-ID', { weekday: 'long' }),
            outlet: filterParams.outlet || currentOutletKas,
            kasir: filterParams.kasir || currentKasUser?.nama_karyawan,
            pemasukan: totalPemasukan,
            pengeluaran: totalPengeluaran,
            saldo: saldo,
            // Tambahkan field detail jika diperlukan
            omset_cash: await getOmsetCash(filterParams.outlet, filterParams.tanggal),
            sisa_setoran: await getSisaSetoran(filterParams.outlet, filterParams.tanggal),
            komisi: await getKomisiField(filterParams.outlet, filterParams.tanggal, 'komisi'),
            uop: await getKomisiField(filterParams.outlet, filterParams.tanggal, 'uop'),
            tips_qris: await getKomisiField(filterParams.outlet, filterParams.tanggal, 'tips_qris')
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
        
        // Refresh data
        await loadKasData();
        
    } catch (error) {
        console.error('Error submitting KAS data:', error);
        showNotificationKas('Gagal menyimpan data: ' + error.message, 'error');
    } finally {
        showKasLoading(false);
    }
}

// [28] Helper: Calculate total pemasukan
async function calculateTotalPemasukan(filterParams) {
    const sisaSetoran = await getSisaSetoran(filterParams.outlet, filterParams.tanggal);
    const omsetCash = await getOmsetCash(filterParams.outlet, filterParams.tanggal);
    const hutangKomisi = await getHutangKomisi(filterParams.outlet, filterParams.tanggal);
    
    // Untuk sekarang, kita anggap top up kas dan pemasukan lain-lain = 0
    // Nanti bisa ditambahkan input manual
    return sisaSetoran + omsetCash + hutangKomisi;
}

// [29] Helper: Calculate total pengeluaran
async function calculateTotalPengeluaran(filterParams) {
    const komisiData = await getKomisiData(filterParams.outlet, filterParams.tanggal);
    
    // Untuk sekarang, kita anggap bayar hutang komisi dan pengeluaran lain-lain = 0
    // Nanti bisa ditambahkan input manual
    return komisiData.komisi + komisiData.uop + komisiData.tips_qris;
}

// [30] Helper: Get komisi field
async function getKomisiField(outlet, tanggal, field) {
    try {
        const { data: komisiData, error } = await supabase
            .from('komisi')
            .select(field)
            .eq('outlet', outlet)
            .eq('tanggal', tanggal)
            .eq('status', 'complete');
        
        if (error) throw error;
        
        const total = komisiData?.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0) || 0;
        return Math.round(total);
        
    } catch (error) {
        console.error(`Error getting ${field}:`, error);
        return 0;
    }
}

// [31] Fungsi untuk mengirim notifikasi WhatsApp
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

// [32] Format notifikasi untuk setoran
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

// [33] Format notifikasi untuk KAS
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

// [34] Format currency untuk WhatsApp
function formatCurrencyForWA(amount) {
    return new Intl.NumberFormat('id-ID').format(amount).replace(/\./g, ',');
}

// [35] Show/hide loading
function showKasLoading(show) {
    const overlay = document.getElementById('kasLoadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

// [36] Show notification
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

// [37] Format Rupiah helper
function formatRupiah(amount) {
    if (amount === 0 || !amount) return 'Rp 0';
    return 'Rp ' + amount.toLocaleString('id-ID');
}

// [38] Modifikasi handleMenuClick untuk menambahkan Kas & Setoran
// Tambahkan di switch case di fungsi handleMenuClick (yang sudah ada):
// GANTI bagian ini:
function handleMenuClick(menuId) {
    switch(menuId) {
        case 'komisi':
            showKomisiPage();
            break;
        case 'absensi':
            showAbsensiPage();
            break;
        case 'kas':
            showKasPage(); // TAMBAHKAN INI
            break;
        case 'slip':
        case 'libur':
        case 'top':
        case 'request':
        case 'stok':
        case 'sertifikasi':
            const menuTitles = {
                'slip': 'Slip Penghasilan',
                'libur': 'Libur & Izin',
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
// ========== END OF FILE ==========
