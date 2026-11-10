/**
 * EduOS - Main App Entrypoint & Global Initializer
 * Mengelola penskalaan zoom universal, event listener keyboard global, jam realtime, dan bootstrap DOMContentLoaded
 */

// 7. LOGIKA ZOOM UNIVERSAL
let zoomLevels = {
  word: 100,
  excel: 100,
  powerpoint: 90
};

function setZoom(app, value) {
  value = parseInt(value);
  if (value < 10) value = 10;
  if (value > 200) value = 200;
  zoomLevels[app] = value;

  const prefix = (app === 'powerpoint' || app === 'ppt') ? 'ppt' : app;
  const slider = document.getElementById(`${prefix}-zoom-slider`);
  const text = document.getElementById(`${prefix}-zoom-text`);

  if (slider) slider.value = value;
  if (text) text.innerText = value + '%';

  if (app === 'word') {
    const el = document.getElementById('word-document') || document.getElementById('word-textarea');
    if (el) el.style.transform = `scale(${value / 100})`;
  } else if (app === 'excel') {
    const el = document.getElementById('excel-table');
    if (el) el.style.transform = `scale(${value / 100})`;
  } else if (app === 'powerpoint' || app === 'ppt') {
    const el = document.getElementById('ppt-slide-canvas') || document.getElementById('ppt-slide-container');
    if (el) el.style.transform = `scale(${value / 100})`;
  }
}

function changeZoom(app, delta) {
  setZoom(app, zoomLevels[app] + delta);
}

// Global Keyboard Handler for F11
window.addEventListener('keydown', (e) => {
  if (e.key === 'F11') {
    e.preventDefault();
    toggleFullscreen();
  }
});

// Update Jam & Tanggal Taskbar serta BIOS Clock
function updateSystemRealtimeClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const timeEl = document.getElementById('taskbar-time');
  const dateEl = document.getElementById('taskbar-date');
  if (timeEl) timeEl.innerText = timeStr;
  if (dateEl) dateEl.innerText = dateStr;

  const biosClock = document.getElementById('bios-realtime-clock');
  if (biosClock) biosClock.innerText = timeStr + ' WIB';
}

// Inisialisasi awal UI saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
  // 1. Inisialisasi Storage & Hidrasi Berkas
  if (typeof EduStorage !== 'undefined') {
    EduStorage.init();
    if (typeof loadWordDocument === 'function' && EduStorage.activeDocs && EduStorage.activeDocs.word) {
      loadWordDocument(EduStorage.activeDocs.word);
    }
    if (typeof loadExcelWorkbook === 'function' && EduStorage.activeDocs && EduStorage.activeDocs.excel) {
      loadExcelWorkbook(EduStorage.activeDocs.excel);
    }
    if (typeof loadPptPresentation === 'function' && EduStorage.activeDocs && EduStorage.activeDocs.powerpoint) {
      loadPptPresentation(EduStorage.activeDocs.powerpoint);
    }
  }

  if (typeof populateKeyboard === 'function') populateKeyboard();
  if (typeof initExcelHeaders === 'function') initExcelHeaders();
  if (typeof renderExcel === 'function') renderExcel();
  if (typeof renderPPT === 'function') renderPPT();
  if (typeof updateWordCounts === 'function') updateWordCounts();
  if (typeof renderExplorerFiles === 'function') renderExplorerFiles();
  if (typeof renderTrashFiles === 'function') renderTrashFiles();
  if (typeof updateTaskbarUI === 'function') updateTaskbarUI();
  if (typeof checkOrientation === 'function') checkOrientation();

  // Inisialisasi Zoom default
  setZoom('word', 100);
  setZoom('excel', 100);
  setZoom('powerpoint', 90);

  // Jalankan Jam Realtime
  updateSystemRealtimeClock();
  setInterval(updateSystemRealtimeClock, 1000);

  if (window.lucide) {
    window.lucide.createIcons();
  }
});
