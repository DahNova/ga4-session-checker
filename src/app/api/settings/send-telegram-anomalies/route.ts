import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/supabase';
import prisma from '@/lib/prisma';
import { getAccountName } from '@/utils/ga4';

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

export async function POST(request: Request) {
  return withAuth(async ({ user }) => {
    try {
      const data = await request.json();

      // Validate Telegram settings
      if (!data.telegramChatId) {
        return NextResponse.json(
          { error: 'Missing Telegram Chat ID' },
          { status: 400 }
        );
      }

      if (!process.env.TELEGRAM_BOT_TOKEN) {
        return NextResponse.json(
          { error: 'Telegram bot token not configured' },
          { status: 500 }
        );
      }

      // Get all properties with anomalies
      const properties = await prisma.property.findMany({
        where: {
          userId: user.id,
          status: 'anomaly'
        },
        include: {
          checks: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          }
        }
      });

      if (properties.length === 0) {
        return NextResponse.json(
          { error: 'No anomalies found' },
          { status: 404 }
        );
      }

      // Group properties by account
      const byAccount: Record<string, typeof properties> = {};
      for (const property of properties) {
        const accountName = await getAccountName(property.accountId);
        if (!byAccount[accountName]) {
          byAccount[accountName] = [];
        }
        byAccount[accountName].push(property);
      }

      // Build message
      let message = `🚨 Rilevate Anomalie GA4\n`;
      message += `${formatDate(new Date())}\n\n`;

      for (const [accountName, accountProperties] of Object.entries(byAccount)) {
        message += `<b>${accountName}</b>\n`;
        for (const property of accountProperties) {
          message += `‼️ ${property.name} - 0 sessioni rilevate\n`;
        }
        message += '\n';
      }

      message += `Totale proprietà interessate: ${properties.length}`;

      // Send message
      await sendTelegramMessage(
        process.env.TELEGRAM_BOT_TOKEN,
        data.telegramChatId,
        message
      );

      return NextResponse.json({ success: true });
    } catch (error: Error | unknown) {
      console.error('Error sending Telegram anomalies:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send anomalies';
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  });
} 