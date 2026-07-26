/**
 * ============================================================================
 * EXECUTIVE LIFE OS v3.5 - ULTRA COMPLEX JAVASCRIPT CORE ENGINE
 * Designed & Engineered for High Performance, iOS/iPhone Optimization,
 * State Persistence, Live Analytics, and Multi-Module Management.
 * ============================================================================
 */

'use strict';

// Global Application State Namespace
const LifeOS = {
    version: '3.5.0-PRO',
    author: 'System Executive',
    initializedAt: new Date(),
    activeSection: 'dashboard',
    
    // Core Configuration
    config: {
        storageKeyPrefix: 'LIFE_OS_3_5_',
        clockUpdateIntervalMs: 1000,
        pomodoroDefaultFocusSec: 25 * 60,
        pomodoroDefaultBreakSec: 5 * 60,
        autoSaveDebounceMs: 300,
        enableAudioAlerts: true,
        enableHapticFeedback: true
    },

    // Dynamic State Database
    state: {
        currentTime: new Date(),
        activeScheduleItem: null,
        nextScheduleItem: null,
        habits: {},
        habitHistory: {},
        workoutLogs: {},
        skincareLogs: {},
        pomodoro: {
            mode: 'FOCUS', // 'FOCUS' or 'BREAK'
            timeLeft: 25 * 60,
            isRunning: false,
            intervalId: null,
            totalCompletedSessions: 0
        },
        searchQuery: '',
        sidebarOpen: false
    },

    // Audio Synthetic Beeps Engine (Web Audio API)
    audioCtx: null
};

/* ============================================================================
   1. UTILITY FUNCTIONS & HELPERS
   ============================================================================ */

const Utils = {
    /**
     * Formatting Date Utilities
     */
    padZero(num, length = 2) {
        return String(num).padStart(length, '0');
    },

    formatTimeString(date) {
        const hours = Utils.padZero(date.getHours());
        const minutes = Utils.padZero(date.getMinutes());
        const seconds = Utils.padZero(date.getSeconds());
        return `${hours}:${minutes}:${seconds}`;
    },

    formatShortTime(date) {
        const hours = Utils.padZero(date.getHours());
        const minutes = Utils.padZero(date.getMinutes());
        return `${hours}:${minutes}`;
    },

    getDayNameIndonesian(dayIndex) {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        return days[dayIndex] || 'Minggu';
    },

    getDateKeyString(date = new Date()) {
        const year = date.getFullYear();
        const month = Utils.padZero(date.getMonth() + 1);
        const day = Utils.padZero(date.getDate());
        return `${year}-${month}-${day}`;
    },

    /**
     * LocalStorage Helper Functions with Error Handling & Serialization
     */
    saveToStorage(key, value) {
        try {
            const fullKey = LifeOS.config.storageKeyPrefix + key;
            const serialized = JSON.stringify(value);
            localStorage.setItem(fullKey, serialized);
            return true;
        } catch (error) {
            console.error(`[Storage Engine Error] Failed to save key "${key}":`, error);
            return false;
        }
    },

    getFromStorage(key, defaultValue = null) {
        try {
            const fullKey = LifeOS.config.storageKeyPrefix + key;
            const item = localStorage.getItem(fullKey);
            if (item === null) return defaultValue;
            return JSON.parse(item);
        } catch (error) {
            console.error(`[Storage Engine Error] Failed to parse key "${key}":`, error);
            return defaultValue;
        }
    },

    removeFromStorage(key) {
        try {
            const fullKey = LifeOS.config.storageKeyPrefix + key;
            localStorage.removeItem(fullKey);
            return true;
        } catch (error) {
            console.error(`[Storage Engine Error] Failed to remove key "${key}":`, error);
            return false;
        }
    },

    /**
     * iOS Device & Touch Detection Helpers
     */
    isIOS() {
        return [
            'iPad Simulator',
            'iPhone Simulator',
            'iPod Simulator',
            'iPad',
            'iPhone',
            'iPod'
        ].includes(navigator.platform)
        || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
    },

    triggerHapticFeedback() {
        if (LifeOS.config.enableHapticFeedback && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(15);
        }
    },

    /**
     * Web Audio API Synthesizer Sound Generator
     */
    playAudioBeep(freq = 880, type = 'sine', duration = 0.2) {
        if (!LifeOS.config.enableAudioAlerts) return;
        try {
            if (!LifeOS.audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                LifeOS.audioCtx = new AudioContext();
            }
            if (LifeOS.audioCtx.state === 'suspended') {
                LifeOS.audioCtx.resume();
            }
            const osc = LifeOS.audioCtx.createOscillator();
            const gain = LifeOS.audioCtx.createGain();
            
            osc.type = type;
            osc.frequency.setValueAtTime(freq, LifeOS.audioCtx.currentTime);
            gain.gain.setValueAtTime(0.1, LifeOS.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.00001, LifeOS.audioCtx.currentTime + duration);

            osc.connect(gain);
            gain.connect(LifeOS.audioCtx.destination);
            
            osc.start();
            osc.stop(LifeOS.audioCtx.currentTime + duration);
        } catch (e) {
            console.warn('[Audio Engine] Audio Context blocked or unsupported:', e);
        }
    }
};

/* ============================================================================
   2. APP INITIALIZATION & DOM ENGINE
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
    console.log(`[Life OS Engine] Booting Core Kernel Version ${LifeOS.version}...`);

    // Initialize Subsystems
    NavigationEngine.init();
    SidebarController.init();
    RealtimeClockEngine.init();
    ScheduleDatabaseEngine.init();
    HabitTrackerEngine.init();
    PomodoroEngine.init();
    WorkoutLoggerEngine.init();
    SkincareRegimenEngine.init();
    DataTransferEngine.init();
    TouchGestureEngine.init();

    console.log(`[Life OS Engine] All Core Modules Loaded Successfully.`);
});

/* ============================================================================
   3. NAVIGATION ENGINE (Single Page Application Router)
   ============================================================================ */

const NavigationEngine = {
    init() {
        this.navLinks = document.querySelectorAll('.nav-link');
        this.pageSections = document.querySelectorAll('.page-section');
        this.pageTitleHeader = document.getElementById('currentPageTitle');

        this.bindEvents();
        this.restoreActiveRoute();
    },

    bindEvents() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSectionId = link.getAttribute('data-target');
                if (targetSectionId) {
                    this.navigateTo(targetSectionId);
                    Utils.triggerHapticFeedback();
                }
            });
        });

        // Handle Browser History Back/Forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.target) {
                this.switchDOMSection(e.state.target, false);
            }
        });
    },

    navigateTo(sectionId, pushHistory = true) {
        if (!document.getElementById(sectionId)) {
            console.warn(`[Navigation] Target section "#${sectionId}" does not exist in DOM.`);
            return;
        }

        this.switchDOMSection(sectionId, pushHistory);
        SidebarController.close();
    },

    switchDOMSection(sectionId, pushHistory = true) {
        LifeOS.activeSection = sectionId;

        // Update Links UI State
        this.navLinks.forEach(link => {
            const isMatch = link.getAttribute('data-target') === sectionId;
            link.classList.toggle('active', isMatch);
            if (isMatch && this.pageTitleHeader) {
                const labelText = link.querySelector('span') ? link.querySelector('span').textContent : sectionId;
                this.pageTitleHeader.textContent = labelText;
            }
        });

        // Update Sections UI State
        this.pageSections.forEach(section => {
            const isMatch = section.id === sectionId;
            section.classList.toggle('active', isMatch);
        });

        // Save State
        Utils.saveToStorage('LAST_ACTIVE_SECTION', sectionId);

        if (pushHistory && window.history) {
            window.history.pushState({ target: sectionId }, '', `#${sectionId}`);
        }

        // Scroll Top Smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    restoreActiveRoute() {
        const hash = window.location.hash.replace('#', '');
        const saved = Utils.getFromStorage('LAST_ACTIVE_SECTION', 'dashboard');
        const initialTarget = hash || saved;

        if (document.getElementById(initialTarget)) {
            this.navigateTo(initialTarget, false);
        } else {
            this.navigateTo('dashboard', false);
        }
    }
};

/* ============================================================================
   4. SIDEBAR CONTROLLER & MOBILE OVERLAY ENGINE
   ============================================================================ */

const SidebarController = {
    init() {
        this.sidebar = document.getElementById('sidebar');
        this.overlay = document.getElementById('sidebarOverlay');
        this.menuToggleBtn = document.getElementById('menuToggle');
        this.closeBtn = document.getElementById('closeSidebarBtn');
        this.floatingBtn = document.getElementById('floatingMenuBtn');

        this.bindEvents();
    },

    bindEvents() {
        if (this.menuToggleBtn) {
            this.menuToggleBtn.addEventListener('click', () => this.toggle());
        }
        if (this.floatingBtn) {
            this.floatingBtn.addEventListener('click', () => this.toggle());
        }
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.close());
        }

        // Close sidebar on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && LifeOS.state.sidebarOpen) {
                this.close();
            }
        });
    },

    open() {
        if (this.sidebar && this.overlay) {
            this.sidebar.classList.add('active');
            this.overlay.classList.add('active');
            LifeOS.state.sidebarOpen = true;
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
            Utils.triggerHapticFeedback();
        }
    },

    close() {
        if (this.sidebar && this.overlay) {
            this.sidebar.classList.remove('active');
            this.overlay.classList.remove('active');
            LifeOS.state.sidebarOpen = false;
            document.body.style.overflow = '';
        }
    },

    toggle() {
        if (LifeOS.state.sidebarOpen) {
            this.close();
        } else {
            this.open();
        }
    }
};

/* ============================================================================
   5. REALTIME CLOCK & DYNAMIC STATUS ENGINE
   ============================================================================ */

const RealtimeClockEngine = {
    init() {
        this.digitalClockEl = document.getElementById('digitalClock');
        this.miniClockEl = document.getElementById('miniClock');
        this.activityTitleEl = document.getElementById('currentActivityTitle');
        this.activityDescEl = document.getElementById('currentActivityDesc');

        this.startClockLoop();
    },

    startClockLoop() {
        const update = () => {
            LifeOS.state.currentTime = new Date();
            this.renderClockDisplay();
            this.evaluateCurrentActivity();
        };

        update();
        setInterval(update, LifeOS.config.clockUpdateIntervalMs);
    },

    renderClockDisplay() {
        const now = LifeOS.state.currentTime;
        const timeFormatted = Utils.formatTimeString(now);
        const shortTimeFormatted = Utils.formatShortTime(now);

        if (this.digitalClockEl) {
            this.digitalClockEl.textContent = timeFormatted;
        }
        if (this.miniClockEl) {
            this.miniClockEl.textContent = shortTimeFormatted;
        }
    },

    evaluateCurrentActivity() {
        if (!this.activityTitleEl || !this.activityDescEl) return;

        const now = LifeOS.state.currentTime;
        const minutesFromMidnight = now.getHours() * 60 + now.getMinutes();
        const dayIndex = now.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat

        let title = "Sesi Bebas & Istirahat Mandatory";
        let desc = "Waktu untuk pemulihan energi dan fokus harian.";

        // Special Sunday & Saturday Logic
        if (dayIndex === 0 || dayIndex === 6) {
            if (minutesFromMidnight >= 360 && minutesFromMidnight < 480) {
                title = "🏃 Olahraga Pagi & Light Mobility";
                desc = "Menjaga kebugaran akhir pekan dengan joging santai atau stretching.";
            } else if (minutesFromMidnight >= 480 && minutesFromMidnight < 720) {
                title = "📚 Self-Study & Legal Literature Review";
                desc = "Membaca buku dan eksplorasi topik Hukum & Psikologi.";
            } else if (minutesFromMidnight >= 720 && minutesFromMidnight < 1080) {
                title = "🎨 Visual Design & Motion Projects";
                desc = "Eksplorasi software editing, desain 3D, dan pengerjaan proyek kreatif.";
            } else if (minutesFromMidnight >= 1080 && minutesFromMidnight < 1320) {
                title = "🎬 Movie, Anime, or Reading Session";
                desc = "Relaksasi menonton anime pilihan atau membaca novel karya psikologi.";
            } else {
                title = "😴 Istirahat Optimal Akhir Pekan";
                desc = "Tidur berkualitas untuk persiapan fisik minggu depan.";
            }
        } else {
            // Weekday Activity Timetable Logic
            if (minutesFromMidnight >= 300 && minutesFromMidnight < 330) {
                title = "🌅 Bangun Pagi & Hidrasi Pertama";
                desc = "Minum 500ml air hangat, peregangan otot, dan ucapan syukur.";
            } else if (minutesFromMidnight >= 330 && minutesFromMidnight < 400) {
                title = "✨ K-Beauty Morning Skincare Routine";
                desc = "Pengaplikasian cleanser, hydrating toner, moisturizer, dan sunscreen.";
            } else if (minutesFromMidnight >= 400 && minutesFromMidnight < 420) {
                title = "🍳 Nutrisi Sarapan & Keberangkatan";
                desc = "Persiapan tas sekolah Jordan Air Patrol dan perbekalan harian.";
            } else if (minutesFromMidnight >= 420 && minutesFromMidnight < 930) {
                title = "🏫 Sesi Pembelajaran Akademik (Kelas 11)";
                desc = "Fokus penuh menyerap materi sekolah dan diskusi akademik.";
            } else if (minutesFromMidnight >= 960 && minutesFromMidnight < 1080) {
                title = "🏋️ Sesi Gym: Push / Pull / Legs Hypertrophy";
                desc = "Eksekusi program latihan fisik dengan progresif overload yang aman.";
            } else if (minutesFromMidnight >= 1080 && minutesFromMidnight < 1140) {
                title = "🧼 Mandi & Post-Workout Hydration";
                desc = "Membersihkan diri dan pemenuhan intake protein pasca latihan.";
            } else if (minutesFromMidnight >= 1140 && minutesFromMidnight < 1260) {
                title = "🧠 Deep Work & Evaluasi Tugas Sekolah";
                desc = "Gunakan Pomodoro Timer untuk pengerjaan tugas dan latihan soal.";
            } else if (minutesFromMidnight >= 1260 && minutesFromMidnight < 1320) {
                title = "🌙 K-Beauty Night Skincare & Wind-Down";
                desc = "Double cleansing, serum barrier repair, dan persiapan tidur.";
            } else {
                title = "😴 Recovery Sleep Phase";
                desc = "Proses regenerasi sel tubuh dan pertumbuhan jaringan otot.";
            }
        }

        this.activityTitleEl.textContent = title;
        this.activityDescEl.textContent = desc;
    }
};

/* ============================================================================
   6. SCHEDULE DATABASE & LIVE SEARCH ENGINE
   ============================================================================ */

const ScheduleDatabaseEngine = {
    init() {
        this.searchInput = document.getElementById('scheduleSearchInput');
        this.tableBody = document.querySelector('#scheduleTable tbody');

        this.bindEvents();
    },

    bindEvents() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                LifeOS.state.searchQuery = e.target.value.toLowerCase().trim();
                this.filterScheduleTable();
            });
        }
    },

    filterScheduleTable() {
        if (!this.tableBody) return;

        const query = LifeOS.state.searchQuery;
        const rows = this.tableBody.querySelectorAll('tr');

        let matchCount = 0;
        rows.forEach(row => {
            const textContent = row.textContent.toLowerCase();
            const isMatch = textContent.includes(query);
            row.style.display = isMatch ? '' : 'none';
            if (isMatch) matchCount++;
        });

        // Check if no results found
        let noResultsRow = document.getElementById('noScheduleResultRow');
        if (matchCount === 0) {
            if (!noResultsRow) {
                noResultsRow = document.createElement('tr');
                noResultsRow.id = 'noScheduleResultRow';
                noResultsRow.innerHTML = `
                    <td colspan="5" style="text-align: center; padding: 20px; color: var(--text-secondary);">
                        <i class="fa-solid fa-circle-exclamation" style="margin-right: 8px;"></i>
                        Jadwal tidak ditemukan untuk kata kunci "${query}".
                    </td>
                `;
                this.tableBody.appendChild(noResultsRow);
            }
        } else if (noResultsRow) {
            noResultsRow.remove();
        }
    }
};

/* ============================================================================
   7. HABIT TRACKER ENGINE & PERSISTENT ANALYTICS
   ============================================================================ */

const HabitTrackerEngine = {
    init() {
        this.checkboxes = document.querySelectorAll('.habit-checkbox');
        this.resetBtn = document.getElementById('resetHabitsBtn');
        this.progressBar = document.getElementById('habitProgressBar');
        this.percentText = document.getElementById('habitPercentText');
        this.summaryText = document.getElementById('habitSummaryText');

        this.todayKey = Utils.getDateKeyString();
        this.loadState();
        this.bindEvents();
    },

    loadState() {
        const savedHabits = Utils.getFromStorage(`HABITS_${this.todayKey}`, {});
        LifeOS.state.habits = savedHabits;

        this.checkboxes.forEach(box => {
            const isChecked = Boolean(savedHabits[box.id]);
            box.checked = isChecked;

            const parentCard = box.closest('.habit-item');
            if (parentCard) {
                parentCard.classList.toggle('completed', isChecked);
            }
        });

        this.recalculateAnalytics();
    },

    bindEvents() {
        this.checkboxes.forEach(box => {
            box.addEventListener('change', (e) => {
                const habitId = e.target.id;
                const isChecked = e.target.checked;

                LifeOS.state.habits[habitId] = isChecked;
                Utils.saveToStorage(`HABITS_${this.todayKey}`, LifeOS.state.habits);

                const parentCard = e.target.closest('.habit-item');
                if (parentCard) {
                    parentCard.classList.toggle('completed', isChecked);
                }

                Utils.triggerHapticFeedback();
                this.recalculateAnalytics();
            });
        });

        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => {
                if (confirm('Apakah Anda yakin ingin mengosongkan semua daftar kebiasaan hari ini?')) {
                    this.resetAllHabits();
                }
            });
        }
    },

    resetAllHabits() {
        LifeOS.state.habits = {};
        Utils.removeFromStorage(`HABITS_${this.todayKey}`);

        this.checkboxes.forEach(box => {
            box.checked = false;
            const parentCard = box.closest('.habit-item');
            if (parentCard) {
                parentCard.classList.remove('completed');
            }
        });

        this.recalculateAnalytics();
        Utils.triggerHapticFeedback();
    },

    recalculateAnalytics() {
        if (!this.checkboxes.length) return;

        const totalHabits = this.checkboxes.length;
        let completedHabits = 0;

        this.checkboxes.forEach(box => {
            if (box.checked) completedHabits++;
        });

        const percentage = Math.round((completedHabits / totalHabits) * 100);

        if (this.progressBar) {
            this.progressBar.style.width = `${percentage}%`;
        }
        if (this.percentText) {
            this.percentText.textContent = `${percentage}% Completed`;
        }
        if (this.summaryText) {
            if (percentage === 100) {
                this.summaryText.textContent = "🔥 Sempurna! Semua rutinitas hari ini telah berhasil diselesaikan!";
                this.summaryText.style.color = "var(--success-color)";
            } else if (percentage >= 50) {
                this.summaryText.textContent = "⚡ Kemajuan sangat baik! Lanjutkan konsistensi hingga malam.";
                this.summaryText.style.color = "var(--accent-color)";
            } else {
                this.summaryText.textContent = "Selesaikan target untuk membangun disiplin harian.";
                this.summaryText.style.color = "var(--text-secondary)";
            }
        }
    }
};

/* ============================================================================
   8. FOCUS POMODORO TIMER ENGINE
   ============================================================================ */

const PomodoroEngine = {
    init() {
        this.display = document.getElementById('pomodoroDisplay');
        this.modeText = document.getElementById('timerModeText');
        this.startBtn = document.getElementById('startTimerBtn');
        this.pauseBtn = document.getElementById('pauseTimerBtn');
        this.resetBtn = document.getElementById('resetTimerBtn');

        this.bindEvents();
        this.updateDisplay();
    },

    bindEvents() {
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.start());
        }
        if (this.pauseBtn) {
            this.pauseBtn.addEventListener('click', () => this.pause());
        }
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.reset());
        }
    },

    start() {
        if (LifeOS.state.pomodoro.isRunning) return;

        LifeOS.state.pomodoro.isRunning = true;
        Utils.triggerHapticFeedback();
        Utils.playAudioBeep(600, 'sine', 0.1);

        LifeOS.state.pomodoro.intervalId = setInterval(() => {
            if (LifeOS.state.pomodoro.timeLeft > 0) {
                LifeOS.state.pomodoro.timeLeft--;
                this.updateDisplay();
            } else {
                this.onTimerComplete();
            }
        }, 1000);

        this.updateButtonsUI();
    },

    pause() {
        if (!LifeOS.state.pomodoro.isRunning) return;

        clearInterval(LifeOS.state.pomodoro.intervalId);
        LifeOS.state.pomodoro.intervalId = null;
        LifeOS.state.pomodoro.isRunning = false;

        Utils.triggerHapticFeedback();
        this.updateButtonsUI();
    },

    reset() {
        this.pause();
        LifeOS.state.pomodoro.mode = 'FOCUS';
        LifeOS.state.pomodoro.timeLeft = LifeOS.config.pomodoroDefaultFocusSec;
        this.updateDisplay();
        this.updateButtonsUI();
        Utils.triggerHapticFeedback();
    },

    onTimerComplete() {
        this.pause();
        Utils.playAudioBeep(880, 'triangle', 0.8);

        if (LifeOS.state.pomodoro.mode === 'FOCUS') {
            LifeOS.state.pomodoro.totalCompletedSessions++;
            alert('🔔 Sesi Fokus 25 Menit Selesai! Luar biasa. Waktunya istirahat 5 menit.');
            
            // Switch to Break Mode
            LifeOS.state.pomodoro.mode = 'BREAK';
            LifeOS.state.pomodoro.timeLeft = LifeOS.config.pomodoroDefaultBreakSec;
        } else {
            alert('⏰ Istirahat Selesai! Mari kembali ke mode fokus kerja.');
            
            // Switch to Focus Mode
            LifeOS.state.pomodoro.mode = 'FOCUS';
            LifeOS.state.pomodoro.timeLeft = LifeOS.config.pomodoroDefaultFocusSec;
        }

        this.updateDisplay();
    },

    updateDisplay() {
        const mins = Utils.padZero(Math.floor(LifeOS.state.pomodoro.timeLeft / 60));
        const secs = Utils.padZero(LifeOS.state.pomodoro.timeLeft % 60);

        if (this.display) {
            this.display.textContent = `${mins}:${secs}`;
        }
        if (this.modeText) {
            this.modeText.textContent = LifeOS.state.pomodoro.mode === 'FOCUS' ? 'FOCUS SESSION' : 'SHORT BREAK';
            this.modeText.style.color = LifeOS.state.pomodoro.mode === 'FOCUS' ? 'var(--accent-color)' : 'var(--success-color)';
        }
    },

    updateButtonsUI() {
        if (this.startBtn) {
            this.startBtn.disabled = LifeOS.state.pomodoro.isRunning;
            this.startBtn.style.opacity = LifeOS.state.pomodoro.isRunning ? '0.5' : '1';
        }
        if (this.pauseBtn) {
            this.pauseBtn.disabled = !LifeOS.state.pomodoro.isRunning;
            this.pauseBtn.style.opacity = !LifeOS.state.pomodoro.isRunning ? '0.5' : '1';
        }
    }
};

/* ============================================================================
   9. WORKOUT & GYM LOGGER ENGINE
   ============================================================================ */

const WorkoutLoggerEngine = {
    init() {
        this.workoutCards = document.querySelectorAll('.workout-card');
        this.attachInteractiveInputs();
    },

    attachInteractiveInputs() {
        this.workoutCards.forEach((card, index) => {
            const listItems = card.querySelectorAll('li');
            listItems.forEach((item, itemIdx) => {
                item.style.cursor = 'pointer';
                item.addEventListener('click', () => {
                    item.classList.toggle('workout-completed');
                    if (item.classList.contains('workout-completed')) {
                        item.style.textDecoration = 'line-through';
                        item.style.opacity = '0.6';
                    } else {
                        item.style.textDecoration = 'none';
                        item.style.opacity = '1';
                    }
                    Utils.triggerHapticFeedback();
                });
            });
        });
    }
};

/* ============================================================================
   10. SKINCARE REGIMEN ENGINE
   ============================================================================ */

const SkincareRegimenEngine = {
    init() {
        this.skincareLists = document.querySelectorAll('.skincare-list li');
        this.attachInteractivity();
    },

    attachInteractivity() {
        this.skincareLists.forEach(item => {
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
                item.classList.toggle('step-done');
                if (item.classList.contains('step-done')) {
                    item.style.color = 'var(--success-color)';
                } else {
                    item.style.color = 'var(--text-secondary)';
                }
                Utils.triggerHapticFeedback();
            });
        });
    }
};

/* ============================================================================
   11. DATA TRANSFER & BACKUP ENGINE (JSON Export/Import)
   ============================================================================ */

const DataTransferEngine = {
    init() {
        // Expose global backup method for dev tools or settings menu
        window.LifeOS_ExportBackup = this.exportJSONBackup.bind(this);
        window.LifeOS_ImportBackup = this.importJSONBackup.bind(this);
    },

    exportJSONBackup() {
        const backupData = {
            version: LifeOS.version,
            timestamp: new Date().toISOString(),
            storageDump: {}
        };

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(LifeOS.config.storageKeyPrefix)) {
                backupData.storageDump[key] = localStorage.getItem(key);
            }
        }

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `LifeOS_Backup_${Utils.getDateKeyString()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        console.log('[Data Engine] Backup exported successfully.');
    },

    importJSONBackup(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            if (!parsed.storageDump) {
                throw new Error('Invalid Backup File Format.');
            }

            Object.keys(parsed.storageDump).forEach(key => {
                localStorage.setItem(key, parsed.storageDump[key]);
            });

            alert('Data berhasil di-restore! Halaman akan direfresh.');
            window.location.reload();
        } catch (err) {
            alert('Gagal mengimpor file backup: ' + err.message);
        }
    }
};

/* ============================================================================
   12. iOS SWIPE GESTURE ENGINE (Touch Gesture Support for iPhone)
   ============================================================================ */

const TouchGestureEngine = {
    init() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;

        this.bindTouchEvents();
    },

    bindTouchEvents() {
        document.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.touchEndY = e.changedTouches[0].screenY;
            this.handleSwipeGesture();
        }, { passive: true });
    },

    handleSwipeGesture() {
        const swipeDistanceX = this.touchEndX - this.touchStartX;
        const swipeDistanceY = Math.abs(this.touchEndY - this.touchStartY);

        // Ensure swipe is horizontal and not vertical scroll
        if (swipeDistanceY > 80) return;

        // Swipe Right from Left Edge to Open Sidebar
        if (this.touchStartX < 30 && swipeDistanceX > 70) {
            SidebarController.open();
        }

        // Swipe Left to Close Sidebar
        if (LifeOS.state.sidebarOpen && swipeDistanceX < -70) {
            SidebarController.close();
        }
    }
};
