# PartnerUp Live — Platform Seminar Interaktif UMKM (Obeecreatives)

Platform tanya-jawab *real-time*, lembar kerja *Value Proposition* 7 tahap, *live polling* & awan kata (*word cloud*), serta dasbor moderasi panitia untuk **Seminar UMKM PartnerUp oleh Obeecreatives**.

---

## ✨ Fitur Utama

1. **Layar Proyektor / Panggung (`?view=projector`)**
   - Menampilkan 7 pertanyaan inti seminar dengan huruf besar yang terbaca dari belakang ruangan.
   - Tombol **Sebelumnya** & **Berikutnya** yang mengganti pertanyaan aktif di seluruh HP peserta secara *real-time*.
   - Fitur **Sorot Besar** (mengangkat jawaban ke banner utama panggung berukuran ekstra besar untuk dibedah mendalam) & **Sorot Kecil** (menyorot jawaban dalam kartu kompak berbingkai emas berkilau untuk membandingkan 2–4 jawaban sekaligus), serta tombol **Sembunyikan**.
   - **QR Code Peserta Otomatis** yang langsung menyesuaikan dengan domain tempat aplikasi di-*deploy* (termasuk domain `.vercel.app`).

2. **Materi 17 Slide Terintegrasi (`?view=slides`)**
   - Berisi seluruh 17 halaman materi *"Kenapa Pembeli Harus Pilih Kamu? (Value Proposition & Rational Value untuk UMKM Pemula)"*.
   - Tombol pintas di setiap slide latihan (`TULIS DI SINI`) untuk langsung mengaktifkan pertanyaan atau *live polling* ke HP peserta.

3. **Tampilan HP Peserta (`?view=participant`)**
   - Tanpa perlu instal aplikasi dan **tanpa perlu login/membuat akun**.
   - **Penyusun Kalimat Otomatis (Bagian 6):** Membantu peserta menggabungkan jawaban Bagian 1, 2, 4, dan 5 ke dalam rumus `[Produk] untuk [Pembeli] yang ingin [Perasaan], karena [Bukti]`.
   - **Polling & Awan Kata Real-Time (Gaya Mentimeter):** Untuk Bagian 4 (*4 Jenis Alasan*) dan Bagian 5 (*Perasaan Pembeli*).
   - **Tanya-Jawab Anonim & Upvoting (Gaya Slido):** Peserta bisa bertanya secara anonim dan memberikan *vote* (👍) pada pertanyaan peserta lain.
   - **Rekap Usahaku:** Ringkasan jawaban Bagian 1–7 milik peserta untuk langsung disalin ke Bio Instagram / WhatsApp Business.

4. **Dasbor Moderasi Panitia (`?view=moderation`)**
   - Sakelar **Mode Saringan Ketat (`Saringan: ON` / `Langsung Tampil`)**.
   - Fitur sunting teks (misal untuk menghapus nomor HP peserta) dan penambahan **Catatan Apresiasi Pemateri**.
   - Jembatan **Embed Slido / Mentimeter Eksternal**.
   - Tombol **Unduh Rekap CSV** dan **Bersihkan Jawaban Uji (Hari H)**.

---

## 🚀 Cara Push ke GitHub & Deploy ke Vercel

Kode ini sudah dikonfigurasi penuh dengan `vercel.json` dan siap di-*deploy* ke Vercel dalam 1 klik:

### 1. Push ke GitHub
Jika Anda mengekspor langsung dari Google AI Studio, gunakan tombol **GitHub Export** di bagian atas layar. Jika melalui komputer lokal:
```bash
git init
git add .
git commit -m "feat: PartnerUp Live interactive UMKM seminar platform"
git branch -M main
git remote add origin https://github.com/USERNAME_ANDA/partnerup-live-seminar.git
git push -u origin main
```

### 2. Import di Vercel
1. Buka [https://vercel.com/new](https://vercel.com/new) dan pilih repository **`partnerup-live-seminar`** dari GitHub Anda.
2. Vercel akan otomatis membaca file `vercel.json` dengan pengaturan:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Klik **Deploy** (Anda tidak wajib mengisi *Environment Variables* karena konfigurasi database `firebase-applet-config.json` sudah disertakan di dalam repositori).
4. Setelah selesai (sekitar 30 detik), buka URL `.vercel.app` Anda. QR Code di layar proyektor akan otomatis mengarah ke domain Vercel baru Anda!

---

## 💻 Menjalankan Secara Lokal

```bash
npm install
npm run dev
```
Aplikasi akan berjalan di `http://localhost:3000`.
