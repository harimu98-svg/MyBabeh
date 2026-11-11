// ========== MODUL URUTAN BARBERMAN ==========
// Self-contained: HTML, CSS (scoped), JS logic
// Class prefix "gb-" agar tidak menimpa style existing.
//
// Sumber data:
//   - absen (nama, clockin, clockout, outlet, tanggal, status_istirahat, urutan_giliran)
//     * status_kehadiran TIDAK disentuh
//     * status_istirahat: NULL=normal, 'Istirahat'=sedang istirahat
//     * urutan_giliran: NULL=belum ada urutan (ikut clockin), int=dipaksa urutan ini
//   - karyawan (nama_karyawan, posisi, photo_url, role, status, outlet)
//   - transaksi_detail (realtime) — untuk turun urutan
//
// Aturan urutan:
//   [1] Hadir dengan urutan_giliran (sort by urutan asc)
//   [2] Hadir tanpa urutan_giliran (sort by clockin asc) → di bawah grup hadir
//   [3] Istirahat (sort by urutan lama atau clockin)
//   [4] Libur / Izin
//   clockin kosong → tidak tampil
//   clockout=waktu → hapus dari list
//
// Transaksi baru (item_group Jasa/Tarif Hari Raya/Tarif Lebaran) → turun ke bawah grup Hadir.
// Setelah turun, persist urutan 1..N ke kolom urutan_giliran (semua barber Hadir).
// Dedup by order_no.

const GILIRAN_JASA_GROUPS = ['Jasa', 'Tarif Hari Raya', 'Tarif Lebaran'];
const GILIRAN_STYLE_ID = 'giliran-barberman-styles';

const giliranState = {
    barberList: [],
    processedOrderNos: new Set(),
    realtimeChannel: null,
    pollingTimer: null,
    realtimeConnected: false,
    outlet: null,
    isOwnerOrKasir: false,
    currentUserName: null,
    currentUserRole: null,
    lastAbsenSnapshot: new Map(),
    lastTopBarber: null,
    audioUnlocked: false,
    audioEl: null,
    // Untuk highlight animasi
    highlightNama: null,        // nama barber yang baru turun
    highlightAll: false,        // highlight semua card (saat urutan berubah)
    highlightTimer: null
};

// ========== INJECT CSS (SCOPED) ==========

function injectGiliranStyles() {
    const existing = document.getElementById(GILIRAN_STYLE_ID);
    if (existing) existing.remove();

    const style = document.createElement('style');
    style.id = GILIRAN_STYLE_ID;
    style.textContent = `
/* ========== URUTAN BARBERMAN (scoped: prefix gb-) ========== */
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
.gb-sound-toggle.gb-sound-on {
    background: #d4edda;
    color: #155724;
}

.gb-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;     /* center card 2/3 */
}

.gb-loading,
.gb-empty {
    text-align: center;
    padding: 24px 12px;
    color: #889;
    font-size: 0.9rem;
    width: 100%;
}

.gb-loading i,
.gb-empty i {
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
    /* Animasi lebih lambat: 0.9s ease-out dengan sedikit overshoot */
    transition: transform 0.9s cubic-bezier(0.22, 1.2, 0.36, 1),
                box-shadow 0.3s ease,
                border-color 0.3s ease,
                background-color 0.6s ease;
    will-change: transform;
    cursor: default;
    position: relative;
    overflow: hidden;
    width: 66.6667%;         /* 2/3 lebar */
    max-width: 480px;        /* batas max di desktop */
    box-sizing: border-box;
}

/* Highlight: card yang baru turun */
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

/* Highlight: card yang posisinya bergeser (karena barber lain turun) */
.gb-card.gb-highlight-geser {
    background: #f0f9f4 !important;
    animation: gbPulseGeser 1.4s ease-out;
}

@keyframes gbPulseGeser {
    0%   { background: #d4edda; }
    100% { background: #ffffff; }
}

/* Highlight: card yang baru naik ke posisi 1 */
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

.gb-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

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

/* Toast notifikasi */
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

.gb-toast.gb-toast-hide {
    animation: gbToastOut 0.3s ease forwards;
}

.gb-toast-icon {
    font-size: 1.5rem;
    animation: gbToastRing 0.6s ease 0.2s;
}

.gb-toast-text strong {
    display: block;
    font-size: 0.9rem;
    margin-bottom: 2px;
}
.gb-toast-text div {
    font-size: 0.8rem;
    opacity: 0.9;
}

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

/* Mobile */
@media (max-width: 480px) {
    .gb-grid { gap: 6px; }
    .gb-card {
        padding: 8px 10px;
        gap: 10px;
        width: 100%;          /* full width di mobile */
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
        // Update header dengan tombol sound
        let header = section.querySelector('.gb-header-row');
        if (!header) {
            // Kalau header lama ada, replace
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

// ========== AUDIO NOTIFICATION ==========

function setupAudioNotification() {
    const btn = document.getElementById('gbSoundToggle');
    if (!btn) return;

    // Cek localStorage
    const saved = localStorage.getItem('gb_audio_unlocked') === '1';
    if (saved) {
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
            // Fallback: pakai Web Audio API beep
            playBeepFallback();
            giliranState.audioUnlocked = true;
            localStorage.setItem('gb_audio_unlocked', '1');
            btn.innerHTML = '<i class="fas fa-volume-up"></i>';
            btn.classList.add('gb-sound-on');
        }
    });
}

function playNotificationSound() {
    if (navigator.vibrate) {
        navigator.vibrate([300, 150, 300, 150, 300]);
    }

    if (giliranState.audioUnlocked) {
        if (giliranState.audioEl) {
            try {
                giliranState.audioEl.currentTime = 0;
                giliranState.audioEl.play().catch(err => {
                    console.warn('[Giliran] Gagal play audio:', err.message);
                    playBeepFallback();
                });
            } catch (e) {
                playBeepFallback();
            }
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
    } catch (e) {
        console.warn('[Giliran] Beep fallback error:', e);
    }
}

function showGiliranToast(namaBarber, isMe) {
    const old = document.getElementById('gbToast');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.id = 'gbToast';
    toast.className = 'gb-toast';
    toast.innerHTML = `
        <div class="gb-toast-icon">
            <i class="fas fa-bell"></i>
        </div>
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

        renderGiliranSkeleton();
        await fetchAndRenderGiliran();

        setupGiliranRealtime();
        setupGiliranPolling();

    } catch (err) {
        console.error('[Giliran] loadGiliranBarberman error:', err);
    }
}

// ========== FETCH & MERGE ==========

// Debounce fetch, agar 5 event realtime beruntun → 1x fetch
let _fetchDebounceTimer = null;
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
        const outlet = giliranState.outlet;

        const [absenRes, karyawanRes] = await Promise.all([
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
                .eq('status', 'active')
        ]);

        if (absenRes.error) throw absenRes.error;
        if (karyawanRes.error) throw karyawanRes.error;

        const absenData = absenRes.data || [];
        const karyawanBarber = karyawanRes.data || [];

        const karyawanMap = new Map();
        karyawanBarber.forEach(k => karyawanMap.set(k.nama_karyawan, k));

        const hadirList = [];
        const liburIzinList = [];

        absenData.forEach(absen => {
            const karyawan = karyawanMap.get(absen.nama);
            if (!karyawan) return;

            const clockinRaw = (absen.clockin || '').toString().trim();
            const clockoutRaw = (absen.clockout || '').toString().trim();
            const statusIstirahat = (absen.status_istirahat || '').toString().trim();
            const urutanDB = absen.urutan_giliran;

            if (!clockinRaw) return;

            if (clockinRaw === 'Libur' || clockinRaw === 'Izin') {
                liburIzinList.push({
                    nama: absen.nama,
                    posisi: karyawan.posisi || '-',
                    photo_url: karyawan.photo_url || null,
                    clockin: clockinRaw,
                    clockout: clockoutRaw,
                    status: clockinRaw,
                    urutan_giliran: null
                });
                return;
            }

            if (clockoutRaw) return;

            const isIstirahat = statusIstirahat === 'Istirahat';
            hadirList.push({
                nama: absen.nama,
                posisi: karyawan.posisi || '-',
                photo_url: karyawan.photo_url || null,
                clockin: clockinRaw,
                clockout: null,
                status: isIstirahat ? 'Istirahat' : 'Hadir',
                urutan_giliran: urutanDB
            });
        });

        // Pisahkan Hadir: dengan urutan vs tanpa urutan
        const hadirOnly = hadirList.filter(b => b.status === 'Hadir');
        const istirahatOnly = hadirList.filter(b => b.status === 'Istirahat');

        const hadirDenganUrutan = hadirOnly.filter(b => 
            b.urutan_giliran !== null && b.urutan_giliran !== undefined
        );
        const hadirTanpaUrutan = hadirOnly.filter(b => 
            b.urutan_giliran === null || b.urutan_giliran === undefined
        );

        hadirDenganUrutan.sort((a, b) => a.urutan_giliran - b.urutan_giliran);
        hadirTanpaUrutan.sort((a, b) => (a.clockin || '').localeCompare(b.clockin || ''));

        const finalHadir = [...hadirDenganUrutan, ...hadirTanpaUrutan];

        istirahatOnly.sort((a, b) => {
            const ua = a.urutan_giliran ?? 9999;
            const ub = b.urutan_giliran ?? 9999;
            if (ua !== ub) return ua - ub;
            return (a.clockin || '').localeCompare(b.clockin || '');
        });

        const finalList = [...finalHadir, ...istirahatOnly, ...liburIzinList];

        // ===== DETEKSI PERUBAHAN URUTAN UNTUK HIGHLIGHT =====
        const prevList = giliranState.barberList || [];
        const prevOrder = new Map();
        prevList.forEach((b, i) => prevOrder.set(b.nama, i));

        // Cari barber yang turun/naik posisi
        let highlightNama = null;
        if (prevList.length > 0) {
            // Cari yang posisinya paling banyak turun (kandidat "yang baru turun")
            let maxDrop = 0;
            let droppedBarber = null;
            finalList.forEach((b, newIdx) => {
                const oldIdx = prevOrder.get(b.nama);
                if (oldIdx !== undefined && oldIdx < newIdx) {
                    const drop = newIdx - oldIdx;
                    if (drop > maxDrop) {
                        maxDrop = drop;
                        droppedBarber = b.nama;
                    }
                }
            });
            if (droppedBarber && maxDrop > 0) {
                highlightNama = droppedBarber;
            }
        }

        // Deteksi barber baru di posisi 1
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

        // Simpan highlight state
        giliranState.highlightNama = highlightNama;
        giliranState.highlightNaik = highlightNaik;
        giliranState.lastTopBarber = newTopBarber;
        giliranState.barberList = finalList;

        giliranState.lastAbsenSnapshot.clear();
        absenData.forEach(a => {
            giliranState.lastAbsenSnapshot.set(a.nama, {
                clockin: a.clockin,
                clockout: a.clockout,
                status_istirahat: a.status_istirahat,
                urutan_giliran: a.urutan_giliran
            });
        });

        renderGiliranCards();

    } catch (err) {
        console.error('[Giliran] fetchAndRenderGiliran error:', err);
        renderGiliranError(err.message);
    }
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

    // Capture posisi lama (FLIP)
    const oldPositions = new Map();
    grid.querySelectorAll('.gb-card').forEach(el => {
        oldPositions.set(el.dataset.nama, el.getBoundingClientRect());
    });

    // Hitung nomor urut
    let nomorUrut = 0;
    const listWithNumber = list.map(barber => {
        if (barber.status === 'Hadir') {
            nomorUrut += 1;
            return { ...barber, nomor: nomorUrut };
        }
        return { ...barber, nomor: null };
    });

    grid.innerHTML = listWithNumber.map(barber => renderCardHTML(barber)).join('');

    // Attach click
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
            // Card baru: fade-in + scale
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

        // Invert
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        el.style.transition = 'none';

        // Play (lebih lambat: 0.9s)
        requestAnimationFrame(() => {
            el.style.transition = 'transform 0.9s cubic-bezier(0.22, 1.2, 0.36, 1)';
            el.style.transform = 'translate(0, 0)';
        });
    });

    // Terapkan highlight setelah render
    applyHighlights(grid);

    // Reset highlight setelah 2.5 detik
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
            // Card lain yang posisinya bergeser → highlight halus
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
        ? `Set ${nama} ke status Istirahat?\n\nBarberman akan turun ke urutan bawah dan tidak diperhitungkan sampai kembali Hadir.`
        : `Set ${nama} kembali ke status Hadir?\n\nBarberman akan diperhitungkan kembali saat ada transaksi baru.`;

    if (!confirm(message)) return;

    try {
        const today = getGiliranTodayStr();
        const outlet = giliranState.outlet;
        const newValue = isBreak ? 'Istirahat' : null;

        const { error } = await supabase
            .from('absen')
            .update({
                status_istirahat: newValue,
                urutan_giliran: null
            })
            .eq('outlet', outlet)
            .eq('tanggal', today)
            .eq('nama', nama);

        if (error) throw error;

        await fetchAndRenderGiliran();
        await persistUrutanKeDB();

        console.log(`[Giliran] ${nama} → ${isBreak ? 'Istirahat' : 'Hadir'}`);

    } catch (err) {
        console.error('[Giliran] onBarberCardClick error:', err);
        alert('Gagal mengubah status: ' + err.message);
    }
}

// ========== PERSIST URUTAN ==========

async function persistUrutanKeDB() {
    try {
        const today = getGiliranTodayStr();
        const outlet = giliranState.outlet;

        const hadirList = giliranState.barberList.filter(b => b.status === 'Hadir');
        if (hadirList.length === 0) return;

        const updates = hadirList.map((barber, index) =>
            supabase
                .from('absen')
                .update({ urutan_giliran: index + 1 })
                .eq('outlet', outlet)
                .eq('tanggal', today)
                .eq('nama', barber.nama)
        );

        const results = await Promise.all(updates);
        const failed = results.filter(r => r.error);
        if (failed.length > 0) {
            console.warn('[Giliran] Sebagian update urutan gagal:', failed);
        } else {
            console.log('[Giliran] Urutan tersimpan:', hadirList.map((b, i) => `${i + 1}.${b.nama}`).join(', '));
        }
    } catch (err) {
        console.error('[Giliran] persistUrutanKeDB error:', err);
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

                // Reconnect → refresh untuk tangkap yang terlewat
                if (status === 'SUBSCRIBED' && !wasConnected) {
                    scheduleFetchAndRender(100);
                }
            });
    } catch (err) {
        console.error('[Giliran] setupGiliranRealtime error:', err);
    }
}

function handleAbsenChange(payload) {
    try {
        const row = payload.new;
        if (!row) return;
        if (row.outlet !== giliranState.outlet) return;
        if (row.tanggal !== getGiliranTodayStr()) return;
        // Debounce: kalau 5 event beruntun, cukup 1x fetch
        scheduleFetchAndRender(300);
    } catch (err) {
        console.error('[Giliran] handleAbsenChange error:', err);
    }
}

function handleTransaksiBaruGiliran(payload) {
    try {
        const row = payload.new;
        if (!row) return;
        if (row.outlet !== giliranState.outlet) return;
        if ((row.status || '').toLowerCase() !== 'completed') return;
        if (!GILIRAN_JASA_GROUPS.includes(row.item_group)) return;

        const orderNo = row.order_no;
        if (!orderNo) return;
        if (giliranState.processedOrderNos.has(orderNo)) return;
        giliranState.processedOrderNos.add(orderNo);

        const serveBy = row.serve_by;
        if (!serveBy) return;

        const idx = giliranState.barberList.findIndex(b => b.nama === serveBy);
        if (idx === -1) return;

        const barber = giliranState.barberList[idx];
        if (barber.status !== 'Hadir') return;

        // 1. Pindah di memory (untuk animasi smooth)
        giliranState.barberList.splice(idx, 1);

        let lastHadirIdx = -1;
        for (let i = 0; i < giliranState.barberList.length; i++) {
            if (giliranState.barberList[i].status === 'Hadir') lastHadirIdx = i;
            else break;
        }
        giliranState.barberList.splice(lastHadirIdx + 1, 0, barber);

        // Set highlight
        giliranState.highlightNama = serveBy;

        renderGiliranCards();

        console.log(`[Giliran] ${serveBy} turun ke bawah grup Hadir (order ${orderNo})`);

        // 2. Persist urutan ke DB (async)
        persistUrutanKeDB();

    } catch (err) {
        console.error('[Giliran] handleTransaksiBaruGiliran error:', err);
    }
}

// ========== POLLING ==========

function setupGiliranPolling() {
    const tick = async () => {
        try {
            await fetchAndRenderGiliran();
        } catch (err) {
            console.error('[Giliran] polling error:', err);
        }
        if (giliranState.pollingTimer) clearTimeout(giliranState.pollingTimer);
        const interval = giliranState.realtimeConnected ? 60000 : 30000;
        giliranState.pollingTimer = setTimeout(tick, interval);
    };
    giliranState.pollingTimer = setTimeout(tick, 60000);
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

window.loadGiliranBarberman = loadGiliranBarberman;
window.cleanupGiliranListeners = cleanupGiliranListeners;
