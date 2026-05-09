<<<<<<< HEAD
import Link from "next/link";
import { ArrowLeft, Calendar, User, Clock, Share2, Twitter, Linkedin, LinkIcon } from "lucide-react";

export default function BlogPostLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-zinc-300">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
=======
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
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
          <div className="flex items-center gap-4">
<<<<<<< HEAD
            <button className="p-2 text-zinc-500 hover:text-white transition-colors">
=======
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
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <article className="pt-24 pb-16">
        {children}
      </article>

<<<<<<< HEAD
      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-zinc-500 mb-4">Found this helpful? Share it!</p>
          <div className="flex justify-center gap-4">
            <a href="https://twitter.com/intent/tweet?text=Check%20out%20this%20article%20about%20API%20security!" className="p-3 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="https://linkedin.com/shareArticle?mini=true" className="p-3 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
            <button className="p-3 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
              <LinkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </footer>
=======
      <Footer />
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
    </div>
  );
}
