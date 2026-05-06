'use client'

import { FileText } from 'lucide-react'

const footerLinks = {
  Product: ['Features', 'Pricing', 'Documentation', 'Changelog'],
  Resources: ['Blog', 'API Reference', 'Setup Guide', 'Community'],
  Company: ['About', 'GitHub', 'Contact'],
  Legal: ['Privacy Policy', 'Terms of Service'],
}

export function Footer() {
  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold">
                Back<span className="text-emerald-600">port</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              Open-source API gateway with WAF, rate limiting, caching, and response transformation. Protect your API in 30 seconds.
            </p>
            <div className="flex gap-4">
              {['X', 'Li', 'Gh', 'Yt'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                >
                  {social}
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold mb-4">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Backport. Open Source under MIT License.
          </p>
          <p className="text-sm text-muted-foreground">
            Made with 💚 for businesses worldwide
          </p>
        </div>
      </div>
    </footer>
  )
}
