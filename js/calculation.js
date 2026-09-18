

const PulseCalc = (function () {
  const MS_DAY = 1000 * 60 * 60 * 24;
  const WEEKDAY_LABELS = ["sen", "sel", "rab", "kam", "jum", "sab", "min"];

  function totals(transactions) {
    let income = 0;
    let expense = 0;
    (transactions || []).forEach((t) => {
      const amt = Number(t.amount) || 0;
      if (t.type === "income") income += amt;
      else expense += amt;
    });
    return { income, expense, balance: income - expense };
  }

  function daysBetween(a, b) {
    return Math.round((b.getTime() - a.getTime()) / MS_DAY);
  }
  function splitByRecency(transactions, windowDays) {
    const now = new Date();
    const recent = [];
    const previous = [];
    (transactions || []).forEach((t) => {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return;
      const diff = daysBetween(d, now);
      if (diff >= 0 && diff < windowDays) recent.push(t);
      else if (diff >= windowDays && diff < windowDays * 2) previous.push(t);
    });
    return { recent, previous };
  }

  function categoryBreakdown(expenses) {
    const map = {};
    expenses.forEach((t) => {
      map[t.category] = (map[t.category] || 0) + (Number(t.amount) || 0);
    });
    return Object.keys(map)
      .map((category) => ({ category, amount: map[category] }))
      .sort((a, b) => b.amount - a.amount);
  }
  function countRecurringPatterns(expenses) {
    const groups = {};
    expenses.forEach((t) => {
      const amt = Number(t.amount) || 0;
      const bucket = Math.round(amt / 5000) * 5000;
      const key = t.category + "|" + bucket;
      groups[key] = (groups[key] || 0) + 1;
    });
    return Object.values(groups).filter((count) => count >= 2).length;
  }

  function analyzeSpendingPatterns(transactions) {
    const list = transactions || [];
    const expenses = list.filter((t) => t.type === "expense");
    const t = totals(list);
    const { recent, previous } = splitByRecency(expenses, 14);
    const recentTotal = recent.reduce((s, t2) => s + Number(t2.amount), 0);
    const previousTotal = previous.reduce((s, t2) => s + Number(t2.amount), 0);
    const trendPercent = previousTotal > 0 ? ((recentTotal - previousTotal) / previousTotal) * 100 : 0;
    let weekendSum = 0, weekendCount = 0, weekdaySum = 0, weekdayCount = 0;
    expenses.forEach((tx) => {
      const d = new Date(tx.date);
      if (isNaN(d.getTime())) return;
      const day = d.getDay();
      if (day === 0 || day === 6) {
        weekendSum += Number(tx.amount);
        weekendCount += 1;
      } else {
        weekdaySum += Number(tx.amount);
        weekdayCount += 1;
      }
    });
    const weekendAvg = weekendCount > 0 ? weekendSum / weekendCount : 0;
    const weekdayAvg = weekdayCount > 0 ? weekdaySum / weekdayCount : 0;
    const activeDays = new Set(expenses.map((tx) => tx.date)).size;
    const frequency = activeDays > 0 ? expenses.length / activeDays : 0;

    const avgTx = expenses.length > 0 ? t.expense / expenses.length : 0;
    const savingRate = t.income > 0 ? (t.income - t.expense) / t.income : (t.expense > 0 ? -1 : 0);
    const breakdown = categoryBreakdown(expenses);
    const recurringCount = countRecurringPatterns(expenses);

    return {
      incomeTotal: t.income,
      expenseTotal: t.expense,
      balance: t.balance,
      recentTotal,
      previousTotal,
      trendPercent,
      weekendAvg,
      weekdayAvg,
      frequency,
      avgTx,
      savingRate,
      breakdown,
      recurringCount,
      activeDays,
      txCount: expenses.length,
    };
  }
  function averageTransactionForWindow(transactions, windowDays) {
    const list = (transactions || []).filter((t) => {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return false;
      const diff = daysBetween(d, new Date());
      return diff >= 0 && diff < windowDays;
    });
    if (list.length === 0) return 0;
    const net = list.reduce((s, t) => s + (t.type === "income" ? Number(t.amount) : -Number(t.amount)), 0);
    return net / list.length;
  }

  function calculateGoalProjection(goal) {
    const target = Number(goal.targetAmount) || 0;
    const current = Number(goal.currentAmount) || 0;
    const remaining = Math.max(0, target - current);
    const percent = target > 0 ? Math.min(100, (current / target) * 100) : 0;

    let months = 12;
    if (goal.targetDate) {
      const now = new Date();
      const target_d = new Date(goal.targetDate);
      if (!isNaN(target_d.getTime())) {
        const diffMonths = (target_d.getFullYear() - now.getFullYear()) * 12 + (target_d.getMonth() - now.getMonth());
        months = Math.max(1, diffMonths);
      }
    }
    const requiredMonthly = months > 0 ? remaining / months : remaining;
    const onTrack = remaining === 0;

    return { target, current, remaining, percent, months, requiredMonthly, onTrack };
  }
  function calculateFinancialScore(transactions, goals) {
    const list = transactions || [];
    if (list.length === 0) {
      return { score: 0, label: "Belum ada data", components: [] };
    }
    const patterns = analyzeSpendingPatterns(list);
    const savingScore = Math.max(0, Math.min(100, (patterns.savingRate / 0.2) * 100));
    const ratio = patterns.incomeTotal > 0 ? patterns.expenseTotal / patterns.incomeTotal : 1.2;
    const ratioScore = Math.max(0, Math.min(100, (1 - ratio) * 100 + 50));
    const swing = Math.min(100, Math.abs(patterns.trendPercent));
    const consistencyScore = Math.max(0, 100 - swing);
    let volatilityScore = 70;
    if (patterns.breakdown.length > 0 && patterns.expenseTotal > 0) {
      const topShare = patterns.breakdown[0].amount / patterns.expenseTotal;
      volatilityScore = Math.max(0, Math.min(100, (1 - topShare) * 100));
    }
    const recurringScore = Math.max(0, 100 - patterns.recurringCount * 12);
    let goalScore = 60;
    if (goals && goals.length > 0) {
      const percents = goals.map((g) => calculateGoalProjection(g).percent);
      goalScore = percents.reduce((s, p) => s + p, 0) / percents.length;
    }

    const components = [
      { key: "saving", label: "Tingkat tabungan", score: savingScore, weight: 0.25 },
      { key: "ratio", label: "Rasio pengeluaran terhadap pemasukan", score: ratioScore, weight: 0.2 },
      { key: "consistency", label: "Konsistensi pengeluaran", score: consistencyScore, weight: 0.2 },
      { key: "volatility", label: "Sebaran kategori pengeluaran", score: volatilityScore, weight: 0.15 },
      { key: "recurring", label: "Beban pengeluaran rutin", score: recurringScore, weight: 0.1 },
      { key: "goals", label: "Kemajuan target tabungan", score: goalScore, weight: 0.1 },
    ];

    const weighted = components.reduce((s, c) => s + c.score * c.weight, 0);
    const score = Math.round(Math.max(0, Math.min(100, weighted)));

    let label = "Perlu perhatian";
    if (score >= 80) label = "Sangat stabil";
    else if (score >= 60) label = "Cukup stabil";
    else if (score >= 40) label = "Mulai goyah";

    return { score, label, components };
  }
  function classifyFinancialTwin(transactions) {
    const list = transactions || [];
    if (list.length === 0) {
      return {
        key: "unknown",
        title: "Belum Terlihat Polanya",
        description: "Tambahkan beberapa transaksi supaya PulseFi bisa mulai mengenali kebiasaan finansialmu.",
      };
    }
    const patterns = analyzeSpendingPatterns(list);
    const weekendGap = patterns.weekdayAvg > 0 ? (patterns.weekendAvg - patterns.weekdayAvg) / patterns.weekdayAvg : 0;
    const topShare = patterns.breakdown.length > 0 && patterns.expenseTotal > 0
      ? patterns.breakdown[0].amount / patterns.expenseTotal
      : 0;
    if (patterns.savingRate >= 0.25 && patterns.frequency < 1.2) {
      return {
        key: "cautious-saver",
        title: "THE CAUTIOUS SAVER",
        description: `Kamu menyisihkan sekitar ${Math.round(patterns.savingRate * 100)}% dari pemasukanmu dan jarang melakukan transaksi impulsif. Pola pengeluaranmu tenang dan terkendali.`,
      };
    }
    if (weekendGap >= 0.4) {
      return {
        key: "weekend-spender",
        title: "THE WEEKEND SPENDER",
        description: `Rata-rata transaksimu di akhir pekan ${Math.round(weekendGap * 100)}% lebih besar dibanding hari kerja. Akhir pekan adalah titik paling aktif dalam ritme finansialmu.`,
      };
    }
    if (patterns.frequency >= 1.8 || (patterns.txCount > 0 && topShare < 0.3 && patterns.savingRate < 0.1)) {
      return {
        key: "impulse-explorer",
        title: "THE IMPULSE EXPLORER",
        description: `Kamu melakukan sekitar ${patterns.frequency.toFixed(1)} transaksi per hari aktif, tersebar di banyak kategori kecil. Uangmu bergerak cepat dan sering, jadi mudah tidak terasa habisnya.`,
      };
    }
    return {
      key: "balanced-builder",
      title: "THE BALANCED BUILDER",
      description: `Pengeluaranmu tersebar cukup merata dan tingkat tabunganmu berada di kisaran ${Math.round(patterns.savingRate * 100)}%. Pola ini menunjukkan kebiasaan finansial yang seimbang.`,
    };
  }

  function startOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + diff);
    return d;
  }

  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function weeklySeries(transactions, weekOffset) {
    const today = new Date();
    const anchor = startOfWeek(today);
    anchor.setDate(anchor.getDate() + (weekOffset || 0) * 7);

    const buckets = WEEKDAY_LABELS.map((label, i) => {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() + i);
      return { label, date: d, value: 0, amount: 0, isToday: sameDay(d, today) };
    });

    (transactions || []).forEach((t) => {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return;
      const bucket = buckets.find((b) => sameDay(b.date, d));
      if (!bucket) return;
      bucket.value += 1;
      bucket.amount += t.type === "expense" ? Number(t.amount) || 0 : 0;
    });

    return {
      buckets,
      rangeLabel: formatWeekRange(buckets[0].date, buckets[6].date),
      isCurrent: weekOffset === 0,
    };
  }

  function formatWeekRange(start, end) {
    const opts = { day: "numeric", month: "short" };
    return start.toLocaleDateString("id-ID", opts) + " – " + end.toLocaleDateString("id-ID", opts);
  }
  function monthlySeries(transactions, monthOffset) {
    const today = new Date();
    const anchor = new Date(today.getFullYear(), today.getMonth() + (monthOffset || 0), 1);
    const monthIndex = anchor.getMonth();
    const year = anchor.getFullYear();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const weekCount = Math.ceil(daysInMonth / 7);
    const buckets = Array.from({ length: weekCount }, (_, i) => {
      const startDay = i * 7 + 1;
      const endDay = Math.min(daysInMonth, startDay + 6);
      return {
        label: "M" + (i + 1),
        startDay,
        endDay,
        value: 0,
        amount: 0,
        isCurrent: false,
      };
    });

    (transactions || []).forEach((t) => {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return;
      if (d.getMonth() !== monthIndex || d.getFullYear() !== year) return;
      const bucketIndex = Math.min(weekCount - 1, Math.floor((d.getDate() - 1) / 7));
      buckets[bucketIndex].value += 1;
      buckets[bucketIndex].amount += t.type === "expense" ? Number(t.amount) || 0 : 0;
    });

    if (monthOffset === 0 || !monthOffset) {
      const currentWeekIndex = Math.min(weekCount - 1, Math.floor((today.getDate() - 1) / 7));
      buckets[currentWeekIndex].isCurrent = true;
    }

    const monthLabel = anchor.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

     return { buckets, rangeLabel: monthLabel, isCurrent: !monthOffset };
  }

    const MONTH_LABELS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  function monthlyOverviewSeries(transactions, yearOffset) {
    const today = new Date();
    const year = today.getFullYear() + (yearOffset || 0);

    const buckets = MONTH_LABELS_SHORT.map((label, i) => ({
      label,
      monthIndex: i,
      year,
      value: 0,
      amount: 0,
      isCurrent: !yearOffset && i === today.getMonth(),
    }));

    (transactions || []).forEach((t) => {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return;
      if (d.getFullYear() !== year) return;
      const bucket = buckets[d.getMonth()];
      bucket.value += 1;
      bucket.amount += t.type === "expense" ? Number(t.amount) || 0 : 0;
    });

    return { buckets, rangeLabel: String(year), isCurrent: !yearOffset };
  }

  return {
    totals,
    splitByRecency,
    categoryBreakdown,
    analyzeSpendingPatterns,
    averageTransactionForWindow,
    calculateGoalProjection,
    calculateFinancialScore,
    classifyFinancialTwin,
    weeklySeries,
    monthlySeries,
    monthlyOverviewSeries,
  };
})();

// up to 300 line
