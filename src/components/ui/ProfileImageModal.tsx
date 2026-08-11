"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Upload, Check, AlertCircle } from "lucide-react";
import { scaleIn } from "@/src/utils/motion";

interface ProfileImageModalProps {
  userId: string;
  currentAvatarUrl: string;
  onClose: () => void;
  onUploaded: (newUrl: string) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];

export const ProfileImageModal: React.FC<ProfileImageModalProps> = ({
  userId,
  currentAvatarUrl,
  onClose,
  onUploaded,
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = e.target.files?.[0];
    if (!f) return;

    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError("Unsupported file type. Please upload a PNG, JPG, or WebP image.");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setError("File is too large. Maximum size is 5 MB.");
      return;
    }

    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/users/${userId}/avatar`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(data.error || "Upload failed");
      }

      const result = await res.json();
      const newUrl = result.avatarUrl || result.avatar || result.url;
      if (newUrl) {
        onUploaded(newUrl);
      }
    } catch (err: any) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePreview = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          exit="exit"
          className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl"
        >
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Update Profile Picture
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="py-4 space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <img
                  src={preview || currentAvatarUrl}
                  alt="Profile preview"
                  className="h-24 w-24 rounded-full object-cover border-4 border-slate-100 dark:border-slate-800"
                  referrerPolicy="no-referrer"
                />
                {preview && (
                  <button
                    onClick={handleRemovePreview}
                    type="button"
                    className="absolute -bottom-1 -right-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 hover:text-rose-600 transition"
                    title="Remove preview"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-xl">
                <AlertCircle className="h-3 w-3" />
                {error}
              </div>
            )}

            <div className="flex items-center justify-center">
              <label className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl cursor-pointer transition flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {file ? "Change Photo" : "Choose File"}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES.join(",")}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {file && (
              <div className="text-center text-[11px] text-slate-500 dark:text-slate-400">
                {file.name} ({(file.size / 1024).toFixed(0)} KB)
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || !file}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="h-3 w-3" />
                  Save Photo
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
