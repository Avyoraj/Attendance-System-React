const mongoose = require('mongoose');
require('dotenv').config();

async function quickTest() {
  try {
    console.log('Testing connection...');
    await mongoose.connect(process.env.DATABASE_URL, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Connected successfully!');
    console.log('Database:', mongoose.connection.db.databaseName);
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

quickTest();
