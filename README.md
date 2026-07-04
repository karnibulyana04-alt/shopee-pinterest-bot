# Shopee → Pinterest Auto Poster (via Make.com)

Web app buat generate gambar + caption dari link affiliate Shopee, lalu jadwalkan posting ke Pinterest — postingnya dieksekusi lewat **Make.com** (jadi gak perlu bikin App Pinterest sendiri / nunggu approval berminggu-minggu).

## Kenapa lewat Make.com?

Bikin App Pinterest sendiri butuh approval Trial + Standard access dari Pinterest yang bisa makan waktu lama. Make.com udah punya app Pinterest yang lama disetujui Pinterest — jadi kamu tinggal **connect akun Pinterest kamu ke Make.com** (OAuth biasa, langsung approve, gak nunggu apa-apa), dan app kita tinggal "nitip" data ke Make.com lewat Webhook.

## Alur kerja

1. App kita generate gambar + caption dari link Shopee
2. Kamu isi nama board Pinterest + jadwal (tanggal & jam)
3. Data disimpan di app kita
4. Setiap menit, app kita cek jadwal yang udah waktunya
5. Kalau udah waktunya, app kita kirim data itu ke **Webhook Make.com**
6. Make.com yang eksekusi "Create Pin" ke akun Pinterest kamu (pakai koneksi yang udah di-setup di Make.com)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Bikin scenario di Make.com

1. Daftar gratis di https://www.make.com
2. Bikin **Scenario** baru
3. Module pertama: **Webhooks → Custom webhook** → bikin webhook baru, copy URL-nya
4. Module kedua: cari app **Pinterest** → pilih action **Create a Pin**
5. Connect akun Pinterest kamu (klik Add, login, authorize — ini OAuth resmi, langsung jadi, gak nunggu approval apapun)
6. Di form Create a Pin, map field-fieldnya ke data dari Webhook:
   - Board → pilih berdasarkan `board_name` dari webhook (atau map manual ke board tertentu)
   - Title → `title`
   - Description → `description`
   - Link → `link`
   - Media/Image URL → `image_url`
7. Klik **Save**, aktifkan scenario-nya (toggle ON di pojok kiri bawah)

### 3. Siapin Groq API Key (GRATIS, buat generate caption)

1. Buka https://console.groq.com/keys
2. Daftar/login (gak perlu kartu kredit)
3. Klik **Create API Key** → copy key-nya

### 4. Copy & isi environment variable

```bash
cp .env.example .env
```

Isi `GROQ_API_KEY` dan `MAKE_WEBHOOK_URL` (dari step 2).

### 5. Jalankan

```bash
npm start
```

Buka `http://localhost:3000`.

## Cara Pakai

1. Paste link affiliate Shopee + judul produk
2. Klik **Generate Gambar & Caption**
3. Kalau gambar gagal ke-scrape, isi manual (klik kanan gambar produk di Shopee → copy image address → paste)
4. Isi nama board Pinterest (harus PERSIS sama kayak nama board yang ada di akun Pinterest kamu)
5. Pilih jadwal tanggal & jam
6. Klik **Jadwalkan Post**
7. Server bakal otomatis kirim ke Make.com pas waktunya, Make.com yang publish ke Pinterest

## Soal limit Make.com

Free plan Make.com: ~1.000 operasi/bulan (realistis ~500 post/bulan karena tiap post makan ~2 operasi: trigger + action). Buat 10 post/hari (300/bulan), ini masih jauh cukup, gratis.

## Deploy ke Railway (biar jalan 24/7)

1. Push folder ini ke GitHub
2. Railway → New Project → Deploy from GitHub repo
3. Isi environment variables yang sama kayak di `.env`
4. Generate domain di Settings → Networking
