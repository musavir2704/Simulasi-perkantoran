/**
 * EduOS - PowerPoint Edu Module (16:9 Presentation Canvas & Full Slide Show Engine)
 * Tahap 7: Aplikasi pembuatan presentasi interaktif dengan panel thumbnail, tema desain, layout, dan mode layar penuh
 */

// Presentation State
let currentPptFileId = 'f_ppt_1';
let pptSlides = [
  {
    title: 'Pengenalan Perangkat Keras Komputer',
    subtitle: 'Media Pembelajaran Informatika Kelas 7 SMP',
    content: '• Komputer adalah sistem elektronik untuk memanipulasi data yang cepat dan tepat.\n• Terdiri dari 3 pilar: Hardware (Perangkat Keras), Software (Perangkat Lunak), dan Brainware (Pengguna).\n• Pada bab ini kita akan mempelajari komponen fisik penyusun komputer.',
    layout: 'title-slide',
    notes: 'Apersepsi: Tunjukkan PC desktop atau laptop nyata di depan kelas untuk menarik minat siswa.'
  },
  {
    title: '1. Perangkat Masukan (Input Device)',
    subtitle: 'Mengirimkan data dan instruksi ke komputer',
    content: '• Keyboard: Memasukkan karakter huruf, angka, dan perintah simbol.\n• Mouse: Mengarahkan kursor dan memilih objek visual pada layar antarmuka grafis (GUI).\n• Mikrofon: Menginput gelombang suara ke format audio digital.\n• Scanner & Kamera: Memindai dokumen fisik dan mengambil gambar visual.',
    layout: 'title-content',
    notes: 'Jelaskan bagaimana papan ketik mengirimkan kode biner ke sistem komputer saat tombol ditekan.'
  },
  {
    title: '2. Pemrosesan & Penyimpanan Data',
    subtitle: 'Otak komputer yang mengolah seluruh instruksi',
    content: '• CPU (Central Processing Unit): Unit pemroses sentral pengendali seluruh instruksi komputasi.\n• RAM (Random Access Memory): Memori kerja sementara berkecepatan tinggi yang hilang saat PC dimatikan.\n• Storage (SSD / Hard Disk): Media penyimpanan data permanen untuk OS, aplikasi, dan berkas siswa.',
    layout: 'title-content',
    notes: 'Bandingkan kapasitas RAM (contoh 8 GB) dengan kapasitas penyimpanan SSD (contoh 512 GB).'
  },
  {
    title: '3. Perangkat Keluaran (Output Device)',
    subtitle: 'Menampilkan hasil pengolahan data ke pengguna',
    content: '• Monitor: Menampilkan visual grafis desktop dan jendela aplikasi.\n• Speaker / Headphone: Menghasilkan output suara audio.\n• Printer: Mencetak dokumen teks atau gambar digital ke media kertas fisik.',
    layout: 'title-content',
    notes: 'Ajak siswa menyebutkan contoh perangkat keluaran lain yang mereka temui di kehidupan sehari-hari.'
  },
  {
    title: 'Kesimpulan & Refleksi Pembelajaran',
    subtitle: 'Rangkuman Materi Hardware Komputer',
    content: '1. Hardware komputer bekerja dalam satu siklus: Masukan (Input) ➔ Pemrosesan (Process) ➔ Keluaran (Output) ➔ Penyimpanan (Storage).\n2. Semua komponen saling melengkapi agar sistem komputer dapat berjalan stabil.\n3. Rawatlah perangkat keras komputer dengan menjaganya tetap bersih dari debu dan cairan.',
    layout: 'title-content',
    notes: 'Tutup dengan sesi tanya jawab berhadiah stiker EduOS untuk 3 siswa yang aktif bertanya.'
  }
];

let pptCurrentSlide = 0;
let pptCurrentTheme = 'blue'; // 'blue' | 'emerald' | 'sunset' | 'slate'
let pptCurrentTransition = 'fade'; // 'fade' | 'slide' | 'zoom' | 'none'
let pptAutoSave = true;
let pptSlideShowActive = false;
let pptSlideShowIndex = 0;
let pptAutoSaveTimer = null;

// Tab Switcher
function switchPptTab(tabName) {
  playSound('click');
  const tabs = ['home', 'insert', 'design', 'transitions', 'slideshow', 'view'];
  tabs.forEach(t => {
    const btn = document.getElementById(`ppt-tab-${t}`);
    const ribbon = document.getElementById(`ppt-ribbon-${t}`);
    if (t === tabName) {
      if (btn) btn.className = 'px-3 py-1 text-rose-700 font-bold border-b-2 border-rose-600 hover:bg-gray-200 cursor-pointer transition-colors';
      if (ribbon) {
        ribbon.classList.remove('hidden');
        ribbon.classList.add('flex');
      }
    } else {
      if (btn) btn.className = 'px-3 py-1 text-gray-700 hover:text-rose-700 hover:bg-gray-200 cursor-pointer transition-colors';
      if (ribbon) {
        ribbon.classList.remove('flex');
        ribbon.classList.add('hidden');
      }
    }
  });
  if (window.lucide) window.lucide.createIcons();
}

// File Backstage Menu
function togglePptFileMenu(forceState) {
  playSound('click');
  const modal = document.getElementById('ppt-file-modal');
  if (!modal) return;
  const isOpen = !modal.classList.contains('hidden');
  const newState = typeof forceState === 'boolean' ? forceState : !isOpen;

  if (newState) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  } else {
    modal.classList.remove('flex');
    modal.classList.add('hidden');
  }
  if (window.lucide) window.lucide.createIcons();
}

// Render Presentation
function renderPPT() {
  const sidebar = document.getElementById('ppt-sidebar');
  const canvas = document.getElementById('ppt-slide-canvas');
  const statusEl = document.getElementById('ppt-status');
  const notesTextarea = document.getElementById('ppt-notes-textarea');

  if (pptCurrentSlide < 0) pptCurrentSlide = 0;
  if (pptCurrentSlide >= pptSlides.length) pptCurrentSlide = Math.max(0, pptSlides.length - 1);

  const cur = pptSlides[pptCurrentSlide] || { title: '', subtitle: '', content: '', layout: 'title-slide' };

  // 1. Render Left Sidebar Thumbnails
  if (sidebar) {
    sidebar.innerHTML = pptSlides.map((s, idx) => {
      const isAct = idx === pptCurrentSlide;
      return `
        <div onclick="setPptSlide(${idx})" class="p-2 rounded-lg cursor-pointer transition-all flex items-start gap-2.5 ${isAct ? 'bg-rose-50 border border-rose-300 shadow-2xs' : 'hover:bg-slate-100 border border-transparent'}">
          <span class="text-[11px] font-bold w-4 text-right shrink-0 mt-2 ${isAct ? 'text-rose-700 font-extrabold' : 'text-slate-400'}">${idx + 1}</span>
          
          <div class="flex-1 min-w-0">
            <!-- Miniature 16:9 Card -->
            <div class="aspect-video w-full rounded border ${isAct ? 'border-rose-500 shadow-xs ring-1 ring-rose-400' : 'border-slate-300 bg-white'} p-1.5 flex flex-col justify-between overflow-hidden bg-white select-none">
              <div class="text-[8px] font-bold truncate text-slate-800">${s.title || '(Tanpa Judul)'}</div>
              <div class="text-[6px] text-slate-500 line-clamp-2 leading-tight">${s.content || s.subtitle || ''}</div>
              <div class="h-0.5 w-1/3 rounded bg-rose-500"></div>
            </div>

            <!-- Slide Quick Action Controls -->
            ${isAct ? `
              <div class="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-500">
                <button onclick="event.stopPropagation(); movePptSlide(-1);" class="p-0.5 hover:bg-slate-200 rounded" title="Pindah Naik"><i data-lucide="chevron-up" class="w-3 h-3"></i></button>
                <button onclick="event.stopPropagation(); movePptSlide(1);" class="p-0.5 hover:bg-slate-200 rounded" title="Pindah Turun"><i data-lucide="chevron-down" class="w-3 h-3"></i></button>
                <button onclick="event.stopPropagation(); duplicatePptSlide();" class="p-0.5 hover:bg-slate-200 rounded" title="Duplikasi Slide"><i data-lucide="copy" class="w-3 h-3"></i></button>
                <button onclick="event.stopPropagation(); deletePptSlide();" class="p-0.5 hover:bg-rose-100 text-rose-600 rounded" title="Hapus Slide"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // 2. Render Main 16:9 Canvas
  if (canvas) {
    // Reset theme classes
    canvas.className = `ppt-slide-canvas w-full max-w-[880px] bg-white rounded-xl shadow-2xl p-6 sm:p-10 md:p-12 relative flex flex-col justify-between select-text border border-slate-200 ppt-theme-${pptCurrentTheme}`;

    const layout = cur.layout || 'title-content';

    if (layout === 'title-slide') {
      canvas.innerHTML = `
        <div class="my-auto text-center flex flex-col items-center justify-center space-y-4">
          <div id="ppt-title-field" contenteditable="true" spellcheck="false" oninput="onPptTitleInput(this.innerText)" class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 outline-none hover:bg-slate-100/50 p-2 rounded-lg transition-colors border border-dashed border-transparent hover:border-slate-300 w-full cursor-text" placeholder="Klik untuk menambahkan judul presentasi">
            ${cur.title || ''}
          </div>
          <div class="w-20 h-1 bg-rose-500 rounded-full mx-auto"></div>
          <div id="ppt-subtitle-field" contenteditable="true" spellcheck="false" oninput="onPptSubtitleInput(this.innerText)" class="text-sm sm:text-base md:text-lg text-slate-600 outline-none hover:bg-slate-100/50 p-2 rounded-lg transition-colors border border-dashed border-transparent hover:border-slate-300 w-full max-w-xl cursor-text" placeholder="Klik untuk menambahkan subjudul atau nama presenter">
            ${cur.subtitle || ''}
          </div>
        </div>
        <div class="flex items-center justify-between text-[10px] text-slate-400 mt-auto pt-4 border-t border-slate-100">
          <span>EduOS PowerPoint • Informatika SMP</span>
          <span>Slide ${pptCurrentSlide + 1} dari ${pptSlides.length}</span>
        </div>
      `;
    } else if (layout === 'two-content') {
      const parts = (cur.content || '').split('\n• ');
      const half = Math.ceil(parts.length / 2);
      const leftCol = parts.slice(0, half).join('\n• ');
      const rightCol = parts.slice(half).join('\n• ');

      canvas.innerHTML = `
        <div class="flex flex-col h-full">
          <div id="ppt-title-field" contenteditable="true" spellcheck="false" oninput="onPptTitleInput(this.innerText)" class="text-xl sm:text-2xl font-bold text-slate-800 pb-2 border-b-2 border-rose-500 outline-none hover:bg-slate-100/50 p-1.5 rounded transition-colors border border-dashed border-transparent hover:border-slate-300 cursor-text">
            ${cur.title || ''}
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 flex-1">
            <div id="ppt-content-left" contenteditable="true" spellcheck="false" oninput="onPptContentInput(this.innerText)" class="text-xs sm:text-sm text-slate-700 leading-relaxed outline-none p-3 bg-white/70 rounded-lg border border-slate-200 hover:border-rose-400 transition-colors whitespace-pre-wrap cursor-text">
              ${leftCol || '• Poin Kolom Kiri 1\n• Poin Kolom Kiri 2'}
            </div>
            <div id="ppt-content-right" contenteditable="true" spellcheck="false" class="text-xs sm:text-sm text-slate-700 leading-relaxed outline-none p-3 bg-white/70 rounded-lg border border-slate-200 hover:border-rose-400 transition-colors whitespace-pre-wrap cursor-text">
              ${rightCol || '• Poin Kolom Kanan 1\n• Poin Kolom Kanan 2'}
            </div>
          </div>

          <div class="flex items-center justify-between text-[10px] text-slate-400 mt-auto pt-3 border-t border-slate-100">
            <span>EduOS PowerPoint • Dua Kolom Perbandingan</span>
            <span>Slide ${pptCurrentSlide + 1} dari ${pptSlides.length}</span>
          </div>
        </div>
      `;
    } else if (layout === 'blank') {
      canvas.innerHTML = `
        <div class="flex flex-col h-full justify-center items-center">
          <div id="ppt-content-field" contenteditable="true" spellcheck="false" oninput="onPptContentInput(this.innerText)" class="text-base text-slate-700 outline-none hover:bg-slate-100/50 p-6 rounded-xl border border-dashed border-slate-300 w-full h-full flex items-center justify-center text-center cursor-text">
            ${cur.content || 'Klik di sini untuk menyisipkan teks atau materi bebas.'}
          </div>
        </div>
      `;
    } else {
      // Default: title-content
      canvas.innerHTML = `
        <div class="flex flex-col h-full">
          <div id="ppt-title-field" contenteditable="true" spellcheck="false" oninput="onPptTitleInput(this.innerText)" class="text-xl sm:text-2xl font-bold text-slate-800 pb-2 border-b-2 border-rose-500 outline-none hover:bg-slate-100/50 p-1.5 rounded transition-colors border border-dashed border-transparent hover:border-slate-300 cursor-text">
            ${cur.title || ''}
          </div>
          
          <div id="ppt-content-field" contenteditable="true" spellcheck="false" oninput="onPptContentInput(this.innerText)" class="text-xs sm:text-sm md:text-base text-slate-700 leading-relaxed outline-none hover:bg-slate-100/50 p-3 sm:p-4 rounded-xl transition-colors border border-dashed border-transparent hover:border-slate-300 flex-1 mt-3 whitespace-pre-wrap cursor-text">
            ${cur.content || ''}
          </div>

          <div class="flex items-center justify-between text-[10px] text-slate-400 mt-auto pt-3 border-t border-slate-100">
            <span>EduOS PowerPoint • Bahan Presentasi Siswa</span>
            <span>Slide ${pptCurrentSlide + 1} dari ${pptSlides.length}</span>
          </div>
        </div>
      `;
    }
  }

  // 3. Status Bar
  if (statusEl) {
    statusEl.innerText = `Slide ${pptCurrentSlide + 1} dari ${pptSlides.length}`;
  }

  // 4. Speaker Notes
  if (notesTextarea) {
    notesTextarea.value = cur.notes || '';
  }

  if (window.lucide) window.lucide.createIcons();
}

// Input Handlers
function onPptTitleInput(val) {
  if (pptSlides[pptCurrentSlide]) {
    pptSlides[pptCurrentSlide].title = val.trim();
    // Update thumbnail without full re-render
    const sidebar = document.getElementById('ppt-sidebar');
    if (sidebar) {
      const activeCard = sidebar.children[pptCurrentSlide];
      if (activeCard) {
        const titleThumb = activeCard.querySelector('.text-\\[8px\\]');
        if (titleThumb) titleThumb.innerText = val.trim() || '(Tanpa Judul)';
      }
    }
    triggerPptAutoSave();
  }
}

function onPptSubtitleInput(val) {
  if (pptSlides[pptCurrentSlide]) {
    pptSlides[pptCurrentSlide].subtitle = val.trim();
    triggerPptAutoSave();
  }
}

function onPptContentInput(val) {
  if (pptSlides[pptCurrentSlide]) {
    pptSlides[pptCurrentSlide].content = val;
    // Update thumbnail miniature
    const sidebar = document.getElementById('ppt-sidebar');
    if (sidebar) {
      const activeCard = sidebar.children[pptCurrentSlide];
      if (activeCard) {
        const contentThumb = activeCard.querySelector('.text-\\[6px\\]');
        if (contentThumb) contentThumb.innerText = val.slice(0, 40);
      }
    }
    triggerPptAutoSave();
  }
}

function onPptNotesInput(val) {
  if (pptSlides[pptCurrentSlide]) {
    pptSlides[pptCurrentSlide].notes = val;
    triggerPptAutoSave();
  }
}

// Slide Operations
function setPptSlide(index) {
  playSound('click');
  pptCurrentSlide = index;
  renderPPT();
}

function addPptSlide(layout = 'title-content') {
  playSound('click');
  const newNum = pptSlides.length + 1;
  pptSlides.push({
    title: `Slide Materi ${newNum}`,
    subtitle: 'Ketik subjudul materi di sini',
    content: '• Poin pembahasan materi ke-1\n• Poin pembahasan materi ke-2\n• Poin pembahasan materi ke-3',
    layout: layout,
    notes: ''
  });
  pptCurrentSlide = pptSlides.length - 1;
  renderPPT();
  showToast(`Slide baru (${layout}) berhasil ditambahkan.`);
}

function duplicatePptSlide() {
  playSound('click');
  const cur = pptSlides[pptCurrentSlide];
  if (!cur) return;
  const clone = JSON.parse(JSON.stringify(cur));
  clone.title += ' (Salinan)';
  pptSlides.splice(pptCurrentSlide + 1, 0, clone);
  pptCurrentSlide++;
  renderPPT();
  showToast('Slide berhasil diduplikasi.');
}

function deletePptSlide() {
  playSound('click');
  if (pptSlides.length <= 1) {
    showToast('Presentasi minimal harus memiliki 1 slide.');
    return;
  }
  pptSlides.splice(pptCurrentSlide, 1);
  if (pptCurrentSlide >= pptSlides.length) {
    pptCurrentSlide = pptSlides.length - 1;
  }
  renderPPT();
  showToast('Slide berhasil dihapus.');
}

function movePptSlide(dir) {
  playSound('click');
  const target = pptCurrentSlide + dir;
  if (target < 0 || target >= pptSlides.length) return;
  const temp = pptSlides[pptCurrentSlide];
  pptSlides[pptCurrentSlide] = pptSlides[target];
  pptSlides[target] = temp;
  pptCurrentSlide = target;
  renderPPT();
  showToast(`Slide dipindahkan ke posisi ${target + 1}.`);
}

function setPptLayout(layout) {
  playSound('click');
  if (pptSlides[pptCurrentSlide]) {
    pptSlides[pptCurrentSlide].layout = layout;
    renderPPT();
    showToast(`Tata letak slide diubah ke ${layout}.`);
  }
}

function setPptTheme(themeName) {
  playSound('click');
  pptCurrentTheme = themeName;
  const canvas = document.getElementById('ppt-slide-canvas');
  if (canvas) {
    canvas.className = `ppt-slide-canvas w-full max-w-[880px] bg-white rounded-xl shadow-2xl p-6 sm:p-10 md:p-12 relative flex flex-col justify-between select-text border border-slate-200 ppt-theme-${themeName}`;
  }
  const themeLabel = document.getElementById('ppt-current-theme-label');
  if (themeLabel) {
    themeLabel.innerText = `Tema: ${themeName.toUpperCase()}`;
  }
  showToast(`Tema visual presentasi: ${themeName.toUpperCase()}.`);
}

function setPptTransition(transName) {
  playSound('click');
  pptCurrentTransition = transName;
  showToast(`Efek transisi slide: ${transName.toUpperCase()}.`);
}

// Formatting
function executePptFormat(cmd, val = null) {
  playSound('click');
  document.execCommand(cmd, false, val);
}

function togglePptColorPalette(type) {
  playSound('click');
  const palette = document.getElementById(`ppt-palette-${type}`);
  if (!palette) return;
  const isHidden = palette.classList.contains('hidden');
  closeAllPptPalettes();
  if (isHidden) palette.classList.remove('hidden');
}

function closeAllPptPalettes() {
  const p1 = document.getElementById('ppt-palette-font');
  const p2 = document.getElementById('ppt-palette-fill');
  if (p1) p1.classList.add('hidden');
  if (p2) p2.classList.add('hidden');
}

function setPptColor(type, color) {
  playSound('click');
  if (type === 'font') {
    document.execCommand('foreColor', false, color);
    const bar = document.getElementById('ppt-font-color-bar');
    if (bar) bar.style.backgroundColor = color;
  } else if (type === 'fill') {
    document.execCommand('hiliteColor', false, color);
    const bar = document.getElementById('ppt-fill-color-bar');
    if (bar) bar.style.backgroundColor = color;
  }
  closeAllPptPalettes();
}

// Insert Elements into Active Slide
function insertPptIllustration(type) {
  playSound('click');
  let snippet = '';
  if (type === 'hardware') {
    snippet = `\n[DIAGRAM SISTEM KOMPUTER]\n[Input: Keyboard/Mouse] ➔ [Proses: CPU & RAM] ➔ [Output: Monitor/Printer]\n`;
  } else if (type === 'binary') {
    snippet = `\n[KODE BINER EDUKASI: 01001001 01001110 01000110]\n`;
  }
  if (pptSlides[pptCurrentSlide]) {
    pptSlides[pptCurrentSlide].content = (pptSlides[pptCurrentSlide].content || '') + snippet;
    renderPPT();
    showToast('Ilustrasi edukasi berhasil disisipkan ke slide.');
  }
}

function insertPptTable() {
  playSound('click');
  const tableSnippet = `\n[TABEL PERBANDINGAN PERANGKAT]\n| Perangkat | Fungsi Utama | Kategori |\n| Keyboard  | Input Teks   | Input    |\n| Monitor   | Tampilan GUI | Output   |\n`;
  if (pptSlides[pptCurrentSlide]) {
    pptSlides[pptCurrentSlide].content = (pptSlides[pptCurrentSlide].content || '') + tableSnippet;
    renderPPT();
    showToast('Tabel materi berhasil disisipkan ke slide.');
  }
}

function insertPptCallout() {
  playSound('click');
  const callout = `\n📌 CATATAN PENTING SISWA:\nSimpanlah data presentasi secara berkala dengan menekan Ctrl+S atau memanfaatkan fitur AutoSave EduOS.\n`;
  if (pptSlides[pptCurrentSlide]) {
    pptSlides[pptCurrentSlide].content = (pptSlides[pptCurrentSlide].content || '') + callout;
    renderPPT();
    showToast('Kotak catatan disisipkan.');
  }
}

// Fullscreen Slide Show Mode
function startPptSlideShow(fromStart = false) {
  playSound('chime');
  pptSlideShowIndex = fromStart ? 0 : pptCurrentSlide;
  pptSlideShowActive = true;

  const overlay = document.getElementById('ppt-slideshow-overlay');
  if (overlay) {
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    renderSlideShowCurrentSlide();
  }

  // Request fullscreen if supported
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {});
  }

  showToast('Memulai Slide Show. Gunakan Panah Kanan/Spasi untuk maju, Esc untuk keluar.');
}

function closePptSlideShow() {
  playSound('click');
  pptSlideShowActive = false;
  const overlay = document.getElementById('ppt-slideshow-overlay');
  if (overlay) {
    overlay.classList.remove('flex');
    overlay.classList.add('hidden');
  }

  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }

  renderPPT();
}

function nextPptSlideShowSlide() {
  if (pptSlideShowIndex < pptSlides.length - 1) {
    playSound('type');
    pptSlideShowIndex++;
    renderSlideShowCurrentSlide();
  } else {
    showToast('Ini adalah slide terakhir. Tekan Esc untuk keluar.');
  }
}

function prevPptSlideShowSlide() {
  if (pptSlideShowIndex > 0) {
    playSound('type');
    pptSlideShowIndex--;
    renderSlideShowCurrentSlide();
  }
}

function renderSlideShowCurrentSlide() {
  const container = document.getElementById('ppt-slideshow-slide-content');
  const counter = document.getElementById('ppt-slideshow-counter');
  if (!container) return;

  const cur = pptSlides[pptSlideShowIndex];
  if (!cur) return;

  if (counter) {
    counter.innerText = `Slide ${pptSlideShowIndex + 1} dari ${pptSlides.length}`;
  }

  container.className = `w-full max-w-5xl aspect-video bg-white rounded-2xl shadow-2xl p-8 sm:p-14 md:p-16 flex flex-col justify-between ppt-theme-${pptCurrentTheme} animate-slideshow select-none`;

  if (cur.layout === 'title-slide') {
    container.innerHTML = `
      <div class="my-auto text-center space-y-4">
        <h1 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-800 leading-tight">${cur.title || ''}</h1>
        <div class="w-24 h-1.5 bg-rose-500 rounded-full mx-auto"></div>
        <p class="text-lg sm:text-xl md:text-2xl text-slate-600 font-medium">${cur.subtitle || ''}</p>
      </div>
      <div class="flex justify-between items-center text-xs text-slate-400 border-t border-slate-100 pt-3">
        <span>EduOS Presentation Simulator</span>
        <span>Materi Pembelajaran Siswa SMP</span>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="flex flex-col h-full">
        <h2 class="text-2xl sm:text-3xl font-bold text-slate-800 pb-3 border-b-2 border-rose-500 mb-6">${cur.title || ''}</h2>
        <div class="text-base sm:text-lg md:text-xl text-slate-700 leading-relaxed whitespace-pre-wrap flex-1">${cur.content || ''}</div>
        <div class="flex justify-between items-center text-xs text-slate-400 border-t border-slate-100 pt-3 mt-auto">
          <span>Informatika SMP • EduOS v2.5</span>
          <span>Slide ${pptSlideShowIndex + 1} / ${pptSlides.length}</span>
        </div>
      </div>
    `;
  }
}

// Educational Templates
function newPptPresentation() {
  playSound('click');
  pptSlides = [
    {
      title: 'Judul Presentasi Baru',
      subtitle: 'Subjudul atau Nama Kelompok Siswa',
      content: '• Poin materi pembahasan 1\n• Poin materi pembahasan 2',
      layout: 'title-slide',
      notes: ''
    }
  ];
  pptCurrentSlide = 0;
  togglePptFileMenu(false);
  renderPPT();
  showToast('Presentasi baru siap digunakan.');
}

function openPptTemplate(num) {
  playSound('click');
  const titleDoc = document.getElementById('ppt-doc-title');

  if (num === 1) {
    // Template 1: Hardware
    if (titleDoc) titleDoc.innerText = 'Hardware_Komputer_SMP.pptx - PowerPoint Edu';
    pptCurrentTheme = 'blue';
    pptSlides = [
      {
        title: 'Pengenalan Perangkat Keras Komputer',
        subtitle: 'Media Pembelajaran Informatika Kelas 7 SMP',
        content: '• Komputer adalah sistem elektronik untuk memanipulasi data yang cepat dan tepat.\n• Terdiri dari 3 pilar: Hardware, Software, dan Brainware.\n• Pada bab ini kita akan mempelajari komponen fisik penyusun komputer.',
        layout: 'title-slide',
        notes: 'Apersepsi pembuka pembelajaran'
      },
      {
        title: '1. Perangkat Masukan (Input Device)',
        subtitle: 'Mengirimkan data dan instruksi ke komputer',
        content: '• Keyboard: Memasukkan karakter huruf, angka, dan perintah simbol.\n• Mouse: Mengarahkan kursor dan memilih objek visual pada antarmuka GUI.\n• Mikrofon: Menginput suara ke format audio digital.\n• Scanner & Kamera: Memindai dokumen dan gambar fisik.',
        layout: 'title-content',
        notes: 'Bahas tombol shortcut keyboard penting'
      },
      {
        title: '2. Pemrosesan & Penyimpanan',
        subtitle: 'Otak komputer yang mengolah seluruh instruksi',
        content: '• CPU (Central Processing Unit): Pengendali utama instruksi komputasi.\n• RAM: Memori kerja sementara berkecepatan tinggi.\n• SSD & Hard Disk: Media penyimpanan berkas data permanen.',
        layout: 'title-content',
        notes: 'Jelaskan perbedaan memori RAM vs memori Storage'
      },
      {
        title: '3. Perangkat Keluaran (Output Device)',
        subtitle: 'Menampilkan hasil pemrosesan kepada siswa',
        content: '• Monitor: Menampilkan visual grafis desktop dan jendela aplikasi.\n• Speaker: Mengeluarkan gelombang suara audio digital.\n• Printer: Mencetak naskah digital ke lembaran kertas fisik.',
        layout: 'title-content',
        notes: 'Berikan kuis singkat mengenali monitor dan proyektor'
      },
      {
        title: 'Rangkuman & Kesimpulan',
        subtitle: 'Siklus Pemrosesan Data Komputer',
        content: '1. Hardware bekerja berkesinambungan: Input ➔ Proses ➔ Output ➔ Simpan.\n2. Perangkat keras membutuhkan perangkat lunak (software) agar dapat beroperasi.\n3. Jagalah kebersihan fisik komputer agar terhindar dari overheat.',
        layout: 'title-content',
        notes: 'Tutup dengan sesi tanya jawab berhadiah stiker'
      }
    ];
    showToast('Template Pengenalan Hardware Komputer dimuat.');
  } else if (num === 2) {
    // Template 2: Dampak Teknologi Digital
    if (titleDoc) titleDoc.innerText = 'Dampak_Teknologi_Digital.pptx - PowerPoint Edu';
    pptCurrentTheme = 'emerald';
    pptSlides = [
      {
        title: 'Dampak Positif & Negatif Teknologi',
        subtitle: 'Literasi Digital Siswa Remaja Indonesia',
        content: 'Membahas pemanfaatan internet sehat dan bijak bagi pelajar.',
        layout: 'title-slide',
        notes: ''
      },
      {
        title: 'Dampak Positif Teknologi',
        subtitle: 'Kemudahan akses ilmu dan kolaborasi',
        content: '• Sumber Belajar Luas: Akses ensiklopedia dan buku digital gratis.\n• Komunikasi Cepat: Diskusi kelompok daring kapan saja.\n• Kreativitas Digital: Membuat animasi, desain grafis, dan presentasi interaktif.',
        layout: 'title-content',
        notes: ''
      },
      {
        title: 'Dampak Negatif & Tantangan',
        subtitle: 'Hal yang harus diwaspadai remaja',
        content: '• Kecanduan Gadget: Berkurangnya aktivitas fisik dan interaksi sosial nyata.\n• Bahaya Hoaks: Penyebaran berita bohong yang memicu kesalahpahaman.\n• Cyberbullying: Perundungan di media sosial yang merusak mental rekan sebaya.',
        layout: 'title-content',
        notes: ''
      },
      {
        title: 'Sikap Bijak Berinternet',
        subtitle: 'Tips Menjadi Warganet Cerdas',
        content: '1. Saring sebelum sharing informasi apa pun.\n2. Batasi screen time maksimal 2 jam di luar jam belajar.\n3. Gunakan internet untuk menghasilkan karya yang bermanfaat bagi masyarakat.',
        layout: 'title-content',
        notes: ''
      }
    ];
    showToast('Template Dampak Teknologi Digital dimuat.');
  } else if (num === 3) {
    // Template 3: Cyber Security Remaja
    if (titleDoc) titleDoc.innerText = 'Cyber_Security_Remaja.pptx - PowerPoint Edu';
    pptCurrentTheme = 'sunset';
    pptSlides = [
      {
        title: 'Tips Aman Berselancar di Internet',
        subtitle: 'Edukasi Keamanan Siber (Cyber Security) Pelajar',
        content: 'Lindungi data pribadimu di era digital!',
        layout: 'title-slide',
        notes: ''
      },
      {
        title: '1. Buat Kata Sandi (Password) Kuat',
        subtitle: 'Kunci keamanan akun digital',
        content: '• Gunakan kombinasi minimal 8 karakter.\n• Campurkan huruf besar, huruf kecil, angka, dan simbol (contoh: P@ssw0rdEdu!).\n• Jangan gunakan tanggal lahir atau nama panggilan yang mudah ditebak.',
        layout: 'title-content',
        notes: ''
      },
      {
        title: '2. Waspadai Tautan Phishing',
        subtitle: 'Jangan sembarang klik tautan mencurigakan',
        content: '• Phishing adalah modus penipuan untuk mencuri akun dan kata sandi.\n• Ciri tautan palsu: Domain aneh, iming-iming hadiah gratis tak masuk akal.\n• Selalu periksa alamat URL resmi sebelum login.',
        layout: 'title-content',
        notes: ''
      },
      {
        title: '3. Jaga Privasi Data Pribadi',
        subtitle: 'Jejak digital bersifat abadi',
        content: '• Jangan bagikan nomor telepon, alamat rumah, atau data keluarga di medsos publik.\n• Matikan fitur lokasi GPS otomatis pada foto publik.\n• Berpikirlah bijak sebelum mengunggah postingan apa pun.',
        layout: 'title-content',
        notes: ''
      }
    ];
    showToast('Template Cyber Security Pelajar dimuat.');
  }

  pptCurrentSlide = 0;
  togglePptFileMenu(false);
  renderPPT();
}

// Persistence & Export
function loadPptPresentation(fileId) {
  if (typeof EduStorage === 'undefined') return;
  const file = EduStorage.getFileById(fileId);
  if (!file || !file.content) return;
  currentPptFileId = fileId;

  if (file.content.slides && Array.isArray(file.content.slides)) {
    pptSlides = file.content.slides.map((s, idx) => ({
      id: s.id || ('slide_' + (idx + 1)),
      title: s.title || '',
      subtitle: s.subtitle || '',
      content: Array.isArray(s.body) ? s.body.join('\n') : (s.content || ''),
      layout: s.layout || 'title-content',
      notes: s.notes || ''
    }));
    pptCurrentSlide = file.content.currentSlideIndex || 0;
    pptCurrentTheme = file.content.theme || 'edu-blue';
  }

  const titleEl = document.getElementById('ppt-doc-title');
  if (titleEl) {
    titleEl.innerText = `${file.name} - PowerPoint Edu`;
  }

  EduStorage.activeDocs.powerpoint = fileId;
  setPptTheme(pptCurrentTheme);
  renderPPT();
}

function savePptPresentation(asNew = false) {
  playSound('click');
  if (asNew || !currentPptFileId) {
    if (typeof showEduPromptModal === 'function') {
      showEduPromptModal({
        title: 'Simpan Presentasi PowerPoint Sebagai',
        message: 'Masukkan nama berkas presentasi baru:',
        defaultValue: 'Presentasi_Tugas_SMP.pptx',
        placeholder: 'contoh: Bahan_Tayang_Hardware.pptx',
        confirmText: 'Simpan',
        onConfirm: (pptName) => {
          if (!pptName || !pptName.trim()) pptName = 'Presentasi_Baru.pptx';
          if (!pptName.toLowerCase().endsWith('.pptx')) pptName += '.pptx';

          const newFile = EduStorage.saveFile({
            name: pptName,
            type: 'powerpoint',
            app: 'powerpoint',
            content: {
              theme: pptCurrentTheme,
              currentSlideIndex: pptCurrentSlide,
              slides: JSON.parse(JSON.stringify(pptSlides))
            }
          });
          currentPptFileId = newFile.id;
          EduStorage.activeDocs.powerpoint = newFile.id;

          const titleEl = document.getElementById('ppt-doc-title');
          if (titleEl) titleEl.innerText = `${newFile.name} - PowerPoint Edu`;

          const badge = document.getElementById('ppt-saved-msg');
          if (badge) {
            badge.classList.remove('hidden');
            setTimeout(() => badge.classList.add('hidden'), 2500);
          }
          showToast(`💾 "${newFile.name}" berhasil disimpan ke EduOS Storage.`);
        }
      });
    }
    return;
  }

  const currentFile = typeof EduStorage !== 'undefined' ? EduStorage.getFileById(currentPptFileId) : null;
  const fileName = currentFile ? currentFile.name : 'Presentasi_PowerPoint.pptx';

  if (typeof EduStorage !== 'undefined') {
    EduStorage.saveFile({
      id: currentPptFileId,
      name: fileName,
      type: 'powerpoint',
      app: 'powerpoint',
      content: {
        theme: pptCurrentTheme,
        currentSlideIndex: pptCurrentSlide,
        slides: JSON.parse(JSON.stringify(pptSlides))
      }
    });
  }

  const badge = document.getElementById('ppt-saved-msg');
  if (badge) {
    badge.classList.remove('hidden');
    setTimeout(() => badge.classList.add('hidden'), 2500);
  }
  showToast(`💾 "${fileName}" berhasil disimpan ke EduOS Storage.`);
}

function togglePptAutoSave() {
  playSound('click');
  pptAutoSave = !pptAutoSave;
  const toggle = document.getElementById('ppt-autosave-toggle');
  if (toggle) {
    if (pptAutoSave) {
      toggle.className = 'w-6 h-3.5 bg-rose-600 rounded-full relative cursor-pointer';
      toggle.innerHTML = '<div class="w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm transition-all"></div>';
      showToast('AutoSave PowerPoint diaktifkan.');
    } else {
      toggle.className = 'w-6 h-3.5 bg-gray-400 rounded-full relative cursor-pointer';
      toggle.innerHTML = '<div class="w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm transition-all"></div>';
      showToast('AutoSave PowerPoint dinonaktifkan.');
    }
  }
}

function triggerPptAutoSave() {
  if (!pptAutoSave) return;
  clearTimeout(pptAutoSaveTimer);
  pptAutoSaveTimer = setTimeout(() => {
    savePptPresentation();
  }, 1800);
}

function exportPptAsTxt() {
  playSound('click');
  let outline = '=== OUTLINE PRESENTASI EDUOS ===\r\n\r\n';
  pptSlides.forEach((s, idx) => {
    outline += `SLIDE ${idx + 1}: ${s.title || '(Tanpa Judul)'}\r\n`;
    if (s.subtitle) outline += `Subjudul: ${s.subtitle}\r\n`;
    if (s.content) outline += `Konten:\r\n${s.content}\r\n`;
    if (s.notes) outline += `Catatan: ${s.notes}\r\n`;
    outline += '----------------------------------------\r\n\r\n';
  });

  const blob = new Blob([outline], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'Presentasi_Informatika_SMP.txt');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Naskah presentasi berhasil diunduh.');
}

function exportPptAsHtml() {
  playSound('click');
  const currentFile = typeof EduStorage !== 'undefined' && currentPptFileId ? EduStorage.getFileById(currentPptFileId) : null;
  const title = currentFile ? currentFile.name.replace(/\.pptx$/i, '') : 'Presentasi_PowerPoint_Edu';

  let slidesHtml = '';
  pptSlides.forEach((s, idx) => {
    slidesHtml += `
    <div class="slide" id="slide-${idx + 1}">
      <div class="slide-num">Slide ${idx + 1} dari ${pptSlides.length}</div>
      <h2>${s.title || ''}</h2>
      ${s.subtitle ? `<h3>${s.subtitle}</h3>` : ''}
      ${s.content ? `<div class="slide-body">${s.content.replace(/\n/g, '<br>')}</div>` : ''}
      ${s.notes ? `<div class="notes"><strong>Catatan Pembicara:</strong> ${s.notes}</div>` : ''}
    </div>`;
  });

  const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${title} - Slide Presentasi EduOS</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: white; margin: 0; padding: 30px; display: flex; flex-direction: column; align-items: center; gap: 30px; }
    h1 { color: #f43f5e; margin-bottom: 10px; }
    .slide { width: 900px; max-width: 95vw; aspect-ratio: 16/9; background: #1e293b; border-radius: 12px; padding: 40px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; position: relative; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #334155; }
    .slide-num { position: absolute; top: 20px; right: 25px; font-size: 12px; color: #94a3b8; }
    h2 { font-size: 28px; margin: 0 0 15px 0; color: #38bdf8; }
    h3 { font-size: 18px; margin: 0 0 20px 0; color: #94a3b8; font-weight: normal; }
    .slide-body { font-size: 16px; line-height: 1.8; color: #e2e8f0; }
    .notes { margin-top: auto; padding-top: 15px; border-top: 1px solid #334155; font-size: 13px; color: #cbd5e1; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${slidesHtml}
</body>
</html>`;

  if (typeof EduStorage !== 'undefined') {
    EduStorage.downloadBlob(fullHtml, `${title}.html`, 'text/html;charset=utf-8');
  }
  showToast(`Presentasi HTML "${title}.html" berhasil diunduh.`);
}

function printPptSlides() {
  playSound('click');
  window.print();
}

function searchInPpt(query) {
  if (!query || !query.trim()) return;
  const q = query.toLowerCase().trim();
  for (let i = 0; i < pptSlides.length; i++) {
    const s = pptSlides[i];
    if ((s.title && s.title.toLowerCase().includes(q)) || (s.content && s.content.toLowerCase().includes(q))) {
      setPptSlide(i);
      showToast(`Ditemukan pada Slide ${i + 1}: ${s.title}`);
      return;
    }
  }
  showToast('Kata kunci tidak ditemukan dalam presentasi.');
}

// Global Slide Show Keyboard Handler
window.addEventListener('keydown', (e) => {
  if (pptSlideShowActive) {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      nextPptSlideShowSlide();
    } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
      e.preventDefault();
      prevPptSlideShowSlide();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closePptSlideShow();
    }
  }
});


// Global Bridge Export for PowerPoint Edu
if (typeof window !== 'undefined') {
  window.loadPptPresentation = loadPptPresentation;
  window.savePptPresentation = savePptPresentation;
  window.newPptPresentation = newPptPresentation;
  window.openPptTemplate = openPptTemplate;
  window.exportPptAsTxt = exportPptAsTxt;
  window.exportPptAsHtml = exportPptAsHtml;
  window.renderPPT = renderPPT;
  window.setPptTheme = setPptTheme;
  window.startPptSlideShow = startPptSlideShow;
  window.closePptSlideShow = closePptSlideShow;
  window.nextPptSlideShowSlide = nextPptSlideShowSlide;
  window.prevPptSlideShowSlide = prevPptSlideShowSlide;
}
if (typeof globalThis !== 'undefined') {
  globalThis.loadPptPresentation = loadPptPresentation;
  globalThis.savePptPresentation = savePptPresentation;
  globalThis.newPptPresentation = newPptPresentation;
  globalThis.openPptTemplate = openPptTemplate;
  globalThis.exportPptAsTxt = exportPptAsTxt;
  globalThis.exportPptAsHtml = exportPptAsHtml;
  globalThis.renderPPT = renderPPT;
  globalThis.setPptTheme = setPptTheme;
  globalThis.startPptSlideShow = startPptSlideShow;
  globalThis.closePptSlideShow = closePptSlideShow;
  globalThis.nextPptSlideShowSlide = nextPptSlideShowSlide;
  globalThis.prevPptSlideShowSlide = prevPptSlideShowSlide;
}
