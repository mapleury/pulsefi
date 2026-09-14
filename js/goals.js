/*
  goals.js
  --------
  Page controller for goals.html. Handles creating, editing, deleting
  goals, adding money towards a goal, and rendering each goal's progress
  and monthly-saving projection.
*/
(function () {
  let state = { editingId: null };

  function init() {
    if (!document.getElementById("goals-page")) return;
    if (PulseUtils.redirectIfNeedsOnboarding()) return;
    bindForm();
    render();
  }

  function bindForm() {
    const form = document.getElementById("goal-form");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("goal-name").value.trim();
      const targetAmount = Number(document.getElementById("goal-target").value);
      const currentAmount = Number(document.getElementById("goal-current").value) || 0;
      const targetDate = document.getElementById("goal-date").value || null;

      if (!name) {
        PulseUtils.toast("Beri nama pada targetmu.", "warning");
        return;
      }
      if (!targetAmount || targetAmount <= 0) {
        PulseUtils.toast("Masukkan nominal target yang valid.", "warning");
        return;
      }
      if (currentAmount > targetAmount) {
        PulseUtils.toast("Jumlah terkumpul tidak bisa melebihi target.", "warning");
        return;
      }

      if (state.editingId) {
        PulseStorage.updateGoal(state.editingId, { name, targetAmount, currentAmount, targetDate });
        PulseUtils.toast("Target diperbarui.", "success");
        exitEditMode();
      } else {
        PulseStorage.addGoal({ name, targetAmount, currentAmount, targetDate });
        PulseUtils.toast("Target baru ditambahkan.", "success");
      }
      form.reset();
      render();
    });

    const cancelBtn = document.getElementById("goal-cancel-edit");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        form.reset();
        exitEditMode();
      });
    }
  }

  function exitEditMode() {
    state.editingId = null;
    const form = document.getElementById("goal-form");
    form.querySelector("button[type=submit]").textContent = "Buat target";
    document.getElementById("goal-cancel-edit").hidden = true;
    document.getElementById("goal-form-title").textContent = "Target baru";
  }

  function enterEditMode(goal) {
    state.editingId = goal.id;
    const form = document.getElementById("goal-form");
    document.getElementById("goal-name").value = goal.name;
    document.getElementById("goal-target").value = goal.targetAmount;
    document.getElementById("goal-current").value = goal.currentAmount;
    document.getElementById("goal-date").value = goal.targetDate || "";
    form.querySelector("button[type=submit]").textContent = "Simpan perubahan";
    document.getElementById("goal-cancel-edit").hidden = false;
    document.getElementById("goal-form-title").textContent = "Edit target";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function render() {
    const goals = PulseStorage.getGoals();
    const listEl = document.getElementById("goals-list");
    const emptyEl = document.getElementById("goals-empty");
    if (!listEl) return;

    if (goals.length === 0) {
      listEl.innerHTML = "";
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;

    listEl.innerHTML = goals
      .map((g) => {
        const proj = PulseCalc.calculateGoalProjection(g);
        const pct = Math.round(proj.percent);
        const statusText = proj.onTrack
          ? "Target sudah tercapai."
          : `Perlu sekitar ${PulseUtils.formatCurrency(proj.requiredMonthly)}/bulan untuk mencapainya${g.targetDate ? " tepat waktu" : " dalam " + proj.months + " bulan"}.`;
        const dateText = g.targetDate ? PulseUtils.formatDate(g.targetDate) : "Tanpa tenggat waktu";
        return `
          <li class="goal-card" data-id="${g.id}" data-reveal>
            <div class="goal-card-head">
              <div>
                <h3 class="goal-name">${PulseUtils.escapeHtml(g.name)}</h3>
                <p class="goal-meta">${PulseUtils.escapeHtml(dateText)}</p>
              </div>
              <span class="goal-percent">${pct}%</span>
            </div>
            <div class="progress-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
              <div class="progress-fill" style="width:${pct}%"></div>
            </div>
            <div class="goal-amounts">
              <span>${PulseUtils.formatCurrency(g.currentAmount)} terkumpul</span>
              <span>dari ${PulseUtils.formatCurrency(g.targetAmount)}</span>
            </div>
            <p class="goal-status">${statusText}</p>
            <div class="goal-actions">
              <button class="btn btn-small btn-outline" data-action="add-money" aria-label="Tambah dana untuk ${PulseUtils.escapeHtml(g.name)}">Tambah dana</button>
              <button class="btn btn-small btn-ghost" data-action="edit" aria-label="Edit target ${PulseUtils.escapeHtml(g.name)}">Edit</button>
              <button class="btn btn-small btn-ghost btn-danger" data-action="delete" aria-label="Hapus target ${PulseUtils.escapeHtml(g.name)}">Hapus</button>
            </div>
          </li>`;
      })
      .join("");

    listEl.querySelectorAll(".goal-card").forEach((card) => {
      const id = card.dataset.id;
      card.querySelector('[data-action="add-money"]').addEventListener("click", async (event) => {
        const raw = await PulseUtils.promptDialog("Tambahkan berapa banyak ke target ini? (Rp)", {
          label: "Nominal dana (Rp)",
          type: "number",
        });
        if (raw === null) return;
        const amount = Number(raw);
        if (!amount || amount <= 0) {
          PulseUtils.toast("Masukkan nominal yang valid.", "warning");
          return;
        }
        PulseStorage.addToGoal(id, amount);
        PulseUtils.toast("Dana ditambahkan ke target.", "success");
        render();
      });
      card.querySelector('[data-action="edit"]').addEventListener("click", () => {
        const goal = PulseStorage.getGoals().find((g) => g.id === id);
        if (goal) enterEditMode(goal);
      });
      card.querySelector('[data-action="delete"]').addEventListener("click", async () => {
        if (await PulseUtils.confirmDialog("Hapus target ini?")) {
          PulseStorage.deleteGoal(id);
          PulseUtils.toast("Target dihapus.", "default");
          render();
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();