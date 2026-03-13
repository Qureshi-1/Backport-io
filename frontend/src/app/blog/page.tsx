import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function ComingSoonPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-center">
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
        <span className="text-2xl text-emerald-400">🚧</span>
      </div>
      <h1 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Coming Soon
      </h1>
      <p className="mb-8 max-w-md text-zinc-400">
        We are working on it. Get notified when this page goes live.
      </p>
      <form className="mb-8 flex w-full max-w-sm items-center gap-2" onSubmit={(e) => e.preventDefault()}>
        <input
          type="email"
          placeholder="Enter your email"
          className="h-10 text-sm flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-4 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          className="h-10 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-black transition-colors hover:bg-emerald-400"
          type="button"
        >
          Notify Me
        </button>
      </form>
      <Link
        href="/"
        className="group flex items-center gap-2 text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
      >
        <ArrowRight className="h-4 w-4 rotate-180 transition-transform group-hover:-translate-x-1" />
        Back to Home
      </Link>
    </div>
  );
}
