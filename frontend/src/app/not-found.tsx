import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-center">
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl border-2 border-dashed border-emerald-500/30 bg-emerald-500/5">
        <span className="text-4xl text-emerald-400 font-mono">404</span>
      </div>
      <h1 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
        Page Not Found
      </h1>
      <p className="mb-10 max-w-md text-zinc-400 text-lg">
        The endpoint you are trying to reach has been rate limited, cached, or doesn't exist.
      </p>
      <Link
        href="/"
        className="group flex h-12 items-center gap-2 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-8 text-sm font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20"
      >
        Return to Home
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
