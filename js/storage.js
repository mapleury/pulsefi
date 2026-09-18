

const PulseStorage = (function () {
  const KEYS = {
    transactions: "pulsefi_transactions",
    goals: "pulsefi_goals",
    profile: "pulsefi_profile",
    habits: "pulsefi_habits",
    onboarding: "pulsefi_onboarding",
    checkinPrompt: "pulsefi_last_checkin_prompt",
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.error("PulseStorage read error for " + key, e);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error("PulseStorage write error for " + key, e);
      return false;
    }
  }

  function uid(prefix) {
    return (prefix || "id") + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function getOnboardingState() {
    return read(KEYS.onboarding, null);
  }

  function setOnboardingState(state) {
    return write(KEYS.onboarding, state);
  }

  function resetAllData() {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  }

  function getProfile() {
    return read(KEYS.profile, null);
  }

  function saveProfile(profile) {
    return write(KEYS.profile, profile);
  }

  function getTransactions() {
    return read(KEYS.transactions, []);
  }

  function saveTransactions(list) {
    return write(KEYS.transactions, list);
  }

  function addTransaction(tx) {
    const list = getTransactions();
    const record = {
      id: uid("tx"),
      type: tx.type === "income" ? "income" : "expense",
      category: tx.category,
      amount: Number(tx.amount) || 0,
      date: tx.date,
      description: tx.description || "",
      isDemo: !!tx.isDemo,
      createdAt: new Date().toISOString(),
    };
    list.push(record);
    saveTransactions(list);
    return record;
  }

  function updateTransaction(id, patch) {
    const list = getTransactions();
    const idx = list.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    list[idx] = Object.assign({}, list[idx], patch, {
      amount: patch.amount !== undefined ? Number(patch.amount) || 0 : list[idx].amount,
    });
    saveTransactions(list);
    return list[idx];
  }

  function deleteTransaction(id) {
    const list = getTransactions().filter((t) => t.id !== id);
    saveTransactions(list);
  }

  function addTransactionsBulk(txs) {
    const list = getTransactions();
    const records = txs.map((tx) =>
      Object.assign(
        {
          id: uid("tx"),
          createdAt: new Date().toISOString(),
          description: "",
          isDemo: false,
        },
        tx,
        { amount: Number(tx.amount) || 0 }
      )
    );
    saveTransactions(list.concat(records));
    return records;
  }

  function clearDemoTransactions() {
    const list = getTransactions().filter((t) => !t.isDemo);
    saveTransactions(list);
  }

  function getGoals() {
    return read(KEYS.goals, []);
  }

  function saveGoals(list) {
    return write(KEYS.goals, list);
  }

  function addGoal(goal) {
    const list = getGoals();
    const record = {
      id: uid("goal"),
      name: goal.name,
      targetAmount: Number(goal.targetAmount) || 0,
      currentAmount: Number(goal.currentAmount) || 0,
      targetDate: goal.targetDate || null,
      createdAt: new Date().toISOString(),
    };
    list.push(record);
    saveGoals(list);
    return record;
  }

  function updateGoal(id, patch) {
    const list = getGoals();
    const idx = list.findIndex((g) => g.id === id);
    if (idx === -1) return null;
    list[idx] = Object.assign({}, list[idx], patch);
    saveGoals(list);
    return list[idx];
  }

  function deleteGoal(id) {
    const list = getGoals().filter((g) => g.id !== id);
    saveGoals(list);
  }

  function addToGoal(id, amount) {
    const list = getGoals();
    const idx = list.findIndex((g) => g.id === id);
    if (idx === -1) return null;
    const target = Math.max(0, Number(list[idx].targetAmount) || 0);
    list[idx].currentAmount = Math.min(
      target,
      Math.max(0, Number(list[idx].currentAmount || 0) + Number(amount || 0))
    );
    saveGoals(list);
    return list[idx];
  }

  function getHabits() {
    return read(KEYS.habits, []);
  }

  function saveHabits(list) {
    return write(KEYS.habits, list);
  }

  function getActiveHabits() {
    return getHabits().filter((h) => h.status === "active");
  }

  function addHabit(habit) {
    const list = getHabits();
    const record = {
      id: uid("habit"),
      title: habit.title,
      detail: habit.detail || "",
      target: Number(habit.target) || 1,
      progress: 0,
      streak: 0,
      completedDates: [],
      createdAt: new Date().toISOString(),
      status: "active",
    };
    list.push(record);
    saveHabits(list);
    return record;
  }

  function checkInHabit(id) {
    const list = getHabits();
    const idx = list.findIndex((h) => h.id === id);
    if (idx === -1) return null;
    const habit = list[idx];
    const today = PulseUtils.todayISO();
    if (habit.completedDates.includes(today)) return habit;
    habit.completedDates.push(today);
    habit.progress = Math.min(habit.target, habit.progress + 1);
    habit.streak += 1;
    if (habit.progress >= habit.target) habit.status = "completed";
    saveHabits(list);
    return habit;
  }

  function deleteHabit(id) {
    const list = getHabits().filter((h) => h.id !== id);
    saveHabits(list);
  }

  function getLastCheckinPromptDate() {
    return read(KEYS.checkinPrompt, null);
  }

  function setLastCheckinPromptDate(dateStr) {
    return write(KEYS.checkinPrompt, dateStr);
  }

  function hasBeenPromptedToday() {
    return getLastCheckinPromptDate() === PulseUtils.todayISO();
  }

  return {
    KEYS,
    uid,
    getOnboardingState,
    setOnboardingState,
    resetAllData,
    getProfile,
    saveProfile,
    getTransactions,
    saveTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addTransactionsBulk,
    clearDemoTransactions,
    getGoals,
    saveGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    addToGoal,
    getHabits,
    saveHabits,
    getActiveHabits,
    addHabit,
    checkInHabit,
    deleteHabit,
    getLastCheckinPromptDate,
    setLastCheckinPromptDate,
    hasBeenPromptedToday,
  };
})();