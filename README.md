# Belajar Jarimatika

Game edukasi interaktif untuk remaja belajar matematika (penjumlahan, pengurangan, perkalian, pembagian) menggunakan metode Jarimatika.

## Fitur
*   **4 Mode Operasi:** Tambah, Kurang, Kali, Bagi.
*   **Sistem Level:** Level 1 (Mudah) terbuka, level selanjutnya dibuka dengan XP.
*   **Visualisasi Tangan:** Animasi jari tangan kiri (puluhan) dan kanan (satuan) yang responsif.
*   **Penyimpanan Data:** Skor dan progres disimpan di Google Sheets secara real-time.
*   **Desain:** Modern, responsif, dan menarik.

## Cara Instalasi & Setup

### 1. Persiapan Aset Suara
Pastikan folder `sounds/` berisi file berikut:
*   `correct.wav`
*   `wrong.wav`
*   `click.wav`
*   `levelup.wav`

### 2. Setup Google Sheets & Apps Script (Backend)
Game ini menggunakan Google Sheets sebagai database.

1.  Buka Google Sheet: `https://docs.google.com/spreadsheets/d/1BBhLf8ZFPASNXVuajFhIH95ztipLT1ngANhVZkl_auY/edit?usp=sharing` (Pastikan Anda memiliki akses edit atau buat salinan).
2.  Di Google Sheet, klik **Extensions** > **Apps Script**.
3.  Hapus kode yang ada, lalu salin semua kode dari file `Code.gs` yang ada di repository ini.
4.  Klik tombol **Save** (ikon disket).
5.  **Deploy sebagai Web App:**
    *   Klik tombol **Deploy** (kanan atas) > **New deployment**.
    *   Pilih type: **Web app**.
    *   Description: "Jarimatika API v1".
    *   Execute as: **Me** (email Anda).
    *   Who has access: **Anyone** (Siapa saja). **PENTING: Harus "Anyone" agar game bisa mengaksesnya.**
    *   Klik **Deploy**.
6.  Salin **Web App URL** yang muncul (berawalan `https://script.google.com/macros/s/...`).

### 3. Konfigurasi Game (Frontend)
1.  Buka file `api.js` di text editor.
2.  Cari baris `BASE_URL: "",`.
3.  Tempel URL Web App Anda di antara tanda kutip.
    *   Contoh: `BASE_URL: "https://script.google.com/macros/s/AKfycbx.../exec",`
4.  Simpan file.

### 4. Cara Bermain
1.  Buka file `index.html` di browser (Chrome, Firefox, Edge).
2.  Masukkan nama pengguna.
3.  Pilih tantangan matematika.
4.  Jawab soal dengan melihat bantuan jari atau hitung sendiri!

## Struktur Folder
*   `index.html`: Halaman utama game.
*   `style.css`: Desain dan animasi.
*   `game.js`: Logika permainan (perhitungan, level, animasi jari).
*   `api.js`: Penghubung antara game dan Google Sheet.
*   `Code.gs`: Kode backend untuk Google Apps Script.

## Catatan
Jika URL API tidak diisi, game akan berjalan dalam **Mode Offline (Mock Mode)**, di mana progres tidak akan tersimpan ke Google Sheet.
