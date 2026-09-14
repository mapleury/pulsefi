/*
 tx-insight.js
 -------------
 Controller for the small "Selalu Ingat!" tip card. Reads the user's
 real category breakdown via PulseCalc and surfaces whichever category
 is eating the biggest share of their income (or expense total, if
 there's no income on record yet) as one concrete, actionable line.
*/

const PulseTxInsight = (function () {
  function computeTip(transactions) {
    const patterns = PulseCalc.analyzeSpendingPatterns(transactions);
    if (!patterns.breakdown.length) return null;
    const top = patterns.breakdown[0];
    const base = patterns.incomeTotal > 0 ? patterns.incomeTotal : patterns.expenseTotal;
    const percent = base > 0 ? Math.round((top.amount / base) * 100) : 0;
    return { category: top.category, percent };
  }

  function render() {
    const headlineEl = document.getElementById("tx-tip-headline");
    const bodyEl = document.getElementById("tx-tip-body");
    if (!headlineEl) return;

    const transactions = PulseStorage.getTransactions();
    const tip = computeTip(transactions);

    if (!tip) {
      headlineEl.textContent = "Belum ada yang bisa dianalisis";
      if (bodyEl) bodyEl.textContent = "Catat beberapa transaksi dulu supaya PulseFi bisa memberi saran nyata.";
      return;
    }

    headlineEl.textContent = `Kurangi transaksi di kategori ${tip.category}`;
    if (bodyEl) {
      bodyEl.textContent = tip.percent > 0
        ? `untuk menghemat ${tip.percent}% dari pemasukan kamu.`
        : `kategori ini paling banyak menyumbang pengeluaranmu saat ini.`;
    }
  }

  function init() {
    if (!document.getElementById("tx-tip-headline")) return;
    render();
    window.addEventListener("pulsefi:tx-changed", render);
  }

  document.addEventListener("DOMContentLoaded", init);

  return { init, render };
})();
