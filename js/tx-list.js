

const PulseTxList = (function () {
  const state = {
    search: "",
    typeFilter: "all",
    categoryFilter: "all",
    sort: "date-desc",
  };

  function startOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + diff);
    return d;
  }
  function weekGroupLabel(dateObj) {
    const thisWeekStart = startOfWeek(new Date());
    const txWeekStart = startOfWeek(dateObj);
    const diffWeeks = Math.round((thisWeekStart - txWeekStart) / (7 * 86400000));
    if (diffWeeks <= 0) return null;
    if (diffWeeks === 1) return "Minggu Lalu";
    if (diffWeeks > 1 && diffWeeks < 5) return diffWeeks + " Minggu Lalu";
    return dateObj.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  }

  function getFilteredSorted() {
    let list = PulseStorage.getTransactions();

    if (state.typeFilter !== "all") list = list.filter((t) => t.type === state.typeFilter);
    if (state.categoryFilter !== "all") list = list.filter((t) => t.category === state.categoryFilter);
    if (state.search) {
      list = list.filter(
        (t) =>
          (t.description || "").toLowerCase().includes(state.search) ||
          t.category.toLowerCase().includes(state.search)
      );
    }

    list = list.slice();
    switch (state.sort) {
      case "date-asc":
        list.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case "amount-desc":
        list.sort((a, b) => Number(b.amount) - Number(a.amount));
        break;
      case "amount-asc":
        list.sort((a, b) => Number(a.amount) - Number(b.amount));
        break;
      case "date-desc":
      default:
        list.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
    }
    return list;
  }

  function buildRow(tx) {
    const li = document.createElement("li");
    li.className = "tx-row" + (tx.isDemo ? " tx-row-demo" : "");
    li.dataset.id = tx.id;

    const top = document.createElement("div");
    top.className = "tx-row-top";

    const amount = document.createElement("div");
    amount.className = "tx-row-amount";
    const sign = tx.type === "income" ? "+" : "\u2212";
    amount.textContent = `${sign}${PulseUtils.formatCurrency(Number(tx.amount))}`;

    const pill = document.createElement("span");
    pill.className = "tx-pill " + (tx.type === "income" ? "tx-pill-income" : "tx-pill-expense");
    pill.textContent = tx.category;

    top.append(amount, pill);

    const meta = document.createElement("div");
    meta.className = "tx-row-meta";

    const typeSpan = document.createElement("span");
    typeSpan.className = "tx-meta-type";
    typeSpan.textContent = tx.type === "income" ? "Pemasukan" : "Pengeluaran";

    const descSpan = document.createElement("span");
    descSpan.className = "tx-meta-desc";
    descSpan.textContent = tx.description && tx.description.trim() ? tx.description : tx.category;

    const dateSpan = document.createElement("span");
    dateSpan.className = "tx-meta-date";
    dateSpan.textContent = PulseUtils.formatDate(tx.date);

    meta.append(typeSpan, dot(), descSpan, dot(), dateSpan);

    const actions = document.createElement("div");
    actions.className = "tx-row-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "tx-action-btn";
    editBtn.textContent = "Edit";
    editBtn.setAttribute("aria-label", "Edit transaksi");
    editBtn.addEventListener("click", () => PulseTxForm.enterEditMode(tx));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "tx-action-btn tx-action-danger";
    deleteBtn.textContent = "Hapus";
    deleteBtn.setAttribute("aria-label", "Hapus transaksi");
    deleteBtn.addEventListener("click", () => {
      if (window.confirm("Hapus transaksi ini?")) {
        PulseStorage.deleteTransaction(tx.id);
        PulseUtils.toast("Transaksi dihapus.", "default");
        window.dispatchEvent(new CustomEvent("pulsefi:tx-changed"));
      }
    });

    actions.append(editBtn, deleteBtn);
    li.append(top, meta, actions);
    return li;
  }

  function dot() {
    const span = document.createElement("span");
    span.className = "tx-meta-dot";
    span.textContent = "\u00B7";
    return span;
  }

  function buildGroupHeader(label) {
    const li = document.createElement("li");
    li.className = "tx-group-header";
    li.textContent = label;
    return li;
  }

  function render() {
    const listEl = document.getElementById("tx-list");
    const emptyEl = document.getElementById("tx-empty");
    if (!listEl) return;

    const list = getFilteredSorted();
    listEl.innerHTML = "";

    if (list.length === 0) {
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;

    const groupByDate = state.sort === "date-desc" || state.sort === "date-asc";
    let lastLabel = "__initial__";

    list.forEach((tx) => {
      if (groupByDate) {
        const label = weekGroupLabel(new Date(tx.date));
        if (label !== lastLabel) {
          if (label) listEl.appendChild(buildGroupHeader(label));
          lastLabel = label;
        }
      }
      listEl.appendChild(buildRow(tx));
    });

    if (window.PulseUtils && PulseUtils.initScrollReveal) {
      listEl.querySelectorAll(".tx-row").forEach((row) => row.setAttribute("data-reveal", ""));
      PulseUtils.initScrollReveal();
    }
  }

  function bindSearch() {
    const wrap = document.getElementById("tx-search-wrap");
    const btn = document.getElementById("tx-search-btn");
    const input = document.getElementById("tx-search");
    if (!wrap || !btn || !input) return;

    btn.addEventListener("click", () => {
      const isOpen = wrap.classList.toggle("is-open");
      if (isOpen) input.focus();
    });
    input.addEventListener("input", (e) => {
      state.search = e.target.value.toLowerCase();
      render();
    });
    input.addEventListener("blur", () => {
      if (!input.value) wrap.classList.remove("is-open");
    });
  }

  function bindFilters() {
    const typeFilter = document.getElementById("tx-filter-type");
    if (typeFilter) {
      typeFilter.addEventListener("change", (e) => {
        state.typeFilter = e.target.value;
        render();
      });
    }
    const categoryFilter = document.getElementById("tx-filter-category");
    if (categoryFilter) {
      PulseCategories.populateSelect(categoryFilter, true);
      categoryFilter.addEventListener("change", (e) => {
        state.categoryFilter = e.target.value;
        render();
      });
    }
    const sortSelect = document.getElementById("tx-sort");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        state.sort = e.target.value;
        render();
      });
    }
  }

  function init() {
    if (!document.getElementById("tx-list")) return;
    bindSearch();
    bindFilters();
    render();
    window.addEventListener("pulsefi:tx-changed", render);
  }

  document.addEventListener("DOMContentLoaded", init);

  return { init, render };
})();