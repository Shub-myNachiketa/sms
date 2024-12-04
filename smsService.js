import fetch from "node-fetch";
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' }); 

const apiKey = process.env.TEXTLOCAL_API_KEY;  
const sender = process.env.SENDER; 

const sendSMS = async (phoneNumber, message) => {
  // console.log(`Preparing to send SMS to ${phoneNumber}: ${message}`);
  try {
    const url = `https://api.textlocal.in/send/?apiKey=${encodeURIComponent(apiKey)}&numbers=${encodeURIComponent(phoneNumber)}&sender=${encodeURIComponent(sender)}&message=${encodeURIComponent(message)}`;

    // console.log(url);

    const response = await fetch(url);
    const result = await response.json();

    if (result.status === 'success') {
      console.log(`SMS sent successfully to ${phoneNumber}`);
      return true;
    } else {
      // console.log(`Failed to send SMS to ${phoneNumber}: ${result.message}`);
      return false;
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
};

export { sendSMS };

// import { exec } from 'child_process';
// import dotenv from 'dotenv';

// dotenv.config({ path: '.env.local' });

// const apiKey = process.env.TEXTLOCAL_API_KEY;
// const sender = process.env.SENDER;
// const phoneNumber = '919818907290';
// const message = "You checked Gita books/Stories Get shlokas, stories, colouring, activity books for your child NOW. Use discount coupon 10BGAZ. https://www.mynachiketa.com/books";

// const sendSMS = (phoneNumber, message) => {
//   return new Promise((resolve, reject) => {
//     // Command to run Python script with arguments
//     const command = `python3 pythonsms.py ${apiKey} ${phoneNumber} ${sender} ${message}`;

//     // Execute the Python script
//     exec(command, (error, stdout, stderr) => {
//       if (error) {
//         reject(`Error executing Python script: ${stderr}`);
//       } else {
//         resolve(stdout);
//       }
//     });
//   });
// };

// export {sendSMS};