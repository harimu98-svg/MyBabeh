// ========== MODUL GILIRAN BARBERMAN ==========
// Self-contained: HTML, CSS (scoped), JS logic
// Semua class CSS pakai prefix "gb-" agar tidak menimpa style existing

const GILIRAN_JASA_GROUPS = ['Jasa', 'Tarif Hari Raya', 'Tarif Lebaran'];
const GILIRAN_STYLE_ID = 'giliran-barberman-styles';

const giliranState = {
    barberList: [],
    breakSet: new Set(),
    processedOrderNos: new Set(),
    realtimeChannel: null,
    pollingTimer: null,
    realtimeConnected: false,
    outlet: null,
    isOwnerOrKasir: false,
    lastAbsenSnapshot: new Map()
};

// ========== INJECT CSS (SCOPED) ==========

function injectGiliranStyles() {
    // Hapus style lama jika ada (anti-dobel saat reload)
    const existing = document.getElementById(GILIRAN_STYLE_ID);
    if (existing) existing.remove();

    const style = document.createElement('style');
    style.id = GILIRAN_STYLE_ID;
    style.textContent = `
/* ========== GILIRAN BARBERMAN (scoped: prefix gb-) ========== */
.gb-section {
    padding: 15px;
    background: #fff;
    border-radius: 12px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.gb-section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 12px 0;
    font-size: 1.1rem;
    color: #2c3e50;
}

.gb-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 10px;
}

.gb-loading,
.gb-empty {
    grid-column: 1 / -1;
    text-align: center;
    padding: 24px 12px;
    color: #889;
    font-size: 0.9rem;
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
    gap: 10px;
    padding: 10px;
    background: #fff;
    border: 1px solid #e6e9ee;
    border-radius: 10px;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                box-shadow 0.2s ease,
                border-color 0.2s ease;
    will-change: transform;
    cursor: default;
    position: relative;
    overflow: hidden;
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
    font-size: 0.85rem;
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

@media (max-width: 480px) {
    .gb-grid {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 8px;
    }
    .gb-card { padding: 8px; gap: 8px; }
    .gb-photo { width: 38px; height: 38px; font-size: 1.4rem; }
    .gb-name { font-size: 0.78rem; }
    .gb-posisi { font-size: 0.68rem; }
}
    `;
    document.head.appendChild(style);
}

// ========== RENDER SECTION (HTML skeleton) ==========

function ensureGiliranSection() {
    // Cek apakah section sudah ada di HTML (kalau user tambahkan manual)
    let section = document.getElementById('giliranSection');
    if (section) return section;

    // Kalau tidak ada, buat baru & inject sebelum <main class="main-content">
    const main = document.querySelector('.main-content');
    if (!main) {
        console.warn('[Giliran] .main-content not found, tidak bisa inject section');
        return null;
    }

    section = document.createElement('section');
    section.id = 'giliranSection';
    section.className = 'gb-section';
    section.innerHTML = `
        <h2 class="gb-section-title">
            <i class="fas fa-users"></i> Giliran Barberman
        </h2>
        <div class="gb-grid" id="giliranGrid">
            <div class="gb-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Memuat giliran barberman...</span>
            </div>
        </div>
    `;
    main.parentNode.insertBefore(section, main);
    return section;
}

// ========== FUNGSI UTAMA ==========

async function loadGiliranBarberman() {
    try {
        injectGiliranStyles();
        if (!ensureGiliranSection()) return;

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

        renderGiliranSkeleton();
        await fetchAndRenderGiliran();

        setupGiliranRealtime();
        setupGiliranPolling();

    } catch (err) {
        console.error('[Giliran] loadGiliranBarberman error:', err);
    }
}

async function fetchAndRenderGiliran() {
    try {
        const today = getGiliranTodayStr();
        const outlet = giliranState.outlet;

        const { data: absenData, error: absenErr } = await supabase
            .from('absen')
            .select('nama, clockin, clockout, outlet, tanggal')
            .eq('outlet', outlet)
            .eq('tanggal', today);

        if (absenErr) throw absenErr;

        const { data: karyawanBarber, error: karErr } = await supabase
            .from('karyawan')
            .select('nama_karyawan, posisi, photo_url')
            .eq('outlet', outlet)
            .eq('role', 'barberman')
            .eq('status', 'active');

        if (karErr) throw karErr;

        const karyawanMap = new Map();
        (karyawanBarber || []).forEach(k => karyawanMap.set(k.nama_karyawan, k));

        const hadirList = [];
        const liburIzinList = [];

        (absenData || []).forEach(absen => {
            const karyawan = karyawanMap.get(absen.nama);
            if (!karyawan) return;

            const clockinRaw = (absen.clockin || '').toString().trim();
            const clockoutRaw = (absen.clockout || '').toString().trim();

            // Belum clockin
            if (!clockinRaw) return;

            // Libur / Izin
            if (clockinRaw === 'Libur' || clockinRaw === 'Izin') {
                liburIzinList.push({
                    nama: absen.nama,
                    posisi: karyawan.posisi || '-',
                    photo_url: karyawan.photo_url || null,
                    clockin: clockinRaw,
                    clockout: clockoutRaw,
                    status: clockinRaw
                });
                return;
            }

            // Sudah clockout → hapus dari list
            if (clockoutRaw) return;

            // Hadir / Istirahat
            const isIstirahat = giliranState.breakSet.has(absen.nama);
            hadirList.push({
                nama: absen.nama,
                posisi: karyawan.posisi || '-',
                photo_url: karyawan.photo_url || null,
                clockin: clockinRaw,
                clockout: null,
                status: isIstirahat ? 'Istirahat' : 'Hadir'
            });
        });

        hadirList.sort((a, b) => (a.clockin || '').localeCompare(b.clockin || ''));

        const hadirOnly = hadirList.filter(b => b.status === 'Hadir');
        const istirahatOnly = hadirList.filter(b => b.status === 'Istirahat');

        const finalList = mergeGiliranOrder(hadirOnly, istirahatOnly, liburIzinList);
        giliranState.barberList = finalList;

        giliranState.lastAbsenSnapshot.clear();
        (absenData || []).forEach(a => {
            giliranState.lastAbsenSnapshot.set(a.nama, {
                clockin: a.clockin,
                clockout: a.clockout
            });
        });

        renderGiliranCards();

    } catch (err) {
        console.error('[Giliran] fetchAndRenderGiliran error:', err);
        renderGiliranError(err.message);
    }
}

function mergeGiliranOrder(hadirList, istirahatList, liburIzinList) {
    const prevHadirOrder = giliranState.barberList
        .filter(b => b.status === 'Hadir')
        .map(b => b.nama);

    const hadirNames = new Set(hadirList.map(b => b.nama));
    const orderedHadir = [];
    prevHadirOrder.forEach(nama => {
        if (hadirNames.has(nama)) {
            const item = hadirList.find(b => b.nama === nama);
            if (item) orderedHadir.push(item);
        }
    });

    const newBarbers = hadirList.filter(b => !prevHadirOrder.includes(b.nama));
    newBarbers.sort((a, b) => (a.clockin || '').localeCompare(b.clockin || ''));

    let result;
    if (orderedHadir.length === 0) result = [...newBarbers];
    else result = [...orderedHadir, ...newBarbers];

    const prevIstirahatOrder = giliranState.barberList
        .filter(b => b.status === 'Istirahat')
        .map(b => b.nama);
    const istirahatNames = new Set(istirahatList.map(b => b.nama));
    const orderedIstirahat = [];
    prevIstirahatOrder.forEach(nama => {
        if (istirahatNames.has(nama)) {
            const item = istirahatList.find(b => b.nama === nama);
            if (item) orderedIstirahat.push(item);
        }
    });
    istirahatList.forEach(b => {
        if (!prevIstirahatOrder.includes(b.nama)) orderedIstirahat.push(b);
    });

    return [...result, ...orderedIstirahat, ...liburIzinList];
}

// ========== RENDER ==========

function renderGiliranSkeleton() {
    const grid = document.getElementById('giliranGrid');
    if (!grid) return;
    grid.innerHTML = `
        <div class="gb-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Memuat giliran barberman...</span>
        </div>
    `;
}

function renderGiliranError(message) {
    const grid = document.getElementById('giliranGrid');
    if (!grid) return;
    grid.innerHTML = `
        <div class="gb-empty">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Gagal memuat giliran</p>
            <small>${message || ''}</small>
        </div>
    `;
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

    grid.innerHTML = list.map(barber => renderCardHTML(barber)).join('');

    grid.querySelectorAll('.gb-card').forEach(el => {
        el.addEventListener('click', () => {
            onBarberCardClick(el.dataset.nama, el.dataset.status);
        });
    });

    grid.querySelectorAll('.gb-card').forEach(el => {
        const nama = el.dataset.nama;
        const oldRect = oldPositions.get(nama);
        if (!oldRect) {
            el.style.opacity = '0';
            el.style.transform = 'scale(0.9)';
            requestAnimationFrame(() => {
                el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
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
            el.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            el.style.transform = 'translate(0, 0)';
        });
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

// ========== INTERAKSI ==========

async function onBarberCardClick(nama, status) {
    if (!giliranState.isOwnerOrKasir) return;
    if (!['Hadir', 'Istirahat'].includes(status)) return;

    const isBreak = status === 'Hadir';
    const message = isBreak
        ? `Set ${nama} ke status Istirahat?\n\nBarberman akan turun ke urutan bawah dan tidak diperhitungkan sampai kembali Hadir.`
        : `Set ${nama} kembali ke status Hadir?\n\nBarberman akan diperhitungkan kembali saat ada transaksi baru.`;

    if (!confirm(message)) return;

    if (isBreak) giliranState.breakSet.add(nama);
    else giliranState.breakSet.delete(nama);

    await fetchAndRenderGiliran();
}

// ========== REALTIME ==========

function setupGiliranRealtime() {
    try {
        const channelName = `giliran-transaksi-${giliranState.outlet}-${Date.now()}`;
        giliranState.realtimeChannel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'transaksi_detail' },
                (payload) => handleTransaksiBaruGiliran(payload)
            )
            .subscribe((status) => {
                giliranState.realtimeConnected = status === 'SUBSCRIBED';
                console.log('[Giliran] Realtime status:', status);
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

        giliranState.barberList.splice(idx, 1);

        // Cari posisi terakhir grup Hadir (di atas Istirahat/Libur/Izin)
        let lastHadirIdx = -1;
        for (let i = 0; i < giliranState.barberList.length; i++) {
            if (giliranState.barberList[i].status === 'Hadir') lastHadirIdx = i;
            else break;
        }

        giliranState.barberList.splice(lastHadirIdx + 1, 0, barber);
        renderGiliranCards();

        console.log(`[Giliran] ${serveBy} turun ke bawah grup Hadir karena transaksi ${orderNo}`);
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
