// ========== MODUL CERTIFICATION ==========
// ========================================

// Variabel global untuk modul sertifikasi
let currentKaryawanCertification = null;
let currentUserOutletCertification = null;
let isOwnerCertification = false;
let certificationData = [];
let certificationMenus = [];
let beforeFile = null;
let afterFile = null;
let videoFile = null;

// [0] Fungsi untuk init database - BUAT TABEL JIKA BELUM ADA
async function initCertificationDatabase() {
    try {
        console.log('🔧 Initializing certification database...');
        
        // 1. Cek dan buat tabel sertifikasi_menu jika belum ada
        const { error: menuTableError } = await supabase
            .from('sertifikasi_menu')
            .select('*')
            .limit(1);
        
        if (menuTableError && menuTableError.code === '42P01') {
            console.log('📁 Creating sertifikasi_menu table...');
            // Buat tabel dengan SQL query
            const { error: createError } = await supabase.rpc('exec_sql', {
                query: `
                    CREATE TABLE IF NOT EXISTS sertifikasi_menu (
                        id SERIAL PRIMARY KEY,
                        nama_menu VARCHAR(100) UNIQUE NOT NULL,
                        kategori VARCHAR(50) DEFAULT 'hair',
                        deskripsi TEXT,
                        created_at TIMESTAMP DEFAULT NOW()
                    );
                    
                    INSERT INTO sertifikasi_menu (nama_menu, kategori, deskripsi) VALUES
                    ('Kids Cut', 'hair', 'Potongan rambut untuk anak-anak'),
                    ('Fade Cut', 'hair', 'Potongan fade style'),
                    ('Botak Licin', 'shaving', 'Cukur botak dengan hasil licin'),
                    ('Shaving', 'shaving', 'Cukur jenggot/kumis'),
                    ('Semir', 'coloring', 'Semir rambut'),
                    ('Colouring', 'coloring', 'Warna rambut'),
                    ('Bleaching', 'coloring', 'Bleaching rambut'),
                    ('Creambath', 'hair', 'Creambath treatment')
                    ON CONFLICT (nama_menu) DO NOTHING;
                `
            }).catch(async () => {
                // Fallback: coba buat dengan insert biasa
                await createTablesManually();
            });
        }
        
        // 2. Cek dan buat tabel sertifikasi jika belum ada
        const { error: certTableError } = await supabase
            .from('sertifikasi')
            .select('*')
            .limit(1);
        
        if (certTableError && certTableError.code === '42P01') {
            console.log('📁 Creating sertifikasi table...');
            // Buat tabel dengan SQL query
            const { error: createError } = await supabase.rpc('exec_sql', {
                query: `
                    CREATE TABLE IF NOT EXISTS sertifikasi (
                        id VARCHAR(50) PRIMARY KEY,
                        karyawan VARCHAR(100) NOT NULL,
                        outlet VARCHAR(100) NOT NULL,
                        menu_id INTEGER,
                        menu_nama VARCHAR(100) NOT NULL,
                        catatan TEXT,
                        foto_before TEXT,
                        foto_after TEXT,
                        video_proses TEXT,
                        status VARCHAR(20) DEFAULT 'pending',
                        review_notes TEXT,
                        approved_by VARCHAR(100),
                        approved_at TIMESTAMP,
                        nomor_wa VARCHAR(20),
                        created_at TIMESTAMP DEFAULT NOW()
                    );
                `
            }).catch(async () => {
                // Fallback: coba buat dengan insert biasa
                await createTablesManually();
            });
        }
        
        console.log('✅ Certification database initialized');
        
    } catch (error) {
        console.error('❌ Error initializing certification database:', error);
        // Coba buat tabel manual
        await createTablesManually();
    }
}

// Fallback untuk buat tabel manual
async function createTablesManually() {
    console.log('🔄 Creating tables manually...');
    
    try {
        // Coba buat tabel sertifikasi_menu
        const { error: menuError } = await supabase
            .from('sertifikasi_menu')
            .insert([
                { nama_menu: 'Kids Cut', kategori: 'hair', deskripsi: 'Potongan rambut untuk anak-anak' }
            ]);
            
        if (menuError && menuError.code === '42P01') {
            console.log('⚠️ Tabel sertifikasi_menu belum ada, akan dibuat otomatis saat data pertama dimasukkan');
        }
        
    } catch (error) {
        console.log('⚠️ Tidak bisa membuat tabel, akan dibuat otomatis nanti');
    }
}

// [1] Fungsi untuk tampilkan halaman sertifikasi
async function showCertificationPage() {
    try {
        console.log('🎓 Loading certification module...');
        
        // Init database terlebih dahulu
        await initCertificationDatabase();
        
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
            .select('role, outlet, posisi, nomor_wa')
            .eq('nama_karyawan', namaKaryawan)
            .single();
        
        if (!karyawanData) {
            alert('Data karyawan tidak ditemukan!');
            return;
        }
        
        currentKaryawanCertification = {
            nama_karyawan: namaKaryawan,
            role: karyawanData.role,
            outlet: karyawanData.outlet,
            posisi: karyawanData.posisi,
            nomor_wa: karyawanData.nomor_wa
        };
        
        currentUserOutletCertification = karyawanData.outlet;
        isOwnerCertification = karyawanData.role === 'owner';
        
        // Sembunyikan main app, tampilkan halaman sertifikasi
        document.getElementById('appScreen').style.display = 'none';
        
        // Buat container halaman sertifikasi
        createCertificationPage();
        
        // Load data berdasarkan role
        await loadCertificationData();
        
    } catch (error) {
        console.error('Error in showCertificationPage:', error);
        showCertificationToast(`❌ Gagal memuat halaman sertifikasi: ${error.message}`, 'error');
    }
}

// [2] Fungsi untuk buat halaman sertifikasi dengan INLINE STYLING
function createCertificationPage() {
    // Hapus halaman sertifikasi sebelumnya jika ada
    const existingPage = document.getElementById('certificationPage');
    if (existingPage) {
        existingPage.remove();
    }
    
    // Hapus toast sebelumnya jika ada
    const existingToast = document.getElementById('certificationToast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Buat container halaman sertifikasi
    const certificationPage = document.createElement('div');
    certificationPage.id = 'certificationPage';
    certificationPage.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: #f5f5f5;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 1000;
    `;
    
    const isBarberman = currentKaryawanCertification?.role === 'barberman';
    const isOwner = currentKaryawanCertification?.role === 'owner';
    
    certificationPage.innerHTML = `
        <!-- Header -->
        <header style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            z-index: 100;
        ">
            <button id="backToMainFromCertification" style="
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 18px;
                transition: background 0.3s;
            ">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h2 style="margin: 0; flex: 1; font-size: 20px; font-weight: 600;">
                <i class="fas fa-award" style="margin-right: 10px;"></i>Sertifikasi Barber
            </h2>
            <button id="refreshCertification" style="
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 18px;
                transition: background 0.3s;
            " title="Refresh">
                <i class="fas fa-sync-alt"></i>
            </button>
        </header>
        
        <!-- Info Header -->
        <div style="
            background: white;
            margin: 16px;
            padding: 16px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        ">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-user" style="color: #667eea;"></i>
                    <span id="userNameCertification" style="font-weight: 500;">${currentKaryawanCertification?.nama_karyawan || '-'}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-award" style="color: #667eea;"></i>
                    <span id="userStatusCertification" style="
                        background: ${isBarberman ? '#fef3c7' : '#d1fae5'};
                        color: ${isBarberman ? '#92400e' : '#065f46'};
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 14px;
                        font-weight: 500;
                    ">${isBarberman ? 'Belum Tersertifikasi' : 'Supervisor'}</span>
                </div>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-briefcase" style="color: #667eea;"></i>
                    <span id="userPositionCertification">${currentKaryawanCertification?.posisi || '-'}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-store" style="color: #667eea;"></i>
                    <span id="userOutletCertification">${currentUserOutletCertification || '-'}</span>
                </div>
            </div>
        </div>
        
        <!-- Untuk BARBERMAN: Menu Sertifikasi -->
        ${isBarberman ? `
        <div style="margin: 16px;">
            <!-- Menu Sertifikasi -->
            <div style="
                background: white;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #333;">
                        <i class="fas fa-list" style="margin-right: 10px; color: #667eea;"></i>Menu Sertifikasi
                    </h3>
                    <div style="
                        background: #f3f4f6;
                        padding: 6px 12px;
                        border-radius: 20px;
                        font-size: 14px;
                        font-weight: 500;
                        color: #6b7280;
                    " id="certificationCount">0/0 tersertifikasi</div>
                </div>
                
                <div id="certificationGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
                    <div style="text-align: center; padding: 40px 20px;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea; margin-bottom: 10px;"></i>
                        <p style="color: #6b7280; margin: 0;">Memuat menu sertifikasi...</p>
                    </div>
                </div>
                
                <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                        <i class="fas fa-info-circle" style="margin-right: 6px; color: #667eea;"></i>
                        Klik menu untuk ajukan sertifikasi
                    </p>
                </div>
            </div>
            
            <!-- History Sertifikasi Saya -->
            <div style="
                background: white;
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #333;">
                        <i class="fas fa-history" style="margin-right: 10px; color: #667eea;"></i>History Sertifikasi Saya
                    </h3>
                    <button onclick="loadCertificationData()" style="
                        background: #f3f4f6;
                        border: none;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        color: #6b7280;
                        font-size: 16px;
                        transition: all 0.3s;
                    " title="Refresh History">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
                
                <div id="loadingHistoryCertification" style="text-align: center; padding: 40px 20px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea; margin-bottom: 10px;"></i>
                    <p style="color: #6b7280; margin: 0;">Memuat history sertifikasi...</p>
                </div>
                
                <div id="historyTableCertification" style="display: none; overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
                        <thead>
                            <tr style="background: #f9fafb;">
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; width: 150px;">Menu</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; width: 120px;">Tanggal Ajuan</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Catatan</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; width: 100px;">Status</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; width: 120px;">Disetujui Oleh</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; width: 120px;">Tanggal Approve</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; width: 100px;">Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="historyBodyCertification">
                            <!-- History akan diisi di sini -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        ` : ''}
        
        <!-- Untuk OWNER: Management Sertifikasi -->
        ${isOwner ? `
        <div style="margin: 16px;">
            <!-- Management Menu Sertifikasi -->
            <div style="
                background: white;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #333;">
                        <i class="fas fa-cogs" style="margin-right: 10px; color: #667eea;"></i>Management Menu Sertifikasi
                    </h3>
                    <button onclick="showAddMenuModal()" style="
                        background: #667eea;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        cursor: pointer;
                        font-weight: 500;
                        transition: background 0.3s;
                    ">
                        <i class="fas fa-plus"></i> Tambah Menu
                    </button>
                </div>
                
                <div id="menuManagementGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
                    <div style="text-align: center; padding: 40px 20px;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea; margin-bottom: 10px;"></i>
                        <p style="color: #6b7280; margin: 0;">Memuat menu sertifikasi...</p>
                    </div>
                </div>
            </div>
            
            <!-- Pending Sertifikasi Requests -->
            <div style="
                background: white;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #333;">
                        <i class="fas fa-clock" style="margin-right: 10px; color: #667eea;"></i>Permohonan Sertifikasi Pending
                    </h3>
                    <div style="
                        background: #fee2e2;
                        padding: 6px 12px;
                        border-radius: 20px;
                        font-size: 14px;
                        font-weight: 500;
                        color: #dc2626;
                    " id="pendingCountCertification">0 requests</div>
                </div>
                
                <div id="loadingPendingCertification" style="text-align: center; padding: 40px 20px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea; margin-bottom: 10px;"></i>
                    <p style="color: #6b7280; margin: 0;">Memuat data sertifikasi...</p>
                </div>
                
                <div id="pendingCertificationGrid" style="display: none;">
                    <!-- Sertifikasi requests akan diisi di sini -->
                </div>
            </div>
            
            <!-- History Sertifikasi -->
            <div style="
                background: white;
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #333;">
                        <i class="fas fa-history" style="margin-right: 10px; color: #667eea;"></i>History Sertifikasi (Semua Karyawan)
                    </h3>
                </div>
                
                <div id="loadingHistoryAllCertification" style="text-align: center; padding: 40px 20px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea; margin-bottom: 10px;"></i>
                    <p style="color: #6b7280; margin: 0;">Memuat history...</p>
                </div>
                
                <div id="historyTableAllCertification" style="display: none; overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
                        <thead>
                            <tr style="background: #f9fafb;">
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; width: 100px;">Tanggal</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; width: 120px;">Karyawan</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; width: 150px;">Menu</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Catatan</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; width: 100px;">Status</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; width: 120px;">Disetujui Oleh</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; width: 100px;">Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="historyBodyAllCertification">
                            <!-- History akan diisi di sini -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        ` : ''}
        
        <!-- Footer -->
        <div style="
            background: white;
            margin: 16px;
            padding: 16px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            color: #6b7280;
            font-size: 14px;
        ">
            <p style="margin: 0;">
                <i class="fas fa-info-circle" style="margin-right: 6px; color: #667eea;"></i>
                ${isBarberman ? 
                'Upload foto before/after dan video proses untuk pengajuan sertifikasi' : 
                'Kelola menu sertifikasi dan approve/reject pengajuan dari barberman'}
            </p>
        </div>
        
        <!-- Modal Form Sertifikasi -->
        <div id="certificationFormModal" style="
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1001;
            align-items: center;
            justify-content: center;
            padding: 20px;
        ">
            <div style="
                background: white;
                border-radius: 12px;
                width: 100%;
                max-width: 500px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            ">
                <div style="
                    padding: 20px;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #333;">
                        <i class="fas fa-file-upload" style="margin-right: 10px; color: #667eea;"></i>Form Sertifikasi
                    </h3>
                    <button onclick="closeCertificationFormModal()" style="
                        background: none;
                        border: none;
                        color: #6b7280;
                        font-size: 20px;
                        cursor: pointer;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 50%;
                        transition: background 0.3s;
                    ">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div style="padding: 20px;">
                    <form id="certificationForm">
                        <input type="hidden" id="certificationMenuId">
                        <input type="hidden" id="certificationMenuName">
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                <i class="fas fa-sticky-note" style="margin-right: 8px; color: #667eea;"></i>Catatan:
                            </label>
                            <textarea id="certificationNotes" style="
                                width: 100%;
                                padding: 12px;
                                border: 1px solid #d1d5db;
                                border-radius: 8px;
                                font-family: inherit;
                                font-size: 14px;
                                resize: vertical;
                                min-height: 80px;
                                box-sizing: border-box;
                            " placeholder="Tambahkan catatan tentang hasil pekerjaan..." rows="3"></textarea>
                            <small style="display: block; margin-top: 4px; color: #6b7280; font-size: 12px;">
                                Deskripsi singkat tentang hasil pekerjaan
                            </small>
                        </div>
                        
                        <!-- Upload Foto Before -->
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                <i class="fas fa-camera" style="margin-right: 8px; color: #667eea;"></i>Foto Before:
                            </label>
                            <div id="beforeUploadArea" style="
                                border: 2px dashed #d1d5db;
                                border-radius: 8px;
                                padding: 40px 20px;
                                text-align: center;
                                cursor: pointer;
                                transition: all 0.3s;
                            ">
                                <i class="fas fa-cloud-upload-alt" style="font-size: 48px; color: #9ca3af; margin-bottom: 16px;"></i>
                                <p style="margin: 0 0 8px 0; color: #374151; font-weight: 500;">Klik untuk upload foto before</p>
                                <small style="color: #6b7280;">Format: JPG, PNG (max 5MB)</small>
                                <input type="file" id="beforePhoto" accept="image/*" style="display: none;">
                            </div>
                            <div id="beforePreview" style="display: none; position: relative;">
                                <img id="beforePreviewImage" style="width: 100%; border-radius: 8px; margin-top: 10px;">
                                <button type="button" onclick="removePreview('before')" style="
                                    position: absolute;
                                    top: 10px;
                                    right: 10px;
                                    background: rgba(0,0,0,0.7);
                                    color: white;
                                    border: none;
                                    width: 30px;
                                    height: 30px;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    cursor: pointer;
                                ">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Upload Foto After -->
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                <i class="fas fa-camera-retro" style="margin-right: 8px; color: #667eea;"></i>Foto After:
                            </label>
                            <div id="afterUploadArea" style="
                                border: 2px dashed #d1d5db;
                                border-radius: 8px;
                                padding: 40px 20px;
                                text-align: center;
                                cursor: pointer;
                                transition: all 0.3s;
                            ">
                                <i class="fas fa-cloud-upload-alt" style="font-size: 48px; color: #9ca3af; margin-bottom: 16px;"></i>
                                <p style="margin: 0 0 8px 0; color: #374151; font-weight: 500;">Klik untuk upload foto after</p>
                                <small style="color: #6b7280;">Format: JPG, PNG (max 5MB)</small>
                                <input type="file" id="afterPhoto" accept="image/*" style="display: none;">
                            </div>
                            <div id="afterPreview" style="display: none; position: relative;">
                                <img id="afterPreviewImage" style="width: 100%; border-radius: 8px; margin-top: 10px;">
                                <button type="button" onclick="removePreview('after')" style="
                                    position: absolute;
                                    top: 10px;
                                    right: 10px;
                                    background: rgba(0,0,0,0.7);
                                    color: white;
                                    border: none;
                                    width: 30px;
                                    height: 30px;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    cursor: pointer;
                                ">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Upload Video Process -->
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                <i class="fas fa-video" style="margin-right: 8px; color: #667eea;"></i>Video Proses:
                            </label>
                            <div id="videoUploadArea" style="
                                border: 2px dashed #d1d5db;
                                border-radius: 8px;
                                padding: 40px 20px;
                                text-align: center;
                                cursor: pointer;
                                transition: all 0.3s;
                            ">
                                <i class="fas fa-cloud-upload-alt" style="font-size: 48px; color: #9ca3af; margin-bottom: 16px;"></i>
                                <p style="margin: 0 0 8px 0; color: #374151; font-weight: 500;">Klik untuk upload video proses</p>
                                <small style="color: #6b7280;">Format: MP4, MOV (max 20MB)</small>
                                <input type="file" id="processVideo" accept="video/*" style="display: none;">
                            </div>
                            <div id="videoPreview" style="display: none; position: relative;">
                                <video id="videoPreviewPlayer" controls style="width: 100%; border-radius: 8px; margin-top: 10px;"></video>
                                <button type="button" onclick="removePreview('video')" style="
                                    position: absolute;
                                    top: 10px;
                                    right: 10px;
                                    background: rgba(0,0,0,0.7);
                                    color: white;
                                    border: none;
                                    width: 30px;
                                    height: 30px;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    cursor: pointer;
                                ">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 12px; margin-top: 30px;">
                            <button type="button" onclick="closeCertificationFormModal()" style="
                                flex: 1;
                                background: #f3f4f6;
                                color: #374151;
                                border: none;
                                padding: 12px;
                                border-radius: 8px;
                                font-weight: 500;
                                cursor: pointer;
                                transition: background 0.3s;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 8px;
                            ">
                                <i class="fas fa-times"></i> Batal
                            </button>
                            <button type="submit" id="submitCertificationBtn" style="
                                flex: 1;
                                background: #667eea;
                                color: white;
                                border: none;
                                padding: 12px;
                                border-radius: 8px;
                                font-weight: 500;
                                cursor: pointer;
                                transition: background 0.3s;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 8px;
                            ">
                                <i class="fas fa-paper-plane"></i> Ajukan Sertifikasi
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        
        <!-- Modal Add/Edit Menu -->
        <div id="menuModal" style="
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1001;
            align-items: center;
            justify-content: center;
            padding: 20px;
        ">
            <div style="
                background: white;
                border-radius: 12px;
                width: 100%;
                max-width: 400px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            ">
                <div style="
                    padding: 20px;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #333;">
                        <i class="fas fa-plus-circle" style="margin-right: 10px; color: #667eea;"></i>Tambah Menu Sertifikasi
                    </h3>
                    <button onclick="closeMenuModal()" style="
                        background: none;
                        border: none;
                        color: #6b7280;
                        font-size: 20px;
                        cursor: pointer;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 50%;
                        transition: background 0.3s;
                    ">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div style="padding: 20px;">
                    <form id="menuForm">
                        <input type="hidden" id="menuId">
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                <i class="fas fa-list" style="margin-right: 8px; color: #667eea;"></i>Nama Menu:
                            </label>
                            <input type="text" id="menuName" style="
                                width: 100%;
                                padding: 12px;
                                border: 1px solid #d1d5db;
                                border-radius: 8px;
                                font-family: inherit;
                                font-size: 14px;
                                box-sizing: border-box;
                            " placeholder="Contoh: Hair Highlight, Face Mask" required>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                <i class="fas fa-align-left" style="margin-right: 8px; color: #667eea;"></i>Deskripsi:
                            </label>
                            <textarea id="menuDescription" style="
                                width: 100%;
                                padding: 12px;
                                border: 1px solid #d1d5db;
                                border-radius: 8px;
                                font-family: inherit;
                                font-size: 14px;
                                resize: vertical;
                                min-height: 80px;
                                box-sizing: border-box;
                            " placeholder="Deskripsi singkat tentang menu ini..." rows="3"></textarea>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                <i class="fas fa-tags" style="margin-right: 8px; color: #667eea;"></i>Kategori:
                            </label>
                            <select id="menuCategory" style="
                                width: 100%;
                                padding: 12px;
                                border: 1px solid #d1d5db;
                                border-radius: 8px;
                                font-family: inherit;
                                font-size: 14px;
                                box-sizing: border-box;
                                background: white;
                            ">
                                <option value="hair">Hair Treatment</option>
                                <option value="face">Face Treatment</option>
                                <option value="massage">Massage</option>
                                <option value="shaving">Shaving</option>
                                <option value="coloring">Coloring</option>
                                <option value="other">Lainnya</option>
                            </select>
                        </div>
                        
                        <div style="display: flex; gap: 12px;">
                            <button type="button" onclick="closeMenuModal()" style="
                                flex: 1;
                                background: #f3f4f6;
                                color: #374151;
                                border: none;
                                padding: 12px;
                                border-radius: 8px;
                                font-weight: 500;
                                cursor: pointer;
                                transition: background 0.3s;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 8px;
                            ">
                                <i class="fas fa-times"></i> Batal
                            </button>
                            <button type="submit" id="submitMenuBtn" style="
                                flex: 1;
                                background: #667eea;
                                color: white;
                                border: none;
                                padding: 12px;
                                border-radius: 8px;
                                font-weight: 500;
                                cursor: pointer;
                                transition: background 0.3s;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 8px;
                            ">
                                <i class="fas fa-save"></i> Simpan Menu
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        
        <!-- Modal Detail Sertifikasi -->
        <div id="certificationDetailModal" style="
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1001;
            align-items: center;
            justify-content: center;
            padding: 20px;
        ">
            <div style="
                background: white;
                border-radius: 12px;
                width: 100%;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            ">
                <div style="
                    padding: 20px;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #333;">
                        <i class="fas fa-eye" style="margin-right: 10px; color: #667eea;"></i>Detail Sertifikasi
                    </h3>
                    <button onclick="closeCertificationDetailModal()" style="
                        background: none;
                        border: none;
                        color: #6b7280;
                        font-size: 20px;
                        cursor: pointer;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 50%;
                        transition: background 0.3s;
                    ">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div id="certificationDetailContent" style="padding: 20px;">
                    <!-- Detail akan diisi di sini -->
                </div>
            </div>
        </div>
        
        <!-- Modal Review Sertifikasi (Owner) -->
        <div id="certificationReviewModal" style="
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1001;
            align-items: center;
            justify-content: center;
            padding: 20px;
        ">
            <div style="
                background: white;
                border-radius: 12px;
                width: 100%;
                max-width: 500px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            ">
                <div style="
                    padding: 20px;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #333;">
                        <i class="fas fa-clipboard-check" style="margin-right: 10px; color: #667eea;"></i>Review Sertifikasi
                    </h3>
                    <button onclick="closeCertificationReviewModal()" style="
                        background: none;
                        border: none;
                        color: #6b7280;
                        font-size: 20px;
                        cursor: pointer;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 50%;
                        transition: background 0.3s;
                    ">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div id="certificationReviewContent" style="padding: 20px;">
                    <!-- Review content akan diisi di sini -->
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(certificationPage);
    
    // Setup event listeners
    setupCertificationPageEvents();
    
    // Setup upload events untuk barberman
    if (isBarberman) {
        setupUploadEvents();
    }
    
    // Setup form events
    const menuForm = document.getElementById('menuForm');
    if (menuForm) {
        menuForm.addEventListener('submit', handleMenuFormSubmit);
    }
}

// [3] Setup event listeners untuk halaman sertifikasi
function setupCertificationPageEvents() {
    // Tombol kembali
    document.getElementById('backToMainFromCertification').addEventListener('click', () => {
        document.getElementById('certificationPage').remove();
        document.getElementById('appScreen').style.display = 'block';
    });
    
    // Tombol refresh
    const refreshBtn = document.getElementById('refreshCertification');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await loadCertificationData();
        });
    }
}

// [4] Load data sertifikasi
async function loadCertificationData() {
    try {
        // Load menu sertifikasi
        await loadCertificationMenus();
        
        // Load history sertifikasi
        if (currentKaryawanCertification?.role === 'barberman') {
            await loadBarbermanCertificationHistory();
        } else if (currentKaryawanCertification?.role === 'owner') {
            await loadAllCertificationRequests();
        }
        
    } catch (error) {
        console.error('Error loading certification data:', error);
        showCertificationToast(`❌ Gagal memuat data sertifikasi: ${error.message}`, 'error');
    }
}

// [5] Load menu sertifikasi
async function loadCertificationMenus() {
    try {
        const certificationGrid = document.getElementById('certificationGrid');
        const menuManagementGrid = document.getElementById('menuManagementGrid');
        
        // Load dari database
        const { data: existingMenus, error } = await supabase
            .from('sertifikasi_menu')
            .select('*')
            .order('nama_menu');
        
        if (error) {
            // Jika tabel tidak ada, gunakan default menu
            if (error.code === '42P01') {
                certificationMenus = getDefaultMenus();
            } else {
                throw error;
            }
        } else {
            certificationMenus = existingMenus || getDefaultMenus();
        }
        
        // Tampilkan untuk barberman
        if (certificationGrid) {
            displayCertificationMenusForBarberman();
        }
        
        // Tampilkan untuk owner (management)
        if (menuManagementGrid) {
            displayCertificationMenusForOwner();
        }
        
    } catch (error) {
        console.error('Error loading certification menus:', error);
        certificationMenus = getDefaultMenus();
        showCertificationToast(`⚠️ Gagal memuat menu: ${error.message}`, 'warning');
    }
}

// Default menu jika tabel tidak ada
function getDefaultMenus() {
    return [
        { id: 1, nama_menu: 'Kids Cut', kategori: 'hair', deskripsi: 'Potongan rambut untuk anak-anak' },
        { id: 2, nama_menu: 'Fade Cut', kategori: 'hair', deskripsi: 'Potongan fade style' },
        { id: 3, nama_menu: 'Botak Licin', kategori: 'shaving', deskripsi: 'Cukur botak dengan hasil licin' },
        { id: 4, nama_menu: 'Shaving', kategori: 'shaving', deskripsi: 'Cukur jenggot/kumis' },
        { id: 5, nama_menu: 'Semir', kategori: 'coloring', deskripsi: 'Semir rambut' },
        { id: 6, nama_menu: 'Colouring', kategori: 'coloring', deskripsi: 'Warna rambut' },
        { id: 7, nama_menu: 'Bleaching', kategori: 'coloring', deskripsi: 'Bleaching rambut' },
        { id: 8, nama_menu: 'Creambath', kategori: 'hair', deskripsi: 'Creambath treatment' }
    ];
}

// [6] Display menu sertifikasi untuk barberman
function displayCertificationMenusForBarberman() {
    const certificationGrid = document.getElementById('certificationGrid');
    if (!certificationGrid) return;
    
    if (!certificationMenus || certificationMenus.length === 0) {
        certificationGrid.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; grid-column: 1 / -1;">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #9ca3af; margin-bottom: 16px;"></i>
                <h4 style="margin: 0 0 8px 0; color: #374151;">Belum ada menu sertifikasi</h4>
                <p style="margin: 0; color: #6b7280;">Hubungi owner untuk menambahkan menu</p>
            </div>
        `;
        return;
    }
    
    // Hitung sertifikasi yang sudah approved
    let certifiedCount = 0;
    if (certificationData && certificationData.length > 0) {
        certifiedCount = certificationData.filter(item => item.status === 'approved').length;
    }
    
    // Update count
    const countElement = document.getElementById('certificationCount');
    if (countElement) {
        countElement.textContent = `${certifiedCount}/${certificationMenus.length} tersertifikasi`;
    }
    
    let html = '';
    
    certificationMenus.forEach(menu => {
        // Cek status sertifikasi untuk menu ini
        let status = 'Belum Tersertifikasi';
        let statusClass = 'status-pending';
        let statusColor = '#fef3c7';
        let textColor = '#92400e';
        let certificationItem = null;
        
        if (certificationData && certificationData.length > 0) {
            certificationItem = certificationData.find(item => 
                item.menu_id === menu.id || item.menu_nama === menu.nama_menu);
            
            if (certificationItem) {
                if (certificationItem.status === 'approved') {
                    status = 'Babeh Certified';
                    statusClass = 'status-approved';
                    statusColor = '#d1fae5';
                    textColor = '#065f46';
                } else if (certificationItem.status === 'pending') {
                    status = 'Menunggu Review';
                    statusClass = 'status-pending';
                    statusColor = '#fef3c7';
                    textColor = '#92400e';
                } else if (certificationItem.status === 'rejected') {
                    status = 'Ditolak';
                    statusClass = 'status-rejected';
                    statusColor = '#fee2e2';
                    textColor = '#dc2626';
                }
            }
        }
        
        const icon = getMenuIcon(menu.kategori);
        
        html += `
            <div onclick="openCertificationForm('${menu.id}', '${menu.nama_menu.replace(/'/g, "\\'")}')" style="
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 20px;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                gap: 16px;
                position: relative;
                overflow: hidden;
            " onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'; this.style.transform='translateY(-2px)';" 
             onmouseout="this.style.boxShadow='none'; this.style.transform='translateY(0)';">
                <div style="
                    width: 50px;
                    height: 50px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 20px;
                    flex-shrink: 0;
                ">
                    <i class="${icon}"></i>
                </div>
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 8px 0; color: #374151; font-size: 16px;">${menu.nama_menu}</h4>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">${menu.deskripsi || ''}</p>
                    <div style="margin-top: 12px;">
                        <span style="
                            background: ${statusColor};
                            color: ${textColor};
                            padding: 4px 12px;
                            border-radius: 20px;
                            font-size: 12px;
                            font-weight: 500;
                        ">${status}</span>
                    </div>
                </div>
                <div style="color: #9ca3af;">
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>
        `;
    });
    
    certificationGrid.innerHTML = html;
}

// [7] Display menu sertifikasi untuk owner (management)
function displayCertificationMenusForOwner() {
    const menuManagementGrid = document.getElementById('menuManagementGrid');
    if (!menuManagementGrid) return;
    
    if (!certificationMenus || certificationMenus.length === 0) {
        menuManagementGrid.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; grid-column: 1 / -1;">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #9ca3af; margin-bottom: 16px;"></i>
                <h4 style="margin: 0 0 8px 0; color: #374151;">Belum ada menu sertifikasi</h4>
                <p style="margin: 0; color: #6b7280;">Tambahkan menu baru menggunakan tombol di atas</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    certificationMenus.forEach(menu => {
        const icon = getMenuIcon(menu.kategori);
        const categoryName = getCategoryName(menu.kategori);
        
        html += `
            <div style="
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 20px;
            ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="
                            width: 40px;
                            height: 40px;
                            background: #f3f4f6;
                            border-radius: 8px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: #667eea;
                            font-size: 18px;
                        ">
                            <i class="${icon}"></i>
                        </div>
                        <div>
                            <h4 style="margin: 0 0 4px 0; color: #374151; font-size: 16px;">${menu.nama_menu}</h4>
                            <span style="
                                background: #f3f4f6;
                                color: #6b7280;
                                padding: 2px 8px;
                                border-radius: 4px;
                                font-size: 12px;
                            ">${categoryName}</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="editMenu('${menu.id}')" style="
                            background: #f3f4f6;
                            border: none;
                            width: 36px;
                            height: 36px;
                            border-radius: 8px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            cursor: pointer;
                            color: #6b7280;
                            font-size: 14px;
                            transition: all 0.3s;
                        " title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteMenu('${menu.id}')" style="
                            background: #fee2e2;
                            border: none;
                            width: 36px;
                            height: 36px;
                            border-radius: 8px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            cursor: pointer;
                            color: #dc2626;
                            font-size: 14px;
                            transition: all 0.3s;
                        " title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div>
                    <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">${menu.deskripsi || 'Tidak ada deskripsi'}</p>
                    <div style="display: flex; gap: 16px;">
                        <span style="display: flex; align-items: center; gap: 6px; color: #6b7280; font-size: 14px;">
                            <i class="fas fa-users"></i>
                            <span>0 barberman certified</span>
                        </span>
                        <span style="display: flex; align-items: center; gap: 6px; color: #6b7280; font-size: 14px;">
                            <i class="fas fa-clock"></i>
                            <span>0 pending</span>
                        </span>
                    </div>
                </div>
            </div>
        `;
    });
    
    menuManagementGrid.innerHTML = html;
}

// [8] Load history sertifikasi untuk barberman
async function loadBarbermanCertificationHistory() {
    try {
        const loadingEl = document.getElementById('loadingHistoryCertification');
        const tableEl = document.getElementById('historyTableCertification');
        
        if (loadingEl) loadingEl.style.display = 'block';
        if (tableEl) tableEl.style.display = 'none';
        
        // Query history sertifikasi untuk barberman ini
        const { data: historyData, error } = await supabase
            .from('sertifikasi')
            .select('*')
            .eq('karyawan', currentKaryawanCertification.nama_karyawan)
            .order('created_at', { ascending: false });
        
        if (error) {
            // Jika tabel tidak ada, gunakan array kosong
            if (error.code === '42P01') {
                certificationData = [];
            } else {
                throw error;
            }
        } else {
            certificationData = historyData || [];
        }
        
        // Tampilkan history
        displayBarbermanCertificationHistory();
        
    } catch (error) {
        console.error('Error loading certification history:', error);
        const tbody = document.getElementById('historyBodyCertification');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="padding: 40px 20px; text-align: center; color: #dc2626;">
                        <i class="fas fa-exclamation-triangle"></i>
                        Gagal memuat history: ${error.message}
                    </td>
                </tr>
            `;
        }
    } finally {
        const loadingEl = document.getElementById('loadingHistoryCertification');
        const tableEl = document.getElementById('historyTableCertification');
        
        if (loadingEl) loadingEl.style.display = 'none';
        if (tableEl) {
            const tbody = tableEl.querySelector('tbody');
            if (tbody && tbody.children.length > 0) {
                tableEl.style.display = 'block';
            }
        }
    }
}

// [9] Display history sertifikasi untuk barberman
function displayBarbermanCertificationHistory() {
    const tbody = document.getElementById('historyBodyCertification');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!certificationData || certificationData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="padding: 40px 20px; text-align: center; color: #6b7280;">
                    <i class="fas fa-history"></i>
                    Belum ada history sertifikasi
                </td>
            </tr>
        `;
        return;
    }
    
    certificationData.forEach(cert => {
        const createdDate = new Date(cert.created_at);
        const approveDate = cert.approved_at ? new Date(cert.approved_at) : null;
        
        // Status styling
        let statusClass = '';
        let statusText = '';
        if (cert.status === 'approved') {
            statusClass = 'background: #d1fae5; color: #065f46;';
            statusText = 'Babeh Certified';
        } else if (cert.status === 'rejected') {
            statusClass = 'background: #fee2e2; color: #dc2626;';
            statusText = 'Ditolak';
        } else if (cert.status === 'pending') {
            statusClass = 'background: #fef3c7; color: #92400e;';
            statusText = 'Menunggu';
        } else {
            statusClass = 'background: #f3f4f6; color: #6b7280;';
            statusText = cert.status;
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><strong>${cert.menu_nama}</strong></td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${formatDateToDisplay(createdDate)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;" title="${cert.catatan || '-'}">
                ${cert.catatan ? (cert.catatan.length > 50 ? cert.catatan.substring(0, 50) + '...' : cert.catatan) : '-'}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                <span style="
                    ${statusClass}
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 500;
                    display: inline-block;
                ">${statusText}</span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${cert.approved_by || '-'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${approveDate ? formatDateToDisplay(approveDate) : '-'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                <button onclick="showCertificationDetail('${cert.id}')" style="
                    background: #f3f4f6;
                    border: none;
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #6b7280;
                    font-size: 14px;
                    margin-right: 8px;
                    transition: all 0.3s;
                " title="View Detail">
                    <i class="fas fa-eye"></i>
                </button>
                ${cert.status === 'pending' ? `
                <button onclick="cancelCertificationRequest('${cert.id}')" style="
                    background: #fee2e2;
                    border: none;
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #dc2626;
                    font-size: 14px;
                    transition: all 0.3s;
                " title="Batalkan">
                    <i class="fas fa-times"></i>
                </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Show table if there's data
    const tableEl = document.getElementById('historyTableCertification');
    if (tableEl && tbody.children.length > 0) {
        tableEl.style.display = 'block';
    }
}

// [10] Load semua permohonan sertifikasi untuk owner
async function loadAllCertificationRequests() {
    try {
        // Tampilkan loading
        const loadingPending = document.getElementById('loadingPendingCertification');
        const pendingGrid = document.getElementById('pendingCertificationGrid');
        const loadingHistory = document.getElementById('loadingHistoryAllCertification');
        const historyTable = document.getElementById('historyTableAllCertification');
        
        if (loadingPending) loadingPending.style.display = 'block';
        if (pendingGrid) pendingGrid.style.display = 'none';
        if (loadingHistory) loadingHistory.style.display = 'block';
        if (historyTable) historyTable.style.display = 'none';
        
        // Query semua sertifikasi
        const { data: allCertifications, error } = await supabase
            .from('sertifikasi')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            // Jika tabel tidak ada, gunakan array kosong
            if (error.code === '42P01') {
                return;
            } else {
                throw error;
            }
        }
        
        // Pisahkan pending dan history
        const pendingCertifications = (allCertifications || []).filter(item => item.status === 'pending');
        const historyCertifications = (allCertifications || []).filter(item => item.status !== 'pending');
        
        // Display data
        displayPendingCertificationRequests(pendingCertifications);
        displayAllCertificationHistory(historyCertifications);
        
        // Update count
        const pendingCountEl = document.getElementById('pendingCountCertification');
        if (pendingCountEl) {
            pendingCountEl.textContent = `${pendingCertifications.length} requests pending`;
        }
        
    } catch (error) {
        console.error('Error loading certification requests:', error);
        showCertificationToast(`❌ Gagal memuat data sertifikasi: ${error.message}`, 'error');
    } finally {
        // Hide loading
        const loadingPending = document.getElementById('loadingPendingCertification');
        const pendingGrid = document.getElementById('pendingCertificationGrid');
        const loadingHistory = document.getElementById('loadingHistoryAllCertification');
        const historyTable = document.getElementById('historyTableAllCertification');
        
        if (loadingPending) loadingPending.style.display = 'none';
        if (pendingGrid) pendingGrid.style.display = 'block';
        if (loadingHistory) loadingHistory.style.display = 'none';
        if (historyTable) historyTable.style.display = 'table';
    }
}

// [11] Display pending sertifikasi requests untuk owner
function displayPendingCertificationRequests(certifications) {
    const pendingGrid = document.getElementById('pendingCertificationGrid');
    if (!pendingGrid) return;
    
    if (!certifications || certifications.length === 0) {
        pendingGrid.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <i class="fas fa-check-circle" style="font-size: 48px; color: #10b981; margin-bottom: 16px;"></i>
                <h4 style="margin: 0 0 8px 0; color: #374151;">Tidak ada permohonan sertifikasi pending</h4>
                <p style="margin: 0; color: #6b7280;">Semua permohonan sudah diproses</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    certifications.forEach(cert => {
        const createdDate = new Date(cert.created_at);
        
        html += `
            <div style="
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 16px;
            " data-cert-id="${cert.id}">
                <div style="margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-user" style="color: #667eea;"></i>
                            <strong style="color: #374151;">${cert.karyawan}</strong>
                            <span style="color: #6b7280; font-size: 14px;">(${cert.outlet})</span>
                        </div>
                        <div style="
                            background: #fef3c7;
                            color: #92400e;
                            padding: 4px 12px;
                            border-radius: 20px;
                            font-size: 12px;
                            font-weight: 500;
                        ">Menunggu Review</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px; color: #6b7280; font-size: 14px;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-list"></i>
                            <span><strong>${cert.menu_nama}</strong></span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <i class="far fa-calendar"></i>
                            <span>Diajukan: ${formatDateToDisplay(createdDate)}</span>
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 16px; padding: 16px; background: #f9fafb; border-radius: 8px;">
                    <div style="display: flex; align-items: flex-start; gap: 12px;">
                        <i class="fas fa-sticky-note" style="color: #667eea; margin-top: 2px;"></i>
                        <div style="color: #374151; font-size: 14px;">${cert.catatan || 'Tidak ada catatan'}</div>
                    </div>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
                        <div>
                            <label style="display: block; margin-bottom: 4px; font-size: 14px; color: #6b7280;">
                                <i class="fas fa-camera"></i> Foto Before:
                            </label>
                            ${cert.foto_before ? 
                                `<button onclick="viewMedia('${cert.foto_before}', 'image')" style="
                                    background: #f3f4f6;
                                    border: none;
                                    padding: 8px 12px;
                                    border-radius: 6px;
                                    font-size: 14px;
                                    color: #374151;
                                    cursor: pointer;
                                    transition: background 0.3s;
                                    width: 100%;
                                ">Lihat Foto</button>` : 
                                '<span style="color: #9ca3af; font-size: 14px;">Tidak ada</span>'}
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 4px; font-size: 14px; color: #6b7280;">
                                <i class="fas fa-camera-retro"></i> Foto After:
                            </label>
                            ${cert.foto_after ? 
                                `<button onclick="viewMedia('${cert.foto_after}', 'image')" style="
                                    background: #f3f4f6;
                                    border: none;
                                    padding: 8px 12px;
                                    border-radius: 6px;
                                    font-size: 14px;
                                    color: #374151;
                                    cursor: pointer;
                                    transition: background 0.3s;
                                    width: 100%;
                                ">Lihat Foto</button>` : 
                                '<span style="color: #9ca3af; font-size: 14px;">Tidak ada</span>'}
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 4px; font-size: 14px; color: #6b7280;">
                                <i class="fas fa-video"></i> Video Proses:
                            </label>
                            ${cert.video_proses ? 
                                `<button onclick="viewMedia('${cert.video_proses}', 'video')" style="
                                    background: #f3f4f6;
                                    border: none;
                                    padding: 8px 12px;
                                    border-radius: 6px;
                                    font-size: 14px;
                                    color: #374151;
                                    cursor: pointer;
                                    transition: background 0.3s;
                                    width: 100%;
                                ">Lihat Video</button>` : 
                                '<span style="color: #9ca3af; font-size: 14px;">Tidak ada</span>'}
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">
                        <i class="fas fa-edit"></i> Catatan Review:
                    </label>
                    <textarea id="certReviewNotes_${cert.id}" style="
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #d1d5db;
                        border-radius: 8px;
                        font-family: inherit;
                        font-size: 14px;
                        resize: vertical;
                        min-height: 60px;
                        box-sizing: border-box;
                    " placeholder="Masukkan catatan review..." rows="2"></textarea>
                </div>
                
                <div style="display: flex; gap: 12px;">
                    <button onclick="approveCertificationRequest('${cert.id}')" style="
                        flex: 1;
                        background: #10b981;
                        color: white;
                        border: none;
                        padding: 12px;
                        border-radius: 8px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: background 0.3s;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    ">
                        <i class="fas fa-check"></i> Approve (Babeh Certified)
                    </button>
                    <button onclick="rejectCertificationRequest('${cert.id}')" style="
                        flex: 1;
                        background: #ef4444;
                        color: white;
                        border: none;
                        padding: 12px;
                        border-radius: 8px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: background 0.3s;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    ">
                        <i class="fas fa-times"></i> Reject
                    </button>
                    <button onclick="showCertificationDetail('${cert.id}')" style="
                        background: #f3f4f6;
                        color: #374151;
                        border: none;
                        padding: 12px;
                        border-radius: 8px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: background 0.3s;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    ">
                        <i class="fas fa-info-circle"></i> Detail
                    </button>
                </div>
            </div>
        `;
    });
    
    pendingGrid.innerHTML = html;
}

// [12] Display history sertifikasi untuk owner
function displayAllCertificationHistory(certifications) {
    const tbody = document.getElementById('historyBodyAllCertification');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!certifications || certifications.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="padding: 40px 20px; text-align: center; color: #6b7280;">
                    <i class="fas fa-history"></i>
                    Tidak ada history sertifikasi
                </td>
            </tr>
        `;
        return;
    }
    
    // Batasi maksimal 15 baris
    const displayCerts = certifications.slice(0, 15);
    
    displayCerts.forEach(cert => {
        const createdDate = new Date(cert.created_at);
        const approveDate = cert.approved_at ? new Date(cert.approved_at) : null;
        
        // Status styling
        let statusClass = '';
        let statusText = '';
        if (cert.status === 'approved') {
            statusClass = 'background: #d1fae5; color: #065f46;';
            statusText = 'Babeh Certified';
        } else if (cert.status === 'rejected') {
            statusClass = 'background: #fee2e2; color: #dc2626;';
            statusText = 'Ditolak';
        } else if (cert.status === 'pending') {
            statusClass = 'background: #fef3c7; color: #92400e;';
            statusText = 'Menunggu';
        } else {
            statusClass = 'background: #f3f4f6; color: #6b7280;';
            statusText = cert.status;
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${formatDateToDisplay(createdDate)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${cert.karyawan || '-'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><strong>${cert.menu_nama || '-'}</strong></td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;" title="${cert.catatan || '-'}">
                ${cert.catatan ? (cert.catatan.length > 40 ? cert.catatan.substring(0, 40) + '...' : cert.catatan) : '-'}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                <span style="
                    ${statusClass}
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 500;
                    display: inline-block;
                ">${statusText}</span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${cert.approved_by || '-'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                <button onclick="showCertificationDetail('${cert.id}')" style="
                    background: #f3f4f6;
                    border: none;
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #6b7280;
                    font-size: 14px;
                    margin-right: 8px;
                    transition: all 0.3s;
                " title="View Detail">
                    <i class="fas fa-eye"></i>
                </button>
                ${cert.status === 'approved' ? `
                <button onclick="sendCertificationCongrats('${cert.id}')" style="
                    background: #d1fae5;
                    border: none;
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #065f46;
                    font-size: 14px;
                    transition: all 0.3s;
                " title="Kirim Selamat WA">
                    <i class="fab fa-whatsapp"></i>
                </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// [13] Setup upload events
function setupUploadEvents() {
    // Before photo upload
    const beforeUploadArea = document.getElementById('beforeUploadArea');
    const beforePhotoInput = document.getElementById('beforePhoto');
    
    beforeUploadArea?.addEventListener('click', () => {
        beforePhotoInput.click();
    });
    
    beforePhotoInput?.addEventListener('change', function(e) {
        handleFileUpload(e.target.files[0], 'before');
    });
    
    // After photo upload
    const afterUploadArea = document.getElementById('afterUploadArea');
    const afterPhotoInput = document.getElementById('afterPhoto');
    
    afterUploadArea?.addEventListener('click', () => {
        afterPhotoInput.click();
    });
    
    afterPhotoInput?.addEventListener('change', function(e) {
        handleFileUpload(e.target.files[0], 'after');
    });
    
    // Video upload
    const videoUploadArea = document.getElementById('videoUploadArea');
    const videoInput = document.getElementById('processVideo');
    
    videoUploadArea?.addEventListener('click', () => {
        videoInput.click();
    });
    
    videoInput?.addEventListener('change', function(e) {
        handleFileUpload(e.target.files[0], 'video');
    });
    
    // Form submission
    const form = document.getElementById('certificationForm');
    form?.addEventListener('submit', submitCertificationRequest);
}

// [14] Handle file upload preview
function handleFileUpload(file, type) {
    if (!file) return;
    
    // Validasi ukuran file
    const maxSize = type === 'video' ? 20 * 1024 * 1024 : 5 * 1024 * 1024; // 20MB untuk video, 5MB untuk foto
    if (file.size > maxSize) {
        showCertificationToast(`File terlalu besar (max ${type === 'video' ? '20MB' : '5MB'})`, 'error');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const previewId = type + 'Preview';
        const previewElement = document.getElementById(previewId);
        const uploadArea = document.getElementById(type + 'UploadArea');
        
        if (type === 'video') {
            const videoPreview = document.getElementById('videoPreviewPlayer');
            videoPreview.src = e.target.result;
            previewElement.style.display = 'block';
        } else {
            const imgPreview = document.getElementById(type + 'PreviewImage');
            imgPreview.src = e.target.result;
            previewElement.style.display = 'block';
        }
        
        uploadArea.style.display = 'none';
        
        // Simpan file ke variable global
        if (type === 'before') beforeFile = file;
        if (type === 'after') afterFile = file;
        if (type === 'video') videoFile = file;
    };
    
    if (type === 'video') {
        reader.readAsDataURL(file);
    } else {
        reader.readAsDataURL(file);
    }
}

// [15] Remove preview
function removePreview(type) {
    const previewId = type + 'Preview';
    const uploadArea = document.getElementById(type + 'UploadArea');
    const fileInput = document.getElementById(type === 'video' ? 'processVideo' : type + 'Photo');
    
    document.getElementById(previewId).style.display = 'none';
    uploadArea.style.display = 'flex';
    fileInput.value = '';
    
    // Hapus file dari variable global
    if (type === 'before') beforeFile = null;
    if (type === 'after') afterFile = null;
    if (type === 'video') videoFile = null;
}

// [16] Open certification form
function openCertificationForm(menuId, menuName) {
    // Cek apakah sudah ada sertifikasi untuk menu ini
    const existingCert = certificationData?.find(item => 
        (item.menu_id == menuId || item.menu_nama === menuName) && item.status === 'approved');
    
    if (existingCert) {
        showCertificationToast('Anda sudah tersertifikasi untuk menu ini!', 'info');
        return;
    }
    
    // Cek apakah ada pending request untuk menu ini
    const pendingCert = certificationData?.find(item => 
        (item.menu_id == menuId || item.menu_nama === menuName) && item.status === 'pending');
    
    if (pendingCert) {
        showCertificationToast('Anda sudah mengajukan sertifikasi untuk menu ini, menunggu review!', 'warning');
        return;
    }
    
    // Set form values
    document.getElementById('certificationMenuId').value = menuId;
    document.getElementById('certificationMenuName').value = menuName;
    
    // Reset form
    document.getElementById('certificationNotes').value = '';
    document.getElementById('beforePhoto').value = '';
    document.getElementById('afterPhoto').value = '';
    document.getElementById('processVideo').value = '';
    
    // Reset previews
    document.getElementById('beforePreview').style.display = 'none';
    document.getElementById('afterPreview').style.display = 'none';
    document.getElementById('videoPreview').style.display = 'none';
    document.getElementById('beforeUploadArea').style.display = 'flex';
    document.getElementById('afterUploadArea').style.display = 'flex';
    document.getElementById('videoUploadArea').style.display = 'flex';
    
    // Clear file variables
    beforeFile = null;
    afterFile = null;
    videoFile = null;
    
    // Show modal
    document.getElementById('certificationFormModal').style.display = 'flex';
}

// [17] Submit certification request
async function submitCertificationRequest(e) {
    e.preventDefault();
    
    try {
        const menuId = document.getElementById('certificationMenuId').value;
        const menuName = document.getElementById('certificationMenuName').value;
        const notes = document.getElementById('certificationNotes').value.trim();
        
        // Validasi
        if (!notes) {
            showCertificationToast('Harap masukkan catatan tentang hasil pekerjaan', 'warning');
            return;
        }
        
        if (!beforeFile || !afterFile) {
            showCertificationToast('Harap upload foto before dan after', 'warning');
            return;
        }
        
        // Disable button dan show loading
        const submitBtn = document.getElementById('submitCertificationBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
        
        // Generate unique ID
        const certId = generateCertificationId();
        
        // Upload files ke Supabase Storage
        let beforeUrl = null;
        let afterUrl = null;
        let videoUrl = null;
        
        try {
            // Upload before photo
            const beforeFileName = `certifications/${certId}/before_${Date.now()}.jpg`;
            const { data: beforeData, error: beforeError } = await supabase.storage
                .from('media')
                .upload(beforeFileName, beforeFile);
            
            if (beforeError) {
                console.warn('Gagal upload before photo:', beforeError);
                // Lanjut tanpa foto
            } else {
                beforeUrl = supabase.storage.from('media').getPublicUrl(beforeFileName).data.publicUrl;
            }
            
            // Upload after photo
            const afterFileName = `certifications/${certId}/after_${Date.now()}.jpg`;
            const { data: afterData, error: afterError } = await supabase.storage
                .from('media')
                .upload(afterFileName, afterFile);
            
            if (afterError) {
                console.warn('Gagal upload after photo:', afterError);
                // Lanjut tanpa foto
            } else {
                afterUrl = supabase.storage.from('media').getPublicUrl(afterFileName).data.publicUrl;
            }
            
            // Upload video jika ada
            if (videoFile) {
                const videoFileName = `certifications/${certId}/video_${Date.now()}.mp4`;
                const { data: videoData, error: videoError } = await supabase.storage
                    .from('media')
                    .upload(videoFileName, videoFile);
                
                if (!videoError) {
                    videoUrl = supabase.storage.from('media').getPublicUrl(videoFileName).data.publicUrl;
                }
            }
            
        } catch (uploadError) {
            console.warn('Error uploading files, will continue without files:', uploadError);
        }
        
        // Cari menu untuk mendapatkan deskripsi
        let menuDeskripsi = '';
        const menu = certificationMenus.find(m => m.id == menuId || m.nama_menu === menuName);
        if (menu) {
            menuDeskripsi = menu.deskripsi || '';
        }
        
        // Simpan ke database
        const { data, error } = await supabase
            .from('sertifikasi')
            .insert([{
                id: certId,
                karyawan: currentKaryawanCertification.nama_karyawan,
                outlet: currentUserOutletCertification,
                menu_id: menuId,
                menu_nama: menuName,
                catatan: notes,
                foto_before: beforeUrl,
                foto_after: afterUrl,
                video_proses: videoUrl,
                status: 'pending',
                created_at: new Date().toISOString(),
                nomor_wa: currentKaryawanCertification.nomor_wa
            }]);
        
        if (error) {
            // Jika tabel tidak ada, coba buat dulu
            if (error.code === '42P01') {
                // Buat tabel sederhana
                try {
                    await supabase.rpc('exec_sql', {
                        query: `
                            CREATE TABLE IF NOT EXISTS sertifikasi (
                                id VARCHAR(50) PRIMARY KEY,
                                karyawan VARCHAR(100) NOT NULL,
                                outlet VARCHAR(100) NOT NULL,
                                menu_id INTEGER,
                                menu_nama VARCHAR(100) NOT NULL,
                                catatan TEXT,
                                foto_before TEXT,
                                foto_after TEXT,
                                video_proses TEXT,
                                status VARCHAR(20) DEFAULT 'pending',
                                review_notes TEXT,
                                approved_by VARCHAR(100),
                                approved_at TIMESTAMP,
                                nomor_wa VARCHAR(20),
                                created_at TIMESTAMP DEFAULT NOW()
                            );
                        `
                    }).catch(() => {
                        // Skip if can't create table
                    });
                    
                    // Coba insert lagi
                    await supabase
                        .from('sertifikasi')
                        .insert([{
                            id: certId,
                            karyawan: currentKaryawanCertification.nama_karyawan,
                            outlet: currentUserOutletCertification,
                            menu_id: menuId,
                            menu_nama: menuName,
                            catatan: notes,
                            foto_before: beforeUrl,
                            foto_after: afterUrl,
                            video_proses: videoUrl,
                            status: 'pending',
                            created_at: new Date().toISOString(),
                            nomor_wa: currentKaryawanCertification.nomor_wa
                        }]);
                } catch (createError) {
                    throw new Error('Gagal membuat tabel sertifikasi: ' + createError.message);
                }
            } else {
                throw error;
            }
        }
        
        // Success
        showCertificationToast('✅ Permohonan sertifikasi berhasil diajukan!', 'success');
        
        // Tutup modal
        closeCertificationFormModal();
        
        // Reload data
        await loadCertificationData();
        
    } catch (error) {
        console.error('Error submitting certification request:', error);
        showCertificationToast(`❌ Gagal mengajukan sertifikasi: ${error.message}`, 'error');
    } finally {
        // Reset button
        const submitBtn = document.getElementById('submitCertificationBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Ajukan Sertifikasi';
        }
    }
}

// [18] Fungsi untuk approve certification request
async function approveCertificationRequest(certId) {
    try {
        const reviewNotes = document.getElementById(`certReviewNotes_${certId}`)?.value || '';
        
        if (!reviewNotes.trim()) {
            showCertificationToast('Harap masukkan catatan review', 'warning');
            document.getElementById(`certReviewNotes_${certId}`).focus();
            return;
        }
        
        // Ambil data sertifikasi
        const { data: certData, error: fetchError } = await supabase
            .from('sertifikasi')
            .select('*')
            .eq('id', certId)
            .single();
        
        if (fetchError) throw fetchError;
        
        // Konfirmasi
        if (!confirm(`Approve sertifikasi untuk ${certData.karyawan}?\n\n` +
                   `Menu: ${certData.menu_nama}\n` +
                   `Status: Babeh Certified`)) {
            return;
        }
        
        // Update status sertifikasi
        const { error: updateError } = await supabase
            .from('sertifikasi')
            .update({
                status: 'approved',
                approved_at: new Date().toISOString(),
                approved_by: currentKaryawanCertification.nama_karyawan,
                review_notes: reviewNotes
            })
            .eq('id', certId);
        
        if (updateError) throw updateError;
        
        // Kirim notifikasi WhatsApp
        await sendCertificationWhatsAppNotification(certData, 'approved', reviewNotes);
        
        showCertificationToast('✅ Sertifikasi berhasil disetujui! Status: Babeh Certified', 'success');
        
        // Reload data
        await loadCertificationData();
        
    } catch (error) {
        console.error('Error approving certification:', error);
        showCertificationToast(`❌ Gagal approve sertifikasi: ${error.message}`, 'error');
    }
}

// [19] Fungsi untuk reject certification request
async function rejectCertificationRequest(certId) {
    try {
        const reviewNotes = document.getElementById(`certReviewNotes_${certId}`)?.value || '';
        
        if (!reviewNotes.trim()) {
            showCertificationToast('Harap masukkan alasan penolakan', 'warning');
            document.getElementById(`certReviewNotes_${certId}`).focus();
            return;
        }
        
        // Ambil data sertifikasi
        const { data: certData, error: fetchError } = await supabase
            .from('sertifikasi')
            .select('*')
            .eq('id', certId)
            .single();
        
        if (fetchError) throw fetchError;
        
        // Konfirmasi
        if (!confirm(`Tolak sertifikasi untuk ${certData.karyawan}?\n\n` +
                   `Menu: ${certData.menu_nama}\n` +
                   `Alasan penolakan: ${reviewNotes}`)) {
            return;
        }
        
        // Update status sertifikasi
        const { error: updateError } = await supabase
            .from('sertifikasi')
            .update({
                status: 'rejected',
                approved_at: new Date().toISOString(),
                approved_by: currentKaryawanCertification.nama_karyawan,
                review_notes: reviewNotes
            })
            .eq('id', certId);
        
        if (updateError) throw updateError;
        
        // Kirim notifikasi WhatsApp
        await sendCertificationWhatsAppNotification(certData, 'rejected', reviewNotes);
        
        showCertificationToast('❌ Sertifikasi berhasil ditolak!', 'success');
        
        // Reload data
        await loadCertificationData();
        
    } catch (error) {
        console.error('Error rejecting certification:', error);
        showCertificationToast(`❌ Gagal reject sertifikasi: ${error.message}`, 'error');
    }
}

// [20] Kirim notifikasi WhatsApp untuk sertifikasi
async function sendCertificationWhatsAppNotification(certData, action, reviewNotes = '') {
    try {
        const WA_API_URL = 'https://waha-yetv8qi4e3zk.anakit.sumopod.my.id/api/sendText';
        const WA_API_KEY = 'sfcoGbpdLDkGZhKw2rx8sbb14vf4d8V6';
        
        // Format nomor WhatsApp
        let chatId = certData.nomor_wa;
        if (chatId) {
            // Pastikan format 62xxxxxxxxxx@c.us
            chatId = chatId.replace(/^0/, '62').replace(/^\+62/, '62');
            if (!chatId.includes('@c.us')) {
                chatId += '@c.us';
            }
        } else {
            console.warn('Nomor WA tidak tersedia untuk', certData.karyawan);
            return;
        }
        
        let message = '';
        if (action === 'approved') {
            message = `🎉 *SERTIFIKASI DISETUJUI - Babeh Certified!*\n\n` +
                     `👋 Halo ${certData.karyawan},\n\n` +
                     `🎯 Selamat! Sertifikasi Anda untuk:\n` +
                     `✂️ *${certData.menu_nama}*\n\n` +
                     `✅ Telah *DISETUJUI* dan Anda sekarang **Babeh Certified**!\n\n` +
                     `${reviewNotes ? `💭 *Catatan dari Owner*: ${reviewNotes}\n\n` : ''}` +
                     `👤 *Disetujui oleh*: ${currentKaryawanCertification.nama_karyawan}\n` +
                     `⏰ *Waktu*: ${formatDateToDisplay(new Date())} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}\n\n` +
                     `🎊 *Selamat atas pencapaian ini!*`;
        } else {
            message = `❌ *SERTIFIKASI DITOLAK*\n\n` +
                     `👋 Halo ${certData.karyawan},\n\n` +
                     `⚠️ Maaf, sertifikasi Anda untuk:\n` +
                     `✂️ *${certData.menu_nama}*\n\n` +
                     `Telah *DITOLAK*. Status: **Belum Tersertifikasi**\n\n` +
                     `📌 *Alasan Penolakan*:\n${reviewNotes}\n\n` +
                     `💡 *Saran*: Silakan perbaiki dan ajukan kembali\n\n` +
                     `👤 *Ditolak oleh*: ${currentKaryawanCertification.nama_karyawan}\n` +
                     `⏰ *Waktu*: ${formatDateToDisplay(new Date())} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        // Kirim via API
        const response = await fetch(WA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': WA_API_KEY
            },
            body: JSON.stringify({
                session: 'Session1',
                chatId: chatId,
                text: message
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        console.log(`📱 WhatsApp certification notification sent to ${certData.karyawan}`);
        
    } catch (error) {
        console.error('Error sending WhatsApp notification:', error);
    }
}

// [21] Modal functions
function closeCertificationFormModal() {
    document.getElementById('certificationFormModal').style.display = 'none';
}

function showCertificationDetail(certId) {
    // Cari data sertifikasi
    let certData;
    
    if (currentKaryawanCertification?.role === 'barberman') {
        certData = certificationData.find(c => c.id === certId);
    } else {
        // Untuk owner, cari di semua data
        certData = [...certificationData].find(c => c.id === certId);
    }
    
    if (!certData) {
        showCertificationToast('Data sertifikasi tidak ditemukan', 'error');
        return;
    }
    
    const modal = document.getElementById('certificationDetailModal');
    const content = document.getElementById('certificationDetailContent');
    
    const createdDate = new Date(certData.created_at);
    const approveDate = certData.approved_at ? new Date(certData.approved_at) : null;
    
    // Status styling
    let statusClass = '';
    let statusText = '';
    if (certData.status === 'approved') {
        statusClass = 'background: #d1fae5; color: #065f46;';
        statusText = 'Babeh Certified';
    } else if (certData.status === 'rejected') {
        statusClass = 'background: #fee2e2; color: #dc2626;';
        statusText = 'Ditolak';
    } else if (certData.status === 'pending') {
        statusClass = 'background: #fef3c7; color: #92400e;';
        statusText = 'Menunggu';
    } else {
        statusClass = 'background: #f3f4f6; color: #6b7280;';
        statusText = certData.status;
    }
    
    content.innerHTML = `
        <div style="max-width: 600px;">
            <div style="margin-bottom: 24px;">
                <h4 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #374151;">
                    <i class="fas fa-info-circle" style="margin-right: 10px; color: #667eea;"></i>Informasi Sertifikasi
                </h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                    <div>
                        <label style="display: block; margin-bottom: 4px; font-size: 14px; color: #6b7280;">Karyawan:</label>
                        <span style="font-weight: 500; color: #374151;">${certData.karyawan}</span>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 4px; font-size: 14px; color: #6b7280;">Outlet:</label>
                        <span style="color: #374151;">${certData.outlet}</span>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 4px; font-size: 14px; color: #6b7280;">Menu:</label>
                        <span style="font-weight: 500; color: #374151;">${certData.menu_nama}</span>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 4px; font-size: 14px; color: #6b7280;">Status:</label>
                        <span style="
                            ${statusClass}
                            padding: 4px 12px;
                            border-radius: 20px;
                            font-size: 12px;
                            font-weight: 500;
                            display: inline-block;
                        ">${statusText}</span>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 4px; font-size: 14px; color: #6b7280;">Diajukan Pada:</label>
                        <span style="color: #374151;">${formatDateToDisplay(createdDate)} ${createdDate.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    ${approveDate ? `
                    <div>
                        <label style="display: block; margin-bottom: 4px; font-size: 14px; color: #6b7280;">Disetujui Pada:</label>
                        <span style="color: #374151;">${formatDateToDisplay(approveDate)} ${approveDate.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 4px; font-size: 14px; color: #6b7280;">Disetujui Oleh:</label>
                        <span style="color: #374151;">${certData.approved_by}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div style="margin-bottom: 24px;">
                <h4 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #374151;">
                    <i class="fas fa-sticky-note" style="margin-right: 10px; color: #667eea;"></i>Catatan Karyawan
                </h4>
                <div style="
                    background: #f9fafb;
                    padding: 16px;
                    border-radius: 8px;
                    color: #374151;
                    font-size: 14px;
                ">${certData.catatan || 'Tidak ada catatan'}</div>
            </div>
            
            ${certData.review_notes ? `
            <div style="margin-bottom: 24px;">
                <h4 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #374151;">
                    <i class="fas fa-edit" style="margin-right: 10px; color: #667eea;"></i>Catatan Review
                </h4>
                <div style="
                    background: #f9fafb;
                    padding: 16px;
                    border-radius: 8px;
                    color: #374151;
                    font-size: 14px;
                ">${certData.review_notes}</div>
            </div>
            ` : ''}
            
            ${certData.foto_before || certData.foto_after || certData.video_proses ? `
            <div>
                <h4 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #374151;">
                    <i class="fas fa-images" style="margin-right: 10px; color: #667eea;"></i>Media
                </h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                    ${certData.foto_before ? `
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-size: 14px; color: #6b7280;">Foto Before:</label>
                        <img src="${certData.foto_before}" alt="Before" style="width: 100%; border-radius: 8px; margin-bottom: 8px;">
                        <a href="${certData.foto_before}" target="_blank" style="
                            display: block;
                            text-align: center;
                            background: #f3f4f6;
                            color: #374151;
                            padding: 8px;
                            border-radius: 6px;
                            text-decoration: none;
                            font-size: 14px;
                            transition: background 0.3s;
                        ">Lihat Full</a>
                    </div>
                    ` : ''}
                    
                    ${certData.foto_after ? `
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-size: 14px; color: #6b7280;">Foto After:</label>
                        <img src="${certData.foto_after}" alt="After" style="width: 100%; border-radius: 8px; margin-bottom: 8px;">
                        <a href="${certData.foto_after}" target="_blank" style="
                            display: block;
                            text-align: center;
                            background: #f3f4f6;
                            color: #374151;
                            padding: 8px;
                            border-radius: 6px;
                            text-decoration: none;
                            font-size: 14px;
                            transition: background 0.3s;
                        ">Lihat Full</a>
                    </div>
                    ` : ''}
                    
                    ${certData.video_proses ? `
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-size: 14px; color: #6b7280;">Video Proses:</label>
                        <video controls style="width: 100%; border-radius: 8px; margin-bottom: 8px;">
                            <source src="${certData.video_proses}" type="video/mp4">
                        </video>
                        <a href="${certData.video_proses}" target="_blank" style="
                            display: block;
                            text-align: center;
                            background: #f3f4f6;
                            color: #374151;
                            padding: 8px;
                            border-radius: 6px;
                            text-decoration: none;
                            font-size: 14px;
                            transition: background 0.3s;
                        ">Buka di Tab Baru</a>
                    </div>
                    ` : ''}
                </div>
            </div>
            ` : ''}
        </div>
    `;
    
    modal.style.display = 'flex';
}

function closeCertificationDetailModal() {
    document.getElementById('certificationDetailModal').style.display = 'none';
}

function closeCertificationReviewModal() {
    document.getElementById('certificationReviewModal').style.display = 'none';
}

function closeMenuModal() {
    document.getElementById('menuModal').style.display = 'none';
}

// [22] Menu management functions
function showAddMenuModal() {
    document.getElementById('menuId').value = '';
    document.getElementById('menuName').value = '';
    document.getElementById('menuDescription').value = '';
    document.getElementById('menuCategory').value = 'hair';
    document.getElementById('menuModal').style.display = 'flex';
}

async function editMenu(menuId) {
    const menu = certificationMenus.find(m => m.id == menuId);
    if (!menu) return;
    
    document.getElementById('menuId').value = menu.id;
    document.getElementById('menuName').value = menu.nama_menu;
    document.getElementById('menuDescription').value = menu.deskripsi || '';
    document.getElementById('menuCategory').value = menu.kategori || 'hair';
    
    document.getElementById('menuModal').style.display = 'flex';
}

async function deleteMenu(menuId) {
    if (!confirm('Hapus menu sertifikasi ini?')) return;
    
    try {
        // Hapus dari database
        const { error } = await supabase
            .from('sertifikasi_menu')
            .delete()
            .eq('id', menuId);
        
        if (error) throw error;
        
        // Hapus dari array lokal
        certificationMenus = certificationMenus.filter(m => m.id != menuId);
        
        // Refresh display
        displayCertificationMenusForBarberman();
        displayCertificationMenusForOwner();
        
        showCertificationToast('✅ Menu berhasil dihapus', 'success');
        
    } catch (error) {
        console.error('Error deleting menu:', error);
        showCertificationToast('❌ Gagal menghapus menu', 'error');
    }
}

// [23] Handle menu form submission
async function handleMenuFormSubmit(e) {
    e.preventDefault();
    
    try {
        const menuId = document.getElementById('menuId').value;
        const menuName = document.getElementById('menuName').value.trim();
        const menuDescription = document.getElementById('menuDescription').value.trim();
        const menuCategory = document.getElementById('menuCategory').value;
        
        if (!menuName) {
            showCertificationToast('Harap masukkan nama menu', 'warning');
            return;
        }
        
        const submitBtn = document.getElementById('submitMenuBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        
        let result;
        
        if (menuId) {
            // Update existing menu
            result = await supabase
                .from('sertifikasi_menu')
                .update({
                    nama_menu: menuName,
                    kategori: menuCategory,
                    deskripsi: menuDescription
                })
                .eq('id', menuId);
        } else {
            // Insert new menu
            result = await supabase
                .from('sertifikasi_menu')
                .insert([{
                    nama_menu: menuName,
                    kategori: menuCategory,
                    deskripsi: menuDescription
                }]);
        }
        
        const { error } = result;
        
        if (error) {
            // Jika tabel tidak ada, coba buat dulu
            if (error.code === '42P01') {
                try {
                    await supabase.rpc('exec_sql', {
                        query: `
                            CREATE TABLE IF NOT EXISTS sertifikasi_menu (
                                id SERIAL PRIMARY KEY,
                                nama_menu VARCHAR(100) UNIQUE NOT NULL,
                                kategori VARCHAR(50) DEFAULT 'hair',
                                deskripsi TEXT,
                                created_at TIMESTAMP DEFAULT NOW()
                            );
                        `
                    });
                    
                    // Coba insert lagi
                    await supabase
                        .from('sertifikasi_menu')
                        .insert([{
                            nama_menu: menuName,
                            kategori: menuCategory,
                            deskripsi: menuDescription
                        }]);
                } catch (createError) {
                    throw createError;
                }
            } else {
                throw error;
            }
        }
        
        showCertificationToast(`✅ Menu ${menuId ? 'berhasil diupdate' : 'berhasil ditambahkan'}`, 'success');
        
        // Tutup modal
        closeMenuModal();
        
        // Reload data
        await loadCertificationMenus();
        
    } catch (error) {
        console.error('Error saving menu:', error);
        showCertificationToast(`❌ Gagal menyimpan menu: ${error.message}`, 'error');
    } finally {
        const submitBtn = document.getElementById('submitMenuBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Menu';
        }
    }
}

// [24] Cancel certification request
async function cancelCertificationRequest(certId) {
    if (!confirm('Batalkan permohonan sertifikasi ini?')) return;
    
    try {
        const { error } = await supabase
            .from('sertifikasi')
            .update({ 
                status: 'cancelled',
                approved_at: new Date().toISOString()
            })
            .eq('id', certId);
        
        if (error) throw error;
        
        showCertificationToast('✅ Permohonan sertifikasi dibatalkan', 'success');
        await loadCertificationData();
        
    } catch (error) {
        console.error('Error cancelling certification:', error);
        showCertificationToast('❌ Gagal membatalkan sertifikasi', 'error');
    }
}

// [25] Helper functions
function getMenuIcon(category) {
    switch(category) {
        case 'hair': return 'fas fa-cut';
        case 'face': return 'fas fa-smile';
        case 'massage': return 'fas fa-hand-holding-heart';
        case 'shaving': return 'fas fa-razor';
        case 'coloring': return 'fas fa-palette';
        default: return 'fas fa-spa';
    }
}

function getCategoryName(category) {
    switch(category) {
        case 'hair': return 'Hair Treatment';
        case 'face': return 'Face Treatment';
        case 'massage': return 'Massage';
        case 'shaving': return 'Shaving';
        case 'coloring': return 'Coloring';
        default: return 'Lainnya';
    }
}

function formatDateToDisplay(date) {
    // Format: dd/MM/yyyy untuk display UI
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function generateCertificationId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `CERT-${timestamp}-${random}`.toUpperCase();
}

function viewMedia(url, type) {
    window.open(url, '_blank');
}

async function sendCertificationCongrats(certId) {
    // Implementasi kirim selamat via WhatsApp
    try {
        const { data: certData, error } = await supabase
            .from('sertifikasi')
            .select('*')
            .eq('id', certId)
            .single();
        
        if (error) throw error;
        
        const WA_API_URL = 'https://waha-yetv8qi4e3zk.anakit.sumopod.my.id/api/sendText';
        const WA_API_KEY = 'sfcoGbpdLDkGZhKw2rx8sbb14vf4d8V6';
        
        let chatId = certData.nomor_wa;
        if (chatId) {
            chatId = chatId.replace(/^0/, '62').replace(/^\+62/, '62');
            if (!chatId.includes('@c.us')) {
                chatId += '@c.us';
            }
        } else {
            showCertificationToast('Nomor WhatsApp tidak tersedia', 'warning');
            return;
        }
        
        const message = `🎉 *SELAMAT!*\n\n` +
                       `Halo ${certData.karyawan},\n\n` +
                       `Selamat atas sertifikasi **Babeh Certified** untuk:\n` +
                       `✂️ *${certData.menu_nama}*\n\n` +
                       `Kami bangga dengan pencapaian Anda!\n\n` +
                       `Terus tingkatkan skill dan memberikan pelayanan terbaik untuk pelanggan.\n\n` +
                       `Salam,\nTim Management`;
        
        const response = await fetch(WA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': WA_API_KEY
            },
            body: JSON.stringify({
                session: 'Session1',
                chatId: chatId,
                text: message
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        showCertificationToast('✅ Pesan selamat berhasil dikirim via WhatsApp', 'success');
        
    } catch (error) {
        console.error('Error sending congrats:', error);
        showCertificationToast('❌ Gagal mengirim pesan selamat', 'error');
    }
}

function showCertificationToast(message, type = 'info') {
    // Hapus toast sebelumnya jika ada
    const existingToast = document.getElementById('certificationToast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Warna berdasarkan type
    let backgroundColor = '#667eea'; // default info
    let icon = 'fa-info-circle';
    
    switch(type) {
        case 'success':
            backgroundColor = '#10b981';
            icon = 'fa-check-circle';
            break;
        case 'error':
            backgroundColor = '#ef4444';
            icon = 'fa-exclamation-circle';
            break;
        case 'warning':
            backgroundColor = '#f59e0b';
            icon = 'fa-exclamation-triangle';
            break;
    }
    
    // Buat toast element dengan inline styling
    const toast = document.createElement('div');
    toast.id = 'certificationToast';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${backgroundColor};
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-width: 300px;
        max-width: 400px;
        z-index: 1002;
        animation: toastSlideIn 0.3s ease-out;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
            <i class="fas ${icon}" style="font-size: 20px;"></i>
            <span style="flex: 1;">${message}</span>
        </div>
        <button onclick="this.parentElement.remove()" style="
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.3s;
        ">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Tambahkan keyframes untuk animasi
    const style = document.createElement('style');
    style.textContent = `
        @keyframes toastSlideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Tambahkan ke body
    document.body.appendChild(toast);
    
    // Auto remove setelah 5 detik
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';
            
            // Tambahkan keyframes untuk animasi keluar
            const styleOut = document.createElement('style');
            styleOut.textContent = `
                @keyframes toastSlideOut {
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
            document.head.appendChild(styleOut);
            
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
                if (style.parentElement) style.remove();
                if (styleOut.parentElement) styleOut.remove();
            }, 300);
        }
    }, 5000);
}

// [26] Global functions untuk window object
window.openCertificationForm = openCertificationForm;
window.closeCertificationFormModal = closeCertificationFormModal;
window.removePreview = removePreview;
window.showCertificationDetail = showCertificationDetail;
window.closeCertificationDetailModal = closeCertificationDetailModal;
window.cancelCertificationRequest = cancelCertificationRequest;
window.approveCertificationRequest = approveCertificationRequest;
window.rejectCertificationRequest = rejectCertificationRequest;
window.loadCertificationData = loadCertificationData;
window.showAddMenuModal = showAddMenuModal;
window.closeMenuModal = closeMenuModal;
window.editMenu = editMenu;
window.deleteMenu = deleteMenu;
window.viewMedia = viewMedia;
window.sendCertificationCongrats = sendCertificationCongrats;

// ========== END OF FILE ==========
