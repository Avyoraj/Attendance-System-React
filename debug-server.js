// Enable debug logging
process.env.DEBUG = 'express:*,mongoose:*';
process.env.NODE_ENV = 'development';

// Load environment variables first
require('dotenv').config();

// Set the port
process.env.PORT = 5001;

// Log environment variables (except sensitive ones)
console.log('=== Server Starting with Environment ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MongoDB URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Set' : 'Not set');
console.log('=======================================');

// Start the server
require('./backend/server');

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

console.log(`Server starting in ${process.env.NODE_ENV} mode on port ${process.env.PORT}...`);
