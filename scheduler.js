import { sendSMS } from './smsService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7; 
  nextSaturday.setDate(nextSaturday.getDate() + daysUntilSaturday);
  return nextSaturday;
};

const scheduleMessages = async () => {
  const users = await prisma.sendSMS.findMany();
  console.log("fetched users: ",users);

  for (const user of users) {
    const { id, phoneNumber, createdAt, sms1SentAt, sms2SentAt, sms3SentAt, sms4SentAt, sms5SentAt } = user;

    // Calculate the first Saturday after the user's created date
    const nextSaturdayAfterCreated = getNextSaturday(createdAt);

    const smsSchedule = [
      { dateField: sms1SentAt, dbField: 'sms1SentAt', statusField: 'sms1Status', message: messages[0] },
      { dateField: sms2SentAt, dbField: 'sms2SentAt', statusField: 'sms2Status', message: messages[1] },
      { dateField: sms3SentAt, dbField: 'sms3SentAt', statusField: 'sms3Status', message: messages[2] },
      { dateField: sms4SentAt, dbField: 'sms4SentAt', statusField: 'sms4Status', message: messages[3] },
      { dateField: sms5SentAt, dbField: 'sms5SentAt', statusField: 'sms5Status', message: messages[4] },
    ];

    for (let i = 0; i < smsSchedule.length; i++) {
      const { dateField, dbField, statusField, message } = smsSchedule[i];

      let sendDate = new Date(nextSaturdayAfterCreated);
      if (i > 0) {
        
        sendDate.setDate(sendDate.getDate() + 7 * i);
      }
      console.log(`Checking SMS ${i + 1} for user ${id}, scheduled date: ${sendDate}, current date: ${new Date()}`);
      if (!dateField && new Date() >= sendDate) {
        console.log(`Attempting to send SMS ${i + 1} to ${phoneNumber}`);
        const isSent = await sendSMS(phoneNumber, message);
        if (isSent) {
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
