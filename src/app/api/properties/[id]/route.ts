import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { Database } from '@/types/supabase'

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const property = await prisma.property.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Delete all checks first
    await prisma.check.deleteMany({
      where: {
        propertyId: id,
      },
    })

    // Then delete the property
    await prisma.property.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete property'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
} 