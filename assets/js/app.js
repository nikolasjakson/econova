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
  let toastTimer;
  let quizState = null;
  let currentStudentTab = true;

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
      completed: Array.isArray(stored.completed) ? stored.completed.filter(value => typeof value === "string") : [],
      practiced: Array.isArray(stored.practiced) ? stored.practiced.filter(value => typeof value === "string") : [],
      xp: Number.isFinite(stored.xp) && stored.xp >= 0 ? stored.xp : 0,
      quizScores: Array.isArray(stored.quizScores) ? stored.quizScores.filter(score => score && Number.isFinite(score.percent) && score.percent >= 0 && score.percent <= 100 && Number.isFinite(Date.parse(score.date))) : [],
      lastLesson: typeof stored.lastLesson === "string" ? stored.lastLesson : null,
      rewardIds: Array.isArray(stored.rewardIds) ? stored.rewardIds.filter(value => typeof value === "string") : [],
      studyDays: Array.isArray(stored.studyDays) ? [...new Set(stored.studyDays.filter(value => /^\d{4}-\d{2}-\d{2}$/.test(value)))].slice(-120) : [],
      reviewQuestions, reviewLessons,
      activities: Array.isArray(stored.activities) ? stored.activities.filter(item => item && typeof item.text === "string").slice(-20) : [],
      simulations: stored.simulations && typeof stored.simulations === "object" ? stored.simulations : {},
      achievements: Array.isArray(stored.achievements) ? stored.achievements.filter(value => typeof value === "string") : []
    };
  }
  function emptyProgress() {
    return { schemaVersion: 2, completed: [], practiced: [], xp: 0, quizScores: [], lastLesson: null, rewardIds: [], studyDays: [], reviewQuestions: {}, reviewLessons: {}, activities: [], simulations: {}, achievements: [] };
  }
  function completedSimulationTypes(progress) {
    const simulations = progress.simulations || {};
    return Object.values(simulations).filter(value => value === true).length +
      (Array.isArray(simulations.scenarios) && simulations.scenarios.length > 0 ? 1 : 0);
  }
  function saveProgress(progress) {
    const active = profile();
    if (!active) return false;
    progress.schemaVersion = 2;
    progress.achievements = ACHIEVEMENTS.filter(achievement => achievement.check(progress)).map(achievement => achievement.id);
    return writeStore(PROGRESS_PREFIX + active.id, progress);
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
    const foundation = DATA.chapters.flatMap(chapter => chapter.lessons.map(lesson => ({ ...lesson, chapter: { ...chapter, track: "literacy" }, track: "literacy" })));
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
  function nextLesson(progress) {
    return allLessons().find(lesson => !progress.completed.includes(lesson.id)) || allLessons()[0];
  }
  function progressPercent(progress) {
    return Math.round((progress.completed.length / allLessons().length) * 100);
  }
  function brand() {
    return `<a class="brand" href="#/home" aria-label="ECONOVA, beranda"><span class="brand-mark">◈</span><span>ECONOVA<small>FINANCIAL LITERACY</small></span></a>`;
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
          <details class="nav-more"><summary>Menu</summary><div class="nav-more-menu"><a href="#/review">Ulangi materi</a><a href="#/achievements">Pencapaian</a><a href="#/profile">Profil & pengaturan</a></div></details>
        </nav>`
      : "";
    const actions = user
      ? `<div class="topbar-actions"><span class="small muted">${escapeHtml(user.name || "Admin demo")}</span><button class="button button-quiet" data-action="logout">Keluar</button></div>`
      : `<div class="topbar-actions"><a class="button button-quiet" href="#/home#login">Masuk</a></div>`;
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
          <div class="orbit-art" aria-hidden="true"><span class="orbit"></span><span class="orbit two"></span><span class="orbit-dot"></span><span class="orbit-dot two"></span><span class="orbit-core">◈</span></div>
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
      <section class="welcome-panel surface"><span class="eyebrow">Halo, ${escapeHtml(user.name)}</span><h1>${isNew ? "Mulai dari satu langkah kecil." : "Selangkah lebih paham."}</h1><p>${isNew ? "Belum ada aktivitas belajar yang tercatat. Mulai dengan materi pendek dan bangun ritmemu sendiri." : "Belajar keuangan tidak harus sekaligus. Lanjutkan satu materi kecil, lalu gunakan pengetahuan itu untuk keputusan sehari-hari."}<br>${!isNew && latestActivity ? `<span class="small">Aktivitas terakhir: ${escapeHtml(latestActivity.text)} · ${new Date(latestActivity.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>` : ""}</p><a class="button button-primary" href="#/lesson/${next.id}">${isNew ? "Mulai materi pertama" : "Lanjutkan belajar"} <span aria-hidden="true">→</span></a><p class="small muted" style="margin:15px 0 0">${escapeHtml(next.chapter.title)} · ${escapeHtml(next.title)}</p></section>
      <section class="level-panel surface-soft" aria-label="Level dan pengalaman"><div class="split"><div><span class="eyebrow">Level ${level.level} · ${escapeHtml(level.title)}</span><p class="muted small" style="margin:5px 0 0">${progress.xp} XP · ${level.remaining} XP menuju level berikutnya</p></div><strong class="level-number">${level.level}</strong></div><div class="lesson-progress" role="progressbar" aria-label="Progres level" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${level.progress}"><span style="width:${level.progress}%"></span></div><div class="level-foot"><span>${level.progress}% ke level berikutnya</span><span>${progress.completed.length}/${allLessons().length} materi selesai · ${streak ? streak + " hari beruntun" : "mulai ritme belajarmu"}</span></div></section>
      <section class="dashboard-insights" aria-label="Ringkasan aktivitas"><div><span class="eyebrow">Kuis terakhir</span><p>${latestScore ? `${latestScore.correct}/${latestScore.total} benar · ${latestScore.percent}%` : "Belum ada hasil kuis. Coba latihan tanpa tekanan."}</p></div><div><span class="eyebrow">Pencapaian</span><p>${recentAchievement ? `${escapeHtml(recentAchievement.name)} terbuka` : "Pencapaian pertamamu menunggu."}</p></div><div><span class="eyebrow">Perlu diulang</span><p>${Object.keys(progress.reviewQuestions).length + Object.keys(progress.reviewLessons).length ? `${Object.keys(progress.reviewQuestions).length + Object.keys(progress.reviewLessons).length} latihan untuk ditinjau` : "Belum ada soal yang ditandai."}</p></div></section>
      <div class="section-heading"><div><span class="eyebrow">Lanjutkan perjalanan</span><h2>Belajar lewat praktik.</h2></div></div>
      <section class="quick-links" aria-label="Akses belajar"><a class="surface quick-link" href="#/learn"><span class="quick-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z"></path><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h8M8 10h6"></path></svg></span><h3>Pusat belajar</h3><p>Jalur literasi, kurikulum, dan materi fondasi.</p></a><a class="surface quick-link" href="#/simulations"><span class="quick-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 19V5M4 19h16M7 15l4-4 3 2 5-6"></path><path d="M16 7h3v3"></path></svg></span><h3>Laboratorium simulasi</h3><p>Delapan latihan interaktif tanpa transaksi sungguhan.</p></a><a class="surface quick-link" href="#/quiz"><span class="quick-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 4.5h14v12H9l-4 3v-15Z"></path><path d="M8.5 9h.01M12 9h.01M15.5 9h.01M8 13h8"></path></svg></span><h3>Arena kuis</h3><p>${QUESTION_BANK.length} soal, tanpa hitung mundur.</p></a></section>
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
    const next = lessons[lessonIndex + 1];
    const isDone = progress.completed.includes(id);
    return shell(`<div class="page-wrap narrow"><a class="text-link small" href="#/chapter/${lesson.chapter.id}">← Kembali ke ${escapeHtml(lesson.chapter.title)}</a>
      <header class="lesson-hero"><span class="eyebrow">${lesson.track === "curriculum" ? `KELAS ${lesson.grade} · MATERI ${lessonIndex + 1} DARI ${lessons.length}` : `BAB ${lesson.chapter.number} · MATERI ${lessonIndex + 1} DARI ${lessons.length}`}</span><h1>${escapeHtml(lesson.title)}</h1><p class="lead" style="font-size:17px">${escapeHtml(lesson.opener)}</p>${lesson.objective ? `<p class="small muted"><strong>Tujuan:</strong> ${escapeHtml(lesson.objective)}</p>` : ""}</header>
      <article class="lesson-content">
        <section class="surface content-section"><h2>Konsep utama</h2><p>${escapeHtml(lesson.concept)}</p></section>
        <section class="surface content-section"><h2>Contoh sehari-hari</h2><p>${escapeHtml(lesson.example)}</p></section>
        <section class="surface content-section takeaway"><h2>Ingat inti ini</h2><p>${escapeHtml(lesson.takeaway)}</p></section>
      </article>
      <section class="surface practice-box" aria-labelledby="practice-title"><span class="eyebrow">Cek pemahaman</span><h2 id="practice-title">${escapeHtml(lesson.practice)}</h2><div class="practice-options">${lesson.options.map((option, i) => `<button class="choice" data-action="practice-choice" data-index="${i}" aria-pressed="false">${escapeHtml(option)}</button>`).join("")}</div><p class="answer-feedback" id="practice-feedback" aria-live="polite"></p><button class="button button-secondary" data-action="practice-check" data-answer="${lesson.answer}" data-explanation="${encodeURIComponent(lesson.explanation)}">Periksa jawaban</button></section>
      <div class="lesson-footer"><a class="button button-secondary" href="#/chapter/${lesson.chapter.id}">Daftar materi</a><button class="button ${isDone ? "button-secondary" : "button-primary"}" data-action="complete-lesson" data-id="${lesson.id}" data-next="${next ? next.id : ""}">${isDone ? (next ? "Lanjut ke materi berikutnya →" : "Materi selesai ✓") : (next ? "Tandai selesai & lanjut →" : "Tandai materi selesai ✓")}</button></div>
    </div>`, "lesson");
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
      rewardKey: `quiz:${filters.mode}:${filters.chapter}:${filters.difficulty}:${filters.topic}`,
      xpEarned: 0, saved: false
    };
    render();
  }
  function finishQuiz() {
    if (!quizState || quizState.saved) return;
    const progress = progressFor(profile().id);
    const beforeLevel = levelInfo(progress.xp).level;
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
      chapter: quizState.filters.chapter, difficulty: quizState.filters.difficulty
    });
    progress.quizScores = progress.quizScores.slice(-30);
    recordStudyDay(progress);
    recordActivity(progress, `Menyelesaikan kuis · ${correct}/${quizState.answers.length} benar`);
    quizState.xpEarned = earned;
    quizState.saved = true;
    saveProgress(progress);
    if (earned && levelInfo(progress.xp).level > beforeLevel) showLevelUp(levelInfo(progress.xp));
    else if (earned) showToast(`Kuis selesai · +${earned} XP baru`);
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
    const wrong = quizState.answers.filter(answer => !answer.correct);
    const reviewList = wrong.length ? `<div class="review-result-list">${wrong.map(item => `<article class="review-result"><strong>${escapeHtml(item.question.topic)}</strong><p>${escapeHtml(item.question.question)}</p><p class="small muted">${escapeHtml(item.question.explanation)}</p><a class="text-link small" href="#/lesson/${lessonIdForChapter(item.question.chapter)}">Buka materi terkait →</a></article>`).join("")}</div>` : `<div class="empty-state">Tidak ada soal yang perlu diulang dari sesi ini. Bagus, tetap tinjau konsep saat dibutuhkan.</div>`;
    return shell(`<div class="page-wrap"><section class="surface quiz-panel"><span class="eyebrow">Kuis selesai · ${escapeHtml(quizState.filters.mode === "mixed" ? "Campuran" : chapterTitle(quizState.filters.chapter))}</span><h1 style="font-size:34px;margin:12px 0">Setiap jawaban jadi bekal.</h1><div class="result-score">${percent}%</div><p class="lead" style="font-size:16px">Kamu menjawab ${score} dari ${total} pertanyaan dengan benar.</p><div class="result-details"><div><strong>${score}/${total}</strong><span class="small muted">Nilai kuis</span></div><div><strong>${wrong.length}</strong><span class="small muted">Soal untuk ditinjau</span></div><div><strong>+${quizState.xpEarned}</strong><span class="small muted">XP baru (jika tersedia)</span></div></div><p class="muted">${percent >= 80 ? "Pemahamanmu terlihat kuat pada latihan ini. Penerapan konsep tetap bergantung pada situasi nyata." : "Satu sesi belum menggambarkan seluruh pemahamanmu. Gunakan pembahasan untuk memperkuat bagian tertentu."}</p><div class="section-heading" style="margin:25px 0 14px"><div><span class="eyebrow">Penguatan pemahaman</span><h2 style="font-size:22px">Soal yang bisa ditinjau</h2></div></div>${reviewList}<div class="row" style="margin-top:22px"><button class="button button-primary" data-action="quiz-reset">Atur latihan baru</button><a class="button button-secondary" href="#/review">Buka pusat review</a><a class="button button-quiet" href="#/progress">Lihat progres</a></div></section></div>`, "quiz");
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
    return shell(`<div class="page-wrap"><span class="eyebrow">Ruang progres</span><h1 style="font-size:clamp(35px,5vw,48px);margin:10px 0 25px">Belajar dengan ritmemu.</h1><section class="level-panel surface-soft"><div class="split"><div><span class="eyebrow">Level ${level.level} · ${escapeHtml(level.title)}</span><p class="muted small" style="margin:5px 0 0">${progress.xp} XP terkumpul · ${level.remaining} XP menuju level berikutnya</p></div><strong class="level-number">${level.level}</strong></div><div class="lesson-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${level.progress}"><span style="width:${level.progress}%"></span></div><div class="level-foot"><span>${level.progress}% menuju level selanjutnya</span><span>Tidak ada XP berdasarkan kecepatan</span></div></section><section class="progress-grid" style="margin-top:16px"><div class="surface progress-stat"><span>Materi selesai</span><strong>${progress.completed.length}/${allLessons().length}</strong></div><div class="surface progress-stat"><span>Latihan perlu ditinjau</span><strong>${Object.keys(progress.reviewQuestions).length + Object.keys(progress.reviewLessons).length}</strong></div><div class="surface progress-stat"><span>Hari belajar tercatat</span><strong>${progress.studyDays.length}</strong></div></section><p class="notice" style="margin-top:16px"><strong>Aturan XP:</strong> +20 materi selesai satu kali; +5 latihan materi benar pertama kali; +5 tiap soal bank benar pertama kali; +10 kuis selesai pertama kali untuk kombinasi filter; +15 tantangan anggaran dan tiap skenario keputusan yang berhasil pertama kali. Kecepatan tidak menambah XP.</p>
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
    const completedSimulations = completedSimulationTypes(progress);
    const missions = [
      { title: "Mulai dari satu materi", progress: Math.min(progress.completed.length, 1), goal: 1, href: "#/learn", detail: "Tandai satu pelajaran selesai." },
      { title: "Uji pemahaman", progress: Math.min(progress.quizScores.length, 1), goal: 1, href: "#/quiz", detail: "Selesaikan satu sesi kuis." },
      { title: "Jelajahi laboratorium", progress: Math.min(completedSimulations, 3), goal: 3, href: "#/simulations", detail: "Coba tiga jenis simulasi yang berbeda." }
    ];
    const missionCards = missions.map(mission => `<article class="surface mission-card"><span class="eyebrow">${mission.progress >= mission.goal ? "MISI TUNTAS" : "MISI BELAJAR"}</span><h2>${escapeHtml(mission.title)}</h2><p>${escapeHtml(mission.detail)}</p><div class="mission-progress"><span style="width:${mission.progress / mission.goal * 100}%"></span></div><div class="split small muted"><span>${mission.progress}/${mission.goal} langkah</span>${mission.progress >= mission.goal ? "<strong>Selesai ✓</strong>" : `<a class="text-link" href="${mission.href}">Mulai →</a>`}</div></article>`).join("");
    return shell(`<div class="page-wrap"><span class="eyebrow">Pencapaian belajar</span><h1 style="font-size:clamp(35px,5vw,48px);margin:10px 0">Rayakan langkah nyata.</h1><p class="lead" style="font-size:16px">Misi dan pencapaian berubah hanya berdasarkan aktivitas yang benar-benar tercatat pada profil lokal.</p><section class="section-heading"><div><span class="eyebrow">LANGKAH BERIKUTNYA</span><h2>Misi belajar</h2></div></section><section class="mission-grid">${missionCards}</section><section class="section-heading"><div><span class="eyebrow">PENCAPAIAN</span><h2>Koleksi belajarmu</h2></div></section><section class="achievement-grid">${cards}</section><p class="notice" style="margin-top:20px">Misi dan pencapaian adalah penanda aktivitas belajar lokal, bukan sertifikat atau verifikasi kemampuan.</p></div>`, "achievements");
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
    const rows = allChapters().filter(chapter => chapter.track === "literacy").map(chapter => {
      const lessons = chapterLessons(chapter);
      const done = lessons.filter(lesson => progress.completed.includes(lesson.id)).length;
      return `<a class="map-row" href="#/chapter/${chapter.id}"><span class="map-marker ${done === lessons.length ? "map-done" : ""}">${done === lessons.length ? "✓" : chapter.number}</span><span><strong>${escapeHtml(chapter.title)}</strong><small>${done}/${lessons.length} materi selesai</small></span><span aria-hidden="true">→</span></a>`;
    }).join("");
    return shell(`<div class="page-wrap"><span class="eyebrow">Peta perjalanan</span><h1 style="font-size:clamp(35px,5vw,48px);margin:10px 0">Satu langkah pada satu waktu.</h1><p class="lead" style="font-size:16px">Kamu sudah menyelesaikan ${completion} dari ${allLessons().length} materi. Pilih langkah berikutnya, atau lompat ke bab yang kamu butuhkan.</p>${nextLesson ? `<section class="surface next-step"><div><span class="eyebrow">LANGKAH BERIKUTNYA</span><h2>${escapeHtml(nextLesson.title)}</h2><p>${escapeHtml(nextLesson.chapter.title)}</p></div><a class="button button-primary" href="#/lesson/${nextLesson.id}">Lanjutkan belajar →</a></section>` : '<div class="notice">Semua materi saat ini selesai. Kamu dapat mengulang materi atau mencoba simulasi.</div>'}<section class="section-heading"><div><span class="eyebrow">PETA BAB</span><h2>Jalur literasi keuangan</h2></div><a class="text-link" href="#/curriculum">Kurikulum kelas 10–12 →</a></section><section class="map-list">${rows}</section><p class="notice" style="margin-top:24px">Progres disimpan secara lokal di browser ini. Data tidak tersinkron ke perangkat lain.</p></div>`, "map");
  }
  function profileView() {
    const user = profile();
    if (!user || user.role !== "student") return notFoundView();
    return shell(`<div class="page-wrap narrow"><span class="eyebrow">Profil & pengaturan</span><h1 style="font-size:clamp(35px,5vw,48px);margin:10px 0">Ruang belajarmu.</h1><p class="lead" style="font-size:16px">Perbarui nama atau kelas yang ditampilkan. ID profil lokal tetap sama sehingga progres tidak berubah.</p><section class="surface pad"><form id="profile-form"><div class="field"><label for="profile-name">Nama lengkap</label><input id="profile-name" name="name" value="${escapeHtml(user.name)}" minlength="2" maxlength="80" required></div><div class="field"><label for="profile-class">Kelas atau peran</label><input id="profile-class" name="className" value="${escapeHtml(user.className)}" minlength="2" maxlength="40" required></div><p class="form-message" id="profile-error" role="alert"></p><button class="button button-primary" type="submit">Simpan profil</button></form></section><section class="surface pad" style="margin-top:18px"><span class="eyebrow">DATA & PRIVASI</span><h2 style="font-size:21px;margin:10px 0">Penyimpanan browser</h2><p>Profil dan progres hanya tersimpan pada browser/perangkat ini jika penyimpanan lokal tersedia. Identitas tidak diverifikasi, data tidak dikirim ke server, dan tidak tersinkron otomatis antarperangkat.</p><div class="row"><a class="button button-secondary" href="#/progress">Lihat progres</a><button class="button button-quiet" data-action="logout">Keluar dan ganti profil</button></div></section></div>`, "");
  }
  function recordSimulation(key, label) {
    const progress = progressFor(profile().id);
    progress.simulations = progress.simulations || {};
    progress.simulations[key] = true;
    recordStudyDay(progress);
    recordActivity(progress, label);
    const earned = grantReward(progress, "simulation:" + key, 10);
    const saved = saveProgress(progress);
    if (!saved) return;
    if (earned) showToast("Simulasi selesai · +10 XP");
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
        (track === "all" || lesson.track === track) &&
        (grade === "all" || String(lesson.grade || "") === grade) &&
        (chapter === "all" || lesson.chapter.id === chapter) &&
        (status === "all" || (status === "done") === progress.completed.includes(lesson.id));
    });
    if (sort === "title") matching.sort((a, b) => a.title.localeCompare(b.title, "id"));
    if (sort === "time") matching.sort((a, b) => (a.minutes || 5) - (b.minutes || 5) || a.title.localeCompare(b.title, "id"));
    document.getElementById("finder-count").textContent = `${matching.length} materi ditemukan`;
    container.innerHTML = matching.length ? matching.slice(0, 60).map(lesson => `<a class="learning-result" href="#/lesson/${lesson.id}"><span class="eyebrow">${lesson.track === "curriculum" ? `KELAS ${lesson.grade} · PENGAYAAN` : "LITERASI KEUANGAN"} · ${escapeHtml(lesson.chapter.title)}</span><strong>${escapeHtml(lesson.title)}</strong><span class="small muted">${escapeHtml(lesson.opener)}</span><span class="small ${progress.completed.includes(lesson.id) ? "done-mark" : "muted"}">${progress.completed.includes(lesson.id) ? "Selesai ✓" : "Belum selesai"} · ${lesson.minutes || 5} menit →</span></a>`).join("") : '<div class="empty-state">Tidak ada materi yang cocok. Coba kata kunci atau filter lain.</div>';
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
    else if (current === "simulations" && user.role === "student") ROOT.innerHTML = simulationsView();
    else if (current === "quiz" && user.role === "student") ROOT.innerHTML = quizView();
    else if (current === "progress" && user.role === "student") ROOT.innerHTML = progressView();
    else if (current === "review" && user.role === "student") ROOT.innerHTML = reviewView();
    else if (current === "achievements" && user.role === "student") ROOT.innerHTML = achievementsView();
    else if (current === "admin" && user.role === "admin-demo") ROOT.innerHTML = adminView();
    else ROOT.innerHTML = notFoundView();
  }

  ROOT.addEventListener("click", function (event) {
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
      choices.forEach(choice => { choice.setAttribute("aria-pressed", String(choice === button)); choice.classList.remove("correct", "incorrect"); });
      button.dataset.selected = "true";
    } else if (action === "practice-check") {
      const selected = ROOT.querySelector("[data-action='practice-choice'][data-selected='true']");
      const feedback = document.getElementById("practice-feedback");
      if (!selected) { feedback.textContent = "Pilih satu jawaban terlebih dahulu."; return; }
      const correct = Number(selected.dataset.index) === Number(button.dataset.answer);
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
      } else {
        const previous = progress.reviewLessons[lessonId];
        progress.reviewLessons[lessonId] = { count: previous ? previous.count + 1 : 1, lastDate: new Date().toISOString() };
        saveProgress(progress);
      }
    } else if (action === "complete-lesson") {
      const progress = progressFor(profile().id);
      const beforeLevel = levelInfo(progress.xp).level;
      let earned = false;
      if (!progress.completed.includes(button.dataset.id)) {
        progress.completed.push(button.dataset.id);
        earned = grantReward(progress, "lesson:" + button.dataset.id, 20);
      }
      progress.lastLesson = button.dataset.id;
      recordStudyDay(progress);
      recordActivity(progress, "Menyelesaikan materi · " + button.dataset.id);
      saveProgress(progress);
      if (earned && levelInfo(progress.xp).level > beforeLevel) showLevelUp(levelInfo(progress.xp));
      else if (earned) showToast("Materi ditandai selesai · +20 XP");
      else showToast("Materi ini sudah selesai sebelumnya.");
      if (button.dataset.next) go("lesson/" + button.dataset.next);
      else render();
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
          if (grantReward(progress, "simulation:scenario:" + select.value, 15)) {
            if (levelInfo(progress.xp).level > beforeLevel) showLevelUp(levelInfo(progress.xp));
            else showToast("Tantangan selesai · +15 XP");
          }
          saveProgress(progress);
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

  ROOT.addEventListener("change", function (event) {
    if (event.target.matches("[data-action='scenario-select']")) {
      document.getElementById("scenario-content").innerHTML = scenarioHtml(event.target.value, null);
    }
    if (event.target.matches("#quiz-mode, #quiz-chapter")) updateQuizTopicOptions();
    if (event.target.matches("#learning-track, #learning-grade, #learning-chapter, #learning-status, #learning-sort")) refreshLearningResults();
  });
  ROOT.addEventListener("input", function (event) {
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
        const earned = grantReward(progress, "simulation:budget", 15);
        saveProgress(progress);
        if (earned && levelInfo(progress.xp).level > beforeLevel) showToast(`Tantangan anggaran selesai · naik ke level ${levelInfo(progress.xp).level}!`);
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

  window.addEventListener("hashchange", render);
  document.addEventListener("DOMContentLoaded", function () {
    render();
    if (location.hash === "#login") document.getElementById("login")?.scrollIntoView();
  });
  render();
})();
