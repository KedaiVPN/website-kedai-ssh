
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const serversRoute = require('./routes/getServers');
const createAccountRoute = require('./routes/createAccount');
const deleteAccountRoute = require('./routes/deleteAccount');
const renewAccountRoute = require('./routes/renewAccount');
const getUserAccountsRoute = require('./routes/getUserAccounts');
const balanceRoute = require('./routes/balance'); // Add balance route
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/servers', serversRoute);
app.use('/api/create', createAccountRoute);
app.use('/api/delete', deleteAccountRoute);
app.use('/api/renew', renewAccountRoute);
app.use('/api/accounts', getUserAccountsRoute);
app.use('/api/balance', balanceRoute); // Add balance route
app.use('/api/admin', adminRoutes);

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
