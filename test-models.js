const mongoose = require('mongoose');
require('dotenv').config();

async function testModels() {
  try {
    console.log('=== Testing MongoDB Models ===');
    
    // Load all models
    console.log('Loading models...');
    const Admin = require('./backend/models/Admin');
    const Teacher = require('./backend/models/Teacher');
    const Student = require('./backend/models/Student');
    const Class = require('./backend/models/Class');
    const Attendance = require('./backend/models/Attendance');
    
    console.log('✓ All models loaded successfully');
    
    // Test database connection
    console.log('\nTesting database connection...');
    await mongoose.connect(process.env.DATABASE_URL, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
    
    console.log('✓ Connected to MongoDB successfully');
    
    // Check if collections exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections in database:');
    collections.forEach(c => console.log(`- ${c.name}`));
    
    // Try to create a test admin
    console.log('\nCreating test admin...');
    const admin = new Admin({
      name: 'Test Admin',
      email: 'test@attendance.com',
      password_hash: '$2a$12$dummyhash', // This is just a test hash
      role: 'admin'
    });
    
    await admin.save();
    console.log('✓ Test admin created successfully');
    
    // Clean up
    await Admin.deleteOne({ email: 'test@attendance.com' });
    console.log('✓ Test admin cleaned up');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

testModels();
