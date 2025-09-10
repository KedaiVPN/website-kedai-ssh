# Migration Guide: SQLite to MySQL

This document outlines the steps required to run the application after its database was migrated from SQLite to MySQL.

## Prerequisites

1.  **MySQL Server**: You must have a MySQL server installed and running. You can install it locally, use a service like XAMPP/MAMP, or run it via Docker.
2.  **Node.js and Bun**: Ensure you have Node.js and the Bun runtime installed to manage packages and run the application.

## Setup Instructions

Follow these steps carefully to set up your local environment.

### 1. Configure Environment Variables

In the `backend/` directory, create a new file named `.env`. You can do this by copying the example file:

```bash
# From the project's root directory
cp backend/.env.example backend/.env
```

Next, open `backend/.env` with a text editor and fill in the `DATABASE CONFIGURATION` section with your MySQL server details.

**Example:**
```
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_DATABASE=kedaivpn_db
DB_PORT=3306
```

-   Replace `your_mysql_user` and `your_mysql_password` with your actual MySQL credentials.
-   `DB_DATABASE` can be any name you choose for your database (e.g., `kedaivpn_db`). The setup script will create it for you.

### 2. Install Dependencies

Navigate to the `backend` directory in your terminal and install the updated Node.js dependencies using Bun. This will install the `mysql2` driver and ensure `sqlite3` is removed.

```bash
cd backend
bun install
```

### 3. Set Up the Database

Make sure your MySQL server is running. Then, from the `backend` directory, run the database setup script. This script will automatically connect to your MySQL server, create the database specified in your `.env` file, and then create all the necessary tables and indexes.

```bash
# Make sure you are in the 'backend' directory
bun run setup-db
```

You should see log messages indicating that the database and tables were created successfully.

### 4. Start the Application

You are now ready to start the backend server. From the `backend` directory, run:

```bash
bun start
```

If everything is configured correctly, the server will start, and you will see the message: "Successfully connected to the MySQL database pool."

## Cleanup

The old SQLite database file (`backend/db/database.sqlite`) is no longer used by the application. If you have an old version of this file in your project, it can be safely deleted. The new setup script does not create or manage this file.
