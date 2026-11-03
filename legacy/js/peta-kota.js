(function () {
  "use strict";
  function initPetaKota() {
    var NODE_DATA = {
      "jalan-a": { name: "Jalan Sudirman KM 14.5", id: "STR-JL-014", category: "Jalan Nasional", update: "10 Mar 2024", severity: "High", impact: 94 },
      "jembatan-kuning": { name: "Jembatan Kuning", id: "STR-JK-002", category: "Jembatan", update: "12 Mar 2024", severity: "High", impact: 92 },
      "rs-koja": { name: "Akses RSUD Koja", id: "FAC-RS-009", category: "Fasilitas Kesehatan", update: "8 Mar 2024", severity: "Medium", impact: 68 },
      "pasar": { name: "Pasar Kota Kasablanka", id: "FAC-PS-021", category: "Fasilitas Umum", update: "5 Mar 2024", severity: "Normal", impact: 34 },
      "sekolah": { name: "Akses Sekolah Menteng", id: "FAC-SK-011", category: "Fasilitas Pendidikan", update: "9 Mar 2024", severity: "Medium", impact: 61 },
      "terminal": { name: "Terminal Tebet", id: "STR-TM-004", category: "Transportasi", update: "3 Mar 2024", severity: "Normal", impact: 28 },
      "mall": { name: "Akses Kota Kasablanka Mall", id: "FAC-ML-002", category: "Fasilitas Umum", update: "1 Mar 2024", severity: "Normal", impact: 22 },
      "taman": { name: "Taman Kota Menteng", id: "FAC-TM-007", category: "Ruang Terbuka Hijau", update: "28 Feb 2024", severity: "Normal", impact: 18 }
    };
    var severityColor = { High: "var(--severity-high)", Medium: "var(--severity-mid)", Normal: "var(--severity-low)" };

    function selectNode(nodeId, el) {
      var data = NODE_DATA[nodeId];
      if (!data) return;

      document.querySelectorAll(".node").forEach(function (n) { n.classList.remove("selected"); });
      el.classList.add("selected");

      var hint = document.getElementById("panelHint");
      if (hint) hint.classList.add("hidden");
      var card = document.getElementById("assetCard");
      if (card) card.classList.remove("hidden");

      document.getElementById("assetName").textContent = data.name;
      document.getElementById("assetId").textContent = "ID: " + data.id;
      document.getElementById("assetCategory").textContent = data.category;
      document.getElementById("assetUpdate").textContent = data.update;
      document.getElementById("assetImpact").textContent = data.impact + "/100";

      var tag = document.querySelector(".asset-severity-tag");
      if (tag) {
        tag.textContent = "Severity: " + data.severity;
        tag.style.background = severityColor[data.severity];
        tag.style.color = "#fff";
      }

      var bar = document.querySelector(".impact-bar span");
      if (bar) {
        bar.style.width = data.impact + "%";
        bar.style.background = severityColor[data.severity];
      }
    }

    document.querySelectorAll(".node").forEach(function (node) {
      node.addEventListener("click", function () {
        selectNode(node.dataset.node, node);
      });
    });

    var scale = 1;
    var svg = document.querySelector(".map-svg");
    document.querySelectorAll(".map-zoom-controls button").forEach(function (btn, i) {
      btn.addEventListener("click", function () {
        scale = i === 0 ? Math.min(scale + 0.2, 2) : Math.max(scale - 0.2, 0.6);
        if (svg) {
          svg.style.transform = "scale(" + scale + ")";
          svg.style.transformOrigin = "center center";
          svg.style.transition = "transform 0.2s ease";
        }
      });
    });

    var assignBtn = document.querySelector(".asset-card .btn-primary");
    if (assignBtn) {
      assignBtn.addEventListener("click", function () {
        var original = assignBtn.textContent;
        assignBtn.textContent = "✓ Ditugaskan";
        assignBtn.disabled = true;
        window.ipimsShared && window.ipimsShared.showToast("Tim perbaikan telah ditugaskan");
        setTimeout(function () {
          assignBtn.textContent = original;
          assignBtn.disabled = false;
        }, 2000);
      });
    }

    var defaultNode = document.querySelector('[data-node="jembatan-kuning"]');
    if (defaultNode) selectNode("jembatan-kuning", defaultNode);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPetaKota);
  } else {
    initPetaKota();
  }
})();
