import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validatePropertyAccess, checkForAnomalies } from '@/utils/ga4';
import { Prisma } from '@prisma/client';
import { withAuth } from '@/lib/supabase';

export async function GET() {
  return withAuth(async ({ user }) => {
    try {
      // Ensure user exists in our database
      let dbUser = await prisma.user.findUnique({
        where: { id: user.id }
      });

      if (!dbUser) {
        try {
          dbUser = await prisma.user.create({
            data: {
              id: user.id,
              email: user.email || '',
            }
          });
        } catch (createUserError) {
          console.error('Error creating user:', createUserError);
          return NextResponse.json(
            { error: 'Failed to create user record' },
            { status: 500 }
          );
        }
      }

      const properties = await prisma.property.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: 'desc' },
        include: {
          checks: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
      });

      // Create response with strong caching headers
      const response = NextResponse.json(properties);
      
      // Cache for 5 minutes, allow stale response for 30 seconds while revalidating
      response.headers.set(
        'Cache-Control',
        'private, max-age=300, must-revalidate, stale-while-revalidate=30'
      );
      
      // Ensure proper cache key includes auth state
      response.headers.set('Vary', 'Cookie, Authorization');
      
      return response;
    } catch (error: Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch properties';
      console.error('Error fetching properties:', errorMessage);
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: Request) {
  return withAuth(async ({ user }) => {
    try {
      // Ensure user exists in our database
      let dbUser = await prisma.user.findUnique({
        where: { id: user.id }
      });

      if (!dbUser) {
        try {
          dbUser = await prisma.user.create({
            data: {
              id: user.id,
              email: user.email || '',
            }
          });
        } catch (createUserError) {
          console.error('Error creating user:', createUserError);
          return NextResponse.json(
            { error: 'Failed to create user record' },
            { status: 500 }
          );
        }
      }

      const { name, propertyId, accountId } = await request.json();

      // Validate required fields
      if (!name || !propertyId || !accountId) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      try {
        // Validate GA4 property access
        const hasAccess = await validatePropertyAccess(propertyId, accountId);
        if (!hasAccess) {
          return NextResponse.json(
            { error: 'Invalid GA4 property credentials or no access' },
            { status: 400 }
          );
        }
      } catch (validationError: Error | unknown) {
        const errorMessage = validationError instanceof Error 
          ? validationError.message 
          : 'Failed to validate GA4 property access';
        return NextResponse.json(
          { error: errorMessage },
          { status: 400 }
        );
      }

      // Check for existing property
      const existingProperty = await prisma.property.findFirst({
        where: {
          propertyId,
          accountId,
          userId: dbUser.id,
        },
      });

      if (existingProperty) {
        return NextResponse.json(
          { error: 'Property already exists' },
          { status: 400 }
        );
      }

      try {
        // Create new property
        const property = await prisma.property.create({
          data: {
            name,
            propertyId,
            accountId,
            userId: dbUser.id,
          },
        });

        try {
          // Perform initial check
          const checkResult = await checkForAnomalies(propertyId);
          await prisma.check.create({
            data: {
              propertyId: property.id,
              sessions: checkResult.sessions,
              status: checkResult.hasAnomaly ? 'anomaly' : 'normal',
              error: checkResult.hasAnomaly ? checkResult.message : null,
            },
          });
        } catch (checkError) {
          console.error('Error performing initial check:', checkError);
          // Continue since the property was created successfully
        }

        return NextResponse.json(property);
      } catch (createError) {
        if (createError instanceof Prisma.PrismaClientKnownRequestError) {
          console.error('Prisma error:', {
            code: createError.code,
            message: createError.message,
            meta: createError.meta
          });
        }
        throw createError;
      }
    } catch (error: Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create property';
      console.error('Error creating property:', errorMessage);
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  });
} 