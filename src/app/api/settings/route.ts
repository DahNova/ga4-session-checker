import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withAuth } from '@/lib/supabase'

export async function GET() {
  return withAuth(async ({ user }) => {
    try {
      // Get user settings or create default settings if they don't exist
      let settings = await prisma.settings.findUnique({
        where: { userId: user.id }
      })

      if (!settings) {
        console.log('Creating default settings for user:', user.id)
        settings = await prisma.settings.create({
          data: {
            userId: user.id,
            // Default values are defined in the schema
          }
        })
      }

      // Create response with strong caching headers
      const response = NextResponse.json(settings)
      
      // Cache for 1 hour, allow stale response for 1 minute while revalidating
      response.headers.set(
        'Cache-Control',
        'private, max-age=3600, must-revalidate, stale-while-revalidate=60'
      )
      
      // Ensure proper cache key includes auth state
      response.headers.set('Vary', 'Cookie, Authorization')
      
      return response
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Database operation failed' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: Request) {
  return withAuth(async ({ user }) => {
    try {
      const data = await request.json()

      // Validate required fields
      if (
        typeof data.anomalyThreshold !== 'number' ||
        typeof data.minSessions !== 'number' ||
        typeof data.compareWithDays !== 'number' ||
        !data.checkFrequency ||
        !data.timeZone ||
        typeof data.emailNotifications !== 'boolean' ||
        !Array.isArray(data.emailAddresses)
      ) {
        return NextResponse.json(
          { error: 'Missing or invalid required fields' },
          { status: 400 }
        )
      }

      try {
        // Update or create settings
        const settings = await prisma.settings.upsert({
          where: { userId: user.id },
          update: {
            // Anomaly Detection
            anomalyThreshold: data.anomalyThreshold,
            minSessions: data.minSessions,
            warningSeverity: data.warningSeverity,
            criticalSeverity: data.criticalSeverity,
            compareWithDays: data.compareWithDays,

            // Schedule
            checkFrequency: data.checkFrequency,
            customCron: data.customCron,
            checkTime: data.checkTime,
            timeZone: data.timeZone,

            // Notifications
            emailNotifications: data.emailNotifications,
            emailAddresses: data.emailAddresses,
            slackWebhook: data.slackWebhook,
            telegramChatId: data.telegramChatId,

            // SMTP Settings
            smtpHost: data.smtpHost,
            smtpPort: data.smtpPort,
            smtpUser: data.smtpUser,
            smtpPassword: data.smtpPassword,
            smtpFromEmail: data.smtpFromEmail,
            smtpFromName: data.smtpFromName,

            // Dashboard Preferences
            defaultPageSize: data.defaultPageSize,
            defaultSortField: data.defaultSortField,
            defaultSortOrder: data.defaultSortOrder,
          },
          create: {
            userId: user.id,
            // Anomaly Detection
            anomalyThreshold: data.anomalyThreshold,
            minSessions: data.minSessions,
            warningSeverity: data.warningSeverity,
            criticalSeverity: data.criticalSeverity,
            compareWithDays: data.compareWithDays,

            // Schedule
            checkFrequency: data.checkFrequency,
            customCron: data.customCron,
            checkTime: data.checkTime,
            timeZone: data.timeZone,

            // Notifications
            emailNotifications: data.emailNotifications,
            emailAddresses: data.emailAddresses,
            slackWebhook: data.slackWebhook,
            telegramChatId: data.telegramChatId,

            // SMTP Settings
            smtpHost: data.smtpHost,
            smtpPort: data.smtpPort,
            smtpUser: data.smtpUser,
            smtpPassword: data.smtpPassword,
            smtpFromEmail: data.smtpFromEmail,
            smtpFromName: data.smtpFromName,

            // Dashboard Preferences
            defaultPageSize: data.defaultPageSize,
            defaultSortField: data.defaultSortField,
            defaultSortOrder: data.defaultSortOrder,
          }
        })

        // Create response with cache-busting headers
        const response = NextResponse.json(settings)
        
        // Ensure clients get fresh data after settings update
        response.headers.set('Cache-Control', 'no-store, must-revalidate')
        
        return response
      } catch (dbError) {
        console.error('Database error:', dbError)
        return NextResponse.json(
          { error: 'Database operation failed' },
          { status: 500 }
        )
      }
    } catch (error: Error | unknown) {
      console.error('Unexpected error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update settings'
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }
  })
} 