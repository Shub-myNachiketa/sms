import fetch from "node-fetch";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { scheduleMessages } from "./scheduler.js"; // Assuming you already have a scheduler function
import { sendSMS } from "./smsService.js"; // Assuming you already have an SMS service function

dotenv.config({ path: ".env.local" });

const mongoUri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;
const shiprocketToken = process.env.SHIPROCKET_API_TOKEN;

// const mssg = "Buy Gita books in extra 10% discount today on book sets. More than 30,000 books sold. Use discount coupon 10BGAZ. https://www.mynachiketa.com/books";

const mssg= "Hi Parents! Free Sunday Gita Class for kids by myNachiketa.com from 19th May 11am. Register now bit.ly/4b8itmk";

let db;

const connectToDB = async () => {
  if (db) return db;
  try {
    console.log("Connecting to MongoDB...");
    const client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db(dbName);
    console.log("Connected to MongoDB!");
    return db;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
};

const getYesterdayDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0];
};

const yesterday = getYesterdayDate();

const fetchShiprocketOrders = async () => {
  try {
    const url = `https://apiv2.shiprocket.in/v1/external/orders?channel_id=3930467&from=${yesterday}&to=${yesterday}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${shiprocketToken}`,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching Shiprocket orders:", error);
    return [];
  }
};

const processAmazonOrders = async () => {
  console.log("Fetching Amazon orders...");
  const orders = await fetchShiprocketOrders();
  console.log(orders);

  const db = await connectToDB();
  const collection = db.collection("PoptinLeads");

  for (const order of orders) {
    const { customer_email: email, customer_phone: phone, created_at } = order;
    const createdDate = new Date(created_at);

    const userData = {
      email: email || null,
      phone,
      platform: "Amazon",
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

    try {
      const result = await collection.insertOne(userData);
      console.log(`Inserted order for phone: ${phone}`);

      // Send immediate welcome SMS
      try {
        console.log("Sending immediate welcome SMS to:", phone);
        const isSent = await sendSMS(phone, mssg);
        if (isSent) {
          await collection.updateOne(
            { _id: result.insertedId },
            {
              $set: {
                sms1SentAt: new Date(),
                sms1Status: "sent",
              },
            }
          );
          console.log("Immediate welcome SMS sent to:", phone);
        } else {
          console.error("Failed to send immediate welcome SMS to:", phone);
        }
      } catch (smsError) {
        console.error("Error sending immediate SMS:", smsError);
      }

      // Schedule remaining messages for this user
      try {
        console.log("Scheduling remaining messages...");
        await scheduleMessages({
          _id: result.insertedId,
          phone,
          createdDate,
        });
      } catch (scheduleError) {
        console.error("Error scheduling messages:", scheduleError);
      }
    } catch (error) {
      if (error.code === 11000) {
        console.log(`Duplicate phone detected, skipping: ${phone}`);
      } else {
        console.error("Error inserting order to MongoDB:", error);
      }
    }
  }
};

// Run the script
(async () => {
  try {
    await processAmazonOrders();
    console.log("Processing complete!");
  } catch (error) {
    console.error("Error in processing Amazon orders:", error);
  } finally {
    if (db) {
      await db.client.close();
      console.log("MongoDB connection closed");
    }
  }
})();
