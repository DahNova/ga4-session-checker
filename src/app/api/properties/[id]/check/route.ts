import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { checkForAnomalies } from '@/utils/ga4'
import { Database } from '@/types/supabase'

// Utility function to wait for a specified number of seconds
const delay = (seconds: number) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = cookies()
    
    const { id } = await context.params
    
    const property = await prisma.property.findFirst({
      where: {
        id,
      },
      include: {
        user: {
          include: {
            settings: true
          }
        }
      }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    if (!property.user.settings) {
      return NextResponse.json({ error: 'User settings not found' }, { status: 404 })
    }

    // Get delay from settings or use default
    const checkDelaySeconds = property.user.settings.checkDelaySeconds ?? 2;

    try {
      await delay(checkDelaySeconds);
      
      const checkResult = await checkForAnomalies(property.propertyId)
      await prisma.check.create({
        data: {
          propertyId: property.id,
          sessions: checkResult.sessions,
          status: checkResult.hasAnomaly ? 'anomaly' : 'normal',
          error: checkResult.hasAnomaly ? checkResult.message : null,
          timestamp: new Date(),
        },
      })

      // Update property's last check and status
      const updatedProperty = await prisma.property.update({
        where: { id: property.id },
        data: {
          lastChecked: new Date(),
          status: checkResult.hasAnomaly ? 'anomaly' : 'normal',
        },
        include: {
          checks: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
      })

      // Create response with cache-busting headers
      const response = NextResponse.json(updatedProperty)
      
      // Ensure clients get fresh data after a check
      response.headers.set('Cache-Control', 'no-store, must-revalidate')
      
      return response
    } catch (error: Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to perform check'
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to process request'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
} 