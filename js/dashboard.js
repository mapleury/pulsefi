/*
 dashboard.js
 ------------
 Page controller for dashboard.html. Reads transactions/goals/profile
 from PulseStorage, runs them through PulseCalc/PulseInsights, and
 renders every card in the redesigned single-screen dashboard:

   1. Greeting
   2. Financial Pulse (score + heartbeat)
   3. Rata Rata Transaksi (signed average for the current window)
   4. Grafik Transaksi (delegated entirely to PulseChart)
   5. Konteks Keseluruhan (income / expense / balance)
   6. AI Insight signal (most urgent thing happening right now)
   7. Financial Twin

 Every render function takes plain data and touches only its own
 corner of the DOM — nothing here returns HTML strings.
*/

(function () {
  function init() {
     if (!document.getElementById("dashboard-page")) return;

    const transactions = PulseStorage.getTransactions();
    const goals = PulseStorage.getGoals();
    const profile = PulseStorage.getProfile();

    renderGreeting(profile);
    renderFinancialPulse(transactions, goals);
    renderAvgCard(transactions);
    renderContext(transactions);
    renderSignal(transactions, goals);
    renderTwin(transactions);
    initChart(transactions);
  }

  // ---------------- 1. greeting ----------------

  function renderGreeting(profile) {
    const nameEl = document.getElementById("greeting-name");
    if (!nameEl) return;
    const name = profile && profile.name ? profile.name : "kamu";
    nameEl.textContent = name;
  }

  // ---------------- 2. financial pulse ----------------

  function renderFinancialPulse(transactions, goals) {
    const scoreEl = document.getElementById("pulse-score");
    const statusEl = document.getElementById("pulse-status");
    const waveHost = document.getElementById("pulse-wave");
    if (!scoreEl) return;

    const result = PulseCalc.calculateFinancialScore(transactions, goals);

    PulseUtils.animateNumber(scoreEl, 0, result.score, { duration: 1100 });
    if (statusEl) statusEl.textContent = result.label || "Belum ada data";
    if (waveHost) renderPulseWave(waveHost, result.score);
  }

  // Heartbeat-style SVG line. A higher score produces a calmer, more even
  // rhythm; a lower score produces a sharper, more irregular rhythm.
   function renderPulseWave(host, score) {
    const width = 240;
    const height = 40;
    const unitW = 30;
    const beats = 8;
    const patternW = unitW * beats; // 240 — exactly one loop width

    function beatPath(startX) {
      const mid = height / 2;
      const amp = height * 0.42;
      const pts = [
        [0, 0], [0.13, 0], [0.20, -amp * 0.28], [0.27, 0],
        [0.32, amp * 0.3], [0.37, -amp], [0.42, amp * 0.55],
        [0.48, 0], [0.58, -amp * 0.35], [0.68, 0], [1, 0],
      ];
      return pts
        .map(([fx, fy], i) => (i === 0 ? "M" : "L") + (startX + fx * unitW).toFixed(1) + "," + (mid + fy).toFixed(1))
        .join(" ");
    }

    let d = "";
    for (let i = 0; i < beats; i++) d += beatPath(i * unitW) + " ";
    d = d.trim();

    host.innerHTML = "";
    const svgNS = "http://www.w3.org/2000/svg";

    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.classList.add("ecg-svg");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Visualisasi detak finansial");

    const defs = document.createElementNS(svgNS, "defs");

    const grad = document.createElementNS(svgNS, "linearGradient");
    grad.setAttribute("id", "ecg-fade");
    grad.setAttribute("x1", "0"); grad.setAttribute("y1", "0");
    grad.setAttribute("x2", "1"); grad.setAttribute("y2", "0");
    [["0%", "0"], ["18%", "1"], ["82%", "1"], ["100%", "0"]].forEach(([offset, opacity]) => {
      const stop = document.createElementNS(svgNS, "stop");
      stop.setAttribute("offset", offset);
      stop.setAttribute("stop-color", "#fff");
      stop.setAttribute("stop-opacity", opacity);
      grad.appendChild(stop);
    });
    defs.appendChild(grad);

    const mask = document.createElementNS(svgNS, "mask");
    mask.setAttribute("id", "ecg-mask");
    mask.setAttribute("maskUnits", "userSpaceOnUse");
    mask.setAttribute("x", "0"); mask.setAttribute("y", "0");
    mask.setAttribute("width", String(width)); mask.setAttribute("height", String(height));
    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("x", "0"); rect.setAttribute("y", "0");
    rect.setAttribute("width", String(width)); rect.setAttribute("height", String(height));
    rect.setAttribute("fill", "url(#ecg-fade)");
    mask.appendChild(rect);
    defs.appendChild(mask);

    svg.appendChild(defs);

    // static wrapper carries the fixed fade mask; the inner group scrolls
    const staticG = document.createElementNS(svgNS, "g");
    staticG.setAttribute("mask", "url(#ecg-mask)");

    const track = document.createElementNS(svgNS, "g");
    track.classList.add("ecg-track");

    [0, 1].forEach((copy) => {
      const path = document.createElementNS(svgNS, "path");
      path.setAttribute("class", "ecg-line");
      path.setAttribute("d", d);
      path.setAttribute("transform", `translate(${copy * patternW}, 0)`);
      track.appendChild(path);
    });

    staticG.appendChild(track);
    svg.appendChild(staticG);
    host.appendChild(svg);

    // Below 60, the beat quickens toward a racing 1.6s loop.
    // At or above 60, it settles into a calm, standard 4.5s loop.
    const STANDARD_DURATION = 4.5;
    const FASTEST_DURATION = 1.6;
    const THRESHOLD = 60;
    const duration = score >= THRESHOLD
      ? STANDARD_DURATION
      : FASTEST_DURATION + (score / THRESHOLD) * (STANDARD_DURATION - FASTEST_DURATION);
    track.style.setProperty("--ecg-duration", duration.toFixed(2) + "s");

    const card = host.closest(".card-pulse");
    if (card) card.classList.toggle("is-racing", score < THRESHOLD * 0.4);
  }

  // ---------------- 3. rata rata transaksi ----------------

  function renderAvgCard(transactions) {
    const valueEl = document.getElementById("avg-value");
    if (!valueEl) return;
    const avg = PulseCalc.averageTransactionForWindow(transactions, 7);
    valueEl.textContent = PulseUtils.formatCurrencySigned(avg);
  }

  // ---------------- 5. konteks keseluruhan ----------------

  function renderContext(transactions) {
    const t = PulseCalc.totals(transactions);
    setText("overview-income", PulseUtils.formatCurrency(t.income));
    setText("overview-expense", PulseUtils.formatCurrency(t.expense));
    setText("overview-balance", PulseUtils.formatCurrency(t.balance));
  }

  // ---------------- 6. AI insight signal ----------------
  // Surfaces whichever single thing is most worth the user's attention
  // right now: an under-filled savings goal takes priority (it is the
  // most actionable, deadline-bound signal); otherwise the top-ranked
  // PulseInsights entry (warnings sort first) fills the same slot.

  function computePrimaryAlert(transactions, goals) {
    if (goals && goals.length > 0) {
      const projections = goals.map((g) => Object.assign({ goal: g }, PulseCalc.calculateGoalProjection(g)));
      const lowest = projections.reduce((a, b) => (a.percent <= b.percent ? a : b));
      const percent = Math.round(lowest.percent);
      const urgent = percent < 60;
      return {
        percent,
        urgent,
        text: urgent
          ? `Target tabungan "${lowest.goal.name}" belum terisi bulan ini.`
          : `Target tabungan "${lowest.goal.name}" sudah terisi ${percent}%, pertahankan ritmenya.`,
      };
    }

    if (!transactions || transactions.length === 0) {
      return { percent: 0, urgent: false, text: "Tambahkan transaksi pertama untuk melihat insight pertamamu." };
    }

    const patterns = PulseCalc.analyzeSpendingPatterns(transactions);
    const insights = PulseInsights.generateInsights(transactions, goals);
    const savingPercent = Math.round(Math.max(0, Math.min(1, patterns.savingRate)) * 100);

    if (insights.length > 0) {
      return { percent: savingPercent, urgent: insights[0].tone === "warning", text: insights[0].text };
    }
    return { percent: savingPercent, urgent: false, text: "Pola pengeluaranmu masih stabil, belum ada yang mendesak." };
  }

  function renderSignal(transactions, goals) {
    const valueEl = document.getElementById("signal-value");
    const textEl = document.getElementById("signal-text");
    const badgeEl = document.getElementById("signal-badge");
    if (!valueEl) return;

    const alert = computePrimaryAlert(transactions, goals);
    valueEl.textContent = alert.percent + "%";
    if (textEl) textEl.textContent = alert.text;
    if (badgeEl) badgeEl.textContent = alert.urgent ? "!" : "\u2713";
  }

  // ---------------- 7. financial twin ----------------

  function renderTwin(transactions) {
    const titleEl = document.getElementById("twin-title");
    const descEl = document.getElementById("twin-desc");
    if (!titleEl) return;
    const twin = PulseCalc.classifyFinancialTwin(transactions);
    titleEl.textContent = titleCase(twin.title);
    if (descEl) descEl.textContent = twin.description;
  }

  function titleCase(str) {
    return str
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  // ---------------- 4. grafik transaksi ----------------

  function initChart(transactions) {
    const bodyEl = document.getElementById("chart-body");
    if (!bodyEl) return;
    const chart = PulseChart.create({
      bodyEl,
      toggleEl: document.getElementById("chart-mode-toggle"),
      prevBtn: document.getElementById("chart-prev"),
      nextBtn: document.getElementById("chart-next"),
      getTransactions: () => transactions,
    });
    chart.render();
  }

  // ---------------- helpers ----------------

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  document.addEventListener("DOMContentLoaded", init);
})();
