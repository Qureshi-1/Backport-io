'use client'

import { motion } from 'framer-motion'

const stats = [
  { value: '₹2.5Cr+', label: 'Invoices Processed' },
  { value: '98.5%', label: 'On-time Payments' },
  { value: '2,000+', label: 'Businesses Worldwide' },
  { value: '135+', label: 'Currencies Supported' },
]

export function Stats() {
  return (
    <section className="py-20 md:py-28 bg-emerald-600 dark:bg-emerald-800 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-600 dark:from-emerald-800 dark:to-teal-900" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6TTAgMzR2LTJoMnYyaC0yem0wLTR2LTJoMnYyaC0yem0wLTR2LTJoMnYyaC0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Trusted by businesses everywhere
          </h2>
          <p className="text-emerald-100 text-lg">
            Numbers that speak for themselves
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
                {stat.value}
              </div>
              <div className="text-emerald-100 text-sm sm:text-base">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
