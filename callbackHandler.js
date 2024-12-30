import express from 'express';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { scheduleMessages } from './scheduler.js';
import { sendSMS } from './smsService.js';
import cors from 'cors';
import Queue from 'bull';

dotenv.config({ path: '.env.local' });

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

// Message for the SMS
const mssg = "Buy Gita books in extra 10% discount today on book sets. More than 30,000 books sold. Use discount coupon 10BGAZ. https://www.mynachiketa.com/books";

// Task Queue
const taskQueue = new Queue('tasks', {
  redis: { host: 'localhost', port: 6379 }, // Adjust Redis configuration if needed
});

let db;
async function connectToDB() {
  if (db) return db;
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(mongoUri, {
      maxPoolSize: 10, // Pool size for better performance
      useUnifiedTopology: true,
    });
    await client.connect();
    db = client.db(dbName);
    console.log('Connected to MongoDB!');
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// Task Queue Processor
taskQueue.process(async (job) => {
  const { _id, phone, createdDate } = job.data;
  const db = await connectToDB();
  const collection = db.collection('PoptinLeads');

  try {
    console.log('Sending SMS to:', phone);
    const isSent = await sendSMS(phone, mssg);
    if (isSent) {
      await collection.updateOne(
        { _id },
        { $set: { sms1SentAt: new Date(), sms1Status: 'sent' } }
      );
      console.log('SMS sent successfully:', phone);
    } else {
      console.error('Failed to send SMS:', phone);
    }

    console.log('Scheduling remaining messages...');
    await scheduleMessages({ _id, phone, createdDate });
  } catch (error) {
    console.error('Error processing task:', error);
  }
});

app.post('/poptin-callback', async (req, res) => {
  try {
    const db = await connectToDB();
    const collection = db.collection('PoptinLeads');
    const { hidden_1, hidden_2, hidden_3, text_1: phone, fbclid } = req.body;

    // Validate phone number
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phone || !phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Save lead data
    const createdDate = new Date();
    const userData = {
      hidden_1,
      hidden_2,
      hidden_3,
      phone,
      platform: "Poptin",
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

    // Enqueue task for background processing
    await taskQueue.add({ _id: result.insertedId, phone, createdDate });

    console.log('Lead saved and task queued:', result.insertedId);
    res.status(200).json({
      success: true,
      message: 'Lead saved successfully, processing tasks in the background.',
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error('Error saving lead:', error);
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
