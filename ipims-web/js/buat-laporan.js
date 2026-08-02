(function () {
  "use strict";

  function initBuatLaporan() {
    var progressMap = { 1: 25, 2: 50, 3: 75, 4: 100 };
    var selectedCategory = null;
    var photoBlob = null;
    var gpsData = { lat: 0, lng: 0 };
    var manualPin = false;
    var videoStream = null;

    function showStep(name) {
      document.querySelectorAll(".flow-step").forEach(function (el) {
        el.classList.toggle("hidden", el.dataset.step !== String(name));
      });

      var bar = document.getElementById("flowProgressBar");
      var progress = document.getElementById("flowProgress");
      if (progressMap[name] && bar) {
        bar.style.width = progressMap[name] + "%";
        progress.setAttribute("aria-valuenow", name);
        progress.classList.remove("hidden");
      } else if (progress) {
        progress.classList.add("hidden");
      }

      var title = document.getElementById("flowTitle");
      if (title) {
        var titles = {
          1: "Buat Laporan",
          2: "Verifikasi Lokasi",
          3: "Pilih Kategori",
          4: "Review Laporan",
          loading: "Memproses...",
          success: "Selesai"
        };
        title.textContent = titles[name] || "Buat Laporan";
      }

      // Stop camera if leaving step 1
      if (name !== "1" && videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
      }
    }

    // Initialize Camera on Step 1
    async function initCamera() {
      var video = document.getElementById("cameraVideo");
      if (!video) return;
      try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = videoStream;
      } catch (err) {
        console.error("Camera access denied or unavailable", err);
        window.ipimsShared && window.ipimsShared.showToast("Tidak dapat mengakses kamera.");
      }
    }

    // Step 1: shutter capture
    var shutterBtn = document.getElementById("shutterBtn");
    var toStep2 = document.getElementById("toStep2");
    if (shutterBtn) {
      shutterBtn.addEventListener("click", function () {
        var video = document.getElementById("cameraVideo");
        var canvas = document.getElementById("cameraCanvas");
        
        if (video && canvas && videoStream) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext("2d").drawImage(video, 0, 0);
          
          canvas.toBlob(function (blob) {
            photoBlob = blob;
            shutterBtn.classList.add("captured");
            if (toStep2) toStep2.disabled = false;
            window.ipimsShared && window.ipimsShared.showToast("Foto berhasil diambil.");
            
            // Extract GPS Location
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(function (position) {
                gpsData.lat = position.coords.latitude;
                gpsData.lng = position.coords.longitude;
                var badge = document.getElementById("confidenceBadge");
                if (badge) badge.textContent = "GPS Accuracy: " + Math.round(position.coords.accuracy) + "m";
                document.querySelector(".location-address").textContent = `📍 Lat: ${gpsData.lat.toFixed(5)}, Lng: ${gpsData.lng.toFixed(5)}`;
                
                var mapIframe = document.getElementById("locationMap");
                if (mapIframe) {
                  mapIframe.src = `https://maps.google.com/maps?q=${gpsData.lat},${gpsData.lng}&hl=id&z=17&output=embed`;
                }
              }, function(err) {
                console.warn("Geolocation failed", err);
                window.ipimsShared && window.ipimsShared.showToast("Gagal mendapatkan lokasi GPS otomatis.");
              });
            }
          }, "image/jpeg", 0.8);
        }
      });
    }

    // Navigation buttons
    var nav = {
      toStep2: "2", toStep1: "1", toStep3: "3",
      toStep2b: "2", toStep3b: "3"
    };
    Object.keys(nav).forEach(function (id) {
      var btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener("click", async function () { 
          showStep(nav[id]); 
          if(nav[id] === "1") initCamera(); // Re-init if going back
          
          if(id === "toStep3" && photoBlob) {
            try {
              window.ipimsShared && window.ipimsShared.showToast("Menganalisis foto dengan AI...");
              var formData = new FormData();
              formData.append("photo", photoBlob, "capture.jpg");
              var analysis = await window.ipimsAPI.analyzePhotoData(formData);
              
              // Auto-select category
              var matchingChip = document.querySelector(`.chip[data-category="${analysis.category}"]`);
              if(matchingChip) {
                matchingChip.click();
              }
              window.ipimsShared && window.ipimsShared.showToast("Analisis selesai: " + analysis.category);
            } catch (err) {
              console.error("Analysis failed", err);
            }
          }
        });
      }
    });

    // toStep4 needs to update review
    var toStep4 = document.getElementById("toStep4");
    if (toStep4) {
      toStep4.addEventListener("click", function () {
        var reviewCategory = document.getElementById("reviewCategory");
        if (reviewCategory) {
          reviewCategory.textContent = selectedCategory || "Otomatis oleh AI";
        }
        showStep("4");
      });
    }

    // Category chips
    document.querySelectorAll(".chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        document.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("selected"); });
        chip.classList.add("selected");
        selectedCategory = chip.dataset.category;
      });
    });

    // Manual pin
    var manualPinBtn = document.getElementById("manualPinBtn");
    if (manualPinBtn) {
      manualPinBtn.addEventListener("click", function () {
        var badge = document.getElementById("confidenceBadge");
        if (badge) badge.textContent = "Lokasi manual dipilih";
        window.ipimsShared && window.ipimsShared.showToast("Lokasi manual berhasil ditentukan");
        manualPin = true;
      });
    }

    // Submit using Backend API (FormData)
    var submitBtn = document.getElementById("submitReport");
    if (submitBtn) {
      submitBtn.addEventListener("click", async function () {
        showStep("loading");
        
        try {
          var formData = new FormData();
          formData.append("category", selectedCategory || "Auto");
          formData.append("latitude", gpsData.lat);
          formData.append("longitude", gpsData.lng);
          formData.append("manual_pin", manualPin);
          if (photoBlob) {
            formData.append("photo", photoBlob, "capture.jpg");
          }

          const response = await window.ipimsAPI.submitReportData(formData);
          
          document.querySelector(".success-state p").innerHTML = `ID Laporan: <strong>${response.report_id}</strong><br><small>Confidence: ${response.ai_confidence}%</small>`;
          showStep("success");
        } catch (error) {
          window.ipimsShared && window.ipimsShared.showToast("Gagal mengirim laporan ke server.");
          console.error(error);
          showStep("4"); // fallback to step 4 on error
        }
      });
    }

    // Back button in header
    var flowBack = document.getElementById("flowBack");
    if (flowBack) {
      flowBack.addEventListener("click", function () {
        if (videoStream) {
          videoStream.getTracks().forEach(track => track.stop());
        }
        window.location.href = "index.html";
      });
    }

    // Start flow
    showStep("1");
    initCamera();
  }

  // Run init when loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBuatLaporan);
  } else {
    initBuatLaporan();
  }
})();
