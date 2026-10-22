const API_BASE_URL = 'http://localhost:5129/api/v1';

let currentUser = null;
let currentPage = 1;
const PAGE_SIZE = 20;

function formatRupiah(val) {
    if (val === null || val === undefined || isNaN(val)) return '0';
    return Number(val).toLocaleString('id-ID');
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function updateClock() {
    const clockEl = document.getElementById('realtime-clock');
    if (!clockEl) return;
    const now = new Date();
    const dateStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${dateStr}, ${hours}.${minutes}.${seconds}`;
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

async function loadHistory(page = 1) {
    const dateInput = document.getElementById('history-date');
    const tbody = document.getElementById('history-table-body');
    const paginationContainer = document.getElementById('pagination-controls');

    const selectedDate = dateInput ? dateInput.value : '';

    if (!selectedDate) {
        alert('Silakan pilih tanggal transaksi terlebih dahulu.');
        return;
    }

    currentPage = page;

    tbody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; color: #94A3B8; padding: 16px;">
                Memuat data riwayat transaksi...
            </td>
        </tr>
    `;

    try {
        const queryParams = new URLSearchParams({
            date: selectedDate,
            userId: currentUser.idUser || '',
            role: currentUser.role || 'Cashier',
            page: currentPage.toString(),
            pageSize: PAGE_SIZE.toString()
        });

        const res = await fetch(`${API_BASE_URL}/transactions?${queryParams.toString()}`);
        if (!res.ok) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #DC2626; padding: 16px;">
                        Gagal memuat data transaksi dari server.
                    </td>
                </tr>
            `;
            return;
        }

        const result = await res.json();
        const transactions = result.data || (Array.isArray(result) ? result : []);
        const totalPages = result.totalPages || (transactions.length > 0 ? 1 : 0);

        tbody.innerHTML = '';

        if (transactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #94A3B8; padding: 16px;">
                        Tidak ada riwayat transaksi pada tanggal ini.
                    </td>
                </tr>
            `;
            paginationContainer.innerHTML = '';
            return;
        }

        transactions.forEach(tx => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escapeHtml(tx.invoiceNo)}</td>
                <td>${escapeHtml(tx.transactionDate || formatDateTime(tx.datein))}</td>
                <td>${escapeHtml(tx.cashier || currentUser.fullName || currentUser.username)}</td>
                <td>${tx.totalItems || 0}</td>
                <td>${escapeHtml(tx.payment || 'Cash')}</td>
                <td>Rp ${formatRupiah(tx.totalPrice)}</td>
            `;
            tbody.appendChild(tr);
        });

        renderPagination(totalPages);

    } catch (e) {
        console.error('Error saat load riwayat transaksi:', e);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #DC2626; padding: 16px;">
                    Terjadi kesalahan koneksi ke Backend API. Pastikan BeeMart.API berjalan di http://localhost:5129!
                </td>
            </tr>
        `;
    }
}


function renderPagination(totalPages) {
    const paginationContainer = document.getElementById('pagination-controls');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    if (totalPages <= 1) {
        return;
    }

    for (let p = 1; p <= totalPages; p++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `page-btn ${p === currentPage ? 'active' : ''}`;
        btn.textContent = p;
        btn.addEventListener('click', () => {
            loadHistory(p);
        });
        paginationContainer.appendChild(btn);
    }
}

document.addEventListener('DOMContentLoaded', () => {
   
    const userRaw = sessionStorage.getItem('bee_user');
    if (!userRaw) {
        window.location.href = 'login.html';
        return;
    }

    try {
        currentUser = JSON.parse(userRaw);
    } catch {
        currentUser = {};
    }

    if (!currentUser.username) {
        window.location.href = 'login.html';
        return;
    }
 
    const userDisplay = document.getElementById('user-display');
    if (userDisplay) {
        userDisplay.textContent = `Role: ${currentUser.role || 'Cashier'} | Login: ${currentUser.username}`;
    }

    updateClock();
    setInterval(updateClock, 1000);

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            sessionStorage.removeItem('bee_user');
            window.location.href = 'login.html';
        });
    }


    const subtitle = document.getElementById('history-subtitle');
    if (subtitle) {
        if (currentUser.role === 'Admin') {
            subtitle.textContent = 'Pencarian Data Transaksi (Menampilkan Semua Kasir)';
        } else {
            subtitle.textContent = `Pencarian Data Transaksi (Hanya Kasir: ${currentUser.username})`;
        }
    }


    const dateInput = document.getElementById('history-date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    const btnSearch = document.getElementById('btn-search-history');
    if (btnSearch) {
        btnSearch.addEventListener('click', () => {
            loadHistory(1);
        });
    }
    loadHistory(1);
});
