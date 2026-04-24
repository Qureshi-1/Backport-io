"use client";
import { useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";

interface ContactSalesModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ContactSalesModal({ open, onClose }: ContactSalesModalProps) {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [status, setStatus] = useState<{ state: "idle" | "submitting" | "success" | "error"; text: string }>({ state: "idle", text: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || form.message.trim().length < 10) return;
    setStatus({ state: "submitting", text: "" });
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://backport-io.onrender.com"}/api/contact-sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus({ state: "success", text: "" });
      } else {
        setStatus({ state: "error", text: "Something went wrong. Try again." });
      }
    } catch {
      setStatus({ state: "error", text: "Could not connect. Please try again." });
    }
  };

  const handleClose = () => {
    if (status.state !== "submitting") {
      onClose();
      // Reset after close animation
      setTimeout(() => {
        setStatus({ state: "idle", text: "" });
        setForm({ name: "", email: "", company: "", message: "" });
      }, 300);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={handleClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>

        {status.state === "success" ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Inquiry Sent!</h3>
            <p className="text-zinc-400 text-sm mb-6">Thanks for your interest. We&apos;ll get back to you within 24 hours.</p>
            <button onClick={handleClose} className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition-colors">
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">Enterprise Inquiry</h3>
              <p className="text-zinc-500 text-sm">Tell us about your needs. We&apos;ll reach out within 24 hours.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Name *</label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] outline-none transition-colors"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] outline-none transition-colors"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Company</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] outline-none transition-colors"
                  placeholder="Your company (optional)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Message *</label>
                <textarea
                  required
                  minLength={10}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] outline-none transition-colors resize-none"
                  placeholder="Tell us about your requirements..."
                />
              </div>

              {status.state === "error" && (
                <div className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{status.text}</div>
              )}

              <button
                type="submit"
                disabled={status.state === "submitting"}
                className="w-full py-3.5 rounded-xl bg-[#f97316] hover:bg-[#fbbf24] text-black font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {status.state === "submitting" && <Loader2 className="h-4 w-4 animate-spin" />}
                Send Inquiry
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
