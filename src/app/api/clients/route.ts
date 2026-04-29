import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const clients = await db.client.findMany({
      include: {
        _count: {
          select: { invoices: true },
        },
        invoices: {
          select: { total: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = clients.map((client) => ({
      id: client.id,
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      city: client.city,
      country: client.country,
      notes: client.notes,
      _count: client._count,
      _total: client.invoices.reduce((sum, inv) => sum + inv.total, 0),
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, company, email, phone, city, country, notes } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Find or create demo user
    let user = await db.user.findUnique({ where: { email: 'john@example.com' } })
    if (!user) {
      user = await db.user.create({
        data: {
          email: 'john@example.com',
          name: 'John Doe',
        },
      })
    }

    const client = await db.client.create({
      data: {
        userId: user.id,
        name,
        company: company || null,
        email,
        phone: phone || null,
        city: city || null,
        country: country || null,
        notes: notes || null,
      },
    })

    return NextResponse.json({
      id: client.id,
      name: client.name,
      company: client.company,
      email: client.email,
    })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
