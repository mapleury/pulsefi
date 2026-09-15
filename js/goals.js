/*
  goals.js
  --------
  Page controller for goals.html ("Tabungan"). Owns three things:

    1. PulseGoalStore — a thin adapter over PulseStorage's goal methods.
       If a method isn't there (older storage.js), it falls back to
       reading/writing the same localStorage key directly, so the page
       works either way and keeps one source of truth.
    2. The card grid — every card is rendered from real stored goals and
       real PulseCalc projections. Nothing here is sample data.
    3. The detail modal — per-goal projection, top-ups, editing and
       deletion, all writing straight back through the store.
*/

const PulseGoalStore = (function () {
  const KEY = "pulsefi_goals_v1";

  function has(method) {
    return typeof PulseStorage !== "undefined" && typeof PulseStorage[method] === "function";
  }

  function readRaw() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function writeRaw(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  function all() {
    const list = has("getGoals") ? PulseStorage.getGoals() : readRaw();
    return Array.isArray(list) ? list : [];
  }

  function add(goal) {
    if (has("addGoal")) return PulseStorage.addGoal(goal);
    const record = Object.assign(
      { id: "goal-" + Date.now().toString(36), createdAt: Date.now() },
      goal
    );
    const list = readRaw();
    list.push(record);
    writeRaw(list);
    return record;
  }

  function update(id, patch) {
    if (has("updateGoal")) return PulseStorage.updateGoal(id, patch);
    const list = readRaw();
    const index = list.findIndex((g) => g.id === id);
    if (index === -1) return null;
    list[index] = Object.assign({}, list[index], patch);
    writeRaw(list);
    return list[index];
  }

  function remove(id) {
    if (has("deleteGoal")) return PulseStorage.deleteGoal(id);
    if (has("removeGoal")) return PulseStorage.removeGoal(id);
    writeRaw(readRaw().filter((g) => g.id !== id));
  }

  function find(id) {
    return all().find((g) => g.id === id) || null;
  }

  return { all, add, update, remove, find };
})();

(function () {
  const els = {};
  let openGoalId = null;

  // ---------- small helpers ----------

  function rupiah(amount) {
    if (typeof PulseUtils !== "undefined" && PulseUtils.formatCurrency) {
      return PulseUtils.formatCurrency(amount);
    }
    return "Rp" + Math.round(Number(amount) || 0).toLocaleString("id-ID");
  }

  function plainNumber(amount) {
    return Math.round(Number(amount) || 0).toLocaleString("id-ID");
  }

  function escapeHtml(str) {
    if (typeof PulseUtils !== "undefined" && PulseUtils.escapeHtml) return PulseUtils.escapeHtml(str);
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function notify(message, tone) {
    if (typeof PulseUtils !== "undefined" && PulseUtils.toast) PulseUtils.toast(message, tone);
  }

  // Cards show the deadline the way the design does: 03/03/2045.
  function formatDeadline(value) {
    if (!value) return "Tanpa tenggat";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "Tanpa tenggat";
    const pad = (n) => String(n).padStart(2, "0");
    return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear();
  }

  function projectionFor(goal) {
    if (typeof PulseCalc !== "undefined" && PulseCalc.calculateGoalProjection) {
      return PulseCalc.calculateGoalProjection(goal);
    }
    const target = Number(goal.targetAmount) || 0;
    const current = Number(goal.currentAmount) || 0;
    const remaining = Math.max(0, target - current);
    return {
      target,
      current,
      remaining,
      percent: target > 0 ? Math.min(100, (current / target) * 100) : 0,
      months: 12,
      requiredMonthly: remaining / 12,
      onTrack: remaining === 0,
    };
  }

  // ---------- rendering ----------

  function render() {
    const goals = PulseGoalStore.all();

    // Wipe previously rendered cards, keep the form card in place.
    els.grid.querySelectorAll(".goal-card").forEach((card) => card.remove());

    els.empty.hidden = goals.length > 0;

    goals.forEach((goal, i) => {
      els.grid.appendChild(buildCard(goal, i));
    });

    // Let the cards paint at width 0 first so the fill animates across.
    requestAnimationFrame(() => {
      els.grid.querySelectorAll(".goal-fill[data-width]").forEach((fill) => {
        fill.style.width = fill.dataset.width + "%";
      });
    });
  }

  function buildCard(goal, index) {
    const proj = projectionFor(goal);
    const percent = Math.round(proj.percent);

    const card = document.createElement("div");
    card.className = "goal-card";
    card.setAttribute("role", "button");
    card.tabIndex = 0;
    card.dataset.id = goal.id;
    card.setAttribute("data-rise", "");
    card.style.setProperty("--rise-delay", 90 + index * 70 + "ms");
    card.setAttribute("aria-label", "Lihat detail target " + (goal.name || "tabungan"));

    card.innerHTML = `
      <div class="goal-card-head">
        <span class="goal-date">${escapeHtml(formatDeadline(goal.targetDate))}</span>
        <span class="goal-add" role="button" tabindex="0" aria-label="Tambah dana ke target ini">+</span>
      </div>
      <h3 class="goal-name">${escapeHtml(goal.name || "Tanpa nama")}</h3>
      <div class="goal-progress">
        <span class="goal-percent">${percent}%</span>
        <div class="goal-track"><div class="goal-fill" data-width="${percent}"></div></div>
      </div>
      <div class="goal-panel">
        <img class="goal-panel-bg" src="assets/goal-bg.svg" alt="">
        <p class="goal-amounts">
          <strong>Rp.${plainNumber(proj.current)}</strong>
          <span>/ ${plainNumber(proj.target)}</span>
        </p>
      </div>`;

    card.addEventListener("click", (e) => {
      const plus = e.target.closest(".goal-add");
      openModal(goal.id, Boolean(plus));
    });

    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal(goal.id, false);
      }
    });

    const plus = card.querySelector(".goal-add");
    plus.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        openModal(goal.id, true);
      }
    });

    return card;
  }

  // ---------- create ----------

  function handleCreate(e) {
    e.preventDefault();

    const name = els.name.value.trim();
    const targetAmount = Number(els.target.value);
    const targetDate = els.date.value;
    const currentAmount = Number(els.current.value) || 0;

    if (!name) {
      notify("Beri nama targetmu dulu.", "warning");
      els.name.focus();
      return;
    }
    if (!targetAmount || targetAmount <= 0) {
      notify("Masukkan nominal target yang valid.", "warning");
      els.target.focus();
      return;
    }
    if (currentAmount > targetAmount) {
      notify("Dana terkumpul tidak boleh melebihi nominal target.", "warning");
      els.current.focus();
      return;
    }

    PulseGoalStore.add({ name, targetAmount, targetDate, currentAmount });
    els.form.reset();
    notify("Target tabungan ditambahkan.", "success");
    render();
    window.dispatchEvent(new CustomEvent("pulsefi:goals-changed"));
  }

  // ---------- modal ----------

  function openModal(id, focusTopup) {
    const goal = PulseGoalStore.find(id);
    if (!goal) return;

    openGoalId = id;
    fillModal(goal);

    els.modal.classList.remove("is-closing");
    els.modal.hidden = false;
    document.body.style.overflow = "hidden";
    els.editForm.hidden = true;
    els.editToggle.textContent = "Ubah target";

    requestAnimationFrame(() => {
      els.modalFill.style.width = els.modalFill.dataset.width + "%";
      if (focusTopup) els.topupInput.focus();
      else els.panel.focus();
    });
  }

  function fillModal(goal) {
    const proj = projectionFor(goal);
    const percent = Math.round(proj.percent);

    els.modalDate.textContent = formatDeadline(goal.targetDate);
    els.modalName.textContent = goal.name || "Tanpa nama";
    els.modalPercent.textContent = percent + "%";
    els.modalFill.dataset.width = percent;
    els.modalFill.style.width = "0%";
    els.modalCurrent.textContent = "Rp." + plainNumber(proj.current);
    els.modalTarget.textContent = "/ " + plainNumber(proj.target);
    els.modalRemaining.textContent = rupiah(proj.remaining);
    els.modalMonths.textContent = goal.targetDate
      ? (proj.remaining === 0 ? "Tercapai" : proj.months + " bulan")
      : "Tanpa tenggat";
    els.modalMonthly.textContent = proj.remaining === 0 ? "Selesai" : rupiah(proj.requiredMonthly);

    els.editName.value = goal.name || "";
    els.editTarget.value = Number(goal.targetAmount) || 0;
    els.editDate.value = goal.targetDate || "";
    els.editCurrent.value = Number(goal.currentAmount) || 0;
    els.topupInput.value = "";
  }

  function closeModal() {
    if (els.modal.hidden) return;
    els.modal.classList.add("is-closing");
    setTimeout(() => {
      els.modal.hidden = true;
      els.modal.classList.remove("is-closing");
      document.body.style.overflow = "";
      openGoalId = null;
    }, 240);
  }

  function handleTopup(e) {
    e.preventDefault();
    const goal = PulseGoalStore.find(openGoalId);
    if (!goal) return;

    const amount = Number(els.topupInput.value);
    if (!amount || amount <= 0) {
      notify("Masukkan nominal yang valid.", "warning");
      return;
    }

    const target = Number(goal.targetAmount) || 0;
    const next = Math.min(target, (Number(goal.currentAmount) || 0) + amount);
    PulseGoalStore.update(goal.id, { currentAmount: next });

    fillModal(PulseGoalStore.find(goal.id));
    requestAnimationFrame(() => (els.modalFill.style.width = els.modalFill.dataset.width + "%"));
    notify("Dana ditambahkan ke " + (goal.name || "target") + ".", "success");
    render();
    window.dispatchEvent(new CustomEvent("pulsefi:goals-changed"));
  }

  function handleEdit(e) {
    e.preventDefault();
    const goal = PulseGoalStore.find(openGoalId);
    if (!goal) return;

    const name = els.editName.value.trim();
    const targetAmount = Number(els.editTarget.value);
    const currentAmount = Number(els.editCurrent.value) || 0;

    if (!name || !targetAmount || targetAmount <= 0) {
      notify("Nama dan nominal target harus diisi.", "warning");
      return;
    }
    if (currentAmount > targetAmount) {
      notify("Dana terkumpul tidak boleh melebihi nominal target.", "warning");
      return;
    }

    PulseGoalStore.update(goal.id, {
      name,
      targetAmount,
      currentAmount,
      targetDate: els.editDate.value,
    });

    fillModal(PulseGoalStore.find(goal.id));
    requestAnimationFrame(() => (els.modalFill.style.width = els.modalFill.dataset.width + "%"));
    els.editForm.hidden = true;
    els.editToggle.textContent = "Ubah target";
    notify("Target diperbarui.", "success");
    render();
    window.dispatchEvent(new CustomEvent("pulsefi:goals-changed"));
  }

  function handleDelete() {
    const goal = PulseGoalStore.find(openGoalId);
    if (!goal) return;
    if (!window.confirm('Hapus target "' + (goal.name || "tanpa nama") + '"?')) return;

    PulseGoalStore.remove(goal.id);
    closeModal();
    notify("Target dihapus.", "default");
    render();
    window.dispatchEvent(new CustomEvent("pulsefi:goals-changed"));
  }

  // ---------- init ----------

  function cache() {
    els.grid = document.getElementById("goals-grid");
    els.empty = document.getElementById("goals-empty");
    els.form = document.getElementById("goal-form");
    els.name = document.getElementById("goal-name");
    els.target = document.getElementById("goal-target");
    els.date = document.getElementById("goal-date");
    els.current = document.getElementById("goal-current");

    els.modal = document.getElementById("goal-modal");
    els.panel = els.modal.querySelector(".goal-modal-panel");
    els.modalDate = document.getElementById("modal-date");
    els.modalName = document.getElementById("modal-name");
    els.modalPercent = document.getElementById("modal-percent");
    els.modalFill = document.getElementById("modal-fill");
    els.modalCurrent = document.getElementById("modal-current");
    els.modalTarget = document.getElementById("modal-target");
    els.modalRemaining = document.getElementById("modal-remaining");
    els.modalMonths = document.getElementById("modal-months");
    els.modalMonthly = document.getElementById("modal-monthly");

    els.topupForm = document.getElementById("goal-topup-form");
    els.topupInput = document.getElementById("goal-topup");
    els.editForm = document.getElementById("goal-edit-form");
    els.editName = document.getElementById("edit-name");
    els.editTarget = document.getElementById("edit-target");
    els.editDate = document.getElementById("edit-date");
    els.editCurrent = document.getElementById("edit-current");
    els.editToggle = document.getElementById("modal-edit-toggle");
    els.deleteBtn = document.getElementById("modal-delete");
  }

  function bind() {
    els.form.addEventListener("submit", handleCreate);
    els.topupForm.addEventListener("submit", handleTopup);
    els.editForm.addEventListener("submit", handleEdit);
    els.deleteBtn.addEventListener("click", handleDelete);

    els.editToggle.addEventListener("click", () => {
      const showing = els.editForm.hidden;
      els.editForm.hidden = !showing;
      els.editToggle.textContent = showing ? "Tutup ubah target" : "Ubah target";
      if (showing) els.editName.focus();
    });

    els.modal.querySelectorAll("[data-close]").forEach((el) => {
      el.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    // Sidebar collapse, same behaviour as the other pages. Skipped when
    // sidebar.js already wired it up.
    const collapseBtn = document.getElementById("collapse-btn");
    const sidebar = document.getElementById("sidebar");
    if (collapseBtn && sidebar && !collapseBtn.dataset.bound) {
      collapseBtn.dataset.bound = "1";
      collapseBtn.addEventListener("click", () => sidebar.classList.toggle("collapsed"));
    }
  }

  function applySession() {
    const session = typeof PulseAuth !== "undefined" ? PulseAuth.getSession() : null;
    if (!session) return;
    document.querySelectorAll(".user-name").forEach((el) => (el.textContent = session));
  }

  function init() {
    if (!document.getElementById("goals-page")) return;
    cache();
    bind();
    applySession();
    render();
    window.addEventListener("pulsefi:tx-changed", render);
  }

  document.addEventListener("DOMContentLoaded", init);
})();