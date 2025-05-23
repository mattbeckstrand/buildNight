"use client";
import { supabase } from "@/utils/supabaseClient";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface Photo {
  id: string;
  url: string;
  signedUrl?: string;
}

export default function OnboardingModal({
  open,
  onComplete,
  userId,
}: {
  open: boolean;
  onComplete: () => void;
  userId: string;
}) {
  const [username, setUsername] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch photos for this user
  const fetchPhotos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profile_photos")
      .select("id, url")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    // Get signed URLs
    const signedPhotos = await Promise.all(
      (data || []).map(async (photo) => {
        if (!photo.url) return photo;
        const { data } = await supabase.storage
          .from("profile-photos")
          .createSignedUrl(photo.url, 60 * 60);
        return { ...photo, signedUrl: data?.signedUrl };
      })
    );
    setPhotos(signedPhotos);
    setLoading(false);
  };

  // Fetch on open
  useEffect(() => {
    if (open && userId) fetchPhotos();
  }, [open, userId]);

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
    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}/${Date.now()}.${fileExt}`;
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
      user_id: userId,
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
    if (photo.url) {
      await supabase.storage.from("profile-photos").remove([photo.url]);
    }
    await supabase.from("profile_photos").delete().eq("id", photo.id);
    fetchPhotos();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // Save username
    const res = await fetch("/api/onboarding-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, instagram_username: username }),
    });
    if (!res.ok) {
      setError("Failed to save Instagram username.");
      setLoading(false);
      return;
    }
    setLoading(false);
    onComplete();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <form
        className="bg-jet border-4 border-royal shadow-chess p-8 w-full max-w-md space-y-6"
        style={{ borderRadius: 0 }}
        onSubmit={handleSubmit}
      >
        <h3 className="text-xl font-header uppercase text-lime tracking-widest mb-2 text-center">
          Finish Setting Up
        </h3>
        <div>
          <label className="block font-header text-royal uppercase mb-1">
            Instagram Username*
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 bg-black text-lime border-2 border-royal font-body"
            style={{ borderRadius: 0 }}
            required
          />
        </div>
        <div>
          <label className="block font-header text-royal uppercase mb-1">
            Upload at least 1 photo*
          </label>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-royal"></div>
            </div>
          ) : (
            <div className="flex gap-4 items-center">
              {photos.map((photo, i) => (
                <div key={photo.id} className="relative group">
                  {photo.signedUrl ? (
                    <Image
                      src={photo.signedUrl}
                      alt={`Embarrassing ${i + 1}`}
                      width={60}
                      height={60}
                      className="border-4 border-royal object-cover shadow-chess w-16 h-16"
                      style={{ borderRadius: 0, objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      className="w-16 h-16 flex items-center justify-center bg-gray-800 text-gray-400 border-4 border-royal shadow-chess"
                      style={{ borderRadius: 0 }}
                    >
                      No Image
                    </div>
                  )}
                  <button
                    className="absolute top-1 right-1 bg-jet border-2 border-red-600 p-1 text-red-600 hover:bg-red-600 hover:text-white shadow-chess transition font-header uppercase"
                    title="Delete"
                    style={{ borderRadius: 0 }}
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(photo);
                    }}
                    disabled={photos.length <= 1}
                  >
                    <span className="flex items-center gap-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-4 h-4"
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
                    className="w-16 h-16 flex items-center justify-center border-4 border-dashed border-royal text-lime hover:bg-royal transition font-header text-2xl font-bold shadow-chess"
                    style={{ borderRadius: 0 }}
                    onClick={(e) => {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <div className="animate-spin w-6 h-6 border-b-4 border-lime rounded-full" />
                    ) : (
                      <span className="text-2xl">+</span>
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
        </div>
        {error && (
          <div className="text-red-500 font-header uppercase mt-2">{error}</div>
        )}
        <button
          type="submit"
          className="w-full py-3 font-header text-lg uppercase tracking-widest bg-lime text-jet font-bold shadow-chess border-4 border-royal transition-all duration-150 disabled:opacity-50"
          style={{ borderRadius: 0 }}
          disabled={loading || username.trim() === "" || photos.length < 1}
        >
          Continue
        </button>
      </form>
    </div>
  );
}
