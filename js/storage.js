/**
 * EduOS - Unified Storage & File Management System (Tahap 8)
 * Mengelola penyimpanan lokal terpadu (localStorage), pemulihan dokumen,
 * multi-dokumen Word/Excel/PowerPoint, dialog konfirmasi aman, dan ekspor/impor berkas nyata.
 */

const EduStorage = (function() {
  const STORAGE_KEY = 'eduos_storage_v1';

  // Template Dokumen Awal Kurikulum Informatika SMP
  const DEFAULT_STARTER_FILES = [
    {
      id: 'f_word_1',
      name: 'Laporan_Praktikum_Informatika.docx',
      type: 'word',
      app: 'word',
      size: '14.2 KB',
      date: 'Hari ini, 08:30',
      updatedAt: new Date().toISOString(),
      content: `<h1 class="text-2xl font-bold text-blue-900 mb-2">LAPORAN PRAKTIKUM INFORMATIKA</h1>
<p class="text-sm text-slate-500 mb-4 pb-2 border-b border-slate-300">Topik: Pengenalan Perangkat Keras dan Perangkat Lunak Komputer</p>
<h2 class="text-lg font-bold text-slate-800 mb-2">A. Tujuan Praktikum</h2>
<p class="mb-3 text-slate-700 leading-relaxed">1. Siswa mampu mengidentifikasi komponen utama komputer (CPU, RAM, Storage, Monitor, Keyboard, Mouse).<br>2. Siswa mampu mempraktikkan pengolahan kata dasar secara profesional.</p>
<h2 class="text-lg font-bold text-slate-800 mb-2">B. Hasil Pengamatan Perangkat Keras</h2>
<table class="w-full my-3 border-collapse border border-slate-400 text-sm">
  <thead>
    <tr class="bg-blue-100 text-blue-900 font-bold">
      <th class="border border-slate-400 p-2">Komponen</th>
      <th class="border border-slate-400 p-2">Fungsi Utama</th>
      <th class="border border-slate-400 p-2">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="border border-slate-400 p-2">CPU</td><td class="border border-slate-400 p-2">Memproses instruksi program</td><td class="border border-slate-400 p-2 text-emerald-600 font-bold">Aktif Normal</td></tr>
    <tr><td class="border border-slate-400 p-2">RAM 8GB</td><td class="border border-slate-400 p-2">Penyimpanan memori kerja sementara</td><td class="border border-slate-400 p-2 text-emerald-600 font-bold">Aktif Normal</td></tr>
    <tr><td class="border border-slate-400 p-2">SSD 256GB</td><td class="border border-slate-400 p-2">Media penyimpanan data permanen</td><td class="border border-slate-400 p-2 text-emerald-600 font-bold">Aktif Normal</td></tr>
  </tbody>
</table>
<h2 class="text-lg font-bold text-slate-800 mb-2">C. Kesimpulan</h2>
<p class="text-slate-700 leading-relaxed">Sistem komputer merupakan integrasi harmonis antara perangkat keras (hardware), perangkat lunak (software), dan pengguna (brainware).</p>`
    },
    {
      id: 'f_excel_1',
      name: 'Daftar_Nilai_Praktikum_SMP.xlsx',
      type: 'excel',
      app: 'excel',
      size: '21.5 KB',
      date: 'Kemarin, 14:15',
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      content: {
        currentSheetName: 'Daftar Nilai',
        sheets: {
          'Daftar Nilai': {
            A1: 'No', B1: 'Nama Siswa', C1: 'Tugas 1', D1: 'Tugas 2', E1: 'Praktikum', F1: 'Rata-rata', G1: 'Status',
            A2: '1', B2: 'Ahmad Faiz', C2: '85', D2: '90', E2: '88', F2: '=AVERAGE(C2:E2)', G2: '=IF(F2>=75, "LULUS", "REMIDIAL")',
            A3: '2', B3: 'Budi Santoso', C3: '78', D3: '75', E3: '80', F3: '=AVERAGE(C3:E3)', G3: '=IF(F3>=75, "LULUS", "REMIDIAL")',
            A4: '3', B4: 'Citra Dewi', C4: '92', D4: '95', E4: '90', F4: '=AVERAGE(C4:E4)', G4: '=IF(F4>=75, "LULUS", "REMIDIAL")',
            A5: '4', B5: 'Dimas Anggara', C5: '65', D5: '70', E5: '68', F5: '=AVERAGE(C5:E5)', G5: '=IF(F5>=75, "LULUS", "REMIDIAL")',
            A6: '5', B6: 'Eka Lestari', C6: '88', D6: '85', E6: '92', F6: '=AVERAGE(C6:E6)', G6: '=IF(F6>=75, "LULUS", "REMIDIAL")',
            A8: 'Nilai Tertinggi', B8: '=MAX(F2:F6)',
            A9: 'Nilai Terendah', B9: '=MIN(F2:F6)',
            A10: 'Rata-rata Kelas', B10: '=ROUND(AVERAGE(F2:F6), 2)'
          },
          'Rekapitulasi': {
            A1: 'Kategori', B1: 'Jumlah Siswa',
            A2: 'Total Siswa', B2: '5',
            A3: 'Target Kelulusan', B3: '75',
            A4: 'Semester', B4: 'Genap 2026'
          }
        }
      }
    },
    {
      id: 'f_ppt_1',
      name: 'Presentasi_Perangkat_Keras.pptx',
      type: 'powerpoint',
      app: 'powerpoint',
      size: '38.0 KB',
      date: 'Kemarin, 10:00',
      updatedAt: new Date(Date.now() - 100000000).toISOString(),
      content: {
        theme: 'emerald',
        currentSlideIndex: 0,
        slides: [
          {
            id: 's1',
            layout: 'title',
            title: 'PERANGKAT KERAS KOMPUTER',
            subtitle: 'Materi Pembelajaran Informatika Kelas VII SMP',
            body: [],
            notes: 'Sampaikan salam pembuka, perkenalkan topik hardware komputer sebagai fondasi pembelajaran Informatika.'
          },
          {
            id: 's2',
            layout: 'title-content',
            title: '1. Perangkat Masukan (Input Device)',
            subtitle: 'Alat pengirim data dan instruksi ke komputer',
            body: [
              'Keyboard: Memasukkan karakter huruf, angka, dan perintah.',
              'Mouse: Mengarahkan kursor dan memilih objek visual.',
              'Microphone: Merekam sinyal suara digital.',
              'Scanner: Mengubah dokumen fisik menjadi file digital.'
            ],
            notes: 'Minta siswa menyebutkan contoh perangkat input yang ada di meja praktikum saat ini.'
          },
          {
            id: 's3',
            layout: 'two-content',
            title: '2. Unit Pemroses Pusat (CPU & RAM)',
            subtitle: 'Otak komputasi dan memori kerja cepat',
            body: [
              'CPU (Central Processing Unit): Mengeksekusi instruksi aritmatika & logika program.',
              'Kecepatan diukur dalam Gigahertz (GHz).',
              'RAM (Random Access Memory): Menyimpan data aktif aplikasi sementara.',
              'Memori RAM bersifat volatile (hilang saat listrik mati).'
            ],
            notes: 'Jelaskan perbedaan mendasar fungsi kerja antara CPU dan memori RAM.'
          },
          {
            id: 's4',
            layout: 'title-content',
            title: '3. Perangkat Keluaran (Output Device)',
            subtitle: 'Menampilkan hasil pemrosesan informasi komputer',
            body: [
              'Monitor: Menampilkan antarmuka visual grafik dan sistem operasi.',
              'Speaker: Mengeluarkan output audio dan suara sistem.',
              'Printer: Mencetak dokumen lembar kerja ke media kertas fisik.'
            ],
            notes: 'Tunjukkan monitor di depan siswa sebagai media output visual utama.'
          },
          {
            id: 's5',
            layout: 'title-content',
            title: '4. Media Penyimpanan (Storage Device)',
            subtitle: 'Menyimpan berkas data secara permanen',
            body: [
              'SSD (Solid State Drive): Penyimpanan chip flash berkecepatan tinggi.',
              'Hard Disk Drive (HDD): Penyimpanan piringan magnetik kapasitas besar.',
              'Flashdisk & Memori USB: Media penyimpanan portabel yang fleksibel.'
            ],
            notes: 'Simpulkan materi dengan menekankan pentingnya menyimpan tugas secara teratur ke media storage.'
          }
        ]
      }
    },
    {
      id: 'f_word_2',
      name: 'Rangkuman_Jaringan_Internet.docx',
      type: 'word',
      app: 'word',
      size: '8.4 KB',
      date: '3 hari yang lalu',
      updatedAt: new Date(Date.now() - 250000000).toISOString(),
      content: `<h1 class="text-xl font-bold text-slate-800 mb-2">RANGKUMAN: JARINGAN KOMPUTER & INTERNET</h1>
<p class="text-xs text-slate-500 mb-3 pb-1 border-b border-slate-300">Mata Pelajaran: Informatika SMP</p>
<h3 class="font-bold text-sm text-slate-800 mt-2">1. Pengertian Jaringan</h3>
<p class="text-xs text-slate-700 leading-relaxed mb-2">Jaringan komputer adalah sekumpulan perangkat komputer yang saling terhubung untuk berbagi data dan sumber daya (seperti printer dan akses internet).</p>
<h3 class="font-bold text-sm text-slate-800 mt-2">2. Jenis Jaringan Berdasarkan Jangkauan Geografis</h3>
<ul class="list-disc pl-5 text-xs text-slate-700 space-y-1 mb-2">
  <li><b>LAN (Local Area Network):</b> Jaringan lokal dalam satu ruangan/laboratorium sekolah.</li>
  <li><b>MAN (Metropolitan Area Network):</b> Jaringan antar gedung dalam satu kota.</li>
  <li><b>WAN (Wide Area Network):</b> Jaringan berskala luas antar negara dan benua.</li>
  <li><b>Internet:</b> Jaringan komputer global terbesar di seluruh dunia.</li>
</ul>
<h3 class="font-bold text-sm text-slate-800 mt-2">3. Etika & Keamanan Berinternet</h3>
<p class="text-xs text-slate-700 leading-relaxed">Selalu gunakan kata sandi yang kuat, jangan membagikan informasi pribadi kepada orang asing di media sosial, dan pastikan menyaring informasi sebelum membagikannya.</p>`
    }
  ];

  let storageState = {
    version: '1.0',
    files: [],
    trash: [],
    activeDocs: {
      word: 'f_word_1',
      excel: 'f_excel_1',
      powerpoint: 'f_ppt_1'
    },
    lastSaved: null
  };

  // Helper estimasi ukuran berkas
  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function calculateSize(content) {
    const str = typeof content === 'string' ? content : JSON.stringify(content);
    const bytes = new Blob([str]).size;
    return formatBytes(bytes);
  }

  function formatDate(isoDate) {
    const d = new Date(isoDate);
    const now = new Date();
    const diffHours = (now - d) / (1000 * 60 * 60);
    if (diffHours < 1) return 'Baru saja';
    if (diffHours < 24) return `Hari ini, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (diffHours < 48) return `Kemarin, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }

  // Inisialisasi Storage dari localStorage
  function init() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.files) && parsed.files.length > 0) {
          storageState = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Gagal membaca localStorage EduOS. Memulihkan setelan bawaan.', e);
    }
    // Jika belum ada atau rusak, gunakan default starter files
    resetToFactory(false);
  }

  function persist() {
    try {
      storageState.lastSaved = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storageState));
      return true;
    } catch (e) {
      console.error('Penyimpanan lokal EduOS penuh atau dibatasi:', e);
      if (typeof showToast === 'function') {
        showToast('⚠️ Penyimpanan browser penuh! Sebagian data tidak tersimpan.');
      }
      return false;
    }
  }

  // API Manajemen Berkas
  function getFiles(filterType = null) {
    if (!filterType) return storageState.files;
    return storageState.files.filter(f => f.type === filterType || f.app === filterType);
  }

  function getTrash() {
    return storageState.trash;
  }

  function getFileById(id) {
    return storageState.files.find(f => f.id === id) || null;
  }

  function saveFile(fileData) {
    if (!fileData.id) {
      fileData.id = 'doc_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    }
    fileData.updatedAt = new Date().toISOString();
    fileData.date = formatDate(fileData.updatedAt);
    fileData.size = calculateSize(fileData.content);

    const existingIndex = storageState.files.findIndex(f => f.id === fileData.id);
    if (existingIndex !== -1) {
      storageState.files[existingIndex] = { ...storageState.files[existingIndex], ...fileData };
    } else {
      storageState.files.unshift(fileData);
    }

    persist();
    syncUI();
    return fileData;
  }

  function deleteFile(id) {
    const idx = storageState.files.findIndex(f => f.id === id);
    if (idx !== -1) {
      const removed = storageState.files.splice(idx, 1)[0];
      storageState.trash.unshift(removed);
      persist();
      syncUI();
      return removed;
    }
    return null;
  }

  function restoreFile(id) {
    const idx = storageState.trash.findIndex(f => f.id === id);
    if (idx !== -1) {
      const restored = storageState.trash.splice(idx, 1)[0];
      storageState.files.unshift(restored);
      persist();
      syncUI();
      return restored;
    }
    return null;
  }

  function restoreAllTrash() {
    if (storageState.trash.length === 0) return 0;
    const count = storageState.trash.length;
    storageState.files.unshift(...storageState.trash);
    storageState.trash = [];
    persist();
    syncUI();
    return count;
  }

  function emptyTrash() {
    const count = storageState.trash.length;
    storageState.trash = [];
    persist();
    syncUI();
    return count;
  }

  function renameFile(id, newName) {
    const file = getFileById(id);
    if (!file) return false;
    newName = newName.trim();
    if (!newName) return false;
    
    // Pastikan ekstensi sesuai
    const ext = file.type === 'word' ? '.docx' : (file.type === 'excel' ? '.xlsx' : '.pptx');
    if (!newName.toLowerCase().endsWith(ext)) {
      newName += ext;
    }

    file.name = newName;
    file.updatedAt = new Date().toISOString();
    file.date = formatDate(file.updatedAt);
    persist();
    syncUI();
    return true;
  }

  function resetToFactory(triggerNotification = true) {
    storageState = {
      version: '1.0',
      files: JSON.parse(JSON.stringify(DEFAULT_STARTER_FILES)),
      trash: [],
      activeDocs: {
        word: 'f_word_1',
        excel: 'f_excel_1',
        powerpoint: 'f_ppt_1'
      },
      lastSaved: new Date().toISOString()
    };
    persist();
    syncUI();
    if (triggerNotification && typeof showToast === 'function') {
      showToast('🔄 EduOS berhasil di-reset ke setelan pabrik!');
    }
  }

  function syncUI() {
    if (typeof renderExplorerFiles === 'function') renderExplorerFiles();
    if (typeof renderTrashFiles === 'function') renderTrashFiles();
  }

  // Fitur Ekspor & Impor Nyata (Unduh ke Komputer Pengguna)
  function downloadBlob(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportBackup() {
    const dataStr = JSON.stringify(storageState, null, 2);
    const nowStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    (EduStorage && EduStorage.downloadBlob ? EduStorage.downloadBlob : downloadBlob)(dataStr, `EduOS_Backup_${nowStr}.json`, 'application/json;charset=utf-8');
    if (typeof showToast === 'function') {
      showToast('📤 Berkas cadangan EduOS berhasil diunduh ke komputer Anda.');
    }
  }

  function importBackup(jsonText) {
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed && Array.isArray(parsed.files)) {
        storageState = parsed;
        persist();
        syncUI();
        if (typeof showToast === 'function') {
          showToast(`📥 Berhasil memulihkan ${parsed.files.length} berkas dari file cadangan.`);
        }
        return true;
      }
    } catch (e) {
      console.error('Format cadangan JSON tidak valid:', e);
      if (typeof showToast === 'function') {
        showToast('❌ Gagal memulihkan berkas: Format file tidak sesuai.');
      }
    }
    return false;
  }

  function importLocalFile(fileObj, contentText) {
    const name = fileObj.name || 'Dokumen_Baru';
    const lowerName = name.toLowerCase();
    let type = 'word';
    let app = 'word';
    let content = contentText;

    if (lowerName.endsWith('.csv') || lowerName.endsWith('.xlsx')) {
      type = 'excel';
      app = 'excel';
      // Parse CSV sederhana menjadi struktur sheet
      const lines = contentText.split(/\\r?\\n/).filter(l => l.trim() !== '');
      const sheetData = {};
      lines.forEach((line, rowIdx) => {
        const cols = line.split(',');
        cols.forEach((val, colIdx) => {
          const colLetter = String.fromCharCode(65 + colIdx);
          sheetData[`${colLetter}${rowIdx + 1}`] = val.trim();
        });
      });
      content = {
        currentSheetName: 'Sheet1',
        sheets: { 'Sheet1': sheetData }
      };
    } else if (lowerName.endsWith('.pptx') || lowerName.endsWith('.ppt')) {
      type = 'powerpoint';
      app = 'powerpoint';
      content = {
        theme: 'edu-blue',
        currentSlideIndex: 0,
        slides: [
          {
            id: 's1',
            layout: 'title',
            title: name.replace(/\\.[^/.]+$/, ''),
            subtitle: 'Slide Presentasi Impor Siswa',
            body: [],
            notes: 'Berkas diimpor dari perangkat lokal.'
          }
        ]
      };
    } else {
      // Default Word / Plain Text / HTML
      type = 'word';
      app = 'word';
      content = `<h1 class="text-xl font-bold mb-3">${name}</h1><div class="leading-relaxed whitespace-pre-wrap">${contentText}</div>`;
    }

    const saved = saveFile({
      name: name,
      type: type,
      app: app,
      content: content
    });

    if (typeof showToast === 'function') {
      showToast(`📥 Berkas "${name}" berhasil diimpor ke File Explorer!`);
    }
    return saved;
  }

  return {
    init,
    getFiles,
    getTrash,
    getFileById,
    saveFile,
    deleteFile,
    restoreFile,
    restoreAllTrash,
    emptyTrash,
    renameFile,
    resetToFactory,
    syncUI,
    downloadBlob,
    exportBackup,
    importBackup,
    importLocalFile,
    get activeDocs() { return storageState.activeDocs; },
    set activeDocs(val) { storageState.activeDocs = val; persist(); }
  };
})();

// ==============================================
// SISTEM MODAL KONFIRMASI & PROMPT EDUOS UNIVERSAL
// ==============================================
let eduModalCallback = null;

function showEduConfirmModal({ title, message, icon = 'alert-triangle', confirmText = 'Lanjutkan', confirmClass = 'bg-blue-600 hover:bg-blue-700 text-white', onConfirm }) {
  if (typeof playSound === 'function') playSound('click');
  const container = document.getElementById('edu-modal-container');
  if (!container) return;

  eduModalCallback = onConfirm;

  container.innerHTML = `
    <div class="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in select-none">
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden animate-window">
        <div class="p-4 sm:p-5 text-center flex flex-col items-center">
          <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3 shadow-xs">
            <i data-lucide="${icon}" class="w-6 h-6"></i>
          </div>
          <h3 class="text-sm sm:text-base font-bold text-slate-800 mb-1.5">${title}</h3>
          <p class="text-xs text-slate-500 leading-relaxed mb-4">${message}</p>
          <div class="flex gap-2 w-full">
            <button onclick="closeEduModal()" class="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer">
              Batal
            </button>
            <button onclick="executeEduModalConfirm()" class="flex-1 py-2 px-3 font-semibold text-xs rounded-xl transition-all shadow-sm cursor-pointer ${confirmClass}">
              ${confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  container.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function showEduPromptModal({ title, message, defaultValue = '', placeholder = '', confirmText = 'Simpan', onConfirm }) {
  if (typeof playSound === 'function') playSound('click');
  const container = document.getElementById('edu-modal-container');
  if (!container) return;

  eduModalCallback = onConfirm;

  container.innerHTML = `
    <div class="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in select-none">
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden animate-window">
        <div class="p-4 sm:p-5 flex flex-col">
          <h3 class="text-sm sm:text-base font-bold text-slate-800 mb-1">${title}</h3>
          <p class="text-xs text-slate-500 mb-3">${message}</p>
          <input type="text" id="edu-modal-input" value="${defaultValue}" placeholder="${placeholder}" 
            class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 mb-4" />
          <div class="flex gap-2 w-full">
            <button onclick="closeEduModal()" class="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer">
              Batal
            </button>
            <button onclick="executeEduModalPrompt()" class="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all shadow-sm cursor-pointer">
              ${confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  container.classList.remove('hidden');
  const inputEl = document.getElementById('edu-modal-input');
  if (inputEl) {
    inputEl.focus();
    inputEl.select();
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') executeEduModalPrompt();
      if (e.key === 'Escape') closeEduModal();
    });
  }
}

function closeEduModal() {
  if (typeof playSound === 'function') playSound('click');
  const container = document.getElementById('edu-modal-container');
  if (container) {
    container.classList.add('hidden');
    container.innerHTML = '';
  }
  eduModalCallback = null;
}

function executeEduModalConfirm() {
  if (typeof eduModalCallback === 'function') {
    eduModalCallback();
  }
  closeEduModal();
}

function executeEduModalPrompt() {
  const inputEl = document.getElementById('edu-modal-input');
  const val = inputEl ? inputEl.value : '';
  if (typeof eduModalCallback === 'function') {
    eduModalCallback(val);
  }
  closeEduModal();
}

function exportBackup() {
  if (typeof EduStorage !== 'undefined' && EduStorage.exportBackup) {
    EduStorage.exportBackup();
  }
}

function importBackup(e) {
  if (typeof EduStorage !== 'undefined' && EduStorage.importBackup) {
    EduStorage.importBackup(e);
  }
}

// Inisialisasi awal storage saat modul dieksekusi
EduStorage.init();


// Global Bridge Export
if (typeof window !== 'undefined') {
  window.EduStorage = EduStorage;
  window.showEduConfirmModal = showEduConfirmModal;
  window.showEduPromptModal = showEduPromptModal;
  window.closeEduModal = closeEduModal;
  window.executeEduModalConfirm = executeEduModalConfirm;
  window.executeEduModalPrompt = executeEduModalPrompt;
  window.exportBackup = exportBackup;
  window.importBackup = importBackup;
}
if (typeof globalThis !== 'undefined') {
  globalThis.EduStorage = EduStorage;
  globalThis.showEduConfirmModal = showEduConfirmModal;
  globalThis.showEduPromptModal = showEduPromptModal;
  globalThis.closeEduModal = closeEduModal;
  globalThis.executeEduModalConfirm = executeEduModalConfirm;
  globalThis.executeEduModalPrompt = executeEduModalPrompt;
  globalThis.exportBackup = exportBackup;
  globalThis.importBackup = importBackup;
}
