'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const testimonials = [
  {
    name: 'Rajesh K.',
    role: 'Freelance Developer',
    initials: 'RK',
    rating: 5,
    text: "InvoiceFlow has completely transformed how I manage my freelance billing. The AI-generated invoices look professional and my clients love the payment experience. I've seen my payment time reduce by 60%.",
  },
  {
    name: 'Priya S.',
    role: 'Design Studio Owner',
    initials: 'PS',
    rating: 5,
    text: "As a design studio handling multiple clients, InvoiceFlow's analytics and tracking features are invaluable. The multi-currency support makes billing international clients seamless. Absolutely love it!",
  },
  {
    name: 'Amit M.',
    role: 'Agency Founder',
    initials: 'AM',
    rating: 5,
    text: "We switched from multiple tools to InvoiceFlow and haven't looked back. The team management, custom branding, and automated reminders save us hours every week. Our collection rate improved from 75% to 95%.",
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 md:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Loved by <span className="text-emerald-600">businesses</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See what our customers have to say about InvoiceFlow.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full border border-border">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-emerald-500 text-emerald-500"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    &ldquo;{testimonial.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                      <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                        {testimonial.initials}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
