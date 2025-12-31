// Load environment variables first
require('dotenv').config();

// Override the default port if needed
process.env.PORT = process.env.PORT || 5002; // Changed from 5001 to 5002

// Start the server
require('./backend/server');

console.log(`Server starting on port ${process.env.PORT}...`);
