import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black pb-8 pt-[50px] mt-[50px]">
      <div className="mx-auto mb-12 grid max-w-7xl gap-10 px-6 md:grid-cols-4">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck
              suppressHydrationWarning
              className="h-5 w-5 text-emerald-500"
            />
            <span className="text-base font-semibold text-white">Backport</span>
          </div>
          <p className="text-sm leading-relaxed text-zinc-500">
            Open source API Gateway. Security and speed for every backend.
          </p>
        </div>
        <div>
          <p className="mb-4 text-sm font-semibold text-white">Product</p>
          <ul className="space-y-2">
            <li>
              <Link href="/#features" className="text-sm text-zinc-500 transition-colors hover:text-emerald-400">
                Features
              </Link>
            </li>
            <li>
              <Link href="/#pricing" className="text-sm text-zinc-500 transition-colors hover:text-emerald-400">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/docs" className="text-sm text-zinc-500 transition-colors hover:text-emerald-400">
                Docs
              </Link>
            </li>
            <li>
              <Link href="/changelog" className="text-sm text-zinc-500 transition-colors hover:text-emerald-400">
                Changelog
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-4 text-sm font-semibold text-white">Company</p>
          <ul className="space-y-2">
            <li>
              <Link href="/about" className="text-sm text-zinc-500 transition-colors hover:text-emerald-400">
                About
              </Link>
            </li>
            <li>
              <Link href="/blog" className="text-sm text-zinc-500 transition-colors hover:text-emerald-400">
                Blog
              </Link>
            </li>
            <li>
              <a href="https://github.com/Qureshi-1/Backport-io" className="text-sm text-zinc-500 transition-colors hover:text-emerald-400">
                GitHub
              </a>
            </li>
            <li>
              <a href="https://twitter.com/backportio" className="text-sm text-zinc-500 transition-colors hover:text-emerald-400" target="_blank" rel="noopener noreferrer">
                Twitter
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-4 text-sm font-semibold text-white">Legal</p>
          <ul className="space-y-2">
            <li>
              <Link href="/privacy" className="text-sm text-zinc-500 transition-colors hover:text-emerald-400">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-sm text-zinc-500 transition-colors hover:text-emerald-400">
                Terms of Service
              </Link>
            </li>
            <li>
              <a href="mailto:security@backportio.com" className="text-sm text-zinc-500 transition-colors hover:text-emerald-400">
                Security
              </a>
            </li>
            <li>
              <a href="mailto:support@backportio.com" className="text-sm text-zinc-500 transition-colors hover:text-emerald-400">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/5 px-6 pt-8 md:flex-row">
        <p className="text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} Backport. MIT Licensed. Built for developers.
        </p>
        <p className="text-xs text-zinc-600">
          Built with Next.js & FastAPI
        </p>
      </div>
    </footer>
  );
}
