import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/supabase';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  return withAuth(async ({ user }) => {
    try {
      const data = await request.json();

      // Validate SMTP settings
      if (
        !data.smtpHost ||
        !data.smtpPort ||
        !data.smtpUser ||
        !data.smtpPassword ||
        !data.smtpFromEmail ||
        !data.smtpFromName ||
        !data.emailAddresses ||
        data.emailAddresses.length === 0
      ) {
        return NextResponse.json(
          { error: 'Missing SMTP settings or email addresses' },
          { status: 400 }
        );
      }

      // Create transporter
      const transporter = nodemailer.createTransport({
        host: data.smtpHost,
        port: data.smtpPort,
        secure: data.smtpPort === 465,
        auth: {
          user: data.smtpUser,
          pass: data.smtpPassword,
        },
      });

      // Send test email
      await transporter.sendMail({
        from: `"${data.smtpFromName}" <${data.smtpFromEmail}>`,
        to: data.emailAddresses.join(', '),
        subject: 'Test Email - GA4 Properties Monitor',
        text: 'This is a test email from your GA4 Properties Monitor. If you receive this email, your SMTP settings are configured correctly.',
        html: `
          <h1>Test Email - GA4 Properties Monitor</h1>
          <p>This is a test email from your GA4 Properties Monitor.</p>
          <p>If you receive this email, your SMTP settings are configured correctly.</p>
          <br>
          <p>SMTP Settings used:</p>
          <ul>
            <li>Host: ${data.smtpHost}</li>
            <li>Port: ${data.smtpPort}</li>
            <li>Username: ${data.smtpUser}</li>
            <li>From: ${data.smtpFromName} (${data.smtpFromEmail})</li>
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
  });
} 