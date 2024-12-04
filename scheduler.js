import fetch from "node-fetch";
import dotenv from "dotenv";
import connectToDB from "./callbackHandler.js";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.TEXTLOCAL_API_KEY;
const sender = process.env.SENDER;

const IST_OFFSET = 5.5 * 60 * 60 * 1000; 
const getScheduleTimestamp = (date) => {
  const scheduledDate = new Date(date);
  scheduledDate.setUTCHours(2, 30, 0, 0); 
  return Math.floor(scheduledDate.getTime() / 1000);
};

const sendScheduledSMS = async (phoneNumber, message, scheduleTime) => {
  try {
    const url = `https://api.textlocal.in/send/?apiKey=${encodeURIComponent(apiKey)}&numbers=${encodeURIComponent(phoneNumber)}&sender=${encodeURIComponent(sender)}&message=${encodeURIComponent(message)}&schedule_time=${scheduleTime}`;
    const response = await fetch(url);
    const result = await response.json();

    if (result.status === "success") {
      console.log(`Scheduled SMS successfully to ${phoneNumber} at ${new Date(scheduleTime * 1000).toLocaleString()}`);
      return true;
    } else {
      console.error(`Failed to schedule SMS to ${phoneNumber}: ${result.message}`);
      return false;
    }
  } catch (error) {
    console.error("Error scheduling SMS:", error);
    return false;
  }
};

const messages = [
  "Hi Parents! Enroll your child for Free Sunday Gita Class by myNachiketa.com. Learn Gita via shlokas, stories every Sunday @11am. Register now bit.ly/3VZB5A2",
  "Hi Parents! Enroll your child for Free Sunday Gita Class by myNachiketa.com. Learn Gita via shlokas, stories every Sunday @11am. Register now bit.ly/3VZB5A2",
  "Hi Parents! Enroll your child for Free Sunday Gita Class by myNachiketa.com. Learn Gita via shlokas, stories every Sunday @11am. Register now bit.ly/3VZB5A2",
  "Hi Parents! Enroll your child for Free Sunday Gita Class by myNachiketa.com. Learn Gita via shlokas, stories every Sunday @11am. Register now bit.ly/3VZB5A2",
  "Hi Parents! Enroll your child for Free Sunday Gita Class by myNachiketa.com. Learn Gita via shlokas, stories every Sunday @11am. Register now bit.ly/3VZB5A2",
];

const getNextSaturday = (date) => {
  const nextSaturday = new Date(date);
  const dayOfWeek = nextSaturday.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
  nextSaturday.setDate(nextSaturday.getDate() + daysUntilSaturday);
  return nextSaturday;
};

const scheduleMessages = async (user = null) => {
  const db = await connectToDB();
  const collection = db.collection("PoptinLeads");

  try {
    const users = user
      ? [user]
      : await collection.find({}).toArray();
     

    for (const u of users) {
      console.log("user = ",u);
      const { _id, phone, createdDate, sms1SentAt, sms2SentAt, sms3SentAt, sms4SentAt, sms5SentAt } = u;

      const nextSaturdayAfterCreated = getNextSaturday(createdDate);

      const smsSchedule = [
        { dateField: sms1SentAt, dbField: "sms1SentAt", statusField: "sms1Status", message: messages[0] },
        { dateField: sms2SentAt, dbField: "sms2SentAt", statusField: "sms2Status", message: messages[1] },
        { dateField: sms3SentAt, dbField: "sms3SentAt", statusField: "sms3Status", message: messages[2] },
        { dateField: sms4SentAt, dbField: "sms4SentAt", statusField: "sms4Status", message: messages[3] },
        { dateField: sms5SentAt, dbField: "sms5SentAt", statusField: "sms5Status", message: messages[4] },
      ];
      

      for (let i = 0; i < smsSchedule.length; i++) {
        const { dateField, dbField, statusField, message } = smsSchedule[i];

        let sendDate = new Date(nextSaturdayAfterCreated);
        sendDate.setDate(sendDate.getDate() + 7 * i);

        const scheduleTime = getScheduleTimestamp(sendDate);

        if (!dateField && sendDate.getTime()>Date.now()) {
          console.log(`Attempting to schedule SMS ${i + 1} to ${phone}`);
          const isSent = await sendScheduledSMS(phone, message, scheduleTime);
          if (isSent) {
            await collection.updateOne(
              { _id },
              {
                $set: {
                  [dbField]: new Date(),
                  [statusField]: "scheduled",
                },
              }
            );
            console.log(`SMS ${i + 1} scheduled for ${phone}`);
          } else {
            console.error(`Failed to schedule SMS ${i + 1} for ${phone}`);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error scheduling messages:", error);
  }
};



export { scheduleMessages };
