"use client";

import AuthGuard from "@/components/AuthGuard";
import UserInfo from "@/components/UserInfo";
import { supabase } from "@/utils/supabaseClient";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface Photo {
  id: string;
  url: string;
}

const mockGoogleAccount = {
  displayName: "Goal Getter",
  email: "goal.getter@gmail.com",
  avatar: "/mock/avatar.jpg",
};

export default function SettingsPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPhotos = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("profile_photos")
      .select("id, url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    setPhotos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPhotos();
    // eslint-disable-next-line
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("File size must be 3MB or less.");
      return;
    }
    setUploading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not logged in");
      setUploading(false);
      return;
    }
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(filePath, file, { upsert: false });
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }
    // Get public URL
    const { data: urlData } = supabase.storage
      .from("profile-photos")
      .getPublicUrl(filePath);
    const publicUrl = urlData?.publicUrl;
    // Save to DB
    const { error: dbError } = await supabase.from("profile_photos").insert({
      user_id: user.id,
      url: publicUrl,
    });
    if (dbError) {
      setError(dbError.message);
    } else {
      fetchPhotos();
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (photo: Photo) => {
    setError(null);
    // Remove from storage
    const path = photo.url.split("/profile-photos/")[1];
    if (path) {
      await supabase.storage.from("profile-photos").remove([path]);
    }
    // Remove from DB
    await supabase.from("profile_photos").delete().eq("id", photo.id);
    fetchPhotos();
  };

  return (
    <AuthGuard>
      <UserInfo />
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-10">
        <h2 className="text-3xl font-header uppercase text-royal tracking-widest mb-4">
          Settings
        </h2>
        <section
          className="bg-jet border-4 border-royal shadow-chess p-6 mb-6"
          style={{ borderRadius: 0 }}
        >
          <h3 className="text-lg font-header uppercase text-lime mb-2 tracking-widest">
            Your Embarrassing Photos
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-royal"></div>
            </div>
          ) : (
            <div className="flex gap-4 items-center">
              {photos.map((photo, i) => (
                <div key={photo.id} className="relative group">
                  <Image
                    src={photo.url}
                    alt={`Embarrassing ${i + 1}`}
                    width={80}
                    height={80}
                    className="border-4 border-royal object-cover shadow-chess"
                    style={{ borderRadius: 0 }}
                  />
                  <button
                    className="absolute top-1 right-1 bg-jet border-2 border-lime p-1 text-lime hover:bg-royal shadow-chess transition font-header uppercase"
                    title="Delete"
                    style={{ borderRadius: 0 }}
                    onClick={() => handleDelete(photo)}
                    disabled={photos.length <= 1}
                  >
                    <span className="flex items-center gap-1">
                      <span className="text-xl">♟️</span>
                    </span>
                  </button>
                </div>
              ))}
              {photos.length < 3 && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                  <button
                    className="w-20 h-20 flex items-center justify-center border-4 border-dashed border-royal text-lime hover:bg-royal transition font-header text-3xl font-bold shadow-chess"
                    style={{ borderRadius: 0 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <div className="animate-spin w-8 h-8 border-b-4 border-lime rounded-full" />
                    ) : (
                      <span className="text-3xl">+</span>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
          <p className="text-xs text-lime mt-2 font-header uppercase">
            {photos.length < 1
              ? "You must upload at least 1 photo."
              : photos.length < 3
              ? `You can upload ${3 - photos.length} more photo${
                  3 - photos.length > 1 ? "s" : ""
                }.`
              : "Maximum 3 photos allowed."}
          </p>
          {error && (
            <div className="text-red-500 font-header uppercase mt-2">
              {error}
            </div>
          )}
        </section>
        <section
          className="bg-jet border-4 border-royal shadow-chess p-6 flex items-center gap-4"
          style={{ borderRadius: 0 }}
        >
          <Image
            src={mockGoogleAccount.avatar}
            alt="Google avatar"
            width={48}
            height={48}
            className="border-4 border-royal shadow-chess"
            style={{ borderRadius: 0 }}
          />
          <div>
            <div className="font-header text-lime uppercase tracking-widest">
              {mockGoogleAccount.displayName}
            </div>
            <div className="text-royal font-header uppercase text-xs">
              {mockGoogleAccount.email}
            </div>
          </div>
          <button
            className="ml-auto px-4 py-2 font-header uppercase tracking-widest bg-lime text-jet font-bold shadow-chess border-4 border-royal transition-all duration-150 hover:animate-jitter flex items-center gap-2"
            style={{ borderRadius: 0 }}
          >
            <svg className="w-6 h-6" viewBox="0 0 48 48">
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
            Disconnect Google
          </button>
        </section>
      </div>
    </AuthGuard>
  );
}
