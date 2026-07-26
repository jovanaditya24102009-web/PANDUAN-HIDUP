/**
 * ============================================================================
 * ULTIMATE LIFE OPERATING SYSTEM v3.0 - ENTERPRISE JS ENGINE (800+ LINES)
 * Architecture: Modular Enterprise Architecture / Event-Driven State Engine
 * Features: LocalStorage Sync, Web Audio API, Haptic Engine, Dynamic Analytics,
 *           Complex Search/Filters, Interactive Timers, Workout Logs & Roadmap.
 * ============================================================================
 */

'use strict';

/* ============================================================================
   1. GLOBAL NAMESPACE & MASTER STATE STORE
   ============================================================================ */

const LifeOS = {
    version: '3.5.0-ENTERPRISE',
    activeSection: 'dashboard',

    config: {
        storagePrefix: 'LIFE_OS_V3_MASTER_',
        clockIntervalMs: 1000,
        hydrationDefaultTargetMl: 3800,
        pomodoroWorkDefaultSec: 25 * 60,
        pomodoroBreakDefaultSec: 5 * 60,
        enableAudio: true,
        enableHaptics: true,
        enableSystemNotifications: true
    },

    // Dynamic State Management
    state: {
        currentTime: new Date(),
        sidebarOpen: false,
        searchQuery: '',
        selectedDayFilter: 'today',
        historyStack: [],
        
        // Hydration System State
        hydration: {
            currentIntakeMl: 0,
            targetMl: 3800,
            history: [] // { time: '08:30', amount: 250 }
        },

        // Pomodoro State Machine
        pomodoro: {
            workDurationSec: 25 * 60,
            breakDurationSec: 5 * 60,
            timeLeftSec: 25 * 60,
            mode: 'work', // 'work' | 'break'
            isRunning: false,
            completedCycles: 0,
            intervalId: null
        },

        // Habit Engine Tracker
        habits: {},

        // Gym Workout Execution State
        workoutLogs: {}, // { '2026-07-26': [ { exercise: 'Incline DB Press', sets: 3, reps: 10, weightKg: 24 } ] }

        // Skincare & Masseter Progress
        skincareSteps: {},

        // Law Prep Checklist
        lawPrepTasks: {}
    },

    // Static School Master Database (SMA Kelas 12)
    schoolData: {
        1: [ // Senin
            { time: "07.00 - 09.15", subject: "INFORMATIKA", code: "AR", duration: "3 Jam", type: "Praktek/Teori" },
            { time: "09.15 - 11.30", subject: "PJOK", code: "RK", duration: "3 Jam", type: "Fisik" },
            { time: "11.30 - 13.45", subject: "SEJARAH WAJIB", code: "PU", duration: "2 Jam", type: "Teori" },
            { time: "13.45 - 15.45", subject: "PKN", code: "EC", duration: "2 Jam", type: "Teori" }
        ],
        2: [ // Selasa
            { time: "07.00 - 09.15", subject: "BAHASA INDONESIA", code: "RS", duration: "3 Jam", type: "Literasi" },
            { time: "09.15 - 10.45", subject: "MATEMATIKA", code: "SG", duration: "2 Jam", type: "Eksak" },
            { time: "10.45 - 13.00", subject: "BAHASA INGGRIS", code: "NH", duration: "3 Jam", type: "Bahasa" },
            { time: "13.00 - 15.45", subject: "SEJARAH TINGKAT LANJUT", code: "SY", duration: "3 Jam", type: "Analisis" }
        ],
        3: [ // Rabu
            { time: "07.00 - 08.30", subject: "INFORMATIKA", code: "AR", duration: "2 Jam", type: "Praktek" },
            { time: "08.30 - 10.00", subject: "BAHASA JEPANG", code: "IK", duration: "2 Jam", type: "Bahasa" },
            { time: "10.00 - 11.30", subject: "SENI DAN BUDAYA", code: "DA", duration: "2 Jam", type: "Kreatif" },
            { time: "11.30 - 13.45", subject: "EKONOMI", code: "SI", duration: "2 Jam", type: "Analisis" },
            { time: "13.45 - 15.45", subject: "PKWU", code: "AS", duration: "2 Jam", type: "Praktek" }
        ],
        4: [ // Kamis
            { time: "07.00 - 09.15", subject: "AGAMA", code: "MD", duration: "3 Jam", type: "Teori" },
            { time: "09.15 - 10.45", subject: "BAHASA JEPANG", code: "IK", duration: "2 Jam", type: "Bahasa" },
            { time: "10.45 - 12.15", subject: "BAHASA INDONESIA", code: "RS", duration: "2 Jam", type: "Literasi" },
            { time: "12.15 - 15.45", subject: "SEJARAH TINGKAT LANJUT", code: "SY", duration: "2 Jam", type: "Analisis" }
        ],
        5: [ // Jumat
            { time: "07.00 - 09.15", subject: "EKONOMI", code: "SL", duration: "3 Jam", type: "Analisis" },
            { time: "09.15 - 10.45", subject: "MATEMATIKA", code: "SG", duration: "2 Jam", type: "Eksak" }
        ]
    },

    audioCtx: null
};

/* ============================================================================
   2. EVENT BUS & PUB-SUB PATTERN ENGINE
   ============================================================================ */

const EventBus = {
    events: {},

    on(event, callback) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    },

    off(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    },

    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }
};

/* ============================================================================
   3. UTILITY HELPER & STORAGE ENGINE
   ============================================================================ */

const Utils = {
    padZero(num, size = 2) {
        let s = String(num);
        while (s.length < size) s = "0" + s;
        return s;
    },

    formatTimeHMS(date) {
        return `${this.padZero(date.getHours())}:${this.padZero(date.getMinutes())}:${this.padZero(date.getSeconds())}`;
    },

    formatDateISO(date = new Date()) {
        return `${date.getFullYear()}-${this.padZero(date.getMonth() + 1)}-${this.padZero(date.getDate())}`;
    },

    formatReadableDate(date = new Date()) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('id-ID', options);
    },

    saveStorage(key, data) {
        try {
            const fullKey = LifeOS.config.storagePrefix + key;
            localStorage.setItem(fullKey, JSON.stringify(data));
            EventBus.emit('storage:updated', { key, data });
            return true;
        } catch (e) {
            console.error('[Storage Engine Error] Failed to save key:', key, e);
            return false;
        }
    },

    getStorage(key, fallback = null) {
        try {
            const fullKey = LifeOS.config.storagePrefix + key;
            const item = localStorage.getItem(fullKey);
            return item ? JSON.parse(item) : fallback;
        } catch (e) {
            console.error('[Storage Engine Error] Failed to read key:', key, e);
            return fallback;
        }
    },

    removeStorage(key) {
        try {
            const fullKey = LifeOS.config.storagePrefix + key;
            localStorage.removeItem(fullKey);
            return true;
        } catch (e) {
            return false;
        }
    },

    triggerHaptic(pattern = 12) {
        if (LifeOS.config.enableHaptics && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(pattern);
        }
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '⚡'}</span>
                <span class="toast-text">${message}</span>
            </div>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    },

    playAudioSound(frequency = 800, type = 'sine', durationSec = 0.15) {
        if (!LifeOS.config.enableAudio) return;
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
            osc.frequency.setValueAtTime(frequency, LifeOS.audioCtx.currentTime);
            gain.gain.setValueAtTime(0.1, LifeOS.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.00001, LifeOS.audioCtx.currentTime + durationSec);

            osc.connect(gain);
            gain.connect(LifeOS.audioCtx.destination);

            osc.start();
            osc.stop(LifeOS.audioCtx.currentTime + durationSec);
        } catch (e) {
            console.warn('[Audio Engine] Web Audio API blocked or not supported:', e);
        }
    },

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    },

    sendNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted' && LifeOS.config.enableSystemNotifications) {
            new Notification(title, { body: body, icon: '⚡' });
        }
    }
};

/* ============================================================================
   4. SYSTEM INITIALIZATION & APPLICATION LIFECYCLE
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
    console.log(`%c[LifeOS Core] Booting Enterprise Engine v${LifeOS.version}...`, 'color: #3b82f6; font-weight: bold; font-size: 14px;');

    // Request permissions
    Utils.requestNotificationPermission();

    // Boot Up All Subsystem Engines
    NavigationEngine.init();
    SidebarDrawerEngine.init();
    RealtimeClockEngine.init();
    SchoolTimetableEngine.init();
    GymWorkoutEngine.init();
    SkincareMasseterEngine.init();
    HydrationSystemEngine.init();
    HabitTrackerEngine.init();
    PomodoroEngine.init();
    LawPrepEngine.init();
    GlobalShortcutsEngine.init();
    TouchGestureEngine.init();

    console.log('%c[LifeOS Core] All 12 Core Subsystems Operating at Peak Performance.', 'color: #10b981; font-weight: bold;');
});

/* ============================================================================
   5. NAVIGATION & ROUTE ENGINE
   ============================================================================ */

const NavigationEngine = {
    init() {
        this.navLinks = document.querySelectorAll('.nav-link');
        this.sections = document.querySelectorAll('.page-section');
        this.titleHeader = document.getElementById('currentPageTitle');

        this.bindEvents();
        this.restoreLastRoute();
    },

    bindEvents() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('data-target');
                if (target) {
                    this.navigateTo(target);
                    Utils.triggerHaptic(10);
                    Utils.playAudioSound(500, 'sine', 0.05);
                }
            });
        });

        EventBus.on('navigation:request', (targetSection) => {
            this.navigateTo(targetSection);
        });
    },

    navigateTo(sectionId) {
        const targetEl = document.getElementById(sectionId);
        if (!targetEl) return;

        LifeOS.activeSection = sectionId;

        // Update Nav UI Active Class
        this.navLinks.forEach(link => {
            const isMatch = link.getAttribute('data-target') === sectionId;
            link.classList.toggle('active', isMatch);
            
            if (isMatch && this.titleHeader) {
                const labelText = link.querySelector('.label') ? link.querySelector('.label').textContent : sectionId;
                this.titleHeader.textContent = labelText;
            }
        });

        // Switch Visible Sections
        this.sections.forEach(section => {
            if (section.id === sectionId) {
                section.classList.add('active');
                section.style.display = 'block';
            } else {
                section.classList.remove('active');
                section.style.display = 'none';
            }
        });

        // Save State
        Utils.saveStorage('LAST_ACTIVE_SECTION', sectionId);
        SidebarDrawerEngine.close();
        window.scrollTo({ top: 0, behavior: 'smooth' });

        EventBus.emit('navigation:changed', { sectionId });
    },

    restoreLastRoute() {
        const savedRoute = Utils.getStorage('LAST_ACTIVE_SECTION', 'dashboard');
        this.navigateTo(savedRoute);
    }
};

/* ============================================================================
   6. SIDEBAR DRAWER CONTROLLER
   ============================================================================ */

const SidebarDrawerEngine = {
    init() {
        this.sidebar = document.getElementById('sidebar');
        this.overlay = document.getElementById('sidebarOverlay');
        this.toggleBtn = document.getElementById('menuToggle');
        this.closeBtn = document.getElementById('closeSidebarBtn');

        this.bindEvents();
    },

    bindEvents() {
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.toggle());
        }
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.close());
        }
    },

    open() {
        if (this.sidebar && this.overlay) {
            this.sidebar.classList.add('active');
            this.overlay.classList.add('active');
            LifeOS.state.sidebarOpen = true;
            Utils.triggerHaptic(15);
        }
    },

    close() {
        if (this.sidebar && this.overlay) {
            this.sidebar.classList.remove('active');
            this.overlay.classList.remove('active');
            LifeOS.state.sidebarOpen = false;
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
   7. REALTIME CLOCK & DYNAMIC TIME-BLOCKING EVALUATOR
   ============================================================================ */

const RealtimeClockEngine = {
    init() {
        this.clockDisplay = document.getElementById('digitalClock');
        this.activityTitle = document.getElementById('currentActivityTitle');
        this.activityDesc = document.getElementById('currentActivityDesc');

        this.startLoop();
    },

    startLoop() {
        const tick = () => {
            LifeOS.state.currentTime = new Date();
            this.renderClock();
            this.evaluateTimeBlock();
        };

        tick();
        setInterval(tick, LifeOS.config.clockIntervalMs);
    },

    renderClock() {
        if (this.clockDisplay) {
            this.clockDisplay.textContent = Utils.formatTimeHMS(LifeOS.state.currentTime);
        }
    },

    evaluateTimeBlock() {
        if (!this.activityTitle || !this.activityDesc) return;

        const now = LifeOS.state.currentTime;
        const minutesOfDay = now.getHours() * 60 + now.getMinutes();
        const dayOfWeek = now.getDay(); // 0: Minggu, 1: Senin, ..., 6: Sabtu

        let title = "Sesi Pemulihan & Istirahat Mode";
        let desc = "Waktu untuk regenerasi energi, hidrasi, dan istirahat optimal.";

        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Weekday Execution Schedule
            if (minutesOfDay >= 300 && minutesOfDay < 315) {
                title = "🌅 Morning Prime: Bangun Tidur & Hydration Boost";
                desc = "Minum 500ml air putih langsung setelah bangun untuk rehidrasi organ tubuh.";
            } else if (minutesOfDay >= 315 && minutesOfDay < 330) {
                title = "✨ Skin Barrier Cleansing & Pijat Masseter Pagi";
                desc = "Gunakan Gentle Cleanser + Moisturizer ringan & pijat masseter 3 menit.";
            } else if (minutesOfDay >= 330 && minutesOfDay < 360) {
                title = "🧼 Personal Hygiene & Sunscreen Protection";
                desc = "Mandi air biasa/hangat & pakai Sunscreen 2 ruas jari secara menyeluruh.";
            } else if (minutesOfDay >= 360 && minutesOfDay < 380) {
                title = "🍳 High Protein Breakfast Block";
                desc = "Sarapan 3 telur rebus + 2 roti gandum + pisang (~25g Protein). Minum 300ml air.";
            } else if (minutesOfDay >= 380 && minutesOfDay < 400) {
                title = "🎒 Academic Departure Block";
                desc = "Cek perlengkapan sekolah, buku paket, Jordan Air Patrol Backpack, berangkat.";
            } else if (minutesOfDay >= 420 && minutesOfDay < 945) {
                title = "🏫 Academic School Block (Kelas 12 KBM)";
                desc = "Fokus penuh menyerap materi KBM, cicil air minum hingga target 2.25L di sekolah.";
            } else if (minutesOfDay >= 945 && minutesOfDay < 975) {
                title = "🏠 Post-School Transition & Recovery";
                desc = "Ganti baju, cuci muka dengan air bersih, istirahat sejenak dari sekolah.";
            } else if (minutesOfDay >= 975 && minutesOfDay < 990) {
                title = "🍌 Pre-Workout Fueling & Hydration";
                desc = "Konsumsi pisang / roti selai kacang + minum 300ml air putih sebelum gym.";
            } else if (minutesOfDay >= 990 && minutesOfDay < 1080) {
                title = "🏋️ Physical Execution: Hypertrophy 6-Split Gym";
                desc = "Fokus latihan beban intensif sesuai jadwal split harian (Push/Pull/Legs/Upper/Lower).";
            } else if (minutesOfDay >= 1080 && minutesOfDay < 1110) {
                title = "🧼 Post-Workout Hygiene Routine";
                desc = "Mandi bersih untuk membersihkan keringat, cegah jerawat badan, ganti pakaian.";
            } else if (minutesOfDay >= 1110 && minutesOfDay < 1155) {
                title = "🥩 Anabolic Dinner Block";
                desc = "Makan malam nutrisi seimbang (150g Ayam/Daging + Nasi + Sayur) ~40g Protein.";
            } else if (minutesOfDay >= 1155 && minutesOfDay < 1215) {
                title = "📚 Block Review Pelajaran Sekolah Besok";
                desc = "Review materi esok hari sesuai jadwal KBM selama 60 menit penuh.";
            } else if (minutesOfDay >= 1215 && minutesOfDay < 1245) {
                title = "⚖️ Block Preparasi PTN Hukum & SNBT";
                desc = "Latihan soal TPS / TKA Hukum, pelajari kosakata asing & hukum dasar.";
            } else if (minutesOfDay >= 1245 && minutesOfDay < 1275) {
                title = "💆 Night Recovery: Skincare & Warm Masseter De-tension";
                desc = "Kompres hangat rahang 3-5m, pijat masseter 5m, aplikasikan pelembab tebal.";
            } else if (minutesOfDay >= 1275 && minutesOfDay < 1290) {
                title = "📊 Daily Life OS Audit & Habit Logging";
                desc = "Cek Habit Tracker, pastikan target air minum 3.8L-4.0L sudah tuntas.";
            } else if (minutesOfDay >= 1290 && minutesOfDay < 1320) {
                title = "🌙 Digital Detox & Sleep Preparation";
                desc = "Matikan layar HP/laptop, redupkan lampu kamar, atur mode tidur.";
            } else {
                title = "😴 Deep Growth & Muscle Recovery Sleep";
                desc = "Tidur nyenyak 7-8 jam untuk sekresi Growth Hormone & pemulihan jaringan otot.";
            }
        } else { // Weekend Schedule
            title = "📅 Weekend Regeneration & Active Recovery";
            desc = "Latihan Lower Body / Rest Walk Treadmill 45m, evaluasi target mingguan.";
        }

        this.activityTitle.textContent = title;
        this.activityDesc.textContent = desc;
    }
};

/* ============================================================================
   8. SCHOOL SCHEDULE & SEARCH/FILTER ENGINE
   ============================================================================ */

const SchoolTimetableEngine = {
    init() {
        this.tableBody = document.querySelector('#scheduleTable tbody');
        this.searchInput = document.getElementById('scheduleSearchInput');

        this.renderSchedule();
        this.bindEvents();
    },

    bindEvents() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                LifeOS.state.searchQuery = e.target.value.toLowerCase().trim();
                this.filterSchedule();
            });
        }

        EventBus.on('schedule:refresh', () => {
            this.renderSchedule();
        });
    },

    renderSchedule() {
        if (!this.tableBody) return;

        const dayIndex = new Date().getDay();
        const todaySchedule = LifeOS.schoolData[dayIndex] || [];

        if (todaySchedule.length === 0) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 28px; color: var(--text-muted);">
                        🎉 Hari ini tidak ada Kegiatan Belajar Mengajar (Akhir Pekan / Libur Sekolah).
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        todaySchedule.forEach(item => {
            html += `
                <tr class="schedule-row">
                    <td class="time-col"><strong>${item.time}</strong></td>
                    <td class="subject-col">
                        <span class="subject-name">${item.subject}</span>
                        <span class="badge badge-type" style="margin-left: 8px; font-size: 0.7rem;">${item.type}</span>
                    </td>
                    <td class="code-col"><span class="badge">${item.code}</span></td>
                    <td class="duration-col">${item.duration}</td>
                </tr>
            `;
        });

        this.tableBody.innerHTML = html;
    },

    filterSchedule() {
        if (!this.tableBody) return;

        const query = LifeOS.state.searchQuery;
        const rows = this.tableBody.querySelectorAll('tr.schedule-row');

        rows.forEach(row => {
            const textContent = row.textContent.toLowerCase();
            if (textContent.includes(query)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
};

/* ============================================================================
   9. GYM WORKOUT & HYPERTROPHY TRACKER ENGINE
   ============================================================================ */

const GymWorkoutEngine = {
    init() {
        this.todayIso = Utils.formatDateISO();
        LifeOS.state.workoutLogs = Utils.getStorage('WORKOUT_LOGS', {});

        this.bindEvents();
        this.renderWorkoutStats();
    },

    bindEvents() {
        document.querySelectorAll('.exercise-list li').forEach(item => {
            item.addEventListener('click', () => {
                item.classList.toggle('exercise-done');
                Utils.triggerHaptic(12);
                Utils.playAudioSound(700, 'sine', 0.1);

                if (item.classList.contains('exercise-done')) {
                    Utils.showToast(`Latihan Selesai: ${item.firstChild.textContent.trim()}`, 'success');
                }
            });
        });
    },

    renderWorkoutStats() {
        const todayLogs = LifeOS.state.workoutLogs[this.todayIso] || [];
        console.log(`[Gym Engine] Total exercises logged today: ${todayLogs.length}`);
    }
};

/* ============================================================================
   10. SKINCARE & MASSETER DE-TENSION ENGINE
   ============================================================================ */

const SkincareMasseterEngine = {
    init() {
        this.todayIso = Utils.formatDateISO();
        LifeOS.state.skincareSteps = Utils.getStorage(`SKINCARE_${this.todayIso}`, {});

        this.bindEvents();
        this.restoreState();
    },

    bindEvents() {
        const steps = document.querySelectorAll('.interactive-step');
        steps.forEach((step, index) => {
            step.addEventListener('click', () => {
                const stepId = step.getAttribute('data-step-id') || `step_${index}`;
                const isCompleted = step.classList.toggle('step-completed');

                LifeOS.state.skincareSteps[stepId] = isCompleted;
                Utils.saveStorage(`SKINCARE_${this.todayIso}`, LifeOS.state.skincareSteps);

                Utils.triggerHaptic(15);
                Utils.playAudioSound(isCompleted ? 800 : 450, 'triangle', 0.12);

                if (isCompleted) {
                    Utils.showToast('Langkah Skincare / Masseter Dicentang!', 'success');
                }
            });
        });
    },

    restoreState() {
        const saved = LifeOS.state.skincareSteps;
        const steps = document.querySelectorAll('.interactive-step');

        steps.forEach((step, index) => {
            const stepId = step.getAttribute('data-step-id') || `step_${index}`;
            if (saved[stepId]) {
                step.classList.add('step-completed');
            }
        });
    }
};

/* ============================================================================
   11. ADVANCED HYDRATION SYSTEM ENGINE (3.8L - 4.0L)
   ============================================================================ */

const HydrationSystemEngine = {
    init() {
        this.todayIso = Utils.formatDateISO();
        const savedHydration = Utils.getStorage(`HYDRATION_${this.todayIso}`, {
            currentIntakeMl: 0,
            targetMl: LifeOS.config.hydrationDefaultTargetMl,
            history: []
        });

        LifeOS.state.hydration = savedHydration;

        this.displayEl = document.getElementById('waterDisplay');
        this.progressBarEl = document.getElementById('waterProgressBar');
        this.addBtn = document.getElementById('addWaterBtn');
        this.resetBtn = document.getElementById('resetWaterBtn');

        this.bindEvents();
        this.updateUI();
    },

    bindEvents() {
        if (this.addBtn) {
            this.addBtn.addEventListener('click', () => {
                this.addWater(250);
                Utils.triggerHaptic(20);
                Utils.playAudioSound(600, 'sine', 0.1);
            });
        }

        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => {
                if (confirm('Apakah Anda yakin ingin meriset log air putih hari ini?')) {
                    this.resetHydration();
                }
            });
        }
    },

    addWater(amountMl) {
        LifeOS.state.hydration.currentIntakeMl += amountMl;
        const timeStr = Utils.formatTimeHMS(new Date());

        LifeOS.state.hydration.history.push({
            time: timeStr,
            amount: amountMl
        });

        this.saveState();
        this.updateUI();

        Utils.showToast(`+${amountMl}ml Air Putih Ter-log! Total: ${(LifeOS.state.hydration.currentIntakeMl / 1000).toFixed(2)}L`, 'success');

        if (LifeOS.state.hydration.currentIntakeMl >= LifeOS.state.hydration.targetMl) {
            Utils.sendNotification('🎉 Hydration Target Reached!', 'Selamat! Target air putih 3.8L - 4.0L hari ini telah tuntas tercapai!');
        }
    },

    resetHydration() {
        LifeOS.state.hydration.currentIntakeMl = 0;
        LifeOS.state.hydration.history = [];
        this.saveState();
        this.updateUI();
        Utils.showToast('Log Hydration Hari Ini Berhasil Direset.', 'warning');
    },

    saveState() {
        Utils.saveStorage(`HYDRATION_${this.todayIso}`, LifeOS.state.hydration);
    },

    updateUI() {
        const current = LifeOS.state.hydration.currentIntakeMl;
        const target = LifeOS.state.hydration.targetMl;
        const percent = Math.min(100, Math.round((current / target) * 100));

        if (this.displayEl) {
            this.displayEl.textContent = `${(current / 1000).toFixed(2)}L / ${(target / 1000).toFixed(2)}L (${percent}%)`;
        }

        if (this.progressBarEl) {
            this.progressBarEl.style.width = `${percent}%`;
            if (percent >= 100) {
                this.progressBarEl.style.background = 'linear-gradient(90deg, #10b981 0%, #059669 100%)';
            } else {
                this.progressBarEl.style.background = 'linear-gradient(90deg, var(--color-primary) 0%, #60a5fa 100%)';
            }
        }
    }
};

/* ============================================================================
   12. HABIT TRACKER ENGINE & PERSISTENCE
   ============================================================================ */

const HabitTrackerEngine = {
    init() {
        this.todayIso = Utils.formatDateISO();
        LifeOS.state.habits = Utils.getStorage(`HABITS_${this.todayIso}`, {});

        this.checkboxes = document.querySelectorAll('.habit-checkbox');

        this.restoreCheckboxes();
        this.bindEvents();
    },

    bindEvents() {
        this.checkboxes.forEach(box => {
            box.addEventListener('change', (e) => {
                const habitId = e.target.id;
                const isChecked = e.target.checked;

                LifeOS.state.habits[habitId] = isChecked;
                Utils.saveStorage(`HABITS_${this.todayIso}`, LifeOS.state.habits);

                Utils.triggerHaptic(15);
                Utils.playAudioSound(isChecked ? 750 : 350, 'triangle', 0.1);

                if (isChecked) {
                    Utils.showToast('Habit Berhasil Diselesaikan!', 'success');
                }
            });
        });
    },

    restoreCheckboxes() {
        const saved = LifeOS.state.habits;
        this.checkboxes.forEach(box => {
            box.checked = Boolean(saved[box.id]);
        });
    }
};

/* ============================================================================
   13. POMODORO FOCUS STATE MACHINE
   ============================================================================ */

const PomodoroEngine = {
    init() {
        this.display = document.getElementById('pomodoroDisplay');
        this.startBtn = document.getElementById('startTimerBtn');
        this.pauseBtn = document.getElementById('pauseTimerBtn');
        this.resetBtn = document.getElementById('resetTimerBtn');

        this.bindEvents();
        this.updateDisplay();
    },

    bindEvents() {
        if (this.startBtn) this.startBtn.addEventListener('click', () => this.start());
        if (this.pauseBtn) this.pauseBtn.addEventListener('click', () => this.pause());
        if (this.resetBtn) this.resetBtn.addEventListener('click', () => this.reset());
    },

    start() {
        if (LifeOS.state.pomodoro.isRunning) return;

        LifeOS.state.pomodoro.isRunning = true;
        Utils.playAudioSound(650, 'sine', 0.15);
        Utils.showToast(`Sesi Pomodoro (${LifeOS.state.pomodoro.mode.toUpperCase()}) Dimulai!`, 'info');

        LifeOS.state.pomodoro.intervalId = setInterval(() => {
            if (LifeOS.state.pomodoro.timeLeftSec > 0) {
                LifeOS.state.pomodoro.timeLeftSec--;
                this.updateDisplay();
            } else {
                this.onTimerCompleted();
            }
        }, 1000);
    },

    pause() {
        if (!LifeOS.state.pomodoro.isRunning) return;

        clearInterval(LifeOS.state.pomodoro.intervalId);
        LifeOS.state.pomodoro.isRunning = false;
        Utils.showToast('Pomodoro Timer Di-pause.', 'warning');
    },

    reset() {
        this.pause();
        LifeOS.state.pomodoro.mode = 'work';
        LifeOS.state.pomodoro.timeLeftSec = LifeOS.state.pomodoro.workDurationSec;
        this.updateDisplay();
        Utils.showToast('Timer Di-reset ke 25 Menit Work Mode.', 'info');
    },

    onTimerCompleted() {
        this.pause();
        Utils.playAudioSound(900, 'square', 0.6);

        if (LifeOS.state.pomodoro.mode === 'work') {
            LifeOS.state.pomodoro.completedCycles++;
            LifeOS.state.pomodoro.mode = 'break';
            LifeOS.state.pomodoro.timeLeftSec = LifeOS.state.pomodoro.breakDurationSec;
            
            Utils.sendNotification('⏱️ Sesi Kerja Selesai!', 'Kerja bagus! Saatnya istirahat selama 5 menit.');
            alert('🔔 Sesi Kerja 25 Menit Selesai! Ambil nafas dan istirahat 5 menit.');
        } else {
            LifeOS.state.pomodoro.mode = 'work';
            LifeOS.state.pomodoro.timeLeftSec = LifeOS.state.pomodoro.workDurationSec;

            Utils.sendNotification('☕ Istirahat Selesai!', 'Waktu istirahat habis. Siap untuk kembali fokus?');
            alert('⚡ Istirahat Selesai! Klik Start untuk kembali memulai fokus.');
        }

        this.updateDisplay();
    },

    updateDisplay() {
        const mins = Utils.padZero(Math.floor(LifeOS.state.pomodoro.timeLeftSec / 60));
        const secs = Utils.padZero(LifeOS.state.pomodoro.timeLeftSec % 60);

        if (this.display) {
            this.display.textContent = `${mins}:${secs}`;
            if (LifeOS.state.pomodoro.mode === 'break') {
                this.display.style.color = 'var(--color-success)';
            } else {
                this.display.style.color = 'var(--color-primary)';
            }
        }
    }
};

/* ============================================================================
   14. LAW SCHOOL PREPARATION ENGINE
   ============================================================================ */

const LawPrepEngine = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        console.log('[Law Prep Engine] Initialized PTN UI/UNSRI Target Strategy Module.');
    }
};

/* ============================================================================
   15. GLOBAL KEYBOARD SHORTCUTS ENGINE
   ============================================================================ */

const GlobalShortcutsEngine = {
    init() {
        document.addEventListener('keydown', (e) => {
            // Alt + 1: Dashboard
            if (e.altKey && e.key === '1') {
                EventBus.emit('navigation:request', 'dashboard');
            }
            // Alt + 2: Sekolah
            else if (e.altKey && e.key === '2') {
                EventBus.emit('navigation:request', 'school');
            }
            // Alt + 3: Gym
            else if (e.altKey && e.key === '3') {
                EventBus.emit('navigation:request', 'gym');
            }
            // Alt + W: Add Water
            else if (e.altKey && (e.key === 'w' || e.key === 'W')) {
                HydrationSystemEngine.addWater(250);
            }
            // Alt + P: Toggle Pomodoro
            else if (e.altKey && (e.key === 'p' || e.key === 'P')) {
                if (LifeOS.state.pomodoro.isRunning) {
                    PomodoroEngine.pause();
                } else {
                    PomodoroEngine.start();
                }
            }
        });
    }
};

/* ============================================================================
   16. TOUCH GESTURE ENGINE (Mobile Swipe Handlers)
   ============================================================================ */

const TouchGestureEngine = {
    init() {
        this.startX = 0;
        this.startY = 0;

        document.addEventListener('touchstart', (e) => {
            this.startX = e.changedTouches[0].screenX;
            this.startY = e.changedTouches[0].screenY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            const diffX = e.changedTouches[0].screenX - this.startX;
            const diffY = Math.abs(e.changedTouches[0].screenY - this.startY);

            if (diffY < 80) { // Horizontal Swipe Filter
                if (this.startX < 40 && diffX > 90) {
                    SidebarDrawerEngine.open();
                }
                if (LifeOS.state.sidebarOpen && diffX < -90) {
                    SidebarDrawerEngine.close();
                }
            }
        }, { passive: true });
    }
};
