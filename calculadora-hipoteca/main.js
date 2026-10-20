(function () {
  "use strict";

  var calcLoan = window.HipotecaCalc && window.HipotecaCalc.calcLoan;
  var B = window.__BRAND__ || { limits: { maxAmount: 1e8, maxRate: 30, maxYears: 40 } };
  var L = B.limits;
  var fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
  var fmt0 = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  var pct = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });

  function $(id) { return document.getElementById(id); }
  function safe(fn) { try { fn(); } catch (e) { if (window.console) console.error(e); } }

  var state = { compare: false, a: null, b: null, shown: 12 };

  function read(prefix) {
    var amount = parseFloat($(prefix + "-amount").value.replace(",", "."));
    var rate = parseFloat($(prefix + "-rate").value.replace(",", "."));
    var years = parseFloat($(prefix + "-years").value.replace(",", "."));
    var tag = prefix.toUpperCase();
    if (!(amount > 0) || amount > L.maxAmount) return { error: "Escenario " + tag + ": introduce un importe entre 1 € y " + fmt0.format(L.maxAmount) + "." };
    if (!(rate >= 0) || rate > L.maxRate) return { error: "Escenario " + tag + ": el interés debe estar entre 0 % y " + L.maxRate + " %." };
    if (!(years >= 1) || years > L.maxYears) return { error: "Escenario " + tag + ": el plazo debe estar entre 1 y " + L.maxYears + " años." };
    return { loan: calcLoan(amount, rate, years) };
  }

  function resultHtml(l) {
    return '<div class="main">' + fmt.format(l.payment) + ' <small>/ mes</small></div>' +
      "<dl><dt>Total de intereses</dt><dd>" + fmt.format(l.totalInterest) + "</dd>" +
      "<dt>Total a pagar</dt><dd>" + fmt.format(l.totalPaid) + "</dd>" +
      "<dt>Cuotas</dt><dd>" + l.n + "</dd>" +
      "<dt>Intereses sobre capital</dt><dd>" + pct.format((l.totalInterest / l.principal) * 100) + " %</dd></dl>";
  }

  function update() {
    var errEl = $("error"), msgs = [];
    var a = read("a");
    var b = state.compare ? read("b") : null;
    if (a.error) msgs.push(a.error);
    if (b && b.error) msgs.push(b.error);
    state.a = a.loan || null;
    state.b = b && b.loan ? b.loan : null;
    errEl.hidden = !msgs.length;
    errEl.textContent = msgs.join(" ");
    $("tool").setAttribute("data-state", msgs.length ? "error" : "done");
    $("res-a").innerHTML = state.a ? resultHtml(state.a) : "";
    $("res-b").innerHTML = state.b ? resultHtml(state.b) : "";
    renderDelta();
    state.shown = 12;
    renderTable();
    safe(drawChart);
  }

  function renderDelta() {
    var d = $("delta");
    if (!(state.compare && state.a && state.b)) { d.hidden = true; return; }
    var dp = state.b.payment - state.a.payment;
    var di = state.b.totalInterest - state.a.totalInterest;
    function phrase(v, more, less) { return Math.abs(v) < 0.005 ? "igual" : fmt.format(Math.abs(v)) + (v > 0 ? more : less); }
    d.textContent = "B frente a A: la cuota es " + phrase(dp, " más cara al mes", " más barata al mes") +
      " y los intereses totales son " + phrase(di, " más altos", " más bajos") + ".";
    d.hidden = false;
  }

  function tableLoan() {
    var sel = $("table-scenario").value;
    return (sel === "b" && state.b) ? state.b : state.a;
  }

  function rowHtml(r) {
    return "<tr><td>" + r.k + "</td><td>" + fmt.format(r.payment) + "</td><td>" + fmt.format(r.interest) +
      "</td><td>" + fmt.format(r.amort) + "</td><td>" + fmt.format(r.balance) + "</td></tr>";
  }

  function renderTable() {
    var l = tableLoan(), body = $("amort-body");
    if (!l) { body.innerHTML = ""; $("more").hidden = true; $("all").hidden = true; return; }
    var upto = Math.min(state.shown, l.rows.length), html = "";
    for (var i = 0; i < upto; i++) html += rowHtml(l.rows[i]);
    body.innerHTML = html;
    var rest = l.rows.length - upto;
    $("more").hidden = rest <= 0;
    $("all").hidden = rest <= 0;
    $("all").textContent = "Mostrar todos (" + l.rows.length + ")";
  }

  // ---- Gráfico (canvas, sin librerías) ----
  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

  function drawChart() {
    var cv = $("chart"), loans = [];
    if (state.a) loans.push({ id: "A", l: state.a, dash: false, color: cssVar("--a") });
    if (state.b) loans.push({ id: "B", l: state.b, dash: true, color: cssVar("--b") });
    var dpr = window.devicePixelRatio || 1;
    var w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return; // pestaña en segundo plano o sin tamaño
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    var ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!loans.length) return;

    var ink = cssVar("--muted"), line = cssVar("--line");
    var padL = 62, padR = 10, padT = 10, padB = 26;
    var pw = w - padL - padR, ph = h - padT - padB;
    var maxN = 0, maxY = 0;
    loans.forEach(function (s) {
      maxN = Math.max(maxN, s.l.n);
      maxY = Math.max(maxY, s.l.principal, s.l.totalInterest);
    });
    function X(m) { return padL + (m / maxN) * pw; }
    function Y(v) { return padT + ph - (v / maxY) * ph; }

    ctx.font = "12px system-ui,sans-serif";
    ctx.fillStyle = ink; ctx.strokeStyle = line; ctx.lineWidth = 1;
    for (var g = 0; g <= 4; g++) {
      var v = (maxY / 4) * g, y = Y(v);
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillText(fmt0.format(v), padL - 6, y);
    }
    var yearsMax = maxN / 12, step = yearsMax > 30 ? 10 : yearsMax > 15 ? 5 : yearsMax > 6 ? 2 : 1;
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (var yr = 0; yr <= yearsMax; yr += step) ctx.fillText(yr + " a", X(yr * 12), padT + ph + 6);

    function series(s, fn, alpha) {
      ctx.beginPath();
      ctx.setLineDash(s.dash ? [6, 4] : []);
      ctx.strokeStyle = s.color; ctx.lineWidth = 2.4; ctx.globalAlpha = alpha;
      ctx.moveTo(X(0), Y(fn(0)));
      for (var m = 1; m <= s.l.n; m++) ctx.lineTo(X(m), Y(fn(m)));
      ctx.stroke(); ctx.globalAlpha = 1; ctx.setLineDash([]);
    }
    loans.forEach(function (s) {
      var rows = s.l.rows;
      series(s, function (m) { return m === 0 ? s.l.principal : rows[m - 1].balance; }, 1);
      series(s, function (m) { return m === 0 ? 0 : rows[m - 1].interestCum; }, 0.55);
    });

    $("legend").innerHTML = loans.map(function (s) {
      var d = s.dash ? "dashed" : "solid";
      return '<li><i style="border-top-style:' + d + ";border-color:" + s.color + '"></i>' + s.id + ": capital pendiente</li>" +
        '<li><i style="border-top-style:' + d + ";border-color:" + s.color + ';opacity:.55"></i>' + s.id + ": intereses acumulados</li>";
    }).join("");
  }

  function toggleCompare() {
    state.compare = !state.compare;
    var btn = $("toggle-compare");
    btn.setAttribute("aria-pressed", String(state.compare));
    btn.textContent = state.compare ? "− Quitar comparación" : "+ Comparar con otro escenario";
    if (state.compare) {
      $("b-amount").value = $("a-amount").value;
      $("b-rate").value = String(Math.max(0, Math.round((parseFloat($("a-rate").value) - 0.5) * 100) / 100));
      $("b-years").value = String(Math.min(L.maxYears, (parseFloat($("a-years").value) || 25) + 5));
    }
    $("sc-b").hidden = !state.compare;
    $("scenarios").classList.toggle("compare", state.compare);
    $("table-scenario-wrap").hidden = !state.compare;
    if (!state.compare) $("table-scenario").value = "a";
    update();
  }

  var beforePrintRows = null;
  function init() {
    if (!calcLoan) { $("error").hidden = false; $("error").textContent = "No se pudo cargar el motor de cálculo. Recarga la página."; return; }
    ["a", "b"].forEach(function (p) {
      ["amount", "rate", "years"].forEach(function (f) { $(p + "-" + f).addEventListener("input", update); });
    });
    $("toggle-compare").addEventListener("click", toggleCompare);
    $("table-scenario").addEventListener("change", function () { state.shown = 12; renderTable(); });
    $("more").addEventListener("click", function () { state.shown += 12; renderTable(); });
    $("all").addEventListener("click", function () { var l = tableLoan(); if (l) { state.shown = l.rows.length; renderTable(); } });
    $("print").addEventListener("click", function () { window.print(); });
    window.addEventListener("beforeprint", function () { var l = tableLoan(); beforePrintRows = state.shown; if (l) { state.shown = l.rows.length; renderTable(); } });
    window.addEventListener("afterprint", function () { if (beforePrintRows !== null) { state.shown = beforePrintRows; beforePrintRows = null; renderTable(); } });
    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { safe(drawChart); }, 120); });
    document.addEventListener("visibilitychange", function () { if (!document.hidden) safe(drawChart); });
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.addEventListener) mq.addEventListener("change", function () { safe(drawChart); });
    }
    var y = $("year"); if (y) y.textContent = new Date().getFullYear();
    update();
  }

  safe(init);
})();
