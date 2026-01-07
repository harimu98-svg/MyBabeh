// ========== MODULE TOP (Tools Ownership Program) ==========
// ========================================================

// Konfigurasi
const TOP_CONFIG = {
    SUBSIDI_PERCENT: 0.20,      // 20%
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

// [2] Buat halaman TOP dengan inline styling dan responsive
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
        font-size: 14px;
    `;
    
    // Tentukan konten berdasarkan role
    const content = isBarbermanTOP ? createBarbermanTOPContent() :
                     isOwnerTOP ? createOwnerTOPContent() :
                     createKasirTOPContent();
    
    topPage.innerHTML = `
        <!-- Header dengan inline styling - UKURAN DIKECILKAN & RATA TENGAH -->
        <header style="
            background: rgba(255, 255, 255, 0.95);
            padding: 10px 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            z-index: 100;
            gap: 15px;
        ">
            <button class="back-btn" id="backToMainFromTOP" style="
                background: #667eea;
                color: white;
                border: none;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 1rem;
                transition: all 0.3s;
                flex-shrink: 0;
                position: absolute;
                left: 15px;
            ">
                <i class="fas fa-arrow-left"></i>
            </button>
            
            <!-- JUDUL RATA TENGAH -->
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 4px;
                flex: 1;
                text-align: center;
            ">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-tools" style="color: #FF9800; font-size: 1.2rem;"></i>
                    <h2 style="
                        margin: 0;
                        color: #333;
                        font-size: 1.1rem;
                        white-space: nowrap;
                    ">TOP Program</h2>
                </div>
                <small style="font-size: 0.8rem; color: #666;">Tools Ownership Program</small>
            </div>
            
            <div class="header-actions" style="
                flex-shrink: 0;
                position: absolute;
                right: 15px;
            ">
                <button class="refresh-btn" id="refreshTOP" title="Refresh" style="
                    background: #4CAF50;
                    color: white;
                    border: none;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.3s;
                ">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
        </header>
        
        <!-- Info Header -->
        <div style="
            background: rgba(255, 255, 255, 0.9);
            margin: 10px;
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            font-size: 0.85rem;
        ">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap; gap: 5px;">
                <div style="display: flex; align-items: center; gap: 6px; flex: 1; min-width: 140px;">
                    <i class="fas fa-calendar-day" style="color: #667eea; width: 16px; font-size: 0.8rem;"></i>
                    <span id="currentDateTOP" style="font-size: 0.8rem;">${formatDateDisplay(new Date())}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; flex: 1; min-width: 140px;">
                    <i class="fas fa-user" style="color: #667eea; width: 16px; font-size: 0.8rem;"></i>
                    <span id="userNameTOP" style="font-size: 0.8rem;">${currentKaryawanTOP?.nama_karyawan || '-'}</span>
                </div>
            </div>
            <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 5px;">
                <div style="display: flex; align-items: center; gap: 6px; flex: 1; min-width: 140px;">
                    <i class="fas fa-briefcase" style="color: #667eea; width: 16px; font-size: 0.8rem;"></i>
                    <span id="userPositionTOP" style="font-size: 0.8rem;">${currentKaryawanTOP?.posisi || '-'}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; flex: 1; min-width: 140px;">
                    <i class="fas fa-store" style="color: #667eea; width: 16px; font-size: 0.8rem;"></i>
                    <span id="userOutletTOP" style="font-size: 0.8rem;">${currentUserOutletTOP || '-'}</span>
                </div>
            </div>
        </div>
        
        <!-- Konten -->
        ${content}
        
        <!-- Footer -->
        <div style="
            background: rgba(255, 255, 255, 0.9);
            margin: 10px;
            border-radius: 8px;
            padding: 12px;
            text-align: center;
            color: #666;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            font-size: 0.8rem;
        ">
            <p style="margin: 0; display: flex; align-items: center; justify-content: center; gap: 5px;">
                <i class="fas fa-info-circle" style="color: #667eea; font-size: 0.8rem;"></i>
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
            background: rgba(0,0,0,0.7);
            z-index: 1100;
            align-items: center;
            justify-content: center;
            padding: 10px;
        ">
            <div style="
                background: white;
                border-radius: 10px;
                width: 100%;
                max-width: 450px;
                max-height: 85vh;
                overflow: auto;
                animation: modalSlideIn 0.3s ease;
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px;
                    border-bottom: 1px solid #f0f0f0;
                    position: sticky;
                    top: 0;
                    background: white;
                    z-index: 1;
                ">
                    <h3 style="margin: 0; color: #333; font-size: 1rem;">Preview Foto Alat</h3>
                    <button class="modal-close" onclick="document.getElementById('photoPreviewModal').style.display='none'" style="
                        background: none;
                        border: none;
                        font-size: 1.2rem;
                        cursor: pointer;
                        color: #999;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 0;
                    ">&times;</button>
                </div>
                <div style="padding: 15px;">
                    <img id="previewImage" src="" alt="Preview Foto" style="
                        width: 100%;
                        max-height: 300px;
                        object-fit: contain;
                        border-radius: 6px;
                        margin-bottom: 15px;
                    ">
                    <div style="display: flex; gap: 10px; justify-content: center; margin-top: 10px; flex-wrap: wrap;">
                        <button id="changePhotoBtn" style="
                            padding: 10px 15px;
                            background: #f0f0f0;
                            color: #666;
                            border: none;
                            border-radius: 6px;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            font-size: 0.9rem;
                            flex: 1;
                            min-width: 120px;
                            justify-content: center;
                        ">
                            <i class="fas fa-sync" style="font-size: 0.9rem;"></i> Ganti Foto
                        </button>
                        <button id="usePhotoBtn" onclick="document.getElementById('photoPreviewModal').style.display='none'" style="
                            padding: 10px 15px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            border: none;
                            border-radius: 6px;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            font-size: 0.9rem;
                            flex: 1;
                            min-width: 120px;
                            justify-content: center;
                        ">
                            <i class="fas fa-check" style="font-size: 0.9rem;"></i> Gunakan Foto
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
            background: rgba(0,0,0,0.7);
            z-index: 1100;
            align-items: center;
            justify-content: center;
            padding: 10px;
        ">
            <div style="
                background: white;
                border-radius: 10px;
                width: 100%;
                max-width: 450px;
                max-height: 85vh;
                overflow: auto;
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px;
                    border-bottom: 1px solid #f0f0f0;
                    position: sticky;
                    top: 0;
                    background: white;
                    z-index: 1;
                ">
                    <h3 style="margin: 0; color: #333; font-size: 1rem;">Pembayaran Cicilan</h3>
                    <button class="modal-close" onclick="closePaymentModal()" style="
                        background: none;
                        border: none;
                        font-size: 1.2rem;
                        cursor: pointer;
                        color: #999;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 0;
                    ">&times;</button>
                </div>
                <div style="padding: 15px;">
                    <div id="paymentInfo"></div>
                    <form id="paymentForm">
                        <div class="form-group" style="margin-bottom: 15px;">
                            <label for="cicilanKe" style="
                                display: block;
                                margin-bottom: 6px;
                                font-weight: 600;
                                color: #444;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                                font-size: 0.9rem;
                            ">
                                <i class="fas fa-list-ol" style="color: #667eea; font-size: 0.9rem;"></i>
                                Bayar Cicilan ke-
                            </label>
                            <input type="number" id="cicilanKe" min="1" required style="
                                width: 100%;
                                padding: 10px 12px;
                                border: 2px solid #e0e0e0;
                                border-radius: 6px;
                                font-size: 14px;
                                box-sizing: border-box;
                            ">
                            <small style="display: block; margin-top: 4px; color: #666; font-size: 0.8rem;">Masukkan cicilan yang akan dibayar</small>
                        </div>
                        <div class="form-group" style="margin-bottom: 15px;">
                            <label for="jumlahCicilan" style="
                                display: block;
                                margin-bottom: 6px;
                                font-weight: 600;
                                color: #444;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                                font-size: 0.9rem;
                            ">
                                <i class="fas fa-money-bill-wave" style="color: #667eea; font-size: 0.9rem;"></i>
                                Jumlah Cicilan yang Dibayar
                            </label>
                            <input type="number" id="jumlahCicilan" min="1" required style="
                                width: 100%;
                                padding: 10px 12px;
                                border: 2px solid #e0e0e0;
                                border-radius: 6px;
                                font-size: 14px;
                                box-sizing: border-box;
                            ">
                            <small style="display: block; margin-top: 4px; color: #666; font-size: 0.8rem;">Bisa bayar lebih dari 1 cicilan sekaligus</small>
                        </div>
                        <div class="form-group" style="margin-bottom: 15px;">
                            <label for="jumlahBayar" style="
                                display: block;
                                margin-bottom: 6px;
                                font-weight: 600;
                                color: #444;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                                font-size: 0.9rem;
                            ">
                                <i class="fas fa-calculator" style="color: #667eea; font-size: 0.9rem;"></i>
                                Total Bayar
                            </label>
                            <input type="text" id="jumlahBayar" readonly style="
                                width: 100%;
                                padding: 10px 12px;
                                border: 2px solid #e0e0e0;
                                border-radius: 6px;
                                font-size: 14px;
                                background: #f9f9f9;
                                box-sizing: border-box;
                            ">
                        </div>
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label for="metodeBayar" style="
                                display: block;
                                margin-bottom: 6px;
                                font-weight: 600;
                                color: #444;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                                font-size: 0.9rem;
                            ">
                                <i class="fas fa-wallet" style="color: #667eea; font-size: 0.9rem;"></i>
                                Metode Pembayaran
                            </label>
                            <select id="metodeBayar" style="
                                width: 100%;
                                padding: 10px 12px;
                                border: 2px solid #e0e0e0;
                                border-radius: 6px;
                                font-size: 14px;
                                box-sizing: border-box;
                            ">
                                <option value="cash">Cash</option>
                                <option value="transfer">Transfer</option>
                            </select>
                        </div>
                        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                            <button type="button" onclick="closePaymentModal()" style="
                                padding: 10px 20px;
                                background: #f0f0f0;
                                color: #666;
                                border: none;
                                border-radius: 6px;
                                font-weight: 600;
                                cursor: pointer;
                                font-size: 0.9rem;
                                flex: 1;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 6px;
                            ">
                                <i class="fas fa-times" style="font-size: 0.9rem;"></i> Batal
                            </button>
                            <button type="submit" style="
                                padding: 10px 20px;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                                border: none;
                                border-radius: 6px;
                                font-weight: 600;
                                cursor: pointer;
                                font-size: 0.9rem;
                                flex: 1;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 6px;
                            ">
                                <i class="fas fa-credit-card" style="font-size: 0.9rem;"></i> Bayar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        
        <style>
            @keyframes modalSlideIn {
                from { opacity: 0; transform: translateY(-30px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .status-pill {
                display: inline-block;
                padding: 3px 10px;
                border-radius: 15px;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                min-width: 85px;
                text-align: center;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
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
                height: 18px;
                background: #e0e0e0;
                border-radius: 9px;
                margin: 8px 0;
                position: relative;
                overflow: hidden;
            }
            
            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #4CAF50, #8BC34A);
                border-radius: 9px;
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
                font-size: 0.75rem;
            }
            
            /* PERBAIKAN: Container cicilan untuk kasir - FIXED */
            .cicilan-container {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-top: 10px;
                justify-content: center;
            }
            
            .cicilan-item {
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.7rem;
                font-weight: 500;
                min-width: 50px;
                max-width: 65px;
                text-align: center;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                border: 1px solid #ddd;
                box-sizing: border-box;
            }
            
            .cicilan-paid {
                background: #d4edda;
                color: #155724;
                border-color: #c3e6cb;
            }
            
            .cicilan-pending {
                background: #fff3cd;
                color: #856404;
                border-color: #ffeaa7;
            }
            
            /* PERBAIKAN: Kolom tabel yang lebih lebar */
            .table-cell-wide {
                min-width: 120px !important;
                max-width: 200px !important;
                white-space: normal !important;
                word-wrap: break-word !important;
            }
            
            /* PERBAIKAN: Untuk kasir - layout responsive */
            .kasir-status-container {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                align-items: center;
            }
            
            .kasir-status-item {
                padding: 6px 10px;
                border-radius: 6px;
                font-size: 0.8rem;
                font-weight: 600;
                min-width: 80px;
                text-align: center;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                background: white;
                border: 1px solid #f0f0f0;
            }
            
            .kasir-status-berikutnya {
                background: #e3f2fd;
                color: #1565c0;
                border-color: #bbdefb;
            }
            
            .kasir-status-selesai {
                background: #e8f5e9;
                color: #2e7d32;
                border-color: #c8e6c9;
            }
            
            /* Responsive styles */
            @media (max-width: 768px) {
                .top-page {
                    font-size: 13px !important;
                }
                
                .top-header h2 span {
                    font-size: 0.9rem !important;
                }
                
                .section-header h3 {
                    font-size: 1rem !important;
                }
                
                .form-row {
                    flex-direction: column !important;
                    gap: 15px !important;
                }
                
                .info-grid, .calculation-grid {
                    grid-template-columns: 1fr !important;
                }
                
                .card-body {
                    grid-template-columns: 1fr !important;
                }
                
                .progress-info, .summary-grid {
                    grid-template-columns: 1fr !important;
                }
                
                .payment-header {
                    flex-direction: column !important;
                    align-items: flex-start !important;
                    gap: 10px !important;
                }
                
                .btn-pay, .btn-approve, .btn-reject, .btn-view {
                    width: 100% !important;
                    justify-content: center !important;
                }
                
                .form-actions {
                    flex-direction: column !important;
                }
                
                .form-actions button {
                    width: 100% !important;
                }
                
                table {
                    font-size: 0.8rem !important;
                }
                
                th, td {
                    padding: 8px 10px !important;
                }
                
                /* PERBAIKAN untuk mobile: Lebarkan kolom status */
                .status-cell {
                    min-width: 130px !important;
                    white-space: normal !important;
                }
                
                .cicilan-item {
                    max-width: 60px !important;
                    font-size: 0.65rem !important;
                    padding: 3px 6px !important;
                    min-width: 45px !important;
                }
                
                .kasir-status-item {
                    min-width: 70px !important;
                    font-size: 0.75rem !important;
                    padding: 5px 8px !important;
                }
            }
            
            @media (max-width: 480px) {
                .top-header {
                    padding: 8px 10px !important;
                }
                
                .top-header h2 {
                    font-size: 0.9rem !important;
                }
                
                .info-item {
                    min-width: 100% !important;
                }
                
                .modal-content {
                    width: 95% !important;
                    max-height: 80vh !important;
                }
                
                /* PERBAIKAN untuk ponsel kecil */
                .status-pill {
                    min-width: 100px !important;
                    font-size: 0.7rem !important;
                    padding: 2px 8px !important;
                }
                
                .cicilan-item {
                    max-width: 55px !important;
                    font-size: 0.6rem !important;
                    padding: 2px 5px !important;
                    min-width: 40px !important;
                }
                
                .kasir-status-item {
                    min-width: 60px !important;
                    font-size: 0.7rem !important;
                    padding: 4px 6px !important;
                }
            }
            
            /* PERBAIKAN untuk layar sangat kecil */
            @media (max-width: 360px) {
                .cicilan-item {
                    max-width: 50px !important;
                    font-size: 0.55rem !important;
                    padding: 2px 4px !important;
                    min-width: 35px !important;
                }
                
                .kasir-status-container {
                    flex-direction: column !important;
                    align-items: stretch !important;
                }
                
                .kasir-status-item {
                    width: 100% !important;
                    box-sizing: border-box;
                }
            }
        </style>
    `;
    
    document.body.appendChild(topPage);
    setupTOPEvents();
}

// [3] Buat konten untuk Barberman
function createBarbermanTOPContent() {
    return `
        <div style="margin: 10px;">
            <!-- Form Pengajuan -->
            <div style="
                background: white;
                margin-bottom: 15px;
                border-radius: 10px;
                padding: 15px;
                box-shadow: 0 3px 10px rgba(0,0,0,0.1);
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #f0f0f0;
                ">
                    <h3 style="margin: 0; color: #333; font-size: 1rem; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-plus-circle" style="color: #FF9800; font-size: 0.9rem;"></i>
                        Pengajuan Alat Baru
                    </h3>
                </div>
                <div>
                    <form id="topForm">
                        <!-- LINE 1: Nama Alat -->
                        <div style="margin-bottom: 15px;">
                            <label for="namaAlat" style="
                                display: block;
                                margin-bottom: 6px;
                                font-weight: 600;
                                color: #444;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                                font-size: 0.9rem;
                            ">
                                <i class="fas fa-toolbox" style="color: #667eea; font-size: 0.9rem;"></i>
                                Nama Alat
                            </label>
                            <input type="text" id="namaAlat" placeholder="Contoh: Hair Clipper Philips" required style="
                                width: 100%;
                                padding: 10px 12px;
                                border: 2px solid #e0e0e0;
                                border-radius: 6px;
                                font-size: 14px;
                                box-sizing: border-box;
                            ">
                        </div>
                        
                        <!-- LINE 2: Harga Alat -->
                        <div style="margin-bottom: 15px;">
                            <label for="hargaAlat" style="
                                display: block;
                                margin-bottom: 6px;
                                font-weight: 600;
                                color: #444;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                                font-size: 0.9rem;
                            ">
                                <i class="fas fa-tag" style="color: #667eea; font-size: 0.9rem;"></i>
                                Harga Alat (Maks Rp ${TOP_CONFIG.MAX_HARGA.toLocaleString('id-ID')})
                            </label>
                            <input type="number" id="hargaAlat" min="1000" max="${TOP_CONFIG.MAX_HARGA}" step="500" placeholder="Contoh: 350000" required style="
                                width: 100%;
                                padding: 10px 12px;
                                border: 2px solid #e0e0e0;
                                border-radius: 6px;
                                font-size: 14px;
                                box-sizing: border-box;
                            ">
                        </div>
                        
                        <!-- LINE 3: Foto Alat -->
                        <div style="margin-bottom: 15px;">
                            <label for="fotoAlat" style="
                                display: block;
                                margin-bottom: 6px;
                                font-weight: 600;
                                color: #444;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                                font-size: 0.9rem;
                            ">
                                <i class="fas fa-camera" style="color: #667eea; font-size: 0.9rem;"></i>
                                Foto Alat
                            </label>
                            <div id="uploadArea" style="
                                border: 2px dashed #667eea;
                                border-radius: 6px;
                                padding: 20px;
                                text-align: center;
                                cursor: pointer;
                                transition: all 0.3s;
                                background: rgba(102, 126, 234, 0.05);
                            ">
                                <i class="fas fa-cloud-upload-alt" style="font-size: 2rem; color: #667eea; margin-bottom: 8px;"></i>
                                <p style="margin: 3px 0; color: #666; font-size: 0.9rem;">Klik untuk upload foto alat</p>
                                <p style="font-size: 0.8rem; color: #999;">Format: JPG, PNG (Maks 5MB)</p>
                                <input type="file" id="fotoAlat" accept="image/*" hidden>
                            </div>
                            <div id="photoPreview" style="
                                position: relative;
                                margin-top: 10px;
                                display: none;
                            ">
                                <img id="previewThumbnail" src="" alt="Preview" style="
                                    width: 100%;
                                    max-height: 150px;
                                    object-fit: contain;
                                    border-radius: 6px;
                                    border: 2px solid #e0e0e0;
                                ">
                                <button type="button" id="removePhotoBtn" style="
                                    position: absolute;
                                    top: -8px;
                                    right: -8px;
                                    background: #ff4757;
                                    color: white;
                                    border: none;
                                    border-radius: 50%;
                                    width: 26px;
                                    height: 26px;
                                    cursor: pointer;
                                    font-size: 12px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                ">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- LINE 4: Periode Cicilan -->
                        <div style="margin-bottom: 20px;">
                            <label for="periodeCicilan" style="
                                display: block;
                                margin-bottom: 6px;
                                font-weight: 600;
                                color: #444;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                                font-size: 0.9rem;
                            ">
                                <i class="fas fa-calendar-alt" style="color: #667eea; font-size: 0.9rem;"></i>
                                Periode Cicilan (1-24 X)
                            </label>
                            <select id="periodeCicilan" required style="
                                width: 100%;
                                padding: 10px 12px;
                                border: 2px solid #e0e0e0;
                                border-radius: 6px;
                                font-size: 14px;
                                box-sizing: border-box;
                            ">
                                <option value="">Pilih periode...</option>
                                ${Array.from({length: TOP_CONFIG.MAX_PERIODE}, (_, i) => 
                                    `<option value="${i+1}">${i+1} X</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <!-- Auto Calculation -->
                        <div style="
                            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                            border-radius: 8px;
                            padding: 15px;
                            margin: 15px 0;
                        ">
                            <h4 style="margin: 0 0 12px 0; color: #333; display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                                <i class="fas fa-calculator" style="color: #667eea; font-size: 0.9rem;"></i>
                                Perhitungan Cicilan
                            </h4>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                                <div style="
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    padding: 10px;
                                    background: white;
                                    border-radius: 6px;
                                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                                ">
                                    <span style="color: #666; font-weight: 500; font-size: 0.85rem;">Harga Alat:</span>
                                    <span id="calcHarga" style="font-weight: 600; color: #333; font-size: 0.85rem;">Rp 0</span>
                                </div>
                                <div style="
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    padding: 10px;
                                    background: white;
                                    border-radius: 6px;
                                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                                ">
                                    <span style="color: #666; font-weight: 500; font-size: 0.85rem;">Subsidi (20%):</span>
                                    <span id="calcSubsidi" style="font-weight: 600; color: #333; font-size: 0.85rem;">Rp 0</span>
                                </div>
                                <div style="
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    padding: 10px;
                                    background: white;
                                    border-radius: 6px;
                                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                                ">
                                    <span style="color: #666; font-weight: 500; font-size: 0.85rem;">Total Cicilan:</span>
                                    <span id="calcTotalCicilan" style="font-weight: 600; color: #ff9800; font-size: 0.9rem;">Rp 0</span>
                                </div>
                                <div style="
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    padding: 10px;
                                    background: white;
                                    border-radius: 6px;
                                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                                ">
                                    <span style="color: #666; font-weight: 500; font-size: 0.85rem;">Cicilan per X:</span>
                                    <span id="calcPerBulan" style="font-weight: 600; color: #ff9800; font-size: 0.9rem;">Rp 0 / X</span>
                                </div>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <button type="button" id="resetFormBtn" style="
                                padding: 10px 15px;
                                background: #f0f0f0;
                                color: #666;
                                border: none;
                                border-radius: 6px;
                                font-weight: 600;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                                font-size: 0.9rem;
                                flex: 1;
                                justify-content: center;
                            ">
                                <i class="fas fa-redo" style="font-size: 0.9rem;"></i> Reset
                            </button>
                            <button type="submit" id="submitTOPBtn" disabled style="
                                padding: 10px 15px;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                                border: none;
                                border-radius: 6px;
                                font-weight: 600;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                                font-size: 0.9rem;
                                flex: 1;
                                justify-content: center;
                            ">
                                <i class="fas fa-paper-plane" style="font-size: 0.9rem;"></i> Ajukan TOP
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- Riwayat Pengajuan -->
            <div style="
                background: white;
                border-radius: 10px;
                padding: 15px;
                box-shadow: 0 3px 10px rgba(0,0,0,0.1);
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #f0f0f0;
                ">
                    <h3 style="margin: 0; color: #333; font-size: 1rem; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-history" style="color: #FF9800; font-size: 0.9rem;"></i>
                        Riwayat Pengajuan TOP
                    </h3>
                    <button onclick="loadMyTOPRiwayat()" style="
                        background: #4CAF50;
                        color: white;
                        border: none;
                        width: 34px;
                        height: 34px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        font-size: 0.9rem;
                    ">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
                <div>
                    <div class="loading" id="loadingHistory" style="text-align: center; padding: 20px; color: #666; font-size: 0.9rem;">
                        <i class="fas fa-spinner fa-spin" style="margin-right: 8px; color: #667eea; font-size: 0.9rem;"></i>
                        Memuat riwayat...
                    </div>
                    <div style="overflow-x: auto;">
                        <table id="topHistoryTable" style="
                            width: 100%;
                            border-collapse: collapse;
                            background: white;
                            border-radius: 8px;
                            overflow: hidden;
                            display: none;
                            font-size: 0.85rem;
                        ">
                            <thead>
                                <tr>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; text-align: left; font-weight: 600; font-size: 0.8rem;">Tanggal</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; text-align: left; font-weight: 600; font-size: 0.8rem;">Alat</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; text-align: left; font-weight: 600; font-size: 0.8rem;">Harga</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; text-align: left; font-weight: 600; font-size: 0.8rem;">Periode</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; text-align: left; font-weight: 600; font-size: 0.8rem;">Cicilan/X</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; text-align: left; font-weight: 600; font-size: 0.8rem; min-width: 140px;">Status & Progress</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; text-align: left; font-weight: 600; font-size: 0.8rem;">Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="topHistoryBody">
                                <!-- Data akan diisi -->
                            </tbody>
                        </table>
                    </div>
                    <div id="noHistoryData" style="text-align: center; padding: 30px 15px; color: #666; display: none;">
                        <i class="fas fa-inbox" style="font-size: 2rem; color: #ddd; margin-bottom: 10px;"></i>
                        <p style="margin: 0; font-size: 0.9rem;">Belum ada pengajuan TOP</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// [4] Buat konten untuk Owner
function createOwnerTOPContent() {
    return `
        <div style="margin: 10px;">
            <!-- Filter -->
            <div style="
                background: white;
                border-radius: 10px;
                padding: 15px;
                margin-bottom: 15px;
                box-shadow: 0 3px 10px rgba(0,0,0,0.1);
            ">
                <div style="display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 150px;">
                        <label for="filterOutletOwnerTOP" style="
                            display: block;
                            margin-bottom: 6px;
                            font-weight: 600;
                            color: #444;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            font-size: 0.9rem;
                        ">
                            <i class="fas fa-store" style="color: #667eea; font-size: 0.9rem;"></i>
                            Outlet:
                        </label>
                        <select id="filterOutletOwnerTOP" style="
                            width: 100%;
                            padding: 10px 12px;
                            border: 2px solid #e0e0e0;
                            border-radius: 6px;
                            font-size: 14px;
                            box-sizing: border-box;
                        ">
                            <option value="all">Semua Outlet</option>
                        </select>
                    </div>
                    <div style="flex: 1; min-width: 150px;">
                        <label for="filterStatusOwnerTOP" style="
                            display: block;
                            margin-bottom: 6px;
                            font-weight: 600;
                            color: #444;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            font-size: 0.9rem;
                        ">
                            <i class="fas fa-filter" style="color: #667eea; font-size: 0.9rem;"></i>
                            Status:
                        </label>
                        <select id="filterStatusOwnerTOP" style="
                            width: 100%;
                            padding: 10px 12px;
                            border: 2px solid #e0e0e0;
                            border-radius: 6px;
                            font-size: 14px;
                            box-sizing: border-box;
                        ">
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="all">Semua Status</option>
                        </select>
                    </div>
                    <button onclick="loadTOPForOwner()" style="
                        padding: 10px 20px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        height: 40px;
                        font-size: 0.9rem;
                        flex-shrink: 0;
                    ">
                        <i class="fas fa-filter" style="font-size: 0.9rem;"></i> Terapkan
                    </button>
                </div>
            </div>
            
            <!-- Pengajuan Menunggu Approval -->
            <div style="
                background: white;
                border-radius: 10px;
                padding: 15px;
                margin-bottom: 15px;
                box-shadow: 0 3px 10px rgba(0,0,0,0.1);
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #f0f0f0;
                ">
                    <h3 style="margin: 0; color: #333; font-size: 1rem; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-clock" style="color: #FF9800; font-size: 0.9rem;"></i>
                        Pengajuan Menunggu Approval
                    </h3>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span id="pendingCountTOP" style="
                            background: #ff9800;
                            color: white;
                            padding: 3px 10px;
                            border-radius: 15px;
                            font-size: 0.8rem;
                            font-weight: 600;
                        ">0 pengajuan</span>
                    </div>
                </div>
                <div>
                    <div class="loading" id="loadingPending" style="text-align: center; padding: 20px; color: #666; font-size: 0.9rem;">
                        <i class="fas fa-spinner fa-spin" style="margin-right: 8px; color: #667eea; font-size: 0.9rem;"></i>
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
                padding: 15px;
                box-shadow: 0 3px 10px rgba(0,0,0,0.1);
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #f0f0f0;
                ">
                    <h3 style="margin: 0; color: #333; font-size: 1rem; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-history" style="color: #FF9800; font-size: 0.9rem;"></i>
                        Riwayat Semua TOP
                    </h3>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <small style="color: #666; font-size: 0.8rem;">Termasuk yang lunas</small>
                        <button onclick="loadTOPForOwner()" style="
                            background: #4CAF50;
                            color: white;
                            border: none;
                            width: 34px;
                            height: 34px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            cursor: pointer;
                            font-size: 0.9rem;
                        ">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>
                <div>
                    <div class="loading" id="loadingAllHistory" style="text-align: center; padding: 20px; color: #666; font-size: 0.9rem;">
                        <i class="fas fa-spinner fa-spin" style="margin-right: 8px; color: #667eea; font-size: 0.9rem;"></i>
                        Memuat riwayat...
                    </div>
                    <div style="overflow-x: auto;">
                        <table id="allHistoryTable" style="
                            width: 100%;
                            border-collapse: collapse;
                            background: white;
                            border-radius: 8px;
                            overflow: hidden;
                            display: none;
                            font-size: 0.85rem;
                            table-layout: fixed;
                        ">
                            <thead>
                                <tr>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; text-align: left; font-weight: 600; font-size: 0.8rem; width: 90px;">Tanggal</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; text-align: left; font-weight: 600; font-size: 0.8rem; width: 100px;">Outlet</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; text-align: left; font-weight: 600; font-size: 0.8rem; width: 100px;">Karyawan</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; text-align: left; font-weight: 600; font-size: 0.8rem; min-width: 120px;">Alat</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; text-align: left; font-weight: 600; font-size: 0.8rem; width: 100px;">Harga</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; text-align: left; font-weight: 600; font-size: 0.8rem; width: 80px;">Periode</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; text-align: left; font-weight: 600; font-size: 0.8rem; min-width: 140px;" class="table-cell-wide">Status</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; text-align: left; font-weight: 600; font-size: 0.8rem; min-width: 150px;" class="table-cell-wide">Progress</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; text-align: left; font-weight: 600; font-size: 0.8rem; width: 100px;">Aksi</th>
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

// [5] Buat konten untuk Kasir
function createKasirTOPContent() {
    return `
        <div style="margin: 10px;">
            <!-- Daftar TOP untuk Pembayaran -->
            <div style="
                background: white;
                border-radius: 10px;
                padding: 15px;
                margin-bottom: 15px;
                box-shadow: 0 3px 10px rgba(0,0,0,0.1);
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #f0f0f0;
                ">
                    <h3 style="margin: 0; color: #333; font-size: 1rem; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-credit-card" style="color: #FF9800; font-size: 0.9rem;"></i>
                        Pembayaran Cicilan TOP
                    </h3>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span id="activeTopCount" style="
                            background: #4CAF50;
                            color: white;
                            padding: 3px 10px;
                            border-radius: 15px;
                            font-size: 0.8rem;
                            font-weight: 600;
                        ">0 TOP aktif</span>
                    </div>
                </div>
                <div>
                    <div class="loading" id="loadingPayment" style="text-align: center; padding: 20px; color: #666; font-size: 0.9rem;">
                        <i class="fas fa-spinner fa-spin" style="margin-right: 8px; color: #667eea; font-size: 0.9rem;"></i>
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
                padding: 15px;
                box-shadow: 0 3px 10px rgba(0,0,0,0.1);
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #f0f0f0;
                ">
                    <h3 style="margin: 0; color: #333; font-size: 1rem; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-receipt" style="color: #FF9800; font-size: 0.9rem;"></i>
                        Riwayat Pembayaran
                    </h3>
                    <button onclick="loadTOPForKasir()" style="
                        background: #4CAF50;
                        color: white;
                        border: none;
                        width: 34px;
                        height: 34px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        font-size: 0.9rem;
                    ">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
                <div>
                    <div class="loading" id="loadingPaymentHistory" style="text-align: center; padding: 20px; color: #666; font-size: 0.9rem;">
                        <i class="fas fa-spinner fa-spin" style="margin-right: 8px; color: #667eea; font-size: 0.9rem;"></i>
                        Memuat riwayat...
                    </div>
                    <div style="overflow-x: auto;">
                        <table id="paymentHistoryTable" style="
                            width: 100%;
                            border-collapse: collapse;
                            background: white;
                            border-radius: 8px;
                            overflow: hidden;
                            display: none;
                            font-size: 0.85rem;
                        ">
                            <thead>
                                <tr>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; text-align: left; font-weight: 600; font-size: 0.8rem;">Tanggal</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; text-align: left; font-weight: 600; font-size: 0.8rem;">Barberman</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; text-align: left; font-weight: 600; font-size: 0.8rem;">Alat</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; text-align: left; font-weight: 600; font-size: 0.8rem;">Cicilan ke</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; text-align: left; font-weight: 600; font-size: 0.8rem;">Jumlah</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; text-align: left; font-weight: 600; font-size: 0.8rem;">Penerima</th>
                                    <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; text-align: left; font-weight: 600; font-size: 0.8rem;">Sisa</th>
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
    
    // Modal events
    setupModalEvents();
}

// [7] Setup modal events
function setupModalEvents() {
    // Close semua modal dengan class modal-close
    document.querySelectorAll('.modal-close').forEach(btn => {
        if (btn.id !== 'removePhotoBtn') { // Jangan include remove photo button
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        }
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
    if (uploadArea) {
        uploadArea.addEventListener('click', () => fileInput.click());
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', handlePhotoUpload);
    }
    
    // Form submission
    form.addEventListener('submit', handleTOPSubmission);
    
    // Reset form
    const resetBtn = document.getElementById('resetFormBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetTOPForm);
    }
    
    // Remove photo
    const removeBtn = document.getElementById('removePhotoBtn');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            selectedPhotoFile = null;
            if (previewArea) previewArea.style.display = 'none';
            if (uploadArea) uploadArea.style.display = 'block';
            if (fileInput) fileInput.value = '';
            calculateTOP(); // Update submit button state
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
    const changeBtn = document.getElementById('changePhotoBtn');
    if (changeBtn) {
        changeBtn.onclick = () => {
            modal.style.display = 'none';
            document.getElementById('fotoAlat').click();
        };
    }
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
    const cicilanPerKali = periode > 0 ? totalCicilan / periode : 0;
    
    // Update display
    const calcHarga = document.getElementById('calcHarga');
    const calcSubsidi = document.getElementById('calcSubsidi');
    const calcTotalCicilan = document.getElementById('calcTotalCicilan');
    const calcPerBulan = document.getElementById('calcPerBulan');
    
    if (calcHarga) calcHarga.textContent = formatRupiah(harga);
    if (calcSubsidi) calcSubsidi.textContent = formatRupiah(subsidi);
    if (calcTotalCicilan) calcTotalCicilan.textContent = formatRupiah(totalCicilan);
    if (calcPerBulan) calcPerBulan.textContent = formatRupiah(cicilanPerKali) + ' / X';
    
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

// [13] Handle TOP submission dengan fallback jika upload gagal
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
        
        let publicUrl = null;
        
        // Coba upload foto (dengan error handling)
        try {
            const fileName = `top_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('top_photos')
                .upload(fileName, selectedPhotoFile);
            
            if (!uploadError && uploadData) {
                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('top_photos')
                    .getPublicUrl(fileName);
                
                publicUrl = urlData?.publicUrl || null;
            }
        } catch (uploadErr) {
            console.warn('Upload foto gagal, lanjut tanpa foto:', uploadErr);
            publicUrl = null;
        }
        
        // Calculate values
        const subsidi = hargaAlat * TOP_CONFIG.SUBSIDI_PERCENT;
        const totalCicilan = hargaAlat - subsidi;
        const cicilanPerKali = totalCicilan / periodeCicilan;
        
        // Insert ke database
        const topData = {
            batch_id: topBatchId,
            karyawan: currentKaryawanTOP.nama_karyawan,
            outlet: currentUserOutletTOP,
            nama_alat: namaAlat,
            harga_alat: hargaAlat,
            foto_url: publicUrl,
            periode_cicilan: periodeCicilan,
            subsidi: subsidi,
            total_cicilan: totalCicilan,
            cicilan_per_periode: cicilanPerKali,
            status: 'pending',
            sisa_cicilan: totalCicilan,
            pembayaran: [],
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('top_program')
            .insert([topData]);
        
        if (error) throw error;
        
        // Success
        alert('✅ Pengajuan TOP berhasil dikirim!' + (publicUrl ? '' : '\n\nCatatan: Foto tidak tersimpan karena error upload.'));
        
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
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Ajukan TOP';
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
            tbody.innerHTML = `<tr><td colspan="7" style="padding: 15px; text-align: center; color: #666; font-size: 0.9rem;">Gagal memuat data</td></tr>`;
        }
    } finally {
        const loadingEl = document.getElementById('loadingHistory');
        if (loadingEl) loadingEl.style.display = 'none';
    }
}

// [15] Display riwayat Barberman - PERBAIKAN: Link foto untuk semua status termasuk LUNAS
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
        
        // Status text
        let statusText = getTOPStatusText(top);
        let progressText = '';
        
        if (top.status === 'lunas') {
            statusText = 'LUNAS';
            progressText = '100% selesai';
        } else if (top.status.startsWith('cicilan_')) {
            const cicilanKe = parseInt(top.status.split('_')[1]) || 0;
            const persentase = Math.round((cicilanKe / top.periode_cicilan) * 100);
            statusText = `Cicilan ${cicilanKe}`;
            progressText = `${cicilanKe}/${top.periode_cicilan} (${persentase}%)`;
        }
        
        // PERBAIKAN: Tampilkan link foto untuk SEMUA status, termasuk LUNAS
        const fotoLink = top.foto_url ? 
            `<small><a href="${top.foto_url}" target="_blank" style="color: #667eea; font-size: 0.75rem; display: block; margin-top: 2px;">Lihat foto</a></small>` : 
            '';
        
        html += `
            <tr style="${index % 2 === 0 ? 'background: #f9f9f9;' : ''}">
                <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-size: 0.8rem;">
                    ${formatDate(createdDate)}<br>
                    <small style="color: #999; font-size: 0.75rem;">${createdDate.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</small>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-size: 0.8rem;">
                    <div style="font-weight: 500;">${top.nama_alat}</div>
                    ${fotoLink}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-size: 0.8rem;">${formatRupiah(top.harga_alat)}</td>
                <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-size: 0.8rem;">${top.periode_cicilan} X</td>
                <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-size: 0.8rem;">${formatRupiah(top.cicilan_per_periode)} / X</td>
                <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-size: 0.8rem; min-width: 140px;" class="table-cell-wide">
                    <span class="status-pill ${getTOPStatusClass(top.status)}">
                        ${statusText}
                    </span>
                    ${top.status !== 'pending' && top.status !== 'rejected' ? `
                        <div style="margin-top: 4px; font-size: 0.75rem; color: #666;">
                            ${progressText}
                        </div>
                    ` : ''}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-size: 0.8rem;">
                    <button onclick="showTOPDetail('${top.id}')" style="
                        padding: 4px 8px;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 0.75rem;
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                    ">
                        <i class="fas fa-eye" style="font-size: 0.7rem;"></i>
                    </button>
                    ${top.status === 'pending' ? `
                        <button onclick="cancelTOP('${top.id}')" style="
                            padding: 4px 8px;
                            background: #ff4757;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 0.75rem;
                            display: inline-flex;
                            align-items: center;
                            gap: 4px;
                        ">
                            <i class="fas fa-times" style="font-size: 0.7rem;"></i>
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
        
        // Build query untuk SEMUA DATA (termasuk yang lunas)
        let allQuery = supabase
            .from('top_program')
            .select('*')
            .order('created_at', { ascending: false });
        
        // Build query untuk PENDING (filtered)
        let pendingQuery = supabase
            .from('top_program')
            .select('*')
            .order('created_at', { ascending: false });
        
        // Apply filters untuk all history (semua data termasuk lunas)
        if (outletFilter !== 'all') {
            allQuery = allQuery.eq('outlet', outletFilter);
            pendingQuery = pendingQuery.eq('outlet', outletFilter);
        }
        
        // Untuk pending section: hanya tampilkan pending jika filter status bukan "all"
        if (statusFilter !== 'all') {
            pendingQuery = pendingQuery.eq('status', statusFilter);
        } else {
            pendingQuery = pendingQuery.eq('status', 'pending'); // Default untuk pending section
        }
        
        // Execute queries
        const [{ data: pendingData, error: pendingError }, { data: allData, error: allError }] = await Promise.all([
            pendingQuery,
            allQuery
        ]);
        
        if (pendingError) throw pendingError;
        if (allError) throw allError;
        
        // Display data
        displayPendingTOP(pendingData || []);
        displayAllTOPRiwayat(allData || []);
        
        // Load outlet options
        await loadOutletDropdownForTOP(allData || []);
        
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
            <div style="text-align: center; padding: 30px 15px; color: #666;">
                <i class="fas fa-check-circle" style="font-size: 2rem; color: #ddd; margin-bottom: 10px;"></i>
                <h4 style="margin: 0 0 8px 0; color: #666; font-size: 0.95rem;">Tidak ada pengajuan pending</h4>
                <p style="margin: 0; color: #999; font-size: 0.85rem;">Semua pengajuan sudah diproses</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    pendingList.forEach(top => {
        const createdDate = new Date(top.created_at);
        
        // PERBAIKAN: Tampilkan link foto untuk semua
        const fotoPreview = top.foto_url ? `
            <div style="flex-shrink: 0;">
                <img src="${top.foto_url}" alt="Foto Alat" onclick="previewImage('${top.foto_url}')" style="
                    width: 60px;
                    height: 60px;
                    object-fit: cover;
                    border-radius: 6px;
                    cursor: pointer;
                    border: 2px solid #f0f0f0;
                ">
            </div>
        ` : '';
        
        html += `
            <div style="
                background: white;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 15px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                border-left: 4px solid #ff9800;
            " data-top-id="${top.id}">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 12px;
                    gap: 10px;
                ">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 5px 0; color: #333; font-size: 0.95rem;">${top.nama_alat}</h4>
                        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                            <span style="font-size: 0.8rem; color: #999;">${formatDate(createdDate)}</span>
                            <span style="
                                background: #667eea;
                                color: white;
                                padding: 2px 8px;
                                border-radius: 12px;
                                font-size: 0.75rem;
                            ">
                                <i class="fas fa-store" style="font-size: 0.7rem;"></i> ${top.outlet}
                            </span>
                            <span style="font-size: 0.8rem; color: #666;">
                                <i class="fas fa-user" style="color: #667eea;"></i> ${top.karyawan}
                            </span>
                        </div>
                    </div>
                    
                    ${fotoPreview}
                </div>
                
                <div style="
                    background: #f8f9fa;
                    padding: 12px;
                    border-radius: 6px;
                    margin-bottom: 15px;
                    font-size: 0.85rem;
                ">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #666;">Harga:</span>
                            <span style="font-weight: 600;">${formatRupiah(top.harga_alat)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #666;">Periode:</span>
                            <span style="font-weight: 600;">${top.periode_cicilan} X</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #666;">Subsidi 20%:</span>
                            <span style="color: #4CAF50; font-weight: 600;">${formatRupiah(top.subsidi)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #666;">Total Cicilan:</span>
                            <span style="color: #ff9800; font-weight: 600;">${formatRupiah(top.total_cicilan)}</span>
                        </div>
                    </div>
                    <div style="text-align: center; padding: 8px; background: white; border-radius: 4px;">
                        <span style="color: #666; font-size: 0.8rem;">Cicilan per X:</span>
                        <span style="color: #667eea; font-weight: 700; font-size: 1rem;">${formatRupiah(top.cicilan_per_periode)} / X</span>
                    </div>
                </div>
                
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button onclick="approveTOP('${top.id}')" style="
                        padding: 8px 15px;
                        background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        font-size: 0.85rem;
                        flex: 1;
                        justify-content: center;
                    ">
                        <i class="fas fa-check" style="font-size: 0.8rem;"></i> Approve
                    </button>
                    <button onclick="rejectTOP('${top.id}')" style="
                        padding: 8px 15px;
                        background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%);
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        font-size: 0.85rem;
                        flex: 1;
                        justify-content: center;
                    ">
                        <i class="fas fa-times" style="font-size: 0.8rem;"></i> Reject
                    </button>
                    <button onclick="showTOPDetail('${top.id}')" style="
                        padding: 8px 15px;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        font-size: 0.85rem;
                        flex-shrink: 0;
                        width: 40px;
                        justify-content: center;
                    ">
                        <i class="fas fa-eye" style="font-size: 0.8rem;"></i>
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

// [20] Display all TOP riwayat untuk Owner - PERBAIKAN: Link foto untuk semua status termasuk LUNAS
function displayAllTOPRiwayat(topList) {
    const tbody = document.getElementById('allHistoryBody');
    const tableEl = document.getElementById('allHistoryTable');
    
    if (!tbody) return;
    
    if (!topList || topList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="padding: 20px; text-align: center; color: #666; font-size: 0.9rem;">
                    <i class="fas fa-history"></i>
                    Tidak ada data TOP
                </td>
            </tr>
        `;
        if (tableEl) tableEl.style.display = 'table';
        return;
    }
    
    let html = '';
    
    topList.forEach((top, index) => {
        const createdDate = new Date(top.created_at);
        const progress = calculateProgress(top);
        
        // PERBAIKAN: Progress text yang lebih jelas
        let progressText = progress.text;
        let progressPercentage = progress.percentage;
        
        if (top.status === 'lunas') {
            progressText = 'LUNAS 100%';
            progressPercentage = 100;
        }
        
        // PERBAIKAN: Tampilkan link foto untuk SEMUA status, termasuk LUNAS
        const fotoLink = top.foto_url ? 
            `<small><a href="${top.foto_url}" target="_blank" style="color: #667eea; font-size: 0.75rem; display: block; margin-top: 2px;">foto</a></small>` : 
            '';
        
        html += `
            <tr style="${index % 2 === 0 ? 'background: #f9f9f9;' : ''}">
                <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-size: 0.8rem;">
                    ${formatDate(createdDate)}<br>
                    <small style="color: #999; font-size: 0.75rem;">${createdDate.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</small>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-size: 0.8rem;">${top.outlet}</td>
                <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-size: 0.8rem;">${top.karyawan}</td>
                <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-size: 0.8rem;">
                    <div style="font-weight: 500;">${top.nama_alat}</div>
                    ${fotoLink}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-size: 0.8rem;">${formatRupiah(top.harga_alat)}</td>
                <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-size: 0.8rem;">${top.periode_cicilan} X</td>
                <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-size: 0.8rem; min-width: 140px;" class="table-cell-wide">
                    <span class="status-pill ${getTOPStatusClass(top.status)}">
                        ${getTOPStatusText(top)}
                    </span>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-size: 0.8rem; min-width: 150px;" class="table-cell-wide">
                    <div style="margin-top: 4px;">
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${progressPercentage}%"></div>
                            <div class="progress-text">${progressText}</div>
                        </div>
                    </div>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-size: 0.8rem;">
                    <button onclick="showTOPDetail('${top.id}')" style="
                        padding: 4px 8px;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 0.75rem;
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                    ">
                        <i class="fas fa-eye" style="font-size: 0.7rem;"></i>
                    </button>
                    ${top.status === 'pending' ? `
                        <button onclick="approveTOP('${top.id}')" style="
                            padding: 4px 8px;
                            background: #4CAF50;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 0.75rem;
                            display: inline-flex;
                            align-items: center;
                            gap: 4px;
                        ">
                            <i class="fas fa-check" style="font-size: 0.7rem;"></i>
                        </button>
                        <button onclick="rejectTOP('${top.id}')" style="
                            padding: 4px 8px;
                            background: #ff4757;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 0.75rem;
                            display: inline-flex;
                            align-items: center;
                            gap: 4px;
                        ">
                            <i class="fas fa-times" style="font-size: 0.7rem;"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    if (tableEl) tableEl.style.display = 'table';
}

// [21] Load outlet dropdown untuk Owner
async function loadOutletDropdownForTOP(topList) {
    const select = document.getElementById('filterOutletOwnerTOP');
    if (!select) return;
    
    try {
        // Query distinct outlets dari database
        const { data: outletsData, error } = await supabase
            .from('top_program')
            .select('outlet')
            .not('outlet', 'is', null);
        
        if (error) {
            console.error('Error loading outlets:', error);
            // Fallback: use provided topList
            const outlets = [...new Set(topList.map(top => top.outlet).filter(Boolean))];
            updateOutletDropdown(outlets);
            return;
        }
        
        // Get unique outlets
        const outlets = [...new Set(outletsData.map(top => top.outlet).filter(Boolean))];
        updateOutletDropdown(outlets);
        
    } catch (error) {
        console.error('Error loading outlets:', error);
        // Fallback: use provided topList
        const outlets = [...new Set(topList.map(top => top.outlet).filter(Boolean))];
        updateOutletDropdown(outlets);
    }
    
    function updateOutletDropdown(outlets) {
        let options = '<option value="all">Semua Outlet</option>';
        
        outlets.forEach(outlet => {
            options += `<option value="${outlet}">${outlet}</option>`;
        });
        
        select.innerHTML = options;
    }
}

// [22] Load data untuk Kasir - DIPERBAIKI: Tampilkan yang lunas juga
async function loadTOPForKasir() {
    try {
        const loadingPayment = document.getElementById('loadingPayment');
        const loadingHistory = document.getElementById('loadingPaymentHistory');
        
        if (loadingPayment) loadingPayment.style.display = 'block';
        if (loadingHistory) loadingHistory.style.display = 'block';
        
        // Get TOP untuk outlet yang sama dengan kasir - SEMUA STATUS termasuk lunas
        const { data: topList, error } = await supabase
            .from('top_program')
            .select('*')
            .eq('outlet', currentUserOutletTOP)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Tampilkan semua data (termasuk lunas) untuk payment list
        const allTOPForDisplay = (topList || []).filter(top => 
            top.status !== 'pending' && 
            top.status !== 'rejected'
        );
        
        // Display
        displayTOPForPayment(allTOPForDisplay);
        displayPaymentHistory(topList || []);
        
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

// [23] Display TOP untuk pembayaran (Kasir) - PERBAIKAN BESAR: Layout responsive untuk status
function displayTOPForPayment(topList) {
    const container = document.getElementById('topPaymentList');
    const countEl = document.getElementById('activeTopCount');
    
    if (!container) return;
    
    // Hitung yang belum lunas untuk count
    const notLunasCount = topList.filter(top => top.status !== 'lunas').length;
    
    if (countEl) {
        countEl.textContent = `${notLunasCount} TOP aktif`;
    }
    
    if (topList.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px 15px; color: #666;">
                <i class="fas fa-check-circle" style="font-size: 2rem; color: #ddd; margin-bottom: 10px;"></i>
                <h4 style="margin: 0 0 8px 0; color: #666; font-size: 0.95rem;">Tidak ada TOP</h4>
                <p style="margin: 0; color: #999; font-size: 0.85rem;">Belum ada data TOP untuk outlet ini</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    topList.forEach(top => {
        const progress = calculateProgress(top);
        const nextCicilan = getNextCicilan(top);
        
        // PERBAIKAN: Buat daftar cicilan yang lebih kompak dengan size lebih kecil
        const cicilanItems = [];
        const totalCicilan = top.periode_cicilan;
        const currentCicilan = top.status.startsWith('cicilan_') ? parseInt(top.status.split('_')[1]) : 0;
        
        // Buat 6 item cicilan pertama
        for (let i = 1; i <= Math.min(totalCicilan, 6); i++) {
            const isPaid = i <= currentCicilan || top.status === 'lunas';
            const cicilanText = i === 1 ? 'Cicilan 1' : `Cicilan ${i}`;
            
            // PERBAIKAN: Ukuran lebih kecil untuk "Cicilan 1"
            const cicilanClass = i === 1 ? 'cicilan-item cicilan-1' : 'cicilan-item';
            
            cicilanItems.push(`
                <div class="${cicilanClass} ${isPaid ? 'cicilan-paid' : 'cicilan-pending'}" 
                     title="${cicilanText} ${isPaid ? 'Sudah bayar' : 'Belum bayar'}">
                    ${i === 1 ? 'Cicilan 1' : i}
                </div>
            `);
        }
        
        // PERBAIKAN: Layout status yang tidak keluar container
        const statusInfo = top.status === 'lunas' ? 
            `<div class="kasir-status-container">
                <div class="kasir-status-item kasir-status-selesai">
                    Selesai
                </div>
            </div>` : 
            `<div class="kasir-status-container">
                <div class="kasir-status-item" style="background: #e3f2fd; color: #1565c0; border-color: #bbdefb;">
                    Berikutnya: Cicilan ${nextCicilan}
                </div>
            </div>`;
        
        html += `
            <div style="
                background: white;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 15px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                border-left: 4px solid ${top.status === 'lunas' ? '#28a745' : '#4CAF50'};
            " data-top-id="${top.id}">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 12px;
                    gap: 10px;
                    flex-wrap: wrap;
                ">
                    <div style="flex: 1; min-width: 200px;">
                        <h4 style="margin: 0 0 5px 0; color: #333; font-size: 0.95rem;">${top.nama_alat}</h4>
                        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                            <span style="font-size: 0.85rem; color: #666;">
                                <i class="fas fa-user" style="color: #667eea;"></i> ${top.karyawan}
                            </span>
                            <span class="${getTOPStatusClass(top.status)}" style="
                                padding: 2px 8px;
                                border-radius: 12px;
                                font-size: 0.75rem;
                                font-weight: 600;
                                min-width: 85px;
                                text-align: center;
                            ">
                                ${getTOPStatusText(top)}
                            </span>
                        </div>
                    </div>
                    ${top.status !== 'lunas' ? `
                        <button onclick="showPaymentForm('${top.id}')" style="
                            padding: 8px 15px;
                            background: linear-gradient(135deg, #FF9800 0%, #FF5722 100%);
                            color: white;
                            border: none;
                            border-radius: 6px;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            font-size: 0.85rem;
                            flex-shrink: 0;
                            min-width: 100px;
                        ">
                            <i class="fas fa-credit-card" style="font-size: 0.8rem;"></i> Bayar
                        </button>
                    ` : `
                        <span style="
                            padding: 8px 15px;
                            background: #28a745;
                            color: white;
                            border-radius: 6px;
                            font-weight: 600;
                            font-size: 0.85rem;
                            flex-shrink: 0;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            min-width: 100px;
                            justify-content: center;
                        ">
                            <i class="fas fa-check-circle" style="font-size: 0.8rem;"></i> Lunas
                        </span>
                    `}
                </div>
                
                <div>
                    <div style="margin-bottom: 15px;">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 0.85rem;">
                            <div style="background: #f8f9fa; padding: 10px; border-radius: 6px;">
                                <div style="color: #666; font-size: 0.8rem; margin-bottom: 4px;">Harga:</div>
                                <div>${formatRupiah(top.harga_alat)}</div>
                            </div>
                            <div style="background: #f8f9fa; padding: 10px; border-radius: 6px;">
                                <div style="color: #666; font-size: 0.8rem; margin-bottom: 4px;">Subsidi 20%:</div>
                                <div style="color: #4CAF50;">${formatRupiah(top.subsidi)}</div>
                            </div>
                            <div style="background: #f8f9fa; padding: 10px; border-radius: 6px;">
                                <div style="color: #666; font-size: 0.8rem; margin-bottom: 4px;">Total Cicilan:</div>
                                <div>${formatRupiah(top.total_cicilan)}</div>
                            </div>
                            <div style="background: #f8f9fa; padding: 10px; border-radius: 6px;">
                                <div style="color: #666; font-size: 0.8rem; margin-bottom: 4px;">Cicilan per X:</div>
                                <div style="color: #ff9800; font-weight: 600;">${formatRupiah(top.cicilan_per_periode)} / X</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="
                        background: #f8f9fa;
                        padding: 15px;
                        border-radius: 8px;
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                            <h5 style="margin: 0; color: #333; font-size: 0.9rem;">Progress Cicilan</h5>
                            <button onclick="showCicilanDetail('${top.id}')" style="
                                padding: 4px 10px;
                                background: transparent;
                                border: 1px solid #667eea;
                                color: #667eea;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 0.8rem;
                                display: flex;
                                align-items: center;
                                gap: 4px;
                            ">
                                <i class="fas fa-list" style="font-size: 0.7rem;"></i> Detail
                            </button>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${progress.percentage}%"></div>
                            <div class="progress-text">${progress.text}</div>
                        </div>
                        
                        <!-- PERBAIKAN: Container cicilan yang lebih rapi dan kecil -->
                        <div class="cicilan-container">
                            ${cicilanItems.join('')}
                            ${totalCicilan > 6 ? `
                                <div class="cicilan-item" style="background: #e9ecef; color: #6c757d; font-size: 0.65rem;">
                                    +${totalCicilan - 6}
                                </div>
                            ` : ''}
                        </div>
                        
                        <!-- PERBAIKAN: Layout grid untuk status info yang responsif -->
                        <div style="display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 12px; font-size: 0.85rem;">
                            <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between;">
                                <div style="
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    padding: 8px;
                                    background: white;
                                    border-radius: 6px;
                                    flex: 1;
                                    min-width: 120px;
                                ">
                                    <span style="white-space: nowrap;">Sudah Bayar:</span>
                                    <span style="color: #4CAF50; font-weight: 600;">${formatRupiah(top.total_dibayar || 0)}</span>
                                </div>
                                <div style="
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    padding: 8px;
                                    background: white;
                                    border-radius: 6px;
                                    flex: 1;
                                    min-width: 120px;
                                ">
                                    <span style="white-space: nowrap;">Sisa:</span>
                                    <span style="color: #ff9800; font-weight: 600;">${formatRupiah(top.sisa_cicilan || top.total_cicilan)}</span>
                                </div>
                            </div>
                            
                            <!-- PERBAIKAN: Status info yang responsif -->
                            <div style="
                                padding: 10px;
                                background: white;
                                border-radius: 6px;
                                border: 1px solid #f0f0f0;
                            ">
                                ${statusInfo}
                            </div>
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
                sisa_cicilan: top.sisa_cicilan || top.total_cicilan,
                status_top: top.status
            });
        });
    });
    
    // Sort by tanggal bayar (newest first)
    allPayments.sort((a, b) => new Date(b.tanggal_bayar) - new Date(a.tanggal_bayar));
    
    if (allPayments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="padding: 20px; text-align: center; color: #666; font-size: 0.9rem;">
                    <i class="fas fa-receipt"></i>
                    Belum ada riwayat pembayaran
                </td>
            </tr>
        `;
        if (tableEl) tableEl.style.display = 'table';
        return;
    }
    
    // Limit to 15 entries for mobile
    const displayPayments = allPayments.slice(0, 15);
    
    let html = '';
    
    displayPayments.forEach((payment, index) => {
        const tanggal = new Date(payment.tanggal_bayar);
        
        html += `
            <tr style="${index % 2 === 0 ? 'background: #f9f9f9;' : ''}">
                <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-size: 0.8rem;">
                    ${formatDate(tanggal)}<br>
                    <small style="color: #999; font-size: 0.75rem;">${tanggal.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</small>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-size: 0.8rem;">${payment.barberman}</td>
                <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-size: 0.8rem;">
                    <div style="font-weight: 500;">${payment.alat}</div>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-size: 0.8rem;">
                    <span style="
                        display: inline-block;
                        padding: 2px 6px;
                        background: #667eea;
                        color: white;
                        border-radius: 10px;
                        font-size: 0.75rem;
                        font-weight: 600;
                        min-width: 26px;
                        text-align: center;
                    ">${payment.cicilan_ke}</span>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-size: 0.8rem;">${formatRupiah(payment.jumlah_bayar)}</td>
                <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-size: 0.8rem;">${payment.penerima || '-'}</td>
                <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-size: 0.8rem;">${formatRupiah(payment.sisa_cicilan)}</td>
            </tr>
        `;
    });
    
    // Jika ada lebih dari 15 pembayaran, tambahkan note
    if (allPayments.length > 15) {
        html += `
            <tr style="background: #f8f9fa;">
                <td colspan="7" style="text-align: center; padding: 10px; color: #6c757d; font-style: italic; font-size: 0.8rem;">
                    <i class="fas fa-info-circle"></i> Menampilkan 15 dari ${allPayments.length} pembayaran.
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
            <div style="margin-bottom: 15px;">
                <h4 style="margin: 0 0 8px 0; color: #333; font-size: 0.95rem;">${top.nama_alat}</h4>
                <p style="margin: 0 0 12px 0; color: #666; display: flex; align-items: center; gap: 6px; font-size: 0.85rem;">
                    <i class="fas fa-user" style="color: #667eea; font-size: 0.8rem;"></i> ${top.karyawan}
                </p>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 0.85rem;">
                    <div style="background: #f8f9fa; padding: 8px; border-radius: 6px;">
                        <div style="color: #666; font-size: 0.8rem;">Cicilan per X:</div>
                        <div style="font-weight: 600;">${formatRupiah(top.cicilan_per_periode)} / X</div>
                    </div>
                    <div style="background: #f8f9fa; padding: 8px; border-radius: 6px;">
                        <div style="color: #666; font-size: 0.8rem;">Sudah Dibayar:</div>
                        <div style="font-weight: 600;">${formatRupiah(top.total_dibayar || 0)}</div>
                    </div>
                    <div style="background: #f8f9fa; padding: 8px; border-radius: 6px;">
                        <div style="color: #666; font-size: 0.8rem;">Sisa Cicilan:</div>
                        <div style="font-weight: 600;">${formatRupiah(top.sisa_cicilan || top.total_cicilan)}</div>
                    </div>
                    <div style="background: #f8f9fa; padding: 8px; border-radius: 6px;">
                        <div style="color: #666; font-size: 0.8rem;">Cicilan Berikutnya:</div>
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

// [26] Close payment modal function
function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.style.display = 'none';
        // Reset form
        const form = document.getElementById('paymentForm');
        if (form) {
            form.reset();
        }
    }
}

// [27] Calculate payment total
function calculatePaymentTotal(cicilanPerPeriode) {
    const cicilanKe = parseInt(document.getElementById('cicilanKe')?.value) || 1;
    const jumlahCicilan = parseInt(document.getElementById('jumlahCicilan')?.value) || 1;
    const jumlahBayarInput = document.getElementById('jumlahBayar');
    
    const totalBayar = cicilanPerPeriode * jumlahCicilan;
    if (jumlahBayarInput) {
        jumlahBayarInput.value = formatRupiah(totalBayar);
    }
}

// [28] Process payment
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
        
        // Close modal dan refresh
        closePaymentModal();
        
        alert(`✅ Pembayaran berhasil! Cicilan ke-${cicilanKe}-${cicilanTerakhir}`);
        await loadTOPForKasir();
        
    } catch (error) {
        console.error('Error processing payment:', error);
        alert('❌ Gagal memproses pembayaran: ' + error.message);
    }
}

// [29] Setup events untuk Owner dan Kasir
function setupOwnerEvents() {
    // Filter events sudah di-handle di HTML
}

function setupKasirEvents() {
    // Events sudah di-handle di HTML
}

// [30] Helper functions
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
        return `Cicilan ${cicilanKe}`;
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
            text: `${cicilanKe}/${top.periode_cicilan} (${Math.round(percentage)}%)`
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

// [31] Placeholder functions untuk fitur tambahan
async function showCicilanDetail(topId) {
    try {
        const { data: top, error } = await supabase
            .from('top_program')
            .select('*')
            .eq('id', topId)
            .single();
        
        if (error) throw error;
        
        const payments = top.pembayaran || [];
        let detailHtml = `<h4 style="margin: 0 0 10px 0; color: #333;">Detail Cicilan: ${top.nama_alat}</h4>`;
        detailHtml += `<p style="margin: 0 0 15px 0; color: #666;"><i class="fas fa-user"></i> ${top.karyawan}</p>`;
        
        if (payments.length === 0) {
            detailHtml += `<p style="color: #999; text-align: center; padding: 20px;">Belum ada pembayaran</p>`;
        } else {
            detailHtml += `<div style="max-height: 300px; overflow-y: auto;">`;
            payments.forEach(payment => {
                const date = new Date(payment.tanggal_bayar);
                detailHtml += `
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: 600; color: #667eea;">Cicilan ke-${payment.cicilan_ke}</span>
                            <span style="font-weight: 600;">${formatRupiah(payment.jumlah_bayar)}</span>
                        </div>
                        <div style="font-size: 0.85rem; color: #666; margin-top: 5px;">
                            <div>Tanggal: ${formatDate(date)} ${date.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</div>
                            <div>Penerima: ${payment.penerima || '-'}</div>
                            <div>Metode: ${payment.metode_bayar || 'cash'}</div>
                        </div>
                    </div>
                `;
            });
            detailHtml += `</div>`;
        }
        
        alert(detailHtml.replace(/<[^>]*>/g, '')); // Simple text alert
        
    } catch (error) {
        console.error('Error showing cicilan detail:', error);
        alert('Gagal memuat detail cicilan');
    }
}

async function showTOPDetail(topId) {
    try {
        const { data: top, error } = await supabase
            .from('top_program')
            .select('*')
            .eq('id', topId)
            .single();
        
        if (error) throw error;
        
        const createdDate = new Date(top.created_at);
        const approvedDate = top.approved_at ? new Date(top.approved_at) : null;
        const progress = calculateProgress(top);
        
        let detail = `📋 DETAIL TOP\n`;
        detail += `════════════════════\n`;
        detail += `• Alat: ${top.nama_alat}\n`;
        detail += `• Barberman: ${top.karyawan}\n`;
        detail += `• Outlet: ${top.outlet}\n`;
        detail += `• Harga: ${formatRupiah(top.harga_alat)}\n`;
        detail += `• Subsidi 20%: ${formatRupiah(top.subsidi)}\n`;
        detail += `• Total Cicilan: ${formatRupiah(top.total_cicilan)}\n`;
        detail += `• Periode: ${top.periode_cicilan} X\n`;
        detail += `• Cicilan per X: ${formatRupiah(top.cicilan_per_periode)} / X\n`;
        detail += `• Status: ${getTOPStatusText(top)}\n`;
        detail += `• Progress: ${progress.text}\n`;
        detail += `• Dibuat: ${formatDate(createdDate)}\n`;
        
        if (top.approved_by) {
            detail += `• Disetujui oleh: ${top.approved_by}\n`;
            if (approvedDate) {
                detail += `• Tanggal approve: ${formatDate(approvedDate)}\n`;
            }
        }
        
        if (top.approve_note) {
            detail += `• Catatan approve: ${top.approve_note}\n`;
        }
        
        if (top.reject_note) {
            detail += `• Alasan reject: ${top.reject_note}\n`;
        }
        
        if (top.foto_url) {
            detail += `\n📸 Foto tersedia\n`;
        }
        
        alert(detail);
        
    } catch (error) {
        console.error('Error showing TOP detail:', error);
        alert('Gagal memuat detail TOP');
    }
}

async function cancelTOP(topId) {
    if (confirm('Batalkan pengajuan TOP ini?')) {
        try {
            const { error } = await supabase
                .from('top_program')
                .update({
                    status: 'rejected',
                    reject_note: 'Dibatalkan oleh pengaju',
                    approved_at: new Date().toISOString(),
                    approved_by: currentKaryawanTOP.nama_karyawan
                })
                .eq('id', topId)
                .eq('status', 'pending')
                .eq('karyawan', currentKaryawanTOP.nama_karyawan);
            
            if (error) throw error;
            
            alert('Pengajuan TOP dibatalkan!');
            await loadMyTOPRiwayat();
            
        } catch (error) {
            console.error('Error canceling TOP:', error);
            alert('Gagal membatalkan TOP: ' + error.message);
        }
    }
}

function previewImage(url) {
    window.open(url, '_blank');
}

// [32] Global functions
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
window.closePaymentModal = closePaymentModal;

// ========== END OF TOP MODULE ==========
