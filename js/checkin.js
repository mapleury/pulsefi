/*
 checkin.js
 ----------
 Wires the daily check-in modal to real data instead of hardcoded demo
 cards. Depends on storage.js (PulseStorage), calculation.js (PulseCalc,
 used indirectly via insights.js), insights.js (PulseInterventions) and
 auth.js (PulseAuth) already being loaded on the page. Runs itself on
 DOMContentLoaded — nothing else needs to call it.

 Two modes:
   "checkin" -> the user already has active habits. Up to 3 of them
                (highest streak first) are shown; clicking one and
                hitting the arrow marks it done for today via
                PulseStorage.checkInHabit.
   "select"  -> the user has no active habits yet (brand-new account,
                or all habits completed/deleted). Up to 3 habits are
                suggested — built from PulseInterventions against the
                user's real transactions/goals when there's enough
                history, otherwise a generic starter set. Habits picked
                here are created via PulseStorage.addHabit and
                immediately checked in, since the copy asks which ones
                the user has already been doing.

 The modal only appears once per calendar day: PulseStorage
 .hasBeenPromptedToday() gates whether it's injected at all, and
 PulseStorage.setLastCheckinPromptDate() is called the moment it's
 dismissed (finished or skipped), not only on completion.
*/

const PulseCheckin = (function () {
  const THEMES = ["dark", "purple", "light"];

  const DEFAULT_CANDIDATES = [
    { title: "Menunda Jajan Kopi", detail: "Tunda beli kopi sekali hari ini.", target: 1 },
    { title: "Menggunakan Transum", detail: "Pilih transportasi umum untuk satu perjalanan.", target: 1 },
    { title: "Tidak Beli Gorengan", detail: "Lewati jajanan gorengan hari ini.", target: 1 },
  ];

  const CHECK_WHITE =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  const CHECK_BLACK =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#101010" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

  function ensureFont() {
    if (document.getElementById("checkin-serif-font")) return;
    const link = document.createElement("link");
    link.id = "checkin-serif-font";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap";
    document.head.appendChild(link);
  }

  // Decide what to show: the user's own active habits (top 3 by streak),
  // or up to 3 suggested starter habits if they don't have any yet.
  function buildCandidates() {
    const activeHabits = PulseStorage.getActiveHabits();
    if (activeHabits.length > 0) {
      const top = activeHabits
        .slice()
        .sort((a, b) => (b.streak || 0) - (a.streak || 0) || new Date(a.createdAt) - new Date(b.createdAt))
        .slice(0, 3);
      return { mode: "checkin", items: top };
    }

    const transactions = PulseStorage.getTransactions();
    const goals = PulseStorage.getGoals();
    let suggestions = [];
    if (typeof PulseInterventions !== "undefined" && transactions.length > 0) {
      suggestions = PulseInterventions.generateInterventions(transactions, goals)
        .slice(0, 3)
        .map((i) => ({ title: i.habitTitle, detail: i.action, target: i.target || 1 }));
    }
    if (suggestions.length === 0) suggestions = DEFAULT_CANDIDATES;
    return { mode: "select", items: suggestions.slice(0, 3) };
  }

  function weekDates() {
    const today = new Date();
    const rawDay = today.getDay(); // 0 = Sunday
    const currentDayIndex = rawDay === 0 ? 6 : rawDay - 1; // Monday = 0
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDayIndex);
    const labels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({ iso: d.toISOString().slice(0, 10), label: labels[i] });
    }
    return { days, currentDayIndex };
  }

  function anyHabitDoneOn(iso) {
    return PulseStorage.getHabits().some((h) => (h.completedDates || []).includes(iso));
  }

  function themeColor(theme) {
    if (theme === "dark") return "#1a192b";
    if (theme === "purple") return "#5c42a6";
    return "#f4f5f8";
  }

  function buildModalMarkup(mode) {
    const heading =
      mode === "select"
        ? "Pilih kebiasaan yang ingin kamu tempuh dan telah kamu kerjakan"
        : "Psst.. Hey,<br>Masih konsisten dengan kebiasaan barumu?";
    const subText = mode === "select" ? "Klik kebiasaan yang ingin kamu mulai.." : "Klik yang telah kamu kerjakan..";

    return `
    <div id="checkin-overlay" class="fixed inset-0 flex items-center justify-center z-50 px-4" style="background: rgba(215,216,224,0.7); animation: checkinFadeIn 0.6s ease forwards;">
      <div id="checkin-box" class="bg-white w-full max-w-[500px] p-6 rounded-[32px] shadow-2xl relative overflow-hidden" style="animation: checkinSlideUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards; font-family:'Inter',sans-serif;">
        <div id="checkin-state-1" class="relative z-10 flex flex-col transition-all duration-700 ease-in-out">
          <div class="flex items-center justify-between mb-4">
            <span class="border border-gray-300 rounded-full px-3 py-1 text-xs font-medium text-gray-700 tracking-tight">Check-In Harian</span>
            <button id="checkin-skip" type="button" class="text-xs text-gray-400 hover:text-gray-700 transition-colors">Lewati hari ini</button>
          </div>
          <h2 class="text-xl font-medium text-gray-900 leading-snug tracking-tight mb-5 w-full">${heading}</h2>
          <div id="checkin-cards" class="flex gap-3 mb-8"></div>
          <div class="mt-auto flex justify-between items-center pt-2">
            <span class="text-sm font-medium text-gray-800">${subText}</span>
            <button id="checkin-next" type="button" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer z-20 relative">
              <svg class="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </button>
          </div>
        </div>
        <div id="checkin-state-2" class="absolute inset-0 p-6 flex flex-col z-0 transition-all duration-700 ease-in-out transform translate-x-12 opacity-0 pointer-events-none">
          <div class="flex items-center mb-4">
            <span class="border border-gray-300 rounded-full px-3 py-1 text-xs font-medium text-gray-700 tracking-tight">Check-In Harian</span>
          </div>
          <h2 class="text-[20px] font-medium text-gray-900 leading-snug tracking-tight mb-8 w-11/12">Makasih sudah berusaha mempertahankan kebiasaanmu hari ini!</h2>
          <div id="checkin-days" class="flex justify-center gap-4 sm:gap-5 items-end flex-grow mb-8 pb-4"></div>
          <div class="mt-auto flex justify-between items-center">
            <span class="text-sm font-medium text-gray-800">Lanjut ke dashboard..</span>
            <button id="checkin-close" type="button" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors pointer-events-auto cursor-pointer">
              <svg class="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
    <style>
      @keyframes checkinFadeIn { from { opacity:0; } to { opacity:1; } }
      @keyframes checkinSlideUp { from { opacity:0; transform: translateY(30px) scale(0.95); } to { opacity:1; transform: translateY(0) scale(1); } }
      @keyframes checkinPop { 0%{transform:scale(1) rotate(0deg);} 30%{transform:scale(0.94) rotate(-2deg);} 60%{transform:scale(1.01) rotate(1deg);} 100%{transform:scale(1) rotate(0deg);} }
      .checkin-card-pop { animation: checkinPop 0.2s cubic-bezier(0.34,1.56,0.64,1); }
      .checkin-bar { transition: height 0.8s cubic-bezier(0.34,1.56,0.64,1), background-color 0.5s ease; }
      #checkin-cards .checkin-title { font-family: 'Instrument Serif', serif; }
    </style>`;
  }

  function render() {
    const { mode, items } = buildCandidates();
    if (items.length === 0) return; // nothing to show today, don't block the dashboard

    ensureFont();

    const host = document.createElement("div");
    host.innerHTML = buildModalMarkup(mode);
    document.body.appendChild(host);

    const cardsContainer = document.getElementById("checkin-cards");
    const selected = new Set();

    items.forEach((item, i) => {
      const theme = THEMES[i % THEMES.length];
      const card = document.createElement("div");
      card.className = "checkin-card rounded-2xl p-4 aspect-[4/5] cursor-pointer flex flex-col justify-between shadow-sm relative";
      card.style.width = 100 / items.length + "%";
      card.style.backgroundColor = themeColor(theme);
      card.style.color = theme === "light" ? "#101010" : "#ffffff";
      card.innerHTML = `
        <span class="checkin-title text-[22px] leading-[1.1]" style="letter-spacing:-0.03em;">${item.title}</span>
        <div class="checkin-check absolute bottom-3 right-3 opacity-0 transition-opacity duration-300"></div>
      `;
      card.addEventListener("click", () => {
        card.classList.remove("checkin-card-pop");
        void card.offsetWidth;
        card.classList.add("checkin-card-pop");

        const checkEl = card.querySelector(".checkin-check");
        if (!selected.has(i)) {
          selected.add(i);
          checkEl.innerHTML = theme === "light" ? CHECK_BLACK : CHECK_WHITE;
          checkEl.classList.remove("opacity-0");
          card.style.transform = "scale(0.97)";
        } else {
          selected.delete(i);
          checkEl.classList.add("opacity-0");
          checkEl.innerHTML = "";
          card.style.transform = "scale(1)";
        }
      });
      cardsContainer.appendChild(card);
    });

    document.getElementById("checkin-skip").addEventListener("click", closeModal);
    document.getElementById("checkin-close").addEventListener("click", closeModal);
    document.getElementById("checkin-next").addEventListener("click", () => goToSummary(mode, items, selected));
  }

  function goToSummary(mode, items, selected) {
    // Persist the actual check-in before showing the summary.
    selected.forEach((i) => {
      const item = items[i];
      if (mode === "checkin") {
        PulseStorage.checkInHabit(item.id);
      } else {
        const created = PulseStorage.addHabit({ title: item.title, detail: item.detail, target: item.target || 1 });
        PulseStorage.checkInHabit(created.id);
      }
    });

    const state1 = document.getElementById("checkin-state-1");
    const state2 = document.getElementById("checkin-state-2");
    state1.style.opacity = "0";
    state1.style.transform = "translateX(-3rem)";
    setTimeout(() => {
      state2.classList.remove("opacity-0", "translate-x-12", "pointer-events-none");
      state2.classList.add("opacity-100", "translate-x-0", "pointer-events-auto");
      renderDaysGraph(selected.size);
    }, 150);
  }

  function renderDaysGraph(selectedCount) {
    const container = document.getElementById("checkin-days");
    container.innerHTML = "";
    const { days, currentDayIndex } = weekDates();

    let todayColor = "#e8def7";
    let todayCheck = "";
    if (selectedCount === 1) {
      todayColor = "#f4f5f8";
      todayCheck = CHECK_BLACK;
    } else if (selectedCount === 2) {
      todayColor = "#5c42a6";
      todayCheck = CHECK_WHITE;
    } else if (selectedCount >= 3) {
      todayColor = "#1a192b";
      todayCheck = CHECK_WHITE;
    }

    days.forEach((day, index) => {
      const isToday = index === currentDayIndex;
      const isPast = index < currentDayIndex;
      const done = isToday ? selectedCount > 0 : isPast && anyHabitDoneOn(day.iso);

      const col = document.createElement("div");
      col.className = "flex flex-col items-center justify-end h-full w-[44px]";

      const header = document.createElement("div");
      header.className = `text-[18px] mb-4 px-2 py-0.5 rounded-full flex items-center justify-center transition-all duration-700 ${
        isToday ? "text-white" : "text-gray-900"
      }`;
      header.style.fontFamily = "'Instrument Serif', serif";
      header.style.letterSpacing = "-0.03em";
      if (isToday) header.style.backgroundColor = "#1a192b";
      header.innerText = day.label;
      col.appendChild(header);

      const barWrapper = document.createElement("div");
      barWrapper.className = "flex items-end h-[120px]";

      const bar = document.createElement("div");
      bar.className = "w-[44px] rounded-xl flex items-center justify-center checkin-bar h-0";
      bar.style.backgroundColor = isToday ? todayColor : done ? "#5c42a6" : "#e8def7";
      if (isToday && selectedCount > 0) {
        bar.innerHTML = `<div class="opacity-0 transition-opacity duration-500 scale-75 transform" style="transition-delay:600ms;">${todayCheck}</div>`;
      } else if (!isToday && done) {
        bar.innerHTML = `<div class="opacity-0 transition-opacity duration-500 scale-75 transform" style="transition-delay:600ms;">${CHECK_WHITE}</div>`;
      }

      barWrapper.appendChild(bar);
      col.appendChild(barWrapper);
      container.appendChild(col);

      setTimeout(() => {
        bar.style.height = isToday ? "110px" : "65px";
        const inner = bar.querySelector("div");
        if (inner) {
          setTimeout(() => {
            inner.classList.remove("opacity-0", "scale-75");
            inner.classList.add("opacity-100", "scale-100");
          }, 700);
        }
      }, index * 120);
    });
  }

  function closeModal() {
    PulseStorage.setLastCheckinPromptDate(PulseUtils.todayISO());
    const overlay = document.getElementById("checkin-overlay");
    if (!overlay) return;
    overlay.style.transition = "opacity 0.5s ease";
    overlay.style.opacity = "0";
    setTimeout(() => overlay.remove(), 500);
  }

  function init() {
    if (typeof PulseStorage === "undefined") return;
    const session = typeof PulseAuth !== "undefined" ? PulseAuth.getSession() : null;
    if (!session) return; // no session — auth.js/dashboard.js already handle redirecting to login
    if (PulseStorage.hasBeenPromptedToday()) return;
    render();
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", PulseCheckin.init);