import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { listAccountProperties, validatePropertyAccess, checkForAnomalies } from '@/utils/ga4';
import { Database } from '@/types/supabase';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const { accountId } = await request.json();

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Get all properties from the account
    const properties = await listAccountProperties(accountId);

    // Filter out properties that already exist
    const existingProperties = await prisma.property.findMany({
      where: {
        userId: dbUser.id,
        accountId,
      },
      select: {
        propertyId: true,
      },
    });

    const existingPropertyIds = new Set(existingProperties.map(p => p.propertyId));
    const newProperties = properties.filter(p => !existingPropertyIds.has(p.propertyId));

    // Import new properties
    const importedProperties = [];
    const errors = [];

    for (const property of newProperties) {
      try {
        // Validate access before importing
        const hasAccess = await validatePropertyAccess(property.propertyId, accountId);
        if (!hasAccess) {
          errors.push({
            propertyId: property.propertyId,
            error: 'No access to this property',
          });
          continue;
        }

        // Create property
        const createdProperty = await prisma.property.create({
          data: {
            name: property.displayName,
            propertyId: property.propertyId,
            accountId,
            userId: dbUser.id,
          },
        });

        try {
          // Perform initial check
          const checkResult = await checkForAnomalies(property.propertyId);
          await prisma.check.create({
            data: {
              propertyId: createdProperty.id,
              sessions: checkResult.sessions,
              status: checkResult.hasAnomaly ? 'anomaly' : 'normal',
              error: checkResult.hasAnomaly ? checkResult.message : null,
              timestamp: new Date(),
            },
          });
        } catch (checkError) {
          console.error('Error performing initial check:', checkError);
          // Continue since the property was created successfully
        }

        importedProperties.push(createdProperty);
      } catch (error) {
        console.error('Error importing property:', error);
        errors.push({
          propertyId: property.propertyId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      imported: importedProperties,
      errors,
      skipped: existingProperties.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to import properties';
    console.error('Error importing properties:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 