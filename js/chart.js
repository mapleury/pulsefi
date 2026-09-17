/*
 chart.js
 --------
 Self-contained "Grafik Transaksi" widget. Two view modes share one
 mount point:
   - "weekly"  -> bar chart, one bar per weekday, height = transaction
                  count that day. Today's bar is highlighted.
   - "monthly" -> line/area chart, one point per week-of-month (keeps
                  a whole month legible instead of cramming 30 bars).

 This module never touches localStorage directly and never returns
 HTML strings — it only reads plain series data from PulseCalc and
 builds DOM nodes. The host page wires it up via PulseChart.create().
*/

const PulseChart = (function () {
  const EASE_FRAMES = 2; // frames to wait before triggering the CSS transition
  const MONTH_LABELS_LONG = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  function create(config) {
    const { bodyEl, toggleEl, prevBtn, nextBtn } = config;
    let getTransactions = config.getTransactions || (() => []);

    let mode = "weekly"; // "weekly" | "monthly"
    let offset = 0; // 0 = current period, negative = further back

    const tooltip = document.createElement("div");
    tooltip.className = "chart-tooltip";
    tooltip.setAttribute("role", "status");
    tooltip.style.position = "fixed";
    document.body.appendChild(tooltip);
    bodyEl.style.position = bodyEl.style.position || "relative";

    // Positioned with getBoundingClientRect() against the viewport and
    // parented to <body>, so the card's `overflow: hidden` (needed for
    // its rounded corners) never clips the tooltip.
    function showTooltip(anchorEl, text) {
      const anchorRect = anchorEl.getBoundingClientRect();
      tooltip.textContent = text;
      tooltip.style.left = anchorRect.left + anchorRect.width / 2 + "px";
      tooltip.style.top = anchorRect.top - 8 + "px";
      tooltip.classList.add("is-visible");
    }

    function hideTooltip() {
      tooltip.classList.remove("is-visible");
    }

    function clearChart() {
      bodyEl.innerHTML = "";
    }

    // ---------------- weekly bar chart ----------------

    function renderWeekly() {
      const data = PulseCalc.weeklySeries(getTransactions(), offset);
      const container = document.createElement("div");
      container.className = "bar-chart";

      const max = Math.max(1, ...data.buckets.map((b) => b.value));

      data.buckets.forEach((bucket) => {
        const col = document.createElement("div");
        col.className = "bar-col" + (bucket.isToday && offset === 0 ? " is-active" : "");

        const track = document.createElement("div");
        track.className = "bar-track";
        const fill = document.createElement("div");
        fill.className = "bar-fill";
        fill.style.height = "0%";
        track.appendChild(fill);

        const label = document.createElement("span");
        label.className = "bar-label";
        label.textContent = bucket.label;

        col.append(track, label);
        container.appendChild(col);

        const targetPct = bucket.value > 0 ? Math.max(12, (bucket.value / max) * 100) : 4;
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            fill.style.height = targetPct + "%";
          })
        );

        const tipText = `${bucket.value} transaksi \u00B7 ${PulseUtils.formatCurrencyCompact(bucket.amount)}`;
        col.addEventListener("mouseenter", () => showTooltip(col, tipText));
        col.addEventListener("mousemove", () => showTooltip(col, tipText));
        col.addEventListener("mouseleave", hideTooltip);
        col.addEventListener("focus", () => showTooltip(col, tipText));
        col.addEventListener("blur", hideTooltip);
        col.tabIndex = 0;
        col.setAttribute("aria-label", `${bucket.label}: ${tipText}`);
      });

      bodyEl.appendChild(container);
      updateNavButtons(data.isCurrent);
    }

    // ---------------- monthly line chart ----------------

    function catmullRomToBezierPath(points) {
      if (points.length < 2) return "";
      if (points.length === 2) {
        return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;
      }
      let d = `M${points[0].x},${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i === 0 ? i : i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
        const c1x = p1.x + (p2.x - p0.x) / 6;
        const c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6;
        const c2y = p2.y - (p3.y - p1.y) / 6;
        d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
      }
      return d;
    }

        function renderMonthly() {
      const data = PulseCalc.monthlyOverviewSeries(getTransactions(), offset);
      const wrap = document.createElement("div");
      wrap.style.display = "flex";
      wrap.style.flexDirection = "column";
      wrap.style.height = "100%";

      const heading = document.createElement("div");
      heading.className = "line-chart-month-label";
      heading.textContent = data.rangeLabel;
      wrap.appendChild(heading);

      const svgWrap = document.createElement("div");
      svgWrap.style.flex = "1";
      svgWrap.style.minHeight = "0";

          const width = 300;
      const height = 150;
      const topPad = 12;
      const bottomPad = 14;
      const max = Math.max(1, ...data.buckets.map((b) => b.value));
      const n = data.buckets.length;

      const points = data.buckets.map((b, i) => {
        const x = n > 1 ? (i / (n - 1)) * width : width / 2;
        const y = height - bottomPad - (b.value / max) * (height - topPad - bottomPad);
        return { x, y, bucket: b };
      });

      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.setAttribute("preserveAspectRatio", "none");
      svg.classList.add("line-chart-svg");

      const gradId = "pulseAreaGradient";
      const defs = document.createElementNS(svgNS, "defs");
      const grad = document.createElementNS(svgNS, "linearGradient");
      grad.setAttribute("id", gradId);
      grad.setAttribute("x1", "0");
      grad.setAttribute("y1", "0");
      grad.setAttribute("x2", "0");
      grad.setAttribute("y2", "1");
      const stop1 = document.createElementNS(svgNS, "stop");
      stop1.setAttribute("offset", "0%");
      stop1.setAttribute("style", "stop-color:var(--bar-active);stop-opacity:0.35");
      const stop2 = document.createElementNS(svgNS, "stop");
      stop2.setAttribute("offset", "100%");
      stop2.setAttribute("style", "stop-color:var(--bar-active);stop-opacity:0");
      grad.append(stop1, stop2);
      defs.appendChild(grad);
      svg.appendChild(defs);

      const linePath = catmullRomToBezierPath(points);
      const areaPath =
        linePath +
        ` L${points[n - 1].x},${height} L${points[0].x},${height} Z`;

      const area = document.createElementNS(svgNS, "path");
      area.setAttribute("d", areaPath);
      area.setAttribute("fill", `url(#${gradId})`);
      area.classList.add("line-chart-area");
      area.style.opacity = "0";
      area.style.transition = "opacity 0.5s ease 0.3s";
      svg.appendChild(area);

      const path = document.createElementNS(svgNS, "path");
      path.setAttribute("d", linePath);
      path.classList.add("line-chart-path");
      svg.appendChild(path);

      points.forEach((pt) => {
        const g = document.createElementNS(svgNS, "g");
        g.classList.add("line-chart-point");

        const hitRadius = Math.max(5, Math.min(12, (width / n) / 2));

        const hit = document.createElementNS(svgNS, "circle");
        hit.setAttribute("cx", pt.x);
        hit.setAttribute("cy", pt.y);
        hit.setAttribute("r", String(hitRadius));
        hit.classList.add("line-chart-hit");

        const dot = document.createElementNS(svgNS, "circle");
        dot.setAttribute("cx", pt.x);
        dot.setAttribute("cy", pt.y);
        dot.setAttribute("r", pt.bucket.isCurrent ? "4" : "2.2");
        dot.classList.add("line-chart-dot");
        if (pt.bucket.isCurrent) dot.classList.add("is-active");

        g.append(hit, dot);
        svg.appendChild(g);

        const tipText = `${MONTH_LABELS_LONG[pt.bucket.monthIndex]} ${pt.bucket.year}: ${pt.bucket.value} transaksi \u00B7 ${PulseUtils.formatCurrencyCompact(pt.bucket.amount)}`;
        g.addEventListener("mouseenter", () => showTooltip(dot, tipText));
        g.addEventListener("mousemove", () => showTooltip(dot, tipText));
        g.addEventListener("mouseleave", hideTooltip);
      });

      svgWrap.appendChild(svg);

           wrap.append(svgWrap);
      bodyEl.appendChild(wrap);
      updateNavButtons(data.isCurrent);

      // Draw-on animation for the line, once its real length is known.
      requestAnimationFrame(() => {
        const length = path.getTotalLength();
        path.style.strokeDasharray = String(length);
        path.style.strokeDashoffset = String(length);
        path.style.transition = "stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1)";
        requestAnimationFrame(() => {
          path.style.strokeDashoffset = "0";
          area.style.opacity = "1";
        });
      });
    }

    function updateNavButtons(isCurrent) {
      if (nextBtn) nextBtn.disabled = isCurrent;
      if (prevBtn) prevBtn.disabled = false;
    }

    function render() {
      hideTooltip();
      clearChart();
      if (mode === "weekly") renderWeekly();
      else renderMonthly();
      if (toggleEl) toggleEl.textContent = mode === "weekly" ? "Mingguan" : "Bulanan";
    }

    function attachControls() {
      if (toggleEl) {
        toggleEl.addEventListener("click", () => {
          mode = mode === "weekly" ? "monthly" : "weekly";
          offset = 0;
          render();
        });
      }
      if (prevBtn) {
        prevBtn.addEventListener("click", () => {
          offset -= 1;
          render();
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener("click", () => {
          offset = Math.min(0, offset + 1);
          render();
        });
      }
    }

    attachControls();

    return {
      render,
      refresh(transactions) {
        if (transactions) getTransactions = () => transactions;
        render();
      },
    };
  }

  return { create };
})();
