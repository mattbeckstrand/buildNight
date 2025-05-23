"use client";

import { supabase } from "@/utils/supabaseClient";
import Image from "next/image";

export default function Home() {
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          typeof window !== "undefined"
            ? window.location.origin + "/dashboard"
            : undefined,
      },
    });
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-jet p-4">
      <div className="max-w-xl w-full text-center space-y-8">
        <Image
          src="/checkmate.png"
          alt="CheckMate Logo"
          width={80}
          height={80}
          className="mx-auto shadow-chess"
        />
        <h1 className="text-4xl sm:text-5xl font-header uppercase text-royal drop-shadow-lg tracking-widest">
          CheckMate
        </h1>
        <p className="text-lg sm:text-xl text-white font-body">
          The public accountability app that keeps you honest. Upload your most
          embarrassing photos, set your goals, and let your friends (and the
          world) keep you motivated!
        </p>
        <div className="bg-jet border-4 border-royal shadow-chess p-6 space-y-4 text-left">
          <ul className="text-white font-body space-y-2">
            <li className="flex items-center gap-2">♟️ Only Google login</li>
            <li className="flex items-center gap-2">
              ♟️ Upload 3 embarrassing photos
            </li>
            <li className="flex items-center gap-2">
              ♟️ Set public goals with deadlines
            </li>
            <li className="flex items-center gap-2">
              ♟️ Miss a check-in? We post your photo to your accountability
              group!
            </li>
          </ul>
          <button
            className="mt-4 w-full py-4 px-6 font-header text-xl uppercase tracking-widest bg-lime text-jet font-bold shadow-chess border-4 border-royal transition-all duration-150 hover:animate-jitter flex items-center justify-center gap-2"
            style={{ borderRadius: 0 }}
            onClick={handleLogin}
          >
            <span className="inline-flex items-center gap-2">
              <svg className="w-7 h-7" viewBox="0 0 48 48">
                <g>
                  <path
                    fill="#4285F4"
                    d="M44.5 20H24v8.5h11.7C34.7 33.1 30.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.6 0 5 .8 7 2.3l6.4-6.4C33.5 5.1 28.9 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.3-.1-2.7-.3-4z"
                  />
                  <path
                    fill="#34A853"
                    d="M6.3 14.7l7 5.1C15.5 16.1 19.4 13 24 13c2.6 0 5 .8 7 2.3l6.4-6.4C33.5 5.1 28.9 3 24 3 15.7 3 8.3 8.2 6.3 14.7z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M24 45c6.1 0 11.2-2 14.9-5.4l-6.9-5.7C29.7 35.5 27 36.5 24 36.5c-6.1 0-11.3-4.1-13.2-9.6l-7 5.4C8.3 39.8 15.7 45 24 45z"
                  />
                  <path
                    fill="#EA4335"
                    d="M44.5 20H24v8.5h11.7c-1.2 3.2-4.7 7-11.7 7-6.6 0-12-5.4-12-12s5.4-12 12-12c2.6 0 5 .8 7 2.3l6.4-6.4C33.5 5.1 28.9 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.3-.1-2.7-.3-4z"
                  />
                </g>
              </svg>
              Login with Google
            </span>
          </button>
          <p className="text-xs text-lime mt-2 font-header uppercase">
            We only post if you miss your goal. Your secrets are safe... unless
            you fail! 😈
          </p>
        </div>
      </div>
    </main>
  );
}
