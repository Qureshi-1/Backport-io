"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { auth } from "@/lib/auth";
import toast from "react-hot-toast";
import MatrixBackground from "@/components/MatrixBackground";
import TypingEffect from "@/components/TypingEffect";
import LoginCard from "@/components/LoginCard";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [coldStartMsg, setColdStartMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setColdStartMsg("");

    if (!email.match(/^\S+@\S+\.\S+$/)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    let timeout = setTimeout(() => {
      setColdStartMsg("Backend is waking up, please wait ~30 seconds...");
    }, 4000);
    try {
      const data = await fetchApi("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      auth.setToken(data.token);
      auth.setApiKey(data.api_key);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (err: any) {
      let msg = err.message || "Login failed";
      
      const lowerMsg = msg.toLowerCase();
      if (lowerMsg.includes("credentials") || lowerMsg.includes("unauthorized") || lowerMsg.includes("password") || lowerMsg.includes("incorrect")) {
        msg = "Invalid email or password. Please try again.";
      } else if (lowerMsg.includes("not found") || lowerMsg.includes("no account")) {
        msg = "Account not found. Consider signing up.";
      }
      
      setError(msg);
      toast.error(msg);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-center p-4 overflow-hidden">
      <MatrixBackground />
      
      <div className="absolute top-16 md:top-24 w-full text-center px-4 z-10">
        <TypingEffect />
      </div>

      <div className="z-10 w-full flex justify-center mt-12">
        <LoginCard
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          error={error}
          coldStartMsg={coldStartMsg}
          loading={loading}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
