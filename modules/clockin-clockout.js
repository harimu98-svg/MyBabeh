// ========== CLOCK IN & CLOCK OUT MODULE WITH LOCATION VALIDATION ==========
// ==========================================================================

// Variabel global
let currentKaryawanClock = null;
let currentUserOutletClock = null;
let isOwnerClock = false;
let realtimeSubscriptionClock = null;
let currentPosition = { lat: null, lng: null, distance: null };
let karyawanListClock = [];
let outletLocation = { lat: null, lng: null, name: null };

// ========== KONFIGURASI ==========
const MAX_DISTANCE_METERS = 30; // Maksimal jarak 30 meter

// ========== FUNGSI UTAMA ==========

async function showClockPage() {
    try {
        // Bersihkan subscription lama
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
        
        // Ambil lokasi outlet
        await loadOutletLocation(currentUserOutletClock);
        
        // Sembunyikan main app, tampilkan halaman clock
        document.getElementById('appScreen').style.display = 'none';
        
        // Buat container halaman clock
        createClockPage();
        
        // Load data awal
        await loadInitialDataClock();
        
        // Setup realtime subscription
        setupRealtimeSubscriptionClock();
        
        // Mulai update GPS
        startGPSUpdate();
        
    } catch (error) {
        console.error('Error in showClockPage:', error);
        alert('Gagal memuat halaman Clock In/Out!');
    }
}

// [2] Buat halaman clock
function createClockPage() {
    const existingPage = document.getElementById('clockPage');
    if (existingPage) {
        existingPage.remove();
    }
    
    const clockPage = document.createElement('div');
    clockPage.id = 'clockPage';
    clockPage.className = 'clock-page';
    clockPage.innerHTML = `
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
        
        <div class="clock-form-container">
            ${isOwnerClock ? `
            <div class="form-group">
                <label><i class="fas fa-store"></i> Outlet</label>
                <select id="clockOutletSelect" class="clock-select">
                    <option value="">Pilih outlet...</option>
                </select>
            </div>
            ` : ''}
            
            <div class="form-group">
                <label><i class="fas fa-user"></i> Nama Karyawan</label>
                <select id="clockKaryawanSelect" class="clock-select">
                    <option value="">Pilih karyawan...</option>
                </select>
            </div>
            
            <div class="form-group">
                <label><i class="fas fa-exchange-alt"></i> Tipe Absen</label>
                <select id="clockTipeAbsen" class="clock-select">
                    <option value="">Pilih tipe absen...</option>
                    <option value="Clock In">🟢 Clock In (Masuk)</option>
                    <option value="Clock Out">🔴 Clock Out (Pulang)</option>
                </select>
            </div>
            
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
            
            <div class="clock-gps-grid">
                <div class="gps-card">
                    <div class="gps-label"><i class="fas fa-satellite-dish"></i> Status GPS</div>
                    <div id="clockStatusGPS" class="gps-value status-waiting">
                        <i class="fas fa-spinner fa-pulse"></i> Mendeteksi...
                    </div>
                </div>
                <div class="gps-card">
                    <div class="gps-label"><i class="fas fa-map-marker-alt"></i> Jarak dari Outlet</div>
                    <div id="clockDistance" class="gps-value">-</div>
                </div>
            </div>
            
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
            
            <button id="clockSubmitBtn" class="clock-submit-btn">
                <i class="fas fa-check-circle"></i> SUBMIT ABSENSI
            </button>
            
            <div id="clockStatusMsg" class="clock-status-msg"></div>
        </div>
        
        <div class="clock-instructions">
            <h4><i class="fas fa-info-circle"></i> Petunjuk:</h4>
            <ul>
                <li>Pilih karyawan yang akan absen</li>
                <li>Pilih tipe absen (Clock In/Out)</li>
                <li>Pastikan GPS aktif untuk validasi lokasi</li>
                <li>Pastikan Anda berada dalam radius 30 meter dari outlet</li>
                <li>Masukkan PIN 4 digit karyawan</li>
                <li>Klik SUBMIT ABSENSI untuk proses</li>
                <li>Notifikasi WhatsApp hanya untuk absen berhasil</li>
            </ul>
        </div>
        
        <div class="clock-footer">
            <p>Data diperbarui: <span id="lastUpdateTimeClock">-</span></p>
        </div>
    `;
    
    document.body.appendChild(clockPage);
    
    setupClockPageEvents();
    startClockUpdate();
    addClockPageStyles();
}

// [3] Setup event listeners
function setupClockPageEvents() {
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
    
    const refreshBtn = document.getElementById('refreshClock');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.classList.add('loading');
            await loadKaryawanDropdownClock();
            refreshBtn.classList.remove('loading');
            showClockStatus('Data diperbarui', 'success');
        });
    }
    
    const outletSelect = document.getElementById('clockOutletSelect');
    if (outletSelect) {
        outletSelect.addEventListener('change', () => {
            const selectedOutlet = outletSelect.value;
            if (selectedOutlet) {
                loadOutletLocation(selectedOutlet);
            }
            loadKaryawanDropdownClock();
        });
    }
    
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
    
    const tipeAbsen = document.getElementById('clockTipeAbsen');
    if (tipeAbsen) {
        tipeAbsen.addEventListener('change', (e) => {
            const tipeDisplay = document.getElementById('clockTipeDisplay');
            if (tipeDisplay) {
                tipeDisplay.textContent = e.target.value || '-';
            }
            
            const karyawanSelect = document.getElementById('clockKaryawanSelect');
            if (karyawanSelect && karyawanSelect.value && e.target.value) {
                document.getElementById('clockPinInput').focus();
            }
        });
    }
    
    const pinInput = document.getElementById('clockPinInput');
    if (pinInput) {
        pinInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
        
        pinInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitClockAttendance();
            }
        });
    }
    
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
    setInterval(updateGPSLocation, 30000);
}

function updateGPSLocation() {
    const statusEl = document.getElementById('clockStatusGPS');
    const distanceEl = document.getElementById('clockDistance');
    
    if (!navigator.geolocation) {
        if (statusEl) {
            statusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> GPS Tidak Tersedia';
            statusEl.className = 'gps-value status-error';
        }
        if (distanceEl) distanceEl.textContent = 'Tidak didukung';
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            currentPosition.lat = position.coords.latitude;
            currentPosition.lng = position.coords.longitude;
            
            if (statusEl) {
                statusEl.innerHTML = '<i class="fas fa-check-circle"></i> GPS Aktif';
                statusEl.className = 'gps-value status-active';
            }
            
            // Hitung jarak dari outlet jika outlet location tersedia
            if (outletLocation.lat && outletLocation.lng) {
                const distance = calculateDistance(
                    currentPosition.lat, currentPosition.lng,
                    outletLocation.lat, outletLocation.lng
                );
                currentPosition.distance = distance;
                if (distanceEl) {
                    const isWithinRange = distance <= MAX_DISTANCE_METERS;
                    distanceEl.innerHTML = `${distance.toFixed(1)} meter ${isWithinRange ? '✅' : '❌'}`;
                    distanceEl.style.color = isWithinRange ? '#28a745' : '#dc3545';
                }
            } else {
                if (distanceEl) distanceEl.textContent = 'Outlet tidak ditemukan';
            }
        },
        (error) => {
            console.error('GPS Error:', error);
            if (statusEl) {
                statusEl.innerHTML = '<i class="fas fa-times-circle"></i> GPS Tidak Aktif';
                statusEl.className = 'gps-value status-error';
            }
            if (distanceEl) distanceEl.textContent = 'Aktifkan GPS';
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// [6] Load outlet location
async function loadOutletLocation(outletName) {
    try {
        const { data, error } = await supabase
            .from('outlet')
            .select('outlet, outlet_lat, outlet_long')
            .eq('outlet', outletName)
            .single();
        
        if (error) throw error;
        
        if (data && data.outlet_lat && data.outlet_long) {
            outletLocation = {
                name: data.outlet,
                lat: parseFloat(data.outlet_lat),
                lng: parseFloat(data.outlet_long)
            };
            console.log('📍 Outlet location loaded:', outletLocation);
            
            // Update tampilan jarak
            const distanceEl = document.getElementById('clockDistance');
            if (distanceEl && currentPosition.lat && currentPosition.lng) {
                const distance = calculateDistance(
                    currentPosition.lat, currentPosition.lng,
                    outletLocation.lat, outletLocation.lng
                );
                currentPosition.distance = distance;
                const isWithinRange = distance <= MAX_DISTANCE_METERS;
                distanceEl.innerHTML = `${distance.toFixed(1)} meter ${isWithinRange ? '✅' : '❌'}`;
                distanceEl.style.color = isWithinRange ? '#28a745' : '#dc3545';
            }
        } else {
            console.warn('Outlet location not available for:', outletName);
        }
    } catch (error) {
        console.error('Error loading outlet location:', error);
    }
}

// [7] Hitung jarak dalam meter
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// [8] Validasi lokasi
async function validateLocation() {
    if (!outletLocation.lat || !outletLocation.lng) {
        return { valid: false, distance: null, message: 'Lokasi outlet tidak tersedia' };
    }
    
    if (!currentPosition.lat || !currentPosition.lng) {
        return { valid: false, distance: null, message: 'GPS tidak aktif. Silakan aktifkan GPS.' };
    }
    
    const distance = calculateDistance(
        currentPosition.lat, currentPosition.lng,
        outletLocation.lat, outletLocation.lng
    );
    
    currentPosition.distance = distance;
    const isValid = distance <= MAX_DISTANCE_METERS;
    
    return {
        valid: isValid,
        distance: distance,
        message: isValid 
            ? `Jarak ${distance.toFixed(1)} meter (maks ${MAX_DISTANCE_METERS} m) ✅`
            : `Jarak ${distance.toFixed(1)} meter (maks ${MAX_DISTANCE_METERS} m) ❌`
    };
}

// [9] Format tanggal untuk id_uniq (DD/MM/YYYY)
function formatDateForId(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

function getDayNameClock(dayIndex) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[dayIndex] || 'Minggu';
}

// [10] Cek status absensi hari ini
async function checkAttendanceStatusClock(nomorWA, tanggal) {
    try {
        const id_uniq = `${nomorWA}%${tanggal}`;
        
        const { data, error } = await supabase
            .from('absen')
            .select('clockin, clockout, id_uniq')
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

// [11] Verify PIN
async function verifyPINClock(karyawanNama, enteredPIN) {
    try {
        const { data, error } = await supabase
            .from('karyawan')
            .select('pin')
            .eq('nama_karyawan', karyawanNama)
            .single();
        
        if (error) {
            console.error('Error fetching PIN:', error);
            return false;
        }
        
        const storedPIN = data?.pin?.toString() || '';
        const inputPIN = enteredPIN.toString();
        
        return storedPIN === inputPIN;
        
    } catch (error) {
        console.error('PIN verification error:', error);
        return false;
    }
}

// [12] Simpan absen ke database
async function saveAttendanceClock(karyawan, absenType, locationData, distance) {
    try {
        const now = new Date();
        const tanggal = formatDateForId(now);
        const hari = getDayNameClock(now.getDay());
        const waktu = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const id_uniq = `${karyawan.nomor_wa}%${tanggal}`;
        
        let outlet = currentUserOutletClock;
        if (isOwnerClock) {
            const outletSelect = document.getElementById('clockOutletSelect');
            if (outletSelect && outletSelect.value) {
                outlet = outletSelect.value;
            }
        }
        
        const existingData = await checkAttendanceStatusClock(karyawan.nomor_wa, tanggal);
        
        if (absenType === 'Clock In') {
            if (!existingData) {
                const data = {
                    tanggal: tanggal,
                    hari: hari,
                    nama: karyawan.nama_karyawan,
                    id_uniq: id_uniq,
                    nomor_wa: karyawan.nomor_wa,
                    outlet: outlet,
                    clockin: waktu,
                    clockout: null,
                    longitude: locationData.lng ? locationData.lng.toString() : null,
                    latitude: locationData.lat ? locationData.lat.toString() : null,
                    jarak: distance ? distance.toString() : null,
                    token: null,
                    token_expired: null,
                    jamkerja: null,
                    status_kehadiran: null,
                    over_time: null,
                    over_time_rp: null,
                    gaji_pokok: null
                };
                
                const { error } = await supabase.from('absen').insert([data]);
                if (error) throw error;
                console.log('✅ Clock In saved');
                return true;
                
            } else if (existingData.clockin && !existingData.clockout) {
                return { success: false, error: 'SUDAH_CLOCKIN', data: existingData };
            } else if (existingData.clockin && existingData.clockout) {
                return { success: false, error: 'SUDAH_CLOCKOUT', data: existingData };
            }
            
        } else if (absenType === 'Clock Out') {
            if (!existingData) {
                return { success: false, error: 'BELUM_CLOCKIN', data: null };
            } else if (existingData.clockin && !existingData.clockout) {
                const { error } = await supabase
                    .from('absen')
                    .update({ 
                        clockout: waktu,
                        longitude: locationData.lng ? locationData.lng.toString() : null,
                        latitude: locationData.lat ? locationData.lat.toString() : null,
                        jarak: distance ? distance.toString() : null
                    })
                    .eq('id_uniq', id_uniq);
                
                if (error) throw error;
                console.log('✅ Clock Out updated');
                return true;
                
            } else if (existingData.clockin && existingData.clockout) {
                return { success: false, error: 'SUDAH_CLOCKOUT', data: existingData };
            }
        }
        
        return false;
        
    } catch (error) {
        console.error('Save attendance error:', error);
        return false;
    }
}

// [13] Kirim WhatsApp (HANYA saat berhasil)
async function sendWhatsAppNotificationClock(karyawan, absenType, distance) {
    try {
        const now = new Date();
        const tanggal = formatDateForId(now);
        const hari = getDayNameClock(now.getDay());
        const jam = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        const whatsappConfig = {
            wahaUrl: typeof WA_API_URL !== 'undefined' ? WA_API_URL : window.WA_API_URL,
            wahaXApiKey: typeof WA_API_KEY !== 'undefined' ? WA_API_KEY : window.WA_API_KEY,
            wahaSession: 'Session1'
        };
        
        if (!whatsappConfig.wahaUrl || !whatsappConfig.wahaXApiKey) {
            console.warn('WhatsApp config not available');
            return;
        }
        
        let formattedPhone = karyawan.nomor_wa.replace(/^0/, '62');
        if (!formattedPhone.includes('@c.us')) {
            formattedPhone += '@c.us';
        }
        
        let message = '';
        if (absenType === 'Clock In') {
            message = `✅ *ABSEN CLOCK IN BERHASIL* ✅\n\n` +
                     `Halo *${karyawan.nama_karyawan}*,\n\n` +
                     `📅 Tanggal: ${tanggal}\n` +
                     `🕌 Hari: ${hari}\n` +
                     `⌚ Jam Clock In: ${jam}\n` +
                     `📍 Jarak dari outlet: ${distance ? distance.toFixed(1) : '?'} meter\n` +
                     `🏪 Outlet: ${currentUserOutletClock || '-'}\n\n` +
                     `Selamat bekerja! 💈✂️\n` +
                     `Barokalloh 🙏`;
        } else {
            message = `✅ *ABSEN CLOCK OUT BERHASIL* ✅\n\n` +
                     `Halo *${karyawan.nama_karyawan}*,\n\n` +
                     `📅 Tanggal: ${tanggal}\n` +
                     `🕌 Hari: ${hari}\n` +
                     `⌚ Jam Clock Out: ${jam}\n` +
                     `📍 Jarak dari outlet: ${distance ? distance.toFixed(1) : '?'} meter\n` +
                     `🏪 Outlet: ${currentUserOutletClock || '-'}\n\n` +
                     `Terima kasih, hati-hati di jalan! 🏠\n` +
                     `Barokalloh 🙏`;
        }
        
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
        
        console.log('✅ WhatsApp notification sent to:', karyawan.nomor_wa);
        
    } catch (error) {
        console.error('WhatsApp notification error:', error);
    }
}

// [14] Submit attendance
async function submitClockAttendance() {
    const submitBtn = document.getElementById('clockSubmitBtn');
    const karyawanSelect = document.getElementById('clockKaryawanSelect');
    const tipeAbsen = document.getElementById('clockTipeAbsen');
    const pinInput = document.getElementById('clockPinInput');
    
    const karyawanNama = karyawanSelect?.value;
    const absenType = tipeAbsen?.value;
    const enteredPIN = pinInput?.value;
    
    // Validasi input
    if (!karyawanNama) {
        showClockStatus('Pilih karyawan terlebih dahulu', 'error');
        return;
    }
    
    if (!absenType) {
        showClockStatus('Pilih tipe absen (Clock In/Out)', 'error');
        return;
    }
    
    if (!enteredPIN || enteredPIN.length !== 4 || !/^\d{4}$/.test(enteredPIN)) {
        showClockStatus('PIN harus 4 digit angka', 'error');
        pinInput?.focus();
        return;
    }
    
    if (!currentPosition.lat || !currentPosition.lng) {
        showClockStatus('Aktifkan GPS untuk melanjutkan absensi', 'error');
        updateGPSLocation();
        return;
    }
    
    if (!outletLocation.lat || !outletLocation.lng) {
        showClockStatus('Lokasi outlet tidak tersedia. Hubungi admin.', 'error');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Memproses...';
    
    try {
        const isPINValid = await verifyPINClock(karyawanNama, enteredPIN);
        if (!isPINValid) {
            showClockStatus('PIN salah! Silakan coba lagi.', 'error');
            pinInput.value = '';
            pinInput.focus();
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> SUBMIT ABSENSI';
            return;
        }
        
        const karyawan = karyawanListClock.find(k => k.nama_karyawan === karyawanNama);
        if (!karyawan) {
            showClockStatus('Data karyawan tidak ditemukan', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> SUBMIT ABSENSI';
            return;
        }
        
        // Validasi lokasi
        const locationValidation = await validateLocation();
        if (!locationValidation.valid) {
            showClockStatus(`❌ Absen gagal! Jarak ${locationValidation.distance?.toFixed(1)} meter dari outlet. Maksimal ${MAX_DISTANCE_METERS} meter.`, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> SUBMIT ABSENSI';
            return;
        }
        
        const now = new Date();
        const tanggal = formatDateForId(now);
        const existingData = await checkAttendanceStatusClock(karyawan.nomor_wa, tanggal);
        
        let isValid = false;
        let errorMessage = null;
        
        if (absenType === 'Clock In') {
            if (!existingData) {
                isValid = true;
            } else if (existingData.clockin && !existingData.clockout) {
                isValid = false;
                errorMessage = 'SUDAH_CLOCKIN';
            } else if (existingData.clockin && existingData.clockout) {
                isValid = false;
                errorMessage = 'SUDAH_CLOCKOUT';
            }
        } else if (absenType === 'Clock Out') {
            if (!existingData) {
                isValid = false;
                errorMessage = 'BELUM_CLOCKIN';
            } else if (existingData.clockin && !existingData.clockout) {
                isValid = true;
            } else if (existingData.clockin && existingData.clockout) {
                isValid = false;
                errorMessage = 'SUDAH_CLOCKOUT';
            }
        }
        
        if (!isValid) {
            const errorMessages = {
                'SUDAH_CLOCKIN': '❌ Anda sudah melakukan Clock In hari ini!',
                'SUDAH_CLOCKOUT': '❌ Anda sudah melakukan Clock Out hari ini!',
                'BELUM_CLOCKIN': '❌ Anda belum melakukan Clock In hari ini!'
            };
            showClockStatus(errorMessages[errorMessage] || '❌ Absen tidak valid', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> SUBMIT ABSENSI';
            return;
        }
        
        // Validasi lokasi sekali lagi sebelum simpan
        const finalLocationCheck = await validateLocation();
        if (!finalLocationCheck.valid) {
            showClockStatus(`❌ Absen gagal! Jarak ${finalLocationCheck.distance?.toFixed(1)} meter dari outlet.`, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> SUBMIT ABSENSI';
            return;
        }
        
        // Simpan ke database
        const saveResult = await saveAttendanceClock(
            karyawan, absenType, currentPosition, finalLocationCheck.distance
        );
        
        if (saveResult === true) {
            // HANYA KIRIM WA SAAT BERHASIL
            await sendWhatsAppNotificationClock(karyawan, absenType, finalLocationCheck.distance);
            showClockStatus(`✅ Absen ${absenType} berhasil! Jarak: ${finalLocationCheck.distance?.toFixed(1)} meter dari outlet.`, 'success');
            
            setTimeout(() => {
                if (!isOwnerClock) {
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
            
        } else if (saveResult === false) {
            showClockStatus('Gagal menyimpan absensi ke database', 'error');
        }
        
    } catch (error) {
        console.error('Submit error:', error);
        showClockStatus('Terjadi kesalahan: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> SUBMIT ABSENSI';
    }
}

// [15] Show status message di aplikasi
function showClockStatus(message, type) {
    const statusEl = document.getElementById('clockStatusMsg');
    if (!statusEl) return;
    
    statusEl.innerHTML = `
        <div class="status-${type}">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            ${message}
        </div>
    `;
    
    setTimeout(() => {
        if (statusEl.innerHTML.includes(message)) {
            statusEl.innerHTML = '';
        }
    }, 5000);
}

// [16] Load initial data
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

// [17] Load outlet dropdown
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
            await loadOutletLocation(currentUserOutletClock);
        }
    } catch (error) {
        console.error('Error loading outlets:', error);
    }
}

// [18] Load karyawan dropdown
async function loadKaryawanDropdownClock() {
    const select = document.getElementById('clockKaryawanSelect');
    if (!select) return;
    
    try {
        let outletFilter = currentUserOutletClock;
        
        if (isOwnerClock) {
            const outletSelect = document.getElementById('clockOutletSelect');
            if (outletSelect && outletSelect.value) {
                outletFilter = outletSelect.value;
                await loadOutletLocation(outletFilter);
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
        
        if (!isOwnerClock) {
            query = query.eq('nama_karyawan', currentKaryawanClock.nama_karyawan);
        }
        
        const { data: karyawan, error } = await query;
        
        if (error) throw error;
        
        karyawanListClock = karyawan || [];
        
        let options = '<option value="">Pilih karyawan...</option>';
        karyawanListClock.forEach(k => {
            options += `<option value="${k.nama_karyawan}" 
                               data-posisi="${k.posisi || '-'}"
                               data-nomor-wa="${k.nomor_wa || ''}"
                               data-foto="${k.photo_url || 'assets/logo.jpg'}">
                            ${k.nama_karyawan} ${k.posisi ? `(${k.posisi})` : ''}
                        </option>`;
        });
        
        select.innerHTML = options;
        
        if (!isOwnerClock && karyawanListClock.length === 1) {
            select.value = karyawanListClock[0].nama_karyawan;
            const event = new Event('change');
            select.dispatchEvent(event);
        }
        
    } catch (error) {
        console.error('Error loading karyawan:', error);
        select.innerHTML = '<option value="">Error loading data</option>';
    }
}

// [19] Setup realtime subscription
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

// [20] Add CSS styles
function addClockPageStyles() {
    const styleId = 'clock-page-styles';
    
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) existingStyle.remove();
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        .clock-page {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f7fa;
            min-height: 100vh;
            padding: 20px;
            color: #333;
        }
        
        .clock-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: linear-gradient(135deg, #28a745, #20c997) !important;
            padding: 15px 20px !important;
            border-radius: 10px !important;
            margin-bottom: 20px !important;
            color: white !important;
        }
        
        .clock-header h2 {
            margin: 0;
            color: white;
            font-size: 1.5rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .back-btn {
            background: rgba(255,255,255,0.2) !important;
            color: white !important;
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
            background: rgba(255,255,255,0.3);
            transform: translateX(-3px);
        }
        
        .refresh-btn {
            background: rgba(255,255,255,0.2) !important;
            color: white !important;
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
            background: rgba(255,255,255,0.3);
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
            background: rgba(255,255,255,0.2);
            color: white;
        }
        
        .realtime-badge.connected {
            background: rgba(255,255,255,0.3);
        }
        
        .realtime-badge.disconnected {
            background: rgba(255,255,255,0.2);
            color: #ffcccc;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .clock-info-header {
            background: linear-gradient(135deg, #34ce57, #2ee0a6) !important;
            color: white;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        
        .info-row:last-child {
            margin-bottom: 0;
        }
        
        .info-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
        }
        
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
            margin-bottom: 5px;
        }
        
        .datetime-value {
            font-size: 14px;
            font-weight: 700;
            color: #2c3e50;
        }
        
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
        
        .clock-submit-btn {
            width: 100%;
            background: linear-gradient(135deg, #28a745, #20c997) !important;
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
        
        .clock-footer {
            text-align: center;
            color: #6c757d;
            font-size: 11px;
            padding: 10px;
        }
        
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
            .info-row {
                flex-direction: column;
                gap: 8px;
            }
            .clock-header h2 {
                font-size: 1.2rem;
            }
            .back-btn, .refresh-btn {
                width: 35px;
                height: 35px;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Export ke global
window.showClockPage = showClockPage;
