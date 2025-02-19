import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/supabase';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const settings = await request.json();

    // Validate SMTP settings
    if (
      !settings.smtpHost ||
      !settings.smtpPort ||
      !settings.smtpUser ||
      !settings.smtpPassword ||
      !settings.smtpFromEmail ||
      !settings.smtpFromName ||
      !settings.emailAddresses ||
      settings.emailAddresses.length === 0
    ) {
      return NextResponse.json(
        { error: 'Missing SMTP settings or email addresses' },
        { status: 400 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpPort === 465,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword,
      },
    });

    // Send test email
    await transporter.sendMail({
      from: `"${settings.smtpFromName}" <${settings.smtpFromEmail}>`,
      to: settings.emailAddresses.join(', '),
      subject: 'Test Email - GA4 Properties Monitor',
      text: 'This is a test email from your GA4 Properties Monitor. If you receive this email, your SMTP settings are configured correctly.',
      html: `
        <h1>Test Email - GA4 Properties Monitor</h1>
        <p>This is a test email from your GA4 Properties Monitor.</p>
        <p>If you receive this email, your SMTP settings are configured correctly.</p>
        <br>
        <p>SMTP Settings used:</p>
        <ul>
          <li>Host: ${settings.smtpHost}</li>
          <li>Port: ${settings.smtpPort}</li>
          <li>Username: ${settings.smtpUser}</li>
          <li>From: ${settings.smtpFromName} (${settings.smtpFromEmail})</li>
        </ul>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: Error | unknown) {
    console.error('Error sending test email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send test email';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 