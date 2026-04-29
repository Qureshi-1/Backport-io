'use client'

import { motion } from 'framer-motion'
import { FileEdit, Send, BadgeCheck } from 'lucide-react'

const steps = [
  {
    icon: FileEdit,
    number: '01',
    title: 'Create',
    description: 'Generate a professional invoice in seconds using AI or our intuitive editor. Add your branding, line items, and terms.',
  },
  {
    icon: Send,
    number: '02',
    title: 'Send',
    description: 'Share invoices via email or direct link. Clients can view and pay online with multiple payment options.',
  },
  {
    icon: BadgeCheck,
    number: '03',
    title: 'Get Paid',
    description: 'Track payments in real-time. Automated reminders ensure you never miss a payment deadline.',
  },
]

export function HowItWorks() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Get paid in <span className="text-emerald-600">3 simple steps</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From creating an invoice to receiving payment, it&apos;s never been easier.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
          {/* Connector lines - desktop only */}
          <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-emerald-300 via-emerald-500 to-emerald-300" />

          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="text-center relative"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-200 dark:border-emerald-800 mb-6 relative z-10">
                <step.icon className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="text-xs font-bold text-emerald-600 tracking-widest mb-2">
                STEP {step.number}
              </div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
