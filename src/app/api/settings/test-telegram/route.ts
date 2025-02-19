import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/supabase';

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

export async function POST(request: Request) {
  try {
    const settings = await request.json();

    // Validate Telegram settings
    if (!settings.telegramChatId) {
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

    // Send test message
    const message = `
🧪 <b>GA4 Monitor - Test Message</b>

This is a test message from your GA4 Properties Monitor.
If you receive this message, your Telegram notifications are configured correctly.

Channel Configuration:
• Name: Anomalie Ga4
• Type: Channel
• Bot Role: Administrator
• Chat ID: ${settings.telegramChatId}
• Time: ${new Date().toLocaleString()}

You will receive notifications in this channel when anomalies are detected in your GA4 properties.
      `.trim();

    await sendTelegramMessage(
      process.env.TELEGRAM_BOT_TOKEN,
      settings.telegramChatId,
      message
    );

    return NextResponse.json({ success: true });
  } catch (error: Error | unknown) {
    console.error('Error sending test Telegram message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send test message';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 