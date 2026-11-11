// ========== MODUL URUTAN BARBERMAN ==========
// Self-contained: HTML, CSS (scoped), JS logic
// Class prefix "gb-" agar tidak menimpa style existing.
//
// Arsitektur: DB DULU → render
//   1. Query absen + karyawan + transaksi (paralel)
//   2. Re-kalkulasi urutan dari scratch (simulasi transaksi)
//   3. Persist urutan_giliran ke DB (await, kalau beda)
//   4. Baru render berdasarkan hasil kalkulasi
//
// Sumber data:
//   - absen: nama, clockin, clockout, status_istirahat, urutan_giliran
//   - karyawan: nama_karyawan, posisi, photo_url, role, status
//   - transaksi_detail: order_no, order_time, serve_by (item_group Jasa, status completed)
//
// Pemicu fetch:
//   1. Realtime transaksi_detail INSERT → debounce 300ms
//   2. Realtime absen INSERT/UPDATE → debounce 300ms
//   3. Realtime reconnect → fetch 100ms
//   4. Visibility change (tab aktif) → fetch 100ms
//   5. Polling 120s (connected) / 30s (disconnected) — skip kalau tab background / baru fetch
//
// Optimasi egress:
//   - Query transaksi minimal (3 kolom)
//   - Polling 120s saat connected
//   - Skip fetch saat tab background
//   - Skip polling kalau baru fetch (<60s)

const GILIRAN_JASA_GROUPS = ['Jasa', 'Tarif Hari Raya', 'Tarif Lebaran'];
const GILIRAN_STYLE_ID = 'giliran-barberman-styles';

const giliranState = {
    barberList: [],
    realtimeChannel: null,
    pollingTimer: null,
    realtimeConnected: false,
    tabActive: true,
    outlet: null,
    isOwnerOrKasir: false,
    currentUserName: null,
    currentUserRole: null,
    lastTopBarber: null,
    lastFetchTime: 0,
    // Highlight
    highlightNama: null,
    highlightNaik: null,
    highlightTimer: null,
    // Audio
    audioUnlocked: false,
    audioEl: null
};

let _fetchDebounceTimer = null;

// ========== INJECT CSS (SCOPED) ==========

function injectGiliranStyles() {
    const existing = document.getElementById(GILIRAN_STYLE_ID);
    if (existing) existing.remove();

    const style = document.createElement('style');
    style.id = GILIRAN_STYLE_ID;
    style.textContent = `
.gb-section {
    padding: 15px;
    background: #fff;
    border-radius: 12px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.gb-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}
.gb-section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 1.1rem;
    color: #2c3e50;
}
.gb-section-title i { color: #007bff; }
.gb-sound-toggle {
    background: #eef1f6;
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    color: #889;
    font-size: 1rem;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}
.gb-sound-toggle:hover { background: #dde3ec; }
.gb-sound-toggle.gb-sound-on { background: #d4edda; color: #155724; }

.gb-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
}
.gb-loading, .gb-empty {
    text-align: center;
    padding: 24px 12px;
    color: #889;
    font-size: 0.9rem;
    width: 100%;
}
.gb-loading i, .gb-empty i {
    font-size: 1.8rem;
    margin-bottom: 8px;
    display: block;
    opacity: 0.6;
}

.gb-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: #fff;
    border: 1px solid #e6e9ee;
    border-radius: 10px;
    transition: transform 0.9s cubic-bezier(0.22, 1.2, 0.36, 1),
                box-shadow 0.3s ease,
                border-color 0.3s ease,
                background-color 0.6s ease;
    will-change: transform;
    cursor: default;
    position: relative;
    overflow: hidden;
    width: 75%;
    max-width: 480px;
    box-sizing: border-box;
}

.gb-card.gb-highlight-turun {
    background: #fff8e1 !important;
    border-color: #ff9800 !important;
    box-shadow: 0 0 0 2px #ff9800, 0 4px 16px rgba(255,152,0,0.35) !important;
    animation: gbPulseTurun 2s ease-out;
}
@keyframes gbPulseTurun {
    0%   { box-shadow: 0 0 0 2px #ff9800, 0 0 0 0 rgba(255,152,0,0.6); }
    50%  { box-shadow: 0 0 0 2px #ff9800, 0 0 0 8px rgba(255,152,0,0); }
    100% { box-shadow: 0 0 0 2px #ff9800, 0 0 0 0 rgba(255,152,0,0); }
}
.gb-card.gb-highlight-geser {
    background: #f0f9f4 !important;
    animation: gbPulseGeser 1.4s ease-out;
}
@keyframes gbPulseGeser {
    0%   { background: #d4edda; }
    100% { background: #ffffff; }
}
.gb-card.gb-highlight-naik {
    background: #e7f3ff !important;
    border-color: #007bff !important;
    box-shadow: 0 0 0 2px #007bff, 0 4px 16px rgba(0,123,255,0.3) !important;
    animation: gbPulseNaik 2s ease-out;
}
@keyframes gbPulseNaik {
    0%   { box-shadow: 0 0 0 2px #007bff, 0 0 0 0 rgba(0,123,255,0.6); }
    50%  { box-shadow: 0 0 0 2px #007bff, 0 0 0 8px rgba(0,123,255,0); }
    100% { box-shadow: 0 0 0 2px #007bff, 0 0 0 0 rgba(0,123,255,0); }
}

.gb-card.gb-clickable { cursor: pointer; }
.gb-card.gb-clickable:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    border-color: #c0c8d4;
}
.gb-card.gb-status-hadir { border-left: 4px solid #28a745; }
.gb-card.gb-status-istirahat { border-left: 4px solid #ff9800; opacity: 0.85; }
.gb-card.gb-status-libur { border-left: 4px solid #6c757d; opacity: 0.75; }
.gb-card.gb-status-izin { border-left: 4px solid #6f42c1; opacity: 0.75; }

.gb-photo {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #eef1f6;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    font-size: 1.6rem;
    color: #889;
}
.gb-photo img { width: 100%; height: 100%; object-fit: cover; }
.gb-info { flex: 1; min-width: 0; }
.gb-name {
    font-weight: 600;
    font-size: 0.88rem;
    color: #2c3e50;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.gb-posisi {
    font-size: 0.72rem;
    color: #889;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px;
}
.gb-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 0.68rem;
    font-weight: 600;
}
.gb-badge.gb-status-hadir { background: #d4edda; color: #155724; }
.gb-badge.gb-status-istirahat { background: #fff3cd; color: #856404; }
.gb-badge.gb-status-libur { background: #e2e3e5; color: #383d41; }
.gb-badge.gb-status-izin { background: #e2d9f3; color: #4a2c8a; }

.gb-nomor {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.12);
}
.gb-nomor.gb-nomor-none {
    background: #eef1f6;
    color: #889;
    font-weight: 500;
    box-shadow: none;
}

.gb-toast {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #007bff, #0056b3);
    color: #fff;
    padding: 12px 18px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.25);
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 99999;
    animation: gbToastIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    max-width: 90vw;
}
.gb-toast.gb-toast-hide { animation: gbToastOut 0.3s ease forwards; }
.gb-toast-icon { font-size: 1.5rem; animation: gbToastRing 0.6s ease 0.2s; }
.gb-toast-text strong { display: block; font-size: 0.9rem; margin-bottom: 2px; }
.gb-toast-text div { font-size: 0.8rem; opacity: 0.9; }
@keyframes gbToastIn {
    from { transform: translate(-50%, -120%); opacity: 0; }
    to   { transform: translate(-50%, 0);     opacity: 1; }
}
@keyframes gbToastOut {
    from { transform: translate(-50%, 0);     opacity: 1; }
    to   { transform: translate(-50%, -120%); opacity: 0; }
}
@keyframes gbToastRing {
    0%, 100% { transform: rotate(0); }
    20% { transform: rotate(15deg); }
    40% { transform: rotate(-15deg); }
    60% { transform: rotate(10deg); }
    80% { transform: rotate(-10deg); }
}

@media (max-width: 480px) {
    .gb-grid { gap: 6px; }
    .gb-card {
        padding: 8px 10px;
        gap: 10px;
        width: 100%;
        max-width: none;
    }
    .gb-photo { width: 40px; height: 40px; font-size: 1.4rem; }
    .gb-nomor { width: 32px; height: 32px; font-size: 0.9rem; }
    .gb-name { font-size: 0.82rem; }
    .gb-posisi { font-size: 0.7rem; }
    .gb-badge { font-size: 0.64rem; }
    .gb-toast { padding: 10px 14px; }
    .gb-toast-text strong { font-size: 0.82rem; }
    .gb-toast-text div { font-size: 0.72rem; }
}
    `;
    document.head.appendChild(style);
}

// ========== ENSURE SECTION ==========

function ensureGiliranSection() {
    let section = document.getElementById('giliranSection');
    if (section) {
        let header = section.querySelector('.gb-header-row');
        if (!header) {
            const oldTitle = section.querySelector('.gb-section-title, .section-title');
            if (oldTitle) {
                const newHeader = document.createElement('div');
                newHeader.className = 'gb-header-row';
                newHeader.innerHTML = `
                    <h2 class="gb-section-title">
                        <i class="fas fa-list-ol"></i> Urutan Barberman
                    </h2>
                    <button class="gb-sound-toggle" id="gbSoundToggle" title="Aktifkan notifikasi suara">
                        <i class="fas fa-volume-mute"></i>
                    </button>
                `;
                oldTitle.replaceWith(newHeader);
            }
        }
        const grid = section.querySelector('#giliranGrid');
        if (grid) grid.className = 'gb-grid';
        return section;
    }

    const main = document.querySelector('.main-content');
    if (!main) {
        console.warn('[Giliran] .main-content not found');
        return null;
    }

    section = document.createElement('section');
    section.id = 'giliranSection';
    section.className = 'gb-section';
    section.innerHTML = `
        <div class="gb-header-row">
            <h2 class="gb-section-title">
                <i class="fas fa-list-ol"></i> Urutan Barberman
            </h2>
            <button class="gb-sound-toggle" id="gbSoundToggle" title="Aktifkan notifikasi suara">
                <i class="fas fa-volume-mute"></i>
            </button>
        </div>
        <div class="gb-grid" id="giliranGrid">
            <div class="gb-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Memuat urutan barberman...</span>
            </div>
        </div>
    `;
    main.parentNode.insertBefore(section, main);
    return section;
}

// ========== AUDIO ==========

function setupAudioNotification() {
    const btn = document.getElementById('gbSoundToggle');
    if (!btn) return;

    if (localStorage.getItem('gb_audio_unlocked') === '1') {
        giliranState.audioUnlocked = true;
        btn.innerHTML = '<i class="fas fa-volume-up"></i>';
        btn.classList.add('gb-sound-on');
        btn.title = 'Notifikasi suara aktif';
    }

    btn.addEventListener('click', async () => {
        try {
            if (!giliranState.audioEl) {
                giliranState.audioEl = new Audio('assets/notif.mp3');
                giliranState.audioEl.volume = 0.8;
            }
            giliranState.audioEl.volume = 0;
            await giliranState.audioEl.play();
            giliranState.audioEl.pause();
            giliranState.audioEl.currentTime = 0;
            giliranState.audioEl.volume = 0.8;

            giliranState.audioUnlocked = true;
            localStorage.setItem('gb_audio_unlocked', '1');
            btn.innerHTML = '<i class="fas fa-volume-up"></i>';
            btn.classList.add('gb-sound-on');
            btn.title = 'Notifikasi suara aktif';

            if (navigator.vibrate) navigator.vibrate(200);
            playNotificationSound();
        } catch (err) {
            console.error('[Giliran] Unlock audio gagal:', err);
            playBeepFallback();
            giliranState.audioUnlocked = true;
            localStorage.setItem('gb_audio_unlocked', '1');
            btn.innerHTML = '<i class="fas fa-volume-up"></i>';
            btn.classList.add('gb-sound-on');
        }
    });
}

function playNotificationSound() {
    if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 300]);
    if (giliranState.audioUnlocked) {
        if (giliranState.audioEl) {
            try {
                giliranState.audioEl.currentTime = 0;
                giliranState.audioEl.play().catch(() => playBeepFallback());
            } catch (e) { playBeepFallback(); }
        } else {
            playBeepFallback();
        }
    }
}

function playBeepFallback() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) { console.warn('[Giliran] Beep fallback error:', e); }
}

function showGiliranToast(namaBarber, isMe) {
    const old = document.getElementById('gbToast');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.id = 'gbToast';
    toast.className = 'gb-toast';
    toast.innerHTML = `
        <div class="gb-toast-icon"><i class="fas fa-bell"></i></div>
        <div class="gb-toast-text">
            <strong>${isMe ? 'Giliran Anda!' : 'Giliran Berikutnya'}</strong>
            <div>${namaBarber} sekarang di urutan 1</div>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('gb-toast-hide');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ========== FUNGSI UTAMA ==========

async function loadGiliranBarberman() {
    try {
        injectGiliranStyles();
        if (!ensureGiliranSection()) return;
        setupAudioNotification();
        cleanupGiliranListeners();

        const { data: { user } } = await supabase.auth.getUser();
        const namaKaryawan = user?.user_metadata?.nama_karyawan;
        if (!namaKaryawan) return;

        const { data: karyawanData } = await supabase
            .from('karyawan')
            .select('role, outlet')
            .eq('nama_karyawan', namaKaryawan)
            .single();

        if (!karyawanData?.outlet) return;

        giliranState.outlet = karyawanData.outlet;
        giliranState.isOwnerOrKasir = ['owner', 'kasir'].includes(karyawanData.role);
        giliranState.currentUserName = namaKaryawan;
        giliranState.currentUserRole = karyawanData.role;

        // Setup visibility change
        document.addEventListener('visibilitychange', handleVisibilityChange);

        renderGiliranSkeleton();
        await fetchAndRenderGiliran();

        setupGiliranRealtime();
        setupGiliranPolling();

    } catch (err) {
        console.error('[Giliran] loadGiliranBarberman error:', err);
    }
}

function handleVisibilityChange() {
    giliranState.tabActive = document.visibilityState === 'visible';
    if (giliranState.tabActive) {
        // Tab aktif lagi → fetch instan
        scheduleFetchAndRender(100);
    }
}

// ========== FETCH & RE-KALKULASI ==========

function scheduleFetchAndRender(delay = 300) {
    if (_fetchDebounceTimer) clearTimeout(_fetchDebounceTimer);
    _fetchDebounceTimer = setTimeout(() => {
        _fetchDebounceTimer = null;
        fetchAndRenderGiliran();
    }, delay);
}

async function fetchAndRenderGiliran() {
    try {
        const today = getGiliranTodayStr();
        const todayDB = getGiliranTodayDBStr();
        const outlet = giliranState.outlet;

        giliranState.lastFetchTime = Date.now();

        // Query paralel: absen + karyawan + transaksi (minimal)
        const [absenRes, karyawanRes, transaksiRes] = await Promise.all([
            supabase
                .from('absen')
                .select('nama, clockin, clockout, outlet, tanggal, status_istirahat, urutan_giliran')
                .eq('outlet', outlet)
                .eq('tanggal', today),
            supabase
                .from('karyawan')
                .select('nama_karyawan, posisi, photo_url')
                .eq('outlet', outlet)
                .eq('role', 'barberman')
                .eq('status', 'active'),
            // Optimasi: hanya 3 kolom yang perlu
            supabase
                .from('transaksi_detail')
                .select('order_no, order_time, serve_by')
                .eq('outlet', outlet)
                .eq('order_date', todayDB)
                .eq('status', 'completed')
                .in('item_group', GILIRAN_JASA_GROUPS)
        ]);

        if (absenRes.error) throw absenRes.error;
        if (karyawanRes.error) throw karyawanRes.error;
        if (transaksiRes.error) {
            console.warn('[Giliran] Query transaksi error:', transaksiRes.error.message);
        }

        const absenData = absenRes.data || [];
        const karyawanBarber = karyawanRes.data || [];
        const transaksiData = transaksiRes.data || [];

        const karyawanMap = new Map();
        karyawanBarber.forEach(k => karyawanMap.set(k.nama_karyawan, k));

        // Re-kalkulasi urutan + persist ke DB
        const result = await recalculateAndPersistUrutan(absenData, karyawanMap, transaksiData);

        const finalList = [
            ...result.hadirList,
            ...result.istirahatList,
            ...result.liburIzinList
        ];

        // Deteksi highlight
        const prevList = giliranState.barberList || [];
        const prevOrder = new Map();
        prevList.forEach((b, i) => prevOrder.set(b.nama, i));

        const droppedBarbers = [];
        finalList.forEach((b, newIdx) => {
            const oldIdx = prevOrder.get(b.nama);
            if (oldIdx !== undefined && oldIdx < newIdx) {
                droppedBarbers.push(b.nama);
            }
        });

        // Deteksi barber naik ke posisi 1
        const newTopBarber = finalList[0]?.status === 'Hadir' ? finalList[0].nama : null;
        const oldTopBarber = giliranState.lastTopBarber;
        let highlightNaik = null;
        if (oldTopBarber && newTopBarber && oldTopBarber !== newTopBarber) {
            highlightNaik = newTopBarber;
            const isMe = newTopBarber === giliranState.currentUserName;
            const isKasirOwner = giliranState.isOwnerOrKasir;
            if (isMe || isKasirOwner) {
                playNotificationSound();
                showGiliranToast(newTopBarber, isMe);
            }
        }

        giliranState.highlightNama = droppedBarbers[0] || null;
        giliranState.highlightNaik = highlightNaik;
        giliranState.lastTopBarber = newTopBarber;
        giliranState.barberList = finalList;

        renderGiliranCards();

    } catch (err) {
        console.error('[Giliran] fetchAndRenderGiliran error:', err);
        renderGiliranError(err.message);
    }
}

// Hitung ulang urutan dari scratch + persist ke DB
async function recalculateAndPersistUrutan(absenData, karyawanMap, transaksiData) {
    const today = getGiliranTodayStr();
    const outlet = giliranState.outlet;

    const hadirList = [];
    const istirahatList = [];
    const liburIzinList = [];

    absenData.forEach(absen => {
        const karyawan = karyawanMap.get(absen.nama);
        if (!karyawan) return;

        const clockinRaw = (absen.clockin || '').trim();
        const clockoutRaw = (absen.clockout || '').trim();
        const statusIstirahat = (absen.status_istirahat || '').trim();

        if (!clockinRaw) return;

        if (clockinRaw === 'Libur' || clockinRaw === 'Izin') {
            liburIzinList.push({
                nama: absen.nama,
                posisi: karyawan.posisi || '-',
                photo_url: karyawan.photo_url || null,
                clockin: clockinRaw,
                status: clockinRaw
            });
            return;
        }

        if (clockoutRaw) return;

        const item = {
            nama: absen.nama,
            posisi: karyawan.posisi || '-',
            photo_url: karyawan.photo_url || null,
            clockin: clockinRaw
        };

        if (statusIstirahat === 'Istirahat') {
            istirahatList.push({ ...item, status: 'Istirahat' });
        } else {
            hadirList.push({ ...item, status: 'Hadir' });
        }
    });

    // Sort Hadir by clockin ASC (urutan awal)
    hadirList.sort((a, b) => (a.clockin || '').localeCompare(b.clockin || ''));

    // Dedup transaksi per order_no, ambil order_time terkecil
    const orderMap = new Map();
    (transaksiData || []).forEach(t => {
        if (!t.order_no || !t.serve_by) return;
        const existing = orderMap.get(t.order_no);
        if (!existing || (t.order_time < existing.order_time)) {
            orderMap.set(t.order_no, {
                order_no: t.order_no,
                order_time: t.order_time,
                serve_by: t.serve_by
            });
        }
    });

    // Sort transaksi by order_time ASC
    const sortedTx = Array.from(orderMap.values())
        .sort((a, b) => (a.order_time || '').localeCompare(b.order_time || ''));

    // Simulasi: pindahkan serve_by ke bawah grup Hadir
    const workingHadir = [...hadirList];
    sortedTx.forEach(tx => {
        const idx = workingHadir.findIndex(b => b.nama === tx.serve_by);
        if (idx === -1) return;
        const barber = workingHadir.splice(idx, 1)[0];
        workingHadir.push(barber);
    });

    // Assign urutan 1..N
    const urutanMap = new Map();
    workingHadir.forEach((b, i) => urutanMap.set(b.nama, i + 1));

    // Bandingkan dengan DB, update yang beda
    const updates = [];
    absenData.forEach(absen => {
        if (!karyawanMap.has(absen.nama)) return;
        const newUrutan = urutanMap.get(absen.nama) ?? null;
        const oldUrutan = absen.urutan_giliran ?? null;
        if (newUrutan !== oldUrutan) {
            updates.push({ nama: absen.nama, urutan_giliran: newUrutan });
        }
    });

    if (updates.length > 0) {
        console.log('[Giliran] Persist urutan:', updates.map(u => `${u.nama}=${u.urutan_giliran ?? 'NULL'}`).join(', '));
        const results = await Promise.all(
            updates.map(u =>
                supabase
                    .from('absen')
                    .update({ urutan_giliran: u.urutan_giliran })
                    .eq('outlet', outlet)
                    .eq('tanggal', today)
                    .eq('nama', u.nama)
            )
        );
        const failed = results.filter(r => r.error);
        if (failed.length > 0) {
            console.warn('[Giliran] Sebagian update gagal:', failed);
        }
    }

    return {
        hadirList: workingHadir,
        istirahatList,
        liburIzinList,
        hasChanges: updates.length > 0
    };
}

// ========== RENDER ==========

function renderGiliranSkeleton() {
    const grid = document.getElementById('giliranGrid');
    if (!grid) return;
    grid.innerHTML = `
        <div class="gb-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Memuat urutan barberman...</span>
        </div>
    `;
}

function renderGiliranError(message) {
    const grid = document.getElementById('giliranGrid');
    if (!grid) return;
    grid.innerHTML = `
        <div class="gb-empty">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Gagal memuat urutan</p>
            <small>${message || ''}</small>
        </div>
    `;
}

function getNomorColorStyle(nomor) {
    const colors = [
        { bg: '#28a745', color: '#fff' },
        { bg: '#007bff', color: '#fff' },
        { bg: '#6f42c1', color: '#fff' },
        { bg: '#fd7e14', color: '#fff' },
        { bg: '#dc3545', color: '#fff' },
        { bg: '#e83e8c', color: '#fff' },
        { bg: '#20c997', color: '#fff' },
        { bg: '#795548', color: '#fff' }
    ];
    const c = colors[(nomor - 1) % colors.length];
    return `background:${c.bg};color:${c.color};`;
}

function renderGiliranCards() {
    const grid = document.getElementById('giliranGrid');
    if (!grid) return;

    const list = giliranState.barberList;

    if (!list || list.length === 0) {
        grid.innerHTML = `
            <div class="gb-empty">
                <i class="fas fa-user-clock"></i>
                <p>Belum ada barberman yang clock in hari ini</p>
            </div>
        `;
        return;
    }

    const oldPositions = new Map();
    grid.querySelectorAll('.gb-card').forEach(el => {
        oldPositions.set(el.dataset.nama, el.getBoundingClientRect());
    });

    let nomorUrut = 0;
    const listWithNumber = list.map(barber => {
        if (barber.status === 'Hadir') {
            nomorUrut += 1;
            return { ...barber, nomor: nomorUrut };
        }
        return { ...barber, nomor: null };
    });

    grid.innerHTML = listWithNumber.map(barber => renderCardHTML(barber)).join('');

    grid.querySelectorAll('.gb-card').forEach(el => {
        el.addEventListener('click', () => {
            onBarberCardClick(el.dataset.nama, el.dataset.status);
        });
    });

    // FLIP animation
    grid.querySelectorAll('.gb-card').forEach(el => {
        const nama = el.dataset.nama;
        const oldRect = oldPositions.get(nama);
        if (!oldRect) {
            el.style.opacity = '0';
            el.style.transform = 'scale(0.9)';
            requestAnimationFrame(() => {
                el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                el.style.opacity = '1';
                el.style.transform = 'scale(1)';
            });
            return;
        }
        const newRect = el.getBoundingClientRect();
        const dx = oldRect.left - newRect.left;
        const dy = oldRect.top - newRect.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;

        el.style.transform = `translate(${dx}px, ${dy}px)`;
        el.style.transition = 'none';
        requestAnimationFrame(() => {
            el.style.transition = 'transform 0.9s cubic-bezier(0.22, 1.2, 0.36, 1)';
            el.style.transform = 'translate(0, 0)';
        });
    });

    applyHighlights(grid);

    if (giliranState.highlightTimer) clearTimeout(giliranState.highlightTimer);
    giliranState.highlightTimer = setTimeout(() => {
        giliranState.highlightNama = null;
        giliranState.highlightNaik = null;
    }, 2500);
}

function applyHighlights(grid) {
    const turunNama = giliranState.highlightNama;
    const naikNama = giliranState.highlightNaik;

    grid.querySelectorAll('.gb-card').forEach(el => {
        const nama = el.dataset.nama;
        el.classList.remove('gb-highlight-turun', 'gb-highlight-naik', 'gb-highlight-geser');

        if (turunNama && nama === turunNama) {
            el.classList.add('gb-highlight-turun');
        } else if (naikNama && nama === naikNama) {
            el.classList.add('gb-highlight-naik');
        } else if (turunNama || naikNama) {
            el.classList.add('gb-highlight-geser');
        }
    });
}

function renderCardHTML(barber) {
    const statusClass = getGiliranStatusClass(barber.status);
    const statusIcon = getGiliranStatusIcon(barber.status);
    const photoHTML = barber.photo_url
        ? `<img src="${barber.photo_url}" alt="${barber.nama}" onerror="this.style.display='none';this.parentNode.innerHTML='<i class=\\'fas fa-user-circle\\'></i>';" />`
        : `<i class="fas fa-user-circle"></i>`;

    const canClick = giliranState.isOwnerOrKasir &&
        ['Hadir', 'Istirahat'].includes(barber.status);

    let nomorHTML;
    if (barber.nomor !== null && barber.nomor !== undefined) {
        const style = getNomorColorStyle(barber.nomor);
        nomorHTML = `<div class="gb-nomor" style="${style}">${barber.nomor}</div>`;
    } else {
        nomorHTML = `<div class="gb-nomor gb-nomor-none">-</div>`;
    }

    return `
        <div class="gb-card gb-${statusClass} ${canClick ? 'gb-clickable' : ''}"
             data-nama="${barber.nama}"
             data-status="${barber.status}"
             title="${canClick ? 'Klik untuk ubah status' : ''}">
            <div class="gb-photo">${photoHTML}</div>
            <div class="gb-info">
                <div class="gb-name">${barber.nama}</div>
                <div class="gb-posisi">${barber.posisi}</div>
                <div class="gb-badge gb-${statusClass}">
                    <i class="fas ${statusIcon}"></i> ${barber.status}
                </div>
            </div>
            ${nomorHTML}
        </div>
    `;
}

function getGiliranStatusClass(status) {
    return {
        'Hadir': 'status-hadir',
        'Istirahat': 'status-istirahat',
        'Libur': 'status-libur',
        'Izin': 'status-izin'
    }[status] || 'status-hadir';
}

function getGiliranStatusIcon(status) {
    return {
        'Hadir': 'fa-check-circle',
        'Istirahat': 'fa-mug-hot',
        'Libur': 'fa-umbrella-beach',
        'Izin': 'fa-file-alt'
    }[status] || 'fa-check-circle';
}

// ========== INTERAKSI TOGGLE ISTIRAHAT ==========

async function onBarberCardClick(nama, status) {
    if (!giliranState.isOwnerOrKasir) return;
    if (!['Hadir', 'Istirahat'].includes(status)) return;

    const isBreak = status === 'Hadir';
    const message = isBreak
        ? `Set ${nama} ke status Istirahat?\n\nBarberman akan turun ke urutan bawah dan tidak diperhitungkan sampai kembali Hadir.\n\n(Semua device akan melihat perubahan ini)`
        : `Set ${nama} kembali ke status Hadir?\n\nBarberman akan diperhitungkan kembali saat ada transaksi baru.`;

    if (!confirm(message)) return;

    try {
        const today = getGiliranTodayStr();
        const outlet = giliranState.outlet;
        const newValue = isBreak ? 'Istirahat' : null;

        const { error } = await supabase
            .from('absen')
            .update({ status_istirahat: newValue })
            .eq('outlet', outlet)
            .eq('tanggal', today)
            .eq('nama', nama);

        if (error) throw error;

        // Fetch ulang (re-kalkulasi + persist + render)
        await fetchAndRenderGiliran();

    } catch (err) {
        console.error('[Giliran] onBarberCardClick error:', err);
        alert('Gagal mengubah status: ' + err.message);
    }
}

// ========== REALTIME ==========

function setupGiliranRealtime() {
    try {
        const channelName = `giliran-${giliranState.outlet}-${Date.now()}`;
        giliranState.realtimeChannel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'transaksi_detail' },
                (payload) => handleTransaksiBaruGiliran(payload)
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'absen' },
                (payload) => handleAbsenChange(payload)
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'absen' },
                (payload) => handleAbsenChange(payload)
            )
            .subscribe((status) => {
                const wasConnected = giliranState.realtimeConnected;
                giliranState.realtimeConnected = status === 'SUBSCRIBED';
                console.log('[Giliran] Realtime status:', status);
                if (status === 'SUBSCRIBED' && !wasConnected) {
                    scheduleFetchAndRender(100);
                }
            });
    } catch (err) {
        console.error('[Giliran] setupGiliranRealtime error:', err);
    }
}

function handleTransaksiBaruGiliran(payload) {
    try {
        const row = payload.new;
        if (!row) return;
        if (row.outlet !== giliranState.outlet) return;
        if ((row.status || '').toLowerCase() !== 'completed') return;
        if (!GILIRAN_JASA_GROUPS.includes(row.item_group)) return;
        if (!row.order_no || !row.serve_by) return;

        // Trigger fetch (debounce 300ms)
        // Fetch akan query transaksi & re-kalkulasi dari scratch
        console.log('[Giliran] Transaksi baru terdeteksi, refresh...');
        scheduleFetchAndRender(300);
    } catch (err) {
        console.error('[Giliran] handleTransaksiBaruGiliran error:', err);
    }
}

function handleAbsenChange(payload) {
    try {
        const row = payload.new;
        if (!row) return;
        if (row.outlet !== giliranState.outlet) return;
        if (row.tanggal !== getGiliranTodayStr()) return;
        scheduleFetchAndRender(300);
    } catch (err) {
        console.error('[Giliran] handleAbsenChange error:', err);
    }
}

// ========== POLLING (dengan optimasi) ==========

function setupGiliranPolling() {
    const tick = async () => {
        try {
            // Skip kalau tab background
            if (!giliranState.tabActive) {
                giliranState.pollingTimer = setTimeout(tick, 60000);
                return;
            }

            // Skip kalau baru fetch <60 detik lalu
            if (Date.now() - giliranState.lastFetchTime < 60000) {
                const interval = giliranState.realtimeConnected ? 120000 : 30000;
                giliranState.pollingTimer = setTimeout(tick, interval);
                return;
            }

            await fetchAndRenderGiliran();
        } catch (err) {
            console.error('[Giliran] polling error:', err);
        }

        if (giliranState.pollingTimer) clearTimeout(giliranState.pollingTimer);
        const interval = giliranState.realtimeConnected ? 120000 : 30000;
        giliranState.pollingTimer = setTimeout(tick, interval);
    };
    giliranState.pollingTimer = setTimeout(tick, 120000);
}

// ========== CLEANUP ==========

function cleanupGiliranListeners() {
    if (giliranState.realtimeChannel) {
        try { supabase.removeChannel(giliranState.realtimeChannel); } catch (e) {}
        giliranState.realtimeChannel = null;
    }
    if (giliranState.pollingTimer) {
        clearTimeout(giliranState.pollingTimer);
        giliranState.pollingTimer = null;
    }
    if (giliranState.highlightTimer) {
        clearTimeout(giliranState.highlightTimer);
        giliranState.highlightTimer = null;
    }
    if (_fetchDebounceTimer) {
        clearTimeout(_fetchDebounceTimer);
        _fetchDebounceTimer = null;
    }
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    giliranState.realtimeConnected = false;
}

// ========== HELPER ==========

function getGiliranTodayStr() {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return `${d}/${m}/${y}`;
}

function getGiliranTodayDBStr() {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return `${y}-${m}-${d}`;
}

window.loadGiliranBarberman = loadGiliranBarberman;
window.cleanupGiliranListeners = cleanupGiliranListeners;
