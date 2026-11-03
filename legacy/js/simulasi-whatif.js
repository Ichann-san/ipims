(function () {
  "use strict";

  function initWhatif() {
    // Intervention toggles
    document.querySelectorAll(".intervention-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".intervention-btn").forEach(function (b) {
          b.classList.remove("active");
          b.textContent = b.textContent.replace(" ✓", " +");
        });
        btn.classList.add("active");
        btn.textContent = btn.textContent.replace(" +", " ✓");
      });
    });

    // Run simulation
    var runBtn = document.getElementById("runSimBtn");
    if (runBtn) {
      runBtn.addEventListener("click", async function () {
        var original = runBtn.textContent;
        runBtn.textContent = "⏳ Menjalankan simulasi...";
        runBtn.disabled = true;

        try {
          // Find selected interventions
          var activeBtn = document.querySelector(".intervention-btn.active");
          var intervention = activeBtn ? activeBtn.textContent.replace(" ✓", "").replace(" +", "").trim() : "None";
          
          // Call Backend API
          const results = await window.ipimsAPI.runSimulationData([intervention]);
          
          // Update DOM with results
          var kpis = document.querySelectorAll(".result-kpi .kpi-value");
          if(kpis.length >= 4) {
            kpis[0].textContent = (results.road_quality_index > 0 ? "+" : "") + results.road_quality_index + "%";
            kpis[0].className = "kpi-value " + (results.road_quality_index > 0 ? "kpi-up-value" : "kpi-down");
            
            kpis[1].textContent = (results.safety_score > 0 ? "+" : "") + results.safety_score + "%";
            kpis[2].innerHTML = results.avg_response_hours + '<span class="kpi-unit">hr</span>';
            kpis[3].textContent = results.efficiency + "%";
          }
          
          // Update Scenario Summary
          var summaries = document.querySelectorAll(".summary-row strong");
          if(summaries.length >= 3) {
            summaries[1].textContent = results.cost_estimate;
            summaries[2].textContent = results.duration_weeks;
          }

          runBtn.textContent = "✓ Simulasi Selesai";
          window.ipimsShared && window.ipimsShared.showToast("Simulasi berhasil dijalankan via Server");
          setTimeout(function () {
            runBtn.textContent = original;
            runBtn.disabled = false;
          }, 1200);
        } catch(e) {
          window.ipimsShared && window.ipimsShared.showToast("Gagal menjalankan simulasi.");
          console.error(e);
          runBtn.textContent = original;
          runBtn.disabled = false;
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWhatif);
  } else {
    initWhatif();
  }
})();
