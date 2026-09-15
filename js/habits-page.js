/*
  habits-page.js
  --------------
  Controller for insights.html ("Kebiasaan"). Reads and writes real data
  through PulseStorage only — nothing here is hard-coded or randomised
  beyond the one-time seed of the three starter habits (mirrors the
  daily check-in modal), matching the rest of the app's philosophy.

  Three responsibilities:
    1. Weekly habit-intensity graph (day pills + colour-coded bars,
       navigable by week).
    2. "Check List Hari ini" — today's completed habits, read live from
       PulseStorage.
    3. What-if savings simulator — current conditions pulled from this
       month's real transactions, scenario fields editable, projection
       recalculated on every change.

  Note: the daily check-in modal (checkin-modal.html) does not yet call
  PulseStorage.checkInHabit itself, so until that's wired up this page
  will correctly show empty/zero states — that's real data, not a bug.
*/

(function () {
  const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  const DEFAULT_HABITS = [
    { title: "Menunda Jajan Kopi", detail: "Kurangi beli kopi di luar", target: 7 },
    { title: "Menggunakan Transum", detail: "Naik transportasi umum", target: 7 },
    { title: "Tidak beli gorengan", detail: "Hindari jajan gorengan", target: 7 },
  ];

  const FIELD_KEYS = ["kopi", "makan", "hiburan", "belanja", "pemasukan", "lain"];

  const CATEGORY_MAP = {
    kopi: ["kopi", "coffee"],
    makan: ["makan", "kuliner", "food", "restoran"],
    hiburan: ["hiburan", "entertainment", "nonton", "game"],
    belanja: ["belanja", "shopping", "fashion"],
  };

  let weekOffset = 0;

  // ---------------- one-time seed ----------------

  function seedDefaultHabits() {
    if (PulseStorage.getHabits().length === 0) {
      DEFAULT_HABITS.forEach((h) => PulseStorage.addHabit(h));
    }
  }

  // ---------------- date helpers (local to this page) ----------------

  function toISODate(d) {
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function startOfWeekMonday(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sun ... 6 = Sat
    const diff = day === 0 ? -6 : 1 - day;
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + diff);
    return d;
  }

  // ---------------- weekly habit graph ----------------

  function tierForCount(count) {
    if (count <= 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    return 3; // 3 or more habits done that day -> darkest tier
  }

  function habitDaysForWeek(offset) {
    const habits = PulseStorage.getHabits();
    const anchor = startOfWeekMonday(new Date());
    anchor.setDate(anchor.getDate() + offset * 7);
    const todayISO = PulseUtils.todayISO();

    return DAY_LABELS.map((label, i) => {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() + i);
      const iso = toISODate(d);
      const count = habits.filter((h) => h.completedDates.includes(iso)).length;
      return { label, iso, count, isToday: iso === todayISO };
    });
  }

  function renderDayGraph() {
    const days = habitDaysForWeek(weekOffset);
    const pillRow = document.getElementById("day-pill-row");
    const barsRow = document.getElementById("day-bars-row");
    if (!pillRow || !barsRow) return;

    pillRow.innerHTML = "";
    barsRow.innerHTML = "";

    days.forEach((day) => {
      const pill = document.createElement("span");
      pill.className = "day-pill" + (day.isToday && weekOffset === 0 ? " is-active" : "");
      pill.textContent = day.label;
      pillRow.appendChild(pill);

      const col = document.createElement("div");
      col.className = "day-bar-col";

      const bar = document.createElement("div");
      const tier = tierForCount(day.count);
      bar.className = "day-bar tier-" + tier + (day.count > 0 ? " has-check" : "");
      bar.title =
        day.count > 0
          ? `${day.count} kebiasaan selesai \u2014 ${day.label}`
          : `Belum ada kebiasaan selesai \u2014 ${day.label}`;

      if (day.count > 0) {
        const stroke = tier === 1 ? "#101010" : "#ffffff";
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("class", "day-bar-check");
        svg.innerHTML = `<polyline points="20 6 9 17 4 12" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>`;
        bar.appendChild(svg);
      }

      col.appendChild(bar);
      barsRow.appendChild(col);
    });

    const nextBtn = document.getElementById("habit-week-next");
    if (nextBtn) nextBtn.disabled = weekOffset >= 0;
  }

  function initWeekNav() {
    const prevBtn = document.getElementById("habit-week-prev");
    const nextBtn = document.getElementById("habit-week-next");
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        weekOffset -= 1;
        renderDayGraph();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        weekOffset = Math.min(0, weekOffset + 1);
        renderDayGraph();
      });
    }
  }

  // ---------------- check list hari ini ----------------

  function renderChecklist() {
    const list = document.getElementById("checklist-list");
    if (!list) return;
    list.innerHTML = "";

    const today = PulseUtils.todayISO();
    const doneToday = PulseStorage.getHabits().filter((h) => h.completedDates.includes(today));

    if (doneToday.length === 0) {
      const empty = document.createElement("p");
      empty.className = "checklist-empty";
      empty.textContent =
        "Belum ada kebiasaan yang di-check-in hari ini. Kebiasaan yang kamu selesaikan lewat check-in harian akan muncul di sini.";
      list.appendChild(empty);
      return;
    }

    doneToday.forEach((h) => {
      const pill = document.createElement("div");
      pill.className = "checklist-pill";

      const check = document.createElement("span");
      check.className = "checklist-check";
      check.innerHTML =
        '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" fill="none" stroke="#15131C" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline></svg>';

      const text = document.createElement("span");
      text.textContent = `Berhasil dilakukan hari ini: ${h.title}`;

      pill.append(check, text);
      list.appendChild(pill);
    });
  }

  // ---------------- what-if simulator ----------------

  function matchesCategory(category, keywords) {
    const c = (category || "").toLowerCase();
    return keywords.some((k) => c.includes(k));
  }

  function currentMonthTransactions() {
    const now = new Date();
    return PulseStorage.getTransactions().filter((t) => {
      const d = new Date(t.date);
      return !isNaN(d.getTime()) && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  }

  function computeCurrentConditions() {
    const txs = currentMonthTransactions();
    const expenses = txs.filter((t) => t.type === "expense");
    const incomeTotal = txs.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);

    let kopi = 0, makan = 0, hiburan = 0, belanja = 0;
    expenses.forEach((t) => {
      const amt = Number(t.amount) || 0;
      if (matchesCategory(t.category, CATEGORY_MAP.kopi)) kopi += amt;
      else if (matchesCategory(t.category, CATEGORY_MAP.makan)) makan += amt;
      else if (matchesCategory(t.category, CATEGORY_MAP.hiburan)) hiburan += amt;
      else if (matchesCategory(t.category, CATEGORY_MAP.belanja)) belanja += amt;
    });

    const matchedTotal = kopi + makan + hiburan + belanja;
    const expenseTotal = expenses.reduce((s, t) => s + Number(t.amount), 0);
    const lain = Math.max(0, expenseTotal - matchedTotal);

    const profile = PulseStorage.getProfile();
    const pemasukan = incomeTotal > 0 ? incomeTotal : profile && profile.monthlyIncome ? Number(profile.monthlyIncome) : 0;

    return { kopi, makan, hiburan, belanja, pemasukan, lain };
  }

  function fillCurrentFields(cond) {
    FIELD_KEYS.forEach((key) => {
      const currentEl = document.getElementById("current-" + key);
      if (currentEl) currentEl.value = Math.round(cond[key]);

      const scenarioEl = document.getElementById("scenario-" + key);
      if (scenarioEl && !scenarioEl.dataset.touched) scenarioEl.value = Math.round(cond[key]);
    });
  }

  function readScenario() {
    const out = {};
    FIELD_KEYS.forEach((key) => {
      const el = document.getElementById("scenario-" + key);
      out[key] = el ? Number(el.value) || 0 : 0;
    });
    return out;
  }

  function setProjectionValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    const sign = value < 0 ? "-" : "";
    el.textContent = sign + PulseUtils.formatCurrency(Math.abs(value));
    el.classList.toggle("is-negative", value < 0);
  }

  function recalcProjection() {
    const current = computeCurrentConditions();
    const scenario = readScenario();

    const currentExpenseTotal = current.kopi + current.makan + current.hiburan + current.belanja + current.lain;
    const scenarioExpenseTotal = scenario.kopi + scenario.makan + scenario.hiburan + scenario.belanja + scenario.lain;

    const currentSavings = current.pemasukan - currentExpenseTotal;
    const scenarioSavings = scenario.pemasukan - scenarioExpenseTotal;
    const monthlyDelta = scenarioSavings - currentSavings;

    setProjectionValue("proj-monthly", monthlyDelta);
    setProjectionValue("proj-year1", monthlyDelta * 12);
    setProjectionValue("proj-year3", monthlyDelta * 36);
    setProjectionValue("proj-newsaving", scenarioSavings);
  }

  function initSimulator() {
    const current = computeCurrentConditions();
    fillCurrentFields(current);

    FIELD_KEYS.forEach((key) => {
      const el = document.getElementById("scenario-" + key);
      if (!el) return;
      el.addEventListener("input", () => {
        el.dataset.touched = "1";
        recalcProjection();
      });
    });

    recalcProjection();

    const applyBtn = document.getElementById("apply-scenario-btn");
    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        recalcProjection();
        PulseUtils.toast("Skenario diterapkan ke proyeksi.", "success");
      });
    }
  }

  // ---------------- init ----------------

  document.addEventListener("DOMContentLoaded", () => {
    seedDefaultHabits();
    renderDayGraph();
    renderChecklist();
    initWeekNav();
    initSimulator();
  });
})();