import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.TEXTLOCAL_API_KEY;
const sender = process.env.SENDER;

const IST_OFFSET = 5.5 * 60 * 60 * 1000; // Offset for Indian Standard Time
const getScheduleTimestamp = (date) => {
  const scheduledDate = new Date(date);
  scheduledDate.setUTCHours(5, 30, 0, 0); // Set time to 8:00 AM IST (2:30 AM UTC)
  return Math.floor(scheduledDate.getTime() / 1000); // Convert to UNIX timestamp
};

const sendScheduledSMS = async (phoneNumber, message, scheduleTime) => {
  try {
    const url = `https://api.textlocal.in/send/?apiKey=${encodeURIComponent(apiKey)}&numbers=${encodeURIComponent(phoneNumber)}&sender=${encodeURIComponent(sender)}&message=${encodeURIComponent(message)}&schedule_time=${scheduleTime}`;
    const response = await fetch(url);
    const result = await response.json();

    console.log("Full API Response:", result);

    if (result.status === "success") {
      console.log(
        `Scheduled SMS successfully to ${phoneNumber} at ${new Date(scheduleTime * 1000).toLocaleString()}`
      );
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
  "Enroll your child for Free Sunday Gita Class. Learn Gita through shloka, activities & stories every Sunday @11am. https://www.mynachiketa.com/gita-class",
  "Want to tell Gita, Vedas, Upanishads based Stories to your kid? Explore https://www.mynachiketa.com/moral-stories, No:1 on Google Search for Bhagvad Gita Stories",
  "Get your child to learn Gita Songs at https://www.youtube.com/@my_Nachiketa. Subscribe now!",
  "You checked Gita books/Stories Get shlokas, stories, colouring, activity books for your child NOW. Use discount coupon 10BGAZ. https://www.mynachiketa.com/books",
  "Buy Gita books in extra 10% discount today on book sets. More than 30,000 books sold. Use discount coupon 10BGAZ. https://www.mynachiketa.com/books",
];

const getNextSaturday = (date) => {
  const nextSaturday = new Date(date);
  const dayOfWeek = nextSaturday.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
  nextSaturday.setDate(nextSaturday.getDate() + daysUntilSaturday);
  return nextSaturday;
};

const scheduleMessages = async (phone, createdDate) => {
  try {
    const nextSaturdayAfterCreated = getNextSaturday(createdDate);

    for (let i = 0; i < messages.length; i++) {
      const sendDate = new Date(nextSaturdayAfterCreated);
      sendDate.setDate(sendDate.getDate() + 7 * i);

      const scheduleTime = getScheduleTimestamp(sendDate);

      if (sendDate.getTime() > Date.now()) {
        console.log(`Attempting to schedule SMS ${i + 1} to ${phone}`);
        const isSent = await sendScheduledSMS(phone, messages[i], scheduleTime);

        if (isSent) {
          console.log(`SMS ${i + 1} scheduled for ${phone} at ${sendDate}`);
        } else {
          console.error(`Failed to schedule SMS ${i + 1} for ${phone}`);
        }
      }
    }
  } catch (error) {
    console.error("Error scheduling messages:", error);
  }
};

export { scheduleMessages };
