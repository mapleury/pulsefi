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
    if (PulseUtils.redirectIfNeedsOnboarding()) return;

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
    const width = 600;
    const height = 60;
    const midY = height / 2;
    const amplitude = 6 + (100 - score) * 0.16;
    const segments = score >= 80 ? 3 : score >= 60 ? 4 : score >= 40 ? 5 : 7;
    const segWidth = width / segments;

    let d = `M0,${midY}`;
    for (let i = 0; i < segments; i++) {
      const x0 = i * segWidth;
      const peakX = x0 + segWidth * 0.45;
      const dipX = x0 + segWidth * 0.6;
      const backX = x0 + segWidth * 0.75;
      d += ` L${x0 + segWidth * 0.25},${midY}`;
      d += ` L${peakX},${midY - amplitude}`;
      d += ` L${dipX},${midY + amplitude * 0.6}`;
      d += ` L${backX},${midY}`;
      d += ` L${x0 + segWidth},${midY}`;
    }

    host.innerHTML = "";
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.classList.add("pulse-wave-svg");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Visualisasi detak finansial");

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-width", "3");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.classList.add("pulse-wave-path");

    svg.appendChild(path);
    host.appendChild(svg);
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
