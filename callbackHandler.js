import express from 'express';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const mongoUri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

let db; 

async function connectToDB() {
  if (db) return db; 
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db(dbName);
    console.log('Connected to MongoDB!');
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

app.use(express.json());

app.post('/poptin-callback', async (req, res) => {
  try {
    const db = await connectToDB();
    const collection = db.collection('PoptinLeads');
    const { textfieldemail: email, textfieldphone: phone, fbclid } = req.body;

    if (!email || !phone || !fbclid) {
      return res.status(400).json({ error: 'Missing required fields: email, phone, or fbclid' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

  
    const createdDate = new Date();
    const result = await collection.insertOne({
      email,
      phone,
      fbclid,
      createdDate,
    });

    console.log('Data saved to DB with ID:', result.insertedId);
    res.status(200).json({
      success: true,
      message: 'Data saved successfully!',
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (db) {
    await db.client.close();
    console.log('MongoDB connection closed');
  }
  process.exit(0);
});

export default connectToDB;