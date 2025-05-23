"use client";

import { supabase } from "@/utils/supabaseClient";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function UserInfo() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  if (!user) return null;

  // Try to get Google avatar from user metadata
  const avatarUrl = user.user_metadata?.avatar_url || "/mock/avatar.jpg";
  const email = user.email || user.user_metadata?.email || "";
  const name = user.user_metadata?.full_name || email;

  return (
    <div className="flex items-center gap-3 mb-6">
      <Image
        src={avatarUrl}
        alt="User avatar"
        width={48}
        height={48}
        className="border-4 border-royal shadow-chess"
        style={{ borderRadius: 0 }}
      />
      <div>
        <div className="font-header text-lime uppercase tracking-widest text-base">
          {name}
        </div>
        <div className="text-royal font-header uppercase text-xs">{email}</div>
      </div>
    </div>
  );
}
