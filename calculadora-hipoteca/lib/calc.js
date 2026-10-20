(function () {
  "use strict";

  // Sistema francés: cuota = P * r / (1 - (1+r)^-n), r = tipo mensual.
  // Caso verificado a mano: 100.000 EUR, 3 % anual, 25 años (n = 300)
  //   r = 0,0025 -> cuota = 474,21 EUR; total pagado = 142.263 EUR; intereses = 42.263 EUR.
  function calcLoan(principal, annualRatePct, years) {
    var n = Math.round(years * 12);
    var r = annualRatePct / 100 / 12;
    var payment = r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n));
    var rows = [];
    var balance = principal;
    var interestCum = 0;
    for (var k = 1; k <= n; k++) {
      var interest = balance * r;
      var amort = payment - interest;
      if (k === n) amort = balance; // evita residuos de coma flotante en la última cuota
      balance = Math.max(0, balance - amort);
      interestCum += interest;
      rows.push({ k: k, payment: amort + interest, interest: interest, amort: amort, balance: balance, interestCum: interestCum });
    }
    var totalPaid = rows.reduce(function (s, x) { return s + x.payment; }, 0);
    return {
      principal: principal, rate: annualRatePct, years: years, n: n,
      payment: payment, totalPaid: totalPaid, totalInterest: totalPaid - principal, rows: rows
    };
  }

  var api = { calcLoan: calcLoan };
  window.HipotecaCalc = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
