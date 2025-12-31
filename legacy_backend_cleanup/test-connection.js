const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('=== Testing MongoDB Connection ===');
    
    // Log connection string (with sensitive info redacted)
    const dbUrl = process.env.DATABASE_URL;
    console.log('Connecting to MongoDB...');
    console.log('Connection string:', dbUrl ? '✓ Set' : '✗ Not set');
    
    if (!dbUrl) {
      throw new Error('DATABASE_URL is not set in .env file');
    }
    
    // Connect to MongoDB
    await mongoose.connect(dbUrl, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✓ Connected to MongoDB successfully!');
    console.log('Database Name:', mongoose.connection.db.databaseName);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections in the database:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Check if admin and teacher collections exist
    const hasAdmins = collections.some(c => c.name === 'admins');
    const hasTeachers = collections.some(c => c.name === 'teachers');
    
    console.log('\nChecking for required collections:');
    console.log(`- admins collection: ${hasAdmins ? '✓ Found' : '✗ Missing'}`);
    console.log(`- teachers collection: ${hasTeachers ? '✓ Found' : '✗ Missing'}`);
    
    // Check if there are any admin users
    if (hasAdmins) {
      const Admin = require('./backend/models/Admin');
      const adminCount = await Admin.countDocuments();
      console.log(`\nFound ${adminCount} admin users in the database`);
      
      if (adminCount > 0) {
        const firstAdmin = await Admin.findOne().select('-password_hash');
        console.log('First admin user:', firstAdmin);
      } else {
        console.log('No admin users found. You may need to create one.');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

testConnection();
