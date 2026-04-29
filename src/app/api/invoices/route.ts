import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const invoices = await db.invoice.findMany({
      include: {
        client: {
          select: { name: true },
        },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.client.name,
      clientId: inv.clientId,
      total: inv.total,
      subtotal: inv.subtotal,
      taxRate: inv.taxRate,
      taxAmount: inv.taxAmount,
      status: inv.status,
      dueDate: inv.dueDate.toISOString().split('T')[0],
      createdAt: inv.createdAt.toISOString().split('T')[0],
      notes: inv.notes,
      items: inv.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      })),
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, dueDate, taxRate = 18, notes, items } = body

    if (!clientId || !dueDate || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: { quantity: number; rate: number }) => {
      return sum + item.quantity * item.rate
    }, 0)
    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount

    // Generate invoice number
    const invoiceCount = await db.invoice.count()
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(3, '0')}`

    const invoice = await db.invoice.create({
      data: {
        userId: user.id,
        clientId,
        invoiceNumber,
        status: 'draft',
        dueDate: new Date(dueDate),
        subtotal,
        taxRate: parseFloat(taxRate),
        taxAmount,
        total,
        notes: notes || null,
        items: {
          create: items.map((item: { description: string; quantity: number; rate: number }) => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.quantity * item.rate,
          })),
        },
      },
      include: {
        client: { select: { name: true } },
        items: true,
      },
    })

    return NextResponse.json({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.client.name,
      clientId: invoice.clientId,
      total: invoice.total,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      status: invoice.status,
      dueDate: invoice.dueDate.toISOString().split('T')[0],
      createdAt: invoice.createdAt.toISOString().split('T')[0],
      notes: invoice.notes,
      items: invoice.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      })),
    })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}
