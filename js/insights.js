/*
 insights.js
 -----------
 Two rule-based, scoring-driven engines. There is no external AI API
 call anywhere here, and neither module ever touches the DOM or builds
 HTML — every function returns plain data. If a rule's condition isn't
 met by the real data, that insight or intervention simply isn't
 included (no fake/placeholder content is ever produced).

 PulseInsights       -> "AI Insight": what happened, described in words.
 PulseInterventions  -> "Habit Intervention": small, specific next steps.
*/

const PulseInsights = (function () {
  function formatPercent(n) {
    const sign = n > 0 ? "+" : "";
    return sign + Math.round(n) + "%";
  }

  function generateInsights(transactions, goals) {
    const insights = [];
    if (!transactions || transactions.length === 0) return insights;

    const patterns = PulseCalc.analyzeSpendingPatterns(transactions);
    const expenses = transactions.filter((t) => t.type === "expense");

    // 1. Trend: recent 14 days vs previous 14 days, overall
    if (patterns.previousTotal > 0 && Math.abs(patterns.trendPercent) >= 10) {
      const rising = patterns.trendPercent > 0;
      insights.push({
        id: "overall-trend",
        tone: rising ? "warning" : "positive",
        title: rising ? "Pengeluaran sedang naik" : "Pengeluaran sedang turun",
        text: rising
          ? `Total pengeluaranmu naik ${formatPercent(patterns.trendPercent)} dibanding 14 hari sebelumnya. Ada baiknya ditinjau sebelum menjadi kebiasaan tetap.`
          : `Total pengeluaranmu turun ${formatPercent(patterns.trendPercent)} dibanding 14 hari sebelumnya. Perubahan kecil ini cukup terasa.`,
      });
    }

    // 2. Category-level spikes: compare each category recent vs previous
    const catRecent = {};
    const catPrevious = {};
    const { recent, previous } = PulseCalc.splitByRecency(expenses, 14);
    recent.forEach((t) => (catRecent[t.category] = (catRecent[t.category] || 0) + Number(t.amount)));
    previous.forEach((t) => (catPrevious[t.category] = (catPrevious[t.category] || 0) + Number(t.amount)));

    Object.keys(catRecent).forEach((cat) => {
      const now = catRecent[cat];
      const before = catPrevious[cat] || 0;
      if (before > 0) {
        const change = ((now - before) / before) * 100;
        if (change >= 20) {
          insights.push({
            id: "spike-" + cat,
            tone: "warning",
            title: `Pengeluaran ${cat} meningkat`,
            text: `Pengeluaran ${cat.toLowerCase()}mu meningkat ${formatPercent(change)} dibanding minggu-minggu sebelumnya. Jika pola ini berlanjut, dampaknya bisa terasa pada targetmu bulan ini.`,
          });
        } else if (change <= -20) {
          insights.push({
            id: "drop-" + cat,
            tone: "positive",
            title: `Pengeluaran ${cat} menurun`,
            text: `Pengeluaran ${cat.toLowerCase()}mu turun ${formatPercent(change)} dibanding minggu-minggu sebelumnya. Perubahan kecil ini berdampak baik.`,
          });
        }
      } else if (now > 0 && before === 0) {
        insights.push({
          id: "new-" + cat,
          tone: "neutral",
          title: `Kategori baru: ${cat}`,
          text: `Kamu mulai memiliki pengeluaran di kategori ${cat.toLowerCase()} dalam dua minggu terakhir yang sebelumnya jarang muncul.`,
        });
      }
    });

    // 3. Repeated small purchases (e.g. coffee-like habits)
    const smallRepeats = {};
    expenses.forEach((t) => {
      const key = t.category + "|" + (t.description || "").toLowerCase().trim();
      if (!smallRepeats[key]) smallRepeats[key] = { count: 0, total: 0, category: t.category, label: t.description };
      smallRepeats[key].count += 1;
      smallRepeats[key].total += Number(t.amount);
    });
    Object.values(smallRepeats)
      .filter((r) => r.count >= 4)
      .sort((a, b) => b.count - a.count)
      .slice(0, 2)
      .forEach((r, i) => {
        insights.push({
          id: "repeat-" + i,
          tone: "neutral",
          title: `Kebiasaan "${r.label || r.category}" berulang`,
          text: `Kamu tercatat melakukan transaksi "${(r.label || r.category)}" sebanyak ${r.count} kali baru-baru ini, dengan total sekitar ${PulseUtils.formatCurrency(r.total)}. Ini pola yang cukup konsisten.`,
        });
      });

    // 4. Weekend vs weekday
    if (patterns.weekendAvg > 0 && patterns.weekdayAvg > 0) {
      const diff = ((patterns.weekendAvg - patterns.weekdayAvg) / patterns.weekdayAvg) * 100;
      if (diff >= 30) {
        insights.push({
          id: "weekend",
          tone: "warning",
          title: "Akhir pekan lebih boros",
          text: `Rata-rata pengeluaranmu di akhir pekan ${formatPercent(diff)} lebih tinggi dibanding hari kerja. Akhir pekan tampaknya jadi waktu paling aktif dalam pengeluaranmu.`,
        });
      }
    }

    // 5. High-frequency small transactions
    if (patterns.frequency >= 1.5) {
      insights.push({
        id: "frequency",
        tone: "neutral",
        title: "Frekuensi transaksi cukup tinggi",
        text: `Kamu rata-rata melakukan sekitar ${patterns.frequency.toFixed(1)} transaksi pengeluaran per hari aktif. Transaksi kecil yang sering bisa menambah pengeluaran tanpa terasa.`,
      });
    }

    // 6. Large single purchases
    const avg = patterns.avgTx;
    const largeTx = expenses.filter((t) => avg > 0 && Number(t.amount) >= avg * 3).sort((a, b) => Number(b.amount) - Number(a.amount))[0];
    if (largeTx) {
      insights.push({
        id: "large-purchase",
        tone: "neutral",
        title: "Ada pembelian besar baru-baru ini",
        text: `Transaksi "${largeTx.description || largeTx.category}" senilai ${PulseUtils.formatCurrency(Number(largeTx.amount))} jauh di atas rata-rata transaksimu (${PulseUtils.formatCurrency(avg)}). Wajar sesekali, tapi baik untuk dipantau bila sering terjadi.`,
      });
    }

    // 7. Saving rate trend
    if (patterns.savingRate < 0) {
      insights.push({
        id: "saving-negative",
        tone: "warning",
        title: "Tabunganmu melambat",
        text: `Pengeluaranmu saat ini melebihi pemasukan sekitar ${PulseUtils.formatCurrency(Math.abs(patterns.incomeTotal - patterns.expenseTotal))}. Ini saat yang baik untuk meninjau kembali kategori terbesar.`,
      });
    } else if (patterns.savingRate >= 0.2) {
      insights.push({
        id: "saving-positive",
        tone: "positive",
        title: "Tingkat tabunganmu membaik",
        text: `Kamu berhasil menyisihkan sekitar ${Math.round(patterns.savingRate * 100)}% dari total pemasukanmu periode ini. Pertahankan ritme ini.`,
      });
    }

    // 8. Spending concentration (top category share)
    if (patterns.breakdown.length > 0 && patterns.expenseTotal > 0) {
      const topShare = (patterns.breakdown[0].amount / patterns.expenseTotal) * 100;
      if (topShare >= 40) {
        insights.push({
          id: "concentration",
          tone: "neutral",
          title: "Pengeluaran terpusat pada satu kategori",
          text: `Kategori ${patterns.breakdown[0].category.toLowerCase()} menyumbang sekitar ${Math.round(topShare)}% dari total pengeluaranmu. Mengurangi sedikit di sini akan terasa dampaknya paling besar.`,
        });
      }
    }

    // 9. Recurring / subscription-like burden
    if (patterns.recurringCount >= 3) {
      insights.push({
        id: "recurring",
        tone: "neutral",
        title: "Beberapa pengeluaran bersifat rutin",
        text: `Ada sekitar ${patterns.recurringCount} pola pengeluaran yang berulang dengan nominal serupa, seperti langganan atau kebiasaan tetap. Ini membentuk beban dasar bulananmu.`,
      });
    }

    // 10. Goal progress relevance
    if (goals && goals.length > 0) {
      goals.forEach((g) => {
        const proj = PulseCalc.calculateGoalProjection(g);
        if (proj.percent >= 80 && proj.percent < 100) {
          insights.push({
            id: "goal-near-" + g.id,
            tone: "positive",
            title: `Target "${g.name}" hampir tercapai`,
            text: `Kamu sudah mencapai ${Math.round(proj.percent)}% dari target "${g.name}". Tinggal sedikit lagi untuk mencapainya sepenuhnya.`,
          });
        }
      });
    }

    // Sort so warnings surface first, then neutral, then positive — this
    // keeps the most actionable items at the top of the list.
    const order = { warning: 0, neutral: 1, positive: 2 };
    insights.sort((a, b) => order[a.tone] - order[b.tone]);

    return insights;
  }

  return { generateInsights };
})();

/*
 PulseInterventions
 -------------------
 Reads the same behavioural signals as PulseInsights but turns them into
 small, concrete, non-judgmental next actions instead of observations.
 Each intervention can be turned into a tracked habit commitment via
 PulseStorage.addHabit.
*/
const PulseInterventions = (function () {
  function generateInterventions(transactions, goals) {
    const interventions = [];
    if (!transactions || transactions.length === 0) return interventions;

    const patterns = PulseCalc.analyzeSpendingPatterns(transactions);
    const expenses = transactions.filter((t) => t.type === "expense");

    // Food spending rising
    const { recent, previous } = PulseCalc.splitByRecency(expenses, 14);
    const foodRecent = recent.filter((t) => t.category === "Makanan").reduce((s, t) => s + Number(t.amount), 0);
    const foodPrevious = previous.filter((t) => t.category === "Makanan").reduce((s, t) => s + Number(t.amount), 0);
    if (foodPrevious > 0 && foodRecent > foodPrevious * 1.15) {
      interventions.push({
        id: "food-up",
        title: "Pengeluaran makanmu sedang naik",
        action: "Daripada mengubah semuanya, coba kurangi satu pesanan minggu ini.",
        habitTitle: "Kurangi satu pesanan makan minggu ini",
        target: 1,
      });
    }

    // Savings slowing down
    if (patterns.savingRate < 0.1) {
      interventions.push({
        id: "saving-slow",
        title: "Tabunganmu melambat",
        action: "Tambahkan Rp50.000 ke target bulan ini.",
        habitTitle: "Tambahkan Rp50.000 ke target tabungan",
        target: 1,
      });
    }

    // High weekend spending
    if (patterns.weekendAvg > 0 && patterns.weekdayAvg > 0) {
      const diff = ((patterns.weekendAvg - patterns.weekdayAvg) / patterns.weekdayAvg) * 100;
      if (diff >= 30) {
        interventions.push({
          id: "weekend-cap",
          title: "Akhir pekan menjadi titik paling aktif dalam pengeluaranmu",
          action: "Coba tetapkan batas akhir pekan sebesar Rp250.000.",
          habitTitle: "Batasi pengeluaran akhir pekan ke Rp250.000",
          target: 4,
        });
      }
    }

    // High-frequency small transactions
    if (patterns.frequency >= 1.8) {
      interventions.push({
        id: "frequency-pause",
        title: "Transaksi kecilmu cukup sering muncul",
        action: "Coba jeda satu hari tanpa transaksi kecil minggu ini.",
        habitTitle: "Satu hari tanpa transaksi kecil",
        target: 1,
      });
    }

    // Recurring / subscription burden
    if (patterns.recurringCount >= 3) {
      interventions.push({
        id: "review-subscription",
        title: "Ada beberapa pengeluaran rutin yang mirip langganan",
        action: "Tinjau satu langganan yang paling jarang dipakai bulan ini.",
        habitTitle: "Tinjau satu langganan bulan ini",
        target: 1,
      });
    }

    // Concentrated spending category
    if (patterns.breakdown.length > 0 && patterns.expenseTotal > 0) {
      const top = patterns.breakdown[0];
      const topShare = (top.amount / patterns.expenseTotal) * 100;
      if (topShare >= 40) {
        interventions.push({
          id: "concentration-trim",
          title: `Kategori ${top.category.toLowerCase()} mendominasi pengeluaranmu`,
          action: `Coba kurangi pengeluaran ${top.category.toLowerCase()} sebesar 10% minggu ini.`,
          habitTitle: `Kurangi ${top.category.toLowerCase()} sebesar 10%`,
          target: 1,
        });
      }
    }

    // Goal behind schedule
    if (goals && goals.length > 0) {
      goals.forEach((g) => {
        const proj = PulseCalc.calculateGoalProjection(g);
        if (!proj.onTrack && proj.requiredMonthly > 0 && proj.percent < 50) {
          interventions.push({
            id: "goal-push-" + g.id,
            title: `Target "${g.name}" butuh sedikit dorongan`,
            action: `Sisihkan sekitar ${PulseUtils.formatCurrency(proj.requiredMonthly)} bulan ini untuk tetap di jalur.`,
            habitTitle: `Sisihkan dana untuk "${g.name}" bulan ini`,
            target: 1,
          });
        }
      });
    }

    return interventions;
  }

  return { generateInterventions };
})();
