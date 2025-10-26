const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import the Teacher model
const Teacher = require('./backend/models/Teacher');

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Missing');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE_URL, {
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connected to MongoDB successfully!');
    console.log('📊 Database Name:', mongoose.connection.db.databaseName);
    
    // Count existing teachers
    const teacherCount = await Teacher.countDocuments();
    console.log(`📈 Current teachers in database: ${teacherCount}`);
    
    // List all teachers
    const teachers = await Teacher.find({}, 'name email department createdAt');
    console.log('👥 Existing teachers:');
    teachers.forEach(teacher => {
      console.log(`  - ${teacher.name} (${teacher.email}) - ${teacher.department} - Created: ${teacher.createdAt}`);
    });
    
    // Test creating a new teacher
    console.log('\n🧪 Testing teacher creation...');
    const testEmail = `test-${Date.now()}@example.com`;
    const hashedPassword = await bcrypt.hash('testpassword123', 12);
    
    const newTeacher = new Teacher({
      name: 'Test Teacher',
      email: testEmail,
      password_hash: hashedPassword,
      department: 'Test Department',
      isVerified: false
    });
    
    const savedTeacher = await newTeacher.save();
    console.log('✅ Test teacher created successfully:', savedTeacher._id);
    console.log('📝 Teacher details:', {
      id: savedTeacher._id,
      name: savedTeacher.name,
      email: savedTeacher.email,
      department: savedTeacher.department,
      createdAt: savedTeacher.createdAt
    });
    
    // Clean up test teacher
    await Teacher.findByIdAndDelete(savedTeacher._id);
    console.log('🧹 Test teacher cleaned up');
    
    console.log('\n✅ Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testDatabaseConnection();
