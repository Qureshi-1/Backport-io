import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Clear existing data
    await db.invoiceItem.deleteMany()
    await db.invoice.deleteMany()
    await db.client.deleteMany()
    await db.user.deleteMany()

    // Create demo user
    const user = await db.user.create({
      data: {
        email: 'john@example.com',
        name: 'John Doe',
        businessName: 'InvoiceFlow Solutions',
        taxId: '27AADCI2345A1Z5',
        address: '123 Business Park',
        city: 'Mumbai',
        state: 'Maharashtra',
        zip: '400001',
        country: 'India',
        bankName: 'HDFC Bank',
        bankAccount: '12345678901234',
        bankIfsc: 'HDFC0001234',
        defaultCurrency: 'INR',
        defaultTaxRate: 18,
        autoRemind: true,
      },
    })

    // Create clients
    const clients = await Promise.all([
      db.client.create({
        data: {
          userId: user.id,
          name: 'Rajesh Kumar',
          company: 'TechCorp',
          email: 'rajesh@techcorp.com',
          phone: '+91 98765 43210',
          city: 'Mumbai',
          country: 'India',
        },
      }),
      db.client.create({
        data: {
          userId: user.id,
          name: 'Priya Sharma',
          company: 'DesignHub',
          email: 'priya@designhub.com',
          phone: '+91 87654 32109',
          city: 'Delhi',
          country: 'India',
        },
      }),
      db.client.create({
        data: {
          userId: user.id,
          name: 'Amit Mehta',
          company: 'DevStudio',
          email: 'amit@devstudio.com',
          phone: '+91 76543 21098',
          city: 'Bangalore',
          country: 'India',
        },
      }),
      db.client.create({
        data: {
          userId: user.id,
          name: 'Sneha Patil',
          company: 'CreativeWorks',
          email: 'sneha@creativeworks.com',
          phone: '+91 65432 10987',
          city: 'Pune',
          country: 'India',
        },
      }),
      db.client.create({
        data: {
          userId: user.id,
          name: 'Vikram Singh',
          company: 'WebSolutions',
          email: 'vikram@websolutions.com',
          phone: '+91 54321 09876',
          city: 'Hyderabad',
          country: 'India',
        },
      }),
      db.client.create({
        data: {
          userId: user.id,
          name: 'Neha Gupta',
          company: 'MarketingPro',
          email: 'neha@marketingpro.com',
          phone: '+91 43210 98765',
          city: 'Chennai',
          country: 'India',
        },
      }),
    ])

    // Create invoices with items
    const invoiceConfigs = [
      {
        clientId: clients[0].id,
        invoiceNumber: 'INV-001',
        status: 'paid',
        dueDate: new Date('2024-12-15'),
        createdAt: new Date('2024-12-01'),
        notes: 'Thank you for your business!',
        items: [
          { description: 'Website Development', quantity: 1, rate: 10000, amount: 10000 },
          { description: 'UI/UX Design', quantity: 1, rate: 5000, amount: 5000 },
        ],
      },
      {
        clientId: clients[1].id,
        invoiceNumber: 'INV-002',
        status: 'pending',
        dueDate: new Date('2024-12-20'),
        createdAt: new Date('2024-12-05'),
        items: [
          { description: 'Brand Identity Design', quantity: 1, rate: 15000, amount: 15000 },
          { description: 'Logo Variations', quantity: 5, rate: 1500, amount: 7500 },
        ],
      },
      {
        clientId: clients[2].id,
        invoiceNumber: 'INV-003',
        status: 'overdue',
        dueDate: new Date('2024-12-10'),
        createdAt: new Date('2024-11-25'),
        items: [
          { description: 'Mobile App Bug Fixes', quantity: 10, rate: 500, amount: 5000 },
          { description: 'Performance Optimization', quantity: 1, rate: 3200, amount: 3200 },
        ],
      },
      {
        clientId: clients[3].id,
        invoiceNumber: 'INV-004',
        status: 'paid',
        dueDate: new Date('2024-12-18'),
        createdAt: new Date('2024-12-03'),
        paidAt: new Date('2024-12-16'),
        items: [
          { description: 'Content Writing - Blog Posts', quantity: 10, rate: 3000, amount: 30000 },
          { description: 'Social Media Management', quantity: 1, rate: 10000, amount: 10000 },
        ],
      },
      {
        clientId: clients[4].id,
        invoiceNumber: 'INV-005',
        status: 'sent',
        dueDate: new Date('2024-12-25'),
        createdAt: new Date('2024-12-10'),
        items: [
          { description: 'E-commerce Development', quantity: 1, rate: 8000, amount: 8000 },
          { description: 'Payment Gateway Integration', quantity: 1, rate: 4300, amount: 4300 },
        ],
      },
      {
        clientId: clients[0].id,
        invoiceNumber: 'INV-006',
        status: 'draft',
        dueDate: new Date('2025-01-05'),
        createdAt: new Date('2024-12-12'),
        items: [
          { description: 'API Development', quantity: 1, rate: 12000, amount: 12000 },
          { description: 'Testing & QA', quantity: 1, rate: 6000, amount: 6000 },
        ],
      },
      {
        clientId: clients[1].id,
        invoiceNumber: 'INV-007',
        status: 'paid',
        dueDate: new Date('2024-12-12'),
        createdAt: new Date('2024-11-28'),
        paidAt: new Date('2024-12-10'),
        items: [
          { description: 'Package Design', quantity: 3, rate: 8000, amount: 24000 },
          { description: 'Print Design', quantity: 1, rate: 5000, amount: 5000 },
        ],
      },
      {
        clientId: clients[5].id,
        invoiceNumber: 'INV-008',
        status: 'pending',
        dueDate: new Date('2024-12-30'),
        createdAt: new Date('2024-12-15'),
        items: [
          { description: 'Marketing Strategy Consultation', quantity: 1, rate: 5000, amount: 5000 },
          { description: 'Campaign Management', quantity: 1, rate: 4800, amount: 4800 },
        ],
      },
    ]

    for (const config of invoiceConfigs) {
      const subtotal = config.items.reduce((sum, item) => sum + item.amount, 0)
      const taxAmount = subtotal * 0.18
      const total = subtotal + taxAmount

      await db.invoice.create({
        data: {
          userId: user.id,
          clientId: config.clientId,
          invoiceNumber: config.invoiceNumber,
          status: config.status,
          dueDate: config.dueDate,
          createdAt: config.createdAt,
          paidAt: config.paidAt || null,
          subtotal,
          taxRate: 18,
          taxAmount,
          total: Math.round(total),
          notes: config.notes || null,
          items: {
            create: config.items,
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      stats: {
        user: 1,
        clients: clients.length,
        invoices: invoiceConfigs.length,
      },
    })
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 })
  }
}
