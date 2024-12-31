import express from 'express';
import dotenv from 'dotenv';
import { scheduleMessages } from './scheduler.js';
import { sendSMS } from './smsService.js';
import cors from 'cors';

dotenv.config({ path: '.env.local' });

const app = express();
const port = process.env.PORT || 3000;

// Immediate message content
const mssg = "Buy Gita books in extra 10% discount today on book sets. More than 30,000 books sold. Use discount coupon 10BGAZ. https://www.mynachiketa.com/books";

app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST'],             
  allowedHeaders: ['Content-Type'],  
}));

app.use(express.json());

app.post('/poptin-callback',async(req, res) => {
  console.log('Route hit with body:', req.body);
  try {
    const { hidden_1, hidden_2, hidden_3, text_1: phone, fbclid } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Missing required fields: phone' });
    }

    const phoneRegex = /^[6-9]\d{9}$/; 
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const createdDate = new Date();

    // Send immediate SMS
    try {
      console.log('Sending immediate welcome SMS to:', phone);
      const isSent = await sendSMS(phone, mssg);
      if (isSent) {
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
      await scheduleMessages(phone, createdDate);
    } catch (scheduleError) {
      console.error('Error scheduling messages:', scheduleError);
    }

    res.status(200).json({
      success: true,
      message: 'Data processed successfully!',
    });
  } catch (error) {
    console.error('Error processing data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
