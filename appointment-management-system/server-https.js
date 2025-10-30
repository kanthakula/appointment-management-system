const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');

// Load the existing server.js as a module
const app = require('./server.js');

// HTTPS server configuration
const options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt')
};

const PORT = 3000;

// Create HTTPS server
const server = https.createServer(options, app);

server.listen(PORT, () => {
  console.log(`🔐 HTTPS Server running on https://localhost:${PORT}`);
  console.log(`📱 For mobile access: https://192.168.1.102:${PORT}`);
  console.log(`⚠️  You may need to accept security warnings in browsers`);
  console.log(`🎯 Camera should now work on mobile devices!`);
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ Port ${PORT} is already in use. Please stop the HTTP server first.`);
    console.log(`💡 Run: pkill -f "node server.js"`);
  } else {
    console.error('Server error:', err);
  }
});








