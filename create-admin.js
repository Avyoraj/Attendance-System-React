const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdmin() {
  try {
    console.log('=== Creating Admin Account ===');
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.DATABASE_URL, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');
    
    // Define admin data
    const adminData = {
      name: 'System Admin',
      email: 'admin@attendance.com',
      password: 'admin123', // This will be hashed
      role: 'admin'
    };
    
    console.log('\nCreating admin account with:');
    console.log(`- Email: ${adminData.email}`);
    console.log(`- Password: ${adminData.password}`);
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);
    
    // Create admin in database
    const Admin = require('./backend/models/Admin');
    const admin = new Admin({
      name: adminData.name,
      email: adminData.email,
      password_hash: hashedPassword,
      role: adminData.role
    });
    
    // Save admin to database
    await admin.save();
    
    console.log('\n✅ Admin account created successfully!');
    console.log('You can now login with:');
    console.log(`Email: ${adminData.email}`);
    console.log(`Password: ${adminData.password}`);
    console.log('\nPlease change the password after first login.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin account:');
    console.error(error.message);
    if (error.code === 11000) {
      console.log('\n⚠️  An admin with this email already exists.');
    }
    process.exit(1);
  }
}

createAdmin();
