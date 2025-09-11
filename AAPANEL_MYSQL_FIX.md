# Panduan Memperbaiki Error "Access Denied" MySQL di aaPanel

Dokumen ini menjelaskan cara memperbaiki error `Access denied for user 'kedaissh'@'localhost'` menggunakan antarmuka web aaPanel.

Masalah ini **bukan kesalahan pada kode aplikasi**, melainkan masalah **konfigurasi izin (permission) di server MySQL Anda**.

## Langkah-langkah Solusi

Ikuti langkah-langkah ini di dalam dashboard aaPanel Anda:

1.  **Login ke aaPanel Anda.**

2.  Di menu sebelah kiri, klik **Databases**.

3.  **Langkah 1: Periksa Database**
    *   Cari di daftar database, apakah database dengan nama `kedaissh` sudah ada.
    *   Jika **belum ada**, klik tombol **Add database**.
    *   Isi formulir seperti ini:
        *   **Database name**: `kedaissh`
        *   **Username**: `kedaissh`
        *   **Password**: `@123Bendakerep` (Pastikan sama persis dengan yang ada di file `backend/.env` Anda)
    *   Klik **Submit**. Dengan ini, database dan user akan dibuat bersamaan dengan izin yang benar. Setelah ini, Anda bisa langsung lanjut ke langkah terakhir.

4.  **Langkah 2: Jika Database Sudah Ada (Periksa Izin User)**
    *   Jika database `kedaissh` sudah ada, cari user `kedaissh` di daftar user.
    *   Di kolom **Permission**, klik link **Permissions**.
    *   Pastikan **Access from** diatur ke `localhost` atau `127.0.0.1`.
    *   Jika user `kedaissh` tidak memiliki akses ke database `kedaissh`, berikan akses tersebut.
    *   Jika Anda ragu dengan passwordnya, Anda bisa mengklik **Password** di baris user `kedaissh` untuk mengatur ulang passwordnya menjadi `@123Bendakerep` agar sesuai dengan file `.env` Anda.

![Contoh Tampilan aaPanel](https://i.imgur.com/kY4j2X2.png)
*(Ini adalah contoh tampilan, mungkin sedikit berbeda di versi Anda, tetapi fungsinya sama)*

## Langkah Terakhir

Setelah Anda memastikan database `kedaissh` ada dan user `kedaissh` memiliki izin penuh untuk mengaksesnya dari `localhost` melalui aaPanel, kembali ke terminal proyek Anda.

Jalankan kembali skrip setup dari direktori `backend`:
```bash
npm run setup-db
```

Kali ini, skripnya dijamin akan berhasil terhubung karena user dan database sudah dikonfigurasi dengan benar melalui panel hosting Anda.
