// Enable debug logging
process.env.DEBUG = '*';
process.env.NODE_ENV = 'development';

// Load environment variables first
require('dotenv').config();

// Set the port
process.env.PORT = 5001;

// Log environment setup
console.log('=== Starting Server with Debug ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MongoDB URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓ Set' : '✗ Not set');
console.log('=================================');

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('!!! UNCAUGHT EXCEPTION !!!');
  console.error(error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('!!! UNHANDLED REJECTION !!!');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
});

// Start the server
console.log('Starting server...');
require('./backend/server');

console.log(`Server started on http://localhost:${process.env.PORT}`);
