import express from 'express';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { scheduleMessages } from './scheduler.js';
import { sendSMS } from './smsService.js';


dotenv.config({ path: '.env.local' });

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

//mssg for 333615
// const mssg = "Buy Gita books in extra 10% discount today on book sets. More than 30,000 books sold. Use discount coupon 10BGAZ. https://www.mynachiketa.com/books";

const mssg= "Hi Parents! Free Sunday Gita Class for kids by myNachiketa.com from 19th May 11am. Register now bit.ly/4b8itmk";

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

    // Validate required fields
    if (!email || !phone) {
      return res.status(400).json({ error: 'Missing required fields: email or phone' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const createdDate = new Date();
    const userData = {
      email,
      phone,
      platform:"Poptin",
      fbclid,
      createdDate,
      sms1SentAt: null,
      sms1Status: null,
      sms2SentAt: null,
      sms2Status: null,
      sms3SentAt: null,
      sms3Status: null,
      sms4SentAt: null,
      sms4Status: null,
      sms5SentAt: null,
      sms5Status: null,
    };

    const result = await collection.insertOne(userData);

    // Send immediate SMS
    try {
      console.log('Sending immediate welcome SMS to:', phone);
      const isSent = await sendSMS(phone,mssg);
      if (isSent) {
        await collection.updateOne(
          { _id: result.insertedId },
          {
            $set: {
              sms1SentAt: new Date(),
              sms1Status: 'sent',
            },
          }
        );
        console.log('Immediate welcome SMS sent to:', phone);
      } else {
        console.error('Failed to send immediate welcome SMS to:', phone);
      }
    } catch (smsError) {
      console.error('Error sending immediate SMS:', smsError);
    }

    // Schedule remaining messages for this user
    try {
      console.log('Scheduling remaining messages...');
      await scheduleMessages({ 
        _id: result.insertedId, 
        phone, 
        createdDate 
      }); 
    } catch (scheduleError) {
      console.error('Error scheduling messages:', scheduleError);
    }

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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Graceful shutdown to close MongoDB connection
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (db) {
    await db.client.close();
    console.log('MongoDB connection closed');
  }
  process.exit(0);
});

export default connectToDB;
