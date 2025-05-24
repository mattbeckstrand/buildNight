"use client";
import UserInfo from "@/components/UserInfo";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ClientHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });
  }, []);
  const href = isLoggedIn ? "/dashboard" : "/";
  return (
    <header className="sticky top-0 z-20 w-full bg-jet border-b-4 border-royal shadow-chess py-3 px-4 flex items-center justify-between">
      <Link href={href} className="flex items-center gap-3 group">
        <img
          src="/checkmate.png"
          alt="CheckMate Logo"
          className="h-10 w-10 group-hover:scale-105 transition-transform"
        />
        <span className="font-header text-2xl uppercase tracking-widest text-royal font-bold group-hover:text-lime transition-colors">
          CheckMate
        </span>
        <span className="text-xs text-lime font-header font-bold ml-2 hidden sm:inline uppercase">
          Don't get roasted. Check in!
        </span>
      </Link>
      <nav className="flex gap-4 text-royal font-header text-sm uppercase items-center">
        <a href="/dashboard" className="hover:text-lime transition-colors">
          Dashboard
        </a>
        <div className="ml-4 flex items-center">
          <UserInfo compact />
        </div>
      </nav>
    </header>
  );
}
