/**
 * EduOS - Config & Utilities Module
 * Menyimpan konfigurasi state global, audio synthesizer, sistem toast, fullscreen dan orientasi
 */

// 1. STATE & SISTEM UTILITAS (EduOS Bright Modern)
const state = {
  activeApp: null,
  minimizedApps: [],
  fullscreen: false,
  orientationLocked: false,
  system: 'off',
  tutorialStep: 0
};

const appRegistry = {
  word: { title: 'Word Edu - Pengolah Kata', icon: 'file-text', color: 'bg-blue-600', text: 'text-blue-600' },
  excel: { title: 'Excel Edu - Lembar Kerja', icon: 'table', color: 'bg-emerald-600', text: 'text-emerald-600' },
  powerpoint: { title: 'PowerPoint Edu - Presentasi', icon: 'presentation', color: 'bg-rose-600', text: 'text-rose-600' },
  explorer: { title: 'File Explorer Edu', icon: 'folder', color: 'bg-sky-600', text: 'text-sky-600' },
  trash: { title: 'Tempat Sampah', icon: 'trash-2', color: 'bg-amber-600', text: 'text-amber-600' },
  about: { title: 'Pusat Belajar & Tugas Siswa', icon: 'book-open', color: 'bg-indigo-600', text: 'text-indigo-600' }
};

let appStates = {
  word: { open: false, minimized: false, maximized: false, zIndex: 10 },
  excel: { open: false, minimized: false, maximized: false, zIndex: 10 },
  powerpoint: { open: false, minimized: false, maximized: false, zIndex: 10 },
  explorer: { open: false, minimized: false, maximized: false, zIndex: 10 },
  trash: { open: false, minimized: false, maximized: false, zIndex: 10 },
  about: { open: false, minimized: false, maximized: false, zIndex: 10 }
};

let highestZ = 20;
let focusedAppId = null;
let systemVolume = 100;
let currentVolume = 1.0;
let toastTimer = null;
let globalAudioCtx = null;

function getAudioContext() {
  if (!globalAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      globalAudioCtx = new AudioContextClass();
    }
  }
  if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume();
  }
  return globalAudioCtx;
}

function playSound(type) {
  try {
    if (currentVolume <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
      gainNode.gain.setValueAtTime(0.15 * currentVolume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'type') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450 + Math.random() * 80, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.08 * currentVolume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } else if (type === 'beep') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.12 * currentVolume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } else if (type === 'boot') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.5);
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 1.5);
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15 * currentVolume, ctx.currentTime + 0.5);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
      osc.start();
      osc.stop(ctx.currentTime + 2);
    } else if (type === 'chime') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.2 * currentVolume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    }
  } catch (e) {
    // Abaikan jika browser membatasi autoplay audio
  }
}

function showToast(msg, duration = 3000) {
  const toast = document.getElementById('app-toast');
  const text = document.getElementById('app-toast-text');
  if (!toast || !text) return;
  
  text.innerText = msg;
  toast.classList.remove('hidden', 'opacity-0', 'translate-y-2');
  toast.classList.add('flex', 'opacity-100', 'translate-y-0');
  
  if (window.lucide) window.lucide.createIcons();
  
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => {
      toast.classList.remove('flex');
      toast.classList.add('hidden');
    }, 200);
  }, duration);
}

// Fullscreen API Helper
function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
}

function toggleFullscreen() {
  playSound('click');
  const doc = document.documentElement;
  
  if (!isFullscreen()) {
    if (doc.requestFullscreen) {
      doc.requestFullscreen().catch(err => handleFullscreenError(err));
    } else if (doc.webkitRequestFullscreen) {
      doc.webkitRequestFullscreen();
    } else if (doc.mozRequestFullScreen) {
      doc.mozRequestFullScreen();
    } else if (doc.msRequestFullscreen) {
      doc.msRequestFullscreen();
    } else {
      showToast('Fullscreen tidak didukung pada browser ini. Gunakan Tambahkan ke Layar Utama.');
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
}

function handleFullscreenError(err) {
  console.warn('Fullscreen request blocked or not supported:', err);
  showToast('Mode layar penuh dibatasi oleh browser. Buka di tab mandiri.');
}

function updateFullscreenUI() {
  const active = isFullscreen();
  state.fullscreen = active;

  const icons = ['icon-fullscreen-off', 'icon-fullscreen-taskbar'];
  icons.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.setAttribute('data-lucide', active ? 'minimize' : 'maximize');
    }
  });

  const offBtn = document.getElementById('btn-fullscreen-off');
  if (offBtn) {
    const span = offBtn.querySelector('span');
    if (span) span.innerText = active ? 'Keluar Layar Penuh' : 'Layar Penuh';
  }

  if (window.lucide) window.lucide.createIcons();
}

// Sistem Orientasi Layar (Landscape Guide)
let orientationDismissed = false;

function checkOrientation() {
  const isPortrait = window.innerHeight > window.innerWidth;
  const isSmallScreen = window.innerWidth <= 850 || window.innerHeight <= 600;
  const promptEl = document.getElementById('orientation-prompt');
  
  if (!promptEl) return;
  
  if (isPortrait && isSmallScreen && !orientationDismissed) {
    promptEl.classList.remove('hidden');
    promptEl.classList.add('flex');
    if (window.lucide) window.lucide.createIcons();
  } else {
    promptEl.classList.add('hidden');
    promptEl.classList.remove('flex');
  }

  // Perbarui ukuran jendela aktif jika ukuran layar berubah
  if (typeof appStates !== 'undefined' && typeof getAllPossibleWindowClasses === 'function') {
    Object.keys(appStates).forEach(appId => {
      if (appStates[appId].open && !appStates[appId].minimized) {
        const appEl = document.getElementById(`app-${appId}`);
        if (appEl) {
          const isMax = appStates[appId].maximized;
          appEl.classList.remove(...getAllPossibleWindowClasses());
          appEl.classList.add(...getWindowClasses(isMax));
        }
      }
    });
  }
}

function dismissOrientationPrompt() {
  orientationDismissed = true;
  const promptEl = document.getElementById('orientation-prompt');
  if (promptEl) {
    promptEl.classList.add('hidden');
    promptEl.classList.remove('flex');
  }
  showToast('Melanjutkan dalam mode Portrait');
}

async function requestLandscapeLock() {
  playSound('click');
  try {
    if (!isFullscreen()) {
      const doc = document.documentElement;
      if (doc.requestFullscreen) await doc.requestFullscreen().catch(() => {});
      else if (doc.webkitRequestFullscreen) await doc.webkitRequestFullscreen();
    }
    
    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock('landscape');
      dismissOrientationPrompt();
      showToast('Orientasi terkunci ke Landscape');
    } else {
      dismissOrientationPrompt();
      showToast('Silakan putar perangkat Anda ke posisi mendatar');
    }
  } catch (err) {
    dismissOrientationPrompt();
    showToast('Silakan putar smartphone Anda secara manual');
  }
}

window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', checkOrientation);
['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
  document.addEventListener(evt, updateFullscreenUI);
});


// Global Bridge Export for Config & State
if (typeof window !== 'undefined') {
  window.state = state;
  window.appRegistry = appRegistry;
  window.appStates = appStates;
  window.playSound = playSound;
  window.showToast = showToast;
  window.toggleFullscreen = toggleFullscreen;
  window.isFullscreen = isFullscreen;
}
if (typeof globalThis !== 'undefined') {
  globalThis.state = state;
  globalThis.appRegistry = appRegistry;
  globalThis.appStates = appStates;
  globalThis.playSound = playSound;
  globalThis.showToast = showToast;
  globalThis.toggleFullscreen = toggleFullscreen;
  globalThis.isFullscreen = isFullscreen;
}
