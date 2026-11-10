/**
 * EduOS - Desktop Environment & Multi-Window Manager Module
 * Mengelola jendela aplikasi, start menu, taskbar, file explorer, tempat sampah, dan info sistem
 */

// TRUE MULTI-WINDOW MANAGER
    // ==============================================
    // Helper Class Ukuran Jendela Responsif
function getWindowClasses(isMaximized) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  if (isMaximized) {
    return ['top-0', 'left-0', 'right-0', 'bottom-11', 'md:bottom-12', 'rounded-none'];
  } else {
    return isMobile 
      ? ['top-1', 'left-1', 'right-1', 'bottom-12', 'rounded-lg']
      : ['top-2', 'left-2', 'right-2', 'bottom-14', 'rounded-xl'];
  }
}

function getAllPossibleWindowClasses() {
  return [
    'top-0', 'left-0', 'right-0', 'bottom-0', 'bottom-11', 'bottom-12', 'bottom-14', 'bottom-16',
    'top-1', 'left-1', 'right-1', 'top-2', 'left-2', 'right-2',
    'rounded-none', 'rounded-lg', 'rounded-xl', 'md:bottom-12'
  ];
}

function openApp(appId) {
      if (!appRegistry[appId]) return;
      playSound('click');
      toggleStartMenu(false);

      const appEl = document.getElementById(`app-${appId}`);
      if (!appEl) return;

      appStates[appId].open = true;
      appStates[appId].minimized = false;

      const isMax = appStates[appId].maximized;
      appEl.classList.remove(...getAllPossibleWindowClasses());
      appEl.classList.add(...getWindowClasses(isMax));

      appEl.classList.remove('hidden');
      appEl.classList.add('flex');

      focusApp(appId);

      // Inisialisasi konten aplikasi saat dibuka
      if (appId === 'word') {
        setTimeout(() => {
          const ta = document.getElementById('word-document') || document.getElementById('word-textarea');
          if (ta) ta.focus();
        }, 100);
      } else if (appId === 'excel') {
        renderExcel();
      } else if (appId === 'powerpoint') {
        renderPPT();
      } else if (appId === 'explorer') {
        renderExplorerFiles();
      } else if (appId === 'trash') {
        renderTrashFiles();
      }

      if (state.tutorialStep === 1) {
        state.tutorialStep = 2;
        const tutDesktop = document.getElementById('tutorial-desktop');
        if (tutDesktop) tutDesktop.classList.add('hidden');
      }

      updateTaskbarUI();
      if (window.lucide) window.lucide.createIcons();
    }

    function focusApp(appId) {
      if (!appStates[appId] || !appStates[appId].open) return;
      const appEl = document.getElementById(`app-${appId}`);
      if (!appEl) return;

      if (appStates[appId].minimized) {
        appStates[appId].minimized = false;
        appEl.classList.remove('hidden');
        appEl.classList.add('flex');
      }

      highestZ++;
      appStates[appId].zIndex = highestZ;
      appEl.style.zIndex = highestZ;
      focusedAppId = appId;
      state.activeApp = appId;

      updateTaskbarUI();
    }

    function minimizeApp(appId = focusedAppId) {
      if (!appId || !appStates[appId]) return;
      playSound('click');

      const appEl = document.getElementById(`app-${appId}`);
      if (appEl) {
        appEl.classList.add('hidden');
        appEl.classList.remove('flex');
      }
      appStates[appId].minimized = true;

      if (focusedAppId === appId) {
        let nextApp = null;
        let maxZ = -1;
        Object.keys(appStates).forEach(id => {
          if (appStates[id].open && !appStates[id].minimized && appStates[id].zIndex > maxZ) {
            maxZ = appStates[id].zIndex;
            nextApp = id;
          }
        });
        focusedAppId = nextApp;
        state.activeApp = nextApp;
      }

      updateTaskbarUI();
      if (window.lucide) window.lucide.createIcons();
    }

    function closeApp(appId = focusedAppId) {
      if (!appId || !appStates[appId]) return;
      playSound('click');

      const appEl = document.getElementById(`app-${appId}`);
      if (appEl) {
        appEl.classList.add('hidden');
        appEl.classList.remove('flex');
      }

      appStates[appId].open = false;
      appStates[appId].minimized = false;

      if (appStates[appId].maximized && appEl) {
        appEl.classList.remove(...getAllPossibleWindowClasses());
        appEl.classList.add(...getWindowClasses(false));
        appStates[appId].maximized = false;

        const iconMax = document.getElementById(`icon-max-${appId}`);
        const iconRestore = document.getElementById(`icon-restore-${appId}`);
        if (iconRestore) iconRestore.classList.add('hidden');
        if (iconMax) iconMax.classList.remove('hidden');
      }

      if (focusedAppId === appId) {
        let nextApp = null;
        let maxZ = -1;
        Object.keys(appStates).forEach(id => {
          if (appStates[id].open && !appStates[id].minimized && appStates[id].zIndex > maxZ) {
            maxZ = appStates[id].zIndex;
            nextApp = id;
          }
        });
        focusedAppId = nextApp;
        state.activeApp = nextApp;
      }

      updateTaskbarUI();
      if (window.lucide) window.lucide.createIcons();
    }

    function toggleMaximize(appId = focusedAppId) {
      if (!appId || !appStates[appId]) return;
      playSound('click');

      const appEl = document.getElementById(`app-${appId}`);
      const iconMax = document.getElementById(`icon-max-${appId}`);
      const iconRestore = document.getElementById(`icon-restore-${appId}`);
      if (!appEl) return;

      const currentMax = appStates[appId].maximized;
      const targetMax = !currentMax;

      appEl.classList.remove(...getAllPossibleWindowClasses());
      appEl.classList.add(...getWindowClasses(targetMax));
      appStates[appId].maximized = targetMax;

      if (targetMax) {
        if (iconMax) iconMax.classList.add('hidden');
        if (iconRestore) iconRestore.classList.remove('hidden');
      } else {
        if (iconRestore) iconRestore.classList.add('hidden');
        if (iconMax) iconMax.classList.remove('hidden');
      }

      focusApp(appId);
      if (window.lucide) window.lucide.createIcons();
    }

    function taskbarClick(appId) {
      playSound('click');
      toggleStartMenu(false);

      if (!appStates[appId] || !appStates[appId].open) {
        openApp(appId);
      } else if (appStates[appId].minimized) {
        focusApp(appId);
      } else if (focusedAppId === appId) {
        minimizeApp(appId);
      } else {
        focusApp(appId);
      }
    }

    function updateTaskbarUI() {
      const container = document.getElementById('taskbar-apps-container');
      if (!container) return;

      let html = '';
      Object.keys(appRegistry).forEach(appId => {
        const info = appRegistry[appId];
        const appState = appStates[appId];
        if (appState && appState.open) {
          const isFocused = focusedAppId === appId && !appState.minimized;
          const isMin = appState.minimized;
          
          let btnClass = 'flex items-center gap-1.5 h-8 px-2 sm:px-3 rounded-lg text-xs transition-all cursor-pointer select-none ';
          if (isFocused) {
            btnClass += 'bg-blue-50/90 text-blue-700 font-bold border-b-2 border-blue-600 shadow-xs';
          } else if (isMin) {
            btnClass += 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 border-b-2 border-slate-300';
          } else {
            btnClass += 'text-slate-700 hover:bg-slate-100 border-b-2 border-slate-400 font-medium';
          }

          html += `<div onclick="taskbarClick('${appId}')" class="${btnClass}" title="${info.title}">
            <i data-lucide="${info.icon}" class="w-4 h-4 ${info.color}"></i>
            <span class="hidden md:inline">${info.title}</span>
            ${isMin ? '<span class="w-1.5 h-1.5 rounded-full bg-slate-400 ml-0.5"></span>' : ''}
          </div>`;
        }
      });

      container.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();
    }

    function showDesktopToggle() {
      playSound('click');
      toggleStartMenu(false);

      const hasVisible = Object.keys(appStates).some(id => appStates[id].open && !appStates[id].minimized);

      if (hasVisible) {
        // Minimalkan semua jendela
        Object.keys(appStates).forEach(id => {
          if (appStates[id].open && !appStates[id].minimized) {
            const el = document.getElementById(`app-${id}`);
            if (el) {
              el.classList.add('hidden');
              el.classList.remove('flex');
            }
            appStates[id].minimized = true;
          }
        });
        focusedAppId = null;
        state.activeApp = null;
      } else {
        // Pulihkan semua jendela yang terbuka
        let lastId = null;
        Object.keys(appStates).forEach(id => {
          if (appStates[id].open) {
            const el = document.getElementById(`app-${id}`);
            if (el) {
              el.classList.remove('hidden');
              el.classList.add('flex');
            }
            appStates[id].minimized = false;
            lastId = id;
          }
        });
        if (lastId) focusApp(lastId);
      }

      updateTaskbarUI();
    }

    // ==============================================
    // START MENU & DESKTOP INTERACTIONS
    // ==============================================
    function toggleStartMenu(forceState) {
      const menu = document.getElementById('start-menu');
      if (!menu) return;
      const volPopover = document.getElementById('volume-popover');
      if (volPopover) volPopover.classList.add('hidden');

      const isHidden = menu.classList.contains('hidden');
      const targetShow = (typeof forceState === 'boolean') ? forceState : isHidden;

      if (targetShow) {
        playSound('click');
        menu.classList.remove('hidden');
        menu.classList.add('flex');
        const input = document.getElementById('start-search-input');
        if (input) {
          input.value = '';
          filterStartApps('');
          setTimeout(() => input.focus(), 100);
        }
      } else {
        menu.classList.add('hidden');
        menu.classList.remove('flex');
      }
      if (window.lucide) window.lucide.createIcons();
    }

    function onDesktopAreaClick(e) {
      if (e.target.id === 'desktop-area' || e.target.classList.contains('desktop-icon')) {
        toggleStartMenu(false);
        const volPopover = document.getElementById('volume-popover');
        if (volPopover) volPopover.classList.add('hidden');
      }
    }

    function filterStartApps(query) {
      const q = query.toLowerCase().trim();
      const items = document.querySelectorAll('.start-app-item');
      items.forEach(item => {
        const text = item.innerText.toLowerCase();
        if (!q || text.includes(q)) {
          item.classList.remove('hidden');
          item.classList.add('flex');
        } else {
          item.classList.add('hidden');
          item.classList.remove('flex');
        }
      });
    }

    function dismissTutorialDesktop() {
      const tut = document.getElementById('tutorial-desktop');
      if (tut) tut.classList.add('hidden');
    }

    // ==============================================
    // RESTART & SHUTDOWN SIMULATOR
    // ==============================================
    function restartEduOS() {
      playSound('boot');
      toggleStartMenu(false);

      // Tutup semua aplikasi
      Object.keys(appStates).forEach(id => {
        if (appStates[id].open) closeApp(id);
      });

      const restartOverlay = document.getElementById('screen-restart');
      if (restartOverlay) {
        restartOverlay.classList.remove('hidden');
        restartOverlay.classList.add('flex');
        if (window.lucide) window.lucide.createIcons();
      }

      setTimeout(() => {
        if (restartOverlay) {
          restartOverlay.classList.add('hidden');
          restartOverlay.classList.remove('flex');
        }

        // Tampilkan booting ulang singkat
        const desktopEl = document.getElementById('screen-desktop');
        desktopEl.classList.add('hidden');
        desktopEl.classList.remove('flex');

        const bootingEl = document.getElementById('screen-booting');
        bootingEl.classList.remove('hidden');
        bootingEl.classList.add('flex');

        let progress = 0;
        const bar = document.getElementById('boot-progress');
        const text = document.getElementById('boot-text');
        bar.style.width = '0%';
        text.innerText = 'Memulai ulang EduOS... 0%';

        const interval = setInterval(() => {
          progress += 25;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
              bootingEl.classList.add('hidden');
              bootingEl.classList.remove('flex');
              desktopEl.classList.remove('hidden');
              desktopEl.classList.add('flex');
              state.system = 'desktop';
              showToast('EduOS berhasil dimulai ulang.');
              if (window.lucide) window.lucide.createIcons();
            }, 300);
          }
          bar.style.width = progress + '%';
          text.innerText = `Memuat file sistem... ${progress}%`;
        }, 150);
      }, 1200);
    }

    function confirmPowerOff() {
      playSound('click');
      toggleStartMenu(false);
      powerOff();
    }

    // ==============================================
    // KONTROL VOLUME AUDIO
    // ==============================================
    // currentVolume is initialized in config.js
    currentVolume = 1.0;

    function toggleVolumePopover() {
      playSound('click');
      toggleStartMenu(false);
      const popover = document.getElementById('volume-popover');
      if (!popover) return;
      if (popover.classList.contains('hidden')) {
        popover.classList.remove('hidden');
        popover.classList.add('flex');
      } else {
        popover.classList.add('hidden');
        popover.classList.remove('flex');
      }
    }

    function setSystemVolume(val) {
      val = parseInt(val);
      currentVolume = val / 100;
      const text = document.getElementById('volume-value-text');
      if (text) text.innerText = val + '%';

      const icon = document.getElementById('icon-volume');
      if (icon) {
        if (val === 0) icon.setAttribute('data-lucide', 'volume-x');
        else if (val < 50) icon.setAttribute('data-lucide', 'volume-1');
        else icon.setAttribute('data-lucide', 'volume-2');
        if (window.lucide) window.lucide.createIcons();
      }
    }

    // ==============================================
    // FILE EXPLORER & RECYCLE BIN SIMULATOR (EduStorage Integration)
    // ==============================================
    function renderExplorerFiles(filter = '') {
      const list = document.getElementById('explorer-file-list');
      const countEl = document.getElementById('explorer-status-count');
      if (!list) return;

      const files = typeof EduStorage !== 'undefined' ? EduStorage.getFiles() : [];
      const q = filter.toLowerCase().trim();
      const filtered = files.filter(f => !q || f.name.toLowerCase().includes(q));

      if (countEl) countEl.innerText = `${filtered.length} File Tersimpan`;

      if (filtered.length === 0) {
        list.innerHTML = `<div class="flex flex-col items-center justify-center p-8 text-slate-400">
          <i data-lucide="folder-search" class="w-10 h-10 mb-2 text-slate-300"></i>
          <p class="text-xs">Tidak ada file yang cocok.</p>
        </div>`;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      list.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          ${filtered.map(f => {
            const icon = f.type === 'word' ? 'file-text' : (f.type === 'excel' ? 'table' : 'presentation');
            const color = f.type === 'word' ? 'text-blue-600 bg-blue-50' : (f.type === 'excel' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50');
            return `
              <div onclick="openFileFromExplorer('${f.id}')" class="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer flex items-center justify-between group transition-all shadow-xs">
                <div class="flex items-center gap-2.5 min-w-0 flex-1">
                  <div class="w-8 h-8 rounded-lg ${color} flex items-center justify-center shrink-0">
                    <i data-lucide="${icon}" class="w-4 h-4"></i>
                  </div>
                  <div class="min-w-0 flex-1 pr-1">
                    <div class="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-700" title="${f.name}">${f.name}</div>
                    <div class="text-[10px] text-slate-400">${f.size} • ${f.date}</div>
                  </div>
                </div>
                <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onclick="event.stopPropagation(); renameExplorerFile('${f.id}')" class="p-1 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded" title="Ganti Nama Berkas">
                    <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                  </button>
                  <button onclick="event.stopPropagation(); downloadExplorerFile('${f.id}')" class="p-1 hover:bg-slate-100 text-slate-400 hover:text-emerald-600 rounded" title="Unduh Berkas ke PC">
                    <i data-lucide="download" class="w-3.5 h-3.5"></i>
                  </button>
                  <button onclick="event.stopPropagation(); deleteExplorerFile('${f.id}')" class="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded" title="Pindahkan ke Tempat Sampah">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    }

    function openFileFromExplorer(fileId) {
      if (typeof EduStorage === 'undefined') return;
      const file = EduStorage.getFileById(fileId);
      if (!file) return;
      playSound('click');
      showToast(`Membuka "${file.name}" di ${appRegistry[file.app].title}...`);
      
      if (file.type === 'word') {
        if (typeof loadWordDocument === 'function') loadWordDocument(fileId);
        openApp('word');
      } else if (file.type === 'excel') {
        if (typeof loadExcelWorkbook === 'function') loadExcelWorkbook(fileId);
        openApp('excel');
      } else if (file.type === 'powerpoint') {
        if (typeof loadPptPresentation === 'function') loadPptPresentation(fileId);
        openApp('powerpoint');
      }
    }

    function deleteExplorerFile(fileId) {
      if (typeof EduStorage === 'undefined') return;
      const file = EduStorage.getFileById(fileId);
      if (!file) return;

      showEduConfirmModal({
        title: 'Pindahkan ke Tempat Sampah?',
        message: `Apakah Anda yakin ingin memindahkan berkas "${file.name}" ke Tempat Sampah?`,
        icon: 'trash-2',
        confirmText: 'Pindahkan',
        confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
        onConfirm: () => {
          const removed = EduStorage.deleteFile(fileId);
          if (removed) {
            showToast(`"${removed.name}" dipindahkan ke Tempat Sampah.`);
          }
        }
      });
    }

    function renameExplorerFile(fileId) {
      if (typeof EduStorage === 'undefined') return;
      const file = EduStorage.getFileById(fileId);
      if (!file) return;

      showEduPromptModal({
        title: 'Ganti Nama Berkas',
        message: 'Masukkan nama baru untuk berkas ini:',
        defaultValue: file.name,
        confirmText: 'Ganti Nama',
        onConfirm: (newName) => {
          if (newName && newName.trim()) {
            EduStorage.renameFile(fileId, newName);
            showToast(`Nama berkas diubah menjadi "${newName}".`);
          }
        }
      });
    }

    function downloadExplorerFile(fileId) {
      if (typeof EduStorage === 'undefined') return;
      const file = EduStorage.getFileById(fileId);
      if (!file) return;
      playSound('click');

      if (file.type === 'word') {
        const plainText = file.content.replace(/<[^>]+>/g, ' ');
        EduStorage.downloadBlob(plainText, file.name.replace(/\.docx$/i, '.txt'), 'text/plain;charset=utf-8');
      } else if (file.type === 'excel') {
        let csv = '';
        const sheets = file.content.sheets || {};
        const activeSheet = sheets[file.content.currentSheetName] || Object.values(sheets)[0] || {};
        for (let r = 1; r <= 30; r++) {
          const rowVals = [];
          let hasVal = false;
          for (let c = 0; c < 15; c++) {
            const colLetter = String.fromCharCode(65 + c);
            const val = activeSheet[`${colLetter}${r}`] || '';
            if (val) hasVal = true;
            rowVals.push(`"${val.replace(/"/g, '""')}"`);
          }
          if (hasVal) csv += rowVals.join(',') + '\n';
        }
        EduStorage.downloadBlob(csv, file.name.replace(/\.xlsx$/i, '.csv'), 'text/csv;charset=utf-8');
      } else if (file.type === 'powerpoint') {
        const slides = file.content.slides || [];
        let summary = `=== PRESENTASI: ${file.name} ===\n\n`;
        slides.forEach((s, idx) => {
          summary += `[Slide ${idx + 1}] ${s.title || 'Tanpa Judul'}\n`;
          if (s.subtitle) summary += `Subjudul: ${s.subtitle}\n`;
          if (s.body && s.body.length) summary += `Poin-poin:\n - ${s.body.join('\n - ')}\n`;
          if (s.notes) summary += `Catatan: ${s.notes}\n`;
          summary += '\n----------------------------------------\n\n';
        });
        EduStorage.downloadBlob(summary, file.name.replace(/\.pptx$/i, '_Rangkuman.txt'), 'text/plain;charset=utf-8');
      }
      showToast(`📥 Berkas "${file.name}" berhasil diunduh ke komputer.`);
    }

    function filterExplorerFiles(val) {
      renderExplorerFiles(val);
    }

    function renderTrashFiles() {
      const container = document.getElementById('trash-content-area');
      const countEl = document.getElementById('trash-status-count');
      if (!container) return;

      const trash = typeof EduStorage !== 'undefined' ? EduStorage.getTrash() : [];
      if (countEl) countEl.innerText = `${trash.length} elemen`;

      if (trash.length === 0) {
        container.innerHTML = `
          <div id="trash-empty-state" class="flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div class="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 mb-2.5">
              <i data-lucide="trash-2" class="w-8 h-8"></i>
            </div>
            <div class="text-sm font-bold text-slate-600">Tempat Sampah Bersih</div>
            <div class="text-xs text-slate-400 mt-1 max-w-xs">Tidak ada file yang dihapus. Tempat sampah berfungsi menampung berkas sementara sebelum dihapus permanen.</div>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            ${trash.map(f => {
              const icon = f.type === 'word' ? 'file-text' : (f.type === 'excel' ? 'table' : 'presentation');
              return `
                <div class="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-xs">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                      <i data-lucide="${icon}" class="w-4 h-4"></i>
                    </div>
                    <div class="min-w-0">
                      <div class="text-xs font-semibold text-slate-700 truncate">${f.name}</div>
                      <div class="text-[10px] text-slate-400">${f.size}</div>
                    </div>
                  </div>
                  <button onclick="restoreSingleFile('${f.id}')" class="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded cursor-pointer" title="Pulihkan File">
                    <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }
      if (window.lucide) window.lucide.createIcons();
    }

    function emptyRecycleBin() {
      if (typeof EduStorage === 'undefined') return;
      const trash = EduStorage.getTrash();
      if (trash.length === 0) {
        showToast('Tempat sampah sudah bersih.');
        return;
      }
      showEduConfirmModal({
        title: 'Kosongkan Tempat Sampah?',
        message: `Tindakan ini akan menghapus ${trash.length} berkas secara permanen dari EduOS. Berkas yang dihapus tidak dapat dipulihkan kembali. Lanjutkan?`,
        icon: 'trash',
        confirmText: 'Kosongkan Permanen',
        confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
        onConfirm: () => {
          EduStorage.emptyTrash();
          showToast('🗑️ Tempat sampah berhasil dikosongkan.');
        }
      });
    }

    function restoreRecycleBin() {
      if (typeof EduStorage === 'undefined') return;
      const count = EduStorage.restoreAllTrash();
      if (count > 0) {
        playSound('click');
        showToast(`Semua (${count}) berkas berhasil dipulihkan ke File Explorer.`);
      } else {
        showToast('Tidak ada file di tempat sampah.');
      }
    }

    function restoreSingleFile(id) {
      if (typeof EduStorage === 'undefined') return;
      const restored = EduStorage.restoreFile(id);
      if (restored) {
        playSound('click');
        showToast(`"${restored.name}" telah dipulihkan ke File Explorer.`);
      }
    }

    function resetSimulasiWithConfirm() {
      showEduConfirmModal({
        title: 'Reset Simulasi ke Setelan Pabrik?',
        message: 'Peringatan: Seluruh dokumen siswa yang baru dibuat akan dihapus dan EduOS akan dikembalikan ke kondisi awal bawaan pabrik. Apakah Anda yakin?',
        icon: 'rotate-ccw',
        confirmText: 'Reset Sekarang',
        confirmClass: 'bg-amber-600 hover:bg-amber-700 text-white',
        onConfirm: () => {
          if (typeof EduStorage !== 'undefined') EduStorage.resetToFactory(false);
          // Tutup semua aplikasi yang terbuka
          Object.keys(appStates).forEach(id => {
            if (appStates[id].open) closeApp(id);
          });
          showToast('Memulai ulang komputer pasca reset...');
          setTimeout(() => {
            if (typeof shutdownEduOS === 'function') shutdownEduOS();
          }, 800);
        }
      });
    }

    function triggerExplorerImport() {
      const input = document.getElementById('explorer-file-input');
      if (input) input.click();
    }

    function handleExplorerFileUpload(inputEl) {
      if (!inputEl || !inputEl.files || !inputEl.files[0]) return;
      const file = inputEl.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        if (file.name.toLowerCase().endsWith('.json') && content.includes('"version"') && content.includes('"files"')) {
          EduStorage.importBackup(content);
        } else {
          EduStorage.importLocalFile(file, content);
        }
        inputEl.value = '';
      };
      reader.readAsText(file);
    }



// ==============================================
// PUSAT BELAJAR & MISI PRAKTIKUM SISWA (Tahap 9)
// ==============================================
function switchAboutTab(tabId) {
  playSound('click');
  const tabs = ['hardware', 'glossary', 'missions'];
  tabs.forEach(t => {
    const btn = document.getElementById(`about-tab-${t}`);
    const pane = document.getElementById(`about-pane-${t}`);
    if (btn) {
      if (t === tabId) {
        btn.className = 'px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5';
      } else {
        btn.className = 'px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium text-xs transition-colors cursor-pointer flex items-center gap-1.5';
      }
    }
    if (pane) {
      if (t === tabId) {
        pane.classList.remove('hidden');
        pane.classList.add('flex');
      } else {
        pane.classList.remove('flex');
        pane.classList.add('hidden');
      }
    }
  });
  if (window.lucide) window.lucide.createIcons();
}

function startLearningMission(appId) {
  playSound('click');
  closeApp('about');
  if (appId === 'word') {
    openApp('word');
    if (typeof openWordTemplate === 'function') openWordTemplate(1);
    showToast('🚀 Misi Word: Format judul menjadi Tebal (Bold), periksa tabel komponen, dan simpan dokumen!');
  } else if (appId === 'excel') {
    openApp('excel');
    if (typeof openExcelTemplate === 'function') openExcelTemplate(1);
    showToast('🚀 Misi Excel: Periksa formula =AVERAGE dan =IF pada tabel nilai siswa, lalu coba tombol Buat Grafik!');
  } else if (appId === 'powerpoint') {
    openApp('powerpoint');
    if (typeof openPptTemplate === 'function') openPptTemplate(1);
    showToast('🚀 Misi PowerPoint: Pelajari susunan slide 16:9, ganti tema di tab Desain, dan coba tombol Slide Show!');
  } else if (appId === 'explorer') {
    openApp('explorer');
    showToast('🚀 Misi File: Buka salah satu berkas dengan mengkliknya, atau unduh cadangan seluruh data!');
  }
}

// Global Bridge Export for Desktop & Window Management
if (typeof window !== 'undefined') {
  window.openApp = openApp;
  window.closeApp = closeApp;
  window.minimizeApp = minimizeApp;
  window.toggleMaximize = toggleMaximize;
  window.focusApp = focusApp;
  window.getWindowClasses = getWindowClasses;
  window.getAllPossibleWindowClasses = getAllPossibleWindowClasses;
  window.openFileFromExplorer = openFileFromExplorer;
  window.renderExplorerFiles = renderExplorerFiles;
  window.renderTrashFiles = renderTrashFiles;
  window.deleteExplorerFile = deleteExplorerFile;
  window.renameExplorerFile = renameExplorerFile;
  window.downloadExplorerFile = downloadExplorerFile;
  window.emptyRecycleBin = emptyRecycleBin;
  window.restoreRecycleBin = restoreRecycleBin;
  window.restoreSingleFile = restoreSingleFile;
  window.resetSimulasiWithConfirm = resetSimulasiWithConfirm;
  window.triggerExplorerImport = triggerExplorerImport;
  window.handleExplorerFileUpload = handleExplorerFileUpload;
  window.switchAboutTab = switchAboutTab;
  window.startLearningMission = startLearningMission;
}
if (typeof globalThis !== 'undefined') {
  globalThis.openApp = openApp;
  globalThis.closeApp = closeApp;
  globalThis.minimizeApp = minimizeApp;
  globalThis.toggleMaximize = toggleMaximize;
  globalThis.focusApp = focusApp;
  globalThis.getWindowClasses = getWindowClasses;
  globalThis.getAllPossibleWindowClasses = getAllPossibleWindowClasses;
  globalThis.openFileFromExplorer = openFileFromExplorer;
  globalThis.renderExplorerFiles = renderExplorerFiles;
  globalThis.renderTrashFiles = renderTrashFiles;
  globalThis.deleteExplorerFile = deleteExplorerFile;
  globalThis.renameExplorerFile = renameExplorerFile;
  globalThis.downloadExplorerFile = downloadExplorerFile;
  globalThis.emptyRecycleBin = emptyRecycleBin;
  globalThis.restoreRecycleBin = restoreRecycleBin;
  globalThis.restoreSingleFile = restoreSingleFile;
  globalThis.resetSimulasiWithConfirm = resetSimulasiWithConfirm;
  globalThis.triggerExplorerImport = triggerExplorerImport;
  globalThis.handleExplorerFileUpload = handleExplorerFileUpload;
  globalThis.switchAboutTab = switchAboutTab;
  globalThis.startLearningMission = startLearningMission;
}
