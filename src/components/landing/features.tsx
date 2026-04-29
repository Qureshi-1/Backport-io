'use client'

import { motion } from 'framer-motion'
import { Sparkles, Activity, Bell, Globe, PieChart, BarChart3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: Sparkles,
    title: 'AI Invoice Generation',
    description: 'Generate professional invoices in seconds with AI. Auto-fill details, suggest line items, and create branded templates.',
  },
  {
    icon: Activity,
    title: 'Real-time Tracking',
    description: 'Track every invoice status in real-time. Know exactly when clients view and pay your invoices.',
  },
  {
    icon: Bell,
    title: 'Smart Reminders',
    description: 'Automated payment reminders that get sent at the right time to maximize your collection rate.',
  },
  {
    icon: Globe,
    title: 'Multi-Currency',
    description: 'Support for 135+ currencies with automatic conversion. Bill international clients with ease.',
  },
  {
    icon: PieChart,
    title: 'Expense Tracking',
    description: 'Track expenses alongside income. Get a complete picture of your financial health.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Powerful insights into your revenue, client behavior, and payment patterns with visual reports.',
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything you need to{' '}
            <span className="text-emerald-600">get paid</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to streamline your invoicing workflow and help you get paid faster.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full border border-border hover:border-emerald-200 dark:hover:border-emerald-800 transition-all hover:shadow-lg hover:shadow-emerald-500/5 group cursor-pointer">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center mb-4 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
                    <feature.icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
