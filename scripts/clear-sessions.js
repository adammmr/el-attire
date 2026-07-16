require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/el_attire';

async function clearSessions() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Drop the sessions collection
    const collections = await db.listCollections().toArray();
    const sessionCollection = collections.find(c => c.name === 'sessions');
    
    if (sessionCollection) {
      await db.collection('sessions').drop();
      console.log('✅ Sessions collection dropped successfully');
    } else {
      console.log('ℹ️ No sessions collection found');
    }
    
    // Also clear any existing indexes
    await db.collection('sessions').createIndex({ expires: 1 }, { expireAfterSeconds: 0 });
    console.log('✅ Sessions index recreated');
    
    await mongoose.disconnect();
    console.log('✅ Done! You can now restart your app.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearSessions();