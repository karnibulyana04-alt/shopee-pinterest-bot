# Shopee → Pinterest Auto Poster

Web app untuk generate gambar + caption dari link affiliate Shopee, lalu **auto-schedule posting ke Pinterest pakai API resmi** (bukan bot/simulasi klik, jadi aman dari suspensi akun).

## ⚠️ Kenapa bukan Chrome Extension?
Kalau cuma generate gambar/caption doang, extension bisa aja. Tapi biar rapi dan gampang di-maintain, ini dibuat sebagai web app kecil yang bisa lo akses dari browser mana aja.

## 📅 Soal Scheduling
App ini pakai **native scheduling Pinterest** — pas lo klik "Jadwalkan Post", request langsung dikirim ke Pinterest dengan parameter `publish_at` (format ISO 8601). Pinterest sendiri yang nyimpen & publish di waktu itu, jadi:
- Server kamu **gak perlu nyala 24/7** menunggu jadwal — cukup nyala pas kamu generate & submit jadwal
- Kalau server mati setelah jadwal disubmit, pin tetap terpublish sesuai waktu (karena udah "dititipkan" ke Pinterest)
- Gak ada limit jumlah post di sisi app ini — 10 post/hari x 7 hari (70 post) sama sekali gak masalah, jauh di bawah rate limit Pinterest (Trial access: 1000 request/hari; Standard access: 100 request/detik)

## 🧱 Yang TIDAK dilakukan app ini (dan kenapa)
- **Tidak** scraping gambar dari Instagram/Threads/Facebook orang lain — itu pelanggaran hak cipta & ToS platform tsb.
- **Tidak** auto-klik/simulasi browser di Pinterest — pakai Pinterest API resmi (v5) supaya akun lo gak keflag sebagai bot.
- Gambar diambil dari foto produk Shopee sendiri (legal karena itu produk yang lo affiliate-in), dan bisa kamu ganti manual/AI-generate kapan aja.

## 🚀 Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Daftar Pinterest App
1. Buka https://developers.pinterest.com/apps/ → **Create app**
2. Catat **App ID** dan **App secret**
3. Di bagian Redirect URIs, tambahkan: `http://localhost:3000/auth/pinterest/callback` (untuk local testing) — nanti ganti ke domain production kamu.
4. Ajukan scope: `boards:read`, `pins:read`, `pins:write` (untuk trial access biasanya langsung aktif, untuk skala besar perlu app review Pinterest).

### 3. Siapkan Anthropic API Key (buat generate caption)
Ambil di https://console.anthropic.com

### 4. Copy & isi environment variable
```bash
cp .env.example .env
```
Isi `PINTEREST_APP_ID`, `PINTEREST_APP_SECRET`, `ANTHROPIC_API_KEY`, dll sesuai punya kamu.

### 5. Jalankan
```bash
npm start
```
Buka `http://localhost:3000`, klik **Connect Pinterest**, login & authorize.

## 📋 Cara Pakai
1. Paste link affiliate Shopee + judul produk
2. Klik **Generate Gambar & Caption** → sistem ambil foto produk dari Shopee + AI bikin caption storytelling
3. Kalau gambar gagal ke-scrape, isi manual (upload ke imgur/cloudinary/dst dulu, paste URL-nya)
4. Pilih board Pinterest & jadwal tanggal/jam posting
5. Klik **Jadwalkan Post** → sistem otomatis publish pas waktunya lewat cron job tiap menit

## 🌐 Deploy ke Production (biar jalan 24/7 walau laptop mati)
Rekomendasi: **Render.com** (free tier tersedia) atau **Railway.app**
1. Push folder ini ke GitHub repo
2. Connect repo ke Render/Railway → set environment variables yang sama seperti `.env`
3. Update `PINTEREST_REDIRECT_URI` dan `BASE_URL` ke domain production kamu
4. Update juga Redirect URI di dashboard Pinterest App-nya

## 🔧 Pengembangan Lanjutan (opsional)
- Ganti `services/db.js` (JSON file) ke database beneran (Postgres/MongoDB) kalau volume posting udah tinggi
- Tambah AI image generation di `services/` untuk variasi gambar selain foto Shopee asli
- Tambah multi-user + auth kalau mau dipakai tim
- Tambah analytics: track CTR dari link Shopee affiliate (Shopee Affiliate dashboard sudah nyediain data klik & konversi)

## 📌 Batasan Pinterest API yang perlu kamu tau
- Rate limit berlaku per app (cek dashboard developer Pinterest untuk limit terbaru)
- Trial access biasanya dibatasi jumlah request/hari — kalau mau scale, ajukan **Standard Access** lewat app review
