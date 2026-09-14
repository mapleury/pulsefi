/*
 transactions.js
 ---------------
 Page bootstrapper for transactions.html. tx-form.js, tx-list.js and
 tx-insight.js each wire themselves up on DOMContentLoaded — this file
 only owns the one thing none of them should own: the Grafik Transaksi
 widget, since it doesn't belong to the form, the list, or the tip
 card individually.
*/

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
