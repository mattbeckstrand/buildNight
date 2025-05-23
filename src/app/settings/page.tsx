"use client";

import AuthGuard from "@/components/AuthGuard";
import UserInfo from "@/components/UserInfo";
import { supabase } from "@/utils/supabaseClient";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Photo {
  id: string;
  url: string; // now just the file path
  signedUrl?: string;
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
  const router = useRouter();

  // Helper to get signed URLs for all photos
  const getSignedUrls = async (photos: Photo[]) => {
    const signedPhotos = await Promise.all(
      photos.map(async (photo) => {
        if (!photo.url) return photo;
        const { data } = await supabase.storage
          .from("profile-photos")
          .createSignedUrl(photo.url, 60 * 60); // 1 hour
        return { ...photo, signedUrl: data?.signedUrl };
      })
    );
    return signedPhotos;
  };

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
    const signedPhotos = await getSignedUrls(data || []);
    setPhotos(signedPhotos);
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
    // Save just the file path to DB
    const { error: dbError } = await supabase.from("profile_photos").insert({
      user_id: user.id,
      url: filePath,
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
    if (photo.url) {
      await supabase.storage.from("profile-photos").remove([photo.url]);
    }
    // Remove from DB
    await supabase.from("profile_photos").delete().eq("id", photo.id);
    fetchPhotos();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
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
                  {photo.signedUrl ? (
                    <Image
                      src={photo.signedUrl}
                      alt={`Embarrassing ${i + 1}`}
                      width={80}
                      height={80}
                      className="border-4 border-royal object-cover shadow-chess w-20 h-20"
                      style={{ borderRadius: 0, objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      className="w-20 h-20 flex items-center justify-center bg-gray-800 text-gray-400 border-4 border-royal shadow-chess"
                      style={{ borderRadius: 0 }}
                    >
                      No Image
                    </div>
                  )}
                  <button
                    className="absolute top-1 right-1 bg-jet border-2 border-red-600 p-1 text-red-600 hover:bg-red-600 hover:text-white shadow-chess transition font-header uppercase"
                    title="Delete"
                    style={{ borderRadius: 0 }}
                    onClick={() => handleDelete(photo)}
                    disabled={photos.length <= 1}
                  >
                    <span className="flex items-center gap-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
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
            className="ml-auto px-4 py-2 font-header uppercase tracking-widest bg-red-600 text-white font-bold shadow-chess border-4 border-royal transition-all duration-150 hover:animate-jitter flex items-center gap-2"
            style={{ borderRadius: 0 }}
            onClick={async () => {
              if (
                !window.confirm(
                  "Are you sure you want to delete your account? This cannot be undone."
                )
              )
                return;
              const {
                data: { user },
              } = await supabase.auth.getUser();
              if (!user) return;
              // Delete all user data
              await supabase
                .from("profile_photos")
                .delete()
                .eq("user_id", user.id);
              await supabase.from("goals").delete().eq("user_id", user.id);
              // Sign out
              await supabase.auth.signOut();
              router.push("/");
            }}
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18M9 6v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V6" />
              <path d="M10 11v6m4-6v6" />
            </svg>
            Delete Account
          </button>
        </section>
        <div className="flex justify-end mt-4">
          <button
            className="px-4 py-2 font-header uppercase tracking-widest bg-lime text-jet font-bold shadow-chess border-4 border-royal transition-all duration-150 hover:animate-jitter flex items-center gap-2"
            style={{ borderRadius: 0 }}
            onClick={handleLogout}
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 16l4-4m0 0l-4-4m4 4H7" />
              <path d="M3 12h4" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </AuthGuard>
  );
}
