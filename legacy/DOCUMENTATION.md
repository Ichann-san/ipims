# IPIMS — Dokumentasi Prototype Web

Dokumentasi ini menjelaskan struktur, cara menjalankan, dan cara memodifikasi prototype HTML/CSS/JS IPIMS (Intelligent Public Infrastructure Management System) hasil konversi dari desain Figma.

---

## 1. Ringkasan

Prototype ini adalah **static frontend** (HTML/CSS/JS polos, tanpa framework/build tool) yang mencakup 10 halaman sesuai desain Figma. Semua data yang tampil saat ini bersifat **statis/hardcoded** di dalam HTML — belum terhubung ke backend/database manapun. Interaksi UI (klik, filter, toggle) sudah berfungsi secara client-side dengan JavaScript vanilla.

Tujuan prototype: siap didemokan ke juri, dan siap dihubungkan ke backend (Flask + local DB) tanpa perlu menulis ulang struktur halaman.

---

## 2. Struktur Folder

```
ipims-web/
├── index.html                  # Beranda
├── buat-laporan.html           # Reporting flow (mobile-first)
├── detail-laporan.html         # Detail laporan publik
├── daftar-laporan.html         # List/feed laporan
├── peta-kota.html              # Peta Kota & GNN Insight
├── dashboard-prioritas.html    # Priority Queue (admin)
├── manajemen-laporan.html      # Report management (admin)
├── profil.html                 # Profil pengguna (statis)
├── transparansi.html           # Dashboard transparansi publik
├── simulasi-whatif.html        # What-if simulation (admin)
│
├── css/
│   ├── style.css                # Design tokens + komponen shared (header, footer, button, badge, card)
│   ├── home.css                 # Khusus Beranda
│   ├── buat-laporan.css         # Khusus reporting flow
│   ├── detail-laporan.css       # Khusus detail laporan
│   ├── daftar-laporan.css       # Khusus list laporan
│   ├── peta-kota.css            # Khusus peta & GNN
│   ├── admin.css                 # Shared shell untuk halaman admin (sidebar + topbar + tabel)
│   ├── manajemen-laporan.css    # Khusus editor laporan
│   ├── profil.css               # Khusus profil
│   ├── transparansi.css         # Khusus dashboard transparansi
│   └── whatif.css               # Khusus simulasi what-if
│
├── js/
│   ├── main.js                  # Inject header & footer + nav toggle (dipakai semua halaman publik)
│   ├── buat-laporan.js          # Logic step flow (kamera → lokasi → kategori → review → submit)
│   ├── detail-laporan.js        # Comment form + share button
│   ├── daftar-laporan.js        # Filter panel, search, load more
│   ├── peta-kota.js             # Klik node graph → tampilkan detail di panel
│   ├── dashboard-prioritas.js   # Toggle bobot MCDM (Jalan Nasional vs Lingkungan)
│   ├── manajemen-laporan.js     # Pilih laporan di list, simulasi save/delete
│   └── whatif.js                # Pilih intervensi, jalankan simulasi
│
└── assets/                      # Folder untuk foto/gambar (lihat bagian 6)
```

---

## 3. Cara Menjalankan

Karena ini static site murni, tidak butuh `npm install` atau build step.

**Opsi 1 — Python (paling gampang):**
```bash
cd ipims-web
python3 -m http.server 8080
```
Lalu buka `http://localhost:8080` di browser.

**Opsi 2 — VS Code Live Server extension**, atau ekstensi serupa.

**Opsi 3 — Buka langsung file HTML** di browser (klik dua kali). Sebagian besar fitur akan tetap jalan, tapi beberapa browser membatasi fetch lokal — disarankan tetap pakai local server.

> Untuk demo dari HP (sesuai rencana kalian), jalankan local server di laptop lalu akses lewat IP laptop di jaringan WiFi yang sama, misalnya `http://192.168.1.x:8080`.

---

## 4. Peta Halaman & Fitur Interaktif

| Halaman | File | Fitur JS yang sudah jalan |
|---|---|---|
| Beranda | `index.html` | Nav responsive (hamburger di mobile) |
| Buat Laporan | `buat-laporan.html` | Step flow 4 langkah, validasi tombol "Lanjut" setelah foto diambil, pilih kategori (chip), submit → loading → success state |
| Detail Laporan | `detail-laporan.html` | Form komentar (tanpa persist), tombol share (pakai Web Share API jika didukung, fallback copy link) |
| Daftar Laporan | `daftar-laporan.html` | Toggle panel filter, search real-time di judul/deskripsi card, tombol "muat lainnya" |
| Peta Kota & GNN | `peta-kota.html` | **Klik node pada graph SVG → detail infrastruktur muncul di panel kanan**, zoom in/out |
| Dashboard Prioritas | `dashboard-prioritas.html` | Toggle "Jalan Nasional" vs "Jalan Lingkungan" → bobot MCDM di sidebar berubah otomatis |
| Manajemen Laporan | `manajemen-laporan.html` | Pilih laporan dari list kiri, simpan perubahan (feedback visual), hapus laporan (confirm dialog) |
| Profil | `profil.html` | Statis, tanpa interaksi (sesuai requirement — tidak ada login/logout) |
| Transparansi | `transparansi.html` | Statis dengan chart SVG/CSS (tren garis + bar chart) |
| Simulasi What-if | `simulasi-whatif.html` | Pilih jenis intervensi, tombol "Jalankan Simulasi" dengan loading state |

---

## 5. Konvensi Desain (Design Tokens)

Semua warna, spacing, dan radius didefinisikan sebagai CSS custom properties di `css/style.css` bagian `:root`. Jangan hardcode warna baru di file CSS lain — selalu pakai variable yang sudah ada:

```css
--color-accent      /* warna aksen utama (oranye) — CTA, highlight */
--color-ink          /* warna teks utama */
--color-ink-soft     /* warna teks sekunder/muted */
--color-navy         /* warna footer & CTA gelap */

--status-reported / --status-ai-verified / --status-gov /
--status-assigned / --status-repair / --status-completed
                     /* warna badge status laporan, konsisten di semua halaman */

--severity-low / --severity-mid / --severity-high
                     /* warna indikator tingkat keparahan kerusakan */

--space-1 s/d --space-9   /* skala spacing (4px s/d 96px) */
--radius-sm / --radius-md / --radius-lg
```

**Kenapa ini penting:** kalau juri/tim minta ganti warna aksen dari oranye ke warna lain, cukup ubah satu baris `--color-accent` di `style.css`, dan seluruh halaman ikut berubah otomatis.

---

## 6. Placeholder Gambar

Semua `<img>` di prototype ini menunjuk ke file di folder `assets/` yang **belum ada isinya** (sengaja, biar tim bisa isi dengan foto asli/sendiri). Setiap `<img>` punya `onerror="this.style.display='none'"` sehingga jika file belum ada, gambar akan hilang dengan rapi (background gradient placeholder akan tetap terlihat) — tidak muncul ikon broken image.

**Cara mengisi gambar:**
1. Siapkan foto (disarankan asli/stok, bukan AI-generated sesuai catatan revisi sebelumnya)
2. Simpan ke folder `assets/` dengan nama file yang sama persis seperti yang direferensikan di HTML (lihat atribut `src`)
3. Refresh browser — gambar otomatis muncul menggantikan placeholder gradient

Daftar nama file yang direferensikan (bisa dicari dengan grep `assets/` di semua file HTML):
- `hero-street.jpg`, `report-jalan.jpg`, `report-lampu.jpg`, `report-trotoar.jpg` (Beranda)
- `report-hero.jpg` (Buat Laporan)
- `report-jembatan.jpg` (Detail Laporan, dipakai juga di Peta Kota)
- `report-lubang.jpg`, `report-drainase.jpg`, `report-trotoar2.jpg` (Daftar Laporan)
- `report-jalan2.jpg` (Manajemen Laporan)
- `profil-admin.jpg` (Profil)

---

## 7. Struktur Header & Footer (Partial Injection)

Header dan footer **tidak ditulis manual di setiap file HTML** — mereka di-generate oleh `js/main.js` dan disuntikkan ke dalam `<header id="site-header"></header>` dan `<footer id="site-footer"></footer>`.

**Kenapa didesain begini:** supaya kalau ada perubahan menu navigasi atau link footer, cukup edit satu tempat (`js/main.js`), tidak perlu ubah 10 file HTML satu-satu.

Halaman admin (`dashboard-prioritas.html`, `simulasi-whatif.html`) **tidak pakai** header/footer partial ini — mereka pakai sidebar sendiri (`admin.css`) karena konteksnya beda (internal tool, bukan halaman publik).

Untuk menandai menu mana yang aktif di navbar, setiap halaman punya atribut `data-page` di tag `<body>`:
```html
<body data-page="beranda">   <!-- akan meng-highlight link "Beranda" di nav -->
```

---

## 8. Yang BELUM Terhubung ke Backend (Next Steps)

Sesuai rencana kalian, prototype ini masih murni frontend. Berikut titik-titik yang perlu disambungkan ke backend Flask nantinya:

| Fitur | Lokasi di kode | Yang perlu diganti |
|---|---|---|
| Submit laporan | `js/buat-laporan.js` → `submitReport` click handler | Ganti `setTimeout` dengan `fetch()` POST ke endpoint Flask, kirim foto (base64/FormData) + GPS + kategori |
| Ambil foto kamera | `buat-laporan.html` step 1 | Saat ini foto adalah gambar statis; perlu diganti dengan `navigator.mediaDevices.getUserMedia()` untuk akses kamera asli |
| Data laporan (list, detail) | `daftar-laporan.html`, `detail-laporan.html` | Ganti card hardcoded dengan render dari hasil `fetch()` GET ke API, looping data JSON |
| Node graph GNN | `js/peta-kota.js` → object `NODE_DATA` | Ganti data hardcoded dengan hasil fetch dari endpoint `/api/graph` yang menghitung impact score |
| Priority Queue table | `dashboard-prioritas.html` | Ganti baris `<tr>` hardcoded dengan render dinamis dari endpoint MCDM scoring |
| Simpan perubahan status | `js/manajemen-laporan.js` → `saveChanges` | Ganti feedback visual dengan `fetch()` PATCH/PUT ke API |

Rekomendasi: buat 1 file `js/api.js` berisi fungsi-fungsi `fetchReports()`, `submitReport()`, `updateReportStatus()`, dll — supaya semua halaman manggil fungsi yang sama, bukan menulis `fetch()` berulang di tiap file.

---

## 9. Checklist Sebelum Presentasi

- [ ] Isi semua placeholder gambar di `assets/` dengan foto asli
- [ ] Sambungkan minimal 1 flow penuh ke backend (disarankan: Buat Laporan → tersimpan → muncul di Daftar Laporan) untuk demo end-to-end
- [ ] Test buka dari HP asli (bukan cuma resize browser) untuk halaman mobile-first (Buat Laporan, Detail Laporan)
- [ ] Cek semua link nav (`main.js`) mengarah ke file yang benar
- [ ] Ganti data dummy (nama pelapor, statistik) sesuai kebutuhan cerita demo kalian

---

## 10. Catatan Revisi dari Versi Figma Sebelumnya

Sesuai diskusi sebelumnya, perubahan berikut sudah diterapkan di HTML ini dibanding desain awal:
- **Peta Kota & GNN**: legend dipindah dari ilustrasi besar di bawah halaman menjadi kotak kecil di sidebar kanan (`.legend-box`), dan graph sekarang interaktif (klik node → detail muncul), bukan gambar statis.
- Semua status badge dan severity indicator memakai warna yang konsisten lintas halaman (didefinisikan sekali di `style.css`).
