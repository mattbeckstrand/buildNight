"use client";

import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    let ignore = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!ignore) {
        if (!data.user) {
          router.replace("/");
        } else {
          setUser(data.user);
        }
        setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-royal"></div>
      </div>
    );
  }

  return <>{children}</>;
}
