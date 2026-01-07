// ========== MODULE TOP (Tools Ownership Program) ==========
// ========================================================

// Konfigurasi
const TOP_CONFIG = {
    SUBSIDI_PERCENT: 0.25,      // 25%
    MAX_HARGA: 500000,          // Rp 500.000
    MIN_PERIODE: 1,
    MAX_PERIODE: 24
};

// Variabel global
let currentKaryawanTOP = null;
let currentUserOutletTOP = null;
let isOwnerTOP = false;
let isKasirTOP = false;
let isBarbermanTOP = false;
let selectedPhotoFile = null;
let topBatchId = null;

// [1] Fungsi utama - tampilkan halaman TOP
async function showTOPPage() {
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
        
        currentKaryawanTOP = {
            nama_karyawan: namaKaryawan,
            role: karyawanData.role,
            outlet: karyawanData.outlet,
            posisi: karyawanData.posisi
        };
        
        currentUserOutletTOP = karyawanData.outlet;
        isOwnerTOP = karyawanData.role === 'owner';
        isKasirTOP = karyawanData.role === 'kasir';
        isBarbermanTOP = karyawanData.role === 'barberman';
        
        // Sembunyikan main app, tampilkan halaman TOP
        document.getElementById('appScreen').style.display = 'none';
        
        // Buat container halaman TOP
        createTOPPage();
        
        // Generate batch ID untuk pengajuan baru
        topBatchId = generateBatchId();
        
        // Load data berdasarkan role
        if (isOwnerTOP) {
            await loadTOPForOwner();
        } else if (isKasirTOP) {
            await loadTOPForKasir();
        } else {
            await loadMyTOPRiwayat();
        }
        
    } catch (error) {
        console.error('Error in showTOPPage:', error);
        alert('Gagal memuat halaman TOP!');
    }
}

// [2] Buat halaman TOP dengan inline styling
function createTOPPage() {
    // Hapus halaman sebelumnya
    const existingPage = document.getElementById('topPage');
    if (existingPage) existingPage.remove();
    
    // Buat container
    const topPage = document.createElement('div');
    topPage.id = 'topPage';
    topPage.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        overflow-y: auto;
        z-index: 1000;
    `;
    
    // Tentukan konten berdasarkan role
    const content = isBarbermanTOP ? createBarbermanTOPContent() :
                     isOwnerTOP ? createOwnerTOPContent() :
                     createKasirTOPContent();
    
    topPage.innerHTML = `
        <!-- Header dengan inline styling -->
        <header style="
            background: rgba(255, 255, 255, 0.95);
            padding: 15px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            z-index: 100;
        ">
            <button class="back-btn" id="backToMainFromTOP" style="
                background: #667eea;
                color: white;
                border: none;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 1.2rem;
                transition: all 0.3s;
            ">
                <i class="fas fa-arrow-left"></i>
            </button>
            
            <h2 style="
                margin: 0;
                color: #333;
                font-size: 1.4rem;
                display: flex;
                align-items: center;
                gap: 10px;
            ">
                <i class="fas fa-tools" style="color: #FF9800;"></i>
                Tools Ownership Program (TOP)
            </h2>
            
            <div class="header-actions">
                <button class="refresh-btn" id="refreshTOP" title="Refresh" style="
                    background: #4CAF50;
                    color: white;
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 1.2rem;
                    transition: all 0.3s;
                ">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
        </header>
        
        <!-- Info Header -->
        <div style="
            background: rgba(255, 255, 255, 0.9);
            margin: 15px;
            border-radius: 10px;
            padding: 15px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        ">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                    <i class="fas fa-calendar-day" style="color: #667eea; width: 20px;"></i>
                    <span id="currentDateTOP">${formatDateDisplay(new Date())}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                    <i class="fas fa-user" style="color: #667eea; width: 20px;"></i>
                    <span id="userNameTOP">${currentKaryawanTOP?.nama_karyawan || '-'}</span>
                </div>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                    <i class="fas fa-briefcase" style="color: #667eea; width: 20px;"></i>
                    <span id="userPositionTOP">${currentKaryawanTOP?.posisi || '-'}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                    <i class="fas fa-store" style="color: #667eea; width: 20px;"></i>
                    <span id="userOutletTOP">${currentUserOutletTOP || '-'}</span>
                </div>
            </div>
        </div>
        
        <!-- Konten -->
        ${content}
        
        <!-- Footer -->
        <div style="
            background: rgba(255, 255, 255, 0.9);
            margin: 15px;
            border-radius: 10px;
            padding: 15px;
            text-align: center;
            color: #666;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        ">
            <p style="margin: 0;">
                <i class="fas fa-info-circle" style="color: #667eea; margin-right: 8px;"></i>
                ${getTOPFooterMessage()}
            </p>
        </div>
        
        <!-- Modal Preview Foto -->
        <div id="photoPreviewModal" style="
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1100;
            align-items: center;
            justify-content: center;
        ">
            <div style="
                background: white;
                border-radius: 10px;
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                overflow: auto;
                animation: modalSlideIn 0.3s ease;
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    border-bottom: 1px solid #f0f0f0;
                ">
                    <h3 style="margin: 0; color: #333;">Preview Foto Alat</h3>
                    <button class="modal-close" style="
                        background: none;
                        border: none;
                        font-size: 1.5rem;
                        cursor: pointer;
                        color: #999;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">&times;</button>
                </div>
                <div style="padding: 20px;">
                    <img id="previewImage" src="" alt="Preview Foto" style="
                        width: 100%;
                        max-height: 400px;
                        object-fit: contain;
                    ">
                    <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                        <button id="changePhotoBtn" class="btn-secondary" style="
                            padding: 10px 20px;
                            background: #f0f0f0;
                            color: #666;
                            border: none;
                            border-radius: 6px;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <i class="fas fa-sync"></i> Ganti Foto
                        </button>
                        <button id="usePhotoBtn" class="btn-primary" style="
                            padding: 10px 20px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            border: none;
                            border-radius: 6px;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <i class="fas fa-check"></i> Gunakan Foto Ini
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modal Pembayaran -->
        <div id="paymentModal" style="
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1100;
            align-items: center;
            justify-content: center;
        ">
            <div style="
                background: white;
                border-radius: 10px;
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                overflow: auto;
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    border-bottom: 1px solid #f0f0f0;
                ">
                    <h3 style="margin: 0; color: #333;">Pembayaran Cicilan</h3>
                    <button class="modal-close" style="
                        background: none;
                        border: none;
                        font-size: 1.5rem;
                        cursor: pointer;
                        color: #999;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">&times;</button>
                </div>
                <div style="padding: 20px;">
                    <div id="paymentInfo"></div>
                    <form id="paymentForm">
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label for="cicilanKe" style="
                                display: block;
                                margin-bottom: 8px;
                                font-weight: 600;
                                color: #444;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                            ">
                                <i class="fas fa-list-ol" style="color: #667eea;"></i>
                                Bayar Cicilan ke-
                            </label>
                            <input type="number" id="cicilanKe" min="1" required style="
                                width: 100%;
                                padding: 12px 15px;
                                border: 2px solid #e0e0e0;
                                border-radius: 6px;
                                font-size: 14px;
                            ">
                            <small style="display: block; margin-top: 5px; color: #666;">Masukkan cicilan yang akan dibayar</small>
                        </div>
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label for="jumlahCicilan" style="
                                display: block;
                                margin-bottom: 8px;
                                font-weight: 600;
                                color: #444;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                            ">
                                <i class="fas fa-money-bill-wave" style="color: #667eea;"></i>
                                Jumlah Cicilan yang Dibayar
                            </label>
                            <input type="number" id="jumlahCicilan" min="1" required style="
                                width: 100%;
                                padding: 12px 15px;
                                border: 2px solid #e0e0e0;
                                border-radius: 6px;
                                font-size: 14px;
                            ">
                            <small style="display: block; margin-top: 5px; color: #666;">Bisa bayar lebih dari 1 cicilan sekaligus</small>
                        </div>
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label for="jumlahBayar" style="
                                display: block;
                                margin-bottom: 8px;
                                font-weight: 600;
                                color: #444;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                            ">
                                <i class="fas fa-calculator" style="color: #667eea;"></i>
                                Total Bayar
                            </label>
                            <input type="text" id="jumlahBayar" readonly style="
                                width: 100%;
                                padding: 12px 15px;
                                border: 2px solid #e0e0e0;
                                border-radius: 6px;
                                font-size: 14px;
                                background: #f9f9f9;
                            ">
                        </div>
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label for="metodeBayar" style="
                                display: block;
                                margin-bottom: 8px;
                                font-weight: 600;
                                color: #444;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                            ">
                                <i class="fas fa-wallet" style="color: #667eea;"></i>
                                Metode Pembayaran
                            </label>
                            <select id="metodeBayar" style="
                                width: 100%;
                                padding: 12px 15px;
                                border: 2px solid #e0e0e0;
                                border-radius: 6px;
                                font-size: 14px;
                            ">
                                <option value="cash">Cash</option>
                                <option value="transfer">Transfer</option>
                            </select>
                        </div>
                        <div style="display: flex; gap: 15px; justify-content: flex-end; margin-top: 20px;">
                            <button type="button" class="btn-secondary modal-close" style="
                                padding: 12px 24px;
                                background: #f0f0f0;
                                color: #666;
                                border: none;
                                border-radius: 6px;
                                font-weight: 600;
                                cursor: pointer;
                            ">Batal</button>
                            <button type="submit" class="btn-primary" style="
                                padding: 12px 24px;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                                border: none;
                                border-radius: 6px;
                                font-weight: 600;
                                cursor: pointer;
                            ">Proses Pembayaran</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        
        <style>
            @keyframes modalSlideIn {
                from { opacity: 0; transform: translateY(-50px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .top-section-container {
                margin: 15px;
            }
            
            .btn-primary:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
            }
            
            .btn-secondary:hover {
                background: #e0e0e0;
            }
            
            .status-pill {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.85rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .status-pending {
                background: #fff3cd;
                color: #856404;
                border: 1px solid #ffeaa7;
            }
            
            .status-approved {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }
            
            .status-rejected {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
            
            .status-inprogress {
                background: #cce5ff;
                color: #004085;
                border: 1px solid #b8daff;
            }
            
            .status-lunas {
                background: #d1ecf1;
                color: #0c5460;
                border: 1px solid #bee5eb;
            }
            
            .progress-bar-container {
                height: 20px;
                background: #e0e0e0;
                border-radius: 10px;
                margin: 10px 0;
                position: relative;
                overflow: hidden;
            }
            
            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #4CAF50, #8BC34A);
                border-radius: 10px;
                transition: width 0.5s ease;
            }
            
            .progress-text {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #333;
                font-weight: 600;
                font-size: 0.85rem;
            }
            
            @media (max-width: 768px) {
                .form-row, .calculation-grid, .info-grid {
                    grid-template-columns: 1fr !important;
                }
            }
        </style>
    `;
    
    document.body.appendChild(topPage);
    setupTOPEvents();
}

// [3] Buat konten untuk Barberman dengan inline styling
function createBarbermanTOPContent() {
    return `
        <div class="top-section-container">
            <!-- Form Pengajuan -->
            <div style="
                background: white;
                margin-bottom: 20px;
                border-radius: 10px;
                padding: 20px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #f0f0f0;
                ">
                    <h3 style="margin: 0; color: #333; font-size: 1.2rem; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-plus-circle" style="color: #FF9800;"></i>
                        Pengajuan Alat Baru
                    </h3>
                </div>
                <div>
                    <form id="topForm">
                        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                            <div style="flex: 1;">
                                <label for="namaAlat" style="
                                    display: block;
                                    margin-bottom: 8px;
                                    font-weight: 600;
                                    color: #444;
                                    display: flex;
                                    align-items: center;
                                    gap: 8px;
                                ">
                                    <i class="fas fa-toolbox" style="color: #667eea;"></i>
                                    Nama Alat
                                </label>
                                <input type="text" id="namaAlat" placeholder="Contoh: Hair Clipper Philips" required style="
                                    width: 100%;
                                    padding: 12px 15px;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 6px;
                                    font-size: 14px;
                                ">
                            </div>
                            <div style="flex: 1;">
                                <label for="hargaAlat" style="
                                    display: block;
                                    margin-bottom: 8px;
                                    font-weight: 600;
                                    color: #444;
                                    display: flex;
                                    align-items: center;
                                    gap: 8px;
                                ">
                                    <i class="fas fa-tag" style="color: #667eea;"></i>
                                    Harga Alat (Maks Rp ${TOP_CONFIG.MAX_HARGA.toLocaleString('id-ID')})
                                </label>
                                <input type="number" id="hargaAlat" min="1000" max="${TOP_CONFIG.MAX_HARGA}" step="500" placeholder="Contoh: 350000" required style="
                                    width: 100%;
                                    padding: 12px 15px;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 6px;
                                    font-size: 14px;
                                ">
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                            <div style="flex: 1;">
                                <label for="periodeCicilan" style="
                                    display: block;
                                    margin-bottom: 8px;
                                    font-weight: 600;
                                    color: #444;
                                    display: flex;
                                    align-items: center;
                                    gap: 8px;
                                ">
                                    <i class="fas fa-calendar-alt" style="color: #667eea;"></i>
                                    Periode Cicilan (1-24)
                                </label>
                                <select id="periodeCicilan" required style="
                                    width: 100%;
                                    padding: 12px 15px;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 6px;
                                    font-size: 14px;
                                ">
                                    <option value="">Pilih periode...</option>
                                    ${Array.from({length: TOP_CONFIG.MAX_PERIODE}, (_, i) => 
                                        `<option value="${i+1}">${i+1} bulan</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div style="flex: 1;">
                                <label for="fotoAlat" style="
                                    display: block;
                                    margin-bottom: 8px;
                                    font-weight: 600;
                                    color: #444;
                                    display: flex;
                                    align-items: center;
                                    gap: 8px;
                                ">
                                    <i class="fas fa-camera" style="color: #667eea;"></i>
                                    Foto Alat
                                </label>
                                <div id="uploadArea" style="
                                    border: 2px dashed #667eea;
                                    border-radius: 8px;
                                    padding: 30px;
                                    text-align: center;
                                    cursor: pointer;
                                    transition: all 0.3s;
                                    background: rgba(102, 126, 234, 0.05);
                                ">
                                    <i class="fas fa-cloud-upload-alt" style="font-size: 2.5rem; color: #667eea; margin-bottom: 10px;"></i>
                                    <p style="margin: 5px 0; color: #666;">Klik untuk upload foto alat</p>
                                    <p style="font-size: 0.9rem; color: #999;">Format: JPG, PNG (Maks 5MB)</p>
                                    <input type="file" id="fotoAlat" accept="image/*" hidden>
                                </div>
                                <div id="photoPreview" style="
                                    position: relative;
                                    margin-top: 10px;
                                    display: none;
                                ">
                                    <img id="previewThumbnail" src="" alt="Preview" style="
                                        width: 100%;
                                        max-height: 200px;
                                        object-fit: contain;
                                        border-radius: 6px;
                                        border: 2px solid #e0e0e0;
                                    ">
                                    <button type="button" id="removePhotoBtn" style="
                                        position: absolute;
                                        top: -10px;
                                        right: -10px;
                                        background: #ff4757;
                                        color: white;
                                        border: none;
                                        border-radius: 50%;
                                        width: 30px;
                                        height: 30px;
                                        cursor: pointer;
                                        font-size: 14px;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                    ">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Auto Calculation -->
                        <div style="
                            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                            border-radius: 8px;
                            padding: 20px;
                            margin: 20px 0;
                        ">
                            <h4 style="margin: 0 0 15px 0; color: #333; display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-calculator" style="color: #667eea;"></i>
                                Perhitungan Cicilan
                            </h4>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                                <div style="
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    padding: 12px;
                                    background: white;
                                    border-radius: 6px;
                                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                                ">
                                    <span style="color: #666; font-weight: 500;">Harga Alat:</span>
                                    <span id="calcHarga" style="font-weight: 600; color: #333;">Rp 0</span>
                                </div>
                                <div style="
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    padding: 12px;
                                    background: white;
                                    border-radius: 6px;
                                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                                ">
                                    <span style="color: #666; font-weight: 500;">Subsidi (25%):</span>
                                    <span id="calcSubsidi" style="font-weight: 600; color: #333;">Rp 0</span>
                                </div>
                                <div style="
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    padding: 12px;
                                    background: white;
                                    border-radius: 6px;
                                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                                ">
                                    <span style="color: #666; font-weight: 500;">Total Cicilan:</span>
                                    <span id="calcTotalCicilan" style="font-weight: 600; color: #ff9800; font-size: 1.1rem;">Rp 0</span>
                                </div>
                                <div style="
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    padding: 12px;
                                    background: white;
                                    border-radius: 6px;
                                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                                ">
                                    <span style="color: #666; font-weight: 500;">Cicilan per Bulan:</span>
                                    <span id="calcPerBulan" style="font-weight: 600; color: #ff9800; font-size: 1.1rem;">Rp 0</span>
                                </div>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 15px; justify-content: flex-end; margin-top: 20px;">
                            <button type="button" id="resetFormBtn" class="btn-secondary" style="
                                padding: 12px 24px;
                                background: #f0f0f0;
                                color: #666;
                                border: none;
                                border-radius: 6px;
                                font-weight: 600;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                            ">
                                <i class="fas fa-redo"></i> Reset
                            </button>
                            <button type="submit" id="submitTOPBtn" class="btn-primary" disabled style="
                                padding: 12px 24px;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                                border: none;
                                border-radius: 6px;
                                font-weight: 600;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                            ">
                                <i class="fas fa-paper-plane"></i> Ajukan TOP
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- Riwayat Pengajuan -->
            <div style="
                background: white;
                border-radius: 10px;
                padding: 20px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #f0f0f0;
                ">
                    <h3 style="margin: 0; color: #333; font-size: 1.2rem; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-history" style="color: #FF9800;"></i>
                        Riwayat Pengajuan TOP
                    </h3>
                    <button onclick="loadMyTOPRiwayat()" style="
                        background: #4CAF50;
                        color: white;
                        border: none;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        font-size: 1.2rem;
                    ">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
                <div>
                    <div class="loading" id="loadingHistory" style="text-align: center; padding: 30px; color: #666;">
                        <i class="fas fa-spinner fa-spin" style="margin-right: 10px; color: #667eea;"></i>
                        Memuat riwayat...
                    </div>
                    <div style="overflow-x: auto;">
                        <table id="topHistoryTable" style="
                            width: 100%;
                            border-collapse: collapse;
                            background: white;
                            border-radius: 8px;
                            overflow: hidden;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                            display: none;
                        ">
                            <thead>
                                <tr>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: left; font-weight: 600;">Tanggal</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: left; font-weight: 600;">Nama Alat</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: left; font-weight: 600;">Harga</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: left; font-weight: 600;">Periode</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: left; font-weight: 600;">Cicilan/Bulan</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: left; font-weight: 600;">Status</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: left; font-weight: 600;">Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="topHistoryBody">
                                <!-- Data akan diisi -->
                            </tbody>
                        </table>
                    </div>
                    <div id="noHistoryData" style="text-align: center; padding: 40px 20px; color: #666; display: none;">
                        <i class="fas fa-inbox" style="font-size: 3rem; color: #ddd; margin-bottom: 15px;"></i>
                        <p style="margin: 0;">Belum ada pengajuan TOP</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// [4] Buat konten untuk Owner dengan inline styling
function createOwnerTOPContent() {
    return `
        <div style="margin: 15px;">
            <!-- Filter -->
            <div style="
                background: white;
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            ">
                <div style="display: flex; gap: 15px; align-items: flex-end;">
                    <div style="flex: 1;">
                        <label for="filterOutletOwnerTOP" style="
                            display: block;
                            margin-bottom: 8px;
                            font-weight: 600;
                            color: #444;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <i class="fas fa-store" style="color: #667eea;"></i>
                            Outlet:
                        </label>
                        <select id="filterOutletOwnerTOP" style="
                            width: 100%;
                            padding: 12px 15px;
                            border: 2px solid #e0e0e0;
                            border-radius: 6px;
                            font-size: 14px;
                        ">
                            <option value="all">Semua Outlet</option>
                        </select>
                    </div>
                    <div style="flex: 1;">
                        <label for="filterStatusOwnerTOP" style="
                            display: block;
                            margin-bottom: 8px;
                            font-weight: 600;
                            color: #444;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <i class="fas fa-filter" style="color: #667eea;"></i>
                            Status:
                        </label>
                        <select id="filterStatusOwnerTOP" style="
                            width: 100%;
                            padding: 12px 15px;
                            border: 2px solid #e0e0e0;
                            border-radius: 6px;
                            font-size: 14px;
                        ">
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="all">Semua Status</option>
                        </select>
                    </div>
                    <button onclick="loadTOPForOwner()" style="
                        padding: 12px 24px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        height: 44px;
                    ">
                        <i class="fas fa-filter"></i> Terapkan
                    </button>
                </div>
            </div>
            
            <!-- Daftar Pending -->
            <div style="
                background: white;
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #f0f0f0;
                ">
                    <h3 style="margin: 0; color: #333; font-size: 1.2rem; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-clock" style="color: #FF9800;"></i>
                        Pengajuan Menunggu Approval
                    </h3>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span id="pendingCountTOP" style="
                            background: #ff9800;
                            color: white;
                            padding: 4px 12px;
                            border-radius: 20px;
                            font-size: 0.9rem;
                            font-weight: 600;
                        ">0 pengajuan</span>
                    </div>
                </div>
                <div>
                    <div class="loading" id="loadingPending" style="text-align: center; padding: 30px; color: #666;">
                        <i class="fas fa-spinner fa-spin" style="margin-right: 10px; color: #667eea;"></i>
                        Memuat data...
                    </div>
                    <div id="pendingTOPList" class="pending-list">
                        <!-- Data akan diisi -->
                    </div>
                </div>
            </div>
            
            <!-- Riwayat Semua TOP -->
            <div style="
                background: white;
                border-radius: 10px;
                padding: 20px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #f0f0f0;
                ">
                    <h3 style="margin: 0; color: #333; font-size: 1.2rem; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-history" style="color: #FF9800;"></i>
                        Riwayat Semua TOP
                    </h3>
                </div>
                <div>
                    <div class="loading" id="loadingAllHistory" style="text-align: center; padding: 30px; color: #666;">
                        <i class="fas fa-spinner fa-spin" style="margin-right: 10px; color: #667eea;"></i>
                        Memuat riwayat...
                    </div>
                    <div style="overflow-x: auto;">
                        <table id="allHistoryTable" style="
                            width: 100%;
                            border-collapse: collapse;
                            background: white;
                            border-radius: 8px;
                            overflow: hidden;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                            display: none;
                        ">
                            <thead>
                                <tr>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: left; font-weight: 600;">Tanggal</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: left; font-weight: 600;">Outlet</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: left; font-weight: 600;">Karyawan</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: left; font-weight: 600;">Alat</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: left; font-weight: 600;">Harga</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: left; font-weight: 600;">Periode</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: left; font-weight: 600;">Status</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: left; font-weight: 600;">Progress</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: left; font-weight: 600;">Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="allHistoryBody">
                                <!-- Data akan diisi -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// [5] Buat konten untuk Kasir dengan inline styling
function createKasirTOPContent() {
    return `
        <div style="margin: 15px;">
            <!-- Daftar TOP untuk Pembayaran -->
            <div style="
                background: white;
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #f0f0f0;
                ">
                    <h3 style="margin: 0; color: #333; font-size: 1.2rem; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-credit-card" style="color: #FF9800;"></i>
                        Pembayaran Cicilan TOP
                    </h3>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span id="activeTopCount" style="
                            background: #4CAF50;
                            color: white;
                            padding: 4px 12px;
                            border-radius: 20px;
                            font-size: 0.9rem;
                            font-weight: 600;
                        ">0 TOP aktif</span>
                    </div>
                </div>
                <div>
                    <div class="loading" id="loadingPayment" style="text-align: center; padding: 30px; color: #666;">
                        <i class="fas fa-spinner fa-spin" style="margin-right: 10px; color: #667eea;"></i>
                        Memuat data TOP...
                    </div>
                    <div id="topPaymentList" class="payment-list">
                        <!-- Data akan diisi -->
                    </div>
                </div>
            </div>
            
            <!-- Riwayat Pembayaran -->
            <div style="
                background: white;
                border-radius: 10px;
                padding: 20px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #f0f0f0;
                ">
                    <h3 style="margin: 0; color: #333; font-size: 1.2rem; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-receipt" style="color: #FF9800;"></i>
                        Riwayat Pembayaran
                    </h3>
                    <button onclick="loadTOPForKasir()" style="
                        background: #4CAF50;
                        color: white;
                        border: none;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        font-size: 1.2rem;
                    ">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
                <div>
                    <div class="loading" id="loadingPaymentHistory" style="text-align: center; padding: 30px; color: #666;">
                        <i class="fas fa-spinner fa-spin" style="margin-right: 10px; color: #667eea;"></i>
                        Memuat riwayat...
                    </div>
                    <div style="overflow-x: auto;">
                        <table id="paymentHistoryTable" style="
                            width: 100%;
                            border-collapse: collapse;
                            background: white;
                            border-radius: 8px;
                            overflow: hidden;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                            display: none;
                        ">
                            <thead>
                                <tr>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: left; font-weight: 600;">Tanggal</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: left; font-weight: 600;">Barberman</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: left; font-weight: 600;">Alat</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: left; font-weight: 600;">Cicilan ke</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: left; font-weight: 600;">Jumlah</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: left; font-weight: 600;">Penerima</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: left; font-weight: 600;">Sisa</th>
                                </tr>
                            </thead>
                            <tbody id="paymentHistoryBody">
                                <!-- Data akan diisi -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// [6] Setup Events
function setupTOPEvents() {
    // Tombol kembali
    document.getElementById('backToMainFromTOP').addEventListener('click', () => {
        document.getElementById('topPage').remove();
        document.getElementById('appScreen').style.display = 'block';
    });
    
    // Tombol refresh
    document.getElementById('refreshTOP').addEventListener('click', async () => {
        if (isOwnerTOP) {
            await loadTOPForOwner();
        } else if (isKasirTOP) {
            await loadTOPForKasir();
        } else {
            await loadMyTOPRiwayat();
        }
    });
    
    // Setup events berdasarkan role
    if (isBarbermanTOP) {
        setupBarbermanEvents();
    } else if (isOwnerTOP) {
        setupOwnerEvents();
    } else if (isKasirTOP) {
        setupKasirEvents();
    }
    
    // Modal close buttons
    setupModalEvents();
}

// [7] Setup modal events
function setupModalEvents() {
    // Close semua modal dengan class modal-close
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Close modal dengan klik di luar
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });
}

// [8] Setup events untuk Barberman
function setupBarbermanEvents() {
    const form = document.getElementById('topForm');
    const hargaInput = document.getElementById('hargaAlat');
    const periodeSelect = document.getElementById('periodeCicilan');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fotoAlat');
    const previewArea = document.getElementById('photoPreview');
    const submitBtn = document.getElementById('submitTOPBtn');
    
    if (!form || !hargaInput || !periodeSelect) return;
    
    // Auto calculate saat harga/periode berubah
    hargaInput.addEventListener('input', calculateTOP);
    periodeSelect.addEventListener('change', calculateTOP);
    
    // File upload
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handlePhotoUpload);
    
    // Form submission
    form.addEventListener('submit', handleTOPSubmission);
    
    // Reset form
    document.getElementById('resetFormBtn')?.addEventListener('click', resetTOPForm);
    
    // Remove photo
    const removeBtn = document.getElementById('removePhotoBtn');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            selectedPhotoFile = null;
            previewArea.style.display = 'none';
            uploadArea.style.display = 'block';
            fileInput.value = '';
        });
    }
    
    // Initial calculation
    calculateTOP();
}

// [9] Handle photo upload
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validasi file
    if (!file.type.startsWith('image/')) {
        alert('Hanya file gambar yang diizinkan!');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB!');
        return;
    }
    
    selectedPhotoFile = file;
    
    // Preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('previewThumbnail');
        if (preview) {
            preview.src = e.target.result;
        }
        
        const previewArea = document.getElementById('photoPreview');
        const uploadArea = document.getElementById('uploadArea');
        
        if (previewArea) previewArea.style.display = 'block';
        if (uploadArea) uploadArea.style.display = 'none';
        
        // Show preview modal
        showPhotoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
}

// [10] Show photo preview modal
function showPhotoPreview(imageSrc) {
    const modal = document.getElementById('photoPreviewModal');
    const img = document.getElementById('previewImage');
    
    if (!modal || !img) return;
    
    img.src = imageSrc;
    modal.style.display = 'block';
    
    // Setup buttons
    document.getElementById('changePhotoBtn')?.addEventListener('click', () => {
        modal.style.display = 'none';
        document.getElementById('fotoAlat').click();
    });
    
    document.getElementById('usePhotoBtn')?.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

// [11] Calculate TOP values
function calculateTOP() {
    const hargaInput = document.getElementById('hargaAlat');
    const periodeSelect = document.getElementById('periodeCicilan');
    const submitBtn = document.getElementById('submitTOPBtn');
    
    if (!hargaInput || !periodeSelect || !submitBtn) return;
    
    const harga = parseFloat(hargaInput.value) || 0;
    const periode = parseInt(periodeSelect.value) || 0;
    
    // Validasi harga maksimal
    if (harga > TOP_CONFIG.MAX_HARGA) {
        hargaInput.value = TOP_CONFIG.MAX_HARGA;
        alert(`Harga maksimal Rp ${TOP_CONFIG.MAX_HARGA.toLocaleString('id-ID')}`);
        return calculateTOP();
    }
    
    // Hitung
    const subsidi = harga * TOP_CONFIG.SUBSIDI_PERCENT;
    const totalCicilan = harga - subsidi;
    const cicilanPerBulan = periode > 0 ? totalCicilan / periode : 0;
    
    // Update display
    const calcHarga = document.getElementById('calcHarga');
    const calcSubsidi = document.getElementById('calcSubsidi');
    const calcTotalCicilan = document.getElementById('calcTotalCicilan');
    const calcPerBulan = document.getElementById('calcPerBulan');
    
    if (calcHarga) calcHarga.textContent = formatRupiah(harga);
    if (calcSubsidi) calcSubsidi.textContent = formatRupiah(subsidi);
    if (calcTotalCicilan) calcTotalCicilan.textContent = formatRupiah(totalCicilan);
    if (calcPerBulan) calcPerBulan.textContent = formatRupiah(cicilanPerBulan);
    
    // Enable/disable submit button
    const namaAlat = document.getElementById('namaAlat')?.value.trim() || '';
    const isFormValid = namaAlat && harga >= 1000 && periode >= 1 && periode <= 24 && selectedPhotoFile;
    submitBtn.disabled = !isFormValid;
}

// [12] Reset form
function resetTOPForm() {
    const form = document.getElementById('topForm');
    const previewArea = document.getElementById('photoPreview');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fotoAlat');
    
    if (form) form.reset();
    selectedPhotoFile = null;
    
    if (previewArea) previewArea.style.display = 'none';
    if (uploadArea) uploadArea.style.display = 'block';
    if (fileInput) fileInput.value = '';
    
    calculateTOP();
}

// [13] Handle TOP submission
async function handleTOPSubmission(event) {
    event.preventDefault();
    
    const namaAlat = document.getElementById('namaAlat')?.value.trim() || '';
    const hargaAlat = parseFloat(document.getElementById('hargaAlat')?.value) || 0;
    const periodeCicilan = parseInt(document.getElementById('periodeCicilan')?.value) || 0;
    
    // Validasi
    if (hargaAlat > TOP_CONFIG.MAX_HARGA) {
        alert(`Harga maksimal Rp ${TOP_CONFIG.MAX_HARGA.toLocaleString('id-ID')}`);
        return;
    }
    
    if (!selectedPhotoFile) {
        alert('Harap upload foto alat!');
        return;
    }
    
    const submitBtn = document.getElementById('submitTOPBtn');
    if (!submitBtn) return;
    
    const originalText = submitBtn.innerHTML;
    
    try {
        // Disable button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengupload...';
        
        // 1. Upload foto ke Supabase Storage
        const fileName = `top_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('top_photos')
            .upload(fileName, selectedPhotoFile);
        
        if (uploadError) throw uploadError;
        
        // 2. Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('top_photos')
            .getPublicUrl(fileName);
        
        // 3. Calculate values
        const subsidi = hargaAlat * TOP_CONFIG.SUBSIDI_PERCENT;
        const totalCicilan = hargaAlat - subsidi;
        const cicilanPerBulan = totalCicilan / periodeCicilan;
        
        // 4. Insert ke database
        const { data, error } = await supabase
            .from('top_program')
            .insert([{
                batch_id: topBatchId,
                karyawan: currentKaryawanTOP.nama_karyawan,
                outlet: currentUserOutletTOP,
                nama_alat: namaAlat,
                harga_alat: hargaAlat,
                foto_url: publicUrl,
                periode_cicilan: periodeCicilan,
                subsidi: subsidi,
                total_cicilan: totalCicilan,
                cicilan_per_periode: cicilanPerBulan,
                status: 'pending',
                sisa_cicilan: totalCicilan,
                pembayaran: [],
                created_at: new Date().toISOString()
            }]);
        
        if (error) throw error;
        
        // Success
        alert('✅ Pengajuan TOP berhasil dikirim!');
        
        // Reset form dan reload data
        resetTOPForm();
        topBatchId = generateBatchId();
        await loadMyTOPRiwayat();
        
    } catch (error) {
        console.error('Error submitting TOP:', error);
        alert(`❌ Gagal mengajukan TOP: ${error.message}`);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}

// [14] Load riwayat untuk Barberman
async function loadMyTOPRiwayat() {
    try {
        const loadingEl = document.getElementById('loadingHistory');
        const tableEl = document.getElementById('topHistoryTable');
        const noDataEl = document.getElementById('noHistoryData');
        
        if (loadingEl) loadingEl.style.display = 'block';
        if (tableEl) tableEl.style.display = 'none';
        if (noDataEl) noDataEl.style.display = 'none';
        
        const { data: topList, error } = await supabase
            .from('top_program')
            .select('*')
            .eq('karyawan', currentKaryawanTOP.nama_karyawan)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        displayMyTOPRiwayat(topList || []);
        
    } catch (error) {
        console.error('Error loading TOP riwayat:', error);
        const tbody = document.getElementById('topHistoryBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" style="padding: 20px; text-align: center; color: #666;">Gagal memuat data</td></tr>`;
        }
    } finally {
        const loadingEl = document.getElementById('loadingHistory');
        if (loadingEl) loadingEl.style.display = 'none';
    }
}

// [15] Display riwayat Barberman
function displayMyTOPRiwayat(topList) {
    const tbody = document.getElementById('topHistoryBody');
    const tableEl = document.getElementById('topHistoryTable');
    const noDataEl = document.getElementById('noHistoryData');
    
    if (!tbody) return;
    
    if (!topList || topList.length === 0) {
        if (tableEl) tableEl.style.display = 'none';
        if (noDataEl) noDataEl.style.display = 'block';
        tbody.innerHTML = '';
        return;
    }
    
    let html = '';
    
    topList.forEach((top, index) => {
        const createdDate = new Date(top.created_at);
        const progress = calculateProgress(top);
        
        html += `
            <tr style="${index % 2 === 0 ? 'background: #f9f9f9;' : ''}">
                <td style="padding: 15px; border-bottom: 1px solid #f0f0f0;">
                    ${formatDate(createdDate)}<br>
                    <small style="color: #999;">${createdDate.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</small>
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #f0f0f0;">
                    <div style="font-weight: 500;">${top.nama_alat}</div>
                    ${top.foto_url ? `<small><a href="${top.foto_url}" target="_blank" style="color: #667eea;">Lihat foto</a></small>` : ''}
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #f0f0f0;">${formatRupiah(top.harga_alat)}</td>
                <td style="padding: 15px; border-bottom: 1px solid #f0f0f0;">${top.periode_cicilan} bln</td>
                <td style="padding: 15px; border-bottom: 1px solid #f0f0f0;">${formatRupiah(top.cicilan_per_periode)}</td>
                <td style="padding: 15px; border-bottom: 1px solid #f0f0f0;">
                    <span class="status-pill ${getTOPStatusClass(top.status)}">
                        ${getTOPStatusText(top)}
                    </span>
                    ${top.status !== 'pending' && top.status !== 'rejected' ? `
                        <div style="margin-top: 5px;">
                            <div class="progress-bar-container">
                                <div class="progress-bar" style="width: ${progress.percentage}%"></div>
                                <div class="progress-text">${progress.text}</div>
                            </div>
                        </div>
                    ` : ''}
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #f0f0f0;">
                    <button onclick="showTOPDetail('${top.id}')" style="
                        padding: 6px 12px;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        margin: 0 2px;
                    ">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${top.status === 'pending' ? `
                        <button onclick="cancelTOP('${top.id}')" style="
                            padding: 6px 12px;
                            background: #ff4757;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            margin: 0 2px;
                        ">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    if (tableEl) tableEl.style.display = 'table';
    if (noDataEl) noDataEl.style.display = 'none';
}

// [16] Load data untuk Owner
async function loadTOPForOwner() {
    try {
        // Tampilkan loading
        const loadingPending = document.getElementById('loadingPending');
        const loadingAll = document.getElementById('loadingAllHistory');
        
        if (loadingPending) loadingPending.style.display = 'block';
        if (loadingAll) loadingAll.style.display = 'block';
        
        // Get filter values
        const outletFilter = document.getElementById('filterOutletOwnerTOP')?.value || 'all';
        const statusFilter = document.getElementById('filterStatusOwnerTOP')?.value || 'pending';
        
        // Build query
        let query = supabase
            .from('top_program')
            .select('*')
            .order('created_at', { ascending: false });
        
        // Apply filters
        if (outletFilter !== 'all') {
            query = query.eq('outlet', outletFilter);
        }
        
        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }
        
        const { data: topList, error } = await query;
        
        if (error) throw error;
        
        // Display data
        displayPendingTOP(topList || []);
        displayAllTOPRiwayat(topList || []);
        
        // Load outlet options
        await loadOutletDropdownForTOP(topList || []);
        
    } catch (error) {
        console.error('Error loading TOP for owner:', error);
        alert('Gagal memuat data TOP: ' + error.message);
    } finally {
        // Hide loading
        const loadingPending = document.getElementById('loadingPending');
        const loadingAll = document.getElementById('loadingAllHistory');
        
        if (loadingPending) loadingPending.style.display = 'none';
        if (loadingAll) loadingAll.style.display = 'none';
    }
}

// [17] Display pending TOP untuk Owner
function displayPendingTOP(topList) {
    const container = document.getElementById('pendingTOPList');
    const countEl = document.getElementById('pendingCountTOP');
    
    if (!container) return;
    
    const pendingList = topList.filter(top => top.status === 'pending');
    
    if (countEl) {
        countEl.textContent = `${pendingList.length} pengajuan pending`;
    }
    
    if (pendingList.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #666;">
                <i class="fas fa-check-circle" style="font-size: 3rem; color: #ddd; margin-bottom: 15px;"></i>
                <h4 style="margin: 0 0 10px 0; color: #666;">Tidak ada pengajuan pending</h4>
                <p style="margin: 0; color: #999;">Semua pengajuan sudah diproses</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    pendingList.forEach(top => {
        const createdDate = new Date(top.created_at);
        
        html += `
            <div style="
                background: white;
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 3px 10px rgba(0,0,0,0.1);
            " data-top-id="${top.id}">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #f0f0f0;
                ">
                    <div>
                        <h4 style="margin: 0; color: #333;">${top.nama_alat}</h4>
                        <span style="font-size: 0.9rem; color: #999;">${formatDate(createdDate)}</span>
                    </div>
                    <div style="
                        background: #667eea;
                        color: white;
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 0.9rem;
                    ">
                        <i class="fas fa-store"></i> ${top.outlet}
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                        <div style="
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            padding: 8px;
                            background: #f9f9f9;
                            border-radius: 6px;
                        ">
                            <i class="fas fa-user" style="color: #667eea;"></i>
                            <span>${top.karyawan}</span>
                        </div>
                        <div style="
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            padding: 8px;
                            background: #f9f9f9;
                            border-radius: 6px;
                        ">
                            <i class="fas fa-tag" style="color: #667eea;"></i>
                            <span>${formatRupiah(top.harga_alat)}</span>
                        </div>
                        <div style="
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            padding: 8px;
                            background: #f9f9f9;
                            border-radius: 6px;
                        ">
                            <i class="fas fa-calendar-alt" style="color: #667eea;"></i>
                            <span>${top.periode_cicilan} bulan</span>
                        </div>
                        <div style="
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            padding: 8px;
                            background: #f9f9f9;
                            border-radius: 6px;
                        ">
                            <i class="fas fa-money-bill-wave" style="color: #667eea;"></i>
                            <span>${formatRupiah(top.cicilan_per_periode)}/bln</span>
                        </div>
                    </div>
                    
                    ${top.foto_url ? `
                        <div>
                            <img src="${top.foto_url}" alt="Foto Alat" onclick="previewImage('${top.foto_url}')" style="
                                width: 100%;
                                max-height: 150px;
                                object-fit: contain;
                                border-radius: 6px;
                                cursor: pointer;
                                border: 2px solid #f0f0f0;
                            ">
                        </div>
                    ` : ''}
                </div>
                
                <div style="
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 6px;
                    margin-bottom: 20px;
                ">
                    <h5 style="margin: 0 0 10px 0; color: #333;">Perhitungan:</h5>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 10px;">
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            padding: 8px 12px;
                            background: white;
                            border-radius: 4px;
                        ">
                            <span>Harga:</span>
                            <span>${formatRupiah(top.harga_alat)}</span>
                        </div>
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            padding: 8px 12px;
                            background: white;
                            border-radius: 4px;
                        ">
                            <span>Subsidi (25%):</span>
                            <span>${formatRupiah(top.subsidi)}</span>
                        </div>
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            padding: 8px 12px;
                            background: white;
                            border-radius: 4px;
                        ">
                            <span>Total Cicilan:</span>
                            <span style="color: #ff9800; font-weight: 600;">${formatRupiah(top.total_cicilan)}</span>
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="approveTOP('${top.id}')" style="
                        padding: 10px 20px;
                        background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    ">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button onclick="rejectTOP('${top.id}')" style="
                        padding: 10px 20px;
                        background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%);
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    ">
                        <i class="fas fa-times"></i> Reject
                    </button>
                    <button onclick="showTOPDetail('${top.id}')" style="
                        padding: 10px 20px;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    ">
                        <i class="fas fa-eye"></i> Detail
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// [18] Approve TOP
async function approveTOP(topId) {
    const note = prompt('Masukkan catatan approval (opsional):');
    
    if (note === null) return; // User cancelled
    
    try {
        const { error } = await supabase
            .from('top_program')
            .update({
                status: 'approved',
                approved_by: currentKaryawanTOP.nama_karyawan,
                approved_at: new Date().toISOString(),
                approve_note: note || null
            })
            .eq('id', topId);
        
        if (error) throw error;
        
        alert('TOP berhasil diapprove!');
        await loadTOPForOwner();
        
    } catch (error) {
        console.error('Error approving TOP:', error);
        alert('Gagal approve TOP: ' + error.message);
    }
}

// [19] Reject TOP
async function rejectTOP(topId) {
    const note = prompt('Masukkan alasan penolakan:');
    
    if (note === null) return;
    
    if (!note.trim()) {
        alert('Harap masukkan alasan penolakan');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('top_program')
            .update({
                status: 'rejected',
                approved_by: currentKaryawanTOP.nama_karyawan,
                approved_at: new Date().toISOString(),
                reject_note: note
            })
            .eq('id', topId);
        
        if (error) throw error;
        
        alert('TOP ditolak!');
        await loadTOPForOwner();
        
    } catch (error) {
        console.error('Error rejecting TOP:', error);
        alert('Gagal reject TOP: ' + error.message);
    }
}

// [20] Display all TOP riwayat untuk Owner
function displayAllTOPRiwayat(topList) {
    const tbody = document.getElementById('allHistoryBody');
    const tableEl = document.getElementById('allHistoryTable');
    
    if (!tbody) return;
    
    if (!topList || topList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="padding: 20px; text-align: center; color: #666;">
                    <i class="fas fa-history"></i>
                    Tidak ada data TOP
                </td>
            </tr>
        `;
        if (tableEl) tableEl.style.display = 'table';
        return;
    }
    
    // Limit to 20 entries
    const displayList = topList.slice(0, 20);
    
    let html = '';
    
    displayList.forEach((top, index) => {
        const createdDate = new Date(top.created_at);
        const progress = calculateProgress(top);
        
        html += `
            <tr style="${index % 2 === 0 ? 'background: #f9f9f9;' : ''}">
                <td style="padding: 15px; border-bottom: 1px solid #f0f0f0;">
                    ${formatDate(createdDate)}<br>
                    <small style="color: #999;">${createdDate.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</small>
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #f0f0f0;">${top.outlet}</td>
                <td style="padding: 15px; border-bottom: 1px solid #f0f0f0;">${top.karyawan}</td>
                <td style="padding: 15px; border-bottom: 1px solid #f0f0f0;">
                    <div style="font-weight: 500;">${top.nama_alat}</div>
                    ${top.foto_url ? `<small><a href="${top.foto_url}" target="_blank" style="color: #667eea;">Lihat foto</a></small>` : ''}
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #f0f0f0;">${formatRupiah(top.harga_alat)}</td>
                <td style="padding: 15px; border-bottom: 1px solid #f0f0f0;">${top.periode_cicilan} bln</td>
                <td style="padding: 15px; border-bottom: 1px solid #f0f0f0;">
                    <span class="status-pill ${getTOPStatusClass(top.status)}">
                        ${getTOPStatusText(top)}
                    </span>
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #f0f0f0;">
                    <div style="margin-top: 5px;">
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${progress.percentage}%"></div>
                            <div class="progress-text">${progress.text}</div>
                        </div>
                    </div>
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #f0f0f0;">
                    <button onclick="showTOPDetail('${top.id}')" style="
                        padding: 6px 12px;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        margin: 0 2px;
                    ">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${top.status === 'pending' ? `
                        <button onclick="approveTOP('${top.id}')" style="
                            padding: 6px 12px;
                            background: #4CAF50;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            margin: 0 2px;
                        ">
                            <i class="fas fa-check"></i>
                        </button>
                        <button onclick="rejectTOP('${top.id}')" style="
                            padding: 6px 12px;
                            background: #ff4757;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            margin: 0 2px;
                        ">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    });
    
    // Jika ada lebih dari 20 item
    if (topList.length > 20) {
        html += `
            <tr style="background: #f8f9fa;">
                <td colspan="9" style="text-align: center; padding: 15px; color: #6c757d; font-style: italic;">
                    <i class="fas fa-info-circle"></i> Menampilkan 20 dari ${topList.length} data TOP.
                </td>
            </tr>
        `;
    }
    
    tbody.innerHTML = html;
    if (tableEl) tableEl.style.display = 'table';
}

// [21] Load outlet dropdown untuk Owner
async function loadOutletDropdownForTOP(topList) {
    const select = document.getElementById('filterOutletOwnerTOP');
    if (!select) return;
    
    try {
        // Get unique outlets from existing data
        const outlets = [...new Set(topList.map(top => top.outlet).filter(Boolean))];
        
        let options = '<option value="all">Semua Outlet</option>';
        
        outlets.forEach(outlet => {
            options += `<option value="${outlet}">${outlet}</option>`;
        });
        
        select.innerHTML = options;
        
    } catch (error) {
        console.error('Error loading outlets:', error);
    }
}

// [22] Load data untuk Kasir
async function loadTOPForKasir() {
    try {
        const loadingPayment = document.getElementById('loadingPayment');
        const loadingHistory = document.getElementById('loadingPaymentHistory');
        
        if (loadingPayment) loadingPayment.style.display = 'block';
        if (loadingHistory) loadingHistory.style.display = 'block';
        
        // Get TOP yang approved untuk outlet yang sama dengan kasir
        const { data: topList, error } = await supabase
            .from('top_program')
            .select('*')
            .eq('outlet', currentUserOutletTOP)
            .in('status', ['approved', 'cicilan_1', 'cicilan_2', 'cicilan_3', 'cicilan_4', 'cicilan_5', 'cicilan_6', 'cicilan_7', 'cicilan_8', 'cicilan_9', 'cicilan_10', 'cicilan_11', 'cicilan_12', 'cicilan_13', 'cicilan_14', 'cicilan_15', 'cicilan_16', 'cicilan_17', 'cicilan_18', 'cicilan_19', 'cicilan_20', 'cicilan_21', 'cicilan_22', 'cicilan_23'])
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Filter hanya yang belum lunas
        const activeTOP = (topList || []).filter(top => top.status !== 'lunas');
        
        // Display
        displayTOPForPayment(activeTOP);
        displayPaymentHistory(activeTOP);
        
    } catch (error) {
        console.error('Error loading TOP for kasir:', error);
        alert('Gagal memuat data TOP: ' + error.message);
    } finally {
        const loadingPayment = document.getElementById('loadingPayment');
        const loadingHistory = document.getElementById('loadingPaymentHistory');
        
        if (loadingPayment) loadingPayment.style.display = 'none';
        if (loadingHistory) loadingHistory.style.display = 'none';
    }
}

// [23] Display TOP untuk pembayaran (Kasir)
function displayTOPForPayment(topList) {
    const container = document.getElementById('topPaymentList');
    const countEl = document.getElementById('activeTopCount');
    
    if (!container) return;
    
    if (countEl) {
        countEl.textContent = `${topList.length} TOP aktif`;
    }
    
    if (topList.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #666;">
                <i class="fas fa-check-circle" style="font-size: 3rem; color: #ddd; margin-bottom: 15px;"></i>
                <h4 style="margin: 0 0 10px 0; color: #666;">Tidak ada TOP aktif</h4>
                <p style="margin: 0; color: #999;">Semua TOP sudah lunas</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    topList.forEach(top => {
        const progress = calculateProgress(top);
        const nextCicilan = getNextCicilan(top);
        
        html += `
            <div style="
                background: white;
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 3px 10px rgba(0,0,0,0.1);
            " data-top-id="${top.id}">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #f0f0f0;
                ">
                    <div>
                        <h4 style="margin: 0; color: #333;">${top.nama_alat}</h4>
                        <div style="display: flex; gap: 15px; margin-top: 5px;">
                            <span style="color: #666; font-size: 0.95rem;">
                                <i class="fas fa-user"></i> ${top.karyawan}
                            </span>
                            <span class="payment-status ${getTOPStatusClass(top.status)}" style="
                                padding: 3px 10px;
                                border-radius: 12px;
                                font-size: 0.8rem;
                                font-weight: 600;
                            ">
                                ${getTOPStatusText(top)}
                            </span>
                        </div>
                    </div>
                    <button onclick="showPaymentForm('${top.id}')" style="
                        padding: 10px 20px;
                        background: linear-gradient(135deg, #FF9800 0%, #FF5722 100%);
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    ">
                        <i class="fas fa-credit-card"></i> Bayar Cicilan
                    </button>
                </div>
                
                <div>
                    <div style="margin-bottom: 20px;">
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                            <div style="background: #f8f9fa; padding: 12px; border-radius: 6px;">
                                <div style="color: #666; font-size: 0.9rem; margin-bottom: 5px;">Harga Alat:</div>
                                <div>${formatRupiah(top.harga_alat)}</div>
                            </div>
                            <div style="background: #f8f9fa; padding: 12px; border-radius: 6px;">
                                <div style="color: #666; font-size: 0.9rem; margin-bottom: 5px;">Subsidi 25%:</div>
                                <div>${formatRupiah(top.subsidi)}</div>
                            </div>
                            <div style="background: #f8f9fa; padding: 12px; border-radius: 6px;">
                                <div style="color: #666; font-size: 0.9rem; margin-bottom: 5px;">Total Cicilan:</div>
                                <div>${formatRupiah(top.total_cicilan)}</div>
                            </div>
                            <div style="background: #f8f9fa; padding: 12px; border-radius: 6px;">
                                <div style="color: #666; font-size: 0.9rem; margin-bottom: 5px;">Cicilan/Bulan:</div>
                                <div style="color: #ff9800; font-weight: 600;">${formatRupiah(top.cicilan_per_periode)}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h5 style="margin: 0; color: #333;">Progress Cicilan</h5>
                            <button onclick="showCicilanDetail('${top.id}')" style="
                                padding: 6px 12px;
                                background: transparent;
                                border: 1px solid #667eea;
                                color: #667eea;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 0.9rem;
                                display: flex;
                                align-items: center;
                                gap: 5px;
                            ">
                                <i class="fas fa-list"></i> Lihat Detail
                            </button>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${progress.percentage}%"></div>
                            <div class="progress-text">${progress.text}</div>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px;">
                            <div style="display: flex; justify-content: space-between; padding: 10px; background: white; border-radius: 6px;">
                                <span>Sudah Dibayar:</span>
                                <span style="color: #4CAF50; font-weight: 600;">${formatRupiah(top.total_dibayar || 0)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 10px; background: white; border-radius: 6px;">
                                <span>Sisa Cicilan:</span>
                                <span style="color: #ff9800; font-weight: 600;">${formatRupiah(top.sisa_cicilan || top.total_cicilan)}</span>
                            </div>
                            ${nextCicilan > 0 ? `
                                <div style="display: flex; justify-content: space-between; padding: 10px; background: white; border-radius: 6px;">
                                    <span>Cicilan Berikutnya:</span>
                                    <span style="color: #667eea; font-weight: 600;">Cicilan ke-${nextCicilan}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// [24] Display payment history untuk Kasir
function displayPaymentHistory(topList) {
    const tbody = document.getElementById('paymentHistoryBody');
    const tableEl = document.getElementById('paymentHistoryTable');
    
    if (!tbody) return;
    
    // Collect all payments from all TOP
    const allPayments = [];
    
    topList.forEach(top => {
        const payments = top.pembayaran || [];
        payments.forEach(payment => {
            allPayments.push({
                ...payment,
                barberman: top.karyawan,
                alat: top.nama_alat,
                sisa_cicilan: top.sisa_cicilan || top.total_cicilan
            });
        });
    });
    
    // Sort by tanggal bayar (newest first)
    allPayments.sort((a, b) => new Date(b.tanggal_bayar) - new Date(a.tanggal_bayar));
    
    if (allPayments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="padding: 20px; text-align: center; color: #666;">
                    <i class="fas fa-receipt"></i>
                    Belum ada riwayat pembayaran
                </td>
            </tr>
        `;
        if (tableEl) tableEl.style.display = 'table';
        return;
    }
    
    // Limit to 20 entries for performance
    const displayPayments = allPayments.slice(0, 20);
    
    let html = '';
    
    displayPayments.forEach((payment, index) => {
        const tanggal = new Date(payment.tanggal_bayar);
        
        html += `
            <tr style="${index % 2 === 0 ? 'background: #f9f9f9;' : ''}">
                <td style="padding: 15px; border-bottom: 1px solid #f0f0f0;">
                    ${formatDate(tanggal)}<br>
                    <small style="color: #999;">${tanggal.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</small>
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #f0f0f0;">${payment.barberman}</td>
                <td style="padding: 15px; border-bottom: 1px solid #f0f0f0;">
                    <div style="font-weight: 500;">${payment.alat}</div>
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #f0f0f0;">
                    <span style="
                        display: inline-block;
                        padding: 3px 8px;
                        background: #667eea;
                        color: white;
                        border-radius: 12px;
                        font-size: 0.8rem;
                        font-weight: 600;
                        min-width: 30px;
                        text-align: center;
                    ">${payment.cicilan_ke}</span>
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #f0f0f0;">${formatRupiah(payment.jumlah_bayar)}</td>
                <td style="padding: 15px; border-bottom: 1px solid #f0f0f0;">${payment.penerima || '-'}</td>
                <td style="padding: 15px; border-bottom: 1px solid #f0f0f0;">${formatRupiah(payment.sisa_cicilan)}</td>
            </tr>
        `;
    });
    
    // Jika ada lebih dari 20 pembayaran, tambahkan note
    if (allPayments.length > 20) {
        html += `
            <tr style="background: #f8f9fa;">
                <td colspan="7" style="text-align: center; padding: 15px; color: #6c757d; font-style: italic;">
                    <i class="fas fa-info-circle"></i> Menampilkan 20 dari ${allPayments.length} pembayaran.
                </td>
            </tr>
        `;
    }
    
    tbody.innerHTML = html;
    if (tableEl) tableEl.style.display = 'table';
}

// [25] Show payment form (Kasir)
async function showPaymentForm(topId) {
    try {
        // Get TOP data
        const { data: top, error } = await supabase
            .from('top_program')
            .select('*')
            .eq('id', topId)
            .single();
        
        if (error) throw error;
        
        const modal = document.getElementById('paymentModal');
        const paymentInfo = document.getElementById('paymentInfo');
        const cicilanKeInput = document.getElementById('cicilanKe');
        const jumlahCicilanInput = document.getElementById('jumlahCicilan');
        const jumlahBayarInput = document.getElementById('jumlahBayar');
        
        if (!modal || !paymentInfo) return;
        
        // Calculate next cicilan
        const nextCicilan = getNextCicilan(top);
        const maxCicilan = top.periode_cicilan - (nextCicilan - 1);
        
        // Set payment info
        paymentInfo.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; color: #333;">${top.nama_alat}</h4>
                <p style="margin: 0 0 15px 0; color: #666; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-user" style="color: #667eea;"></i> ${top.karyawan}
                </p>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 6px;">
                        <div style="color: #666; font-size: 0.9rem;">Cicilan per Bulan:</div>
                        <div style="font-weight: 600;">${formatRupiah(top.cicilan_per_periode)}</div>
                    </div>
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 6px;">
                        <div style="color: #666; font-size: 0.9rem;">Sudah Dibayar:</div>
                        <div style="font-weight: 600;">${formatRupiah(top.total_dibayar || 0)}</div>
                    </div>
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 6px;">
                        <div style="color: #666; font-size: 0.9rem;">Sisa Cicilan:</div>
                        <div style="font-weight: 600;">${formatRupiah(top.sisa_cicilan || top.total_cicilan)}</div>
                    </div>
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 6px;">
                        <div style="color: #666; font-size: 0.9rem;">Cicilan Berikutnya:</div>
                        <div style="font-weight: 600; color: #ff9800;">Cicilan ke-${nextCicilan}</div>
                    </div>
                </div>
            </div>
        `;
        
        // Set form values
        if (cicilanKeInput) {
            cicilanKeInput.value = nextCicilan;
            cicilanKeInput.min = nextCicilan;
            cicilanKeInput.max = top.periode_cicilan;
        }
        
        if (jumlahCicilanInput) {
            jumlahCicilanInput.value = 1;
            jumlahCicilanInput.min = 1;
            jumlahCicilanInput.max = maxCicilan;
        }
        
        // Calculate total
        calculatePaymentTotal(top.cicilan_per_periode);
        
        // Setup form submission
        const form = document.getElementById('paymentForm');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                await processPayment(topId, top);
            };
        }
        
        // Show modal
        modal.style.display = 'block';
        
        // Auto calculate on input change
        if (cicilanKeInput && jumlahCicilanInput) {
            const updateHandler = () => calculatePaymentTotal(top.cicilan_per_periode);
            cicilanKeInput.addEventListener('input', updateHandler);
            jumlahCicilanInput.addEventListener('input', updateHandler);
        }
        
    } catch (error) {
        console.error('Error showing payment form:', error);
        alert('Gagal memuat data pembayaran');
    }
}

// [26] Calculate payment total
function calculatePaymentTotal(cicilanPerPeriode) {
    const cicilanKe = parseInt(document.getElementById('cicilanKe')?.value) || 1;
    const jumlahCicilan = parseInt(document.getElementById('jumlahCicilan')?.value) || 1;
    const jumlahBayarInput = document.getElementById('jumlahBayar');
    
    const totalBayar = cicilanPerPeriode * jumlahCicilan;
    if (jumlahBayarInput) {
        jumlahBayarInput.value = formatRupiah(totalBayar);
    }
}

// [27] Process payment
async function processPayment(topId, topData) {
    try {
        const cicilanKe = parseInt(document.getElementById('cicilanKe')?.value) || 1;
        const jumlahCicilan = parseInt(document.getElementById('jumlahCicilan')?.value) || 1;
        const metodeBayar = document.getElementById('metodeBayar')?.value || 'cash';
        
        if (jumlahCicilan < 1) {
            alert('Jumlah cicilan minimal 1');
            return;
        }
        
        // Calculate payment details
        const jumlahBayar = topData.cicilan_per_periode * jumlahCicilan;
        const cicilanTerakhir = cicilanKe + jumlahCicilan - 1;
        
        // Create payment records
        const pembayaranBaru = [];
        for (let i = cicilanKe; i <= cicilanTerakhir; i++) {
            pembayaranBaru.push({
                cicilan_ke: i,
                tanggal_bayar: new Date().toISOString(),
                jumlah_bayar: topData.cicilan_per_periode,
                penerima: currentKaryawanTOP.nama_karyawan,
                metode_bayar: metodeBayar
            });
        }
        
        // Get existing payments
        const existingPayments = topData.pembayaran || [];
        const allPayments = [...existingPayments, ...pembayaranBaru];
        
        // Calculate totals
        const totalDibayar = allPayments.reduce((sum, p) => sum + p.jumlah_bayar, 0);
        const sisaCicilan = topData.total_cicilan - totalDibayar;
        
        // Determine new status
        let newStatus;
        if (sisaCicilan <= 0) {
            newStatus = 'lunas';
        } else {
            newStatus = `cicilan_${cicilanTerakhir}`;
        }
        
        // Update database
        const { error } = await supabase
            .from('top_program')
            .update({
                pembayaran: allPayments,
                total_dibayar: totalDibayar,
                sisa_cicilan: sisaCicilan,
                status: newStatus
            })
            .eq('id', topId);
        
        if (error) throw error;
        
        // Close modal and refresh
        const modal = document.getElementById('paymentModal');
        if (modal) modal.style.display = 'none';
        
        alert(`✅ Pembayaran berhasil! Cicilan ke-${cicilanKe}-${cicilanTerakhir}`);
        await loadTOPForKasir();
        
    } catch (error) {
        console.error('Error processing payment:', error);
        alert('❌ Gagal memproses pembayaran: ' + error.message);
    }
}

// [28] Setup events untuk Owner dan Kasir
function setupOwnerEvents() {
    // Filter events sudah di-handle di HTML
}

function setupKasirEvents() {
    // Events sudah di-handle di HTML
}

// [29] Helper functions
function generateBatchId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 6);
    return `TOP-${timestamp}-${random}`.toUpperCase();
}

function formatDate(date) {
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function formatDateDisplay(date) {
    return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatRupiah(amount) {
    if (!amount && amount !== 0) return 'Rp 0';
    return 'Rp ' + amount.toLocaleString('id-ID');
}

function getTOPStatusClass(status) {
    switch (status) {
        case 'pending': return 'status-pending';
        case 'approved': return 'status-approved';
        case 'rejected': return 'status-rejected';
        case 'lunas': return 'status-lunas';
        default:
            if (status.startsWith('cicilan_')) return 'status-inprogress';
            return 'status-unknown';
    }
}

function getTOPStatusText(top) {
    if (top.status === 'lunas') return 'LUNAS';
    if (top.status === 'pending') return 'Menunggu';
    if (top.status === 'approved') return 'Disetujui';
    if (top.status === 'rejected') return 'Ditolak';
    if (top.status.startsWith('cicilan_')) {
        const cicilanKe = parseInt(top.status.split('_')[1]) || 0;
        return `Cicilan ke-${cicilanKe}`;
    }
    return top.status;
}

function calculateProgress(top) {
    if (top.status === 'pending' || top.status === 'rejected') {
        return { percentage: 0, text: 'Belum mulai' };
    }
    
    if (top.status === 'approved') {
        return { percentage: 0, text: 'Belum mulai cicilan' };
    }
    
    if (top.status === 'lunas') {
        return { percentage: 100, text: 'LUNAS 100%' };
    }
    
    if (top.status.startsWith('cicilan_')) {
        const cicilanKe = parseInt(top.status.split('_')[1]) || 0;
        const percentage = (cicilanKe / top.periode_cicilan) * 100;
        return {
            percentage: percentage,
            text: `${cicilanKe}/${top.periode_cicilan} cicilan (${Math.round(percentage)}%)`
        };
    }
    
    return { percentage: 0, text: 'Unknown' };
}

function getNextCicilan(top) {
    if (top.status === 'approved') return 1;
    if (top.status.startsWith('cicilan_')) {
        const current = parseInt(top.status.split('_')[1]) || 0;
        return current + 1;
    }
    return 0;
}

function getTOPFooterMessage() {
    if (isBarbermanTOP) return 'Ajukan alat baru atau lihat progress cicilan alat Anda';
    if (isOwnerTOP) return 'Approve atau reject pengajuan TOP dari karyawan';
    if (isKasirTOP) return 'Proses pembayaran cicilan TOP untuk barberman';
    return 'Tools Ownership Program';
}

// [30] Placeholder functions untuk fitur tambahan
async function showCicilanDetail(topId) {
    alert('Detail cicilan akan ditampilkan di sini');
}

async function showTOPDetail(topId) {
    alert('Detail TOP akan ditampilkan di sini');
}

async function cancelTOP(topId) {
    if (confirm('Batalkan pengajuan TOP ini?')) {
        alert('Fitur pembatalan akan diimplementasikan');
    }
}

function previewImage(url) {
    window.open(url, '_blank');
}

// [31] Global functions
window.showTOPPage = showTOPPage;
window.loadMyTOPRiwayat = loadMyTOPRiwayat;
window.loadTOPForOwner = loadTOPForOwner;
window.loadTOPForKasir = loadTOPForKasir;
window.approveTOP = approveTOP;
window.rejectTOP = rejectTOP;
window.showPaymentForm = showPaymentForm;
window.showCicilanDetail = showCicilanDetail;
window.showTOPDetail = showTOPDetail;
window.cancelTOP = cancelTOP;
window.previewImage = previewImage;

// ========== END OF TOP MODULE ==========
