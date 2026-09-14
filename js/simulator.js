/*
  simulator.js
  ------------
  PulseSimulator powers the What-If Simulator. It takes the user's
  current lifestyle spending (coffee, eating out, entertainment,
  shopping, income, other expenses) and a hypothetical "scenario"
  version of the same numbers, then computes the difference over one
  month, one year, and three years — plus how much sooner an active
  goal could be reached if the difference were saved instead.
*/
 
const PulseSimulator = (function () {
  function simulateScenario(current, scenario) {
    const currentTotal =
      Number(current.coffee || 0) + Number(current.eatingOut || 0) +
      Number(current.entertainment || 0) + Number(current.shopping || 0);
    const scenarioTotal =
      Number(scenario.coffee || 0) + Number(scenario.eatingOut || 0) +
      Number(scenario.entertainment || 0) + Number(scenario.shopping || 0);
 
    const monthlyDiff = currentTotal - scenarioTotal;
    const yearlyDiff = monthlyDiff * 12;
    const threeYearDiff = monthlyDiff * 36;
 
    const newMonthlySavings = Number(scenario.income || 0) - scenarioTotal - Number(scenario.otherExpenses || 0);
    const currentMonthlySavings = Number(current.income || 0) - currentTotal - Number(current.otherExpenses || 0);
 
    return {
      currentTotal,
      scenarioTotal,
      monthlyDiff,
      yearlyDiff,
      threeYearDiff,
      newMonthlySavings,
      currentMonthlySavings,
    };
  }
 
  // Estimates how many fewer months a goal would take if `monthlyDiff`
  // extra were saved every month, starting from a baseline saving pace
  // inferred from the goal's own required-monthly figure.
  function estimateGoalAcceleration(goal, monthlyDiff) {
    if (!goal || monthlyDiff <= 0) return null;
    const proj = PulseCalc.calculateGoalProjection(goal);
    if (proj.remaining <= 0) return null;
 
    const assumedBaseline = Math.max(proj.requiredMonthly * 0.6, 1);
    const newRate = assumedBaseline + monthlyDiff;
    const originalMonthsNeeded = proj.remaining / assumedBaseline;
    const newMonthsNeeded = proj.remaining / newRate;
    const monthsSaved = Math.max(0, originalMonthsNeeded - newMonthsNeeded);
 
    return {
      monthsSaved: Math.round(monthsSaved),
      newMonthsNeeded: Math.round(newMonthsNeeded),
    };
  }
 
  return { simulateScenario, estimateGoalAcceleration };
})();
 
/*
  ------------------------------------------------------------------
  Page controller for simulator.html
  ------------------------------------------------------------------
  Reads "current lifestyle" defaults from the user's own transaction
  history where possible (average monthly Makanan/Hiburan/Belanja
  spend, average income), lets the user tweak a "scenario" version of
  the same numbers, and shows the animated projected difference plus
  goal acceleration for whichever goal the user selects.
*/
(function () {
  const FIELD_IDS = ["coffee", "eatingOut", "entertainment", "shopping", "income", "otherExpenses"];
  let lastResult = null;
 
  function init() {
    if (!document.getElementById("simulator-page")) return;
    if (PulseUtils.redirectIfNeedsOnboarding()) return;
    prefillFromHistory();
    populateGoalSelect();
    bindForm();
    runSimulation();
  }
 
  // Estimate sensible starting numbers from the user's real transactions
  // so the simulator opens already reflecting their actual lifestyle,
  // instead of blank/zero inputs.
  function prefillFromHistory() {
    const transactions = PulseStorage.getTransactions();
    const expenses = transactions.filter((t) => t.type === "expense");
    const income = transactions.filter((t) => t.type === "income");
 
    // Roughly one month of history: use the most recent 30 days if there
    // is enough data, otherwise fall back to averaging everything.
    const { recent } = PulseCalc.splitByRecency(expenses, 30);
    const base = recent.length > 0 ? recent : expenses;
 
    const sumFor = (matcher) => base.filter(matcher).reduce((s, t) => s + Number(t.amount), 0);
 
    const coffee = sumFor((t) => /kopi|coffee/i.test(t.description || ""));
    const eatingOut = sumFor((t) => t.category === "Makanan") - coffee;
    const entertainment = sumFor((t) => t.category === "Hiburan");
    const shopping = sumFor((t) => t.category === "Belanja");
    const otherExpenses = base.reduce((s, t) => s + Number(t.amount), 0) - coffee - Math.max(0, eatingOut) - entertainment - shopping;
    const avgIncome = income.length > 0 ? income.reduce((s, t) => s + Number(t.amount), 0) / Math.max(1, new Set(income.map((t) => t.date.slice(0, 7))).size) : 0;
 
    setValue("current-coffee", Math.max(0, Math.round(coffee)) || 300000);
    setValue("current-eatingOut", Math.max(0, Math.round(eatingOut)) || 400000);
    setValue("current-entertainment", Math.max(0, Math.round(entertainment)) || 200000);
    setValue("current-shopping", Math.max(0, Math.round(shopping)) || 250000);
    setValue("current-income", Math.round(avgIncome) || 5000000);
    setValue("current-otherExpenses", Math.max(0, Math.round(otherExpenses)) || 1500000);
 
    // Scenario starts identical to current; the user adjusts from here.
    FIELD_IDS.forEach((id) => {
      const currentInput = document.getElementById("current-" + id);
      const scenarioInput = document.getElementById("scenario-" + id);
      if (currentInput && scenarioInput) scenarioInput.value = currentInput.value;
    });
  }
 
  function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }
 
  function populateGoalSelect() {
    const select = document.getElementById("sim-goal");
    if (!select) return;
    const goals = PulseStorage.getGoals();
    if (goals.length === 0) {
      select.innerHTML = '<option value="">Belum ada target tabungan</option>';
      select.disabled = true;
      return;
    }
    select.disabled = false;
    select.innerHTML = goals
      .map((g) => `<option value="${g.id}">${PulseUtils.escapeHtml(g.name)}</option>`)
      .join("");
  }
 
  function bindForm() {
    const form = document.getElementById("simulator-form");
    if (!form) return;
    form.addEventListener("input", () => runSimulation());
 
    const resetBtn = document.getElementById("sim-reset");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        FIELD_IDS.forEach((id) => {
          const currentInput = document.getElementById("current-" + id);
          const scenarioInput = document.getElementById("scenario-" + id);
          if (currentInput && scenarioInput) scenarioInput.value = currentInput.value;
        });
        PulseUtils.toast("Skenario dikembalikan ke kondisi saat ini.", "default");
        runSimulation();
      });
    }
  }
 
  function readFields(prefix) {
    const values = {};
    FIELD_IDS.forEach((id) => {
      const el = document.getElementById(prefix + "-" + id);
      values[id] = el ? Number(el.value) || 0 : 0;
    });
    return values;
  }
 
  function runSimulation() {
    const current = readFields("current");
    const scenario = readFields("scenario");
    const result = PulseSimulator.simulateScenario(current, scenario);
 
    animateResult("sim-monthly-diff", result.monthlyDiff);
    animateResult("sim-yearly-diff", result.yearlyDiff);
    animateResult("sim-three-year-diff", result.threeYearDiff);
    animateResult("sim-new-savings", result.newMonthlySavings);
 
    const sentenceEl = document.getElementById("sim-sentence");
    if (sentenceEl) {
      if (result.monthlyDiff > 0) {
        sentenceEl.textContent = `${PulseUtils.formatCurrency(result.monthlyDiff)} lebih banyak dapat ditabung setiap bulan dengan skenario ini.`;
        sentenceEl.className = "sim-sentence sim-sentence-positive";
      } else if (result.monthlyDiff < 0) {
        sentenceEl.textContent = `Skenario ini justru menambah pengeluaran sekitar ${PulseUtils.formatCurrency(Math.abs(result.monthlyDiff))} per bulan.`;
        sentenceEl.className = "sim-sentence sim-sentence-negative";
      } else {
        sentenceEl.textContent = "Skenario ini sama persis dengan kondisi saat ini. Coba ubah salah satu nominal di atas.";
        sentenceEl.className = "sim-sentence";
      }
    }
 
    // Goal acceleration
    const goalSelect = document.getElementById("sim-goal");
    const goalResultEl = document.getElementById("sim-goal-result");
    if (goalSelect && goalResultEl) {
      const goal = PulseStorage.getGoals().find((g) => g.id === goalSelect.value);
      const acceleration = PulseSimulator.estimateGoalAcceleration(goal, result.monthlyDiff);
      if (goal && acceleration && acceleration.monthsSaved > 0) {
        goalResultEl.hidden = false;
        goalResultEl.textContent = `Target "${goal.name}" bisa tercapai sekitar ${acceleration.monthsSaved} bulan lebih cepat jika selisih ini ditabung.`;
      } else if (goal) {
        goalResultEl.hidden = false;
        goalResultEl.textContent = `Ubah skenario di atas untuk melihat dampaknya pada target "${goal.name}".`;
      } else {
        goalResultEl.hidden = true;
        goalResultEl.textContent = "";
      }
    }
 
    lastResult = result;
  }
 
  function animateResult(elId, value) {
    const el = document.getElementById(elId);
    if (!el) return;
    const from = Number(el.dataset.lastValue) || 0;
    PulseUtils.animateNumber(el, from, value, {
      duration: 700,
      format: (v) => PulseUtils.formatCurrency(v),
    });
    el.dataset.lastValue = value;
  }
 
  document.addEventListener("DOMContentLoaded", init);
})();