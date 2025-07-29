# KedaiVPN - Platform VPN Management

Platform manajemen VPN lengkap dengan frontend React dan backend Express.js untuk mengelola akun VPN SSH, VMess, VLess, dan Trojan.

## 🚀 Fitur Utama

### Frontend (React + Vite)
- ✅ Authentication (Email/Password + Google OAuth)
- ✅ Dashboard pengguna dengan manajemen akun VPN
- ✅ Pemilihan protokol dan server VPN
- ✅ Interface admin untuk manajemen server dan pengguna
- ✅ Theme dark/light mode
- ✅ Responsive design dengan Tailwind CSS

### Backend (Express.js + SQLite)
- ✅ RESTful API dengan JWT authentication
- ✅ Google OAuth integration
- ✅ Database SQLite dengan schema lengkap
- ✅ Middleware validasi dan security
- ✅ Logging dan error handling
- ✅ Rate limiting dan CORS protection

## 📋 Prerequisites

Sebelum memulai, pastikan sistem Anda memiliki:

- **Node.js** (versi 16 atau lebih tinggi)
- **npm** atau **yarn**
- **Git**

Untuk deployment:
- **Ubuntu/CentOS server**
- **Nginx**
- **PM2** (untuk process management)
- **Domain name** (opsional tapi direkomendasikan)

## 🛠️ Installation & Development

### 1. Clone Repository

```bash
git clone <repository-url>
cd kedaivpn
```

### 2. Backend Setup

```bash
# Masuk ke folder backend
cd backend

# Install dependencies
npm install

# Copy dan edit environment variables
cp .env.example .env
nano .env

# Edit file .env sesuai kebutuhan:
# PORT=3001
# JWT_SECRET=your_super_secret_jwt_key_here
# ADMIN_DEFAULT_PASSWORD=admin123
# GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret

# Initialize database
npm run migrate

# Start development server
npm run dev
```

Backend akan berjalan di `http://localhost:3001`

### 3. Frontend Setup

```bash
# Masuk ke folder frontend (root project)
cd ..

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend akan berjalan di `http://localhost:8080`

### 4. Verifikasi Installation

- **Frontend**: Buka `http://localhost:8080`
- **Backend Health Check**: Buka `http://localhost:3001/api/health`
- **Admin Login**: Email `admin@kedaivpn.com`, Password `admin123`

## 🏗️ Project Structure

```
kedaivpn/
├── backend/                 # Backend Express.js
│   ├── config/             # Database configuration
│   ├── middleware/         # Auth & validation middleware
│   ├── routes/            # API routes
│   ├── utils/             # Utilities (logger)
│   ├── db/                # SQLite database files
│   ├── .env.example       # Environment variables template
│   ├── package.json       # Backend dependencies
│   └── server.js          # Main backend entry point
├── src/                   # Frontend React source
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── services/         # API services
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   └── main.tsx          # Frontend entry point
├── public/               # Static assets
├── dist/                 # Build output (generated)
├── nginx.conf           # Nginx configuration
├── DEPLOYMENT.md        # Deployment guide
└── package.json         # Frontend dependencies
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  source TEXT NOT NULL DEFAULT 'email',
  role TEXT NOT NULL DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1
);
```

### Servers Table
```sql
CREATE TABLE servers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  location TEXT NOT NULL,
  auth TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'online',
  protocols TEXT NOT NULL,
  ping INTEGER DEFAULT 0,
  users INTEGER DEFAULT 0,
  max_users INTEGER DEFAULT 100,
  batas_create_akun INTEGER DEFAULT 50,
  total_create_akun INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1
);
```

### VPN Accounts Table
```sql
CREATE TABLE vpn_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  server_id INTEGER NOT NULL,
  username TEXT NOT NULL,
  password TEXT,
  uuid TEXT,
  protocol TEXT NOT NULL,
  domain TEXT NOT NULL,
  expired_at DATETIME NOT NULL,
  quota_gb INTEGER,
  ip_limit INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (server_id) REFERENCES servers(id)
);
```

## 🚀 Production Deployment

### Method 1: Manual Server Setup

#### 1. Server Preparation

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install SSL certificates (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx -y
```

#### 2. Upload Project ke Server

```bash
# Method 1: Git clone
git clone <repository-url> /var/www/kedaivpn
cd /var/www/kedaivpn

# Method 2: SCP upload
scp -r ./kedaivpn user@server:/var/www/

# Set permissions
sudo chown -R www-data:www-data /var/www/kedaivpn
sudo chmod -R 755 /var/www/kedaivpn
```

#### 3. Backend Production Setup

```bash
cd /var/www/kedaivpn/backend

# Install production dependencies
npm ci --production

# Setup environment variables
sudo cp .env.example .env
sudo nano .env

# Edit .env untuk production:
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://yourdomain.com
JWT_SECRET=your_very_secure_jwt_secret_for_production
ADMIN_DEFAULT_PASSWORD=secure_admin_password
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback

# Initialize database
npm run migrate

# Start with PM2
pm2 start server.js --name "kedaivpn-backend"
pm2 save
pm2 startup
```

#### 4. Frontend Production Build

```bash
cd /var/www/kedaivpn

# Install dependencies
npm ci

# Build untuk production
npm run build

# Files akan tersedia di folder dist/
```

#### 5. Nginx Configuration

```bash
# Backup default config
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# Create new site config
sudo nano /etc/nginx/sites-available/kedaivpn

# Masukkan konfigurasi berikut:
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/kedaivpn/dist;
    index index.html;

    # Handle SPA routing - redirect all routes to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/kedaivpn /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### 6. SSL Certificate Setup

```bash
# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal setup
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### Method 2: Using aaPanel (Shared Hosting)

#### 1. Build Project Locally

```bash
# Backend build
cd backend
npm ci --production
# Upload semua file backend ke server

# Frontend build
cd ..
npm ci
npm run build
# Upload folder dist/ sebagai document root website
```

#### 2. aaPanel Configuration

1. **Create Website** di aaPanel dengan domain Anda
2. **Upload Files**:
   - Upload folder `dist/` ke document root
   - Upload folder `backend/` ke folder di luar document root
3. **Database Setup**: Gunakan file SQLite atau setup MySQL jika diperlukan
4. **Environment Variables**: Setup melalui Node.js app manager di aaPanel
5. **Nginx Config**: Edit sesuai dengan `nginx.conf` yang disediakan

#### 3. Process Management

```bash
# Setup Node.js app di aaPanel
# Point ke backend/server.js
# Set environment variables sesuai kebutuhan
```

## 🔧 Environment Variables

### Backend (.env)

```bash
# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_change_this
JWT_EXPIRES_IN=7d

# Admin Configuration
ADMIN_DEFAULT_PASSWORD=secure_admin_password

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback

# Database Configuration
DB_PATH=./db/kedaivpn.db

# VPN Server Configuration
VPN_API_TIMEOUT=30000
VPN_API_RETRY_ATTEMPTS=3

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/kedaivpn.log
```

## 🧪 Testing

### Backend API Testing

```bash
# Health check
curl http://localhost:3001/api/health

# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123","confirm":"password123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"test@example.com","password":"password123"}'
```

### Frontend Testing

```bash
# Build test
npm run build

# Preview build
npm run preview
```

## 🔍 Monitoring & Logging

### PM2 Monitoring

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs kedaivpn-backend

# Restart application
pm2 restart kedaivpn-backend

# Check status
pm2 status
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### Application Logs

```bash
# Backend logs
tail -f /var/www/kedaivpn/backend/logs/kedaivpn.log

# PM2 logs
pm2 logs --lines 100
```

## 🐛 Troubleshooting

### Common Issues

#### 1. 404 Error pada React Routes
**Problem**: Route seperti `/admin` mengembalikan 404
**Solution**: Pastikan Nginx dikonfigurasi dengan `try_files $uri $uri/ /index.html;`

#### 2. Backend API Connection Failed
**Problem**: Frontend tidak dapat terkoneksi ke backend
**Solution**: 
- Periksa PM2 status: `pm2 status`
- Periksa port backend: `netstat -tlnp | grep 3001`
- Periksa firewall: `sudo ufw status`

#### 3. Database Connection Error
**Problem**: SQLite database tidak dapat diakses
**Solution**:
- Periksa file permissions: `ls -la backend/db/`
- Periksa path database di .env
- Initialize database: `npm run migrate`

#### 4. Google OAuth Not Working
**Problem**: Google login redirect error
**Solution**:
- Periksa Google Console credentials
- Pastikan callback URL sesuai di Google Console
- Periksa environment variables GOOGLE_*

#### 5. SSL Certificate Issues
**Problem**: HTTPS tidak bekerja
**Solution**:
```bash
# Renew certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates

# Test SSL configuration
curl -I https://yourdomain.com
```

### Performance Optimization

#### 1. Nginx Optimization

```nginx
# Add to nginx.conf
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Enable caching
location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### 2. PM2 Cluster Mode

```bash
# Start multiple instances
pm2 start server.js --name kedaivpn-backend -i max

# Save configuration
pm2 save
```

#### 3. Database Optimization

```sql
-- Add indexes untuk performance
CREATE INDEX IF NOT EXISTS idx_vpn_accounts_user_id ON vpn_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_vpn_accounts_server_id ON vpn_accounts(server_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

## 🔐 Security Best Practices

### 1. Environment Variables
- Selalu gunakan environment variables untuk data sensitif
- Jangan commit file `.env` ke repository
- Gunakan JWT secret yang kuat untuk production

### 2. Database Security
- Gunakan prepared statements (sudah diimplementasi)
- Regular backup database
- Batasi akses file database

### 3. Server Security
```bash
# Setup firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no

# Regular updates
sudo apt update && sudo apt upgrade -y
```

### 4. Application Security
- Rate limiting sudah diaktifkan
- CORS protection diimplementasi
- Input validation dengan express-validator
- Password hashing dengan bcrypt

## 📞 Support

Jika mengalami masalah saat deployment atau development:

1. **Check Logs**: Selalu periksa logs terlebih dahulu
2. **Documentation**: Baca kembali dokumentasi ini
3. **Common Issues**: Lihat bagian troubleshooting
4. **Community**: Bergabung dengan komunitas developer

## 📝 License

MIT License - lihat file LICENSE untuk detail lengkap.

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push ke branch
5. Create Pull Request

---

**Happy Coding! 🚀**
