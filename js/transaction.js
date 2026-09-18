

(function () {
  function init() {
    if (!document.getElementById("tx-page")) return;
    if (PulseUtils.redirectIfNeedsOnboarding()) return;

    const bodyEl = document.getElementById("chart-body");
    if (!bodyEl) return;

    const chart = PulseChart.create({
      bodyEl,
      toggleEl: document.getElementById("chart-mode-toggle"),
      prevBtn: document.getElementById("chart-prev"),
      nextBtn: document.getElementById("chart-next"),
      getTransactions: () => PulseStorage.getTransactions(),
    });
    chart.render();

    window.addEventListener("pulsefi:tx-changed", () => chart.render());
  }

  document.addEventListener("DOMContentLoaded", init);
})();
