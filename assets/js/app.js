(function () {
  "use strict";

  const DATA = window.ECONOVA_DATA;
  const PATHS = window.ECONOVA_LEARNING_PATHS || { literacyChapters: [], curriculum: [] };
  const QUESTION_BANK = window.ECONOVA_QUESTION_BANK || DATA.questions.map((question, index) => ({
    ...question, chapter: DATA.chapters[index % DATA.chapters.length].id, topic: "Dasar", difficulty: "mudah",
    misconception: "Pertimbangkan kembali konsep pada materi terkait.", example: "Hubungkan konsep ini dengan keputusan keuangan sehari-hari."
  }));
  const ROOT = document.getElementById("app");
  const PROFILE_KEY = "econova.profile.v1";
  const PROGRESS_PREFIX = "econova.progress.v1.";
  const AUDIO_SETTINGS_KEY = "econova.audio.v1";
  const QUIZ_SIZE = 10;
  const LEVEL_TITLES = ["Penjelajah Keuangan", "Pembelajar Cerdas", "Pengelola Uang", "Analis Muda", "Strategis Keuangan", "Arsitek Finansial"];
  const ACHIEVEMENTS = [
    { id: "first-lesson", name: "Langkah Pertama", description: "Selesaikan satu materi.", icon: "↗", check: progress => progress.completed.length >= 1 },
    { id: "five-lessons", name: "Pembelajar Aktif", description: "Selesaikan lima materi.", icon: "◇", check: progress => progress.completed.length >= 5 },
    { id: "critical-thinker", name: "Pemikir Kritis", description: "Raih nilai minimal 80% dalam kuis.", icon: "⌁", check: progress => progress.quizScores.some(score => score.percent >= 80) },
    { id: "budget-master", name: "Ahli Anggaran", description: "Selesaikan tantangan anggaran sesuai pemasukan.", icon: "◈", check: progress => progress.simulations && progress.simulations.budget === true },
    { id: "simulation-explorer", name: "Penjelajah Simulasi", description: "Coba tiga jenis simulasi yang berbeda.", icon: "⌖", check: progress => completedSimulationTypes(progress) >= 3 },
    { id: "consistent-learning", name: "Konsisten Belajar", description: "Belajar pada tiga hari yang berbeda.", icon: "⌖", check: progress => progress.studyDays.length >= 3 }
  ];
  const DAILY_MISSIONS = [
    { id: "daily-lesson", title: "Selesaikan satu materi", type: "lesson", goal: 1, reward: 10, href: "#/learn" },
    { id: "daily-quiz", title: "Uji pemahamanmu", type: "quiz", goal: 1, reward: 10, href: "#/quiz" },
    { id: "daily-simulation", title: "Coba satu simulasi", type: "simulation", goal: 1, reward: 10, href: "#/simulations" }
  ];
  const WEEKLY_MISSIONS = [
    { id: "weekly-lessons", title: "Selesaikan tiga materi", type: "lesson", goal: 3, reward: 25, href: "#/learn" },
    { id: "weekly-quizzes", title: "Selesaikan dua sesi kuis", type: "quiz", goal: 2, reward: 20, href: "#/quiz" },
    { id: "weekly-simulations", title: "Jelajahi tiga simulasi berbeda", type: "simulation", goal: 3, reward: 25, href: "#/simulations", distinct: true }
  ];
  const DECISION_CHALLENGES = [
    {
      id: "priority-budget", title: "Menyusun prioritas anggaran",
      prompt: "Uang yang tersedia Rp180.000. Ongkos pulang Rp30.000 dan makan sekolah tiga hari belum disiapkan. Teman menawarkan aksesori Rp90.000.",
      choices: [
        { label: "Amankan ongkos dan makan dahulu, lalu hitung sisa", result: "Kewajiban dan kebutuhan dekat diprioritaskan. Setelah jumlahnya jelas, kamu dapat menilai apakah masih ada ruang untuk keinginan.", safe: true },
        { label: "Beli aksesori karena stoknya terbatas", result: "Tekanan waktu dapat membuat kebutuhan penting terabaikan. Periksa sisa uang dan konsekuensi terlebih dahulu.", safe: false },
        { label: "Gunakan seluruh uang untuk belanja lalu pinjam jika perlu", result: "Pinjaman menambah kewajiban dan belum tentu tersedia. Buat rencana berdasarkan kemampuan yang ada.", safe: false }
      ]
    },
    {
      id: "unexpected-expense", title: "Menghadapi pengeluaran mendadak",
      prompt: "Sepeda yang kamu gunakan ke sekolah perlu diperbaiki. Tabungan cadanganmu terbatas dan ada beberapa pilihan biaya.",
      choices: [
        { label: "Cari estimasi biaya, cek pilihan perbaikan, dan sesuaikan anggaran", result: "Mengumpulkan informasi dan membandingkan pilihan membantu menghindari keputusan tergesa-gesa. Gunakan cadangan sesuai kebutuhan dan kemampuan.", safe: true },
        { label: "Langsung ambil pinjaman tanpa memeriksa biaya", result: "Biaya, tenggat, dan kemampuan membayar dapat berbeda. Pahami kewajiban dan bandingkan pilihan sebelum menyetujui pinjaman.", safe: false },
        { label: "Abaikan perbaikan dan gunakan uang kebutuhan pokok untuk hal lain", result: "Menunda bisa berdampak pada perjalanan dan keselamatan. Tinjau urgensi, opsi bantuan, dan biaya terlebih dahulu.", safe: false }
      ]
    },
    {
      id: "savings-target", title: "Menentukan target tabungan",
      prompt: "Kamu ingin membeli alat belajar seharga Rp360.000 dalam 12 minggu. Setoran yang realistis perlu disesuaikan dengan kebutuhan harian.",
      choices: [
        { label: "Hitung rata-rata Rp30.000 per minggu dan tinjau apakah sesuai kemampuan", result: "Target dibagi periode memberi perkiraan setoran. Jika terlalu berat, ubah waktu atau target tanpa mengorbankan kebutuhan penting.", safe: true },
        { label: "Sisihkan semua uang saku agar target pasti cepat tercapai", result: "Menyisihkan seluruh uang dapat mengabaikan kebutuhan dan kewajiban. Rencana sebaiknya berkelanjutan dan sesuai kemampuan.", safe: false },
        { label: "Pinjam untuk memenuhi target sekarang tanpa menghitung cicilan", result: "Pinjaman membawa kewajiban. Bandingkan biaya dan kemampuan membayar; target tabungan tidak perlu dicapai dengan keputusan yang tidak terencana.", safe: false }
      ]
    },
    {
      id: "spot-scam", title: "Mengenali penipuan finansial",
      prompt: "Sebuah pesan menawarkan hadiah besar dan meminta OTP dalam waktu lima menit melalui tautan yang dikirim.",
      choices: [
        { label: "Jangan bagikan OTP; hentikan komunikasi dan periksa lewat kanal resmi", result: "OTP adalah informasi rahasia. Jangan gunakan tautan di pesan; cari sendiri kanal resmi penyedia layanan untuk memeriksa klaim.", safe: true },
        { label: "Kirim OTP agar hadiah tidak hangus", result: "Kode dapat digunakan untuk menyetujui akses atau transaksi. Hadiah yang mendesak dan meminta kode rahasia adalah tanda bahaya.", safe: false },
        { label: "Teruskan pesan dan tautannya ke teman", result: "Meneruskan tautan dapat memperluas risiko. Hentikan komunikasi dan bantu teman dengan mengingatkan agar tidak membagikan kode.", safe: false }
      ]
    },
    {
      id: "investment-risk", title: "Memahami risiko investasi",
      prompt: "Iklan menyebut suatu investasi pasti untung tinggi tanpa risiko dan meminta transfer hari ini.",
      choices: [
        { label: "Jeda, verifikasi pihak dan informasi melalui kanal resmi, pahami kemungkinan rugi", result: "Potensi hasil tidak dijamin. Verifikasi pihak, cara kerja, biaya, dan risiko dari sumber resmi yang dicari sendiri sebelum mengambil keputusan.", safe: true },
        { label: "Transfer segera karena hasilnya dijamin", result: "Klaim hasil tinggi yang pasti tanpa risiko dan tekanan waktu patut dicurigai. Investasi selalu memiliki ketidakpastian.", safe: false },
        { label: "Meminjam uang untuk memperbesar investasi", result: "Meminjam dapat memperbesar kerugian dan menambah kewajiban, sementara hasil investasi tidak pasti.", safe: false }
      ]
    }
  ];
  let toastTimer;
  let quizState = null;
  let currentStudentTab = true;
  let audioSettings = loadAudioSettings();
  let audioContext = null;
  let audioUnlocked = false;
  let activeAudioNodes = [];
  let activeCuePriority = 0;
  let activeCueTimer = null;
  let audioRequestId = 0;
  let audioErrorReported = false;

  function readStore(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.error("ECONOVA: penyimpanan lokal tidak dapat dibaca.", error);
      return fallback;
    }
  }

  function writeStore(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("ECONOVA: penyimpanan lokal tidak dapat ditulis.", error);
      showToast("Penyimpanan browser tidak tersedia. Progres sesi ini mungkin tidak tersimpan.", true);
      return false;
    }
  }

  function loadAudioSettings() {
    const stored = readStore(AUDIO_SETTINGS_KEY, {});
    return {
      muted: stored && typeof stored.muted === "boolean" ? stored.muted : false,
      effectVolume: stored && Number.isFinite(stored.effectVolume) ? Math.max(0, Math.min(1, stored.effectVolume)) : 0.2
    };
  }

  function saveAudioSettings() {
    try {
      localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(audioSettings));
      return true;
    } catch (error) {
      console.error("ECONOVA: preferensi audio tidak dapat disimpan.", error);
      showToast("Preferensi audio tidak dapat disimpan di browser ini.", true);
      return false;
    }
  }

  function audioContextSupported() {
    return typeof window.AudioContext === "function" || typeof window.webkitAudioContext === "function";
  }

  function audioSupportDescription() {
    if (!audioContextSupported()) return "Efek suara tidak didukung browser ini.";
    return audioSettings.muted
      ? "Efek suara dimatikan."
      : "Efek suara aktif setelah interaksi pertama.";
  }

  function reportAudioError(message, error) {
    if (error) console.error("ECONOVA: " + message, error);
    if (audioErrorReported) return;
    audioErrorReported = true;
    showToast(message, true);
  }

  function playAudioCue(name) {
    if (!audioUnlocked || audioSettings.muted || audioSettings.effectVolume <= 0 || !audioContextSupported()) return;
    const cues = {
      click: { priority: 0, notes: [[720, 0, 0.035, "sine"]] },
      navigation: { priority: 0, notes: [[560, 0, 0.05, "sine"]] },
      correct: { priority: 2, notes: [[523.25, 0, 0.12, "sine"], [659.25, 0.075, 0.15, "sine"]] },
      incorrect: { priority: 2, notes: [[220, 0, 0.14, "sine"], [196, 0.08, 0.16, "sine"]] },
      xp: { priority: 1, notes: [[587.33, 0, 0.1, "sine"], [739.99, 0.08, 0.13, "sine"]] },
      complete: { priority: 3, notes: [[493.88, 0, 0.13, "sine"], [659.25, 0.1, 0.2, "sine"]] },
      path: { priority: 4, notes: [[440, 0, 0.14, "sine"], [554.37, 0.1, 0.15, "sine"], [659.25, 0.2, 0.22, "sine"]] },
      level: { priority: 5, notes: [[440, 0, 0.14, "sine"], [554.37, 0.1, 0.15, "sine"], [659.25, 0.2, 0.22, "sine"]] },
      achievement: { priority: 6, notes: [[523.25, 0, 0.13, "sine"], [659.25, 0.1, 0.14, "sine"], [783.99, 0.2, 0.18, "sine"], [1046.5, 0.31, 0.24, "sine"]] }
    };
    const cue = cues[name];
    if (!cue || cue.priority < activeCuePriority) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!audioContext) audioContext = new AudioContextClass();
      const requestId = ++audioRequestId;
      activeCuePriority = cue.priority;
      clearTimeout(activeCueTimer);
      const schedule = () => {
        if (requestId !== audioRequestId) return;
        if (audioSettings.muted || audioSettings.effectVolume <= 0 || !audioUnlocked || audioContext.state === "closed") {
          activeCuePriority = 0;
          return;
        }
        activeAudioNodes.forEach(node => {
          try { node.stop(); } catch (error) { /* Already stopped. */ }
        });
        activeAudioNodes = [];
        const now = audioContext.currentTime;
        cue.notes.forEach(([frequency, offset, duration, waveform]) => {
          const oscillator = audioContext.createOscillator();
          const gain = audioContext.createGain();
          const start = now + offset;
          const peak = audioSettings.effectVolume * 0.22;
          oscillator.type = waveform;
          oscillator.frequency.setValueAtTime(frequency, start);
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + 0.012);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
          oscillator.connect(gain);
          gain.connect(audioContext.destination);
          oscillator.onended = () => {
            oscillator.disconnect();
            gain.disconnect();
          };
          oscillator.start(start);
          oscillator.stop(start + duration + 0.01);
          activeAudioNodes.push(oscillator);
        });
        activeCueTimer = setTimeout(() => {
          if (requestId === audioRequestId) activeCuePriority = 0;
        }, 700);
      };
      if (audioContext.state === "suspended") {
        audioContext.resume().then(schedule).catch(error => {
          if (requestId === audioRequestId) stopAudioCues();
          reportAudioError("Efek suara tidak dapat dimulai di browser ini.", error);
        });
      } else {
        schedule();
      }
    } catch (error) {
      stopAudioCues();
      reportAudioError("Efek suara tidak tersedia di browser ini.", error);
    }
  }

  function stopAudioCues() {
    audioRequestId++;
    activeCuePriority = 0;
    clearTimeout(activeCueTimer);
    activeCueTimer = null;
    activeAudioNodes.forEach(node => {
      try { node.stop(); } catch (error) { /* Already stopped. */ }
    });
    activeAudioNodes = [];
  }

  function renderAudioSettings() {
    return `<details class="audio-settings"><summary>Suara</summary><div class="audio-settings-panel" aria-label="Pengaturan efek suara"><label class="audio-toggle"><input type="checkbox" data-audio-setting="enabled" ${audioSettings.muted ? "" : "checked"}> Efek suara aktif</label><label class="audio-range" for="audio-volume">Volume efek <span data-volume-value>${Math.round(audioSettings.effectVolume * 100)}%</span></label><input id="audio-volume" type="range" min="0" max="1" step="0.05" value="${audioSettings.effectVolume}" data-audio-setting="effectVolume" ${audioSettings.muted ? "disabled" : ""}><p class="audio-support" role="status">${audioSupportDescription()}</p></div></details>`;
  }

  function profile() {
    const value = readStore(PROFILE_KEY, null);
    return value && typeof value === "object" && typeof value.id === "string" && ["student", "admin-demo"].includes(value.role) &&
      (value.role === "admin-demo" || (typeof value.name === "string" && typeof value.className === "string"))
      ? value : null;
  }
  function progressFor(id) {
    const stored = readStore(PROGRESS_PREFIX + id, null);
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return emptyProgress();
    const reviewQuestions = {};
    if (stored.reviewQuestions && typeof stored.reviewQuestions === "object" && !Array.isArray(stored.reviewQuestions)) {
      Object.entries(stored.reviewQuestions).forEach(([questionId, record]) => {
        if (QUESTION_BANK.some(question => question.id === questionId) && record && Number.isFinite(record.count) && record.count > 0 && typeof record.lastDate === "string" && Number.isFinite(Date.parse(record.lastDate))) {
          reviewQuestions[questionId] = { count: Math.floor(record.count), lastDate: record.lastDate };
        }
      });
    }
    const reviewLessons = {};
    if (stored.reviewLessons && typeof stored.reviewLessons === "object" && !Array.isArray(stored.reviewLessons)) {
      Object.entries(stored.reviewLessons).forEach(([lessonId, record]) => {
        if (allLessons().some(lesson => lesson.id === lessonId) && record && Number.isFinite(record.count) && record.count > 0 && typeof record.lastDate === "string" && Number.isFinite(Date.parse(record.lastDate))) {
          reviewLessons[lessonId] = { count: Math.floor(record.count), lastDate: record.lastDate };
        }
      });
    }
    return {
      schemaVersion: 2,
      completed: Array.isArray(stored.completed) ? [...new Set(stored.completed.filter(value => typeof value === "string" && allLessons().some(lesson => lesson.id === value)))] : [],
      practiced: Array.isArray(stored.practiced) ? [...new Set(stored.practiced.filter(value => typeof value === "string" && allLessons().some(lesson => lesson.id === value)))] : [],
      xp: Number.isFinite(stored.xp) && stored.xp >= 0 ? stored.xp : 0,
      quizScores: Array.isArray(stored.quizScores) ? stored.quizScores.filter(score => score && Number.isFinite(score.percent) && score.percent >= 0 && score.percent <= 100 && Number.isFinite(Date.parse(score.date))) : [],
      lastLesson: typeof stored.lastLesson === "string" ? stored.lastLesson : null,
      lastCompletion: stored.lastCompletion && typeof stored.lastCompletion.lessonId === "string" &&
        allLessons().some(lesson => lesson.id === stored.lastCompletion.lessonId) &&
        Number.isFinite(stored.lastCompletion.xpEarned) && stored.lastCompletion.xpEarned >= 0 &&
        typeof stored.lastCompletion.date === "string" && Number.isFinite(Date.parse(stored.lastCompletion.date))
        ? {
          lessonId: stored.lastCompletion.lessonId,
          xpEarned: stored.lastCompletion.xpEarned,
          date: stored.lastCompletion.date,
          achievements: Array.isArray(stored.lastCompletion.achievements)
            ? [...new Set(stored.lastCompletion.achievements.filter(id => ACHIEVEMENTS.some(item => item.id === id)))] : [],
          levelUp: Number.isInteger(stored.lastCompletion.levelUp) && stored.lastCompletion.levelUp > 1 ? stored.lastCompletion.levelUp : null
        } : null,
      rewardIds: Array.isArray(stored.rewardIds) ? stored.rewardIds.filter(value => typeof value === "string") : [],
      studyDays: Array.isArray(stored.studyDays) ? [...new Set(stored.studyDays.filter(value => /^\d{4}-\d{2}-\d{2}$/.test(value)))].slice(-120) : [],
      reviewQuestions, reviewLessons,
      activities: Array.isArray(stored.activities) ? stored.activities.filter(item => item && typeof item.text === "string").slice(-20) : [],
      simulations: stored.simulations && typeof stored.simulations === "object" && !Array.isArray(stored.simulations) ? stored.simulations : {},
      missionEvents: Array.isArray(stored.missionEvents) ? stored.missionEvents.filter(event =>
        event && typeof event.id === "string" && ["lesson", "quiz", "simulation"].includes(event.type) &&
        typeof event.detail === "string" && typeof event.day === "string" && typeof event.week === "string" &&
        typeof event.at === "string" && Number.isFinite(Date.parse(event.at))
      ).slice(-500) : [],
      quizTopicResults: Array.isArray(stored.quizTopicResults) ? stored.quizTopicResults.filter(item =>
        item && typeof item.chapter === "string" && typeof item.topic === "string" &&
        Number.isInteger(item.correct) && item.correct >= 0 && Number.isInteger(item.total) && item.total > 0 &&
        item.correct <= item.total && typeof item.date === "string" && Number.isFinite(Date.parse(item.date))
      ).slice(-200) : [],
      achievements: Array.isArray(stored.achievements) ? stored.achievements.filter(value => typeof value === "string") : []
    };
  }
  function emptyProgress() {
    return { schemaVersion: 2, completed: [], practiced: [], xp: 0, quizScores: [], lastLesson: null, lastCompletion: null, rewardIds: [], studyDays: [], reviewQuestions: {}, reviewLessons: {}, activities: [], simulations: {}, missionEvents: [], quizTopicResults: [], achievements: [] };
  }
  function completedSimulationTypes(progress) {
    const simulations = progress.simulations || {};
    return Object.values(simulations).filter(value => value === true).length +
      (Array.isArray(simulations.scenarios) && simulations.scenarios.length > 0 ? 1 : 0) +
      (simulations.lifeSimulator && Number.isFinite(Date.parse(simulations.lifeSimulator.date)) ? 1 : 0) +
      (simulations.decisionChallenges && typeof simulations.decisionChallenges === "object" &&
        Object.values(simulations.decisionChallenges).some(record => record && record.completed === true) ? 1 : 0);
  }
  function saveProgress(progress) {
    const active = profile();
    if (!active) return false;
    progress.schemaVersion = 2;
    progress.achievements = ACHIEVEMENTS.filter(achievement => achievement.check(progress)).map(achievement => achievement.id);
    const key = PROGRESS_PREFIX + active.id;
    let previous = null;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) previous = parsed;
      }
    } catch (error) {
      console.error("ECONOVA: progres sebelumnya tidak dapat diperiksa.", error);
    }
    const saved = writeStore(key, progress);
    if (!saved) return false;

    const previousAchievements = previous && Array.isArray(previous.achievements) ? previous.achievements : [];
    const previousCompleted = previous && Array.isArray(previous.completed) ? previous.completed : [];
    const previousXp = previous && Number.isFinite(previous.xp) ? previous.xp : 0;
    const newAchievement = progress.achievements.some(id => !previousAchievements.includes(id));
    const levelUp = levelInfo(progress.xp).level > levelInfo(previousXp).level;
    const newLessonId = progress.completed.find(id => !previousCompleted.includes(id));
    const lesson = newLessonId && allLessons().find(item => item.id === newLessonId);
    const lessonPath = lesson && pathLessons(lesson.track);
    const pathCompleted = Boolean(lessonPath && lessonPath.length &&
      lessonPath.every(item => progress.completed.includes(item.id)) &&
      !lessonPath.every(item => previousCompleted.includes(item.id)));
    const latestScore = progress.quizScores[progress.quizScores.length - 1];
    const previousScores = previous && Array.isArray(previous.quizScores) ? previous.quizScores : [];
    const previousLatestScore = previousScores[previousScores.length - 1];
    const quizCompleted = Boolean(latestScore && (!previousLatestScore ||
      (latestScore.eventId && latestScore.eventId !== previousLatestScore.eventId) ||
      latestScore.date !== previousLatestScore.date));

    if (newAchievement) playAudioCue("achievement");
    else if (levelUp) playAudioCue("level");
    else if (pathCompleted) playAudioCue("path");
    else if (newLessonId || quizCompleted) playAudioCue("complete");
    else if (progress.xp > previousXp) playAudioCue("xp");
    return saved;
  }
  function levelInfo(xp) {
    const knownThresholds = [0, 100, 250, 450, 700, 1000];
    let level = 1;
    let floor = 0;
    let next = 100;
    while (xp >= next) {
      level++;
      floor = next;
      next = level < knownThresholds.length ? knownThresholds[level] : floor + 300;
    }
    return {
      level,
      title: LEVEL_TITLES[level - 1] || "Arsitek Keuangan",
      floor,
      next,
      progress: Math.max(0, Math.min(100, Math.round((xp - floor) / (next - floor) * 100))),
      remaining: Math.max(0, next - xp)
    };
  }
  function grantReward(progress, rewardId, amount) {
    progress.rewardIds = progress.rewardIds || [];
    if (progress.rewardIds.includes(rewardId)) return false;
    progress.rewardIds.push(rewardId);
    progress.xp += amount;
    return true;
  }
  function currentWeekKey(date) {
    const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
    return localDateKey(monday);
  }
  function recordMissionEvent(progress, type, detail, id) {
    progress.missionEvents = progress.missionEvents || [];
    if (progress.missionEvents.some(event => event.id === id)) return false;
    const now = new Date();
    progress.missionEvents.push({
      id, type, detail, at: now.toISOString(), day: localDateKey(now), week: currentWeekKey(now)
    });
    progress.missionEvents = progress.missionEvents.slice(-500);
    return true;
  }
  function createEventId(prefix) {
    const random = window.crypto && typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    return `${prefix}:${random}`;
  }
  function missionProgress(progress, mission, period, periodKey) {
    const events = (progress.missionEvents || []).filter(event =>
      event.type === mission.type && event[period] === periodKey
    );
    return mission.distinct ? new Set(events.map(event => event.detail)).size : new Set(events.map(event => event.id)).size;
  }
  function grantCompletedMissions(progress) {
    const now = new Date();
    const periods = [
      { scope: "daily", key: localDateKey(now), field: "day", missions: DAILY_MISSIONS },
      { scope: "weekly", key: currentWeekKey(now), field: "week", missions: WEEKLY_MISSIONS }
    ];
    const earned = [];
    periods.forEach(period => period.missions.forEach(mission => {
      const progressValue = missionProgress(progress, mission, period.field, period.key);
      const rewardId = `mission:${period.scope}:${period.key}:${mission.id}`;
      if (progressValue >= mission.goal && grantReward(progress, rewardId, mission.reward)) {
        earned.push({ title: mission.title, xp: mission.reward });
      }
    }));
    return earned;
  }
  function missionCardHtml(mission, value, rewardId, rewardIds) {
    const complete = value >= mission.goal;
    const claimed = rewardIds.includes(rewardId);
    return `<article class="surface mission-card ${complete ? "mission-complete" : ""}"><span class="eyebrow">${complete ? "MISI TUNTAS" : "MISI BELAJAR"}</span><h2>${escapeHtml(mission.title)}</h2><p>${mission.distinct ? `${mission.goal} jenis simulasi berbeda` : `${mission.goal} aktivitas tercatat`} · hadiah ${mission.reward} XP</p><div class="mission-progress" role="progressbar" aria-label="${escapeHtml(mission.title)}" aria-valuemin="0" aria-valuemax="${mission.goal}" aria-valuenow="${Math.min(value, mission.goal)}"><span style="width:${Math.min(value / mission.goal * 100, 100)}%"></span></div><div class="split small muted"><span>${Math.min(value, mission.goal)}/${mission.goal} langkah</span>${complete ? `<strong>${claimed ? "Hadiah diterima ✓" : "Selesai ✓"}</strong>` : `<a class="text-link" href="${mission.href}">Mulai →</a>`}</div></article>`;
  }
  function recordStudyDay(progress) {
    const today = localDateKey(new Date());
    progress.studyDays = progress.studyDays || [];
    if (!progress.studyDays.includes(today)) progress.studyDays.push(today);
    progress.studyDays = progress.studyDays.slice(-120);
  }
  function recordActivity(progress, text) {
    progress.activities = progress.activities || [];
    progress.activities.push({ text, date: new Date().toISOString() });
    progress.activities = progress.activities.slice(-20);
  }
  function currentStreak(progress) {
    const days = new Set(progress.studyDays || []);
    const today = new Date();
    let count = 0;
    for (let offset = 0; offset < 366; offset++) {
      const day = new Date(today);
      day.setDate(today.getDate() - offset);
      const key = localDateKey(day);
      if (!days.has(key)) {
        if (offset === 0) continue;
        break;
      }
      count++;
    }
    return count;
  }
  function localDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }
  function route() {
    const hash = location.hash.replace(/^#\/?/, "");
    return hash || (profile() ? "dashboard" : "home");
  }
  function go(path) {
    const target = "#/" + path;
    if (location.hash === target) render();
    else location.hash = target;
  }
  function showToast(message, error) {
    let element = document.querySelector(".toast");
    if (!element) {
      element = document.createElement("div");
      element.className = "toast";
      element.setAttribute("role", "status");
      element.setAttribute("aria-live", "polite");
      document.body.appendChild(element);
    }
    element.textContent = message;
    element.classList.toggle("error", Boolean(error));
    element.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.classList.remove("show"), 3400);
  }
  function showLevelUp(level) {
    showToast(`Naik level ${level.level} · ${level.title}!`);
    const element = document.querySelector(".toast");
    if (element) {
      element.classList.remove("level-up");
      void element.offsetWidth;
      element.classList.add("level-up");
    }
  }
  function allLessons() {
    const foundation = DATA.chapters.flatMap(chapter => chapter.lessons.map(lesson => ({ ...lesson, chapter: { ...chapter, track: "legacy" }, track: "legacy" })));
    const literacy = PATHS.literacyChapters.flatMap(chapter => chapter.lessons.map(lesson => ({ ...lesson, chapter, track: "literacy" })));
    const curriculum = PATHS.curriculum.flatMap(chapter => chapter.lessons.map(lesson => ({ ...lesson, chapter: { ...chapter, number: String(chapter.grade), track: "curriculum" }, track: "curriculum", grade: chapter.grade, sourceChapter: chapter })));
    return foundation.concat(literacy, curriculum);
  }
  function allChapters() { return DATA.chapters.map(chapter => ({ ...chapter, track: "legacy" })).concat(PATHS.literacyChapters.map(chapter => ({ ...chapter, track: "literacy" }))); }
  function findChapter(id) {
    const chapter = allChapters().find(item => item.id === id);
    if (chapter) return chapter;
    const curriculumChapter = PATHS.curriculum.find(item => item.id === id);
    return curriculumChapter ? { ...curriculumChapter, track: "curriculum" } : null;
  }
  function chapterLessons(chapter) {
    if (chapter.track === "curriculum") return chapter.lessons.map(lesson => ({ ...lesson, chapter: { ...chapter, number: String(chapter.grade), track: "curriculum" }, track: "curriculum", grade: chapter.grade }));
    return allLessons().filter(lesson => lesson.chapter.id === chapter.id);
  }
  function pathLessons(track) {
    if (track === "legacy") return DATA.chapters.flatMap(chapter => chapter.lessons.map(lesson => ({
      ...lesson, chapter: { ...chapter, track: "legacy" }, track: "legacy"
    })));
    if (track === "literacy") return PATHS.literacyChapters.flatMap(chapter => chapter.lessons.map(lesson => ({
      ...lesson, chapter, track: "literacy"
    })));
    if (track === "curriculum") return PATHS.curriculum
      .flatMap(chapter => chapter.lessons.map(lesson => ({
        ...lesson, chapter: { ...chapter, number: String(chapter.grade), track: "curriculum" },
        track: "curriculum", grade: chapter.grade
      })));
    return [];
  }
  function nextPathLesson(lesson, progress) {
    const lessons = pathLessons(lesson.track);
    const currentIndex = lessons.findIndex(item => item.id === lesson.id);
    const currentProgress = progress || progressFor(profile().id);
    return lessons.slice(currentIndex + 1).find(item => !currentProgress.completed.includes(item.id)) ||
      lessons.find(item => !currentProgress.completed.includes(item.id)) || null;
  }
  function learningPathHref(lesson) {
    if (lesson.track === "legacy") return "#/learn";
    if (lesson.track === "literacy") return "#/literacy";
    return "#/curriculum";
  }
  function learningPathName(lesson) {
    if (lesson.track === "legacy") return "Fondasi keuangan";
    if (lesson.track === "literacy") return "Jalur Literasi Keuangan";
    return "Kurikulum Ekonomi Kelas 10–12";
  }
  function firstUncompletedLesson(progress) {
    const currentProgress = progress || progressFor(profile().id);
    return allLessons().find(lesson => !currentProgress.completed.includes(lesson.id)) || null;
  }
  function nextLesson(progress) {
    return allLessons().find(lesson => !progress.completed.includes(lesson.id)) || null;
  }
  function progressPercent(progress) {
    return Math.round((progress.completed.length / allLessons().length) * 100);
  }
  function brand() {
    return `<a class="brand" href="#/home" aria-label="ECONOVA, beranda"><img class="brand-logo" src="assets/images/econova-mark.png" alt=""><span class="brand-wording"><span>ECONOVA</span><small>FINANCIAL LITERACY</small></span></a>`;
  }
  function shell(content, active) {
    const user = profile();
    const nav = user && user.role === "student"
      ? `<nav class="topbar-nav" aria-label="Navigasi utama">
          <a href="#/dashboard" ${active === "dashboard" ? 'aria-current="page"' : ""}>Beranda</a>
          <a href="#/learn" ${active === "learn" || active === "lesson" || active === "curriculum" || active === "literacy" || active === "map" ? 'aria-current="page"' : ""}>Belajar</a>
          <a href="#/simulations" ${active === "simulations" ? 'aria-current="page"' : ""}>Simulasi</a>
          <a href="#/quiz" ${active === "quiz" ? 'aria-current="page"' : ""}>Kuis</a>
          <a href="#/progress" ${active === "progress" ? 'aria-current="page"' : ""}>Progres</a>
          <a href="#/map" ${active === "map" ? 'aria-current="page"' : ""}>Peta</a>
          <details class="nav-more"><summary>Menu</summary><div class="nav-more-menu"><a href="#/finance-lab">Finance Calculator Lab</a><a href="#/challenges">Tantangan keputusan</a><a href="#/life-simulator">Simulator kehidupan</a><a href="#/insights">Insight belajar</a><a href="#/review">Ulangi materi</a><a href="#/achievements">Misi & pencapaian</a><a href="#/profile">Profil & pengaturan</a></div></details>
        </nav>`
      : "";
    const actions = user
      ? `<div class="topbar-actions">${renderAudioSettings()}<span class="small muted">${escapeHtml(user.name || "Admin demo")}</span><button class="button button-quiet" data-action="logout">Keluar</button></div>`
      : `<div class="topbar-actions">${renderAudioSettings()}<a class="button button-quiet" href="#/home#login">Masuk</a></div>`;
    return `<div class="app-shell"><header class="topbar"><div class="topbar-inner">${brand()}${nav}${actions}</div></header><main id="main" class="page-scene scene-${active || "default"}">${content}</main><footer class="footer"><div class="footer-inner"><span>ECONOVA · Belajar keuangan, mulai dari hidupmu.</span><span>Materi edukasi, bukan saran investasi. Data progres tersimpan lokal di browser.</span></div></footer></div>`;
  }
  function loginView() {
    return `<div class="landing">
      <div class="page-wrap">
        <section class="hero" aria-labelledby="hero-title">
          <div><span class="eyebrow">Pahami uang. Pilih dengan sadar.</span><h1 id="hero-title">Keuangan nyata,<br><span>belajar lebih bermakna.</span></h1>
            <p class="lead">Belajar mengelola uang lewat cerita sehari-hari, latihan singkat, dan simulasi yang aman untuk dicoba.</p>
            <div class="hero-actions"><a class="button button-primary" href="#login">Mulai belajar <span aria-hidden="true">→</span></a><a class="button button-secondary" href="#tentang">Kenali ECONOVA</a></div>
            <p class="hero-note">Gratis · Tanpa email · Progres disimpan di browser ini</p>
          </div>
          <div class="orbit-art" aria-hidden="true"><span class="orbit"></span><span class="orbit two"></span><span class="orbit-dot"></span><span class="orbit-dot two"></span><span class="orbit-core"><span class="orbit-nucleus"></span></span></div>
        </section>
        <section class="feature-strip" id="tentang" aria-label="Cara belajar"><div class="feature-item"><span class="feature-symbol">↗</span><span>Materi dekat dengan keseharian</span></div><div class="feature-item"><span class="feature-symbol">⌁</span><span>Simulasi tanpa transaksi nyata</span></div><div class="feature-item"><span class="feature-symbol">◇</span><span>Belajar sesuai ritmemu</span></div></section>
        <section class="login-section" id="login" aria-labelledby="login-heading">
          <div class="login-intro"><span class="eyebrow">Mulai dari sini</span><h2 id="login-heading">Ruang belajar<br>untuk semua.</h2><p class="muted">Pilih masuk sebagai siswa untuk menyimpan progres belajar lokal, atau buka dashboard admin demo untuk melihat contoh pengelolaan materi.</p></div>
          <div class="surface login-card">
            <div class="tab-list" role="tablist" aria-label="Jenis akun">
              <button class="tab-button" role="tab" id="tab-student" aria-controls="panel-student" aria-selected="${currentStudentTab}">Siswa</button>
              <button class="tab-button" role="tab" id="tab-admin" aria-controls="panel-admin" aria-selected="${!currentStudentTab}">Admin demo</button>
            </div>
            <section id="panel-student" role="tabpanel" aria-labelledby="tab-student" ${currentStudentTab ? "" : "hidden"}>
              <form id="student-form" novalidate>
                <div class="field"><label for="student-name">Nama lengkap</label><input id="student-name" name="name" autocomplete="name" maxlength="60" placeholder="Contoh: Alya Putri" required><p class="help">Gunakan nama panggilan jika lebih nyaman.</p></div>
                <div class="field"><label for="student-class">Kelas atau peran</label><input id="student-class" name="className" maxlength="40" placeholder="Contoh: XI RPL 1 atau Umum" required></div>
                <p class="form-message" id="student-error" role="alert"></p><button class="button button-primary" type="submit">Mulai belajar <span aria-hidden="true">→</span></button>
              </form>
              <p class="notice" style="margin-top:18px">Profil hanya tersimpan di browser ini, tidak terverifikasi, dan tidak tersinkron otomatis antarperangkat. Jangan masukkan data sensitif.</p>
            </section>
            <section id="panel-admin" role="tabpanel" aria-labelledby="tab-admin" ${!currentStudentTab ? "" : "hidden"}>
              <span class="demo-label">DEMO · TANPA AUTENTIKASI</span><h3 style="margin:17px 0 8px">Pratinjau ruang pengelola</h3><p class="muted small">Tidak ada password admin pada versi ini. Dashboard hanya menampilkan contoh pengelolaan konten dan data progres demo lokal.</p>
              <div class="notice">Dashboard ini bukan sistem admin sungguhan. Perubahan tidak tersimpan ke server dan tidak dibagikan ke pengguna lain. Integrasi autentikasi dan backend diperlukan sebelum penggunaan nyata.</div>
              <button class="button button-violet" style="margin-top:19px" data-action="admin-enter">Lihat admin demo</button>
            </section>
          </div>
        </section>
      </div>
    </div>`;
  }
  function dashboardView() {
    const user = profile();
    const progress = progressFor(user.id);
    const next = nextLesson(progress);
    const level = levelInfo(progress.xp);
    const latestScore = progress.quizScores[progress.quizScores.length - 1];
    const latestActivity = progress.activities[progress.activities.length - 1];
    const recentAchievement = ACHIEVEMENTS.filter(item => item.check(progress)).slice(-1)[0];
    const isNew = progress.completed.length === 0 && progress.quizScores.length === 0 && !latestActivity;
    const streak = currentStreak(progress);
    return shell(`<div class="page-wrap">
      <section class="welcome-panel surface"><div class="welcome-copy"><span class="eyebrow">Halo, ${escapeHtml(user.name)}</span><h1>${isNew ? "Mulai dari satu langkah kecil." : next ? "Selangkah lebih paham." : "Seluruh materi selesai."}</h1><p>${isNew ? "Belum ada aktivitas belajar yang tercatat. Mulai dengan materi pendek dan bangun ritmemu sendiri." : next ? "Belajar keuangan tidak harus sekaligus. Lanjutkan satu materi kecil, lalu gunakan pengetahuan itu untuk keputusan sehari-hari." : "Kamu telah menyelesaikan semua materi yang tersedia. Jelajahi jalur lain atau ulangi materi sesuai kebutuhan."}<br>${!isNew && latestActivity ? `<span class="small">Aktivitas terakhir: ${escapeHtml(latestActivity.text)} · ${new Date(latestActivity.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>` : ""}</p><a class="button button-primary" href="${next ? `#/lesson/${next.id}` : "#/learn"}">${isNew ? "Mulai materi pertama" : next ? "Lanjutkan belajar" : "Jelajahi Learning Path"} <span aria-hidden="true">→</span></a>${next ? `<p class="small muted" style="margin:15px 0 0">${escapeHtml(next.chapter.title)} · ${escapeHtml(next.title)}</p>` : ""}</div><div class="energy-core" aria-hidden="true"><span class="energy-ring energy-ring--outer"></span><span class="energy-ring energy-ring--inner"></span><span class="energy-ring energy-ring--orbit"></span><span class="energy-orb"><span class="energy-nucleus"></span></span><span class="energy-node energy-node--one"></span><span class="energy-node energy-node--two"></span><span class="energy-node energy-node--three"></span></div></section>
      <section class="level-panel surface-soft" aria-label="Level dan pengalaman"><div class="split"><div><span class="eyebrow">Level ${level.level} · ${escapeHtml(level.title)}</span><p class="muted small" style="margin:5px 0 0">${progress.xp} XP · ${level.remaining} XP menuju level berikutnya</p></div><strong class="level-number">${level.level}</strong></div><div class="lesson-progress" role="progressbar" aria-label="Progres level" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${level.progress}"><span style="width:${level.progress}%"></span></div><div class="level-foot"><span>${level.progress}% ke level berikutnya</span><span>${progress.completed.length}/${allLessons().length} materi selesai · ${streak ? streak + " hari beruntun" : "mulai ritme belajarmu"}</span></div></section>
      <section class="dashboard-insights" aria-label="Ringkasan aktivitas"><div><span class="eyebrow">Kuis terakhir</span><p>${latestScore ? `${latestScore.correct}/${latestScore.total} benar · ${latestScore.percent}%` : "Belum ada hasil kuis. Coba latihan tanpa tekanan."}</p></div><div><span class="eyebrow">Pencapaian</span><p>${recentAchievement ? `${escapeHtml(recentAchievement.name)} terbuka` : "Pencapaian pertamamu menunggu."}</p></div><div><span class="eyebrow">Perlu diulang</span><p>${Object.keys(progress.reviewQuestions).length + Object.keys(progress.reviewLessons).length ? `${Object.keys(progress.reviewQuestions).length + Object.keys(progress.reviewLessons).length} latihan untuk ditinjau` : "Belum ada soal yang ditandai."}</p></div></section>
      <div class="section-heading"><div><span class="eyebrow">Lanjutkan perjalanan</span><h2>Belajar lewat praktik.</h2></div></div>
      <section class="quick-links" aria-label="Akses belajar"><a class="surface quick-link spotlight-surface" href="#/learn"><span class="quick-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z"></path><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h8M8 10h6"></path></svg></span><h3>Pusat belajar</h3><p>Jalur literasi, kurikulum, dan materi fondasi.</p></a><a class="surface quick-link spotlight-surface" href="#/simulations"><span class="quick-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 19V5M4 19h16M7 15l4-4 3 2 5-6"></path><path d="M16 7h3v3"></path></svg></span><h3>Laboratorium simulasi</h3><p>Delapan latihan interaktif tanpa transaksi sungguhan.</p></a><a class="surface quick-link spotlight-surface" href="#/quiz"><span class="quick-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 4.5h14v12H9l-4 3v-15Z"></path><path d="M8.5 9h.01M12 9h.01M15.5 9h.01M8 13h8"></path></svg></span><h3>Arena kuis</h3><p>${QUESTION_BANK.length} soal, tanpa hitung mundur.</p></a></section>
      <p class="notice" style="margin-top:20px">XP dan progres adalah motivasi belajar lokal di browser, bukan reward yang aman terhadap manipulasi dan tidak tersinkron antarperangkat.</p>
    </div>`, "dashboard");
  }
  function learnView() {
    const progress = progressFor(profile().id);
    return shell(`<div class="page-wrap"><span class="eyebrow">Pusat belajar</span><h1 style="font-size:clamp(35px,5vw,48px);margin:10px 0">Pilih jalur yang sesuai.</h1><p class="lead" style="font-size:16px">Jelajahi literasi keuangan, materi pengayaan kelas 10–12, atau cari topik tertentu.</p>
      <section class="path-choice-grid"><a class="path-choice literacy-path" href="#/literacy"><span class="eyebrow">JALUR MANDIRI</span><h2>Jalur Literasi Keuangan</h2><p>Pahami uang. Kendalikan keputusan. Bangun masa depan.</p><span class="text-link">8 bab · 64 materi →</span></a><a class="path-choice" href="#/curriculum"><span class="eyebrow">PENGAYAAN SEKOLAH</span><h2>Kurikulum Ekonomi Kelas 10–12</h2><p>Materi pengayaan terstruktur. Bab, semester, dan urutan perlu diselaraskan dengan kurikulum sekolah.</p><span class="text-link">3 jenjang · 33 bab →</span></a></section>
      <section class="section-heading" style="margin-top:0"><div><span class="eyebrow">Koleksi tersedia</span><h2>Fondasi keuangan</h2></div><span class="small muted">Delapan bab · ${DATA.chapters.reduce((sum, chapter) => sum + chapter.lessons.length, 0)} materi</span></section><section class="chapter-grid">${DATA.chapters.map(chapter => {
        const completed = chapter.lessons.filter(lesson => progress.completed.includes(lesson.id)).length;
        return `<a class="surface chapter-card" href="#/chapter/${chapter.id}"><div class="chapter-top"><span class="chapter-number">BAB ${chapter.number}</span><span class="chapter-icon">${chapter.icon}</span></div><h3>${escapeHtml(chapter.title)}</h3><p>${escapeHtml(chapter.description)}</p><p class="small muted">${completed}/${chapter.lessons.length} materi selesai →</p></a>`;
      }).join("")}</section>
      <section class="section-heading"><div><span class="eyebrow">Temukan materi</span><h2>Pencarian dan filter</h2></div><span class="small muted">${allLessons().length} materi tersedia</span></section>
      <section class="surface learning-finder"><div class="finder-controls">
        <div class="field"><label for="learning-search">Cari judul atau isi</label><input id="learning-search" type="search" placeholder="Contoh: inflasi, biaya peluang, tabungan"></div>
        <div class="field"><label for="learning-track">Jalur</label><select id="learning-track"><option value="all">Semua jalur</option><option value="literacy">Literasi Keuangan</option><option value="curriculum">Kurikulum sekolah</option></select></div>
        <div class="field"><label for="learning-grade">Kelas</label><select id="learning-grade"><option value="all">Semua kelas</option><option value="10">Kelas 10</option><option value="11">Kelas 11</option><option value="12">Kelas 12</option></select></div>
        <div class="field"><label for="learning-chapter">Bab</label><select id="learning-chapter"><option value="all">Semua bab</option>${allChapters().map(chapter => `<option value="${chapter.id}">${escapeHtml(chapter.title)}</option>`).join("")}${PATHS.curriculum.map(chapter => `<option value="${chapter.id}">Kelas ${chapter.grade} · ${escapeHtml(chapter.title)}</option>`).join("")}</select></div>
        <div class="field"><label for="learning-status">Status</label><select id="learning-status"><option value="all">Semua status</option><option value="not-started">Belum selesai</option><option value="done">Selesai</option></select></div>
        <div class="field"><label for="learning-sort">Urutkan</label><select id="learning-sort"><option value="path">Jalur & bab</option><option value="title">Judul A–Z</option><option value="time">Waktu terpendek</option></select></div>
      </div><p class="small muted" id="finder-count" aria-live="polite"></p><div id="learning-results" class="learning-results"></div></section>
    </div>`, "learn");
  }
  function literacyView() {
    const progress = progressFor(profile().id);
    const cards = PATHS.literacyChapters.map(chapter => {
      const lessons = chapterLessons(chapter);
      const done = lessons.filter(lesson => progress.completed.includes(lesson.id)).length;
      return `<a class="surface chapter-card" href="#/chapter/${chapter.id}"><div class="chapter-top"><span class="chapter-number">BAB ${chapter.number}</span><span class="chapter-icon">${chapter.icon}</span></div><h3>${escapeHtml(chapter.title)}</h3><p>${escapeHtml(chapter.description)}</p><p class="small muted" style="margin:12px 0 0">${done}/${lessons.length} materi · ${lessons.length * 5} menit perkiraan</p></a>`;
    }).join("");
    return shell(`<div class="page-wrap"><a class="text-link small" href="#/learn">← Semua jalur</a><header class="path-hero"><span class="eyebrow">JALUR LITERASI KEUANGAN</span><h1>Pahami uang.<br><span>Kendalikan keputusan.</span><br>Bangun masa depan.</h1><p class="lead" style="font-size:17px">Jalur mandiri yang dapat dimulai kapan saja. Pilih satu topik dan hubungkan dengan keputusan sehari-hari.</p><a class="button button-primary" href="#/lesson/literasi-uang-01">Mulai jalur <span aria-hidden="true">→</span></a></header><section class="chapter-grid" aria-label="Delapan bab Jalur Literasi Keuangan">${cards}</section><p class="notice" style="margin-top:20px">Materi edukasi umum. Contoh investasi tidak menjamin hasil dan bukan rekomendasi produk.</p></div>`, "literacy");
  }
  function curriculumView(grade) {
    if (grade) {
      const items = PATHS.curriculum.filter(chapter => chapter.grade === Number(grade));
      if (!items.length) return notFoundView();
      const progress = progressFor(profile().id);
      const cards = items.map(chapter => {
        const lessons = chapterLessons(chapter);
        const done = lessons.filter(lesson => progress.completed.includes(lesson.id)).length;
        return `<a class="curriculum-row surface" href="#/chapter/${chapter.id}"><span class="chapter-number">BAB ${String(items.indexOf(chapter) + 1).padStart(2, "0")} · SEMESTER ${chapter.semester}</span><strong>${escapeHtml(chapter.title)}</strong><p>${escapeHtml(chapter.summary)}</p><span class="small muted">${done}/${lessons.length} materi pengayaan · ${done === lessons.length ? "Selesai" : "Belum selesai"}</span></a>`;
      }).join("");
      return shell(`<div class="page-wrap"><a class="text-link small" href="#/curriculum">← Semua jenjang</a><span class="eyebrow" style="display:block;margin-top:20px">KURIKULUM EKONOMI · PENGAYAAN</span><h1 style="font-size:clamp(35px,5vw,48px);margin:10px 0">Kelas ${grade}</h1><p class="lead" style="font-size:16px">Susunan dan semester dapat disesuaikan dengan kurikulum yang digunakan sekolah dan arahan guru.</p><section class="curriculum-list">${cards}</section></div>`, "curriculum");
    }
    return shell(`<div class="page-wrap"><span class="eyebrow">Jalur kurikulum sekolah</span><h1 style="font-size:clamp(35px,5vw,48px);margin:10px 0">Ekonomi kelas 10–12.</h1><p class="lead" style="font-size:16px">Rangkaian pengayaan konseptual untuk mendukung pembelajaran. Bukan susunan resmi universal; guru dapat menyesuaikan urutan, capaian, dan semester.</p><section class="grade-grid">${[10,11,12].map(grade => {
      const chapters = PATHS.curriculum.filter(chapter => chapter.grade === grade);
      return `<a class="grade-card surface" href="#/curriculum/${grade}"><span class="eyebrow">${chapters.length} BAB PENGAYAAN</span><h2>Kelas ${grade}</h2><p>${grade === 10 ? "Fondasi ekonomi" : grade === 11 ? "Pendalaman ekonomi" : "Penerapan dan analisis ekonomi"}</p><span class="text-link">Jelajahi materi →</span></a>`;
    }).join("")}</section><p class="notice" style="margin-top:20px">Materi pengayaan perlu ditinjau dan diselaraskan oleh guru terhadap kurikulum, kalender belajar, serta sumber terkini di sekolah.</p></div>`, "curriculum");
  }
  function chapterView(id) {
    const chapter = findChapter(id);
    if (!chapter) return notFoundView();
    const progress = progressFor(profile().id);
    const lessons = chapterLessons(chapter);
    const rows = lessons.map((lesson, i) => `<a class="surface lesson-row" href="#/lesson/${lesson.id}"><div><span class="eyebrow">${i + 1} · ${lesson.minutes || 5} menit</span><h3>${escapeHtml(lesson.title)}</h3><p>${escapeHtml(lesson.opener)}</p></div><span class="${progress.completed.includes(lesson.id) ? "done-mark" : "muted"}" aria-label="${progress.completed.includes(lesson.id) ? "Selesai" : "Belum selesai"}">${progress.completed.includes(lesson.id) ? "✓" : "→"}</span></a>`).join("");
    const back = chapter.track === "curriculum" ? `curriculum/${chapter.grade}` : chapter.track === "literacy" ? "literacy" : "learn";
    const chapterEyebrow = chapter.track === "curriculum" ? `KELAS ${chapter.grade} · PENGAYAAN · SEMESTER ${chapter.semester}` : chapter.track === "literacy" ? `JALUR LITERASI · BAB ${chapter.number}` : `FONDASI KEUANGAN · BAB ${chapter.number}`;
    return shell(`<div class="page-wrap narrow"><a class="text-link small" href="#/${back}">← Kembali ke jalur</a><section class="lesson-hero"><span class="eyebrow">${chapterEyebrow}</span><h1>${escapeHtml(chapter.title)}</h1><p class="lead" style="font-size:16px">${escapeHtml(chapter.description || chapter.summary)}</p>${chapter.enrichment ? '<span class="badge">Materi pengayaan · perlu penyesuaian guru</span>' : ""}</section><div class="section-heading" style="margin-top:16px"><div><h2 style="font-size:23px">Materi dalam bab ini</h2></div></div><section class="lesson-list">${rows}</section></div>`, chapter.track === "curriculum" ? "curriculum" : chapter.track === "literacy" ? "literacy" : "learn");
  }
  function lessonView(id) {
    const lesson = allLessons().find(item => item.id === id);
    if (!lesson) return notFoundView();
    const progress = progressFor(profile().id);
    const lessons = chapterLessons(lesson.chapter);
    const lessonIndex = lessons.findIndex(item => item.id === id);
    const isDone = progress.completed.includes(id);
    const hasPassedPractice = progress.practiced.includes(id);
    return shell(`<div class="page-wrap narrow"><a class="text-link small" href="#/chapter/${lesson.chapter.id}">← Kembali ke ${escapeHtml(lesson.chapter.title)}</a>
      <header class="lesson-hero"><span class="eyebrow">${lesson.track === "curriculum" ? `KELAS ${lesson.grade} · MATERI ${lessonIndex + 1} DARI ${lessons.length}` : `BAB ${lesson.chapter.number} · MATERI ${lessonIndex + 1} DARI ${lessons.length}`}</span><h1>${escapeHtml(lesson.title)}</h1><p class="lead" style="font-size:17px">${escapeHtml(lesson.opener)}</p>${lesson.objective ? `<p class="small muted"><strong>Tujuan:</strong> ${escapeHtml(lesson.objective)}</p>` : ""}</header>
      <article class="lesson-content">
        <section class="surface content-section"><h2>Konsep utama</h2><p>${escapeHtml(lesson.concept)}</p></section>
        <section class="surface content-section"><h2>Contoh sehari-hari</h2><p>${escapeHtml(lesson.example)}</p></section>
        <section class="surface content-section takeaway"><h2>Ingat inti ini</h2><p>${escapeHtml(lesson.takeaway)}</p></section>
      </article>
      <section class="surface practice-box" aria-labelledby="practice-title"><span class="eyebrow">Cek pemahaman</span><h2 id="practice-title">${escapeHtml(lesson.practice)}</h2><div class="practice-options">${lesson.options.map((option, i) => `<button class="choice" data-action="practice-choice" data-index="${i}" aria-pressed="false">${escapeHtml(option)}</button>`).join("")}</div><p class="answer-feedback" id="practice-feedback" aria-live="polite"></p><button class="button button-secondary" data-action="practice-check" data-id="${lesson.id}" data-answer="${lesson.answer}" data-explanation="${encodeURIComponent(lesson.explanation)}">Periksa jawaban</button></section>
      <p class="small muted" id="completion-requirement">${isDone ? "Materi ini sudah tercatat selesai." : hasPassedPractice ? "Latihan sudah benar. Kamu dapat menyelesaikan materi ini." : "Jawab latihan dengan benar untuk membuka penyelesaian materi."}</p>
      <div class="lesson-footer"><a class="button button-secondary" href="#/chapter/${lesson.chapter.id}">Daftar materi</a><button class="button ${isDone ? "button-secondary" : "button-primary"}" data-action="${isDone ? "show-completion" : "complete-lesson"}" data-id="${lesson.id}" ${!isDone && !hasPassedPractice ? "disabled aria-describedby=\"completion-requirement\"" : ""}>${isDone ? "Lihat ringkasan penyelesaian →" : "Tandai selesai →"}</button></div>
    </div>`, "lesson");
  }
  function completionView(id) {
    const lesson = allLessons().find(item => item.id === id);
    if (!lesson) return notFoundView();
    const progress = progressFor(profile().id);
    if (!progress.completed.includes(id)) return lessonView(id);
    const chapterLessonsList = chapterLessons(lesson.chapter);
    const chapterDone = chapterLessonsList.filter(item => progress.completed.includes(item.id)).length;
    const chapterPercent = chapterLessonsList.length ? Math.round(chapterDone / chapterLessonsList.length * 100) : 0;
    const path = pathLessons(lesson.track);
    const pathDone = path.filter(item => progress.completed.includes(item.id)).length;
    const pathPercent = path.length ? Math.round(pathDone / path.length * 100) : 0;
    const next = nextPathLesson(lesson, progress);
    const completion = progress.lastCompletion && progress.lastCompletion.lessonId === id ? progress.lastCompletion : null;
    const completionXp = completion ? completion.xpEarned : progress.rewardIds.includes("lesson:" + id) ? 20 : null;
    const currentLevel = levelInfo(progress.xp);
    const earnedAchievements = completion
      ? completion.achievements.map(achievementId => ACHIEVEMENTS.find(item => item.id === achievementId)).filter(Boolean)
      : [];
    const isReturningToIncomplete = next && path.indexOf(next) <= path.findIndex(item => item.id === lesson.id);
    const nextLabel = next
      ? isReturningToIncomplete ? "Lengkapi Materi yang Terlewat" :
        lesson.track === "curriculum" && next.grade !== lesson.grade ? "Lanjut ke Level Berikutnya" :
          next.chapter.id !== lesson.chapter.id ? "Lanjut ke Bab Berikutnya" : "Lanjut ke Materi Berikutnya"
      : "";
    const primaryAction = next
      ? `<button class="button button-primary" data-action="completion-next" data-next="${next.id}">${nextLabel} →</button>`
      : `<a class="button button-primary" href="${learningPathHref(lesson)}">Lihat jalur belajar →</a>`;
    const completedPath = !next
      ? `<div class="notice completion-finished" role="status"><strong>Jalur belajar selesai.</strong> Kamu telah menyelesaikan semua materi dalam ${escapeHtml(learningPathName(lesson))}. Materi tetap dapat diulang kapan saja.</div>`
      : "";
    return shell(`<div class="page-wrap narrow"><section class="surface completion-card" aria-labelledby="completion-title">
      <span class="completion-mark" aria-hidden="true">✓</span><span class="eyebrow">PENYELESAIAN TERCATAT · ${escapeHtml(learningPathName(lesson))}</span>
      <h1 id="completion-title">${next ? "Satu langkah selesai." : "Seluruh jalur selesai."}</h1>
      <p class="lead completion-summary"><strong>${escapeHtml(lesson.title)}</strong><br>${escapeHtml(lesson.chapter.title)}</p>
      <div class="completion-progress">
        <div class="split small"><span>Progres bab</span><strong>${chapterDone}/${chapterLessonsList.length} materi · ${chapterPercent}%</strong></div>
        <div class="lesson-progress" role="progressbar" aria-label="Progres bab" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${chapterPercent}"><span style="width:${chapterPercent}%"></span></div>
        <div class="split small"><span>${escapeHtml(learningPathName(lesson))}</span><strong>${pathDone}/${path.length} materi · ${pathPercent}%</strong></div>
        <div class="lesson-progress" role="progressbar" aria-label="Progres jalur belajar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pathPercent}"><span style="width:${pathPercent}%"></span></div>
      </div>
      <div class="completion-stats">
        <div><strong>${completionXp === null ? "—" : `+${completionXp}`}</strong><span class="small muted">XP dari penyelesaian ini</span></div>
        <div><strong>Level ${currentLevel.level}</strong><span class="small muted">${escapeHtml(currentLevel.title)} · ${progress.xp} XP total</span></div>
      </div>
      ${completion && completion.levelUp ? `<p class="completion-unlock" role="status">Level ${completion.levelUp} terbuka · ${escapeHtml(levelInfo(progress.xp).title)}</p>` : ""}
      ${earnedAchievements.length ? `<div class="completion-achievements"><span class="eyebrow">PENCAPAIAN BARU</span><div>${earnedAchievements.map(item => `<span class="achievement-chip">${item.icon} ${escapeHtml(item.name)}</span>`).join("")}</div></div>` : ""}
      ${completedPath}
      <div class="row completion-actions">${primaryAction}<a class="button button-secondary" href="${learningPathHref(lesson)}">Kembali ke Learning Path</a><a class="text-link small completion-repeat" href="#/lesson/${lesson.id}">Ulangi materi</a></div>
    </section></div>`, "completion");
  }
  function simulationsView() {
    const scenarios = DATA.scenarios;
    return shell(`<div class="page-wrap"><span class="eyebrow">Laboratorium simulasi</span><h1 style="font-size:clamp(35px,5vw,48px);margin:10px 0">Coba hitung. Pahami dampaknya.</h1><p class="lead" style="font-size:16px">Semua latihan berjalan di browser ini dengan angka contoh. Tidak ada transaksi sungguhan.</p>
      <section class="simulation-grid" aria-label="Simulasi keuangan">
        <article class="surface simulation-card"><span class="eyebrow">01 · BAGI UANG</span><h2>Simulasi anggaran</h2><p>Masukkan pemasukan lalu rencanakan pengeluaran. Sisa uang dihitung otomatis.</p>
          <form data-form="budget" novalidate><div class="field"><label for="budget-total">Pemasukan tersedia (rupiah)</label><input id="budget-total" name="total" type="number" min="1" step="1000" placeholder="Contoh: 500000" required></div>
            <div class="field"><label for="budget-needs">Kebutuhan</label><input id="budget-needs" name="needs" type="number" min="0" step="1000" placeholder="Contoh: 250000" required></div>
            <div class="field"><label for="budget-wants">Keinginan</label><input id="budget-wants" name="wants" type="number" min="0" step="1000" placeholder="Contoh: 100000" required></div>
            <div class="field"><label for="budget-savings">Tabungan</label><input id="budget-savings" name="savings" type="number" min="0" step="1000" placeholder="Contoh: 100000" required></div>
            <div class="field"><label for="budget-other">Lain-lain / kewajiban</label><input id="budget-other" name="other" type="number" min="0" step="1000" placeholder="Contoh: 50000" required></div>
            <p class="budget-live small muted" data-live aria-live="polite">Isi angka untuk melihat perkiraan sisa uang.</p><p class="form-message" data-error></p><div class="row"><button class="button button-primary" type="submit">Evaluasi anggaran</button><button class="button button-quiet" type="button" data-action="budget-example">Isi contoh</button><button class="button button-quiet" type="button" data-action="budget-reset">Reset</button></div><div class="result-box" data-result aria-live="polite"></div></form></article>
        <article class="surface simulation-card"><span class="eyebrow">02 · LIHAT PERUBAHAN</span><h2>Simulasi inflasi</h2><p>Asumsikan persentase perubahan harga yang sama setiap tahun untuk melihat dampak majemuk pada satu barang.</p>
          <form data-form="inflation" novalidate><div class="field"><label for="inflation-money">Uang yang dimiliki (rupiah)</label><input id="inflation-money" name="money" type="number" min="1" step="1000" placeholder="Contoh: 100000" required></div>
            <div class="field"><label for="inflation-price">Harga barang saat ini (rupiah)</label><input id="inflation-price" name="price" type="number" min="1" step="100" placeholder="Contoh: 10000" required></div>
            <div class="field"><label for="inflation-rate">Perubahan harga per tahun (persen)</label><input id="inflation-rate" name="rate" type="number" min="-99" max="1000" step="0.1" placeholder="Contoh: 5" required><p class="help">Gunakan angka negatif jika harga turun dalam asumsi simulasi.</p></div>
            <div class="field"><label for="inflation-years">Jangka waktu (tahun)</label><input id="inflation-years" name="years" type="number" min="1" max="50" step="1" value="3" required></div>
            <p class="form-message" data-error></p><div class="row"><button class="button button-primary" type="submit">Hitung daya beli</button><button class="button button-quiet" type="reset">Reset</button></div><div class="result-box" data-result aria-live="polite"></div></form></article>
        <article class="surface simulation-card scenario-card"><span class="eyebrow">03 · PERTIMBANGKAN PILIHAN</span><h2>Simulasi keputusan keuangan</h2><p>Baca skenario, pilih tindakan, lalu lihat konsekuensinya. Tidak ada satu rumus yang menggantikan pertimbangan situasi.</p>
          <div class="field"><label for="scenario-select">Pilih skenario</label><select id="scenario-select" data-action="scenario-select">${scenarios.map((scenario, i) => `<option value="${i}">${i + 1}. ${escapeHtml(scenario.title)}</option>`).join("")}</select></div>
              <div id="scenario-content">${scenarioHtml(0, null)}</div>
        </article>
        <article class="surface simulation-card"><span class="eyebrow">04 · RENCANAKAN TARGET</span><h2>Target tabungan & dana cadangan</h2><p>Rencanakan sasaran seperti dana belajar atau cadangan beberapa bulan pengeluaran tanpa mengandalkan bunga atau hasil investasi.</p><form data-form="savings-goal"><div class="field"><label for="goal-amount">Target tabungan (rupiah)</label><input id="goal-amount" name="goal" type="number" min="1" max="1000000000000" required></div><div class="field"><label for="goal-current">Tabungan saat ini (rupiah)</label><input id="goal-current" name="current" type="number" min="0" max="1000000000000" value="0" required></div><div class="field"><label for="goal-months">Waktu yang tersedia (bulan)</label><input id="goal-months" name="months" type="number" min="1" max="600" required></div><p class="form-message" data-error></p><div class="row"><button class="button button-primary" type="submit">Hitung target</button><button class="button button-quiet" type="reset">Reset</button></div><div class="result-box" data-result aria-live="polite"></div></form></article>
        <article class="surface simulation-card"><span class="eyebrow">05 · HITUNG BIAYA</span><h2>Biaya pinjaman</h2><p>Bandingkan total pembayaran berdasarkan angka ilustrasi. Periksa syarat dan biaya sebenarnya sebelum mengambil keputusan.</p><form data-form="loan-cost"><div class="field"><label for="loan-principal">Jumlah pinjaman (rupiah)</label><input id="loan-principal" name="principal" type="number" min="1" max="1000000000000" required></div><div class="field"><label for="loan-installments">Cicilan per bulan (rupiah)</label><input id="loan-installments" name="payment" type="number" min="1" max="1000000000000" required></div><div class="field"><label for="loan-months">Jumlah bulan</label><input id="loan-months" name="months" type="number" min="1" max="600" required></div><div class="field"><label for="loan-fees">Biaya tambahan total (rupiah)</label><input id="loan-fees" name="fees" type="number" min="0" max="1000000000000" value="0" required></div><p class="form-message" data-error></p><div class="row"><button class="button button-primary" type="submit">Hitung total biaya</button><button class="button button-quiet" type="reset">Reset</button></div><div class="result-box" data-result aria-live="polite"></div></form></article>
        <article class="surface simulation-card"><span class="eyebrow">06 · NILAI DAPAT BERUBAH</span><h2>Portofolio virtual</h2><p>Latih pemahaman risiko memakai nilai awal dan skenario perubahan tahunan; ini bukan ramalan atau rekomendasi.</p><form data-form="portfolio"><div class="field"><label for="portfolio-start">Saldo virtual awal (rupiah)</label><input id="portfolio-start" name="start" type="number" min="1" max="1000000000000" required></div><div class="field"><label for="portfolio-rate">Asumsi perubahan tahunan (%)</label><input id="portfolio-rate" name="rate" type="number" min="-100" max="100" step="0.1" required><p class="help">Coba skenario positif atau negatif untuk memahami ketidakpastian.</p></div><div class="field"><label for="portfolio-years">Periode (tahun)</label><input id="portfolio-years" name="years" type="number" min="1" max="50" required></div><p class="form-message" data-error></p><div class="row"><button class="button button-primary" type="submit">Jalankan skenario virtual</button><button class="button button-quiet" type="reset">Reset</button></div><div class="result-box" data-result aria-live="polite"></div></form></article>
        <article class="surface simulation-card"><span class="eyebrow">07 · PERIKSA DULU</span><h2>Deteksi penipuan</h2><p>Pilih respons paling aman. Jangan mengirim data pribadi atau uang dalam latihan ini.</p><form data-form="fraud-check"><div class="field"><label for="fraud-case">Skenario</label><select id="fraud-case" name="case"><option value="0">Pesan hadiah mendesak dan meminta OTP</option><option value="1">Investasi dijanjikan untung pasti, harus transfer sekarang</option><option value="2">Telepon mengaku petugas bank, minta PIN</option></select></div><div class="field"><label for="fraud-response">Respons yang dipilih</label><select id="fraud-response" name="response"><option value="">Pilih respons</option><option value="verify">Hentikan komunikasi dan verifikasi melalui kanal resmi</option><option value="share">Berikan kode agar hadiah segera dikirim</option><option value="transfer">Transfer sekarang sebelum kesempatan berakhir</option></select></div><p class="form-message" data-error></p><div class="row"><button class="button button-primary" type="submit">Periksa respons</button><button class="button button-quiet" type="reset">Reset</button></div><div class="result-box" data-result aria-live="polite"></div></form></article>
        <article class="surface simulation-card"><span class="eyebrow">08 · UJI USAHA</span><h2>Usaha virtual</h2><p>Perkirakan pendapatan dan laba sederhana. Hasil belum memasukkan pajak, upah pemilik, atau perubahan permintaan.</p><form data-form="business"><div class="field"><label for="business-price">Harga jual per unit (rupiah)</label><input id="business-price" name="price" type="number" min="1" max="1000000000" required></div><div class="field"><label for="business-variable">Biaya variabel per unit (rupiah)</label><input id="business-variable" name="variable" type="number" min="0" max="1000000000" required></div><div class="field"><label for="business-fixed">Biaya tetap periode ini (rupiah)</label><input id="business-fixed" name="fixed" type="number" min="0" max="1000000000000" required></div><div class="field"><label for="business-units">Perkiraan unit terjual</label><input id="business-units" name="units" type="number" min="0" max="1000000000" required></div><p class="form-message" data-error></p><div class="row"><button class="button button-primary" type="submit">Hitung usaha virtual</button><button class="button button-quiet" type="reset">Reset</button></div><div class="result-box" data-result aria-live="polite"></div></form></article>
      </section></div>`, "simulations");
  }
  function financeLabView() {
    const calculatorHeader = `<div class="page-wrap"><span class="eyebrow">Finance Calculator Lab</span><h1 class="feature-title">Uji angka, pahami asumsi.</h1><p class="lead feature-lead">Kalkulator edukatif untuk membandingkan skenario sederhana. Hasil bukan saran keuangan dan tidak memprediksi hasil nyata.</p><div class="row feature-links"><a class="button button-secondary" href="#/simulations">Laboratorium simulasi →</a><a class="button button-secondary" href="#/challenges">Tantangan keputusan →</a></div><section class="finance-grid" aria-label="Kalkulator keuangan">
      <article class="surface finance-card"><span class="eyebrow">01 · BUNGA</span><h2>Bunga sederhana & majemuk</h2><p>Bandingkan pertumbuhan tanpa setoran tambahan. Bunga aktual dapat memiliki ketentuan dan biaya berbeda.</p><form data-form="lab-interest" novalidate><div class="field"><label for="lab-principal">Modal awal (rupiah)</label><input id="lab-principal" name="principal" type="number" min="1" max="1000000000000" step="1000" required></div><div class="field"><label for="lab-rate">Asumsi bunga per tahun (%)</label><input id="lab-rate" name="rate" type="number" min="0" max="1000" step="0.1" required></div><div class="field"><label for="lab-years">Jangka waktu (tahun)</label><input id="lab-years" name="years" type="number" min="1" max="100" step="1" required></div><div class="field"><label for="lab-compounds">Frekuensi majemuk per tahun</label><select name="frequency" id="lab-compounds"><option value="1">Tahunan</option><option value="4">Kuartalan</option><option value="12">Bulanan</option></select></div><p class="form-message" data-error role="alert"></p><div class="row"><button class="button button-primary" type="submit">Bandingkan hasil</button><button class="button button-quiet" type="reset">Reset</button></div><div class="result-box" data-result aria-live="polite"></div></form></article>
      <article class="surface finance-card"><span class="eyebrow">02 · INFLASI</span><h2>Simulasi daya beli</h2><p>Asumsikan perubahan harga tahunan tetap untuk satu barang, bukan inflasi aktual seluruh ekonomi.</p><form data-form="lab-inflation" novalidate><div class="field"><label for="lab-item-price">Harga barang saat ini (rupiah)</label><input id="lab-item-price" name="price" type="number" min="1" max="1000000000000" required></div><div class="field"><label for="lab-cash">Uang yang tersedia (rupiah)</label><input id="lab-cash" name="cash" type="number" min="1" max="1000000000000" required></div><div class="field"><label for="lab-inflation-rate">Perubahan harga per tahun (%)</label><input id="lab-inflation-rate" name="rate" type="number" min="-99" max="1000" step="0.1" required></div><div class="field"><label for="lab-inflation-years">Jangka waktu (tahun)</label><input id="lab-inflation-years" name="years" type="number" min="1" max="50" step="1" required></div><p class="form-message" data-error role="alert"></p><div class="row"><button class="button button-primary" type="submit">Simulasikan harga</button><button class="button button-quiet" type="reset">Reset</button></div><div class="result-box" data-result aria-live="polite"></div></form></article>
      <article class="surface finance-card"><span class="eyebrow">03 · TARGET TABUNGAN</span><h2>Rencanakan setoran</h2><p>Hitung setoran rata-rata tanpa memperhitungkan bunga, biaya, atau perubahan pemasukan.</p><form data-form="lab-savings" novalidate><div class="field"><label for="lab-goal">Target (rupiah)</label><input id="lab-goal" name="goal" type="number" min="1" max="1000000000000" required></div><div class="field"><label for="lab-saved">Tabungan saat ini (rupiah)</label><input id="lab-saved" name="current" type="number" min="0" max="1000000000000" value="0" required></div><div class="field"><label for="lab-periods">Waktu yang tersedia (bulan)</label><input id="lab-periods" name="months" type="number" min="1" max="600" step="1" required></div><p class="form-message" data-error role="alert"></p><div class="row"><button class="button button-primary" type="submit">Hitung rencana</button><button class="button button-quiet" type="reset">Reset</button></div><div class="result-box" data-result aria-live="polite"></div></form></article>
      <article class="surface finance-card"><span class="eyebrow">04 · ANGGARAN BULANAN</span><h2>Atur pembagian uang</h2><p>Bandingkan kebutuhan, keinginan, tabungan, dan kewajiban dengan pemasukan yang tersedia.</p><form data-form="lab-budget" novalidate><div class="field"><label for="lab-income">Pemasukan bulanan (rupiah)</label><input id="lab-income" name="income" type="number" min="1" max="1000000000000" required></div><div class="field"><label for="lab-needs">Kebutuhan (rupiah)</label><input id="lab-needs" name="needs" type="number" min="0" max="1000000000000" required></div><div class="field"><label for="lab-wants">Keinginan (rupiah)</label><input id="lab-wants" name="wants" type="number" min="0" max="1000000000000" required></div><div class="field"><label for="lab-savings">Tabungan (rupiah)</label><input id="lab-savings" name="savings" type="number" min="0" max="1000000000000" required></div><div class="field"><label for="lab-obligations">Kewajiban & lainnya (rupiah)</label><input id="lab-obligations" name="other" type="number" min="0" max="1000000000000" required></div><p class="form-message" data-error role="alert"></p><div class="row"><button class="button button-primary" type="submit">Evaluasi anggaran</button><button class="button button-quiet" type="reset">Reset</button></div><div class="result-box" data-result aria-live="polite"></div></form></article>
    </section></div>`;
    return shell(calculatorHeader, "finance-lab");
  }
  function challengesView() {
    const progress = progressFor(profile().id);
    const records = progress.simulations.decisionChallenges || {};
    const cards = DECISION_CHALLENGES.map((challenge, index) => {
      const record = records[challenge.id];
      const selected = record && Number.isInteger(record.choice) && record.choice >= 0 && record.choice < challenge.choices.length ? record.choice : null;
      const choice = selected === null ? null : challenge.choices[selected];
      return `<article class="surface challenge-card"><span class="eyebrow">CHALLENGE ${String(index + 1).padStart(2, "0")} · ${record && record.completed ? "SUDAH DICOBA" : "PILIHAN & DAMPAK"}</span><h2>${escapeHtml(challenge.title)}</h2><p>${escapeHtml(challenge.prompt)}</p><div class="challenge-options">${challenge.choices.map((option, optionIndex) => `<button class="choice challenge-choice ${selected === optionIndex ? "selected" : ""}" data-action="challenge-choice" data-id="${challenge.id}" data-index="${optionIndex}" aria-pressed="${selected === optionIndex}">${escapeHtml(option.label)}</button>`).join("")}</div>${choice ? `<div class="result-box visible ${choice.safe ? "result-good" : "result-caution"}" role="status"><strong>${choice.safe ? "Pilihan lebih terencana" : "Pertimbangkan kembali risikonya"}</strong><p>${escapeHtml(choice.result)}</p>${record.completed ? '<span class="small muted">Tercatat pada profil ini · reward challenge hanya satu kali.</span>' : ""}</div>` : `<p class="small muted">Pilih satu tindakan untuk melihat konsekuensi simulasi dan penjelasan.</p>`}</article>`;
    }).join("");
    return shell(`<div class="page-wrap"><span class="eyebrow">Financial Decision Challenge</span><h1 class="feature-title">Keputusan punya konteks.</h1><p class="feature-lead lead">Latih cara berpikir tentang anggaran, kejadian tak terduga, target, penipuan, dan risiko investasi. Setiap pilihan menampilkan konsekuensi edukatif; tidak ada hasil investasi yang dijanjikan.</p><div class="row feature-links"><a class="button button-secondary" href="#/life-simulator">Coba simulator kehidupan →</a><a class="button button-secondary" href="#/finance-lab">Buka kalkulator →</a></div><section class="challenge-grid" aria-label="Tantangan keputusan keuangan">${cards}</section><p class="notice" style="margin-top:20px">Challenge adalah simulasi pembelajaran, bukan rekomendasi keputusan finansial. XP maksimal 10 per skenario dan hanya diberikan satu kali.</p></div>`, "challenges");
  }
  function lifeSimulatorView() {
    const progress = progressFor(profile().id);
    const storedPrevious = progress.simulations.lifeSimulator;
    const events = [
      { id: "repair", title: "Perbaikan sepeda", amount: 120000 },
      { id: "health", title: "Kebutuhan kesehatan", amount: 200000 },
      { id: "school", title: "Perlengkapan sekolah mendadak", amount: 150000 }
    ];
    const previous = storedPrevious && Number.isFinite(storedPrevious.income) &&
      Number.isFinite(storedPrevious.remaining) && Number.isFinite(Date.parse(storedPrevious.date)) &&
      events.some(item => item.id === storedPrevious.event) ? storedPrevious : null;
    const previousEvent = previous && events.find(item => item.id === previous.event);
    const previousSummary = previous && Number.isFinite(previous.remaining) && previousEvent
      ? `<section class="surface life-summary" aria-live="polite"><span class="eyebrow">SIMULASI TERAKHIR · ${new Date(previous.date).toLocaleDateString("id-ID")}</span><h2>${previous.remaining >= 0 ? "Anggaran masih seimbang" : "Perlu menyesuaikan rencana"}</h2><p>Pemasukan virtual ${formatRupiah(previous.income)} · kejadian ${escapeHtml(previousEvent.title)} ${formatRupiah(previousEvent.amount)} · sisa ${formatRupiah(previous.remaining)}.</p><p class="small muted">${escapeHtml(previous.evaluation || "")}</p></section>`
      : `<div class="empty-state">Belum ada simulasi tersimpan. Angka hanya virtual dan dapat dicoba tanpa data pribadi atau transaksi sungguhan.</div>`;
    return shell(`<div class="page-wrap narrow"><span class="eyebrow">Financial Life Simulator</span><h1 class="feature-title">Atur uang virtual satu bulan.</h1><p class="feature-lead lead">Buat anggaran, siapkan tabungan, lalu hadapi satu kejadian tak terduga. Ringkasan terakhir tersimpan lokal pada profil browser ini.</p><section class="surface life-form-card"><form data-form="life-simulator" novalidate><div class="field"><label for="life-income">Pemasukan simulasi bulanan (rupiah)</label><input id="life-income" name="income" type="number" min="1" max="1000000000000" value="1000000" required></div><div class="life-budget-grid"><div class="field"><label for="life-needs">Kebutuhan</label><input id="life-needs" name="needs" type="number" min="0" max="1000000000000" value="500000" required></div><div class="field"><label for="life-wants">Keinginan</label><input id="life-wants" name="wants" type="number" min="0" max="1000000000000" value="150000" required></div><div class="field"><label for="life-savings">Tabungan</label><input id="life-savings" name="savings" type="number" min="0" max="1000000000000" value="200000" required></div><div class="field"><label for="life-other">Kewajiban & lainnya</label><input id="life-other" name="other" type="number" min="0" max="1000000000000" value="50000" required></div></div><div class="field"><label for="life-event">Kejadian tak terduga</label><select id="life-event" name="event">${events.map(event => `<option value="${event.id}">${escapeHtml(event.title)} · ${formatRupiah(event.amount)}</option>`).join("")}</select></div><p class="form-message" data-error role="alert"></p><div class="row"><button class="button button-primary" type="submit">Jalankan simulasi bulan</button><button class="button button-quiet" type="reset">Kembali ke contoh</button></div><div class="result-box" data-result aria-live="polite"></div></form></section><div class="section-heading"><div><span class="eyebrow">RINGKASAN</span><h2>Kondisi simulasi terakhir</h2></div></div>${previousSummary}<p class="notice" style="margin-top:20px">Semua angka di halaman ini bersifat virtual. Jangan masukkan data rekening, kata sandi, atau informasi finansial pribadi.</p></div>`, "life-simulator");
  }
  function insightsView() {
    const progress = progressFor(profile().id);
    const tracks = [
      { id: "legacy", title: "Fondasi keuangan", lessons: pathLessons("legacy") },
      { id: "literacy", title: "Jalur literasi", lessons: pathLessons("literacy") },
      { id: "curriculum", title: "Kurikulum pengayaan", lessons: pathLessons("curriculum") }
    ];
    const trackCards = tracks.map(track => {
      const done = track.lessons.filter(lesson => progress.completed.includes(lesson.id)).length;
      const percent = track.lessons.length ? Math.round(done / track.lessons.length * 100) : 0;
      return `<article class="surface insight-track"><div class="split"><strong>${escapeHtml(track.title)}</strong><span>${done}/${track.lessons.length}</span></div><div class="lesson-progress" role="progressbar" aria-label="Progres ${escapeHtml(track.title)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span style="width:${percent}%"></span></div><span class="small muted">${percent}% materi selesai</span></article>`;
    }).join("");
    const topicStats = new Map();
    (progress.quizTopicResults || []).forEach(item => {
      const current = topicStats.get(item.topic) || { correct: 0, total: 0 };
      current.correct += item.correct;
      current.total += item.total;
      topicStats.set(item.topic, current);
    });
    const rankedTopics = [...topicStats.entries()].map(([topic, score]) => ({ topic, ...score, percent: Math.round(score.correct / score.total * 100) }))
      .sort((a, b) => a.percent - b.percent);
    const strengths = rankedTopics.filter(topic => topic.percent >= 70).sort((a, b) => b.percent - a.percent).slice(0, 3);
    const weaknesses = rankedTopics.filter(topic => topic.percent < 70).slice(0, 3);
    const topicCards = topics => topics.length
      ? topics.map(item => `<div class="insight-topic"><strong>${escapeHtml(item.topic)}</strong><span>${item.correct}/${item.total} benar · ${item.percent}%</span></div>`).join("")
      : `<div class="empty-state">${progress.quizTopicResults.length ? "Belum ada topik yang memenuhi kriteria ringkasan ini." : "Data topik belum cukup. Selesaikan kuis untuk membangun ringkasan berdasarkan jawaban aktual."}</div>`;
    const next = allLessons().find(lesson => !progress.completed.includes(lesson.id));
    const reviewItems = Object.entries(progress.reviewQuestions).map(([id, record]) => {
      const question = QUESTION_BANK.find(item => item.id === id);
      return question ? { question, record } : null;
    }).filter(Boolean).sort((a, b) => b.record.count - a.record.count).slice(0, 3);
    const recommendation = reviewItems.length
      ? `<div class="insight-recommendations">${reviewItems.map(({ question }) => `<a class="review-lesson" href="#/lesson/${lessonIdForChapter(question.chapter)}">${escapeHtml(question.topic)} · ${escapeHtml(chapterTitle(question.chapter))}<span>Ulangi materi →</span></a>`).join("")}</div>`
      : next ? `<div class="surface insight-recommendation"><span class="eyebrow">MATERI BERIKUTNYA</span><h2>${escapeHtml(next.title)}</h2><p>${escapeHtml(next.chapter.title)} · ${escapeHtml(next.opener)}</p><a class="button button-primary" href="#/lesson/${next.id}">Lanjutkan belajar →</a></div>`
        : `<div class="empty-state">Semua materi yang tersedia telah ditandai selesai. Kamu dapat mengulang materi atau menguji pemahaman lewat kuis.</div>`;
    const latestScores = progress.quizScores.slice().reverse().slice(0, 5);
    const scoreSummary = latestScores.length
      ? `<div class="score-list">${latestScores.map(item => `<div class="score-row"><span>${escapeHtml(chapterTitle(item.chapter))} · ${new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span><strong>${item.correct}/${item.total} · ${item.percent}%</strong></div>`).join("")}</div>`
      : `<div class="empty-state">Belum ada nilai kuis yang tersimpan.</div>`;
    return shell(`<div class="page-wrap"><span class="eyebrow">Personal Learning Intelligence</span><h1 class="feature-title">Perkembangan dari data nyata.</h1><p class="feature-lead lead">Ringkasan ini dihitung dari materi yang terselesaikan, nilai kuis, dan jawaban per topik yang tercatat di profil lokal.</p><section class="insight-track-grid" aria-label="Progres materi">${trackCards}</section><div class="insight-columns"><section class="surface insight-panel"><span class="eyebrow">HASIL KUIs · TOPIK</span><h2>Area yang kuat</h2><div class="insight-topic-list">${topicCards(strengths)}</div></section><section class="surface insight-panel"><span class="eyebrow">HASIL KUIs · TOPIK</span><h2>Area untuk dilatih</h2><div class="insight-topic-list">${topicCards(weaknesses)}</div></section></div><div class="insight-columns"><section class="surface insight-panel"><span class="eyebrow">NILAI TERBARU</span><h2>Riwayat kuis</h2>${scoreSummary}</section><section class="surface insight-panel"><span class="eyebrow">REKOMENDASI</span><h2>Langkah berikutnya</h2>${recommendation}</section></div><p class="notice" style="margin-top:20px">Insight hanya menggunakan data yang tersedia pada browser ini. Nilai tidak mengukur kemampuan secara menyeluruh dan tidak tersinkron ke perangkat lain.</p></div>`, "insights");
  }
  function handleFinanceCalculator(form) {
    const result = form.querySelector("[data-result]");
    const error = form.querySelector("[data-error]");
    const numbers = [...form.querySelectorAll("input[type='number']")];
    const invalid = numbers.find(input => input.value === "" || !Number.isFinite(Number(input.value)) ||
      Number(input.value) < Number(input.min || 0) || Number(input.value) > Number(input.max || Infinity));
    if (invalid) {
      error.textContent = "Lengkapi semua angka dan pastikan nilainya berada dalam rentang yang tertera.";
      result.classList.remove("visible");
      return;
    }
    const values = Object.fromEntries(numbers.map(input => [input.name, Number(input.value)]));
    let html = "";
    let simulationKey = form.dataset.form;
    if (form.dataset.form === "lab-interest") {
      if (!Number.isInteger(values.years)) {
        error.textContent = "Jangka waktu harus berupa jumlah tahun bulat.";
        result.classList.remove("visible");
        return;
      }
      const rate = values.rate / 100;
      const simple = values.principal * (1 + rate * values.years);
      const frequency = Number(form.elements.frequency.value);
      const compound = values.principal * Math.pow(1 + rate / frequency, frequency * values.years);
      if (![simple, compound].every(Number.isFinite)) {
        error.textContent = "Hasil terlalu besar untuk dihitung. Kurangi jangka waktu atau asumsi bunga.";
        result.classList.remove("visible");
        return;
      }
      const simpleGain = Math.max(0, simple - values.principal);
      const compoundGain = Math.max(0, compound - values.principal);
      html = `<strong>Perbandingan setelah ${values.years} tahun</strong><div class="finance-comparison"><div><span>Bunga sederhana</span><b>${formatRupiah(simple)}</b><small>Perkiraan bunga ${formatRupiah(simpleGain)}</small></div><div><span>Bunga majemuk · ${frequency}× per tahun</span><b>${formatRupiah(compound)}</b><small>Perkiraan bunga ${formatRupiah(compoundGain)}</small></div></div><p>Rumus sederhana: pokok × (1 + tingkat × waktu). Majemuk: pokok × (1 + tingkat/frekuensi)^(frekuensi × waktu). Asumsi tingkat tetap, tanpa setoran, pajak, atau biaya.</p>`;
    } else if (form.dataset.form === "lab-inflation") {
      if (!Number.isInteger(values.years)) {
        error.textContent = "Jangka waktu harus berupa jumlah tahun bulat.";
        result.classList.remove("visible");
        return;
      }
      const projected = values.price * Math.pow(1 + values.rate / 100, values.years);
      if (!Number.isFinite(projected) || projected <= 0) {
        error.textContent = "Asumsi perubahan harga tidak menghasilkan nilai yang dapat dihitung.";
        result.classList.remove("visible");
        return;
      }
      const unitsNow = values.cash / values.price;
      const unitsLater = values.cash / projected;
      html = `<strong>Perkiraan harga setelah ${values.years} tahun: ${formatRupiah(projected)}</strong><div class="finance-comparison"><div><span>Sekarang</span><b>${unitsNow.toFixed(2)} unit</b><small>Dengan ${formatRupiah(values.cash)}</small></div><div><span>Dalam asumsi</span><b>${unitsLater.toFixed(2)} unit</b><small>Dengan uang nominal yang sama</small></div></div><p>Asumsi perubahan harga ${values.rate}% per tahun berlaku tetap hanya untuk simulasi satu barang.</p>`;
    } else if (form.dataset.form === "lab-savings") {
      if (!Number.isInteger(values.months)) {
        error.textContent = "Waktu menabung harus berupa jumlah bulan bulat.";
        result.classList.remove("visible");
        return;
      }
      const gap = Math.max(0, values.goal - values.current);
      html = values.current >= values.goal
        ? `<strong>Target sudah tercapai</strong><p>Tabungan saat ini ${formatRupiah(values.current)} telah memenuhi target ${formatRupiah(values.goal)}.</p>`
        : `<strong>Perkiraan setoran rata-rata ${formatRupiah(Math.ceil(gap / values.months))} per bulan</strong><p>Kesenjangan ${formatRupiah(gap)} selama ${values.months} bulan. Perkiraan ini tidak menghitung bunga, biaya, atau perubahan pemasukan.</p>`;
    } else {
      const planned = values.needs + values.wants + values.savings + values.other;
      if (!Number.isFinite(planned)) {
        error.textContent = "Jumlah kategori terlalu besar untuk dihitung.";
        result.classList.remove("visible");
        return;
      }
      const remaining = values.income - planned;
      const parts = [["Kebutuhan", values.needs, "#a78bfa"], ["Keinginan", values.wants, "#5ee3db"], ["Tabungan", values.savings, "#78dfb1"], ["Kewajiban", values.other, "#ffce74"]];
      const chart = `<div class="budget-chart" role="img" aria-label="Visualisasi pembagian pemasukan">${parts.map(([name, amount, color]) => `<span title="${name} ${percentOf(amount, values.income)}%" style="width:${Math.min(amount / values.income * 100, 100)}%;background:${color}"></span>`).join("")}</div><div class="budget-legend">${parts.map(([name, amount, color]) => `<span><i style="background:${color}"></i>${name}: ${formatRupiah(amount)} (${percentOf(amount, values.income)}%)</span>`).join("")}</div>`;
      html = `<strong>${remaining >= 0 ? `Sisa ${formatRupiah(remaining)}` : `Melebihi pemasukan ${formatRupiah(Math.abs(remaining))}`}</strong>${chart}<p>Persentase dihitung dari pemasukan yang dimasukkan. Sesuaikan pos berdasarkan kebutuhan dan kewajibanmu sendiri.</p>`;
    }
    error.textContent = "";
    result.innerHTML = html;
    result.classList.add("visible");
    const progress = progressFor(profile().id);
    recordSimulation(progress, simulationKey, "Menggunakan kalkulator " + simulationKey);
  }
  function handleLifeSimulator(form) {
    const result = form.querySelector("[data-result]");
    const error = form.querySelector("[data-error]");
    const fields = ["income", "needs", "wants", "savings", "other"];
    const values = Object.fromEntries(fields.map(name => [name, Number(form.elements[name].value)]));
    if (fields.some(name => form.elements[name].value === "" || !Number.isFinite(values[name]) || values[name] < (name === "income" ? 1 : 0) || values[name] > 1e12)) {
      error.textContent = "Isi setiap kategori dengan angka yang valid; pemasukan harus lebih dari nol.";
      result.classList.remove("visible");
      return;
    }
    const events = {
      repair: { title: "Perbaikan sepeda", amount: 120000 },
      health: { title: "Kebutuhan kesehatan", amount: 200000 },
      school: { title: "Perlengkapan sekolah mendadak", amount: 150000 }
    };
    const event = events[form.elements.event.value];
    if (!event) {
      error.textContent = "Pilih kejadian simulasi yang tersedia.";
      result.classList.remove("visible");
      return;
    }
    const planned = values.needs + values.wants + values.savings + values.other;
    const remaining = values.income - planned - event.amount;
    if (!Number.isFinite(planned) || !Number.isFinite(remaining)) {
      error.textContent = "Total anggaran terlalu besar untuk dihitung.";
      result.classList.remove("visible");
      return;
    }
    const evaluation = remaining < 0
      ? `Rencana melebihi pemasukan setelah kejadian sebesar ${formatRupiah(Math.abs(remaining))}. Tinjau pos fleksibel; jangan mengorbankan kebutuhan penting tanpa pertimbangan.`
      : remaining === 0
        ? "Anggaran tepat terpakai setelah kejadian. Tidak ada bantalan untuk perubahan lain."
        : `Tersisa ${formatRupiah(remaining)} sebagai bantalan virtual setelah kebutuhan, tabungan, kewajiban, dan kejadian.`;
    const parts = [["Kebutuhan", values.needs, "#a78bfa"], ["Keinginan", values.wants, "#5ee3db"], ["Tabungan", values.savings, "#78dfb1"], ["Kewajiban", values.other, "#ffce74"], [event.title, event.amount, "#ff9a9f"]];
    result.innerHTML = `<strong>${remaining < 0 ? "Perlu penyesuaian" : "Ringkasan anggaran virtual"}</strong><p>${escapeHtml(evaluation)}</p><div class="budget-chart" role="img" aria-label="Pembagian anggaran virtual">${parts.map(([name, amount, color]) => `<span title="${escapeHtml(name)} ${percentOf(amount, values.income)}%" style="width:${Math.min(amount / values.income * 100, 100)}%;background:${color}"></span>`).join("")}</div><div class="budget-legend">${parts.map(([name, amount, color]) => `<span><i style="background:${color}"></i>${escapeHtml(name)} ${formatRupiah(amount)}</span>`).join("")}</div>`;
    result.classList.add("visible");
    error.textContent = "";
    const progress = progressFor(profile().id);
    progress.simulations.lifeSimulator = {
      income: values.income, needs: values.needs, wants: values.wants, savings: values.savings,
      other: values.other, event: form.elements.event.value, remaining, evaluation, date: new Date().toISOString()
    };
    recordStudyDay(progress);
    recordActivity(progress, "Menyelesaikan satu bulan simulasi keuangan virtual");
    const missionXp = recordMissionEvent(progress, "simulation", "life-simulator", `life-simulator:${localDateKey(new Date())}`);
    const beforeLevel = levelInfo(progress.xp).level;
    const earned = grantReward(progress, "life-simulator:first-run", 15);
    const missionRewards = grantCompletedMissions(progress);
    if (!saveProgress(progress)) return;
    if (missionRewards.length) showToast(`Misi selesai · +${missionRewards.reduce((sum, item) => sum + item.xp, 0)} XP`);
    else if (earned && levelInfo(progress.xp).level > beforeLevel) showLevelUp(levelInfo(progress.xp));
    else if (earned) showToast("Simulasi pertama selesai · +15 XP");
    else if (missionXp) showToast("Simulasi kehidupan tersimpan.");
  }
  function scenarioHtml(index, choiceIndex) {
    const scenario = DATA.scenarios[index];
    return `<span class="scenario-step">SKENARIO ${Number(index) + 1} DARI ${DATA.scenarios.length}</span><p style="margin:10px 0 17px">${escapeHtml(scenario.text)}</p><div class="stack">${scenario.choices.map((choice, i) => `<button class="choice scenario-choice ${choiceIndex === i ? "selected" : ""}" data-action="scenario-choice" data-index="${i}">${escapeHtml(choice.label)}</button>`).join("")}</div><div class="result-box ${choiceIndex === null ? "" : "visible"}" aria-live="polite">${choiceIndex === null ? "" : `<strong>${scenario.choices[choiceIndex].tone === "good" ? "Pertimbangan yang lebih aman" : "Pertimbangkan risikonya"}</strong>${escapeHtml(scenario.choices[choiceIndex].result)}`}</div>`;
  }
  function startQuiz() {
    const form = document.getElementById("quiz-settings");
    const chapter = form.elements.chapter.value;
    const difficulty = form.elements.difficulty.value;
    const topic = form.elements.topic.value;
    const mixed = form.elements.mode.value === "mixed";
    const filters = { chapter: mixed ? "all" : chapter, difficulty, topic, mode: mixed ? "mixed" : "chapter" };
    if (!mixed && topic !== "all" && !QUESTION_BANK.some(question => question.chapter === chapter && question.topic === topic)) {
      showToast("Topik tidak tersedia di bab ini. Pilih topik lain.", true);
      return;
    }
    const pool = QUESTION_BANK.filter(question =>
      (filters.chapter === "all" || question.chapter === filters.chapter) &&
      (filters.difficulty === "all" || question.difficulty === filters.difficulty) &&
      (filters.topic === "all" || question.topic === filters.topic)
    );
    if (!pool.length) {
      showToast("Belum ada soal yang sesuai pilihan. Ubah filter dan coba lagi.", true);
      return;
    }
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    quizState = {
      questions: pool.slice(0, Math.min(QUIZ_SIZE, pool.length)),
      index: 0, selected: null, checked: false, answers: [], filters,
      eventId: createEventId("quiz"),
      rewardKey: `quiz:${filters.mode}:${filters.chapter}:${filters.difficulty}:${filters.topic}`,
      xpEarned: 0, saved: false
    };
    render();
  }
  function finishQuiz() {
    if (!quizState || quizState.saved) return;
    const progress = progressFor(profile().id);
    const beforeLevel = levelInfo(progress.xp).level;
    const beforeAchievements = new Set(progress.achievements);
    let earned = 0;
    quizState.answers.forEach(answer => {
      if (answer.correct) {
        if (grantReward(progress, "question:" + answer.question.id, 5)) earned += 5;
        delete progress.reviewQuestions[answer.question.id];
      } else {
        const previous = progress.reviewQuestions[answer.question.id];
        progress.reviewQuestions[answer.question.id] = {
          count: previous ? previous.count + 1 : 1,
          lastDate: new Date().toISOString()
        };
      }
    });
    if (grantReward(progress, quizState.rewardKey, 10)) earned += 10;
    const correct = quizState.answers.filter(answer => answer.correct).length;
    const percent = quizState.answers.length ? Math.round(correct / quizState.answers.length * 100) : 0;
    progress.quizScores.push({
      correct, total: quizState.answers.length, percent, date: new Date().toISOString(),
      chapter: quizState.filters.chapter, difficulty: quizState.filters.difficulty,
      eventId: quizState.eventId || createEventId("quiz")
    });
    progress.quizScores = progress.quizScores.slice(-30);
    const topicTotals = new Map();
    quizState.answers.forEach(answer => {
      const key = `${answer.question.chapter}\u0000${answer.question.topic}`;
      const total = topicTotals.get(key) || { chapter: answer.question.chapter, topic: answer.question.topic, correct: 0, total: 0 };
      total.total++;
      if (answer.correct) total.correct++;
      topicTotals.set(key, total);
    });
    const scoreDate = new Date().toISOString();
    topicTotals.forEach(item => progress.quizTopicResults.push({ ...item, date: scoreDate }));
    progress.quizTopicResults = progress.quizTopicResults.slice(-200);
    recordStudyDay(progress);
    recordActivity(progress, `Menyelesaikan kuis · ${correct}/${quizState.answers.length} benar`);
    recordMissionEvent(progress, "quiz", quizState.filters.mode === "mixed" ? "campuran" : quizState.filters.chapter, quizState.eventId || createEventId("quiz"));
    const missionRewards = grantCompletedMissions(progress);
    quizState.saved = true;
    const saved = saveProgress(progress);
    quizState.xpEarned = saved ? earned : 0;
    quizState.levelUp = saved && levelInfo(progress.xp).level > beforeLevel ? levelInfo(progress.xp).level : null;
    quizState.newAchievements = saved
      ? ACHIEVEMENTS.filter(item => item.check(progress) && !beforeAchievements.has(item.id)).map(item => item.id)
      : [];
    if (missionRewards.length) showToast(`Misi selesai · +${missionRewards.reduce((sum, item) => sum + item.xp, 0)} XP`);
    else if (quizState.levelUp) showLevelUp(levelInfo(progress.xp));
    else if (saved && earned) showToast(`Kuis selesai · +${earned} XP baru`);
  }
  function quizSetupView() {
    const chapters = DATA.chapters.map(chapter => `<option value="${chapter.id}">${escapeHtml(chapter.title)}</option>`).join("");
    const firstChapter = DATA.chapters[0].id;
    const topics = [...new Set(QUESTION_BANK.filter(question => question.chapter === firstChapter).map(question => question.topic))].sort().map(topic => `<option value="${escapeHtml(topic)}">${escapeHtml(topic)}</option>`).join("");
    return `<div class="page-wrap"><section class="surface quiz-panel"><span class="eyebrow">Arena kuis · ${QUESTION_BANK.length} soal tersedia</span><h1 style="font-size:38px;margin:11px 0">Latihan sesuai tujuanmu.</h1><p class="muted">Pilih bab, tingkat kesulitan, topik, atau campuran. Soal diacak tanpa pengulangan dalam satu sesi dan tidak ada hitung mundur.</p>
      <form id="quiz-settings" class="quiz-settings">
        <div class="field"><label for="quiz-mode">Mode</label><select id="quiz-mode" name="mode"><option value="chapter">Latihan per bab</option><option value="mixed">Campuran semua bab</option></select></div>
        <div class="field"><label for="quiz-chapter">Bab</label><select id="quiz-chapter" name="chapter">${chapters}</select></div>
        <div class="field"><label for="quiz-difficulty">Tingkat kesulitan</label><select id="quiz-difficulty" name="difficulty"><option value="all">Semua tingkat</option><option value="mudah">Mudah</option><option value="menengah">Menengah</option><option value="sulit">Sulit</option></select></div>
        <div class="field"><label for="quiz-topic">Topik</label><select id="quiz-topic" name="topic"><option value="all">Semua topik</option>${topics}</select></div>
        <div class="row"><button class="button button-primary" type="button" data-action="start-quiz">Mulai latihan <span aria-hidden="true">→</span></button><a class="button button-secondary" href="#/review">Ulangi soal yang perlu ditinjau</a></div>
      </form>
      <p class="notice" style="margin-top:18px">XP hanya diberikan satu kali per soal benar dan satu kali per kombinasi filter kuis. Skor kuis tidak sama dengan XP.</p>
    </section></div>`;
  }
  function quizView() {
    if (!quizState) return shell(quizSetupView(), "quiz");
    if (quizState.index >= quizState.questions.length) return quizResultView();
    const question = quizState.questions[quizState.index];
    const feedback = quizState.checked ? `<div class="quiz-feedback ${quizState.selected === question.answer ? "good" : "bad"}" role="status"><strong>${quizState.selected === question.answer ? "Tepat!" : "Belum tepat — gunakan ini sebagai petunjuk belajar."}</strong><br>${escapeHtml(question.explanation)}<p class="small" style="margin:8px 0 0"><strong>Periksa pemahaman:</strong> ${escapeHtml(question.misconception)}<br><strong>Contoh:</strong> ${escapeHtml(question.example)}</p></div>` : "";
    return shell(`<div class="page-wrap"><section class="surface quiz-panel"><div class="quiz-progress-row"><span>PERTANYAAN ${quizState.index + 1} DARI ${quizState.questions.length}</span><span>Benar: ${quizState.answers.filter(answer => answer.correct).length}</span></div><div class="lesson-progress" role="progressbar" aria-label="Progres kuis" aria-valuemin="0" aria-valuemax="${quizState.questions.length}" aria-valuenow="${quizState.index}"><span style="width:${Math.round((quizState.index / quizState.questions.length) * 100)}%"></span></div><p class="eyebrow">${escapeHtml(chapterTitle(question.chapter))} · ${escapeHtml(question.topic)} · ${escapeHtml(question.difficulty)}</p><h1>${escapeHtml(question.question)}</h1><div class="quiz-options">${question.options.map((option, i) => `<button class="choice ${quizState.checked && i === question.answer ? "correct" : ""} ${quizState.checked && i === quizState.selected && i !== question.answer ? "incorrect" : ""}" data-action="quiz-choice" data-index="${i}" aria-pressed="${quizState.selected === i}" ${quizState.checked ? "disabled" : ""}>${escapeHtml(option)}</button>`).join("")}</div>${feedback}<div class="row" style="justify-content:space-between"><button class="button button-quiet" data-action="quiz-exit">Akhiri latihan</button>${quizState.checked ? `<button class="button button-primary" data-action="quiz-next">${quizState.index === quizState.questions.length - 1 ? "Lihat hasil" : "Pertanyaan berikutnya"} →</button>` : `<button class="button button-primary" data-action="quiz-check" ${quizState.selected === null ? "disabled" : ""}>Periksa jawaban</button>`}</div></section></div>`, "quiz");
  }
  function quizResultView() {
    const score = quizState.answers.filter(answer => answer.correct).length;
    const total = quizState.answers.length;
    const percent = total ? Math.round(score / total * 100) : 0;
    const progress = progressFor(profile().id);
    const next = firstUncompletedLesson(progress);
    const currentLevel = levelInfo(progress.xp);
    const wrong = quizState.answers.filter(answer => !answer.correct);
    const reviewList = wrong.length ? `<div class="review-result-list">${wrong.map(item => `<article class="review-result"><strong>${escapeHtml(item.question.topic)}</strong><p>${escapeHtml(item.question.question)}</p><p class="small muted">${escapeHtml(item.question.explanation)}</p><a class="text-link small" href="#/lesson/${lessonIdForChapter(item.question.chapter)}">Buka materi terkait →</a></article>`).join("")}</div>` : `<div class="empty-state">Tidak ada soal yang perlu diulang dari sesi ini. Bagus, tetap tinjau konsep saat dibutuhkan.</div>`;
    const nextAction = next
      ? `<a class="button button-primary" href="#/lesson/${next.id}">Lanjut belajar · ${escapeHtml(next.title)} →</a>`
      : `<a class="button button-primary" href="#/learn">Semua materi selesai · buka Learning Path</a>`;
    const newAchievements = (quizState.newAchievements || []).map(id => ACHIEVEMENTS.find(item => item.id === id)).filter(Boolean);
    return shell(`<div class="page-wrap"><section class="surface quiz-panel"><span class="eyebrow">Kuis selesai · ${escapeHtml(quizState.filters.mode === "mixed" ? "Campuran" : chapterTitle(quizState.filters.chapter))}</span><h1 style="font-size:34px;margin:12px 0">Setiap jawaban jadi bekal.</h1><div class="result-score">${percent}%</div><p class="lead" style="font-size:16px">Kamu menjawab ${score} dari ${total} pertanyaan dengan benar.</p><div class="result-details"><div><strong>${score}/${total}</strong><span class="small muted">Nilai kuis</span></div><div><strong>${wrong.length}</strong><span class="small muted">Soal untuk ditinjau</span></div><div><strong>+${quizState.xpEarned}</strong><span class="small muted">XP baru (jika tersimpan)</span></div></div><section class="level-panel surface-soft quiz-level-summary" aria-label="Progres level"><div class="split"><div><span class="eyebrow">Level ${currentLevel.level} · ${escapeHtml(currentLevel.title)}</span><p class="muted small" style="margin:5px 0 0">${progress.xp} XP · ${currentLevel.remaining} XP menuju level berikutnya</p></div><strong class="level-number">${currentLevel.level}</strong></div><div class="lesson-progress" role="progressbar" aria-label="Progres level" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${currentLevel.progress}"><span style="width:${currentLevel.progress}%"></span></div><div class="level-foot"><span>${currentLevel.progress}% menuju level berikutnya</span><span>${progress.completed.length}/${allLessons().length} materi selesai</span></div></section>${quizState.levelUp ? `<p class="completion-unlock" role="status">Level ${quizState.levelUp} terbuka · ${escapeHtml(levelInfo(progress.xp).title)}</p>` : ""}${newAchievements.length ? `<div class="completion-achievements"><span class="eyebrow">PENCAPAIAN BARU</span><div>${newAchievements.map(item => `<span class="achievement-chip">${item.icon} ${escapeHtml(item.name)}</span>`).join("")}</div></div>` : ""}<p class="muted">${percent >= 80 ? "Pemahamanmu terlihat kuat pada latihan ini. Penerapan konsep tetap bergantung pada situasi nyata." : "Satu sesi belum menggambarkan seluruh pemahamanmu. Gunakan pembahasan untuk memperkuat bagian tertentu."}</p>${!next ? `<div class="notice completion-finished" role="status">Seluruh materi yang tersedia telah ditandai selesai. Kamu dapat mengulang materi atau memilih jalur lain.</div>` : ""}<div class="section-heading" style="margin:25px 0 14px"><div><span class="eyebrow">Penguatan pemahaman</span><h2 style="font-size:22px">Soal yang bisa ditinjau</h2></div></div>${reviewList}<div class="row" style="margin-top:22px">${nextAction}<button class="button button-secondary" data-action="quiz-reset">Atur latihan baru</button><a class="button button-quiet" href="#/review">Buka pusat review</a><a class="button button-quiet" href="#/progress">Lihat progres</a></div></section></div>`, "quiz");
  }
  function chapterTitle(id) {
    const chapter = DATA.chapters.find(item => item.id === id);
    return chapter ? chapter.title : "Latihan campuran";
  }
  function lessonIdForChapter(id) {
    const chapter = DATA.chapters.find(item => item.id === id);
    return chapter ? chapter.lessons[0].id : allLessons()[0].id;
  }
  function progressView() {
    const user = profile();
    const progress = progressFor(user.id);
    const level = levelInfo(progress.xp);
    const chapterList = DATA.chapters.map(chapter => {
      const done = chapter.lessons.filter(lesson => progress.completed.includes(lesson.id)).length;
      const percent = Math.round(done / chapter.lessons.length * 100);
      return `<div class="surface progress-chapter"><span><strong>${escapeHtml(chapter.title)}</strong><span class="small muted" style="display:block">${done}/${chapter.lessons.length} materi</span></span><span class="small muted">${percent}%</span><div class="lesson-progress"><span style="width:${percent}%"></span></div></div>`;
    }).join("");
    const scores = progress.quizScores.length ? `<div class="score-list">${progress.quizScores.slice().reverse().slice(0, 5).map(item => `<div class="score-row"><span>${new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span><strong>${item.correct}/${item.total} · ${item.percent}%</strong></div>`).join("")}</div>` : `<div class="empty-state">Belum ada kuis yang diselesaikan. Coba kuis pertamamu kapan saja.</div>`;
    return shell(`<div class="page-wrap"><span class="eyebrow">Ruang progres</span><h1 style="font-size:clamp(35px,5vw,48px);margin:10px 0 25px">Belajar dengan ritmemu.</h1><section class="level-panel surface-soft"><div class="split"><div><span class="eyebrow">Level ${level.level} · ${escapeHtml(level.title)}</span><p class="muted small" style="margin:5px 0 0">${progress.xp} XP terkumpul · ${level.remaining} XP menuju level berikutnya</p></div><strong class="level-number">${level.level}</strong></div><div class="lesson-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${level.progress}"><span style="width:${level.progress}%"></span></div><div class="level-foot"><span>${level.progress}% menuju level selanjutnya</span><span>Tidak ada XP berdasarkan kecepatan</span></div></section><section class="progress-grid" style="margin-top:16px"><div class="surface progress-stat"><span>Materi selesai</span><strong>${progress.completed.length}/${allLessons().length}</strong></div><div class="surface progress-stat"><span>Latihan perlu ditinjau</span><strong>${Object.keys(progress.reviewQuestions).length + Object.keys(progress.reviewLessons).length}</strong></div><div class="surface progress-stat"><span>Hari belajar tercatat</span><strong>${progress.studyDays.length}</strong></div></section><p class="notice" style="margin-top:16px"><strong>Aturan XP:</strong> materi, latihan benar, soal kuis, kuis pertama per filter, simulator per jenis, dan tantangan memberi reward terbatas; misi memberi XP harian/mingguan saat target aktivitas tercapai. Simulator kehidupan dan tiap challenge memberi bonus satu kali. Tidak ada reward berdasarkan kecepatan atau refresh.</p>
      <div class="section-heading"><div><span class="eyebrow">Jejak materi</span><h2>Perjalanan per bab</h2></div></div><section class="progress-chapters">${chapterList}</section>
      <div class="section-heading"><div><span class="eyebrow">Latihan pemahaman</span><h2>Hasil kuis terbaru</h2></div><a class="text-link small" href="#/review">Lihat materi review →</a></div><section class="surface pad">${scores}</section>
      <div class="section-heading"><div><span class="eyebrow">Koleksi belajarmu</span><h2>Pencapaian</h2></div><a class="text-link small" href="#/achievements">Semua pencapaian →</a></div><section class="achievement-preview">${ACHIEVEMENTS.filter(item => item.check(progress)).map(item => `<span class="achievement-chip">${item.icon} ${escapeHtml(item.name)}</span>`).join("") || `<div class="empty-state">Pencapaian akan terbuka saat syarat belajarnya terpenuhi.</div>`}</section>
      <section class="surface pad" style="margin-top:22px"><div class="split"><div><h3 style="margin-bottom:5px">Atur ulang progres</h3><p class="small muted" style="margin:0">Materi, XP, pencapaian, skor, hari belajar, dan riwayat review profil ini akan dihapus dari browser.</p></div><button class="button button-danger" data-action="reset-progress">Reset progres</button></div></section>
      <p class="notice" style="margin-top:18px">XP, progres, dan pencapaian hanya tersimpan di browser ini dan dapat diubah melalui perangkat. Tidak ada data yang dikirim ke server atau tersinkron ke perangkat lain.</p>
    </div>`, "progress");
  }
  function achievementsView() {
    const progress = progressFor(profile().id);
    const cards = ACHIEVEMENTS.map(item => {
      const unlocked = item.check(progress);
      return `<article class="achievement-item surface ${unlocked ? "unlocked" : "locked"}"><span class="achievement-icon" aria-hidden="true">${unlocked ? item.icon : "◇"}</span><div><h2>${escapeHtml(item.name)} ${unlocked ? '<span class="badge success">Terbuka</span>' : '<span class="badge">Terkunci</span>'}</h2><p>${escapeHtml(item.description)}</p></div></article>`;
    }).join("");
    const today = new Date();
    const dailyKey = localDateKey(today);
    const weeklyKey = currentWeekKey(today);
    const dailyCards = DAILY_MISSIONS.map(mission =>
      missionCardHtml(mission, missionProgress(progress, mission, "day", dailyKey), `mission:daily:${dailyKey}:${mission.id}`, progress.rewardIds)
    ).join("");
    const weeklyCards = WEEKLY_MISSIONS.map(mission =>
      missionCardHtml(mission, missionProgress(progress, mission, "week", weeklyKey), `mission:weekly:${weeklyKey}:${mission.id}`, progress.rewardIds)
    ).join("");
    return shell(`<div class="page-wrap"><span class="eyebrow">Daily Mission & Achievement Center</span><h1 class="feature-title">Rayakan langkah nyata.</h1><p class="feature-lead lead">Misi diperbarui berdasarkan aktivitas belajar yang tersimpan. Hadiah setiap misi hanya bisa diklaim sekali per hari atau pekan.</p><section class="mission-period"><div class="section-heading"><div><span class="eyebrow">HARI INI · ${dailyKey}</span><h2>Misi harian</h2></div><span class="mission-reward-note">Maks. 30 XP</span></div><div class="mission-grid">${dailyCards}</div></section><section class="mission-period"><div class="section-heading"><div><span class="eyebrow">PEKAN DIMULAI · ${weeklyKey}</span><h2>Misi mingguan</h2></div><span class="mission-reward-note">Maks. 70 XP</span></div><div class="mission-grid">${weeklyCards}</div></section><section class="section-heading"><div><span class="eyebrow">PENCAPAIAN</span><h2>Koleksi belajarmu</h2></div></section><section class="achievement-grid">${cards}</section><p class="notice" style="margin-top:20px">XP, misi, dan pencapaian tersimpan pada profil lokal browser ini. Misi dan badge bukan sertifikasi kemampuan.</p></div>`, "achievements");
  }
  function reviewView() {
    const progress = progressFor(profile().id);
    const wrongIds = Object.keys(progress.reviewQuestions);
    const wrongLessonIds = Object.keys(progress.reviewLessons);
    const wrongQuestions = wrongIds.map(id => {
      const question = QUESTION_BANK.find(item => item.id === id);
      return question ? { question, record: progress.reviewQuestions[id] } : null;
    }).filter(Boolean);
    const unfinished = allLessons().filter(lesson => !progress.completed.includes(lesson.id));
    const questionCards = wrongQuestions.map(({ question, record }) => `<article class="review-result surface"><span class="eyebrow">${escapeHtml(chapterTitle(question.chapter))} · ${escapeHtml(question.topic)}</span><h2>${escapeHtml(question.question)}</h2><p class="small muted">Pernah ditinjau ${record.count} kali · terakhir ${new Date(record.lastDate).toLocaleDateString("id-ID")}</p><button class="button button-quiet" data-action="review-explanation" data-target="review-explanation-${question.id}" aria-expanded="false">Lihat pembahasan</button><div class="review-explanation" id="review-explanation-${question.id}" hidden><p>${escapeHtml(question.explanation)}</p><p class="small muted">${escapeHtml(question.misconception)} ${escapeHtml(question.example)}</p></div><div class="row" style="margin-top:12px"><button class="button button-secondary" data-action="review-question" data-id="${question.id}">Coba soal ini lagi</button><a class="text-link small" href="#/lesson/${lessonIdForChapter(question.chapter)}">Buka materi terkait →</a></div></article>`).join("");
    const lessonReviewCards = wrongLessonIds.map(id => {
      const lesson = allLessons().find(item => item.id === id);
      const record = progress.reviewLessons[id];
      return lesson ? `<article class="review-result surface"><span class="eyebrow">${escapeHtml(lesson.chapter.title)} · Latihan materi</span><h2>${escapeHtml(lesson.practice)}</h2><p class="small muted">Latihan ini bisa dicoba kembali · pernah keliru ${record.count} kali</p><button class="button button-quiet" data-action="review-explanation" data-target="review-explanation-${lesson.id}" aria-expanded="false">Lihat pembahasan</button><div class="review-explanation" id="review-explanation-${lesson.id}" hidden><p>${escapeHtml(lesson.explanation)}</p></div><a class="button button-secondary" style="margin-top:12px" href="#/lesson/${lesson.id}">Buka kembali materi →</a></article>` : "";
    }).join("");
    const combinedCards = questionCards + lessonReviewCards;
    const reviewContent = combinedCards || `<div class="empty-state">Belum ada soal yang ditandai untuk ditinjau. Jawaban yang keliru akan muncul di sini sebagai kesempatan belajar.</div>`;
    const lessonCards = unfinished.length ? unfinished.slice(0, 6).map(lesson => `<a class="review-lesson" href="#/lesson/${lesson.id}">${escapeHtml(lesson.title)} <span>→</span></a>`).join("") : `<div class="empty-state">Semua materi sudah ditandai selesai. Kamu dapat membukanya kembali kapan saja.</div>`;
    return shell(`<div class="page-wrap"><span class="eyebrow">Penguatan pemahaman</span><h1 style="font-size:clamp(35px,5vw,48px);margin:10px 0">Materi yang bisa diulang.</h1><p class="lead" style="font-size:16px">Kesalahan satu kali bukan label kemampuan. Gunakan soal dan materi ini untuk memperkuat pemahaman dengan ritmemu.</p><div class="row" style="margin:21px 0"><button class="button button-danger" data-action="clear-review" ${combinedCards ? "" : "disabled"}>Hapus riwayat soal salah</button><a class="button button-secondary" href="#/quiz">Latihan kuis baru</a></div><section class="review-list">${reviewContent}</section><div class="section-heading"><div><span class="eyebrow">Perjalanan materi</span><h2>Materi belum selesai</h2></div></div><section class="review-lesson-list">${lessonCards}</section><p class="notice" style="margin-top:20px">Riwayat review tersimpan lokal pada browser ini. Menghapus progres dari halaman Progres akan menghapus semua hasil dan riwayat.</p></div>`, "review");
  }
  function adminView() {
    const lessonRows = allLessons().map((lesson, i) => `<tr><td>${String(i + 1).padStart(2, "0")}</td><td>${escapeHtml(lesson.title)}</td><td>${escapeHtml(lesson.chapter.title)}</td><td>Aktif · demo</td></tr>`).join("");
    const questionRows = QUESTION_BANK.map((question, i) => `<tr><td>${String(i + 1).padStart(2, "0")}</td><td>${escapeHtml(question.question)}</td><td>${escapeHtml(question.topic)} · ${escapeHtml(question.difficulty)}</td></tr>`).join("");
    return shell(`<div class="page-wrap"><div class="admin-banner"><div><span class="demo-label">ADMIN DEMO</span><h1 style="font-size:34px;margin:12px 0 5px">Pratinjau pengelolaan konten</h1><p class="small muted" style="margin:0">Contoh statis · bukan panel administrasi sungguhan</p></div><a class="button button-secondary" href="#/home">← Kembali</a></div>
      <div class="section-heading"><div><span class="eyebrow">Ringkasan demo</span><h2>Konten yang tersedia</h2></div></div>
      <section class="progress-grid"><div class="surface progress-stat"><span>Bab tersedia</span><strong>${DATA.chapters.length + PATHS.literacyChapters.length + PATHS.curriculum.length}</strong></div><div class="surface progress-stat"><span>Total materi</span><strong>${allLessons().length}</strong></div><div class="surface progress-stat"><span>Soal kuis</span><strong>${QUESTION_BANK.length}</strong></div></section>
      <div class="section-heading"><div><span class="eyebrow">Perpustakaan</span><h2>Daftar materi</h2></div></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>No.</th><th>Materi</th><th>Bab</th><th>Status</th></tr></thead><tbody>${lessonRows}</tbody></table></div>
      <div class="section-heading"><div><span class="eyebrow">Arena kuis</span><h2>Daftar soal</h2></div></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>No.</th><th>Pertanyaan</th><th>Format</th></tr></thead><tbody>${questionRows}</tbody></table></div>
      <div class="section-heading"><div><span class="eyebrow">Privasi & batasan</span><h2>Progres siswa demo</h2></div></div><div class="surface pad"><div class="empty-state">Tidak ada data siswa yang ditampilkan. Profil dan progres belajar tersimpan di browser masing-masing pengguna, bukan di server admin.</div><p class="notice" style="margin:17px 0 0">Admin demo ini tidak mengubah konten dan tidak menyimpan perubahan. Pengelolaan sungguhan membutuhkan backend, kontrol akses, dan autentikasi terverifikasi.</p></div>
    </div>`, "");
  }
  function mapView() {
    const progress = progressFor(profile().id);
    const completion = progress.completed.length;
    const nextLesson = allLessons().find(lesson => !progress.completed.includes(lesson.id));
    const nextLiteracyLesson = pathLessons("literacy").find(lesson => !progress.completed.includes(lesson.id));
    const rows = allChapters().filter(chapter => chapter.track === "literacy").map(chapter => {
      const lessons = chapterLessons(chapter);
      const done = lessons.filter(lesson => progress.completed.includes(lesson.id)).length;
      const isCurrent = nextLiteracyLesson && nextLiteracyLesson.chapter.id === chapter.id;
      const status = done === lessons.length ? "Bab selesai" : isCurrent ? "Sedang dipelajari" : done ? "Dalam progres" : "Belum dimulai";
      return `<a class="map-row spotlight-surface ${done === lessons.length ? "map-complete" : ""} ${isCurrent ? "map-current" : ""}" href="#/chapter/${chapter.id}" aria-label="Bab ${escapeHtml(chapter.number)}: ${escapeHtml(chapter.title)}. ${done} dari ${lessons.length} materi selesai. ${status}." ${isCurrent ? 'aria-current="step"' : ""}><span class="map-marker ${done === lessons.length ? "map-done" : isCurrent ? "map-current" : ""}">${done === lessons.length ? "✓" : chapter.number}</span><span><strong>${escapeHtml(chapter.title)}</strong><small>${done}/${lessons.length} materi selesai · ${status}</small></span><span aria-hidden="true">→</span></a>`;
    }).join("");
    return shell(`<div class="page-wrap"><span class="eyebrow">Peta perjalanan</span><h1 style="font-size:clamp(35px,5vw,48px);margin:10px 0">Satu langkah pada satu waktu.</h1><p class="lead" style="font-size:16px">Kamu sudah menyelesaikan ${completion} dari ${allLessons().length} materi. Pilih langkah berikutnya, atau lompat ke bab yang kamu butuhkan.</p>${nextLesson ? `<section class="surface next-step"><div><span class="eyebrow">LANGKAH BERIKUTNYA</span><h2>${escapeHtml(nextLesson.title)}</h2><p>${escapeHtml(nextLesson.chapter.title)}</p></div><a class="button button-primary" href="#/lesson/${nextLesson.id}">Lanjutkan belajar →</a></section>` : '<div class="notice">Semua materi saat ini selesai. Kamu dapat mengulang materi atau mencoba simulasi.</div>'}<section class="section-heading"><div><span class="eyebrow">PETA BAB</span><h2>Jalur literasi keuangan</h2></div><a class="text-link" href="#/curriculum">Kurikulum kelas 10–12 →</a></section><section class="map-list">${rows}</section><p class="notice" style="margin-top:24px">Progres disimpan secara lokal di browser ini. Data tidak tersinkron ke perangkat lain.</p></div>`, "map");
  }
  function profileView() {
    const user = profile();
    if (!user || user.role !== "student") return notFoundView();
    return shell(`<div class="page-wrap narrow"><span class="eyebrow">Profil & pengaturan</span><h1 style="font-size:clamp(35px,5vw,48px);margin:10px 0">Ruang belajarmu.</h1><p class="lead" style="font-size:16px">Perbarui nama atau kelas yang ditampilkan. ID profil lokal tetap sama sehingga progres tidak berubah.</p><section class="surface pad"><form id="profile-form"><div class="field"><label for="profile-name">Nama lengkap</label><input id="profile-name" name="name" value="${escapeHtml(user.name)}" minlength="2" maxlength="80" required></div><div class="field"><label for="profile-class">Kelas atau peran</label><input id="profile-class" name="className" value="${escapeHtml(user.className)}" minlength="2" maxlength="40" required></div><p class="form-message" id="profile-error" role="alert"></p><button class="button button-primary" type="submit">Simpan profil</button></form></section><section class="surface pad" style="margin-top:18px"><span class="eyebrow">DATA & PRIVASI</span><h2 style="font-size:21px;margin:10px 0">Penyimpanan browser</h2><p>Profil dan progres hanya tersimpan pada browser/perangkat ini jika penyimpanan lokal tersedia. Identitas tidak diverifikasi, data tidak dikirim ke server, dan tidak tersinkron otomatis antarperangkat.</p><div class="row"><a class="button button-secondary" href="#/progress">Lihat progres</a><button class="button button-quiet" data-action="logout">Keluar dan ganti profil</button></div></section></div>`, "");
  }
  function recordSimulation(progressOrKey, keyOrLabel, optionalLabel) {
    const suppliedProgress = progressOrKey && typeof progressOrKey === "object";
    const progress = suppliedProgress ? progressOrKey : progressFor(profile().id);
    const key = suppliedProgress ? keyOrLabel : progressOrKey;
    const label = suppliedProgress ? optionalLabel : keyOrLabel;
    progress.simulations = progress.simulations || {};
    progress.simulations[key] = true;
    recordStudyDay(progress);
    recordActivity(progress, label);
    recordMissionEvent(progress, "simulation", key, `simulation:${localDateKey(new Date())}:${key}`);
    const beforeLevel = levelInfo(progress.xp).level;
    const earned = grantReward(progress, "simulation:" + key, 10);
    const missionRewards = grantCompletedMissions(progress);
    const saved = saveProgress(progress);
    if (!saved) return;
    if (missionRewards.length) showToast(`Misi selesai · +${missionRewards.reduce((sum, item) => sum + item.xp, 0)} XP`);
    else if (earned && levelInfo(progress.xp).level > beforeLevel) showLevelUp(levelInfo(progress.xp));
    else if (earned) showToast("Simulasi selesai · +10 XP");
  }
  function handleExtraSimulation(form) {
    const error = form.querySelector("[data-error]");
    const result = form.querySelector("[data-result]");
    const fields = Array.from(form.querySelectorAll("input[type='number']"));
    const values = Object.fromEntries(fields.map(field => [field.name, Number(field.value)]));
    const missing = fields.some(field => field.value === "");
    const invalid = fields.some(field => !Number.isFinite(Number(field.value)) || Number(field.value) < Number(field.min || 0) || Number(field.value) > Number(field.max || Infinity));
    if (missing || invalid) {
      error.textContent = "Periksa kembali semua angka. Nilai harus berada dalam rentang yang tertera.";
      result.classList.remove("visible");
      return;
    }
    let message = "";
    let key = form.dataset.form;
    let label = "Mencoba simulasi " + key;
    if (key === "fraud-check" && !form.elements.response.value) {
      error.textContent = "Pilih respons sebelum memeriksa skenario.";
      result.classList.remove("visible");
      return;
    }
    if (key === "savings-goal") {
      const gap = Math.max(0, values.goal - values.current);
      const monthly = gap / values.months;
      message = values.current >= values.goal
        ? `Target sudah tercapai. Tabungan saat ini ${formatRupiah(values.current)} memenuhi atau melampaui target.`
        : `Kesenjangan target ${formatRupiah(gap)}. Rata-rata setoran yang diperlukan sekitar ${formatRupiah(Math.ceil(monthly))} per bulan selama ${values.months} bulan, tanpa menghitung bunga atau biaya.`;
      label = "Menghitung target tabungan";
    } else if (key === "loan-cost") {
      const total = values.payment * values.months + values.fees;
      if (!Number.isFinite(total)) { error.textContent = "Total biaya terlalu besar untuk dihitung."; result.classList.remove("visible"); return; }
      const difference = total - values.principal;
      message = `Perkiraan total pembayaran ${formatRupiah(total)} termasuk biaya tambahan. Selisih terhadap pokok adalah ${difference >= 0 ? formatRupiah(difference) + " di atas pokok" : formatRupiah(Math.abs(difference)) + " di bawah pokok"}. Pastikan angka cicilan dan biaya mencerminkan kontrak sebenarnya.`;
      label = "Menghitung biaya pinjaman ilustratif";
    } else if (key === "portfolio") {
      const ending = values.start * Math.pow(1 + values.rate / 100, values.years);
      if (!Number.isFinite(ending)) { error.textContent = "Asumsi menghasilkan angka yang tidak dapat dihitung."; result.classList.remove("visible"); return; }
      const delta = ending - values.start;
      message = `Dalam asumsi tetap ${values.rate}% per tahun, nilai virtual menjadi sekitar ${formatRupiah(ending)} (${delta >= 0 ? "naik" : "turun"} ${formatRupiah(Math.abs(delta))}). Nilai nyata berubah-ubah; skenario ini tidak meramalkan hasil investasi.`;
      label = "Menguji skenario portofolio virtual";
    } else if (key === "business") {
      const revenue = values.price * values.units;
      const variableCost = values.variable * values.units;
      const profit = revenue - variableCost - values.fixed;
      const margin = values.price - values.variable;
      const breakEven = margin > 0 ? Math.ceil(values.fixed / margin) : null;
      if (![revenue, variableCost, profit].every(Number.isFinite)) { error.textContent = "Nilai terlalu besar untuk dihitung."; result.classList.remove("visible"); return; }
      message = `Pendapatan ${formatRupiah(revenue)}; biaya variabel ${formatRupiah(variableCost)}; perkiraan laba/rugi sederhana ${formatRupiah(profit)}. ${breakEven === null ? "Dengan biaya variabel setara atau melebihi harga, titik impas tidak tercapai pada struktur biaya ini." : `Perkiraan titik impas ${breakEven} unit.`} Belum termasuk pajak dan komponen biaya lain.`;
      label = "Menghitung usaha virtual";
    } else if (key === "fraud-check") {
      const scenario = Number(form.elements.case.value);
      const response = form.elements.response.value;
      const context = [
        "Kode OTP adalah rahasia. Pihak yang meminta OTP untuk mengirim hadiah patut dicurigai.",
        "Janji keuntungan pasti dan tekanan untuk segera transfer adalah tanda bahaya; investasi selalu memiliki risiko.",
        "Bank tidak membutuhkan PIN untuk verifikasi melalui telepon. Jangan bagikan PIN atau kode akses."
      ][scenario];
      const correct = response === "verify";
      message = `${correct ? "Respons lebih aman." : "Pilihan ini berisiko."} ${context} Hentikan komunikasi, jangan klik tautan, dan hubungi kanal resmi yang kamu cari sendiri.`;
      result.innerHTML = `<strong>${correct ? "Tepat: verifikasi secara mandiri" : "Berhenti dan periksa ulang"}</strong><p>${escapeHtml(message)}</p>`;
      result.classList.add("visible");
      error.textContent = "";
      if (correct) recordSimulation("fraud-check", "Berlatih mengenali tanda penipuan");
      return;
    }
    error.textContent = "";
    result.innerHTML = `<strong>Hasil simulasi</strong><p>${escapeHtml(message)}</p>`;
    result.classList.add("visible");
    recordSimulation(key, label);
  }
  function refreshLearningResults() {
    const container = document.getElementById("learning-results");
    if (!container) return;
    const query = (document.getElementById("learning-search").value || "").trim().toLocaleLowerCase("id");
    const track = document.getElementById("learning-track").value;
    const grade = document.getElementById("learning-grade").value;
    const chapter = document.getElementById("learning-chapter").value;
    const status = document.getElementById("learning-status").value;
    const sort = document.getElementById("learning-sort").value;
    const progress = progressFor(profile().id);
    const matching = allLessons().filter(lesson => {
      const haystack = [lesson.title, lesson.opener, lesson.concept, lesson.example, lesson.chapter.title, lesson.objective || ""].join(" ").toLocaleLowerCase("id");
      return (!query || haystack.includes(query)) &&
        (track === "all" || (track === "literacy" && ["legacy", "literacy"].includes(lesson.track)) || lesson.track === track) &&
        (grade === "all" || String(lesson.grade || "") === grade) &&
        (chapter === "all" || lesson.chapter.id === chapter) &&
        (status === "all" || (status === "done") === progress.completed.includes(lesson.id));
    });
    if (sort === "title") matching.sort((a, b) => a.title.localeCompare(b.title, "id"));
    if (sort === "time") matching.sort((a, b) => (a.minutes || 5) - (b.minutes || 5) || a.title.localeCompare(b.title, "id"));
    document.getElementById("finder-count").textContent = `${matching.length} materi ditemukan`;
    container.innerHTML = matching.length ? matching.slice(0, 60).map(lesson => `<a class="learning-result" href="#/lesson/${lesson.id}"><span class="eyebrow">${lesson.track === "curriculum" ? `KELAS ${lesson.grade} · PENGAYAAN` : lesson.track === "legacy" ? "FONDASI KEUANGAN" : "JALUR LITERASI KEUANGAN"} · ${escapeHtml(lesson.chapter.title)}</span><strong>${escapeHtml(lesson.title)}</strong><span class="small muted">${escapeHtml(lesson.opener)}</span><span class="small ${progress.completed.includes(lesson.id) ? "done-mark" : "muted"}">${progress.completed.includes(lesson.id) ? "Selesai ✓" : "Belum selesai"} · ${lesson.minutes || 5} menit →</span></a>`).join("") : '<div class="empty-state">Tidak ada materi yang cocok. Coba kata kunci atau filter lain.</div>';
    if (matching.length > 60) document.getElementById("finder-count").textContent += " · menampilkan 60 hasil pertama";
  }
  function notFoundView() {
    return shell(`<div class="page-wrap narrow"><div class="surface pad"><span class="eyebrow">Halaman tidak ditemukan</span><h1 style="font-size:36px;margin:12px 0">Sepertinya tautan ini belum tersedia.</h1><a class="button button-primary" href="#/dashboard">Kembali ke beranda</a></div></div>`, "");
  }
  function render() {
    const current = route();
    const user = profile();
    if (current === "home" || current === "") {
      if (user && user.role === "student") { ROOT.innerHTML = dashboardView(); return; }
      if (user && user.role === "admin-demo") { ROOT.innerHTML = adminView(); return; }
      ROOT.innerHTML = loginView();
      return;
    }
    if (!user) { ROOT.innerHTML = loginView(); return; }
    if (current === "dashboard" && user.role === "student") ROOT.innerHTML = dashboardView();
    else if (current === "learn" && user.role === "student") { ROOT.innerHTML = learnView(); refreshLearningResults(); }
    else if (current === "literacy" && user.role === "student") ROOT.innerHTML = literacyView();
    else if (current === "curriculum" && user.role === "student") ROOT.innerHTML = curriculumView();
    else if (current.startsWith("curriculum/") && user.role === "student") ROOT.innerHTML = curriculumView(current.split("/")[1]);
    else if (current === "map" && user.role === "student") ROOT.innerHTML = mapView();
    else if (current === "profile" && user.role === "student") ROOT.innerHTML = profileView();
    else if (current.startsWith("chapter/") && user.role === "student") ROOT.innerHTML = chapterView(current.slice(8));
    else if (current.startsWith("lesson/") && user.role === "student") ROOT.innerHTML = lessonView(current.slice(7));
    else if (current.startsWith("completion/") && user.role === "student") ROOT.innerHTML = completionView(current.slice(11));
    else if (current === "simulations" && user.role === "student") ROOT.innerHTML = simulationsView();
    else if (current === "finance-lab" && user.role === "student") ROOT.innerHTML = financeLabView();
    else if (current === "challenges" && user.role === "student") ROOT.innerHTML = challengesView();
    else if (current === "life-simulator" && user.role === "student") ROOT.innerHTML = lifeSimulatorView();
    else if (current === "insights" && user.role === "student") ROOT.innerHTML = insightsView();
    else if (current === "quiz" && user.role === "student") ROOT.innerHTML = quizView();
    else if (current === "progress" && user.role === "student") ROOT.innerHTML = progressView();
    else if (current === "review" && user.role === "student") ROOT.innerHTML = reviewView();
    else if (current === "achievements" && user.role === "student") ROOT.innerHTML = achievementsView();
    else if (current === "admin" && user.role === "admin-demo") ROOT.innerHTML = adminView();
    else ROOT.innerHTML = notFoundView();
  }

  ROOT.addEventListener("click", function (event) {
    audioUnlocked = true;
    const tab = event.target.closest("[role='tab']");
    if (tab) {
      currentStudentTab = tab.id === "tab-student";
      render();
      document.getElementById(currentStudentTab ? "tab-student" : "tab-admin").focus();
      return;
    }
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "admin-enter") {
      if (!writeStore(PROFILE_KEY, { id: "demo-" + Math.random().toString(36).slice(2, 10), role: "admin-demo", name: "Admin demo" })) return;
      go("admin");
    } else if (action === "logout") {
      try { localStorage.removeItem(PROFILE_KEY); } catch (error) {
        console.error("ECONOVA: profil tidak dapat dihapus dari penyimpanan lokal.", error);
        showToast("Profil tidak dapat dihapus dari browser.", true);
        return;
      }
      currentStudentTab = true;
      quizState = null;
      go("home");
    } else if (action === "practice-choice") {
      const choices = ROOT.querySelectorAll("[data-action='practice-choice']");
      choices.forEach(choice => {
        choice.setAttribute("aria-pressed", String(choice === button));
        choice.classList.remove("correct", "incorrect");
        delete choice.dataset.selected;
      });
      button.dataset.selected = "true";
    } else if (action === "practice-check") {
      const selected = ROOT.querySelector("[data-action='practice-choice'][data-selected='true']");
      const feedback = document.getElementById("practice-feedback");
      if (!selected) { feedback.textContent = "Pilih satu jawaban terlebih dahulu."; return; }
      const correct = Number(selected.dataset.index) === Number(button.dataset.answer);
      playAudioCue(correct ? "correct" : "incorrect");
      let explanation = "";
      try { explanation = decodeURIComponent(button.dataset.explanation); } catch (error) { explanation = "Periksa kembali konsep utama materi ini."; }
      selected.classList.add(correct ? "correct" : "incorrect");
      feedback.textContent = (correct ? "Benar. " : "Belum tepat. ") + explanation;
      const lessonId = route().slice(7);
      const progress = progressFor(profile().id);
      progress.reviewLessons = progress.reviewLessons || {};
      if (correct) {
        const beforeLevel = levelInfo(progress.xp).level;
        progress.practiced = progress.practiced || [];
        const firstPractice = !progress.practiced.includes(lessonId);
        let earned = false;
        if (firstPractice) {
          progress.practiced.push(lessonId);
          earned = grantReward(progress, "practice:" + lessonId, 5);
        }
        const wasReview = Boolean(progress.reviewLessons[lessonId]);
        delete progress.reviewLessons[lessonId];
        if (firstPractice || wasReview) {
          recordStudyDay(progress);
          recordActivity(progress, "Latihan materi · " + lessonId);
          saveProgress(progress);
        }
        if (earned && levelInfo(progress.xp).level > beforeLevel) showLevelUp(levelInfo(progress.xp));
        else if (earned) showToast("Jawaban benar · +5 XP belajar");
        const completionButton = ROOT.querySelector("[data-action='complete-lesson']");
        if (completionButton) {
          completionButton.disabled = false;
          completionButton.removeAttribute("aria-describedby");
        }
        const requirement = document.getElementById("completion-requirement");
        if (requirement) requirement.textContent = "Latihan sudah benar. Kamu dapat menyelesaikan materi ini.";
      } else {
        const previous = progress.reviewLessons[lessonId];
        progress.reviewLessons[lessonId] = { count: previous ? previous.count + 1 : 1, lastDate: new Date().toISOString() };
        saveProgress(progress);
      }
    } else if (action === "show-completion") {
      const lesson = allLessons().find(item => item.id === button.dataset.id);
      if (lesson && progressFor(profile().id).completed.includes(lesson.id)) go("completion/" + lesson.id);
    } else if (action === "completion-next") {
      const currentId = route().slice("completion/".length);
      const currentLesson = allLessons().find(item => item.id === currentId);
      const expected = currentLesson && nextPathLesson(currentLesson, progressFor(profile().id));
      if (expected && expected.id === button.dataset.next && progressFor(profile().id).completed.includes(currentId)) {
        button.disabled = true;
        go("lesson/" + expected.id);
      }
    } else if (action === "challenge-choice") {
      const challenge = DECISION_CHALLENGES.find(item => item.id === button.dataset.id);
      const choiceIndex = Number(button.dataset.index);
      if (!challenge || !Number.isInteger(choiceIndex) || !challenge.choices[choiceIndex]) return;
      const progress = progressFor(profile().id);
      if (!progress.simulations.decisionChallenges || typeof progress.simulations.decisionChallenges !== "object" || Array.isArray(progress.simulations.decisionChallenges)) {
        progress.simulations.decisionChallenges = {};
      }
      const previous = progress.simulations.decisionChallenges[challenge.id];
      progress.simulations.decisionChallenges[challenge.id] = {
        choice: choiceIndex, completed: true, date: new Date().toISOString()
      };
      const beforeLevel = levelInfo(progress.xp).level;
      const earned = grantReward(progress, `decision-challenge:${challenge.id}`, 10);
      recordMissionEvent(progress, "simulation", `challenge:${challenge.id}`, `challenge:${challenge.id}:${localDateKey(new Date())}`);
      recordActivity(progress, `Mencoba tantangan keputusan · ${challenge.title}`);
      recordStudyDay(progress);
      const missionRewards = grantCompletedMissions(progress);
      if (!saveProgress(progress)) return;
      render();
      if (missionRewards.length) showToast(`Misi selesai · +${missionRewards.reduce((sum, item) => sum + item.xp, 0)} XP`);
      else if (earned && levelInfo(progress.xp).level > beforeLevel) showLevelUp(levelInfo(progress.xp));
      else if (earned) showToast("Tantangan dicatat · +10 XP");
      else if (!previous) showToast("Tantangan tersimpan.");
    } else if (action === "complete-lesson") {
      const currentId = route().startsWith("lesson/") ? route().slice(7) : "";
      const lessonId = button.dataset.id;
      if (!lessonId || currentId !== lessonId) {
        showToast("Materi yang dipilih tidak cocok dengan halaman ini.", true);
        return;
      }
      const progress = progressFor(profile().id);
      if (progress.completed.includes(lessonId)) {
        go("completion/" + lessonId);
        return;
      }
      if (!progress.practiced.includes(lessonId)) {
        showToast("Jawab latihan materi dengan benar sebelum menyelesaikannya.", true);
        return;
      }
      const beforeLevel = levelInfo(progress.xp).level;
      const previousAchievements = new Set(progress.achievements);
      progress.completed.push(lessonId);
      const earned = grantReward(progress, "lesson:" + lessonId, 20);
      recordMissionEvent(progress, "lesson", lessonId, `lesson:${lessonId}`);
      progress.lastLesson = lessonId;
      recordStudyDay(progress);
      recordActivity(progress, "Menyelesaikan materi · " + lessonId);
      const missionRewards = grantCompletedMissions(progress);
      const unlockedAchievements = ACHIEVEMENTS.filter(item => item.check(progress) && !previousAchievements.has(item.id)).map(item => item.id);
      const nextLevel = levelInfo(progress.xp).level;
      progress.lastCompletion = {
        lessonId, xpEarned: earned ? 20 : 0, date: new Date().toISOString(),
        achievements: unlockedAchievements, levelUp: nextLevel > beforeLevel ? nextLevel : null
      };
      if (!saveProgress(progress)) return;
      if (missionRewards.length) showToast(`Misi selesai · +${missionRewards.reduce((sum, item) => sum + item.xp, 0)} XP`);
      else if (earned && levelInfo(progress.xp).level > beforeLevel) showLevelUp(levelInfo(progress.xp));
      else if (earned) showToast("Materi selesai · +20 XP");
      go("completion/" + lessonId);
    } else if (action === "scenario-choice") {
      const selectedIndex = Number(button.dataset.index);
      const select = document.querySelector("[data-action='scenario-select']");
      document.getElementById("scenario-content").innerHTML = scenarioHtml(select.value, selectedIndex);
      const scenario = DATA.scenarios[Number(select.value)];
      if (scenario.choices[selectedIndex].tone === "good") {
        const progress = progressFor(profile().id);
        const beforeLevel = levelInfo(progress.xp).level;
        progress.simulations.scenarios = progress.simulations.scenarios || [];
        if (!progress.simulations.scenarios.includes(Number(select.value))) {
          progress.simulations.scenarios.push(Number(select.value));
          recordStudyDay(progress);
          recordActivity(progress, "Menyelesaikan tantangan keputusan keuangan");
          recordMissionEvent(progress, "simulation", `scenario-${select.value}`, `scenario:${select.value}`);
          const earned = grantReward(progress, "simulation:scenario:" + select.value, 15);
          const missionRewards = grantCompletedMissions(progress);
          saveProgress(progress);
          if (missionRewards.length) showToast(`Misi selesai · +${missionRewards.reduce((sum, item) => sum + item.xp, 0)} XP`);
          else if (earned && levelInfo(progress.xp).level > beforeLevel) showLevelUp(levelInfo(progress.xp));
          else if (earned) showToast("Tantangan selesai · +15 XP");
        }
      }
    } else if (action === "start-quiz") {
      startQuiz();
    } else if (action === "quiz-choice" && quizState && !quizState.checked) {
      quizState.selected = Number(button.dataset.index);
      render();
      ROOT.querySelector(`[data-action='quiz-choice'][data-index='${quizState.selected}']`)?.focus();
    } else if (action === "quiz-check" && quizState && quizState.selected !== null && !quizState.checked) {
      const question = quizState.questions[quizState.index];
      quizState.checked = true;
      quizState.answers.push({ question, selected: quizState.selected, correct: quizState.selected === question.answer });
      playAudioCue(quizState.selected === question.answer ? "correct" : "incorrect");
      render();
      const feedback = ROOT.querySelector(".quiz-feedback");
      if (feedback) {
        feedback.tabIndex = -1;
        feedback.focus();
      }
    } else if (action === "quiz-next" && quizState) {
      quizState.index++;
      quizState.selected = null;
      quizState.checked = false;
      if (quizState.index >= quizState.questions.length) {
        finishQuiz();
      }
      render();
      const focusTarget = quizState.index >= quizState.questions.length ? ROOT.querySelector(".result-score") : ROOT.querySelector(".quiz-panel h1");
      if (focusTarget) {
        focusTarget.tabIndex = -1;
        focusTarget.focus();
      }
    } else if (action === "quiz-reset" || action === "quiz-exit") {
      quizState = null;
      render();
    } else if (action === "review-question") {
      const question = QUESTION_BANK.find(item => item.id === button.dataset.id);
      if (question) {
        quizState = { questions: [question], index: 0, selected: null, checked: false, answers: [], filters: { chapter: question.chapter, difficulty: question.difficulty, topic: question.topic, mode: "chapter" }, rewardKey: `review:${question.id}`, xpEarned: 0, saved: false };
        go("quiz");
      }
    } else if (action === "review-explanation") {
      const explanation = document.getElementById(button.dataset.target);
      if (explanation) {
        explanation.hidden = !explanation.hidden;
        button.setAttribute("aria-expanded", String(!explanation.hidden));
        button.textContent = explanation.hidden ? "Lihat pembahasan" : "Sembunyikan pembahasan";
      }
    } else if (action === "clear-review") {
      if (window.confirm("Hapus daftar soal yang perlu ditinjau dari browser? Hasil kuis tetap tersimpan.")) {
        const progress = progressFor(profile().id);
        progress.reviewQuestions = {};
        progress.reviewLessons = {};
        saveProgress(progress);
        showToast("Daftar review berhasil dihapus.");
        render();
      }
    } else if (action === "budget-example") {
      const form = ROOT.querySelector("[data-form='budget']");
      form.elements.total.value = "500000";
      form.elements.needs.value = "260000";
      form.elements.wants.value = "80000";
      form.elements.savings.value = "100000";
      form.elements.other.value = "30000";
      form.dispatchEvent(new Event("input", { bubbles: true }));
      form.querySelector("[data-result]").classList.remove("visible");
      form.querySelector("[data-error]").textContent = "";
    } else if (action === "budget-reset") {
      const form = ROOT.querySelector("[data-form='budget']");
      form.reset();
      form.querySelector("[data-live]").textContent = "Isi angka untuk melihat perkiraan sisa uang.";
      form.querySelector("[data-result]").classList.remove("visible");
      form.querySelector("[data-error]").textContent = "";
    } else if (action === "reset-progress") {
      if (window.confirm("Hapus seluruh progres, XP, pencapaian, skor kuis, dan riwayat review profil ini dari browser? Tindakan ini tidak dapat dibatalkan.")) {
        try {
          localStorage.removeItem(PROGRESS_PREFIX + profile().id);
          quizState = null;
          showToast("Progres berhasil direset.");
          render();
        } catch (error) {
          console.error("ECONOVA: progres tidak dapat dihapus.", error);
          showToast("Progres tidak dapat dihapus dari penyimpanan browser.", true);
        }
      }
    }
  });

  ROOT.addEventListener("click", function (event) {
    const target = event.target.closest("button, a, summary");
    if (!target) return;
    const action = target.dataset.action;
    if (["practice-check", "quiz-check", "complete-lesson"].includes(action)) return;
    playAudioCue(target.matches("a[href^='#/']") ? "navigation" : "click");
  });

  ROOT.addEventListener("change", function (event) {
    const audioSetting = event.target.dataset.audioSetting;
    if (audioSetting === "enabled") {
      audioSettings.muted = !event.target.checked;
      saveAudioSettings();
      if (audioSettings.muted) stopAudioCues();
      const volume = ROOT.querySelector("[data-audio-setting='effectVolume']");
      if (volume) volume.disabled = audioSettings.muted;
      const support = ROOT.querySelector(".audio-support");
      if (support) support.textContent = audioSupportDescription();
      return;
    }
    if (event.target.matches("[data-action='scenario-select']")) {
      document.getElementById("scenario-content").innerHTML = scenarioHtml(event.target.value, null);
    }
    if (event.target.matches("#quiz-mode, #quiz-chapter")) updateQuizTopicOptions();
    if (event.target.matches("#learning-track, #learning-grade, #learning-chapter, #learning-status, #learning-sort")) refreshLearningResults();
  });
  ROOT.addEventListener("input", function (event) {
    if (event.target.matches("[data-audio-setting='effectVolume']")) {
      audioSettings.effectVolume = Math.max(0, Math.min(1, Number(event.target.value)));
      const output = ROOT.querySelector("[data-volume-value]");
      if (output) output.textContent = `${Math.round(audioSettings.effectVolume * 100)}%`;
      saveAudioSettings();
      return;
    }
    if (event.target.matches("#learning-search")) {
      refreshLearningResults();
      return;
    }
    const form = event.target.closest("[data-form='budget']");
    if (!form) return;
    const live = form.querySelector("[data-live]");
    const keys = ["total", "needs", "wants", "savings", "other"];
    if (keys.some(key => form.elements[key].value === "")) {
      live.textContent = "Isi semua kategori untuk melihat perkiraan sisa uang.";
      return;
    }
    const values = keys.map(key => Number(form.elements[key].value));
    if (values.some(value => !Number.isFinite(value) || value < 0) || values[0] <= 0) {
      live.textContent = "Masukkan nilai rupiah yang valid.";
      return;
    }
    const remaining = values[0] - values.slice(1).reduce((sum, value) => sum + value, 0);
    live.textContent = remaining < 0
      ? `Perkiraan lebih pengeluaran ${formatRupiah(Math.abs(remaining))}.`
      : `Perkiraan sisa uang ${formatRupiah(remaining)}.`;
  });
  ROOT.addEventListener("reset", function (event) {
    const form = event.target;
    if (!form.matches("[data-form]")) return;
    form.querySelector("[data-error]")?.replaceChildren();
    form.querySelector("[data-result]")?.classList.remove("visible");
    if (form.dataset.form === "budget") {
      form.querySelector("[data-live]").textContent = "Isi angka untuk melihat perkiraan sisa uang.";
    }
  });

  function updateQuizTopicOptions() {
    const form = document.getElementById("quiz-settings");
    if (!form) return;
    const mixed = form.elements.mode.value === "mixed";
    form.elements.chapter.disabled = mixed;
    const chapter = form.elements.chapter.value;
    const previousTopic = form.elements.topic.value;
    const topics = [...new Set(QUESTION_BANK.filter(question => mixed || question.chapter === chapter).map(question => question.topic))].sort();
    form.elements.topic.innerHTML = `<option value="all">Semua topik</option>${topics.map(topic => `<option value="${escapeHtml(topic)}">${escapeHtml(topic)}</option>`).join("")}`;
    form.elements.topic.value = topics.includes(previousTopic) ? previousTopic : "all";
  }

  ROOT.addEventListener("submit", function (event) {
    const form = event.target;
    event.preventDefault();
    if (form.id === "student-form") {
      const name = form.elements.name.value.trim();
      const className = form.elements.className.value.trim();
      const error = document.getElementById("student-error");
      if (name.length < 2 || className.length < 2) {
        error.textContent = "Isi nama (minimal 2 karakter) dan kelas atau peran (minimal 2 karakter).";
        return;
      }
      if (!/[\p{L}]/u.test(name) || !/[\p{L}\p{N}]/u.test(className)) {
        error.textContent = "Masukkan nama dan kelas atau peran yang valid.";
        return;
      }
      const newProfile = { id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2), role: "student", name, className };
      if (!writeStore(PROFILE_KEY, newProfile)) {
        error.textContent = "Browser tidak dapat menyimpan profil. Periksa pengaturan penyimpanan lalu coba lagi.";
        return;
      }
      go("dashboard");
    } else if (form.id === "profile-form") {
      const name = form.elements.name.value.trim();
      const className = form.elements.className.value.trim();
      const error = document.getElementById("profile-error");
      if (name.length < 2 || className.length < 2 || !/[\p{L}]/u.test(name) || !/[\p{L}\p{N}]/u.test(className)) {
        error.textContent = "Masukkan nama dan kelas/peran yang valid (minimal 2 karakter).";
        return;
      }
      const active = profile();
      if (!active || active.role !== "student") {
        error.textContent = "Profil tidak ditemukan. Silakan masuk kembali.";
        return;
      }
      active.name = name;
      active.className = className;
      if (writeStore(PROFILE_KEY, active)) {
        showToast("Profil berhasil diperbarui.");
        render();
      }
    } else if (["lab-interest", "lab-inflation", "lab-savings", "lab-budget"].includes(form.dataset.form)) {
      handleFinanceCalculator(form);
    } else if (form.dataset.form === "life-simulator") {
      handleLifeSimulator(form);
    } else if (["savings-goal", "loan-cost", "portfolio", "fraud-check", "business"].includes(form.dataset.form)) {
      handleExtraSimulation(form);
    } else if (form.dataset.form === "budget") {
      const result = form.querySelector("[data-result]");
      const error = form.querySelector("[data-error]");
      const values = ["total", "needs", "wants", "savings", "other"].map(key => Number(form.elements[key].value));
      if (["total", "needs", "wants", "savings", "other"].some(key => form.elements[key].value === "") || values.some(value => !Number.isFinite(value) || value < 0) || values[0] <= 0 || values[0] > 1e12) {
        error.textContent = "Masukkan pemasukan di atas nol dan jumlah kategori yang valid.";
        result.classList.remove("visible");
        return;
      }
      const [total, needs, wants, savings, other] = values;
      const sum = needs + wants + savings + other;
      if (![needs, wants, savings, other, sum].every(Number.isFinite) || sum > 1e12) {
        error.textContent = "Jumlah kategori terlalu besar untuk dihitung.";
        result.classList.remove("visible");
        return;
      }
      const wantsPercent = wants / total * 100;
      const savingsPercent = savings / total * 100;
      const remaining = total - sum;
      const note = remaining < 0 ? `Pengeluaran melebihi pemasukan sebesar ${formatRupiah(Math.abs(remaining))}. Tinjau pos fleksibel sebelum membuat rencana.` : wantsPercent > 40 ? "Porsi keinginan cukup besar; cek apakah kebutuhan penting sudah aman." : savingsPercent === 0 ? "Belum ada pos tabungan. Jika memungkinkan, sisihkan sebagian sesuai kemampuan." : "Cocokkan pembagian ini dengan kebutuhan dan pengeluaran nyata.";
      const chartParts = [
        ["Kebutuhan", needs, "#a78bfa"], ["Keinginan", wants, "#5ee3db"],
        ["Tabungan", savings, "#78dfb1"], ["Lain-lain", other, "#ffce74"]
      ];
      const chart = `<div class="budget-chart" role="img" aria-label="Visualisasi pembagian pemasukan">${chartParts.map(part => `<span title="${part[0]} ${percentOf(part[1], total)}%" style="width:${Math.min(part[1] / total * 100, 100)}%;background:${part[2]}"></span>`).join("")}</div>`;
      error.textContent = "";
      result.innerHTML = `<strong>${remaining < 0 ? "Pengeluaran melebihi pemasukan" : "Sisa uang " + formatRupiah(remaining)}</strong>${chart}<div class="budget-legend">${chartParts.map(part => `<span><i style="background:${part[2]}"></i>${part[0]} ${formatRupiah(part[1])} (${percentOf(part[1], total)}%)</span>`).join("")}</div><p style="margin:12px 0 0">${note}</p>`;
      result.classList.add("visible");
      if (remaining >= 0 && savings > 0) {
        const progress = progressFor(profile().id);
        const beforeLevel = levelInfo(progress.xp).level;
        progress.simulations.budget = true;
        recordStudyDay(progress);
        recordActivity(progress, "Menyelesaikan tantangan anggaran");
        recordMissionEvent(progress, "simulation", "budget", `simulation:${localDateKey(new Date())}:budget`);
        const earned = grantReward(progress, "simulation:budget", 15);
        const missionRewards = grantCompletedMissions(progress);
        saveProgress(progress);
        if (missionRewards.length) showToast(`Misi selesai · +${missionRewards.reduce((sum, item) => sum + item.xp, 0)} XP`);
        else if (earned && levelInfo(progress.xp).level > beforeLevel) showToast(`Tantangan anggaran selesai · naik ke level ${levelInfo(progress.xp).level}!`);
        else if (earned) showToast("Tantangan anggaran selesai · +15 XP");
      }
    } else if (form.dataset.form === "inflation") {
      const result = form.querySelector("[data-result]");
      const error = form.querySelector("[data-error]");
      const money = Number(form.elements.money.value);
      const price = Number(form.elements.price.value);
      const rate = Number(form.elements.rate.value);
      const years = Number(form.elements.years.value);
      if (["money", "price", "rate", "years"].some(key => form.elements[key].value === "") || ![money, price, rate, years].every(Number.isFinite) || money <= 0 || price <= 0 || money > 1e12 || price > 1e12 || rate < -99 || rate > 1000 || !Number.isInteger(years) || years < 1 || years > 50) {
        error.textContent = "Isi uang dan harga lebih dari nol, perubahan tahunan -99% sampai 1.000%, dan jangka waktu 1–50 tahun.";
        result.classList.remove("visible");
        return;
      }
      const newPrice = price * Math.pow(1 + rate / 100, years);
      if (!Number.isFinite(newPrice) || newPrice <= 0) {
        error.textContent = "Perubahan harga menghasilkan nilai yang tidak dapat dihitung.";
        result.classList.remove("visible");
        return;
      }
      const oldUnits = money / price;
      const newUnits = money / newPrice;
      const change = newUnits - oldUnits;
      const changeText = change < 0 ? `Dengan uang yang sama, perkiraan jumlah barang yang terbeli turun sekitar ${Math.abs(change).toFixed(2)} unit.` : change > 0 ? `Dengan uang yang sama, perkiraan jumlah barang yang terbeli naik sekitar ${change.toFixed(2)} unit.` : "Daya beli pada contoh ini tidak berubah.";
      error.textContent = "";
      result.innerHTML = `<strong>Setelah ${years} tahun, perkiraan harga barang: ${formatRupiah(newPrice)}</strong>Nominal uangmu tetap ${formatRupiah(money)}. Dengan harga awal kamu dapat membeli sekitar ${oldUnits.toFixed(2)} unit; dengan harga baru sekitar ${newUnits.toFixed(2)} unit. ${changeText}<br><br>Simulasi mengasumsikan perubahan harga tahunan tetap ${rate}%. Ini ilustrasi satu barang, bukan ukuran inflasi keseluruhan atau prediksi harga.`;
      result.classList.add("visible");
      recordSimulation("inflation", "Menguji dampak perubahan harga");
    }
  });

  function formatRupiah(value) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
  }
  function percentOf(value, total) { return (value / total * 100).toFixed(1); }

  ROOT.addEventListener("pointermove", function (event) {
    if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
    const surface = event.target.closest(".spotlight-surface, .chapter-card, .path-choice, .grade-card, .lesson-row, .learning-result, .map-row, .mission-card, .achievement-item, .simulation-card, .finance-card, .challenge-card, .insight-track");
    if (!surface) return;
    const bounds = surface.getBoundingClientRect();
    surface.style.setProperty("--pointer-x", `${event.clientX - bounds.left}px`);
    surface.style.setProperty("--pointer-y", `${event.clientY - bounds.top}px`);
  });
  ROOT.addEventListener("pointerout", function (event) {
    const surface = event.target.closest(".spotlight-surface, .chapter-card, .path-choice, .grade-card, .lesson-row, .learning-result, .map-row, .mission-card, .achievement-item, .simulation-card, .finance-card, .challenge-card, .insight-track");
    if (surface && !(event.relatedTarget instanceof Node && surface.contains(event.relatedTarget))) {
      surface.style.removeProperty("--pointer-x");
      surface.style.removeProperty("--pointer-y");
    }
  });
  document.addEventListener("visibilitychange", function () {
    document.body.classList.toggle("page-hidden", document.hidden);
  });
  window.addEventListener("hashchange", render);
  document.addEventListener("DOMContentLoaded", function () {
    render();
    if (location.hash === "#login") document.getElementById("login")?.scrollIntoView();
  });
  render();
})();
