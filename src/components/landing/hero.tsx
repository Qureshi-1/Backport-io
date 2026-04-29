'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Play, Sparkles, BarChart3, Shield, IndianRupee, Clock, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 to-transparent dark:from-emerald-950/20" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 mb-6">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
              AI-Powered Invoice Management
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6">
            Invoices That{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Pay You Faster
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Generate professional invoices in seconds with AI, track payments in real-time,
            and get paid 3x faster with smart automated reminders.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white text-base px-8">
              Start Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" size="lg" className="text-base px-8">
              <Play className="w-4 h-4 mr-2" />
              Watch Demo
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Trusted by <span className="font-semibold text-foreground">2,000+</span> businesses worldwide
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-12 md:mt-16 max-w-5xl mx-auto"
        >
          <div className="rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-3 py-1 rounded-md bg-background text-xs text-muted-foreground">
                  app.invoiceflow.com/dashboard
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                {[
                  { label: 'Total Revenue', value: '₹1,24,500', icon: IndianRupee, color: 'text-emerald-600' },
                  { label: 'Pending', value: '₹45,200', icon: Clock, color: 'text-yellow-600' },
                  { label: 'Paid', value: '₹79,300', icon: BarChart3, color: 'text-blue-600' },
                  { label: 'Clients', value: '42', icon: Users, color: 'text-purple-600' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-border bg-card p-3 md:p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </div>
                    <div className="text-lg md:text-2xl font-bold">{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Bar chart mockup */}
              <div className="rounded-lg border border-border bg-card p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">Revenue Overview</span>
                  <span className="text-xs text-muted-foreground">Last 6 months</span>
                </div>
                <div className="flex items-end gap-2 h-32">
                  {[40, 65, 45, 80, 60, 90].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                        className="w-full rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400"
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'AI Powered', icon: Sparkles },
                  { label: 'Analytics', icon: BarChart3 },
                  { label: 'Secure', icon: Shield },
                ].map((pill) => (
                  <div
                    key={pill.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-medium"
                  >
                    <pill.icon className="w-3 h-3" />
                    {pill.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
