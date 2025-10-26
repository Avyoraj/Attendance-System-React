const mongoose = require('mongoose');
require('dotenv').config();

async function clearDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.DATABASE_URL, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('Connected to MongoDB. Clearing collections...');
    
    // Get all model names
    const collections = Object.keys(mongoose.connection.collections);
    
    // Clear each collection
    for (const collectionName of collections) {
      const collection = mongoose.connection.collections[collectionName];
      try {
        await collection.deleteMany({});
        console.log(`✅ Cleared collection: ${collectionName}`);
      } catch (error) {
        console.error(`❌ Error clearing collection ${collectionName}:`, error.message);
      }
    }
    
    console.log('\n✅ Database cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearDatabase();
