<div align="center">

<div align="center"> <img src="assets/pulsefi-title.svg" alt="PulseFi" width="800"/>

### Kebiasaan Baik, Finansial Naik

**Aplikasi personal finance & habit-tracking berbasis browser**

[![Status](https://img.shields.io/badge/status-prototype-purple)](#13-keterbatasan-teknis-saat-ini)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Made with](https://img.shields.io/badge/made%20with-HTML%20%7C%20CSS%20%7C%20JS-black)](#teknologi)

</div>

---

## Daftar Isi

- [Tentang Proyek](#tentang-proyek)
- [Fitur Unggulan](#fitur-unggulan)
- [1. Landing Page](#1-landing-page)
- [2. Login dan Signup](#2-login-dan-signup)
- [3. Dashboard](#3-dashboard)
- [4. Transactions](#4-transactions)
- [5. Savings Goals](#5-savings-goals)
- [6. Financial Insights](#6-financial-insights)
- [7. Habit Check-In](#7-habit-check-in)
- [8. What-If Simulator](#8-what-if-simulator)
- [9. Shared Storage](#9-shared-storage)
- [10. Shared Utilities](#10-shared-utilities)
- [11. Sidebar dan Navigasi](#11-sidebar-dan-navigasi)
- [12. Visual System](#12-visual-system)
- [Struktur Proyek](#struktur-proyek)
- [Instalasi & Setup](#instalasi--setup)
- [13. Keterbatasan Teknis Saat Ini](#13-keterbatasan-teknis-saat-ini)
- [Roadmap](#roadmap)
- [Lisensi](#lisensi)

---

## Tentang Proyek

<div align="center"> <img src="assets/pulsefi-mockup.svg" alt="PulseFi Mockup" width="800"/> </div>

**PulseFi** adalah aplikasi *personal finance* dan *habit-tracking* berbasis browser yang bertujuan membantu pengguna mengelola keuangan pribadi mereka secara lebih sadar dan konsisten. Antarmuka aplikasi sepenuhnya menggunakan Bahasa Indonesia.

### Tujuan Aplikasi

PulseFi dirancang untuk membantu pengguna:

- Mencatat pemasukan dan pengeluaran
- Memahami pola pengeluaran mereka
- Melacak target tabungan (savings goals)
- Membangun kebiasaan finansial yang baik
- Menerima insight finansial berbasis aturan (rule-based)
- Mensimulasikan berbagai skenario pengeluaran
- Melakukan check-in harian terhadap kebiasaan finansial

### Catatan Penting

PulseFi saat ini adalah **prototipe frontend** yang berjalan sepenuhnya di browser. Tidak ada backend, database, atau server yang terlibat — seluruh data disimpan secara lokal di browser pengguna. Lihat bagian [Keterbatasan Teknis Saat Ini](#13-keterbatasan-teknis-saat-ini) untuk detail lengkap.

---

## Fitur Unggulan

| Fitur | Deskripsi |
|---|---|
| **Financial Score** | Skor finansial 0–100 yang dihitung dari saving rate, rasio pengeluaran-pemasukan, konsistensi belanja, dan lainnya. |
| **Financial Pulse** | Animasi garis "pulse" yang berdetak lebih cepat saat skor rendah dan lebih tenang saat skor tinggi. |
| **Transaction Management** | Pencatatan, pengeditan, pencarian, filter, dan sorting transaksi income/expense secara lengkap. |
| **Savings Goals** | Pembuatan dan pelacakan target tabungan dengan proyeksi kecepatan menabung mingguan. |
| **Rule-Based Insights** | Deteksi pola pengeluaran (kenaikan, kategori baru, pembelian besar, dsb.) tanpa AI eksternal. |
| **Habit Check-In** | Modal check-in harian untuk melacak hingga tiga kebiasaan aktif beserta streak-nya. |
| **What-If Simulator** | Simulasi skenario finansial hipotetis dibandingkan dengan kondisi keuangan saat ini. |

---

## Teknologi

```
Markup / Style : HTML5, CSS3, Tailwind CSS (via CDN)
Scripting      : Vanilla JavaScript (modular per-halaman)
Fonts          : Inter (teks antarmuka), Instrument Serif (heading ekspresif)
Storage        : Browser localStorage (tanpa backend/database)
Charts         : Custom chart rendering (chart.js — modul internal proyek)
```

> Catatan: `chart.js` di sini merujuk pada modul internal proyek untuk merender grafik transaksi dan finansial, bukan library eksternal Chart.js — sesuaikan jika proyek Anda memang menggunakan library tersebut.

---

## 1. Landing Page

**File:** `index.html`

Landing page bersifat promosional dan **tidak terhubung ke backend apa pun**.

### Konten

- **Hero section** dengan tagline *"Kebiasaan Baik, Finansial Naik"*
- Branding PulseFi dan visual card artwork
- Tombol CTA yang mengarah ke halaman login
- **Statistics section**, menampilkan:
  - Jumlah pengguna aktif
  - Persentase kepuasan/keterbantuan pengguna
  - Akumulasi tabungan pengguna
- **Feature section** yang menjelaskan:
  - Literasi finansial
  - Pembentukan kebiasaan (habit building)
  - Kesadaran finansial (financial awareness)
- **Quote section**
- **Testimonial carousel**
- Navigasi responsif untuk desktop dan mobile

### Script Pendukung

| File | Fungsi |
|---|---|
| `navbar.js` | Navigasi desktop & mobile |
| `hero.js` | Interaksi dan animasi hero section |
| `stats.js` | Render statistik landing page |
| `features.js` | Render feature section |
| `quote.js` | Render quote section |
| `testimonial.js` | Carousel testimonial |

---

## 2. Login dan Signup

**File:** `login.html`

### Fitur

- Login
- Signup, dengan mode switching antara Login ⇄ Signup
- Input nama lengkap (saat signup)
- Input email
- Input password dengan toggle visibility
- Input pemasukan bulanan (saat signup)
- Pesan sukses & error inline
- Transisi animasi antara form login/signup
- Redirect otomatis ke dashboard setelah autentikasi berhasil

### Script Pendukung

- `auth.js` — logika autentikasi inti
- `auth-ui.js` — interaksi dan state UI form

### ⚠️ Keterbatasan Penting

Ini **bukan sistem autentikasi sungguhan**. Akun disimpan langsung di browser storage:

- Password disimpan sebagai **plain text** di `localStorage`
- **Tidak ada** server, database, enkripsi, password hashing, atau API
- Cocok hanya untuk keperluan **prototipe**, tidak untuk penggunaan produksi

---

## 3. Dashboard

**File:** `dashboard.html`

Halaman utama setelah login, menampilkan ringkasan kondisi finansial pengguna.

### Konten

- Sapaan menggunakan nama pengguna yang tersimpan
- **Financial score** (0–100)
- **Animated financial pulse line**
- Rata-rata nilai transaksi
- Grafik transaksi
- Total pemasukan
- Total pengeluaran
- Saldo bersih (net balance)
- Peringatan atau rekomendasi finansial utama
- Klasifikasi **Financial Twin**

### Script Pendukung

- `dashboard.js`
- `calculation.js`
- `chart.js`
- `insights.js`

### Cara Kerja Financial Score

Skor finansial dihitung berdasarkan:

- Saving rate
- Rasio pengeluaran terhadap pemasukan (expense-to-income ratio)
- Konsistensi pengeluaran
- Frekuensi transaksi
- Perilaku belanja
- Progres target tabungan

Animasi *financial pulse* akan **berdetak lebih cepat saat skor rendah** dan **lebih tenang saat skor tinggi**, memberikan representasi visual langsung dari kesehatan finansial pengguna.

---

## 4. Transactions

**File:** `transactions.html`

### Fitur

- Tambah transaksi pemasukan (income)
- Tambah transaksi pengeluaran (expense)
- Pilih kategori transaksi
- Input jumlah
- Pilih tanggal
- Deskripsi opsional
- Edit transaksi
- Hapus transaksi
- Pencarian transaksi
- Filter berdasarkan tipe (income/expense)
- Filter berdasarkan kategori
- Sorting:
  - Terbaru (Newest)
  - Terlama (Oldest)
  - Jumlah terbesar
  - Jumlah terkecil
- Ringkasan total transaksi
- Grafik transaksi
- Tips finansial yang dihasilkan otomatis

### Script Pendukung

| File | Fungsi |
|---|---|
| `tx-form.js` | Form input/edit transaksi |
| `tx-list.js` | Render dan manajemen daftar transaksi |
| `tx-insight.js` | Tips finansial berbasis data transaksi |
| `transaction.js` | Logika inti transaksi |
| `categories.js` | Definisi dan pengelolaan kategori |
| `chart.js` | Rendering grafik transaksi |

### Struktur Data Transaksi

Setiap transaksi disimpan dengan struktur berikut:

```json
{
  "id": "string",
  "type": "income | expense",
  "category": "string",
  "amount": "number",
  "date": "string",
  "description": "string (opsional)",
  "isDemo": "boolean",
  "createdAt": "timestamp"
}
```

---

## 5. Savings Goals

**File:** `goals.html`

### Fitur

- Membuat target tabungan baru
- Menetapkan nama target
- Menetapkan jumlah target
- Menetapkan jumlah yang sudah tersimpan
- Menetapkan tenggat waktu (deadline)
- Melihat persentase progres
- Menambah dana ke target yang sudah ada
- Mengedit target
- Menghapus target
- Melihat sisa jumlah yang dibutuhkan
- Melihat rekomendasi kecepatan menabung mingguan
- Melihat status target: selesai atau tertinggal dari jadwal

### Script Pendukung

- `goals.js`
- `goals.css`

### Struktur Data Goal

```json
{
  "id": "string",
  "name": "string",
  "targetAmount": "number",
  "currentAmount": "number",
  "deadline": "string",
  "createdAt": "timestamp"
}
```

---

## 6. Financial Insights

**File:** `insights.html`

Halaman insight menampilkan analisis mendalam terhadap perilaku finansial pengguna, sepenuhnya **berbasis aturan (rule-based)** tanpa layanan atau API AI eksternal.

### Ditampilkan

- Financial score
- Tipe **Financial Twin**
- Bar kategori pengeluaran
- Pola pengeluaran yang terdeteksi
- Rekomendasi aksi
- Saran kebiasaan (habit suggestions)

### Pola yang Dapat Dideteksi

- Pengeluaran meningkat atau menurun dalam periode terakhir
- Kategori pengeluaran baru
- Pembelian berulang
- Frekuensi transaksi tinggi
- Pembelian dalam jumlah besar
- Pengeluaran tinggi di akhir pekan
- Saving rate negatif
- Saving rate positif
- Konsentrasi pengeluaran pada satu kategori
- Pengeluaran berulang/mirip langganan (subscription-like)
- Target tabungan yang mendekati selesai

### Script Pendukung

- `insights.js`
- `insights-page.js`
- `calculation.js`

---

## 7. Habit Check-In

**Script utama:** `checkin.js`

Fitur check-in harian membantu pengguna melacak kebiasaan finansial mereka secara konsisten.

### Untuk Pengguna Lama (Returning Users)

- Menampilkan hingga tiga kebiasaan aktif
- Kartu pemilihan kebiasaan (habit selection cards)
- Pemilihan penyelesaian harian
- State konfirmasi beranimasi
- Grafik penyelesaian mingguan
- Pembaruan streak kebiasaan

### Perilaku Modal

- Muncul di halaman dashboard
- Membutuhkan sesi login aktif
- Muncul **maksimal satu kali per hari kalender**
- Tanggal kemunculan modal disimpan di `localStorage`

Modal akan ditutup untuk hari tersebut ketika pengguna:

1. Menyelesaikan check-in
2. Melewati (skip) check-in
3. Menutup state ringkasan (summary state)

> **Catatan:** Pengguna baru yang belum memiliki transaksi, target tabungan, atau kebiasaan **akan dilewati** oleh logika check-in saat ini.

### Struktur Data Habit

```json
{
  "id": "string",
  "title": "string",
  "detail": "string",
  "target": "number",
  "progress": "number",
  "streak": "number",
  "completedDates": ["string"],
  "status": "string",
  "createdAt": "timestamp"
}
```

### ⚠️ Catatan File Prototipe

`check-in-modal.html` adalah **versi prototipe standalone**. Dashboard sebenarnya menggunakan modal yang **dibangkitkan secara dinamis dari `checkin.js`**, bukan halaman standalone tersebut.

---

## 8. What-If Simulator

**File:** `simulator.html`

Simulator ini menggabungkan pelacakan kebiasaan dengan simulasi finansial, membantu pengguna membandingkan perilaku finansial saat ini dengan skenario hipotetis.

### Konten

- Grafik intensitas kebiasaan mingguan
- Tampilan kebiasaan bulanan
- Checklist harian
- Field kondisi finansial saat ini
- Field skenario:
  - Skenario pemasukan
  - Skenario pengeluaran makanan & kopi
  - Skenario pengeluaran hiburan & belanja
  - Pengeluaran lainnya
- Proyeksi selisih bulanan
- Proyeksi selisih tahunan
- Estimasi tabungan bulanan baru
- Tombol penerapan skenario

### Script Pendukung

Logika utama berada di `js/simulator.js`. 

> **Catatan teknis:** Halaman simulator saat ini juga memiliki cukup banyak logika inline langsung di `simulator.html`, sehingga terdapat implementasi yang tumpang tindih (*overlapping implementations*) antara file JS dan kode inline di area ini. Ini menjadi salah satu kandidat refactor di masa depan.

---

## 9. Shared Storage

**File:** `storage.js`

Lapisan data pusat (central data layer) yang mengelola seluruh data aplikasi, meliputi:

- Transaksi
- Target tabungan (goals)
- Kebiasaan (habits)
- Profil pengguna
- Status onboarding
- Tanggal prompt check-in harian

### ⚠️ Penting

- Aplikasi **tidak menggunakan backend apa pun**
- Seluruh data hanya ada di **browser yang membuka aplikasi**
- **Menghapus browser storage akan menghapus akun beserta seluruh data finansial** secara permanen

---

## 10. Shared Utilities

**File:** `app.js`

Menyediakan fungsi-fungsi bantu lintas halaman:

- Format mata uang dalam Rupiah Indonesia
- Format mata uang ringkas (compact currency)
- Format tanggal
- HTML escaping
- Notifikasi toast
- Animasi angka (number animations)
- Perilaku navigasi
- Animasi scroll reveal
- Helper redirect onboarding

---

## 11. Sidebar dan Navigasi

Halaman-halaman yang membutuhkan autentikasi menggunakan **sidebar collapsible** dengan tautan ke:

- Dashboard
- Transactions
- Tabungan
- Pola Finansial
- Kebiasaan

### Fitur Sidebar

- Mode collapse untuk desktop
- Perilaku off-canvas untuk mobile
- Highlight halaman aktif
- Status collapsed tersimpan (persisted)

**Controller:** `sidebar.js`

Preferensi sidebar collapsed disimpan di `localStorage`.

---

## 12. Visual System

### Tipografi

- **Inter** — teks antarmuka
- **Instrument Serif** — heading ekspresif

### Styling

- **Tailwind CSS** via CDN pada beberapa halaman
- File CSS kustom untuk setiap area utama aplikasi
- Layout responsif
- Kartu (card) dengan sudut membulat (rounded)
- Palet visual: **ungu, hitam, putih, dan abu-abu muda**
- Animasi: blur, fade, slide-up, dan reveal
- Aset ilustrasi SVG dan ikon

### Stylesheet Utama

| File | Cakupan |
|---|---|
| `style.css` | Gaya global aplikasi |
| `goals.css` | Halaman Savings Goals |
| `insights.css` | Halaman Financial Insights |
| `hero.css` | Hero section landing page |
| `features.css` | Feature section landing page |
| `stats.css` | Statistics section landing page |
| `quote.css` | Quote section landing page |
| `testimonial.css` | Testimonial carousel |

---

## Struktur Proyek

```
project-root/
├── index.html                 # Landing page
├── login.html                 # Login & Signup
├── dashboard.html              # Dashboard utama
├── transactions.html           # Manajemen transaksi
├── goals.html                  # Savings goals
├── insights.html                # Financial insights
├── simulator.html               # What-if simulator
├── sidebar.html                 # (prototipe standalone)
├── check-in-modal.html          # (prototipe standalone)
├── js/
│   ├── navbar.js
│   ├── hero.js
│   ├── stats.js
│   ├── features.js
│   ├── quote.js
│   ├── testimonial.js
│   ├── auth.js
│   ├── auth-ui.js
│   ├── dashboard.js
│   ├── calculation.js
│   ├── chart.js
│   ├── insights.js
│   ├── insights-page.js
│   ├── tx-form.js
│   ├── tx-list.js
│   ├── tx-insight.js
│   ├── transaction.js
│   ├── categories.js
│   ├── goals.js
│   ├── checkin.js
│   ├── simulator.js
│   ├── sidebar.js
│   ├── storage.js
│   └── app.js
├── css/
│   ├── style.css
│   ├── goals.css
│   ├── insights.css
│   ├── hero.css
│   ├── features.css
│   ├── stats.css
│   ├── quote.css
│   └── testimonial.css
└── assets/                     # Gambar, ikon, dan aset SVG
```

> Struktur di atas disusun berdasarkan deskripsi fitur proyek. Sesuaikan dengan struktur folder aktual pada repository Anda jika terdapat perbedaan penamaan atau organisasi file.

---

## Instalasi & Setup

Karena PulseFi adalah aplikasi frontend murni tanpa backend, instalasinya sangat sederhana.

### Prerequisites

- Browser modern (Chrome, Firefox, Edge, atau Safari terbaru)
- Koneksi internet (untuk memuat Tailwind CSS via CDN dan Google Fonts)
- (Opsional) Local server sederhana untuk menghindari isu CORS/module loading

### Langkah Instalasi

#### 1. Clone Repository

```bash
git clone https://github.com/[username]/pulsefi.git
cd pulsefi
```

#### 2. Jalankan Aplikasi

**Opsi A — Buka langsung:**

Buka `index.html` langsung di browser.

**Opsi B — Menggunakan local server (direkomendasikan):**

```bash
# Menggunakan Python
python3 -m http.server 5500

# Atau menggunakan Node.js (npx serve)
npx serve .
```

Lalu buka `http://localhost:5500` (atau port yang sesuai) di browser.

### Reset Data Aplikasi

Karena semua data disimpan di `localStorage`, Anda dapat mereset seluruh data aplikasi (akun, transaksi, goals, habits) dengan cara:

1. Membuka Developer Tools browser (`F12`)
2. Masuk ke tab **Application** → **Local Storage**
3. Menghapus entri yang berkaitan dengan PulseFi

⚠️ Tindakan ini **tidak bisa dibatalkan** dan akan menghapus seluruh akun serta data finansial yang tersimpan.

---

## 13. Keterbatasan Teknis Saat Ini

PulseFi saat ini adalah **prototipe frontend yang solid dan fungsional**, namun **belum siap untuk produksi multi-pengguna**. Keterbatasan utama:

- X Tidak ada backend sungguhan
- X Autentikasi hanya berjalan di sisi client (client-side only)
- X Password disimpan sebagai **plain text** di `localStorage`
- X Data tidak tersinkronisasi antar perangkat
- X Data tidak dibagikan antar pengguna
- X Tidak ada validasi sisi server
- X Tidak ada database sungguhan
- X Tidak ada integrasi AI sungguhan (insight bersifat rule-based)
- X Bergantung pada resource CDN eksternal (Tailwind, Google Fonts)
- X Masih terdapat file prototipe standalone dalam proyek, seperti `sidebar.html` dan `check-in-modal.html`
- X Beberapa modul lama dan implementasi duplikat masih ada berdampingan dengan alur aplikasi saat ini (khususnya di area simulator)

**Ringkasnya:** PulseFi adalah frontend prototype yang matang secara visual, dengan penyimpanan data lokal browser yang fungsional, kalkulasi finansial, habit tracking, savings goals, insight, dan simulasi yang bekerja — namun belum menjadi aplikasi multi-pengguna siap produksi.

---

## Roadmap

Berikut adalah arah pengembangan yang disarankan untuk membawa PulseFi ke tahap produksi:

- [ ] Membangun backend nyata (mis. Node.js/Express, atau BaaS seperti Supabase/Firebase)
- [ ] Implementasi autentikasi sungguhan dengan password hashing (bcrypt/argon2)
- [ ] Migrasi penyimpanan data ke database (PostgreSQL/MongoDB)
- [ ] Sinkronisasi data lintas perangkat
- [ ] Validasi input di sisi server
- [ ] Membersihkan file prototipe standalone (`sidebar.html`, `check-in-modal.html`)
- [ ] Merapikan duplikasi logika di `simulator.html` dan `js/simulator.js`
- [ ] Mengevaluasi integrasi AI generatif untuk insight yang lebih adaptif (opsional)
- [ ] Self-hosting font & aset untuk mengurangi ketergantungan CDN

---

## Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE) — lihat file LICENSE untuk detail lebih lanjut.

---

<div align="center">

**PulseFi** — Kebiasaan Baik, Finansial Naik

</div>