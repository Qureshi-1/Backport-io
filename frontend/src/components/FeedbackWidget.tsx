"use client";
import { useState } from "react";
import { fetchApi } from "@/lib/api";
import { MessageSquare, X, Loader2 } from "lucide-react";

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState("general");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState({ state: "idle", text: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus({ state: "submitting", text: "" });
    try {
      await fetchApi("/api/feedback", {
        method: "POST",
        body: JSON.stringify({ type, message }),
      });
      setStatus({ state: "success", text: "Thank you for your feedback!" });
      setTimeout(() => {
        setIsOpen(false);
        setMessage("");
        setStatus({ state: "idle", text: "" });
      }, 2000);
    } catch (err: any) {
      setStatus({ state: "error", text: err.message || "Failed to submit" });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-black p-4 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <div className="bg-zinc-900 border border-zinc-700 w-80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div className="bg-zinc-800 px-4 py-3 flex items-center justify-between">
            <span className="font-semibold text-white">Send Feedback</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-sm text-white focus:border-emerald-500 outline-none"
            >
              <option value="general">General</option>
              <option value="feature">Feature Request</option>
              <option value="bug">Bug Report</option>
            </select>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what you think..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-sm text-white focus:border-emerald-500 outline-none min-h-[100px] resize-none"
            />
            {status.text && (
              <div
                className={`text-xs p-2 rounded ${status.state === "error" ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}
              >
                {status.text}
              </div>
            )}
            <button
              type="submit"
              disabled={status.state === "submitting"}
              className="mt-2 w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {status.state === "submitting" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Submit
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
