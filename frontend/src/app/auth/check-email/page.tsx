"use client";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * DEPRECATED: This page redirects to the new /auth/verify page.
 * The check-email flow has been replaced with in-app OTP verification.
 */
function CheckEmailRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";

  useEffect(() => {
    // Redirect to the new verify page (without a token — user needs to use resend)
    router.replace(`/auth/verify${email ? `?email=${encodeURIComponent(email)}` : ""}`);
  }, [email, router]);

  return (
    <div className="min-h-screen bg-[#080C10] flex items-center justify-center">
      <div className="h-8 w-8 border-2 border-[#2CE8C3]/30 border-t-[#2CE8C3] rounded-full animate-spin" />
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080C10] flex items-center justify-center">
          <div className="h-8 w-8 border-2 border-[#2CE8C3]/30 border-t-[#2CE8C3] rounded-full animate-spin" />
        </div>
      }
    >
      <CheckEmailRedirect />
    </Suspense>
  );
}
