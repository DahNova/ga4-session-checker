import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkForAnomalies, getAccountName } from '@/utils/ga4';
import nodemailer from 'nodemailer';

// Utility function to wait for a specified number of seconds
const delay = (seconds: number) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

// Utility function to send Telegram message
async function sendTelegramMessage(botToken: string, chatId: string, message: string) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.description || 'Telegram API error');
    }
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    throw error;
  }
}

// Utility function to format date
function formatDate(date: Date): string {
  return date.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

interface PropertyCheck {
  property: {
    id: string;
    name: string;
    propertyId: string;
    accountId: string;
  };
  checkResult: {
    sessions: number;
    hasAnomaly: boolean;
    message?: string;
  };
  accountName: string;
}

interface UserSettings {
  checkDelaySeconds: number;
  emailNotifications: boolean;
  emailAddresses: string[];
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFromName?: string;
  smtpFromEmail?: string;
  telegramChatId?: string;
}

// Group anomalies by account for better readability
async function formatAnomalies(anomalies: PropertyCheck[]): Promise<string> {
  // Group by account
  const byAccount = anomalies.reduce((acc, {property, checkResult, accountName}) => {
    if (!acc[accountName]) {
      acc[accountName] = [];
    }
    acc[accountName].push({property, checkResult});
    return acc;
  }, {} as Record<string, PropertyCheck[]>);

  // Build message
  let message = `🚨 Rilevate Anomalie GA4\n`;
  message += `${formatDate(new Date())}\n\n`;

  for (const [accountName, properties] of Object.entries(byAccount)) {
    message += `<b>${accountName}</b>\n`;
    for (const {property, checkResult} of properties) {
      message += `‼️ ${property.name} - ${checkResult.sessions} sessioni rilevate\n`;
    }
    message += '\n';
  }

  const totalProperties = Object.values(byAccount).flat().length;
  message += `Totale proprietà interessate: ${totalProperties}`;
  
  return message;
}

// Process a single user's properties
async function processUserProperties(
  userId: string, 
  properties: PropertyCheck['property'][], 
  settings: UserSettings
): Promise<PropertyCheck[]> {
  const anomalies = [];
  const errors = [];

  for (const property of properties) {
    try {
      // Check for anomalies
      const checkResult = await checkForAnomalies(property.propertyId);
      
      // Create check record
      await prisma.check.create({
        data: {
          propertyId: property.id,
          sessions: checkResult.sessions,
          status: checkResult.hasAnomaly ? 'anomaly' : 'normal',
          error: checkResult.hasAnomaly ? checkResult.message : null,
          timestamp: new Date(),
        },
      });

      // Update property status
      await prisma.property.update({
        where: { id: property.id },
        data: {
          lastChecked: new Date(),
          status: checkResult.hasAnomaly ? 'anomaly' : 'normal',
        },
      });

      // Collect anomaly if detected
      if (checkResult.hasAnomaly) {
        const accountName = await getAccountName(property.accountId);
        anomalies.push({
          property,
          checkResult,
          accountName
        });
      }

      // Wait before processing next property
      await delay(settings.checkDelaySeconds || 2);
    } catch (error) {
      console.error(`Error checking property ${property.id}:`, error);
      errors.push({ propertyId: property.id, error });
    }
  }

  // Log any errors that occurred during processing
  if (errors.length > 0) {
    console.error(`Errors occurred while processing properties for user ${userId}:`, errors);
  }

  return anomalies;
}

export async function POST() {
  try {
    console.log('Starting scheduled property checks...');
    
    // Get all properties with their user settings
    const properties = await prisma.property.findMany({
      include: {
        user: {
          include: {
            settings: true
          }
        }
      }
    });

    // Group properties by user to respect individual settings
    const propertiesByUser = properties.reduce((acc, property) => {
      const userId = property.user.id;
      if (!acc[userId]) {
        acc[userId] = {
          settings: property.user.settings,
          properties: []
        };
      }
      acc[userId].properties.push(property);
      return acc;
    }, {} as Record<string, { settings: any, properties: typeof properties }>);

    console.log(`Processing properties for ${Object.keys(propertiesByUser).length} users`);

    // Process each user's properties according to their settings
    for (const userId in propertiesByUser) {
      const { settings, properties } = propertiesByUser[userId];
      
      // Skip if no settings found
      if (!settings) {
        console.log(`Skipping user ${userId} - no settings found`);
        continue;
      }

      // Check if we should run based on schedule
      const now = new Date();
      const userTime = new Date(now.toLocaleString('en-US', { timeZone: settings.timeZone }));
      const [scheduleHour, scheduleMinute] = settings.checkTime.split(':').map(Number);
      
      if (settings.checkFrequency === 'daily') {
        // For daily checks, only proceed if we're within 5 minutes of the scheduled time
        const currentHour = userTime.getHours();
        const currentMinute = userTime.getMinutes();
        const timeDiff = Math.abs(
          (currentHour * 60 + currentMinute) - 
          (scheduleHour * 60 + scheduleMinute)
        );
        
        if (timeDiff > 5) {
          console.log(`Skipping user ${userId} - outside scheduled time window`);
          continue;
        }
      }

      console.log(`Processing ${properties.length} properties for user ${userId}`);

      try {
        // Process all properties and collect anomalies
        const anomalies = await processUserProperties(userId, properties, settings);

        // Send notifications if there are anomalies
        if (anomalies.length > 0) {
          console.log(`Found ${anomalies.length} anomalies for user ${userId}`);
          const message = await formatAnomalies(anomalies);

          // Send email notification if configured
          if (settings.emailNotifications && 
              settings.emailAddresses.length > 0 &&
              settings.smtpHost) {
            try {
              const transporter = nodemailer.createTransport({
                host: settings.smtpHost,
                port: settings.smtpPort || 587,
                secure: (settings.smtpPort || 587) === 465,
                auth: {
                  user: settings.smtpUser,
                  pass: settings.smtpPassword,
                },
              });

              await transporter.sendMail({
                from: `"${settings.smtpFromName}" <${settings.smtpFromEmail}>`,
                to: settings.emailAddresses.join(', '),
                subject: `[GA4 Monitor] Anomalies Detected - ${anomalies.length} properties affected`,
                text: message.replace(/<[^>]+>/g, ''),
                html: message.replace(/\n/g, '<br>'),
              });
            } catch (emailError) {
              console.error('Error sending email notification:', emailError);
            }
          }

          // Send Telegram notification if configured
          if (settings.telegramChatId && process.env.TELEGRAM_BOT_TOKEN) {
            try {
              await sendTelegramMessage(
                process.env.TELEGRAM_BOT_TOKEN,
                settings.telegramChatId,
                message
              );
              console.log(`Sent Telegram notification for user ${userId}`);
            } catch (telegramError) {
              console.error(`Error sending Telegram notification for user ${userId}:`, telegramError);
            }
          }
        } else {
          console.log(`No anomalies found for user ${userId}`);
        }
      } catch (userError) {
        console.error(`Error processing properties for user ${userId}:`, userError);
      }
    }

    console.log('Completed scheduled property checks');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 