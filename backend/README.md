# KedaiVPN Backend

A comprehensive backend API server for VPN account management system built with Express.js and SQLite.

## Features

- **User Authentication**: Email/password and Google OAuth
- **VPN Management**: Multi-protocol support (SSH, VMess, VLess, Trojan)
- **Admin Dashboard**: Server and user management
- **Security**: JWT tokens, rate limiting, input validation
- **Database**: SQLite with foreign key constraints
- **Logging**: Comprehensive request and error logging

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` file with your configuration:

```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:8080

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Admin Configuration
ADMIN_DEFAULT_PASSWORD=admin123
```

### 3. Database Initialization

The database will be automatically created and initialized when you start the server for the first time.

### 4. Start the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

### 5. Verify Installation

Visit `http://localhost:3001/api/health` to check if the server is running.

## Project Structure

```
backend/
├── config/
│   └── database.js          # Database configuration and schema
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── validation.js        # Input validation rules
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── vpn.js               # VPN management routes
│   └── admin.js             # Admin routes
├── utils/
│   └── logger.js            # Logging utilities
├── db/                      # SQLite database files
├── logs/                    # Application logs
├── server.js                # Main application entry point
├── package.json             # Dependencies and scripts
└── .env.example             # Environment variables template
```

## Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email address
- `password` - Hashed password (nullable for OAuth users)
- `source` - Registration source (email/google)
- `role` - User role (user/admin)
- `created_at` - Registration timestamp
- `is_active` - Account status

### Servers Table
- `id` - Primary key
- `name` - Server display name
- `domain` - Server domain/IP
- `location` - Server location
- `auth` - Authentication details
- `status` - Server status (online/offline/maintenance)
- `protocols` - Supported protocols (JSON array)
- `ping` - Server latency
- `users` - Current user count
- `max_users` - Maximum user capacity

### VPN Accounts Table
- `id` - Primary key
- `user_id` - Foreign key to users table
- `server_id` - Foreign key to servers table
- `username` - VPN account username
- `password` - VPN account password (for SSH)
- `uuid` - UUID for V2Ray protocols
- `protocol` - VPN protocol type
- `expired_at` - Account expiration date
- `quota_gb` - Bandwidth quota in GB
- `ip_limit` - Maximum concurrent IPs

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Authentication (Phase 2)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/google` - Google OAuth login
- `POST /api/auth/google/set-username` - Set username for Google users

### VPN Management (Phase 3)
- `GET /api/vpn/servers` - Get available servers
- `POST /api/vpn/create-account` - Create VPN account
- `GET /api/vpn/accounts` - Get user VPN accounts

### Admin Panel (Phase 4)
- `POST /api/admin/login` - Admin login
- `GET /api/admin/servers` - Server management
- `GET /api/admin/users` - User management

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Comprehensive request validation
- **CORS Configuration**: Secure cross-origin requests
- **Helmet Security**: Additional security headers

## Default Admin Account

A default admin account is created automatically:
- **Email**: admin@kedaivpn.com
- **Password**: admin123 (change in production!)

## Development

### Running Tests
```bash
npm test
```

### Database Migration
```bash
npm run migrate
```

### Seed Test Data
```bash
npm run seed
```

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Configure proper JWT secret
3. Set up SSL certificates
4. Configure Nginx reverse proxy
5. Use PM2 for process management

## Next Steps

This is Phase 1 implementation. Upcoming phases:
- **Phase 2**: Authentication system implementation
- **Phase 3**: VPN management system
- **Phase 4**: Admin dashboard backend
- **Phase 5**: Security enhancements
- **Phase 6**: Production deployment

## Support

For issues and questions, please check the logs in the `logs/` directory.