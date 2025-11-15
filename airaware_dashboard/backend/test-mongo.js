// Simple MongoDB connection test
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;

async function testConnection() {
  console.log('Testing MongoDB connection...');
  console.log('URI:', uri);
  
  // Disable strict SSL verification for development
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000,
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
    ssl: true,
    sslValidate: false
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully!');
    
    const db = client.db('air');
    const collection = db.collection('air_data');
    
    const count = await collection.countDocuments();
    console.log(`Total documents: ${count}`);
    
    const sample = await collection.findOne();
    console.log('Sample document:', sample);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await client.close();
  }
}

testConnection();
