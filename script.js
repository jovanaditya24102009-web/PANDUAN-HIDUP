/**
 * Ultimate Life OS v3.0 - Advanced Script
 * Features: Navigation, Real-time Routine Tracker, Habit Analytics,
 * Pomodoro Focus Timer, Search Filter, Data Backup/Restore.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- INITIALIZATION ---
    initNavigation();
    initMobileSidebar();
    initHabitTracker();
    initCurrentActivityNotifier();
    initPomodoroTimer();
    initGlobalSearch();
});

/* ==========================================================================
   1. SINGLE PAGE APPLICATION (SPA) NAVIGATION & PAGE ANIMATIONS
   ========================================================================== */
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pageSections = document.querySelectorAll('.page-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            if (!targetId) return;

            // Update Active Link State
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Switch Active Section with Smooth Fade
            pageSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId) {
                    section.classList.add('active');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });

            // Auto Close Mobile Sidebar on selection
            const sidebar = document.getElementById('sidebar');
            if (window.innerWidth <= 900 && sidebar) {
                sidebar.classList.remove('active');
            }
        });
    });
}

/* ==========================================================================
   2. MOBILE SIDEBAR TOGGLE
   ========================================================================== */
function initMobileSidebar() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('active');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 900 && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });
    }
}

/* ==========================================================================
   3. ADVANCED HABIT TRACKER (WITH PROGRESS BAR & LOCALSTORAGE)
   ========================================================================== */
function initHabitTracker() {
    const checkboxes = document.querySelectorAll('.habit-checkbox');
    const resetButton = document.getElementById('resetHabits');
    const trackerSection = document.getElementById('tracker');

    if (!checkboxes.length) return;

    // Dynamically Inject Analytics Card if not exists
    if (trackerSection && !document.getElementById('habitAnalyticsCard')) {
        const analyticsHtml = `
            <div class="card" id="habitAnalyticsCard" style="margin-bottom: 20px;">
                <div class="card-header">
                    <i class="fa-solid fa-chart-pie"></i>
                    <h3>Progress Kebiasaan Hari Ini</h3>
                </div>
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
                    <div style="flex-grow: 1; background: var(--bg-primary); height: 14px; border-radius: 10px; overflow: hidden; border: 1px solid var(--border-color);">
                        <div id="habitProgressBar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #38bdf8, #22c55e); transition: width 0.4s ease;"></div>
                    </div>
                    <span id="habitPercentText" style="font-weight: 800; font-size: 16px; color: var(--accent-color); min-width: 45px;">0%</span>
                </div>
                <p id="habitSummaryText" style="font-size: 13px; color: var(--text-secondary);">Selesaikan semua target harianmu untuk menjaga konsistensi!</p>
            </div>
        `;
        const habitCard = trackerSection.querySelector('.card');
        if (habitCard) {
            habitCard.insertAdjacentHTML('beforebegin', analyticsHtml);
        }
    }

    // Load Saved States & Update UI
    function updateProgress() {
        let completedCount = 0;
        checkboxes.forEach(box => {
            if (box.checked) completedCount++;
        });

        const total = checkboxes.length;
        const percentage = Math.round((completedCount / total) * 100);

        const progressBar = document.getElementById('habitProgressBar');
        const percentText = document.getElementById('habitPercentText');
        const summaryText = document.getElementById('habitSummaryText');

        if (progressBar) progressBar.style.width = `${percentage}%`;
        if (percentText) percentText.textContent = `${percentage}%`;
        if (summaryText) {
            if (percentage === 100) {
                summaryText.textContent = "🔥 Luar biasa! Semua habit harian telah tuntas dieksekusi!";
                summaryText.style.color = "var(--success-color)";
            } else if (percentage >= 50) {
                summaryText.textContent = "⚡ Bagus! Kamu sudah menyelesaikan lebih dari separuh target hari ini.";
                summaryText.style.color = "var(--accent-color)";
            } else {
                summaryText.textContent = "Selesaikan semua target harianmu untuk menjaga konsistensi!";
                summaryText.style.color = "var(--text-secondary)";
            }
        }
    }

    checkboxes.forEach(box => {
        const savedState = localStorage.getItem(box.id);
        if (savedState === 'true') {
            box.checked = true;
            box.closest('.habit-item').classList.add('completed');
        }

        box.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            localStorage.setItem(e.target.id, isChecked);
            
            if (isChecked) {
                e.target.closest('.habit-item').classList.add('completed');
            } else {
                e.target.closest('.habit-item').classList.remove('completed');
            }
            updateProgress();
        });
    });

    updateProgress();

    // Reset Tracker
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            if (confirm('Apakah kamu yakin ingin mereset checklist kebiasaan hari ini?')) {
                checkboxes.forEach(box => {
                    box.checked = false;
                    localStorage.removeItem(box.id);
                    box.closest('.habit-item').classList.remove('completed');
                });
                updateProgress();
            }
        });
    }
}

/* ==========================================================================
   4. REAL-TIME ACTIVITY NOTIFIER (BERDASARKAN JAM SISTEM SEKARANG)
   ========================================================================== */
function initCurrentActivityNotifier() {
    const dashboard = document.getElementById('dashboard');
    if (!dashboard) return;

    const bannerHtml = `
        <div class="card" id="realtimeActivityCard" style="border-left: 4px solid var(--accent-color); margin-bottom: 24px;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                <div>
                    <span class="badge badge-accent" id="liveClockBadge">LIVE CLOCK</span>
                    <h3 id="currentActivityTitle" style="font-size: 18px; margin-top: 6px;">Status Rutinitas Saat Ini</h3>
                    <p id="currentActivityDesc" style="font-size: 13px; color: var(--text-secondary);">Mengecek jadwal harian...</p>
                </div>
                <div style="text-align: right;">
                    <span id="digitalClock" style="font-size: 24px; font-weight: 800; font-family: monospace; color: var(--accent-color);">00:00:00</span>
                </div>
            </div>
        </div>
    `;

    const firstGrid = dashboard.querySelector('.grid-2');
    if (firstGrid) {
        firstGrid.insertAdjacentHTML('beforebegin', bannerHtml);
    }

    function updateLiveStatus() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const currentTimeVal = now.getHours() * 60 + now.getMinutes();

        const clockEl = document.getElementById('digitalClock');
        if (clockEl) clockEl.textContent = `${hours}:${minutes}:${seconds}`;

        const titleEl = document.getElementById('currentActivityTitle');
        const descEl = document.getElementById('currentActivityDesc');
        if (!titleEl || !descEl) return;

        // Routine Logic (Minutes from 00:00)
        if (currentTimeVal >= 300 && currentTimeVal < 315) { // 05.00 - 05.15
            titleEl.textContent = "🌅 Bangun Tidur & Hidrasi";
            descEl.textContent = "Minum 500ml air putih + stretching ringan.";
        } else if (currentTimeVal >= 315 && currentTimeVal < 330) { // 05.15 - 05.30
            titleEl.textContent = "✨ Morning Skincare & Masseter";
            descEl.textContent = "Gentle Cleanser + Moisturizer + Pijat Masseter Pagi.";
        } else if (currentTimeVal >= 330 && currentTimeVal < 420) { // 05.30 - 07.00
            titleEl.textContent = "🍳 Mandi, Sunscreen & Sarapan";
            descEl.textContent = "Sarapan tinggi protein, persiapkan perlengkapan sekolah.";
        } else if (currentTimeVal >= 420 && currentTimeVal < 945) { // 07.00 - 15.45
            titleEl.textContent = "📚 Sesi KBM / Sekolah";
            descEl.textContent = "Fokus materi di kelas. Jaga asupan air putih teratur.";
        } else if (currentTimeVal >= 975 && currentTimeVal < 1080) { // 16.15 - 18.00
            titleEl.textContent = "🏋️ Sesi Gym / Active Recovery";
            descEl.textContent = "Eksekusi target workout hari ini secara maksimal!";
        } else if (currentTimeVal >= 1110 && currentTimeVal < 1155) { // 18.30 - 19.15
            titleEl.textContent = "🍱 Makan Malam Tinggi Protein";
            descEl.textContent = "Asupan nutrisi untuk pemulihan dan sintesis otot.";
        } else if (currentTimeVal >= 1155 && currentTimeVal < 1245) { // 19.15 - 20.45
            titleEl.textContent = "📖 Review Pelajaran & Belajar";
            descEl.textContent = "Antisipasi jadwal sekolah esok hari / Latihan Soal.";
        } else if (currentTimeVal >= 1245 && currentTimeVal < 1320) { // 20.45 - 22.00
            titleEl.textContent = "🌙 Night Routine & Masseter Relief";
            descEl.textContent = "Skincare malam, kompres hangat masseter, persiapan tidur.";
        } else {
            titleEl.textContent = "😴 Sesi Istirahat & Sleep Recovery";
            descEl.textContent = "Tubuh sedang dalam fase regenerasi sel dan pemulihan otot.";
        }
    }

    setInterval(updateLiveStatus, 1000);
    updateLiveStatus();
}

/* ==========================================================================
   5. POMODORO FOCUS TIMER FOR EVENING STUDY SESSION
   ========================================================================== */
function initPomodoroTimer() {
    const sekolahSection = document.getElementById('sekolah');
    if (!sekolahSection) return;

    const timerHtml = `
        <div class="card" style="margin-top: 24px; text-align: center;">
            <div class="card-header" style="justify-content: center;">
                <i class="fa-solid fa-stopwatch"></i>
                <h3>Focus Study Timer (Pomodoro)</h3>
            </div>
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">Gunakan timer ini saat melakukan review pelajaran malam hari.</p>
            <div id="pomodoroDisplay" style="font-size: 48px; font-weight: 800; font-family: monospace; color: var(--accent-color); margin-bottom: 16px;">25:00</div>
            <div style="display: flex; justify-content: center; gap: 12px;">
                <button id="startTimerBtn" class="btn-reset" style="background: rgba(34, 197, 94, 0.2); color: var(--success-color); border-color: var(--success-color);">Start</button>
                <button id="pauseTimerBtn" class="btn-reset" style="background: rgba(234, 179, 8, 0.2); color: var(--warning-color); border-color: var(--warning-color);">Pause</button>
                <button id="resetTimerBtn" class="btn-reset">Reset</button>
            </div>
        </div>
    `;

    sekolahSection.insertAdjacentHTML('beforeend', timerHtml);

    let timeLeft = 25 * 60;
    let timerInterval = null;

    const display = document.getElementById('pomodoroDisplay');
    const startBtn = document.getElementById('startTimerBtn');
    const pauseBtn = document.getElementById('pauseTimerBtn');
    const resetBtn = document.getElementById('resetTimerBtn');

    function updateTimerDisplay() {
        const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
        const secs = String(timeLeft % 60).padStart(2, '0');
        if (display) display.textContent = `${mins}:${secs}`;
    }

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (timerInterval) return;
            timerInterval = setInterval(() => {
                if (timeLeft > 0) {
                    timeLeft--;
                    updateTimerDisplay();
                } else {
                    clearInterval(timerInterval);
                    timerInterval = null;
                    alert('🔔 Sesi Belajar Selesai! Istirahatlah selama 5 menit.');
                }
            }, 1000);
        });
    }

    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            clearInterval(timerInterval);
            timerInterval = null;
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            clearInterval(timerInterval);
            timerInterval = null;
            timeLeft = 25 * 60;
            updateTimerDisplay();
        });
    }
}

/* ==========================================================================
   6. QUICK SEARCH / FILTER ON TABLES AND LISTS
   ========================================================================== */
function initGlobalSearch() {
    const sekolahSection = document.getElementById('sekolah');
    if (!sekolahSection) return;

    const table = sekolahSection.querySelector('table');
    if (!table) return;

    const searchInputHtml = `
        <div style="margin-bottom: 16px;">
            <input type="text" id="scheduleSearchInput" placeholder="🔍 Cari mata pelajaran, guru, atau hari..." 
                style="width: 100%; padding: 12px 16px; border-radius: 10px; background: var(--bg-primary); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 14px; outline: none;">
        </div>
    `;

    table.insertAdjacentHTML('beforebegin', searchInputHtml);

    const input = document.getElementById('scheduleSearchInput');
    input.addEventListener('keyup', () => {
        const filter = input.value.toLowerCase();
        const rows = table.querySelectorAll('tbody tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(filter)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}
