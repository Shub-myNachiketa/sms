import cron from 'node-cron';
import { scheduleMessages } from './scheduler.js';

// Schedule the cron job to run at midnight every day
cron.schedule('0 0 * * *', () => {
  console.log('Running cron job to check for SMS to send...');
  scheduleMessages();
});
