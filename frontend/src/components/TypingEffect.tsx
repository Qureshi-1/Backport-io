"use client";

import { useState, useEffect } from "react";

export default function TypingEffect() {
  const [text, setText] = useState("");
  const fullText = "Initializing Backportio Secure Gateway...";

  useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      setText(fullText.substring(0, i));
      i++;
      if (i > fullText.length) {
        clearInterval(typingInterval);
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, []);

  return (
    <div className="font-mono text-lg text-green-400 drop-shadow-[0_0_8px_rgba(0,255,135,0.8)]">
      {text}
      <span className="animate-pulse inline-block w-2 bg-green-400 h-5 ml-1 align-middle"></span>
    </div>
  );
}
