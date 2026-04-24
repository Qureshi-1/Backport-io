"use client";
import Link from "next/link";
import { ArrowLeft, Share2 } from "lucide-react";
import Footer from "@/components/Footer";

export default function BlogPostLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080C10] text-zinc-300">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#080C10]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-2 text-[#A2BDDB]/40 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: document.title, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
              className="p-2 text-[#A2BDDB]/30 hover:text-white transition-colors"
              title="Share this article"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <article className="pt-24 pb-16">
        {children}
      </article>

      <Footer />
    </div>
  );
}
