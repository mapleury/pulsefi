/*
  onboarding.js
  -------------
  Page controller for index.html. This is the first-time-user flow:

    - If onboarding is already done, redirect straight to dashboard.html.
    - Otherwise show a short profile form (income, current savings, main
      goal name/target/timeframe).
    - The user finishes with either "Gunakan data contoh" (generates a
      realistic Indonesian demo dataset, clearly tagged isDemo:true) or
      "Mulai dari kosong" (saves only the profile + goal, no transactions).

  Demo transactions are generated here, entirely client-side, from the
  profile numbers the user just entered so the starter data is at least
  in the right ballpark for their situation.
*/
(function () {
  function init() {
    const page = document.getElementById("onboarding-page");
    if (!page) return;

    // Already onboarded -> go straight to the dashboard.
    if (!PulseUtils.requiresOnboarding()) {
      window.location.href = "dashboard.html";
      return;
    }

    bindForm();
  }

  function bindForm() {
    const form = document.getElementById("onboarding-form");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const mode = e.submitter && e.submitter.dataset.mode ? e.submitter.dataset.mode : "own";
      finishOnboarding(mode);
    });
  }

  function readProfile() {
    return {
      monthlyIncome: Number(document.getElementById("ob-income").value) || 0,
      currentSavings: Number(document.getElementById("ob-savings").value) || 0,
      goalName: document.getElementById("ob-goal-name").value.trim() || "Dana Darurat",
      goalTarget: Number(document.getElementById("ob-goal-target").value) || 0,
      goalMonths: Number(document.getElementById("ob-goal-months").value) || 12,
    };
  }

  function finishOnboarding(mode) {
    const profile = readProfile();

    if (!profile.monthlyIncome || profile.monthlyIncome <= 0) {
      PulseUtils.toast("Masukkan estimasi pemasukan bulananmu.", "warning");
      return;
    }

    PulseStorage.saveProfile(profile);

    // Always create the user's stated goal, whichever path they choose.
    if (profile.goalTarget > 0) {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + Math.max(1, profile.goalMonths));
      PulseStorage.addGoal({
        name: profile.goalName,
        targetAmount: profile.goalTarget,
        currentAmount: profile.currentSavings,
        targetDate: targetDate.toISOString().slice(0, 10),
      });
    }

    if (mode === "demo") {
      const demoTx = buildDemoTransactions(profile);
      PulseStorage.addTransactionsBulk(demoTx);
      PulseStorage.setOnboardingState("demo");
      PulseUtils.toast("Data contoh siap. Selamat datang di PulseFi.", "success");
    } else {
      PulseStorage.setOnboardingState("own");
      PulseUtils.toast("Profil tersimpan. Yuk mulai catat transaksimu.", "success");
    }

    window.location.href = "dashboard.html";
  }

  // Builds ~45 days of realistic Indonesian transactions scaled loosely
  // to the user's stated monthly income, so the dashboard/insights pages
  // have enough signal to be interesting during the first visit.
  function buildDemoTransactions(profile) {
    const income = profile.monthlyIncome;
    const tx = [];
    const today = new Date();
    let seed = Math.max(1, Math.round(income) % 2147483647);

    function sample() {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    }

    function addDaysAgo(daysAgo) {
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      return d.toISOString().slice(0, 10);
    }

    // Salary on the 1st of this month and last month.
    tx.push({ type: "income", category: "Lainnya", amount: income, date: addDaysAgo(today.getDate() - 1), description: "Gaji", isDemo: true });
    tx.push({ type: "income", category: "Lainnya", amount: income, date: addDaysAgo(today.getDate() + 29), description: "Gaji", isDemo: true });

    // Recurring subscriptions (same amount, same category, repeated).
    tx.push({ type: "expense", category: "Langganan", amount: 54990, date: addDaysAgo(40), description: "Langganan musik", isDemo: true });
    tx.push({ type: "expense", category: "Langganan", amount: 54990, date: addDaysAgo(10), description: "Langganan musik", isDemo: true });
    tx.push({ type: "expense", category: "Langganan", amount: 120000, date: addDaysAgo(38), description: "Langganan streaming", isDemo: true });
    tx.push({ type: "expense", category: "Langganan", amount: 120000, date: addDaysAgo(8), description: "Langganan streaming", isDemo: true });

    // Coffee, roughly every couple of days — a classic recurring habit.
    for (let i = 1; i <= 44; i += 3) {
      tx.push({ type: "expense", category: "Makanan", amount: 24000 + Math.round(sample() * 8000), date: addDaysAgo(i), description: "Kopi", isDemo: true });
    }

    // Daily-ish lunches on weekdays.
    for (let i = 0; i <= 44; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const day = d.getDay();
      if (day !== 0 && day !== 6 && sample() > 0.25) {
        tx.push({ type: "expense", category: "Makanan", amount: 28000 + Math.round(sample() * 15000), date: addDaysAgo(i), description: "Makan siang", isDemo: true });
      }
    }

    // Transport, mostly on weekdays.
    for (let i = 0; i <= 44; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const day = d.getDay();
      if (day !== 0 && day !== 6 && sample() > 0.3) {
        tx.push({ type: "expense", category: "Transportasi", amount: 12000 + Math.round(sample() * 10000), date: addDaysAgo(i), description: "Transportasi", isDemo: true });
      }
    }

    // Weekend entertainment/shopping spikes — deliberately larger than
    // weekday spending so the Financial Twin / insights engines have a
    // clear pattern to detect.
    for (let i = 0; i <= 44; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const day = d.getDay();
      if (day === 0 || day === 6) {
        if (sample() > 0.3) {
          tx.push({ type: "expense", category: "Hiburan", amount: 90000 + Math.round(sample() * 120000), date: addDaysAgo(i), description: "Nonton & nongkrong", isDemo: true });
        }
        if (sample() > 0.5) {
          tx.push({ type: "expense", category: "Belanja", amount: 100000 + Math.round(sample() * 200000), date: addDaysAgo(i), description: "Belanja akhir pekan", isDemo: true });
        }
      }
    }

    // A couple of bills and one larger, less frequent purchase.
    tx.push({ type: "expense", category: "Tagihan", amount: 250000, date: addDaysAgo(35), description: "Listrik & air", isDemo: true });
    tx.push({ type: "expense", category: "Tagihan", amount: 250000, date: addDaysAgo(5), description: "Listrik & air", isDemo: true });
    tx.push({ type: "expense", category: "Belanja", amount: 450000, date: addDaysAgo(20), description: "Sepatu baru", isDemo: true });
    tx.push({ type: "expense", category: "Kesehatan", amount: 150000, date: addDaysAgo(27), description: "Vitamin & obat", isDemo: true });

    return tx;
  }

  document.addEventListener("DOMContentLoaded", init);
})();