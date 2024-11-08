import { sendSMS } from './smsService.js';
import { prisma } from './prismaClient.js';  // Assuming you have set up prisma client

const messages = [
  "This is your 1st scheduled message",
  "This is your 2nd scheduled message",
  "This is your 3rd scheduled message",
  "This is your 4th scheduled message",
  "This is your 5th scheduled message"
];

const getNextSaturday = (date) => {
  const nextSaturday = new Date(date);
  const dayOfWeek = nextSaturday.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;  // Days until the next Saturday
  nextSaturday.setDate(nextSaturday.getDate() + daysUntilSaturday);
  return nextSaturday;
};

const scheduleMessages = async () => {
  const users = await prisma.sendSMS.findMany();

  for (const user of users) {
    const { id, phoneNumber, createdAt, sms1SentAt, sms2SentAt, sms3SentAt, sms4SentAt, sms5SentAt } = user;

    // Calculate the first Saturday after the user's created date
    const nextSaturdayAfterCreated = getNextSaturday(createdAt);

    // Array of the 5 SMS to be scheduled with their respective fields
    const smsSchedule = [
      { dateField: sms1SentAt, dbField: 'sms1SentAt', statusField: 'sms1Status' },
      { dateField: sms2SentAt, dbField: 'sms2SentAt', statusField: 'sms2Status' },
      { dateField: sms3SentAt, dbField: 'sms3SentAt', statusField: 'sms3Status' },
      { dateField: sms4SentAt, dbField: 'sms4SentAt', statusField: 'sms4Status' },
      { dateField: sms5SentAt, dbField: 'sms5SentAt', statusField: 'sms5Status' },
    ];

    for (let i = 0; i < smsSchedule.length; i++) {
      const { dateField, message, dbField, statusField } = smsSchedule[i];

      let sendDate = new Date(nextSaturdayAfterCreated);
      
      if (i > 0) {
        // For subsequent messages, add 7 * i days to get the correct Saturday
        sendDate.setDate(sendDate.getDate() + 7 * i);
      }

      // Check if the message has been sent
      if (!dateField && new Date() >= sendDate) {
        const isSent = await sendSMS(phoneNumber, message);
        if (isSent) {
          // Update the sent status and timestamp in the database
          await prisma.sendSMS.update({
            where: { id },
            data: {
              [dbField]: new Date(),
              [statusField]: 'sent',
            },
          });
        }
      }
    }
  }
};

export { scheduleMessages };
