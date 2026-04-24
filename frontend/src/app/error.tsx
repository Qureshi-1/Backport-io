"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Backport Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-zinc-900 border border-red-500/20 rounded-2xl p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-zinc-400 text-sm mb-4">
            An unexpected error occurred. Please try again.
          </p>
          {process.env.NODE_ENV === "development" && (
            <div className="bg-black/50 border border-red-500/10 rounded-lg p-4 text-left">
              <p className="text-red-400 text-xs font-mono break-words">{error?.message || "No error message"}</p>
              {error?.digest && (
                <p className="text-zinc-500 text-xs mt-2 font-mono">Digest: {error.digest}</p>
              )}
              {error?.stack && (
                <pre className="text-zinc-600 text-[10px] mt-2 overflow-auto max-h-32 whitespace-pre-wrap font-mono">{error.stack}</pre>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => reset()}
          className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    </div>
  );
}
