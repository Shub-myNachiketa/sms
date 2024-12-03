// api/scheduled-job.js
import { scheduleMessages } from '../scheduler'; // Import your schedule function
import dotenv from 'dotenv';
dotenv.config();

export default async function handler(req, res) {
  try {
    // Log the task start (for debugging purposes)
    console.log('Running scheduled job to send messages...');
    
    // Call your function to schedule messages
    await scheduleMessages();
    
    res.status(200).json({ message: 'Scheduled job executed successfully.' });
  } catch (error) {
    console.error('Error executing scheduled job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
