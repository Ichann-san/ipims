(function () {
  "use strict";
  function initManajemen() {
    document.querySelectorAll(".editor-list-item").forEach(function (item) {
      item.addEventListener("click", function () {
        document.querySelectorAll(".editor-list-item").forEach(function (i) { i.classList.remove("active"); });
        item.classList.add("active");
      });
    });

    var listSearch = document.querySelector(".editor-list-search input");
    if (listSearch) {
      listSearch.addEventListener("input", function () {
        var query = listSearch.value.trim().toLowerCase();
        document.querySelectorAll(".editor-list-item").forEach(function (item) {
          var text = item.textContent.toLowerCase();
          item.style.display = (!query || text.indexOf(query) !== -1) ? "" : "none";
        });
      });
    }

    var saveBtn = document.getElementById("saveChanges");
    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        var original = saveBtn.textContent;
        saveBtn.textContent = "✓ Tersimpan";
        saveBtn.disabled = true;
        window.ipimsShared && window.ipimsShared.showToast("Perubahan berhasil disimpan");
        setTimeout(function () {
          saveBtn.textContent = original;
          saveBtn.disabled = false;
        }, 1400);
      });
    }

    var deleteBtn = document.getElementById("deleteReport");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", function () {
        if (confirm("Yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.")) {
          deleteBtn.textContent = "✓ Laporan dihapus";
          window.ipimsShared && window.ipimsShared.showToast("Laporan berhasil dihapus");
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initManajemen);
  } else {
    initManajemen();
  }
})();
