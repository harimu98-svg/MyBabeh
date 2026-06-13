// ========== CLOCK IN & CLOCK OUT MODULE ==========
// ==================================================

// Variabel global
let currentKaryawanClock = null;
let currentUserOutletClock = null;
let isOwnerClock = false;
let realtimeSubscriptionClock = null;
let currentPosition = { lat: null, lng: null };
let karyawanListClock = [];

// [1] Fungsi utama untuk tampilkan halaman Clock In/Out
async function showClockPage() {
    try {
        // Bersihkan subscription lama jika ada
        if (realtimeSubscriptionClock) {
            supabase.removeChannel(realtimeSubscriptionClock);
            realtimeSubscriptionClock = null;
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
            .select('role, outlet, nama_karyawan, posisi, nomor_wa, photo_url')
            .eq('nama_karyawan', namaKaryawan)
            .single();
        
        if (!karyawanData) {
            alert('Data karyawan tidak ditemukan!');
            return;
        }
        
        currentKaryawanClock = {
            nama_karyawan: namaKaryawan,
            role: karyawanData.role,
            outlet: karyawanData.outlet,
            posisi: karyawanData.posisi,
            nomor_wa: karyawanData.nomor_wa,
            photo_url: karyawanData.photo_url
        };
        
        currentUserOutletClock = karyawanData.outlet;
        isOwnerClock = karyawanData.role === 'owner';
        
        // Sembunyikan main app, tampilkan halaman clock
        document.getElementById('appScreen').style.display = 'none';
        
        // Buat container halaman clock
        createClockPage();
        
        // Load data awal
        await loadInitialDataClock();
        
        // Setup realtime subscription untuk update otomatis
        setupRealtimeSubscriptionClock();
        
        // Mulai update GPS
        startGPSUpdate();
        
    } catch (error) {
        console.error('Error in showClockPage:', error);
        alert('Gagal memuat halaman Clock In/Out!');
    }
}

// [2] Fungsi untuk buat halaman clock
function createClockPage() {
    // Hapus halaman sebelumnya jika ada
    const existingPage = document.getElementById('clockPage');
    if (existingPage) {
        existingPage.remove();
    }
    
    // Buat container halaman clock
    const clockPage = document.createElement('div');
    clockPage.id = 'clockPage';
    clockPage.className = 'clock-page';
    clockPage.innerHTML = `
        <!-- Header -->
        <header class="clock-header">
            <button class="back-btn" id="backToMainFromClock">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h2><i class="fas fa-clock"></i> Clock In / Out</h2>
            <div class="header-actions">
                <span class="realtime-badge" id="realtimeBadgeClock">
                    <i class="fas fa-circle"></i> Live
                </span>
                <button class="refresh-btn" id="refreshClock" title="Refresh Manual">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
        </header>
        
        <!-- Info Header -->
        <div class="clock-info-header">
            <div class="info-row">
                <div class="info-item">
                    <i class="fas fa-user"></i>
                    <span id="userNameClock">${currentKaryawanClock?.nama_karyawan || '-'}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-store"></i>
                    <span id="userOutletClock">${currentUserOutletClock || '-'}</span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-item">
                    <i class="fas fa-tag"></i>
                    <span id="userRoleClock">${currentKaryawanClock?.role || '-'}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-briefcase"></i>
                    <span id="userPosisiClock">${currentKaryawanClock?.posisi || '-'}</span>
                </div>
            </div>
        </div>
        
        <!-- Date Time Display - 3 kolom seperti absensi -->
        <div class="clock-datetime-grid">
            <div class="datetime-card">
                <div class="datetime-label">Hari</div>
                <div id="clockHari" class="datetime-value">-</div>
            </div>
            <div class="datetime-card">
                <div class="datetime-label">Tanggal</div>
                <div id="clockTanggal" class="datetime-value">-</div>
            </div>
            <div class="datetime-card">
                <div class="datetime-label">Jam</div>
                <div id="clockJam" class="datetime-value">-</div>
            </div>
        </div>
        
        <!-- Main Form Area - Mirip absensi_GPS -->
        <div class="clock-form-container">
            <!-- Outlet Select (hanya untuk Owner) -->
            ${isOwnerClock ? `
            <div class="form-group">
                <label><i class="fas fa-store"></i> Outlet</label>
                <select id="clockOutletSelect" class="clock-select">
                    <option value="">Pilih outlet...</option>
                </select>
            </div>
            ` : ''}
            
            <!-- Karyawan Select -->
            <div class="form-group">
                <label><i class="fas fa-user"></i> Nama Karyawan</label>
                <select id="clockKaryawanSelect" class="clock-select">
                    <option value="">Pilih karyawan...</option>
                </select>
            </div>
            
            <!-- Tipe Absen -->
            <div class="form-group">
                <label><i class="fas fa-exchange-alt"></i> Tipe Absen</label>
                <select id="clockTipeAbsen" class="clock-select">
                    <option value="">Pilih tipe absen...</option>
                    <option value="Clock In">🟢 Clock In (Masuk)</option>
                    <option value="Clock Out">🔴 Clock Out (Pulang)</option>
                </select>
            </div>
            
            <!-- Info Posisi & Foto - 2 kolom -->
            <div class="clock-info-grid">
                <div class="clock-info-card">
                    <div class="info-card-label"><i class="fas fa-briefcase"></i> Posisi</div>
                    <div id="clockPosisi" class="info-card-value">-</div>
                    <div class="info-card-label mt-2"><i class="fas fa-tag"></i> Tipe Absen</div>
                    <div id="clockTipeDisplay" class="info-card-value">-</div>
                </div>
                <div class="clock-info-card text-center">
                    <div class="info-card-label"><i class="fas fa-camera"></i> Foto</div>
                    <img id="clockFoto" src="assets/logo.jpg" class="clock-foto" alt="Foto Karyawan">
                </div>
            </div>
            
            <!-- GPS Status & Location -->
            <div class="clock-gps-grid">
                <div class="gps-card">
                    <div class="gps-label"><i class="fas fa-satellite-dish"></i> Status GPS</div>
                    <div id="clockStatusGPS" class="gps-value status-waiting">
                        <i class="fas fa-spinner fa-pulse"></i> Mendeteksi...
                    </div>
                </div>
                <div class="gps-card">
                    <div class="gps-label"><i class="fas fa-map-marker-alt"></i> Latitude / Longitude</div>
                    <div id="clockLatLong" class="gps-value">-</div>
                </div>
            </div>
            
            <!-- PIN Input -->
            <div class="form-group pin-group">
                <label><i class="fas fa-key"></i> PIN 4 Digit</label>
                <input type="password" 
                       id="clockPinInput" 
                       maxlength="4"
                       inputmode="numeric"
                       pattern="[0-9]{4}"
                       class="clock-pin-input"
                       placeholder="****"
                       autocomplete="off">
                <div class="pin-hint">Masukkan PIN 4 digit karyawan</div>
            </div>
            
            <!-- Submit Button -->
            <button id="clockSubmitBtn" class="clock-submit-btn">
                <i class="fas fa-check-circle"></i> SUBMIT ABSENSI
            </button>
            
            <!-- Status Message -->
            <div id="clockStatusMsg" class="clock-status-msg"></div>
        </div>
        
        <!-- Petunjuk -->
        <div class="clock-instructions">
            <h4><i class="fas fa-info-circle"></i> Petunjuk:</h4>
            <ul>
                <li>Pilih karyawan yang akan absen</li>
                <li>Pilih tipe absen (Clock In/Out)</li>
                <li>Pastikan GPS aktif untuk validasi lokasi</li>
                <li>Masukkan PIN 4 digit karyawan</li>
                <li>Klik SUBMIT ABSENSI untuk proses</li>
                <li>Notifikasi akan dikirim ke WhatsApp</li>
            </ul>
        </div>
        
        <!-- Footer -->
        <div class="clock-footer">
            <p>Data diperbarui: <span id="lastUpdateTimeClock">-</span></p>
        </div>
    `;
    
    document.body.appendChild(clockPage);
    
    // Setup event listeners
    setupClockPageEvents();
    
    // Mulai update jam realtime
    startClockUpdate();
    
    // Tambahkan CSS styling
    addClockPageStyles();
}

// [3] Setup event listeners
function setupClockPageEvents() {
    // Tombol kembali
    const backBtn = document.getElementById('backToMainFromClock');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (realtimeSubscriptionClock) {
                supabase.removeChannel(realtimeSubscriptionClock);
                realtimeSubscriptionClock = null;
            }
            document.getElementById('clockPage').remove();
            document.getElementById('appScreen').style.display = 'block';
        });
    }
    
    // Tombol refresh
    const refreshBtn = document.getElementById('refreshClock');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.classList.add('loading');
            await loadKaryawanDropdownClock();
            refreshBtn.classList.remove('loading');
            showClockStatus('Data diperbarui', 'success');
        });
    }
    
    // Outlet change (untuk owner)
    const outletSelect = document.getElementById('clockOutletSelect');
    if (outletSelect) {
        outletSelect.addEventListener('change', () => {
            loadKaryawanDropdownClock();
        });
    }
    
    // Karyawan select change
    const karyawanSelect = document.getElementById('clockKaryawanSelect');
    if (karyawanSelect) {
        karyawanSelect.addEventListener('change', (e) => {
            const selectedOption = e.target.selectedOptions[0];
            if (selectedOption && selectedOption.value) {
                document.getElementById('clockPosisi').textContent = selectedOption.dataset.posisi || '-';
                const fotoUrl = selectedOption.dataset.foto;
                if (fotoUrl && fotoUrl !== 'null') {
                    document.getElementById('clockFoto').src = fotoUrl;
                } else {
                    document.getElementById('clockFoto').src = 'assets/logo.jpg';
                }
                document.getElementById('clockTipeDisplay').textContent = 
                    document.getElementById('clockTipeAbsen').value || '-';
                
                // Focus ke PIN input
                const tipeAbsen = document.getElementById('clockTipeAbsen').value;
                if (tipeAbsen) {
                    document.getElementById('clockPinInput').focus();
                }
            } else {
                document.getElementById('clockPosisi').textContent = '-';
                document.getElementById('clockFoto').src = 'assets/logo.jpg';
                document.getElementById('clockTipeDisplay').textContent = '-';
            }
        });
    }
    
    // Tipe absen change
    const tipeAbsen = document.getElementById('clockTipeAbsen');
    if (tipeAbsen) {
        tipeAbsen.addEventListener('change', (e) => {
            const tipeDisplay = document.getElementById('clockTipeDisplay');
            if (tipeDisplay) {
                tipeDisplay.textContent = e.target.value || '-';
            }
            
            // Focus ke PIN jika karyawan sudah dipilih
            const karyawanSelect = document.getElementById('clockKaryawanSelect');
            if (karyawanSelect && karyawanSelect.value && e.target.value) {
                document.getElementById('clockPinInput').focus();
            }
        });
    }
    
    // PIN input - hanya angka
    const pinInput = document.getElementById('clockPinInput');
    if (pinInput) {
        pinInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
        
        pinInput.addEventListener('keydown', (e) => {
            if ([46, 8, 9, 27, 13].includes(e.keyCode) ||
                (e.keyCode === 65 && e.ctrlKey === true) ||
                (e.keyCode === 67 && e.ctrlKey === true) ||
                (e.keyCode === 86 && e.ctrlKey === true) ||
                (e.keyCode === 88 && e.ctrlKey === true) ||
                (e.keyCode >= 35 && e.keyCode <= 39)) {
                return;
            }
            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && 
                (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
            }
        });
        
        pinInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitClockAttendance();
            }
        });
    }
    
    // Submit button
    const submitBtn = document.getElementById('clockSubmitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => submitClockAttendance());
    }
}

// [4] Start realtime clock update
function startClockUpdate() {
    updateClockDateTime();
    setInterval(updateClockDateTime, 1000);
}

function updateClockDateTime() {
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const hari = days[now.getDay()];
    const tanggal = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const jam = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    const hariEl = document.getElementById('clockHari');
    const tanggalEl = document.getElementById('clockTanggal');
    const jamEl = document.getElementById('clockJam');
    
    if (hariEl) hariEl.textContent = hari;
    if (tanggalEl) tanggalEl.textContent = tanggal;
    if (jamEl) jamEl.textContent = jam;
}

// [5] Start GPS update
function startGPSUpdate() {
    updateGPSLocation();
    setInterval(updateGPSLocation, 30000); // Update setiap 30 detik
}

function updateGPSLocation() {
    const statusEl = document.getElementById('clockStatusGPS');
    const latLongEl = document.getElementById('clockLatLong');
    
    if (!navigator.geolocation) {
        if (statusEl) {
            statusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> GPS Tidak Tersedia';
            statusEl.className = 'gps-value status-error';
        }
        if (latLongEl) latLongEl.textContent = 'Tidak didukung';
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            currentPosition.lat = position.coords.latitude;
            currentPosition.lng = position.coords.longitude;
            
            if (statusEl) {
                statusEl.innerHTML = '<i class="fas fa-check-circle"></i> GPS Aktif';
                statusEl.className = 'gps-value status-active';
            }
            if (latLongEl) {
                latLongEl.textContent = `${currentPosition.lat.toFixed(6)} / ${currentPosition.lng.toFixed(6)}`;
            }
        },
        (error) => {
            console.error('GPS Error:', error);
            if (statusEl) {
                statusEl.innerHTML = '<i class="fas fa-times-circle"></i> GPS Tidak Aktif';
                statusEl.className = 'gps-value status-error';
            }
            if (latLongEl) latLongEl.textContent = 'Aktifkan GPS';
            
            let errorMsg = '';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg = 'Izin lokasi ditolak';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg = 'Lokasi tidak tersedia';
                    break;
                case error.TIMEOUT:
                    errorMsg = 'Timeout';
                    break;
            }
            showClockStatus(`GPS: ${errorMsg}`, 'error');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// [6] Load initial data
async function loadInitialDataClock() {
    try {
        if (isOwnerClock) {
            await loadOutletDropdownClock();
        }
        await loadKaryawanDropdownClock();
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

// [7] Load outlet dropdown
async function loadOutletDropdownClock() {
    const select = document.getElementById('clockOutletSelect');
    if (!select) return;
    
    try {
        const { data: outlets, error } = await supabase
            .from('outlet')
            .select('outlet')
            .order('outlet');
        
        if (error) throw error;
        
        let options = '<option value="">Pilih outlet...</option>';
        if (outlets) {
            outlets.forEach(outlet => {
                options += `<option value="${outlet.outlet}">${outlet.outlet}</option>`;
            });
        }
        select.innerHTML = options;
        
        if (currentUserOutletClock) {
            select.value = currentUserOutletClock;
        }
    } catch (error) {
        console.error('Error loading outlets:', error);
    }
}

// [8] Load karyawan dropdown
async function loadKaryawanDropdownClock() {
    const select = document.getElementById('clockKaryawanSelect');
    if (!select) return;
    
    try {
        let outletFilter = currentUserOutletClock;
        
        if (isOwnerClock) {
            const outletSelect = document.getElementById('clockOutletSelect');
            if (outletSelect && outletSelect.value) {
                outletFilter = outletSelect.value;
            }
        }
        
        if (!outletFilter) {
            select.innerHTML = '<option value="">Pilih outlet terlebih dahulu</option>';
            return;
        }
        
        let query = supabase
            .from('karyawan')
            .select('nama_karyawan, posisi, nomor_wa, photo_url, pin')
            .eq('outlet', outletFilter)
            .eq('status', 'active')
            .order('nama_karyawan');
        
        // Jika bukan owner, hanya tampilkan dirinya sendiri
        if (!isOwnerClock) {
            query = query.eq('nama_karyawan', currentKaryawanClock.nama_karyawan);
        }
        
        const { data: karyawan, error } = await query;
        
        if (error) throw error;
        
        karyawanListClock = karyawan || [];
        
        if (karyawanListClock.length === 0) {
            select.innerHTML = '<option value="">Tidak ada karyawan</option>';
            return;
        }
        
        let options = '<option value="">Pilih karyawan...</option>';
        karyawanListClock.forEach(k => {
            options += `<option value="${k.nama_karyawan}" 
                               data-posisi="${k.posisi || '-'}"
                               data-nomor-wa="${k.nomor_wa || ''}"
                               data-foto="${k.photo_url || 'assets/logo.jpg'}"
                               data-pin="${k.pin || ''}">
                            ${k.nama_karyawan} ${k.posisi ? `(${k.posisi})` : ''}
                        </option>`;
        });
        
        select.innerHTML = options;
        
        // Jika bukan owner dan hanya 1 karyawan, auto select
        if (!isOwnerClock && karyawanListClock.length === 1) {
            select.value = karyawanListClock[0].nama_karyawan;
            // Trigger change event
            const event = new Event('change');
            select.dispatchEvent(event);
        }
        
    } catch (error) {
        console.error('Error loading karyawan:', error);
        select.innerHTML = '<option value="">Error loading data</option>';
    }
}

// [9] Verify PIN dari database
async function verifyPINClock(karyawanNama, enteredPIN) {
    try {
        const karyawan = karyawanListClock.find(k => k.nama_karyawan === karyawanNama);
        if (!karyawan) {
            console.error('Karyawan not found');
            return false;
        }
        
        // Ambil PIN dari database langsung
        const { data, error } = await supabase
            .from('karyawan')
            .select('pin')
            .eq('nama_karyawan', karyawanNama)
            .single();
        
        if (error) {
            console.error('Error fetching PIN:', error);
            return false;
        }
        
        const storedPIN = data?.pin || '';
        const isValid = storedPIN === enteredPIN;
        console.log(`PIN validation: ${isValid ? 'Valid' : 'Invalid'}`);
        
        return isValid;
        
    } catch (error) {
        console.error('PIN verification error:', error);
        return false;
    }
}

// [10] Cek status absensi hari ini
async function checkAttendanceStatusClock(nomorWA) {
    try {
        const today = new Date();
        const tanggal = formatDateClock(today);
        const id_uniq = `${nomorWA}%${tanggal}`;
        
        const { data, error } = await supabase
            .from('absen')
            .select('clockin, clockout')
            .eq('id_uniq', id_uniq)
            .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
            console.error('Error checking attendance:', error);
            return null;
        }
        
        return data || null;
        
    } catch (error) {
        console.error('Error checking attendance:', error);
        return null;
    }
}

// [11] Submit attendance
async function submitClockAttendance() {
    const submitBtn = document.getElementById('clockSubmitBtn');
    const karyawanSelect = document.getElementById('clockKaryawanSelect');
    const tipeAbsen = document.getElementById('clockTipeAbsen');
    const pinInput = document.getElementById('clockPinInput');
    
    const karyawanNama = karyawanSelect?.value;
    const absenType = tipeAbsen?.value;
    const enteredPIN = pinInput?.value;
    
    // Validasi
    if (!karyawanNama) {
        showClockStatus('Pilih karyawan terlebih dahulu', 'error');
        karyawanSelect?.focus();
        return;
    }
    
    if (!absenType) {
        showClockStatus('Pilih tipe absen (Clock In/Out)', 'error');
        tipeAbsen?.focus();
        return;
    }
    
    if (!enteredPIN || enteredPIN.length !== 4 || !/^\d{4}$/.test(enteredPIN)) {
        showClockStatus('PIN harus 4 digit angka', 'error');
        pinInput?.focus();
        return;
    }
    
    // Cek GPS
    if (!currentPosition.lat || !currentPosition.lng) {
        showClockStatus('Aktifkan GPS untuk melanjutkan absensi', 'error');
        updateGPSLocation();
        return;
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Memproses...';
    
    try {
        // Verifikasi PIN
        const isPINValid = await verifyPINClock(karyawanNama, enteredPIN);
        if (!isPINValid) {
            showClockStatus('PIN salah! Silakan coba lagi.', 'error');
            pinInput.value = '';
            pinInput.focus();
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> SUBMIT ABSENSI';
            return;
        }
        
        // Cari data karyawan lengkap
        const karyawan = karyawanListClock.find(k => k.nama_karyawan === karyawanNama);
        if (!karyawan) {
            showClockStatus('Data karyawan tidak ditemukan', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> SUBMIT ABSENSI';
            return;
        }
        
        const nomorWA = karyawan.nomor_wa;
        const todayData = await checkAttendanceStatusClock(nomorWA);
        
        // Validasi berdasarkan tipe absen
        let isValid = false;
        let action = null;
        let errorMessage = null;
        
        if (absenType === 'Clock In') {
            if (!todayData) {
                isValid = true;
                action = 'insert';
            } else if (todayData.clockin && !todayData.clockout) {
                isValid = false;
                errorMessage = 'Karyawan sudah Clock In hari ini';
            } else if (todayData.clockin && todayData.clockout) {
                isValid = false;
                errorMessage = 'Karyawan sudah Clock Out hari ini';
            }
        } else if (absenType === 'Clock Out') {
            if (!todayData) {
                isValid = false;
                errorMessage = 'Karyawan belum Clock In hari ini';
            } else if (todayData.clockin && !todayData.clockout) {
                isValid = true;
                action = 'update';
            } else if (todayData.clockin && todayData.clockout) {
                isValid = false;
                errorMessage = 'Karyawan sudah Clock Out hari ini';
            }
        }
        
        // Kirim notifikasi WhatsApp (selalu kirim)
        await sendWhatsAppNotificationClock({
            karyawan: karyawan,
            absenType: absenType,
            isValid: isValid,
            errorMessage: errorMessage,
            existingData: todayData,
            location: currentPosition
        });
        
        // Jika valid, simpan ke database
        if (isValid) {
            const success = await saveAttendanceClock(karyawan, absenType, action, currentPosition);
            if (success) {
                showClockStatus(`✅ Absensi ${absenType} berhasil! Notifikasi telah dikirim ke WhatsApp.`, 'success');
                
                // Reset form setelah 2 detik
                setTimeout(() => {
                    if (!isOwnerClock) {
                        // Reset tipe absen dan PIN saja
                        if (tipeAbsen) tipeAbsen.value = '';
                        if (pinInput) pinInput.value = '';
                        if (document.getElementById('clockTipeDisplay')) {
                            document.getElementById('clockTipeDisplay').textContent = '-';
                        }
                    } else {
                        if (karyawanSelect) karyawanSelect.value = '';
                        if (tipeAbsen) tipeAbsen.value = '';
                        if (pinInput) pinInput.value = '';
                        if (document.getElementById('clockPosisi')) {
                            document.getElementById('clockPosisi').textContent = '-';
                        }
                        if (document.getElementById('clockFoto')) {
                            document.getElementById('clockFoto').src = 'assets/logo.jpg';
                        }
                        if (document.getElementById('clockTipeDisplay')) {
                            document.getElementById('clockTipeDisplay').textContent = '-';
                        }
                    }
                }, 2000);
            } else {
                showClockStatus('Gagal menyimpan absensi ke database', 'error');
            }
        } else {
            showClockStatus(errorMessage || 'Absensi tidak valid', 'error');
        }
        
    } catch (error) {
        console.error('Submit error:', error);
        showClockStatus('Terjadi kesalahan: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> SUBMIT ABSENSI';
    }
}

// [12] Save attendance to database
async function saveAttendanceClock(karyawan, absenType, action, location) {
    try {
        const now = new Date();
        const tanggal = formatDateClock(now);
        const hari = getDayNameClock(now.getDay());
        const waktu = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        // Dapatkan outlet dari user yang login atau dari karyawan
        let outlet = currentUserOutletClock;
        if (isOwnerClock) {
            const outletSelect = document.getElementById('clockOutletSelect');
            if (outletSelect && outletSelect.value) {
                outlet = outletSelect.value;
            }
        }
        
        const data = {
            tanggal: tanggal,
            hari: hari,
            nama: karyawan.nama_karyawan,
            id_uniq: `${karyawan.nomor_wa}%${tanggal}`,
            nomor_wa: karyawan.nomor_wa,
            outlet: outlet,
            token: null,
            token_expired: null,
            longitude: location.lng ? location.lng.toString() : null,
            latitude: location.lat ? location.lat.toString() : null,
            jarak: null,
            jamkerja: null,
            status_kehadiran: null,
            over_time: null,
            over_time_rp: null,
            gaji_pokok: null
        };
        
        if (action === 'insert') {
            // Clock In
            data.clockin = waktu;
            data.clockout = null;
            
            const { error } = await supabase
                .from('absen')
                .insert([data]);
            
            if (error) throw error;
            console.log('✅ Clock In saved:', data);
            
        } else if (action === 'update') {
            // Clock Out - update existing record
            const { error } = await supabase
                .from('absen')
                .update({ clockout: waktu })
                .eq('id_uniq', data.id_uniq);
            
            if (error) throw error;
            console.log('✅ Clock Out updated:', data.id_uniq, waktu);
        }
        
        return true;
        
    } catch (error) {
        console.error('Save attendance error:', error);
        return false;
    }
}

    
// [13] Send WhatsApp notification
async function sendWhatsAppNotificationClock(data) {
    try {
        // Ambil konfigurasi WA dari global scope (sama seperti absensi_dengan_PIN.js)
        const whatsappConfig = {
            wahaUrl: typeof WA_API_URL !== 'undefined' ? WA_API_URL : window.WA_API_URL,
            wahaXApiKey: typeof WA_API_KEY !== 'undefined' ? WA_API_KEY : window.WA_API_KEY,
            wahaSession: 'Session1'  // Hardcode session
        };
        
        // Validasi konfigurasi
        if (!whatsappConfig.wahaUrl || !whatsappConfig.wahaXApiKey) {
            console.warn('⚠️ WhatsApp config not available');
            return;
        }
        
        const now = new Date();
        const tanggal = formatDateClock(now);
        const hari = getDayNameClock(now.getDay());
        const jam = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        let message = '';
        
        // Format nomor telepon (sama seperti absensi_dengan_PIN.js)
        let formattedPhone = data.karyawan.nomor_wa.replace(/^0/, '62');
        if (!formattedPhone.includes('@c.us')) {
            formattedPhone += '@c.us';
        }
        
        console.log('📤 Mengirim WA ke:', formattedPhone);
        
        // Construct message (sama seperti absensi_dengan_PIN.js)
        if (data.isValid) {
            if (data.absenType === 'Clock In') {
                message = `Terima Kasih, Anda Telah Berhasil Melakukan Absen Clock In\n` +
                         `🕌 Hari : ${hari}\n` +
                         `📅 Tanggal : ${tanggal}\n` +
                         `⌚ Jam : ${jam}\n` +
                         `Selamat Bekerja. Barokalloh`;
            } else {
                message = `Terima Kasih, Anda Telah Berhasil Melakukan Absen Clock Out\n` +
                         `🕌 Hari : ${hari}\n` +
                         `📅 Tanggal : ${tanggal}\n` +
                         `⌚ Jam : ${jam}\n` +
                         `Hati-hati di jalan. Barokalloh`;
            }
        } else {
            if (data.absenType === 'Clock In') {
                message = `Anda Sudah Clockin Hari Ini\n` +
                         `🏆 Hari : ${hari}\n` +
                         `📅 Tanggal : ${tanggal}\n` +
                         `⌚ Jam : ${data.existingData?.clockin || jam}\n` +
                         `Clockin Hanya 1X setiap Hari`;
            } else {
                message = `Anda Belum Melakukan ClockIn, Silahkan ClockIn Terlebih Dahulu Sebelum Clockout`;
            }
        }
        
        // Kirim via WhatsApp API (sama persis dengan absensi_dengan_PIN.js)
        const response = await fetch(whatsappConfig.wahaUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': whatsappConfig.wahaXApiKey
            },
            body: JSON.stringify({
                session: whatsappConfig.wahaSession,
                chatId: formattedPhone,
                text: message
            })
        });
        
        if (!response.ok) {
            throw new Error(`WhatsApp API error: ${response.status}`);
        }
        
        console.log('✅ WhatsApp notification sent to:', data.karyawan.nomor_wa);
        
    } catch (error) {
        console.error('❌ WhatsApp notification error:', error);
        // Jangan tampilkan error ke user, cukup log
    }
}
// [14] Show status message
function showClockStatus(message, type) {
    const statusEl = document.getElementById('clockStatusMsg');
    if (!statusEl) return;
    
    statusEl.innerHTML = `
        <div class="status-${type}">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            ${message}
        </div>
    `;
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        if (statusEl.innerHTML.includes(message)) {
            statusEl.innerHTML = '';
        }
    }, 5000);
}

// [15] Setup realtime subscription
function setupRealtimeSubscriptionClock() {
    try {
        const channelName = `clock-realtime-${Date.now()}`;
        
        realtimeSubscriptionClock = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'absen'
                },
                async (payload) => {
                    console.log('New attendance detected:', payload);
                    
                    const lastUpdate = document.getElementById('lastUpdateTimeClock');
                    if (lastUpdate) {
                        const now = new Date();
                        lastUpdate.textContent = now.toLocaleTimeString('id-ID');
                    }
                }
            )
            .subscribe((status) => {
                console.log('Realtime subscription status:', status);
                
                const badge = document.getElementById('realtimeBadgeClock');
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

// [16] Helper functions
function formatDateClock(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

function getDayNameClock(dayIndex) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[dayIndex] || 'Minggu';
}

// [17] Add CSS styles (similar to transaksi.js style)
function addClockPageStyles() {
    const styleId = 'clock-page-styles';
    
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) existingStyle.remove();
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        /* ===== CLOCK PAGE STYLES ===== */
        .clock-page {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f7fa;
            min-height: 100vh;
            padding: 20px;
            color: #333;
        }
        
        /* Header */
        .clock-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            margin-bottom: 20px;
        }
        
        .clock-header h2 {
            margin: 0;
            color: #2c3e50;
            font-size: 1.5rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        /* Info Header */
        .clock-info-header {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
        }
        
        /* DateTime Grid */
        .clock-datetime-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 20px;
        }
        
        .datetime-card {
            background: white;
            border-radius: 10px;
            padding: 12px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .datetime-label {
            font-size: 11px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        
        .datetime-value {
            font-size: 14px;
            font-weight: 700;
            color: #2c3e50;
        }
        
        /* Form Container */
        .clock-form-container {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            margin-bottom: 20px;
        }
        
        .form-group {
            margin-bottom: 16px;
        }
        
        .form-group label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 600;
            color: #495057;
            margin-bottom: 6px;
        }
        
        .form-group label i {
            color: #28a745;
            width: 16px;
        }
        
        .clock-select {
            width: 100%;
            padding: 12px;
            border: 1px solid #ced4da;
            border-radius: 8px;
            font-size: 14px;
            background: white;
            cursor: pointer;
        }
        
        .clock-select:focus {
            outline: none;
            border-color: #28a745;
            box-shadow: 0 0 0 3px rgba(40,167,69,0.1);
        }
        
        /* Info Grid */
        .clock-info-grid {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .clock-info-card {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 12px;
            border: 1px solid #e9ecef;
        }
        
        .info-card-label {
            font-size: 11px;
            color: #6c757d;
            margin-bottom: 5px;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .info-card-value {
            font-size: 14px;
            font-weight: 600;
            color: #2c3e50;
        }
        
        .clock-foto {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid #28a745;
            margin: 0 auto;
        }
        
        .mt-2 {
            margin-top: 8px;
        }
        
        .text-center {
            text-align: center;
        }
        
        /* GPS Grid */
        .clock-gps-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 20px;
        }
        
        .gps-card {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 12px;
            border: 1px solid #e9ecef;
        }
        
        .gps-label {
            font-size: 11px;
            color: #6c757d;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .gps-value {
            font-size: 12px;
            font-weight: 500;
        }
        
        .gps-value.status-active {
            color: #28a745;
        }
        
        .gps-value.status-error {
            color: #dc3545;
        }
        
        .gps-value.status-waiting {
            color: #ffc107;
        }
        
        /* PIN Input */
        .pin-group {
            margin-bottom: 20px;
        }
        
        .clock-pin-input {
            width: 100%;
            padding: 14px;
            border: 2px solid #ced4da;
            border-radius: 8px;
            font-size: 20px;
            text-align: center;
            letter-spacing: 8px;
            font-family: monospace;
            font-weight: bold;
        }
        
        .clock-pin-input:focus {
            outline: none;
            border-color: #28a745;
            box-shadow: 0 0 0 3px rgba(40,167,69,0.1);
        }
        
        .pin-hint {
            font-size: 11px;
            color: #6c757d;
            text-align: center;
            margin-top: 6px;
        }
        
        /* Submit Button */
        .clock-submit-btn {
            width: 100%;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            border: none;
            padding: 14px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: all 0.3s;
        }
        
        .clock-submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(40,167,69,0.3);
        }
        
        .clock-submit-btn:disabled {
            opacity: 0.7;
            transform: none;
        }
        
        /* Status Message */
        .clock-status-msg {
            margin-top: 15px;
        }
        
        .status-success {
            background: #d4edda;
            color: #155724;
            padding: 10px;
            border-radius: 8px;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .status-error {
            background: #f8d7da;
            color: #721c24;
            padding: 10px;
            border-radius: 8px;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        /* Instructions */
        .clock-instructions {
            background: #fff3cd;
            border: 1px solid #ffeeba;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
        }
        
        .clock-instructions h4 {
            margin: 0 0 8px 0;
            color: #856404;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .clock-instructions ul {
            margin: 0;
            padding-left: 20px;
        }
        
        .clock-instructions li {
            font-size: 12px;
            color: #856404;
            margin-bottom: 4px;
        }
        
        /* Footer */
        .clock-footer {
            text-align: center;
            color: #6c757d;
            font-size: 11px;
            padding: 10px;
        }
        
        /* Refresh Button */
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
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .clock-page {
                padding: 10px;
            }
            
            .clock-info-grid {
                grid-template-columns: 1fr;
            }
            
            .clock-gps-grid {
                grid-template-columns: 1fr;
            }
            
            .clock-datetime-grid {
                gap: 8px;
            }
            
            .datetime-value {
                font-size: 12px;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Export functions ke global scope
window.showClockPage = showClockPage;

// ========== END OF FILE ==========
