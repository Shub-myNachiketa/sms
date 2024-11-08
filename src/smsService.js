import fetch from 'node-fetch';

const apiKey = process.env.TEXTLOCAL_API_KEY;  // Replace with your API key
const sender = process.env.SENDER;  // Sender ID (this should be registered with Textlocal)

const sendSMS = async (phoneNumber, message) => {
  try {
    const url = `https://api.textlocal.in/send/?apiKey=${encodeURIComponent(apiKey)}&numbers=${encodeURIComponent(phoneNumber)}&sender=${encodeURIComponent(sender)}&message=${encodeURIComponent(message)}`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.status === 'success') {
      console.log(`SMS sent successfully to ${phoneNumber}`);
      return true;
    } else {
      console.log(`Failed to send SMS to ${phoneNumber}: ${result.message}`);
      return false;
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
};

export { sendSMS };
