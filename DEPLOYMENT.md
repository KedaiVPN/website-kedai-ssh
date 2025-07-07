
# Deployment Guide - Nginx di aaPanel

## Masalah 404 pada Route SPA

Ketika aplikasi React sudah di-build dan di-deploy, route seperti `/admin` akan menghasilkan error 404. Ini terjadi karena Nginx mencari file fisik `/admin` yang tidak ada.

## Solusi untuk aaPanel + Nginx

### Langkah 1: Masuk ke aaPanel
1. Login ke panel aaPanel Anda
2. Pilih "Website" dari menu kiri
3. Klik "Manage" pada website yang ingin dikonfigurasi

### Langkah 2: Edit Konfigurasi Nginx
1. Klik tab "Config Files"
2. Pilih "Nginx Config"
3. Tambahkan konfigurasi berikut di dalam blok `server`:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Langkah 3: Contoh Konfigurasi Lengkap

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /www/wwwroot/your-domain.com/dist;
    index index.html;

    # Handle SPA routing - redirect semua route ke index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache untuk file static (opsional)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
```

### Langkah 4: Restart Nginx
1. Klik "Save" untuk menyimpan konfigurasi
2. Restart Nginx service melalui aaPanel atau jalankan:
   ```bash
   sudo systemctl restart nginx
   ```

### Langkah 5: Test
- Akses `https://your-domain.com/admin` langsung di browser
- Route `/admin` sekarang seharusnya berfungsi normal

## Penjelasan

- `try_files $uri $uri/ /index.html;` berarti:
  1. Coba akses file yang diminta ($uri)
  2. Jika tidak ada, coba sebagai direktori ($uri/)
  3. Jika keduanya tidak ada, kembalikan index.html

Dengan konfigurasi ini, semua route React Router akan berfungsi normal setelah deployment.

## Troubleshooting

Jika masih error 404:
1. Pastikan path `root` menuju ke folder `dist` hasil build
2. Pastikan file `index.html` ada di folder tersebut
3. Periksa error log Nginx: `/var/log/nginx/error.log`
4. Pastikan tidak ada konfigurasi lain yang konflik
