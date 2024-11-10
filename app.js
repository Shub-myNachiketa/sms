import cron from 'node-cron';
import { scheduleMessages } from './scheduler.js';

scheduleMessages();

// cron.schedule('* * * * *', () => {
//   console.log('Running cron job to check for SMS to send...');
//   scheduleMessages();
// });
