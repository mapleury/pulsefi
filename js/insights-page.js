/*
  insights-page.js
  ----------------
  Page controller for insights.html ("Pola Finansial"). Reads the
  user's real transactions/goals from PulseStorage and renders every
  number/label from PulseCalc, PulseInsights, and PulseInterventions —
  nothing on this page is hardcoded sample data.
*/

(function () {
  // Localized display names for PulseCalc.classifyFinancialTwin()'s
  // English keys — same underlying real classification, just the
  // product's Indonesian copy layered on top.
  const TWIN_DISPLAY_TITLES = {
    "cautious-saver": "Si Penabung Berhati-hati",
    "weekend-spender": "Si Pemburu Akhir Pekan",
    "impulse-explorer": "Si Penjelajah Impulsif",
    "balanced-builder": "Si Pembangun Seimbang",
    unknown: "Belum Terlihat Polanya",
  };

  function init() {
    if (!document.getElementById("insights-page")) return;

    const transactions = PulseStorage.getTransactions();
    const goals = PulseStorage.getGoals();

    renderPulseCard(transactions, goals);
    renderTwin(transactions);
    renderCategoryBars(transactions);
    renderInsights(transactions, goals);
    renderInterventions(transactions, goals);
  }

    function renderPulseCard(transactions, goals) {
    const result = PulseCalc.calculateFinancialScore(transactions, goals);
    document.getElementById("pulse-score").textContent = result.score;
    document.getElementById("pulse-status").textContent = result.label;
    const pathEl = document.getElementById("pulse-wave-path");
    drawWave(pathEl, result.score);
    startPulseLoop(pathEl, result.score);
  }

  // Continuous pulsing that reflects the real score: a low score pulses
  // fast and erratically (unstable rhythm), a high score pulses slow and
  // steady. Starts once the initial draw-in animation has finished.
  function startPulseLoop(pathEl, score) {
    if (!pathEl) return;
    const clamped = Math.max(0, Math.min(100, Number(score) || 0));

    // 0 -> 0.7s (fast), 100 -> 2.5s (slow) — linear interpolation
    const duration = (0.7 + (clamped / 100) * 1.8).toFixed(2);
    const animationName = clamped >= 55 ? "pulse-loop-steady" : "pulse-loop-erratic";

    const drawInTotalMs = 1300 + 150; // matches draw-pulse's 1.3s duration + 0.15s delay
    setTimeout(() => {
      pathEl.style.animation = `${animationName} ${duration}s ease-in-out infinite`;
    }, drawInTotalMs);
  }

  // Simple illustrative waveform, shaped by the real score (higher score
  // = calmer/higher line, lower score = more jagged) — not random noise.
  function drawWave(pathEl, score) {
    if (!pathEl) return;
    const amplitude = 10 + (100 - score) * 0.25; // lower score -> more jagged
    const baseline = 45;
    const points = [
      [0, baseline],
      [40, baseline - amplitude * 0.3],
      [70, baseline + amplitude * 0.5],
      [100, baseline - amplitude],
      [130, baseline + amplitude * 0.2],
      [170, baseline - amplitude * 0.6],
      [220, baseline],
      [260, baseline - amplitude * 0.4],
      [300, baseline],
    ];
    const d = points.map((p, i) => (i === 0 ? "M" : "L") + p[0] + "," + p[1]).join(" ");
    pathEl.setAttribute("d", d);
  }

  function renderTwin(transactions) {
    const twin = PulseCalc.classifyFinancialTwin(transactions);
    document.getElementById("twin-title").textContent = TWIN_DISPLAY_TITLES[twin.key] || twin.title;
    document.getElementById("twin-desc").textContent = twin.description;
  }

  function renderCategoryBars(transactions) {
    const container = document.getElementById("category-bars");
    const patterns = PulseCalc.analyzeSpendingPatterns(transactions);
    const top = patterns.breakdown.slice(0, 5);

    if (top.length === 0) {
      container.innerHTML = '<p class="empty-state">Belum ada kategori pengeluaran untuk ditampilkan.</p>';
      return;
    }

    const max = top[0].amount || 1;
    container.innerHTML = top
      .map(
        (c) => `
        <div class="category-bar">
          <span class="category-bar-label">${PulseUtils.escapeHtml(c.category)}</span>
          <div class="category-bar-track">
            <div class="category-bar-fill" data-width="${Math.max(6, Math.round((c.amount / max) * 100))}"></div>
          </div>
        </div>`
      )
      .join("");

    // animate widths in after paint, so the fill transition actually plays
    requestAnimationFrame(() => {
      container.querySelectorAll(".category-bar-fill").forEach((el) => {
        el.style.width = el.dataset.width + "%";
      });
    });
  }

  function renderInsights(transactions, goals) {
    const list = document.getElementById("patterns-list");
    const empty = document.getElementById("patterns-empty");
    const insights = PulseInsights.generateInsights(transactions, goals);

    if (insights.length === 0) {
      list.innerHTML = "";
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    list.innerHTML = insights
      .map(
        (item) => `
        <li class="pattern-card">
          <span class="pattern-badge">!</span>
          <h3 class="pattern-title">${PulseUtils.escapeHtml(item.title)}</h3>
          <p class="pattern-text">${PulseUtils.escapeHtml(item.text)}</p>
        </li>`
      )
      .join("");
  }

  function renderInterventions(transactions, goals) {
    const list = document.getElementById("actions-list");
    const empty = document.getElementById("actions-empty");
    const interventions = PulseInterventions.generateInterventions(transactions, goals);

    if (interventions.length === 0) {
      list.innerHTML = "";
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    list.innerHTML = interventions
      .map(
        (item, i) => `
        <li>
          <button class="action-pill" type="button" data-index="${i}">
            <span>${PulseUtils.escapeHtml(item.action)}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 8h9M8.5 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </li>`
      )
      .join("");

    // Turn an intervention into a tracked habit on click (real write to
    // PulseStorage, not a cosmetic toggle) — then disable that pill.
    list.querySelectorAll(".action-pill").forEach((btn, i) => {
      btn.addEventListener("click", () => {
        const item = interventions[i];
        PulseStorage.addHabit({ title: item.habitTitle, detail: item.title, target: item.target });
        PulseUtils.toast('Ditambahkan ke "Kebiasaan yang sedang dibangun".', "success");
        btn.disabled = true;
        btn.querySelector("span").textContent = item.habitTitle + " ✓";
      });
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();