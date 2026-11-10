let hardwareState = {
  pcPower: false,
  monitorPower: false,
  capsLock: false,
  numLock: true,
  dvdOpen: false
};

/**
 * EduOS - Hardware Simulation & Boot Engine Module
 * Mengontrol interaksi fisik PC, monitor, siklus daya, POST motherboard, BIOS CMOS, dan OS booting
 */

// LOGIKA DAYA PC, MONITOR & SIKLUS BOOTING EDUOS
    // ==============================================
    let monitorTimeout = null;
    let postTimeout = null;
    let bootInterval = null;

    function toggleMonitor() {
      playSound('click');
      hardwareState.monitorPower = !hardwareState.monitorPower;
      const led = document.getElementById('monitor-led');
      const noSignal = document.getElementById('no-signal');
      const standbyHint = document.getElementById('monitor-standby-hint');

      clearTimeout(monitorTimeout);

      if (!hardwareState.monitorPower) {
        // Monitor DIMATIKAN
        if (led) led.className = 'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-800 transition-all duration-300';
        if (noSignal) noSignal.classList.add('hidden');
        if (standbyHint) standbyHint.classList.add('hidden');

        if (hardwareState.pcPower) {
          // Jika PC sedang hidup tapi monitor dimatikan, sembunyikan layar kerja dan kembalikan ke screen-off
          hideAllMainScreens();
          document.getElementById('screen-off').classList.remove('hidden');
          showToast('Layar monitor dimatikan. CPU tetap berjalan di latar belakang.');
        }
      } else {
        // Monitor DINYALAKAN
        if (!hardwareState.pcPower) {
          // PC masih mati -> Layar menyala No Signal lalu Standby
          if (led) led.className = 'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] transition-all duration-300';
          if (noSignal) noSignal.classList.remove('hidden');
          if (standbyHint) standbyHint.classList.add('hidden');

          monitorTimeout = setTimeout(() => {
            if (!hardwareState.pcPower && hardwareState.monitorPower) {
              if (noSignal) noSignal.classList.add('hidden');
              if (standbyHint) standbyHint.classList.remove('hidden');
            }
          }, 2500);
        } else {
          // PC sudah menyala -> LED monitor biru & tampilkan sistem
          if (led) led.className = 'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-all duration-300';
          if (noSignal) noSignal.classList.add('hidden');
          if (standbyHint) standbyHint.classList.add('hidden');

          if (state.system === 'desktop') {
            hideAllMainScreens();
            document.getElementById('screen-desktop').classList.remove('hidden');
            document.getElementById('screen-desktop').classList.add('flex');
          } else if (state.system === 'booting') {
            hideAllMainScreens();
            document.getElementById('screen-booting').classList.remove('hidden');
            document.getElementById('screen-booting').classList.add('flex');
          } else if (state.system === 'post') {
            hideAllMainScreens();
            document.getElementById('screen-post').classList.remove('hidden');
            document.getElementById('screen-post').classList.add('flex');
          } else if (state.system === 'bios') {
            hideAllMainScreens();
            document.getElementById('screen-bios').classList.remove('hidden');
            document.getElementById('screen-bios').classList.add('flex');
          } else {
            startPostSequence();
          }
        }
      }
    }

    function powerOn() {
      if (hardwareState.pcPower) {
        if (state.system === 'desktop') {
          showToast('PC sudah menyala. Gunakan Start Menu untuk mematikan atau me-restart komputer.');
        }
        return;
      }

      hardwareState.pcPower = true;
      playSound('boot');

      // Perbarui visual CPU Tower
      const cpuIcon = document.getElementById('icon-power-cpu');
      const cpuRing = document.getElementById('cpu-led-ring');
      const hddLed = document.getElementById('hdd-led');

      if (cpuIcon) cpuIcon.className = 'w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-emerald-400 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.8)]';
      if (cpuRing) cpuRing.classList.remove('hidden');
      if (hddLed) hddLed.className = 'w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.8)] animate-pulse';

      // Cek apakah monitor sudah dalam kondisi menyala
      if (!hardwareState.monitorPower) {
        // Otomatis nyalakan monitor atau beri tahu siswa
        showToast('💡 CPU menyala! Menghubungkan ke monitor...');
        setTimeout(() => {
          if (!hardwareState.monitorPower) toggleMonitor();
          else startPostSequence();
        }, 600);
      } else {
        const monLed = document.getElementById('monitor-led');
        if (monLed) monLed.className = 'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-all duration-300';
        const noSig = document.getElementById('no-signal');
        if (noSig) noSig.classList.add('hidden');
        startPostSequence();
      }
    }

    function triggerHardwareReset() {
      if (!hardwareState.pcPower) {
        showToast('Nyalakan komputer terlebih dahulu dengan tombol Power.');
        return;
      }
      playSound('click');
      playSound('beep');
      showToast('🔄 Tombol Reset ditekan: Me-reboot perangkat keras...');

      clearInterval(bootInterval);
      clearTimeout(postTimeout);

      // Tutup semua aplikasi jika ada
      Object.keys(appStates).forEach(id => {
        if (appStates[id].open) closeApp(id);
      });

      startPostSequence();
    }

    function hideAllMainScreens() {
      ['screen-off', 'screen-post', 'screen-bios', 'screen-booting', 'screen-desktop'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.classList.add('hidden');
          el.classList.remove('flex');
        }
      });
    }

    // ==============================================
    // 2. SIMULASI POST (POWER-ON SELF-TEST)
    // ==============================================
    function startPostSequence() {
      state.system = 'post';
      playSound('beep');

      hideAllMainScreens();
      const postEl = document.getElementById('screen-post');
      if (postEl) {
        postEl.classList.remove('hidden');
        postEl.classList.add('flex');
      }

      // Animasi counter pengujian RAM POST
      let ram = 1024;
      const ramEl = document.getElementById('post-ram-counter');
      const ramInterval = setInterval(() => {
        ram += 1024;
        if (ram >= 8192) {
          ram = 8192;
          clearInterval(ramInterval);
        }
        if (ramEl) ramEl.innerText = ram + 'MB';
      }, 150);

      // Otomatis lanjut ke boot setelah 3.2 detik jika BIOS tidak ditekan
      clearTimeout(postTimeout);
      postTimeout = setTimeout(() => {
        if (state.system === 'post') {
          startEduOSBoot();
        }
      }, 3200);

      if (window.lucide) window.lucide.createIcons();
    }

    function skipToBooting() {
      clearTimeout(postTimeout);
      playSound('click');
      startEduOSBoot();
    }

    // ==============================================
    // 3. SIMULASI BIOS SETUP EDUKATIF
    // ==============================================
    let currentBiosTab = 'main';

    function enterBiosSetup() {
      clearTimeout(postTimeout);
      state.system = 'bios';
      playSound('click');

      hideAllMainScreens();
      const biosEl = document.getElementById('screen-bios');
      if (biosEl) {
        biosEl.classList.remove('hidden');
        biosEl.classList.add('flex');
      }

      switchBiosTab('main');
      if (window.lucide) window.lucide.createIcons();
    }

    function switchBiosTab(tabName) {
      playSound('click');
      currentBiosTab = tabName;

      ['main', 'advanced', 'boot', 'exit'].forEach(t => {
        const btn = document.getElementById(`bios-tab-${t}`);
        if (btn) {
          if (t === tabName) {
            btn.className = 'px-2 py-0.5 bg-white text-[#0000aa] font-bold cursor-pointer';
          } else {
            btn.className = 'px-2 py-0.5 hover:bg-white/30 text-white font-bold cursor-pointer';
          }
        }
      });

      const area = document.getElementById('bios-content-area');
      const help = document.getElementById('bios-help-text');
      if (!area) return;

      if (tabName === 'main') {
        area.innerHTML = `
          <div class="text-yellow-300 font-bold border-b border-white/30 pb-1 mb-2">Informasi Sistem Perangkat Keras:</div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <span class="text-slate-300">BIOS Version:</span><span>EduBIOS v2.4 Release (09/2026)</span>
            <span class="text-slate-300">Processor:</span><span>Intel(R) Core(TM) i5-11400 @ 2.60GHz</span>
            <span class="text-slate-300">Total Memory:</span><span>8192 MB DDR4 (Dual Channel 3200 MHz)</span>
            <span class="text-slate-300">Primary Drive:</span><span>EduSSD NVMe M.2 256 GB</span>
            <span class="text-slate-300">CPU Temperature:</span><span class="text-emerald-300">41°C / 105°F (Normal)</span>
            <span class="text-slate-300">CPU Fan Speed:</span><span>1820 RPM (Optimal)</span>
          </div>
        `;
        if (help) help.innerText = 'Tab [Main] menampilkan ringkasan spesifikasi fisik komputer: prosesor (CPU), memori kerja (RAM), media penyimpanan, serta temperatur dan kecepatan kipas pendingin.';
      } else if (tabName === 'advanced') {
        area.innerHTML = `
          <div class="text-yellow-300 font-bold border-b border-white/30 pb-1 mb-2">Konfigurasi Lanjutan (Advanced Hardware):</div>
          <div class="flex flex-col gap-2 text-xs">
            <div class="flex justify-between border-b border-white/20 pb-1"><span>Intel Virtualization Technology (VT-x):</span><span class="text-emerald-300 font-bold">[Enabled]</span></div>
            <div class="flex justify-between border-b border-white/20 pb-1"><span>SATA / NVMe Controller Mode:</span><span class="font-bold">[AHCI / NVMe Mode]</span></div>
            <div class="flex justify-between border-b border-white/20 pb-1"><span>Internal Graphics Share Memory:</span><span>[512 MB]</span></div>
            <div class="flex justify-between border-b border-white/20 pb-1"><span>Power On After Power Failure:</span><span>[Stay Off]</span></div>
          </div>
        `;
        if (help) help.innerText = 'Tab [Advanced] digunakan untuk menyetel fitur spesifik chip motherboard, seperti akselerasi virtualisasi prosesor dan mode pengontrol harddisk.';
      } else if (tabName === 'boot') {
        area.innerHTML = `
          <div class="text-yellow-300 font-bold border-b border-white/30 pb-1 mb-2">Urutan Prioritas Booting (Boot Order):</div>
          <div class="flex flex-col gap-2 text-xs">
            <div class="p-2 bg-[#000088] border border-white/40 flex justify-between items-center">
              <span>Boot Option #1 (Prioritas Utama):</span>
              <span class="text-yellow-300 font-bold">EduSSD 256GB (EduOS Partition)</span>
            </div>
            <div class="p-2 bg-[#000088] border border-white/20 flex justify-between items-center text-slate-300">
              <span>Boot Option #2:</span>
              <span>USB Flash Drive (Removable Media)</span>
            </div>
            <div class="p-2 bg-[#000088] border border-white/20 flex justify-between items-center text-slate-300">
              <span>Boot Option #3:</span>
              <span>Optical Drive (DVD-RW)</span>
            </div>
          </div>
        `;
        if (help) help.innerText = 'Tab [Boot Order] menentukan urutan perangkat yang dibaca BIOS saat mencari sistem operasi. Di sini SSD dipasang sebagai pilihan pertama agar EduOS langsung termuat.';
      } else if (tabName === 'exit') {
        area.innerHTML = `
          <div class="text-yellow-300 font-bold border-b border-white/30 pb-1 mb-2">Keluar & Booting:</div>
          <div class="flex flex-col gap-2 text-xs">
            <button onclick="exitBiosAndBoot()" class="p-2 text-left bg-white text-[#0000aa] font-bold hover:bg-yellow-300 cursor-pointer">
              ► Simpan Perubahan dan Jalankan EduOS (Save & Boot)
            </button>
            <button onclick="exitBiosAndBoot()" class="p-2 text-left hover:bg-white/20 cursor-pointer">
              ► Keluar Tanpa Menyimpan Perubahan (Discard & Exit)
            </button>
          </div>
        `;
        if (help) help.innerText = 'Pilih [Save & Boot] untuk menyelesaikan pemeriksaan BIOS dan melanjutkan proses booting ke sistem operasi EduOS.';
      }
    }

    function exitBiosAndBoot() {
      playSound('click');
      startEduOSBoot();
    }

    // ==============================================
    // 4. PROSES BOOTING EDUOS & TRANSISI KE DESKTOP
    // ==============================================
    function startEduOSBoot() {
      state.system = 'booting';

      hideAllMainScreens();
      const bootEl = document.getElementById('screen-booting');
      if (bootEl) {
        bootEl.classList.remove('hidden');
        bootEl.classList.add('flex');
      }

      let progress = 0;
      const bar = document.getElementById('boot-progress');
      const text = document.getElementById('boot-text');
      const hddLed = document.getElementById('hdd-led');

      const log1 = document.getElementById('boot-log-1');
      const log2 = document.getElementById('boot-log-2');
      const log3 = document.getElementById('boot-log-3');
      const log4 = document.getElementById('boot-log-4');

      if (bar) bar.style.width = '0%';
      if (text) text.innerText = 'Memulai sistem EduOS... 0%';

      clearInterval(bootInterval);
      bootInterval = setInterval(() => {
        progress += Math.floor(Math.random() * 12) + 8;

        // Simulasi aktivitas kedip lampu HDD/SSD saat membaca file sistem
        if (hddLed) {
          hddLed.className = (progress % 2 === 0) 
            ? 'w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]' 
            : 'w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-800';
        }

        if (progress >= 30 && log2) {
          log2.classList.remove('hidden');
          log2.className = 'text-emerald-400 flex items-center gap-1.5';
          log2.innerHTML = '<i data-lucide="check" class="w-3 h-3"></i> [ OK ] Kernel EduOS v2.5 Termuat';
        }
        if (progress >= 60 && log3) {
          log3.classList.remove('hidden');
          log3.className = 'text-emerald-400 flex items-center gap-1.5';
          log3.innerHTML = '<i data-lucide="check" class="w-3 h-3"></i> [ OK ] Sistem Berkas EduFS Siap';
        }
        if (progress >= 85 && log4) {
          log4.classList.remove('hidden');
          log4.className = 'text-emerald-400 flex items-center gap-1.5';
          log4.innerHTML = '<i data-lucide="check" class="w-3 h-3"></i> [ OK ] Modul Desktop Siap';
        }

        if (progress >= 100) {
          progress = 100;
          clearInterval(bootInterval);
          if (hddLed) hddLed.className = 'w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-800';

          setTimeout(() => {
            playSound('boot');
            hideAllMainScreens();

            const desktopEl = document.getElementById('screen-desktop');
            if (desktopEl) {
              desktopEl.classList.remove('hidden');
              desktopEl.classList.add('flex');
            }

            state.system = 'desktop';

            if (state.tutorialStep === 0) {
              state.tutorialStep = 1;
              const tutDesktop = document.getElementById('tutorial-desktop');
              if (tutDesktop) tutDesktop.classList.remove('hidden');
            }

            checkOrientation();
            updateTaskbarUI();
            if (window.lucide) window.lucide.createIcons();
          }, 450);
        }

        if (bar) bar.style.width = progress + '%';
        if (text) text.innerText = `Memuat file sistem... ${progress}%`;
        if (window.lucide) window.lucide.createIcons();
      }, 200);
    }

    function powerOff() {
      playSound('click');
      toggleStartMenu(false);

      // Tutup semua aplikasi yang sedang terbuka
      Object.keys(appStates).forEach(id => {
        if (appStates[id].open) closeApp(id);
      });

      clearInterval(bootInterval);
      clearTimeout(postTimeout);
      clearTimeout(monitorTimeout);

      hardwareState.pcPower = false;
      state.system = 'off';

      hideAllMainScreens();
      const offEl = document.getElementById('screen-off');
      if (offEl) {
        offEl.classList.remove('hidden');
        offEl.classList.add('flex');
      }

      // Reset visual CPU & Monitor
      const cpuIcon = document.getElementById('icon-power-cpu');
      const cpuRing = document.getElementById('cpu-led-ring');
      const hddLed = document.getElementById('hdd-led');
      const monLed = document.getElementById('monitor-led');
      const noSignal = document.getElementById('no-signal');
      const standbyHint = document.getElementById('monitor-standby-hint');

      if (cpuIcon) cpuIcon.className = 'w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-red-500 group-hover:text-emerald-400 transition-colors';
      if (cpuRing) cpuRing.classList.add('hidden');
      if (hddLed) hddLed.className = 'w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-800';

      if (hardwareState.monitorPower) {
        // Jika monitor masih hidup saat PC dimatikan, masuk mode standby (LED oranye)
        if (monLed) monLed.className = 'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] transition-all duration-300';
        if (noSignal) noSignal.classList.remove('hidden');
        monitorTimeout = setTimeout(() => {
          if (!hardwareState.pcPower && hardwareState.monitorPower) {
            if (noSignal) noSignal.classList.add('hidden');
            if (standbyHint) standbyHint.classList.remove('hidden');
          }
        }, 2000);
      } else {
        if (monLed) monLed.className = 'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-800';
      }

      const bar = document.getElementById('boot-progress');
      if (bar) bar.style.width = '0%';
      state.tutorialStep = 0;
      const tutOff = document.getElementById('tutorial-off');
      if (tutOff) tutOff.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    }

    


// ==============================================
// KEYBOARD & MOUSE INTERACTION SIMULATOR
// ==============================================
function populateKeyboard() {
  const kb = document.getElementById('keyboard-keys');
  if (!kb) return;

  const layout = [
    [{t: 'Esc', w: 'w-4 sm:w-6'}, {t: 'F1', w: 'w-3 sm:w-[22px]'}, {t: 'F2', w: 'w-3 sm:w-[22px]'}, {t: 'F3', w: 'w-3 sm:w-[22px]'}, {t: 'F4', w: 'w-3 sm:w-[22px]'}, {t: 'F5', w: 'w-3 sm:w-[22px]'}, {t: 'F6', w: 'w-3 sm:w-[22px]'}, {t: 'F7', w: 'w-3 sm:w-[22px]'}, {t: 'F8', w: 'w-3 sm:w-[22px]'}, {t: 'F9', w: 'w-3 sm:w-[22px]'}, {t: 'F10', w: 'w-3 sm:w-[22px]'}, {t: 'F11', w: 'w-3 sm:w-[22px]'}, {t: 'F12', w: 'w-3 sm:w-[22px]'}, {t: 'Del', w: 'w-4 sm:w-7'}],
    [{t: '~', w: 'w-3 sm:w-6'}, {t: '1', w: 'w-3 sm:w-6'}, {t: '2', w: 'w-3 sm:w-6'}, {t: '3', w: 'w-3 sm:w-6'}, {t: '4', w: 'w-3 sm:w-6'}, {t: '5', w: 'w-3 sm:w-6'}, {t: '6', w: 'w-3 sm:w-6'}, {t: '7', w: 'w-3 sm:w-6'}, {t: '8', w: 'w-3 sm:w-6'}, {t: '9', w: 'w-3 sm:w-6'}, {t: '0', w: 'w-3 sm:w-6'}, {t: '-', w: 'w-3 sm:w-6'}, {t: '=', w: 'w-3 sm:w-6'}, {t: '←', w: 'w-6 sm:w-10'}],
    [{t: 'Tab', w: 'w-5 sm:w-8'}, {t: 'Q', w: 'w-3 sm:w-6'}, {t: 'W', w: 'w-3 sm:w-6'}, {t: 'E', w: 'w-3 sm:w-6'}, {t: 'R', w: 'w-3 sm:w-6'}, {t: 'T', w: 'w-3 sm:w-6'}, {t: 'Y', w: 'w-3 sm:w-6'}, {t: 'U', w: 'w-3 sm:w-6'}, {t: 'I', w: 'w-3 sm:w-6'}, {t: 'O', w: 'w-3 sm:w-6'}, {t: 'P', w: 'w-3 sm:w-6'}, {t: '[', w: 'w-3 sm:w-6'}, {t: ']', w: 'w-3 sm:w-6'}, {t: '\\', w: 'w-5 sm:w-8'}],
    [{t: 'Caps', w: 'w-6 sm:w-10'}, {t: 'A', w: 'w-3 sm:w-6'}, {t: 'S', w: 'w-3 sm:w-6'}, {t: 'D', w: 'w-3 sm:w-6'}, {t: 'F', w: 'w-3 sm:w-6'}, {t: 'G', w: 'w-3 sm:w-6'}, {t: 'H', w: 'w-3 sm:w-6'}, {t: 'J', w: 'w-3 sm:w-6'}, {t: 'K', w: 'w-3 sm:w-6'}, {t: 'L', w: 'w-3 sm:w-6'}, {t: ';', w: 'w-3 sm:w-6'}, {t: "'", w: 'w-3 sm:w-6'}, {t: 'Enter', w: 'w-7 sm:w-12'}],
    [{t: 'Shift', w: 'w-8 sm:w-14'}, {t: 'Z', w: 'w-3 sm:w-6'}, {t: 'X', w: 'w-3 sm:w-6'}, {t: 'C', w: 'w-3 sm:w-6'}, {t: 'V', w: 'w-3 sm:w-6'}, {t: 'B', w: 'w-3 sm:w-6'}, {t: 'N', w: 'w-3 sm:w-6'}, {t: 'M', w: 'w-3 sm:w-6'}, {t: ',', w: 'w-3 sm:w-6'}, {t: '.', w: 'w-3 sm:w-6'}, {t: '/', w: 'w-3 sm:w-6'}, {t: 'Shift', w: 'w-8 sm:w-14'}],
    [{t: 'Ctrl', w: 'w-5 sm:w-10'}, {t: 'Win', w: 'w-4 sm:w-8'}, {t: 'Alt', w: 'w-4 sm:w-8'}, {t: 'Space', w: 'w-24 sm:w-48'}, {t: 'Alt', w: 'w-4 sm:w-8'}, {t: 'Fn', w: 'w-4 sm:w-8'}, {t: 'Ctrl', w: 'w-5 sm:w-[42px]'}]
  ];

  let html = '';
  layout.forEach((row) => {
    html += '<div class="flex gap-[2px] sm:gap-[3px] justify-center">';
    row.forEach(key => {
      html += `<div onclick="onKeyPress('${key.t}')" class="h-3.5 sm:h-5 bg-slate-700 hover:bg-slate-600 active:scale-95 active:bg-blue-600 rounded-xs shadow-[0_1px_1px_rgba(0,0,0,0.5)] border border-slate-600 flex items-center justify-center text-[6px] sm:text-[8px] text-slate-300 active:text-white font-bold select-none cursor-pointer transition-all ${key.w}">${key.t}</div>`;
    });
    html += '</div>';
  });
  
  kb.innerHTML = html;
}

function onKeyPress(key) {
  playSound('type');

  if (key === 'Caps') {
    hardwareState.capsLock = !hardwareState.capsLock;
    const led = document.getElementById('kb-caps-led');
    if (led) {
      led.className = hardwareState.capsLock 
        ? 'w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.8)]' 
        : 'w-1.5 h-1.5 rounded-full bg-slate-700';
    }
    showToast(hardwareState.capsLock ? 'Caps Lock: AKTIF' : 'Caps Lock: NONAKTIF');
  } else if (key === 'F2' || key === 'Del') {
    if (state.system === 'post') enterBiosSetup();
  } else if (key === 'Enter') {
    if (state.system === 'post') skipToBooting();
  } else if (key === 'F10') {
    if (state.system === 'bios') exitBiosAndBoot();
  }
}

// Tangkap ketukan keyboard fisik pengguna saat di layar hardware
window.addEventListener('keydown', (e) => {
  if (state.system === 'off') {
    playSound('type');
  } else if (state.system === 'post') {
    if (e.key === 'F2' || e.key === 'Delete') {
      e.preventDefault();
      enterBiosSetup();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      skipToBooting();
    }
  } else if (state.system === 'bios') {
    if (e.key === 'F10') {
      e.preventDefault();
      exitBiosAndBoot();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      exitBiosAndBoot();
    }
  }
});

function onMouseClick(btn) {
  playSound('click');
  if (btn === 'right') {
    showToast('🖱️ Klik Kanan Mouse Berfungsi (Secondary Action)');
  } else {
    showToast('🖱️ Klik Kiri Mouse Berfungsi (Primary Action)');
  }
}

function ejectDvdDrive() {
  playSound('click');
  hardwareState.dvdOpen = !hardwareState.dvdOpen;
  showToast(hardwareState.dvdOpen 
    ? '💿 Baki DVD-RW Terbuka (Optical Disc Drive)' 
    : '💿 Baki DVD-RW Tertutup');
}
