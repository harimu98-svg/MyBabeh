// ========== MODUL RESERVASI ==========
// ========================================

// Variabel global untuk modul reservasi
let currentKaryawanReservasi = null;
let currentUserOutletReservasi = null;
let isOwnerReservasi = false;
let isKasirReservasi = false;
let isBarbermanReservasi = false;
let reservasiData = [];
let reservasiHistoryData = [];

// ============================================
// HELPER FUNCTIONS - WA CONFIG
// ============================================

function getWAConfig() {
    return {
        apiUrl: typeof WA_API_URL !== 'undefined' ? WA_API_URL : window.WA_API_URL,
        apiKey: typeof WA_API_KEY !== 'undefined' ? WA_API_KEY : window.WA_API_KEY,
        chatId: typeof WA_CHAT_ID !== 'undefined' ? WA_CHAT_ID : window.WA_CHAT_ID,
        ownerPhone: typeof WA_OWNER_PHONE !== 'undefined' ? WA_OWNER_PHONE : window.WA_OWNER_PHONE
    };
}

// ============================================
// FUNGSI SEND WHATSAPP
// ============================================

async function sendWhatsAppNotification(phoneNumber, message) {
    try {
        if (!phoneNumber) {
            console.warn('No phone number provided');
            return false;
        }
        
        const waConfig = getWAConfig();
        
        if (!waConfig.apiUrl || !waConfig.apiKey) {
            console.warn('⚠️ WhatsApp config not available');
            return false;
        }
        
        let formattedPhone = phoneNumber.trim();
        
        if (!formattedPhone.includes('@c.us') && !formattedPhone.includes('@g.us')) {
            formattedPhone = formattedPhone.replace(/^0/, '62').replace(/^\+62/, '62').replace(/[^0-9]/g, '');
            formattedPhone += '@c.us';
        }
        
        console.log(`📱 Sending WA to: ${formattedPhone}`);
        
        const response = await fetch(waConfig.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': waConfig.apiKey
            },
            body: JSON.stringify({
                session: 'Session1',
                chatId: formattedPhone,
                text: message
            })
        });
        
        if (!response.ok) {
            throw new Error(`WhatsApp API error: ${response.status}`);
        }
        
        console.log('✅ WhatsApp notification sent to:', phoneNumber);
        return true;
        
    } catch (error) {
        console.error('❌ WhatsApp notification error:', error);
        return false;
    }
}

// ============================================
// FUNGSI UTAMA SHOW RESERVASI PAGE
// ============================================

async function showReservasiPage() {
    try {
        console.log('📅 Loading reservasi module...');
        
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
        
        currentKaryawanReservasi = {
            nama_karyawan: namaKaryawan,
            role: karyawanData.role,
            outlet: karyawanData.outlet,
            posisi: karyawanData.posisi,
            nomor_wa: karyawanData.nomor_wa
        };
        
        currentUserOutletReservasi = karyawanData.outlet;
        isOwnerReservasi = karyawanData.role === 'owner';
        isKasirReservasi = karyawanData.role === 'kasir';
        isBarbermanReservasi = karyawanData.role === 'barberman';
        
        // Sembunyikan main app, tampilkan halaman reservasi
        document.getElementById('appScreen').style.display = 'none';
        
        // Buat container halaman reservasi
        createReservasiPage();
        
        // Load data
        await loadReservasiData();
        
    } catch (error) {
        console.error('Error in showReservasiPage:', error);
        showToast(`❌ Gagal memuat halaman reservasi: ${error.message}`, 'error');
    }
}

// ============================================
// FUNGSI BUAT HALAMAN RESERVASI
// ============================================

function createReservasiPage() {
    // Hapus halaman reservasi sebelumnya jika ada
    const existingPage = document.getElementById('reservasiPage');
    if (existingPage) {
        existingPage.remove();
    }
    
    // Buat container halaman reservasi
    const reservasiPage = document.createElement('div');
    reservasiPage.id = 'reservasiPage';
    reservasiPage.className = 'reservasi-page';
    
    reservasiPage.innerHTML = `
        <!-- Header -->
        <header class="reservasi-header">
            <button class="back-btn" id="backToMainFromReservasi">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h2><i class="fas fa-calendar-check"></i> Reservasi</h2>
            <div class="header-actions">
                <button class="refresh-btn" id="refreshReservasi" title="Refresh">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
        </header>
        
        <!-- Info Header -->
        <div class="reservasi-info-header">
            <div class="info-row">
                <div class="info-item">
                    <i class="fas fa-calendar-day"></i>
                    <span id="currentDateReservasi">${new Date().toLocaleDateString('id-ID', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-user"></i>
                    <span id="userNameReservasi">${currentKaryawanReservasi?.nama_karyawan || '-'}</span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-item">
                    <i class="fas fa-briefcase"></i>
                    <span id="userPositionReservasi">${currentKaryawanReservasi?.posisi || '-'}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-store"></i>
                    <span id="userOutletReservasi">${currentUserOutletReservasi || '-'}</span>
                </div>
            </div>
        </div>
        
        <!-- Filter Section -->
        <div class="filter-section-reservasi">
            <div class="filter-row">
                <div class="filter-group">
                    <label for="filterStatusReservasi"><i class="fas fa-filter"></i> Status:</label>
                    <select id="filterStatusReservasi" class="status-select">
                        <option value="all">Semua Status</option>
                        <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
                        <option value="pembayaran_berhasil">Pembayaran Berhasil</option>
                        <option value="pembayaran_gagal">Pembayaran Gagal</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="filterDateReservasi"><i class="fas fa-calendar"></i> Periode:</label>
                    <select id="filterDateReservasi" class="date-select">
                        <option value="today">Hari Ini</option>
                        <option value="week">7 Hari Terakhir</option>
                        <option value="month">Bulan Ini</option>
                        <option value="all">Semua</option>
                    </select>
                </div>
                <button class="btn-apply-filter" id="applyFilterReservasi">
                    <i class="fas fa-filter"></i> Terapkan
                </button>
            </div>
        </div>
        
        <!-- Pending Reservasi (Menunggu Verifikasi) -->
        <div class="pending-reservasi-section">
            <div class="section-header">
                <h3><i class="fas fa-clock"></i> Menunggu Verifikasi Pembayaran</h3>
                <div class="request-stats">
                    <span id="pendingCountReservasi">0 reservasi</span>
                </div>
            </div>
            <div class="pending-reservasi-container">
                <div class="loading" id="loadingPendingReservasi">Memuat data reservasi...</div>
                <div id="pendingReservasiGrid" style="display: none;">
                    <!-- Reservasi akan diisi di sini -->
                </div>
            </div>
        </div>
        
        <!-- History Reservasi -->
        <div class="history-reservasi-section">
            <div class="section-header">
                <h3><i class="fas fa-history"></i> History Reservasi</h3>
                <button class="btn-refresh-history-round" id="refreshHistoryReservasi" title="Refresh History">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
            <div class="history-table-container">
                <div class="loading" id="loadingHistoryReservasi">Memuat history...</div>
                <div class="table-wrapper">
                    <table class="history-table horizontal-scroll" id="historyTableReservasi" style="display: none;">
                        <thead>
                            <tr>
                                <th width="100px">Tanggal</th>
                                <th width="100px">Kode</th>
                                <th width="120px">Customer</th>
                                <th width="120px">No WA</th>
                                <th width="120px">Outlet</th>
                                <th width="100px">Barberman</th>
                                <th width="100px">Layanan</th>
                                <th width="80px">Jam</th>
                                <th width="100px">Harga</th>
                                <th width="120px">Status</th>
                                <th width="120px">Verifikasi Oleh</th>
                                <th width="100px">Tgl Verifikasi</th>
                            </tr>
                        </thead>
                        <tbody id="historyBodyReservasi">
                            <!-- History akan diisi di sini -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="reservasi-footer">
            <p><i class="fas fa-info-circle"></i> 
                ${isKasirReservasi || isOwnerReservasi ? 'Verifikasi pembayaran reservasi customer' : 
                  isBarbermanReservasi ? 'Lihat reservasi yang masuk untuk Anda' : 'Lihat dan verifikasi reservasi'}
            </p>
        </div>
    `;
    
    document.body.appendChild(reservasiPage);
    
    // Setup event listeners
    setupReservasiPageEvents();
    
    // Tambahkan CSS untuk styling
    addReservasiPageStyles();
}

// ============================================
// SETUP EVENT LISTENERS
// ============================================

function setupReservasiPageEvents() {
    // Tombol kembali
    document.getElementById('backToMainFromReservasi').addEventListener('click', () => {
        document.getElementById('reservasiPage').remove();
        document.getElementById('appScreen').style.display = 'block';
    });
    
    // Tombol refresh
    document.getElementById('refreshReservasi').addEventListener('click', async () => {
        await loadReservasiData();
    });
    
    // Filter status
    document.getElementById('filterStatusReservasi').addEventListener('change', async () => {
        await loadReservasiData();
    });
    
    // Filter tanggal
    document.getElementById('filterDateReservasi').addEventListener('change', async () => {
        await loadReservasiData();
    });
    
    // Tombol apply filter
    document.getElementById('applyFilterReservasi').addEventListener('click', async () => {
        await loadReservasiData();
    });
    
    // Refresh history
    document.getElementById('refreshHistoryReservasi').addEventListener('click', async () => {
        await loadReservasiData();
    });
}

// ============================================
// LOAD DATA RESERVASI
// ============================================

async function loadReservasiData() {
    try {
        const loadingPending = document.getElementById('loadingPendingReservasi');
        const pendingGrid = document.getElementById('pendingReservasiGrid');
        const loadingHistory = document.getElementById('loadingHistoryReservasi');
        const historyTable = document.getElementById('historyTableReservasi');
        
        if (loadingPending) loadingPending.style.display = 'block';
        if (pendingGrid) pendingGrid.style.display = 'none';
        if (loadingHistory) loadingHistory.style.display = 'block';
        if (historyTable) historyTable.style.display = 'none';
        
        // Get filter values
        const statusFilter = document.getElementById('filterStatusReservasi')?.value || 'all';
        const dateFilter = document.getElementById('filterDateReservasi')?.value || 'today';
        
        // Build query
        let query = supabase
            .from('reservasi')
            .select('*')
            .order('created_at', { ascending: false });
        
        // Filter berdasarkan role
        if (isBarbermanReservasi && currentKaryawanReservasi) {
            query = query.eq('barberman', currentKaryawanReservasi.nama_karyawan);
        } else if (isKasirReservasi && currentUserOutletReservasi) {
            query = query.eq('outlet', currentUserOutletReservasi);
        }
        // Owner bisa lihat semua
        
        // Apply status filter
        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }
        
        // Apply date filter
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
        
        const { data: reservasi, error } = await query;
        
        if (error) throw error;
        
        // Pisahkan pending (menunggu_verifikasi) dan history
        const pendingReservasi = (reservasi || []).filter(item => item.status === 'menunggu_verifikasi');
        const historyReservasi = (reservasi || []).filter(item => item.status !== 'menunggu_verifikasi');
        
        // Display data
        displayPendingReservasi(pendingReservasi);
        displayHistoryReservasi(historyReservasi);
        
        // Update count
        const pendingCountEl = document.getElementById('pendingCountReservasi');
        if (pendingCountEl) {
            pendingCountEl.textContent = `${pendingReservasi.length} reservasi`;
        }
        
    } catch (error) {
        console.error('Error loading reservasi data:', error);
        showToast(`❌ Gagal memuat data reservasi: ${error.message}`, 'error');
    } finally {
        const loadingPending = document.getElementById('loadingPendingReservasi');
        const pendingGrid = document.getElementById('pendingReservasiGrid');
        const loadingHistory = document.getElementById('loadingHistoryReservasi');
        const historyTable = document.getElementById('historyTableReservasi');
        
        if (loadingPending) loadingPending.style.display = 'none';
        if (pendingGrid) pendingGrid.style.display = 'block';
        if (loadingHistory) loadingHistory.style.display = 'none';
        if (historyTable) historyTable.style.display = 'table';
    }
}

// ============================================
// DISPLAY PENDING RESERVASI
// ============================================

function displayPendingReservasi(reservasiList) {
    const pendingGrid = document.getElementById('pendingReservasiGrid');
    if (!pendingGrid) return;
    
    if (!reservasiList || reservasiList.length === 0) {
        pendingGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h4>Tidak ada reservasi menunggu verifikasi</h4>
                <p>Semua reservasi sudah diproses</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    reservasiList.forEach((reservasi, index) => {
        const createdDate = new Date(reservasi.created_at);
        const formattedDate = createdDate.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        html += `
        <div class="reservasi-card" data-reservasi-id="${reservasi.id}">
            <div class="reservasi-card-header">
                <div class="reservasi-info">
                    <div class="info-row">
                        <div class="info-item">
                            <i class="fas fa-user"></i>
                            <strong>Customer:</strong> ${reservasi.nama_customer || '-'}
                        </div>
                        <div class="info-item">
                            <i class="fab fa-whatsapp"></i>
                            <strong>WA:</strong> ${reservasi.no_wa_customer || '-'}
                        </div>
                        <div class="info-item">
                            <i class="fas fa-store"></i>
                            <strong>Outlet:</strong> ${reservasi.outlet || '-'}
                        </div>
                    </div>
                    <div class="info-row">
                        <div class="info-item">
                            <i class="fas fa-cut"></i>
                            <strong>Layanan:</strong> ${reservasi.layanan || '-'}
                        </div>
                        <div class="info-item">
                            <i class="fas fa-user-tie"></i>
                            <strong>Barberman:</strong> ${reservasi.barberman || '-'}
                        </div>
                        <div class="info-item">
                            <i class="fas fa-calendar"></i>
                            <strong>Tanggal:</strong> ${reservasi.tanggal || '-'} (${reservasi.hari || '-'})
                        </div>
                        <div class="info-item">
                            <i class="fas fa-clock"></i>
                            <strong>Jam:</strong> ${reservasi.jam || '-'}
                        </div>
                    </div>
                    <div class="info-row">
                        <div class="info-item">
                            <i class="fas fa-money-bill-wave"></i>
                            <strong>Total:</strong> <span style="color: #28a745; font-weight: 700;">Rp ${(reservasi.harga || 0).toLocaleString()}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-hashtag"></i>
                            <strong>Kode:</strong> <code>${reservasi.kode_reservasi || '-'}</code>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-clock"></i>
                            <strong>Diajukan:</strong> ${formattedDate}
                        </div>
                    </div>
                    ${reservasi.catatan ? `
                    <div class="info-row">
                        <div class="info-item" style="width: 100%;">
                            <i class="fas fa-sticky-note"></i>
                            <strong>Catatan:</strong> ${reservasi.catatan}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="reservasi-card-actions">
                <button class="btn-approve-payment" onclick="approvePayment('${reservasi.id}')">
                    <i class="fas fa-check"></i> Pembayaran Diterima
                </button>
                <button class="btn-reject-payment" onclick="rejectPayment('${reservasi.id}')">
                    <i class="fas fa-times"></i> Pembayaran Tidak Diterima
                </button>
            </div>
        </div>
        `;
    });
    
    pendingGrid.innerHTML = html;
}

// ============================================
// DISPLAY HISTORY RESERVASI
// ============================================

function displayHistoryReservasi(reservasiList) {
    const tbody = document.getElementById('historyBodyReservasi');
    const historyTable = document.getElementById('historyTableReservasi');
    
    if (!tbody || !historyTable) return;
    
    tbody.innerHTML = '';
    
    if (!reservasiList || reservasiList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="12" class="empty-message">
                    <i class="fas fa-history"></i>
                    Tidak ada history reservasi
                </td>
            </tr>
        `;
        historyTable.style.display = 'table';
        return;
    }
    
    // Batasi maksimal 15 baris
    const displayReservasi = reservasiList.slice(0, 15);
    
    displayReservasi.forEach(reservasi => {
        const createdDate = new Date(reservasi.created_at);
        const verifiedDate = reservasi.verified_at ? new Date(reservasi.verified_at) : null;
        
        // Status dengan icon
        let statusHTML = '';
        if (reservasi.status === 'pembayaran_berhasil') {
            statusHTML = `
                <span class="status-pill status-approved">
                    <i class="fas fa-check-circle"></i> Pembayaran Berhasil
                </span>
            `;
        } else if (reservasi.status === 'pembayaran_gagal') {
            statusHTML = `
                <span class="status-pill status-rejected">
                    <i class="fas fa-times-circle"></i> Pembayaran Gagal
                </span>
            `;
        } else if (reservasi.status === 'active') {
            statusHTML = `
                <span class="status-pill status-active">
                    <i class="fas fa-check-circle"></i> Active
                </span>
            `;
        } else if (reservasi.status === 'completed') {
            statusHTML = `
                <span class="status-pill status-approved">
                    <i class="fas fa-check-double"></i> Completed
                </span>
            `;
        } else if (reservasi.status === 'cancelled') {
            statusHTML = `
                <span class="status-pill status-rejected">
                    <i class="fas fa-ban"></i> Cancelled
                </span>
            `;
        } else {
            statusHTML = `
                <span class="status-pill status-pending">
                    <i class="fas fa-clock"></i> ${reservasi.status || '-'}
                </span>
            `;
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${createdDate.toLocaleDateString('id-ID')}<br><small>${createdDate.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</small></td>
            <td><code>${reservasi.kode_reservasi || '-'}</code></td>
            <td>${reservasi.nama_customer || '-'}</td>
            <td>${reservasi.no_wa_customer || '-'}</td>
            <td>${reservasi.outlet || '-'}</td>
            <td>${reservasi.barberman || '-'}</td>
            <td>${reservasi.layanan || '-'}</td>
            <td>${reservasi.jam || '-'}</td>
            <td><strong>Rp ${(reservasi.harga || 0).toLocaleString()}</strong></td>
            <td class="status-cell">${statusHTML}</td>
            <td>${reservasi.verified_by || '-'}</td>
            <td>${verifiedDate ? verifiedDate.toLocaleDateString('id-ID') : '-'}</td>
        `;
        tbody.appendChild(row);
    });
    
    historyTable.style.display = 'table';
}

// ============================================
// APPROVE PAYMENT
// ============================================

async function approvePayment(reservasiId) {
    try {
        if (!confirm('✅ Konfirmasi pembayaran diterima untuk reservasi ini?\n\nStatus akan diubah menjadi "Pembayaran Berhasil" dan notifikasi akan dikirim ke customer, barberman, dan group WA.')) {
            return;
        }
        
        // Ambil data reservasi
        const { data: reservasi, error: fetchError } = await supabase
            .from('reservasi')
            .select('*')
            .eq('id', reservasiId)
            .single();
        
        if (fetchError) throw fetchError;
        
        // Update status reservasi
        const { error: updateError } = await supabase
            .from('reservasi')
            .update({
                status: 'pembayaran_berhasil',
                verified_at: new Date().toISOString(),
                verified_by: currentKaryawanReservasi.nama_karyawan
            })
            .eq('id', reservasiId);
        
        if (updateError) throw updateError;
        
        // Kirim WhatsApp notifications
        await sendPaymentSuccessNotifications(reservasi);
        
        showToast('✅ Pembayaran berhasil diverifikasi! Notifikasi telah dikirim.', 'success');
        
        // Reload data
        await loadReservasiData();
        
    } catch (error) {
        console.error('Error approving payment:', error);
        showToast(`❌ Gagal verifikasi pembayaran: ${error.message}`, 'error');
    }
}

// ============================================
// REJECT PAYMENT
// ============================================

async function rejectPayment(reservasiId) {
    try {
        const reason = prompt('Masukkan alasan penolakan pembayaran:');
        if (reason === null) return;
        
        if (!reason.trim()) {
            showToast('⚠️ Harap masukkan alasan penolakan', 'warning');
            return;
        }
        
        if (!confirm(`❌ Konfirmasi pembayaran TIDAK diterima untuk reservasi ini?\n\nAlasan: ${reason}\n\nStatus akan diubah menjadi "Pembayaran Gagal" dan notifikasi akan dikirim.`)) {
            return;
        }
        
        // Ambil data reservasi
        const { data: reservasi, error: fetchError } = await supabase
            .from('reservasi')
            .select('*')
            .eq('id', reservasiId)
            .single();
        
        if (fetchError) throw fetchError;
        
        // Update status reservasi
        const { error: updateError } = await supabase
            .from('reservasi')
            .update({
                status: 'pembayaran_gagal',
                verified_at: new Date().toISOString(),
                verified_by: currentKaryawanReservasi.nama_karyawan,
                catatan: reservasi.catatan ? `${reservasi.catatan}\n\nAlasan penolakan: ${reason}` : `Alasan penolakan: ${reason}`
            })
            .eq('id', reservasiId);
        
        if (updateError) throw updateError;
        
        // Kirim WhatsApp notifications
        await sendPaymentRejectNotifications(reservasi, reason);
        
        showToast('❌ Pembayaran ditolak. Notifikasi telah dikirim.', 'success');
        
        // Reload data
        await loadReservasiData();
        
    } catch (error) {
        console.error('Error rejecting payment:', error);
        showToast(`❌ Gagal menolak pembayaran: ${error.message}`, 'error');
    }
}

// ============================================
// SEND PAYMENT SUCCESS NOTIFICATIONS
// ============================================

async function sendPaymentSuccessNotifications(reservasi) {
    try {
        // Dapatkan nomor WA barberman
        const { data: barberData } = await supabase
            .from('karyawan')
            .select('nomor_wa')
            .eq('nama_karyawan', reservasi.barberman)
            .single();
        
        // Dapatkan group WA outlet
        const { data: outletData } = await supabase
            .from('outlet')
            .select('group_wa')
            .eq('outlet', reservasi.outlet)
            .single();
        
        const kodeReservasi = reservasi.kode_reservasi || 'BRB-' + Date.now();
        
        // ========== PESAN UNTUK CUSTOMER ==========
        const customerMessage = `*✅ PEMBAYARAN BERHASIL DIVERIFIKASI!*

Halo *${reservasi.nama_customer}*,

Pembayaran Anda telah berhasil diverifikasi. Reservasi Anda sekarang *ACTIVE*!

📋 *Kode Reservasi:* ${kodeReservasi}
📅 *Tanggal:* ${reservasi.tanggal} (${reservasi.hari})
🕐 *Jam:* ${reservasi.jam}
✂️ *Layanan:* ${reservasi.layanan}
💇 *Barberman:* ${reservasi.barberman}
📍 *Outlet:* ${reservasi.outlet}
💰 *Total:* Rp ${(reservasi.harga || 0).toLocaleString()}

*⚠️ PENTING:*
• Pastikan Anda standby 5 menit SEBELUM waktu reservasi
• Jika lewat 15 menit belum hadir, reservasi akan otomatis dibatalkan
• Bawa bukti pembayaran saat datang

Terima kasih telah mempercayakan gaya rambut Anda kepada Babeh Barbershop! ✨

_*Babeh Barbershop - Right Man On The Right Place*_`;

        // ========== PESAN UNTUK BARBERMAN ==========
        const barbermanMessage = `*📢 PEMBAYARAN RESERVASI BERHASIL DIVERIFIKASI!*

Halo *${reservasi.barberman}*,

Pembayaran customer telah diverifikasi. Reservasi sekarang *ACTIVE*:

📋 *Kode:* ${kodeReservasi}
👤 *Customer:* ${reservasi.nama_customer}
📱 *WA Customer:* ${reservasi.no_wa_customer}
📅 *Tanggal:* ${reservasi.tanggal} (${reservasi.hari})
🕐 *Jam:* ${reservasi.jam}
✂️ *Layanan:* ${reservasi.layanan}
📍 *Outlet:* ${reservasi.outlet}
💰 *Total:* Rp ${(reservasi.harga || 0).toLocaleString()}

*⚠️ CATATAN UNTUK BARBERMAN:*
• Pastikan Anda standby 5 menit SEBELUM waktu reservasi
• Siapkan alat dan bahan yang diperlukan
• Jika customer tidak hadir 15 menit, hubungi admin

Terima kasih! 🙌`;

        // ========== PESAN UNTUK GROUP WA ==========
        const groupMessage = `*📢 PEMBAYARAN RESERVASI BERHASIL DIVERIFIKASI!*

Reservasi sekarang *ACTIVE*:

📋 *Kode:* ${kodeReservasi}
👤 *Customer:* ${reservasi.nama_customer}
📱 *WA Customer:* ${reservasi.no_wa_customer}
💇 *Barberman:* ${reservasi.barberman}
📅 *Tanggal:* ${reservasi.tanggal} (${reservasi.hari})
🕐 *Jam:* ${reservasi.jam}
✂️ *Layanan:* ${reservasi.layanan}
📍 *Outlet:* ${reservasi.outlet}
💰 *Total:* Rp ${(reservasi.harga || 0).toLocaleString()}

Mohon koordinasi untuk persiapan. Terima kasih! 🙌`;

        // Kirim ke Customer
        if (reservasi.no_wa_customer) {
            await sendWhatsAppNotification(reservasi.no_wa_customer, customerMessage);
        }
        
        // Kirim ke Barberman
        if (barberData?.nomor_wa) {
            await sendWhatsAppNotification(barberData.nomor_wa, barbermanMessage);
        }
        
        // Kirim ke Group WA
        if (outletData?.group_wa) {
            await sendWhatsAppNotification(outletData.group_wa, groupMessage);
        }
        
        console.log('✅ Semua WhatsApp notifications terkirim!');
        
    } catch (error) {
        console.error('❌ Error sending notifications:', error);
        // Jangan throw error, biarkan proses utama tetap berjalan
    }
}

// ============================================
// SEND PAYMENT REJECT NOTIFICATIONS
// ============================================

async function sendPaymentRejectNotifications(reservasi, reason) {
    try {
        // Dapatkan group WA outlet
        const { data: outletData } = await supabase
            .from('outlet')
            .select('group_wa')
            .eq('outlet', reservasi.outlet)
            .single();
        
        const kodeReservasi = reservasi.kode_reservasi || 'BRB-' + Date.now();
        
        // ========== PESAN UNTUK CUSTOMER ==========
        const customerMessage = `*❌ PEMBAYARAN GAGAL DIVERIFIKASI!*

Halo *${reservasi.nama_customer}*,

Mohon maaf, pembayaran Anda tidak dapat diverifikasi.

📋 *Kode Reservasi:* ${kodeReservasi}
📅 *Tanggal:* ${reservasi.tanggal} (${reservasi.hari})
🕐 *Jam:* ${reservasi.jam}
✂️ *Layanan:* ${reservasi.layanan}
💇 *Barberman:* ${reservasi.barberman}
📍 *Outlet:* ${reservasi.outlet}
💰 *Total:* Rp ${(reservasi.harga || 0).toLocaleString()}

*📌 Alasan Penolakan:*
${reason}

Silakan hubungi admin untuk informasi lebih lanjut atau lakukan reservasi ulang.

Terima kasih atas perhatiannya. 🙏

_*Babeh Barbershop - Right Man On The Right Place*_`;

        // ========== PESAN UNTUK GROUP WA ==========
        const groupMessage = `*❌ PEMBAYARAN RESERVASI GAGAL DIVERIFIKASI!*

Reservasi ditolak:

📋 *Kode:* ${kodeReservasi}
👤 *Customer:* ${reservasi.nama_customer}
📱 *WA Customer:* ${reservasi.no_wa_customer}
💇 *Barberman:* ${reservasi.barberman}
📅 *Tanggal:* ${reservasi.tanggal} (${reservasi.hari})
🕐 *Jam:* ${reservasi.jam}
✂️ *Layanan:* ${reservasi.layanan}
📍 *Outlet:* ${reservasi.outlet}
💰 *Total:* Rp ${(reservasi.harga || 0).toLocaleString()}

*📌 Alasan Penolakan:*
${reason}

Terima kasih. 🙌`;

        // Kirim ke Customer
        if (reservasi.no_wa_customer) {
            await sendWhatsAppNotification(reservasi.no_wa_customer, customerMessage);
        }
        
        // Kirim ke Group WA
        if (outletData?.group_wa) {
            await sendWhatsAppNotification(outletData.group_wa, groupMessage);
        }
        
        console.log('✅ WhatsApp reject notifications terkirim!');
        
    } catch (error) {
        console.error('❌ Error sending reject notifications:', error);
        // Jangan throw error, biarkan proses utama tetap berjalan
    }
}

// ============================================
// TOAST NOTIFICATION
// ============================================

function showToast(message, type = 'info') {
    const existingToast = document.getElementById('reservasiToast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.id = 'reservasiToast';
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                           type === 'error' ? 'fa-exclamation-circle' : 
                           type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
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

// ============================================
// TAMBAHKAN CSS UNTUK STYLING
// ============================================

function addReservasiPageStyles() {
    const styleId = 'reservasi-page-styles';
    
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) existingStyle.remove();
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        /* ===== RESET STYLING UNTUK SELECT ===== */
        .reservasi-page select {
            box-sizing: border-box;
            font-family: inherit;
            font-size: inherit;
            color: inherit;
        }
        
        /* ===== STYLING UMUM ===== */
        .reservasi-page {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f7fa;
            min-height: 100vh;
            padding: 20px;
            color: #333;
        }
        
        /* Header */
        .reservasi-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            margin-bottom: 20px;
        }
        
        .reservasi-header h2 {
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
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: none;
            background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            flex-shrink: 0;
        }
        
        .refresh-btn:hover {
            background: linear-gradient(135deg, #495057 0%, #343a40 100%);
            transform: translateY(-2px);
        }
        
        /* Info Header */
        .reservasi-info-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        
        .reservasi-info-header .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        
        .reservasi-info-header .info-row:last-child {
            margin-bottom: 0;
        }
        
        .reservasi-info-header .info-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
        }
        
        /* Filter Section */
        .filter-section-reservasi {
            background: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            margin-bottom: 20px;
        }
        
        .filter-section-reservasi .filter-row {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            align-items: flex-end;
        }
        
        .filter-section-reservasi .filter-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
            flex: 1;
            min-width: 150px;
        }
        
        .filter-section-reservasi .filter-group label {
            font-weight: 600;
            font-size: 13px;
            color: #495057;
        }
        
        .filter-section-reservasi select {
            padding: 8px 12px;
            border: 1px solid #ced4da;
            border-radius: 6px;
            font-size: 14px;
            background: white;
            cursor: pointer;
        }
        
        .btn-apply-filter {
            padding: 8px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s;
            height: 40px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .btn-apply-filter:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        /* Section Header */
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .section-header h3 {
            margin: 0;
            font-size: 1.2rem;
            color: #2c3e50;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .request-stats {
            font-size: 14px;
            color: #6c757d;
            font-weight: 500;
        }
        
        /* Pending Section */
        .pending-reservasi-section {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            margin-bottom: 20px;
        }
        
        .pending-reservasi-container {
            min-height: 100px;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: #6c757d;
        }
        
        .loading i {
            font-size: 2rem;
            margin-bottom: 10px;
        }
        
        .empty-state {
            text-align: center;
            padding: 40px;
            color: #6c757d;
        }
        
        .empty-state i {
            font-size: 3rem;
            color: #28a745;
            margin-bottom: 15px;
        }
        
        .empty-state h4 {
            margin: 0 0 5px 0;
            color: #333;
        }
        
        .empty-state p {
            margin: 0;
            color: #6c757d;
        }
        
        /* Reservasi Card */
        .reservasi-card {
            border: 1px solid #e9ecef;
            border-radius: 10px;
            padding: 15px 20px;
            margin-bottom: 15px;
            background: #fafbfc;
            transition: all 0.3s;
        }
        
        .reservasi-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            border-color: #667eea;
        }
        
        .reservasi-card-header {
            margin-bottom: 15px;
        }
        
        .reservasi-info .info-row {
            display: flex;
            flex-wrap: wrap;
            gap: 15px 25px;
            margin-bottom: 8px;
        }
        
        .reservasi-info .info-row:last-child {
            margin-bottom: 0;
        }
        
        .reservasi-info .info-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            color: #495057;
        }
        
        .reservasi-info .info-item i {
            color: #667eea;
            width: 18px;
            text-align: center;
        }
        
        .reservasi-info .info-item strong {
            color: #333;
        }
        
        .reservasi-info .info-item code {
            background: #f1f3f5;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            color: #495057;
        }
        
        /* Action Buttons */
        .reservasi-card-actions {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            padding-top: 15px;
            border-top: 1px solid #e9ecef;
        }
        
        .btn-approve-payment {
            padding: 10px 24px;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .btn-approve-payment:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
        }
        
        .btn-reject-payment {
            padding: 10px 24px;
            background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .btn-reject-payment:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
        }
        
        /* History Section */
        .history-reservasi-section {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        }
        
        .btn-refresh-history-round {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: none;
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            flex-shrink: 0;
        }
        
        .btn-refresh-history-round:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 123, 255, 0.4);
        }
        
        .btn-refresh-history-round i {
            font-size: 14px;
        }
        
        /* Status Pills */
        .status-pill {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            text-transform: capitalize;
            white-space: nowrap;
        }
        
        .status-pill i {
            font-size: 10px;
        }
        
        .status-approved {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .status-pending {
            background-color: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }
        
        .status-rejected {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .status-active {
            background-color: #cce5ff;
            color: #004085;
            border: 1px solid #b8daff;
        }
        
        .status-cell {
            min-width: 120px;
        }
        
        /* Footer */
        .reservasi-footer {
            margin-top: 20px;
            padding: 15px;
            background: white;
            border-radius: 10px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        }
        
        .reservasi-footer i {
            margin-right: 8px;
            color: #667eea;
        }
        
        /* History Table */
        .history-table-container {
            overflow-x: auto;
        }
        
        .table-wrapper {
            overflow-x: auto;
        }
        
        .history-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }
        
        .history-table th {
            background: #f8f9fa;
            padding: 10px 12px;
            text-align: left;
            font-weight: 600;
            color: #495057;
            border-bottom: 2px solid #dee2e6;
            white-space: nowrap;
        }
        
        .history-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #e9ecef;
            vertical-align: middle;
        }
        
        .history-table tr:hover td {
            background: #f8f9fa;
        }
        
        .history-table .empty-message {
            text-align: center;
            padding: 30px;
            color: #6c757d;
        }
        
        .history-table .empty-message i {
            font-size: 2rem;
            display: block;
            margin-bottom: 10px;
            color: #adb5bd;
        }
        
        .history-table code {
            background: #f1f3f5;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            color: #495057;
            white-space: nowrap;
        }
        
        /* Toast */
        .toast {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            z-index: 9999;
            opacity: 0;
            transition: all 0.3s ease;
            max-width: 90%;
            min-width: 300px;
        }
        
        .toast.show {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        
        .toast-success {
            border-left: 4px solid #28a745;
        }
        
        .toast-error {
            border-left: 4px solid #dc3545;
        }
        
        .toast-warning {
            border-left: 4px solid #ffc107;
        }
        
        .toast-info {
            border-left: 4px solid #17a2b8;
        }
        
        .toast-content {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
        }
        
        .toast-content i {
            font-size: 1.2rem;
        }
        
        .toast-success .toast-content i {
            color: #28a745;
        }
        
        .toast-error .toast-content i {
            color: #dc3545;
        }
        
        .toast-warning .toast-content i {
            color: #ffc107;
        }
        
        .toast-info .toast-content i {
            color: #17a2b8;
        }
        
        .toast-close {
            background: none;
            border: none;
            color: #6c757d;
            cursor: pointer;
            font-size: 1rem;
            padding: 0 5px;
        }
        
        .toast-close:hover {
            color: #333;
        }
        
        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
            .reservasi-page {
                padding: 10px;
            }
            
            .reservasi-info-header .info-row {
                flex-direction: column;
                gap: 8px;
            }
            
            .filter-section-reservasi .filter-row {
                flex-direction: column;
                gap: 10px;
            }
            
            .filter-section-reservasi .filter-group {
                width: 100%;
                min-width: unset;
            }
            
            .btn-apply-filter {
                width: 100%;
                justify-content: center;
            }
            
            .reservasi-card-actions {
                flex-direction: column;
            }
            
            .btn-approve-payment,
            .btn-reject-payment {
                width: 100%;
                justify-content: center;
            }
            
            .history-table {
                font-size: 12px;
            }
            
            .history-table th,
            .history-table td {
                padding: 6px 8px;
            }
            
            .section-header {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .toast {
                min-width: unset;
                width: 90%;
                bottom: 20px;
                padding: 12px 18px;
            }
            
            .toast-content {
                font-size: 13px;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// ============================================
// GLOBAL FUNCTIONS
// ============================================

window.showReservasiPage = showReservasiPage;
window.approvePayment = approvePayment;
window.rejectPayment = rejectPayment;
window.loadReservasiData = loadReservasiData;

console.log('📁 Modul Reservasi siap digunakan!');

// ========== END OF FILE ==========
