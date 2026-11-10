let currentWordFileId = 'f_word_1';
/**
 * EduOS - Word Edu Module (A4 Document Engine & Rich Text Ribbon)
 * Aplikasi pengolah kata realistis dengan format dokumen A4, ribbon, styles, dan tabel
 */

// 4. LOGIKA WORD EDU (Rich Text & A4 Document Engine)
    let wordAutoSaveEnabled = true;
    let wordAutoSaveTimer = null;

    function executeWordCmd(cmd, val = null) {
      playSound('click');
      document.execCommand(cmd, false, val);
      updateWordCounts();
      updateWordActiveToolbarState();
      const doc = document.getElementById('word-document');
      if (doc) doc.focus();
    }

    function onWordDocumentInput() {
      updateWordCounts();
      triggerWordAutoSave();
    }

    function updateWordCounts() {
      const doc = document.getElementById('word-document');
      if (!doc) return;
      const text = doc.innerText || doc.textContent || '';
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;

      const wordEl = document.getElementById('word-count-display');
      const charEl = document.getElementById('word-char-display');
      if (wordEl) wordEl.innerText = words + ' kata';
      if (charEl) charEl.innerText = chars + ' karakter';
    }

    function updateWordActiveToolbarState() {
      try {
        const isBold = document.queryCommandState('bold');
        const isItalic = document.queryCommandState('italic');
        const isUnderline = document.queryCommandState('underline');
        const isStrike = document.queryCommandState('strikeThrough');
        const isSub = document.queryCommandState('subscript');
        const isSup = document.queryCommandState('superscript');

        const btnB = document.getElementById('word-btn-bold');
        const btnI = document.getElementById('word-btn-italic');
        const btnU = document.getElementById('word-btn-underline');
        const btnS = document.getElementById('word-btn-strike');
        const btnSub = document.getElementById('word-btn-sub');
        const btnSup = document.getElementById('word-btn-sup');

        if (btnB) btnB.className = isBold ? 'w-[24px] h-[24px] flex items-center justify-center bg-gray-300 shadow-inner rounded text-blue-700' : 'w-[24px] h-[24px] flex items-center justify-center hover:bg-gray-200 rounded text-gray-800';
        if (btnI) btnI.className = isItalic ? 'w-[24px] h-[24px] flex items-center justify-center bg-gray-300 shadow-inner rounded text-blue-700' : 'w-[24px] h-[24px] flex items-center justify-center hover:bg-gray-200 rounded text-gray-800';
        if (btnU) btnU.className = isUnderline ? 'w-[24px] h-[24px] flex items-center justify-center bg-gray-300 shadow-inner rounded text-blue-700' : 'w-[24px] h-[24px] flex items-center justify-center hover:bg-gray-200 rounded text-gray-800';
        if (btnS) btnS.className = isStrike ? 'w-[24px] h-[24px] flex items-center justify-center bg-gray-300 shadow-inner rounded text-blue-700' : 'w-[24px] h-[24px] flex items-center justify-center hover:bg-gray-200 rounded text-gray-800';
        if (btnSub) btnSub.className = isSub ? 'w-[24px] h-[24px] flex items-center justify-center bg-gray-300 shadow-inner rounded text-blue-700' : 'w-[24px] h-[24px] flex items-center justify-center hover:bg-gray-200 rounded text-gray-800';
        if (btnSup) btnSup.className = isSup ? 'w-[24px] h-[24px] flex items-center justify-center bg-gray-300 shadow-inner rounded text-blue-700' : 'w-[24px] h-[24px] flex items-center justify-center hover:bg-gray-200 rounded text-gray-800';
      } catch (e) {
        // Query command state fallback
      }
    }

    // Ribbon Tabs Switcher
    function switchWordTab(tabName) {
      playSound('click');
      closeAllWordColorPalettes();

      ['home', 'insert', 'layout', 'view'].forEach(t => {
        const ribbon = document.getElementById(`word-ribbon-${t}`);
        const tabBtn = document.getElementById(`word-tab-${t}`);
        if (ribbon && tabBtn) {
          if (t === tabName) {
            ribbon.classList.remove('hidden');
            ribbon.classList.add('flex');
            tabBtn.className = 'px-2.5 sm:px-3 py-1 text-blue-700 font-semibold border-b-2 border-blue-700 bg-white cursor-pointer rounded-t-sm';
          } else {
            ribbon.classList.add('hidden');
            ribbon.classList.remove('flex');
            tabBtn.className = 'px-2.5 sm:px-3 py-1 text-gray-700 hover:bg-gray-200 cursor-pointer rounded-t-md';
          }
        }
      });
      if (window.lucide) window.lucide.createIcons();
    }

    // Format Font & Paragraph
    function applyWordFormat(format) {
      executeWordCmd(format);
    }

    function applyWordFont(fontName) {
      executeWordCmd('fontName', fontName);
    }

    function applyWordFontSize(sizeVal) {
      executeWordCmd('fontSize', sizeVal);
    }

    function applyWordFontSizeDelta(delta) {
      const select = document.getElementById('word-size-select');
      if (!select) return;
      let curr = parseInt(select.value) || 3;
      curr += delta;
      if (curr < 1) curr = 1;
      if (curr > 7) curr = 7;
      select.value = curr;
      executeWordCmd('fontSize', curr);
    }

    function applyWordClearFormat() {
      executeWordCmd('removeFormat');
      showToast('Format teks telah dibersihkan.');
    }

    function toggleWordColorPalette(type) {
      playSound('click');
      const palette = document.getElementById(`word-palette-${type}`);
      if (!palette) return;
      const isHidden = palette.classList.contains('hidden');
      closeAllWordColorPalettes();
      if (isHidden) palette.classList.remove('hidden');
    }

    function closeAllWordColorPalettes() {
      ['highlight', 'font'].forEach(p => {
        const el = document.getElementById(`word-palette-${p}`);
        if (el) el.classList.add('hidden');
      });
    }

    function applyWordColor(color) {
      closeAllWordColorPalettes();
      executeWordCmd('foreColor', color);
      const bar = document.getElementById('word-fontcolor-bar');
      if (bar) bar.style.backgroundColor = color;
    }

    function applyWordHighlight(color) {
      closeAllWordColorPalettes();
      executeWordCmd('hiliteColor', color);
      const bar = document.getElementById('word-highlight-bar');
      if (bar) bar.style.backgroundColor = color === 'transparent' ? '#facc15' : color;
    }

    function applyWordAlign(alignCmd) {
      ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'].forEach(cmd => {
        const btn = document.getElementById(`word-btn-align-${cmd.replace('justify', '').toLowerCase()}`);
        if (btn) btn.classList.remove('bg-gray-300', 'shadow-inner');
      });
      const activeBtn = document.getElementById(`word-btn-align-${alignCmd.replace('justify', '').toLowerCase()}`);
      if (activeBtn) activeBtn.classList.add('bg-gray-300', 'shadow-inner');

      executeWordCmd(alignCmd);
    }

    function applyWordList(listCmd) {
      executeWordCmd(listCmd);
    }

    function applyWordLineSpacing(spacingVal) {
      playSound('click');
      const doc = document.getElementById('word-document');
      if (doc) {
        doc.style.lineHeight = spacingVal;
        showToast(`Spasi baris diatur ke ${spacingVal}`);
      }
    }

    function applyWordStyle(styleName) {
      playSound('click');
      if (styleName === 'normal') {
        executeWordCmd('formatBlock', '<p>');
      } else if (styleName === 'heading1') {
        executeWordCmd('formatBlock', '<h1>');
      } else if (styleName === 'heading2') {
        executeWordCmd('formatBlock', '<h2>');
      } else if (styleName === 'title') {
        const titleHtml = `<h1 class="text-3xl font-extrabold text-blue-900 border-b-2 border-blue-600 pb-2 mb-4">Judul Dokumen Siswa</h1>`;
        executeWordCmd('insertHTML', titleHtml);
      }
      updateWordCounts();
    }

    function applyFormatPainter() {
      playSound('click');
      showToast('🖌️ Format Painter: Salin gaya teks terpilih ke teks berikutnya.');
    }

    function wordPaste() {
      const doc = document.getElementById('word-document');
      if (doc) doc.focus();
      try {
        navigator.clipboard.readText().then(text => {
          if (text) executeWordCmd('insertText', text);
          else showToast('Clipboard kosong.');
        }).catch(() => {
          showToast('Tekan tombol Ctrl+V di keyboard untuk menempelkan teks.');
        });
      } catch (err) {
        showToast('Gunakan pintasan Ctrl+V pada keyboard Anda.');
      }
    }

    // Insert Features
    function showWordTableDialog() {
      playSound('click');
      const rows = prompt('Masukkan jumlah baris tabel (contoh: 3):', '3');
      const cols = prompt('Masukkan jumlah kolom tabel (contoh: 3):', '3');
      const r = parseInt(rows) || 3;
      const c = parseInt(cols) || 3;
      insertWordTable(r, c);
    }

    function insertWordTable(rows, cols) {
      let tableHtml = `<table class="w-full my-4 border-collapse border border-slate-400 text-sm"><thead><tr class="bg-blue-100 text-blue-900 font-bold">`;
      for (let j = 0; j < cols; j++) {
        tableHtml += `<th class="border border-slate-400 p-2 text-left">Kolom ${j + 1}</th>`;
      }
      tableHtml += '</tr></thead><tbody>';
      for (let i = 0; i < rows; i++) {
        tableHtml += '<tr class="hover:bg-slate-50">';
        for (let j = 0; j < cols; j++) {
          tableHtml += `<td class="border border-slate-400 p-2 text-slate-700">Data ${i + 1},${j + 1}</td>`;
        }
        tableHtml += '</tr>';
      }
      tableHtml += '</tbody></table><p><br></p>';

      executeWordCmd('insertHTML', tableHtml);
      showToast(`Tabel ${rows}x${cols} berhasil disisipkan.`);
    }

    function insertWordImage(type) {
      playSound('click');
      let imgHtml = '';
      if (type === 'diagram') {
        imgHtml = `
          <div class="my-4 p-4 border border-blue-200 bg-blue-50/60 rounded-xl flex flex-col items-center justify-center text-center shadow-xs">
            <div class="w-16 h-16 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-2 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
            </div>
            <div class="font-bold text-slate-800 text-sm">Diagram Arsitektur Komputer Modern</div>
            <div class="text-xs text-slate-500 mt-1">CPU (Pemroses) • RAM (Memori Sementara) • SSD (Penyimpanan Permanen)</div>
          </div><p><br></p>
        `;
      } else {
        imgHtml = `
          <div class="my-4 p-5 border-2 border-amber-300 bg-amber-50/70 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
            <div class="text-amber-600 font-bold text-base uppercase tracking-wider">★ Sertifikat Kelulusan Praktikum Informatika ★</div>
            <div class="text-xs text-slate-600 mt-1">Diberikan kepada Siswa EduOS atas penyelesaian materi pengolah kata dengan baik.</div>
          </div><p><br></p>
        `;
      }
      executeWordCmd('insertHTML', imgHtml);
      showToast('Gambar ilustrasi edukasi berhasil disisipkan.');
    }

    function insertWordHorizontalRule() {
      executeWordCmd('insertHorizontalRule');
      showToast('Garis pembatas disisipkan.');
    }

    function insertWordDateTime() {
      const now = new Date();
      const str = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB';
      executeWordCmd('insertText', str);
      showToast('Tanggal dan waktu sekarang disisipkan.');
    }

    function insertWordSymbol(sym) {
      executeWordCmd('insertText', sym);
    }

    function insertWordCallout() {
      const calloutHtml = `
        <div class="my-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r text-sm text-blue-900 shadow-xs">
          <strong>💡 Catatan Informatika:</strong> Tuliskan rangkuman materi Anda di dalam kotak tips pembelajaran ini.
        </div><p><br></p>
      `;
      executeWordCmd('insertHTML', calloutHtml);
    }

    // Layout Settings
    function setWordOrientation(mode) {
      playSound('click');
      const doc = document.getElementById('word-document');
      const btnP = document.getElementById('word-btn-portrait');
      const btnL = document.getElementById('word-btn-landscape');
      if (!doc) return;

      if (mode === 'landscape') {
        doc.style.maxWidth = '1050px';
        doc.style.minHeight = '750px';
        if (btnL) btnL.className = 'px-3 py-1.5 bg-blue-100 text-blue-800 border border-blue-400 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer';
        if (btnP) btnP.className = 'px-3 py-1.5 bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer';
        showToast('Orientasi dokumen diubah ke Landscape (Mendatar).');
      } else {
        doc.style.maxWidth = '794px';
        doc.style.minHeight = '1050px';
        if (btnP) btnP.className = 'px-3 py-1.5 bg-blue-100 text-blue-800 border border-blue-400 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer';
        if (btnL) btnL.className = 'px-3 py-1.5 bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer';
        showToast('Orientasi dokumen diubah ke Portrait (Tegak).');
      }
    }

    function setWordMargin(marginType) {
      playSound('click');
      const doc = document.getElementById('word-document');
      if (!doc) return;
      if (marginType === 'narrow') {
        doc.className = (doc.className || "").replace(/p-\d+/g, '').replace(/sm:p-\d+/g, '').replace(/md:p-\d+/g, '') + ' p-6 sm:p-8 md:p-10';
        showToast('Margin kertas: Sempit (1.27 cm)');
      } else if (marginType === 'wide') {
        doc.className = doc.className.replace(/p-\d+/g, '').replace(/sm:p-\d+/g, '').replace(/md:p-\d+/g, '') + ' p-12 sm:p-20 md:p-24';
        showToast('Margin kertas: Lebar (3.8 cm)');
      } else {
        doc.className = doc.className.replace(/p-\d+/g, '').replace(/sm:p-\d+/g, '').replace(/md:p-\d+/g, '') + ' p-8 sm:p-14 md:p-16';
        showToast('Margin kertas: Normal (2.5 cm)');
      }
    }

    function setWordViewMode(mode) {
      playSound('click');
      const doc = document.getElementById('word-document');
      const btnPrint = document.getElementById('word-btn-view-print');
      const btnWeb = document.getElementById('word-btn-view-web');
      if (!doc) return;

      if (mode === 'web') {
        doc.style.maxWidth = '100%';
        doc.style.boxShadow = 'none';
        doc.style.border = 'none';
        if (btnWeb) btnWeb.className = 'px-3 py-1.5 bg-blue-100 text-blue-800 border border-blue-400 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer';
        if (btnPrint) btnPrint.className = 'px-3 py-1.5 bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer';
        showToast('Tampilan Web Layout');
      } else {
        doc.style.maxWidth = '794px';
        doc.style.boxShadow = '';
        doc.style.border = '';
        if (btnPrint) btnPrint.className = 'px-3 py-1.5 bg-blue-100 text-blue-800 border border-blue-400 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer';
        if (btnWeb) btnWeb.className = 'px-3 py-1.5 bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer';
        showToast('Tampilan Print Layout (Lembar A4)');
      }
    }

    function toggleWordRuler(show) {
      const ruler = document.getElementById('word-horizontal-ruler');
      if (ruler) {
        if (show) ruler.classList.remove('hidden');
        else ruler.classList.add('hidden');
      }
    }

    // File Management & Persistence
    function toggleWordFileMenu(forceState) {
      playSound('click');
      const modal = document.getElementById('word-file-modal');
      if (!modal) return;
      const isHidden = modal.classList.contains('hidden');
      const target = (typeof forceState === 'boolean') ? forceState : isHidden;
      if (target) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      } else {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
      if (window.lucide) window.lucide.createIcons();
    }

    function newWordDocument() {
      toggleWordFileMenu(false);
      playSound('click');
      const doc = document.getElementById('word-document');
      if (doc) {
        doc.innerHTML = '<h1 class="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">Dokumen Baru</h1><p><br></p>';
        updateWordCounts();
        showToast('Dokumen baru siap digunakan.');
      }
    }

    function openWordTemplate(num) {
      toggleWordFileMenu(false);
      playSound('click');
      const doc = document.getElementById('word-document');
      if (!doc) return;

      if (num === 1) {
        doc.innerHTML = `
          <h1 class="text-2xl font-bold text-blue-900 mb-2">LAPORAN PRAKTIKUM INFORMATIKA</h1>
          <p class="text-sm text-slate-500 mb-4 pb-2 border-b border-slate-300">Topik: Pengenalan Perangkat Keras dan Perangkat Lunak Komputer</p>
          <h2 class="text-lg font-bold text-slate-800 mb-2">A. Tujuan Praktikum</h2>
          <p class="mb-3 text-slate-700 leading-relaxed">1. Siswa mampu mengidentifikasi komponen utama komputer (CPU, RAM, Storage, Monitor, Keyboard, Mouse).<br>2. Siswa mampu mempraktikkan pengolahan kata dasar secara profesional.</p>
          <h2 class="text-lg font-bold text-slate-800 mb-2">B. Hasil Pengamatan</h2>
          <table class="w-full my-3 border-collapse border border-slate-400 text-sm">
            <thead><tr class="bg-blue-100 text-blue-900 font-bold"><th class="border border-slate-400 p-2">Komponen</th><th class="border border-slate-400 p-2">Fungsi Utama</th><th class="border border-slate-400 p-2">Status</th></tr></thead>
            <tbody>
              <tr><td class="border border-slate-400 p-2">CPU</td><td class="border border-slate-400 p-2">Memproses instruksi program</td><td class="border border-slate-400 p-2 text-emerald-600 font-bold">Aktif</td></tr>
              <tr><td class="border border-slate-400 p-2">RAM 8GB</td><td class="border border-slate-400 p-2">Penyimpanan memori sementara</td><td class="border border-slate-400 p-2 text-emerald-600 font-bold">Aktif</td></tr>
            </tbody>
          </table>
          <p><br></p>
        `;
      }
      updateWordCounts();
      showToast('Template laporan praktikum berhasil dimuat.');
    }

    function loadWordDocument(fileId) {
      if (typeof EduStorage === 'undefined') return;
      const file = EduStorage.getFileById(fileId);
      if (!file) return;
      currentWordFileId = fileId;
      const doc = document.getElementById('word-document');
      if (doc) {
        doc.innerHTML = file.content;
        updateWordCounts();
      }
      const titleEl = document.getElementById('word-doc-title');
      if (titleEl) {
        titleEl.innerText = `${file.name} - Word Edu`;
      }
      EduStorage.activeDocs.word = fileId;
    }

    function saveWordDocument(asNew = false) {
      playSound('click');
      const doc = document.getElementById('word-document');
      if (!doc) return;

      if (asNew || !currentWordFileId) {
        if (typeof showEduPromptModal === 'function') {
          showEduPromptModal({
            title: 'Simpan Dokumen Word Sebagai',
            message: 'Masukkan nama berkas untuk dokumen ini:',
            defaultValue: 'Dokumen_Tugas_Informatika.docx',
            placeholder: 'contoh: Makalah_Komputer.docx',
            confirmText: 'Simpan',
            onConfirm: (docName) => {
              if (!docName || !docName.trim()) docName = 'Dokumen_Word_Tanpa_Judul.docx';
              if (!docName.toLowerCase().endsWith('.docx')) docName += '.docx';
              
              const newFile = EduStorage.saveFile({
                name: docName,
                type: 'word',
                app: 'word',
                content: doc.innerHTML
              });
              currentWordFileId = newFile.id;
              EduStorage.activeDocs.word = newFile.id;
              
              const titleEl = document.getElementById('word-doc-title');
              if (titleEl) titleEl.innerText = `${newFile.name} - Word Edu`;

              const msg = document.getElementById('word-saved-msg');
              if (msg) {
                msg.classList.remove('hidden');
                setTimeout(() => msg.classList.add('hidden'), 2500);
              }
              showToast(`💾 "${newFile.name}" berhasil disimpan ke EduOS Storage.`);
            }
          });
        }
        return;
      }

      const currentFile = typeof EduStorage !== 'undefined' ? EduStorage.getFileById(currentWordFileId) : null;
      const fileName = currentFile ? currentFile.name : 'Dokumen_Word.docx';

      if (typeof EduStorage !== 'undefined') {
        EduStorage.saveFile({
          id: currentWordFileId,
          name: fileName,
          type: 'word',
          app: 'word',
          content: doc.innerHTML
        });
      }

      const msg = document.getElementById('word-saved-msg');
      if (msg) {
        msg.classList.remove('hidden');
        setTimeout(() => msg.classList.add('hidden'), 2500);
      }
      showToast(`💾 "${fileName}" berhasil disimpan ke EduOS Storage.`);
    }

    function toggleWordAutoSave() {
      wordAutoSaveEnabled = !wordAutoSaveEnabled;
      const toggle = document.getElementById('word-autosave-toggle');
      if (toggle) {
        if (wordAutoSaveEnabled) {
          toggle.className = 'w-6 h-3.5 bg-blue-600 rounded-full relative cursor-pointer';
          toggle.title = 'AutoSave Aktif';
          toggle.innerHTML = '<div class="w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm transition-all"></div>';
          showToast('AutoSave diaktifkan.');
        } else {
          toggle.className = 'w-6 h-3.5 bg-gray-400 rounded-full relative cursor-pointer';
          toggle.title = 'AutoSave Nonaktif';
          toggle.innerHTML = '<div class="w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm transition-all"></div>';
          showToast('AutoSave dinonaktifkan.');
        }
      }
    }

    function triggerWordAutoSave() {
      if (!wordAutoSaveEnabled) return;
      clearTimeout(wordAutoSaveTimer);
      wordAutoSaveTimer = setTimeout(() => {
        saveWordDocument(false);
      }, 3000);
    }

    function exportWordAsTxt() {
      playSound('click');
      const doc = document.getElementById('word-document');
      if (!doc) return;
      const text = doc.innerText || doc.textContent || '';
      const currentFile = typeof EduStorage !== 'undefined' && currentWordFileId ? EduStorage.getFileById(currentWordFileId) : null;
      const fileName = currentFile ? currentFile.name.replace(/\.docx$/i, '.txt') : 'Dokumen_Word_Edu.txt';
      
      if (typeof EduStorage !== 'undefined') {
        EduStorage.downloadBlob(text, fileName, 'text/plain;charset=utf-8');
      }
      showToast(`File dokumen berhasil diunduh sebagai ${fileName}`);
    }

    function exportWordAsHtml() {
      playSound('click');
      const doc = document.getElementById('word-document');
      if (!doc) return;
      const currentFile = typeof EduStorage !== 'undefined' && currentWordFileId ? EduStorage.getFileById(currentWordFileId) : null;
      const title = currentFile ? currentFile.name.replace(/\.docx$/i, '') : 'Dokumen_Word_Edu';
      
      const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; padding: 40px; margin: 0; color: #1e293b; }
    .a4-page { max-width: 800px; margin: 0 auto; background: white; padding: 50px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; }
    th { background-color: #e2e8f0; }
  </style>
</head>
<body>
  <div class="a4-page">
    ${doc.innerHTML}
  </div>
</body>
</html>`;

      if (typeof EduStorage !== 'undefined') {
        EduStorage.downloadBlob(htmlContent, `${title}.html`, 'text/html;charset=utf-8');
      }
      showToast(`Dokumen HTML "${title}.html" berhasil diunduh.`);
    }

    function printWordDocument() {
      playSound('click');
      showToast('Membuka dialog cetak dokumen...');
      setTimeout(() => window.print(), 300);
    }

    function findInWordDocument(query) {
      if (!query) return;
      try {
        if (window.find) {
          window.find(query);
        }
      } catch (e) {}
    }

    


// Global Bridge Export for Word Edu
if (typeof window !== 'undefined') {
  window.loadWordDocument = loadWordDocument;
  window.saveWordDocument = saveWordDocument;
  window.newWordDocument = newWordDocument;
  window.openWordTemplate = openWordTemplate;
  window.exportWordAsTxt = exportWordAsTxt;
  window.exportWordAsHtml = exportWordAsHtml;
  window.updateWordCounts = updateWordCounts;
}
if (typeof globalThis !== 'undefined') {
  globalThis.loadWordDocument = loadWordDocument;
  globalThis.saveWordDocument = saveWordDocument;
  globalThis.newWordDocument = newWordDocument;
  globalThis.openWordTemplate = openWordTemplate;
  globalThis.exportWordAsTxt = exportWordAsTxt;
  globalThis.exportWordAsHtml = exportWordAsHtml;
  globalThis.updateWordCounts = updateWordCounts;
}
