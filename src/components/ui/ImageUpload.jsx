/**
 * @file src/components/ui/ImageUpload.jsx
 * @description Reusable drag-and-drop image upload component with preview, validation,
 * and direct Supabase Storage integration. Replaces inline file inputs and URL paste fields
 * across all admin pages.
 * @importedBy src/pages/AdminInventory.jsx, src/pages/AdminEvents.jsx
 * @imports src/lib/storage.js, framer-motion, lucide-react
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { uploadImage, validateImageFile } from '../../lib/storage';

/**
 * ImageUpload — drag-and-drop / click-to-upload component with preview.
 *
 * @param {object} props
 * @param {string} props.bucket - Supabase storage bucket name (e.g. 'wine-images')
 * @param {string} [props.folder] - Optional subfolder within the bucket
 * @param {string} [props.currentUrl] - Existing image URL to show as preview
 * @param {Function} props.onUpload - Callback with the new public URL after successful upload
 * @param {Function} [props.onRemove] - Callback when the user removes the current image
 * @param {string} [props.placeholder] - Placeholder text (default: 'Upload image')
 * @param {string} [props.className] - Additional CSS classes for the container
 * @returns {JSX.Element}
 */
export default function ImageUpload({
  bucket,
  folder,
  currentUrl,
  onUpload,
  onRemove,
  placeholder = 'Upload image',
  className = '',
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // The displayed image: local preview while uploading, or the saved URL
  const displayUrl = previewUrl || currentUrl;

  /**
   * Handles the actual file upload to Supabase Storage.
   * Shows a local preview immediately, then uploads in background.
   * @param {File} file - Image file to upload
   */
  const handleFile = useCallback(async (file) => {
    if (!file) return;

    setError(null);

    // Validate before anything
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // Show local preview immediately for instant feedback
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setUploading(true);

    // Upload to Supabase
    const { url, error: uploadError } = await uploadImage(file, bucket, { folder });

    if (uploadError) {
      setError(uploadError);
      setPreviewUrl(null);
      URL.revokeObjectURL(localUrl);
    } else if (url) {
      onUpload(url);
      // Keep preview until parent updates currentUrl, then clear
      URL.revokeObjectURL(localUrl);
    }

    setUploading(false);
  }, [bucket, folder, onUpload]);

  /** Handle file input change */
  function handleInputChange(e) {
    handleFile(e.target.files?.[0]);
    // Reset input so re-selecting the same file works
    e.target.value = '';
  }

  /** Handle drag events */
  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    }
  }

  /** Remove the current image */
  function handleRemove(e) {
    e.stopPropagation();
    setPreviewUrl(null);
    setError(null);
    if (onRemove) onRemove();
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Upload zone or preview */}
      <AnimatePresence mode="wait">
        {displayUrl ? (
          /* Image preview */
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative group rounded-xl overflow-hidden border border-noir-700"
          >
            <img
              src={displayUrl}
              alt="Upload preview"
              className="w-full h-40 object-cover"
            />

            {/* Uploading overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-noir-900/70 flex items-center justify-center">
                <Loader2 size={24} className="text-champagne-500 animate-spin" />
              </div>
            )}

            {/* Remove button — always visible on mobile, hover on desktop */}
            {!uploading && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-noir-900/80 text-noir-300 hover:text-white hover:bg-noir-900 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <X size={14} />
              </button>
            )}

            {/* Click to replace */}
            {!uploading && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 opacity-0 sm:group-hover:opacity-100 bg-noir-900/50 flex items-center justify-center transition-opacity cursor-pointer"
              >
                <span className="font-sans text-xs text-white bg-noir-900/80 px-3 py-1.5 rounded-lg">
                  Replace image
                </span>
              </button>
            )}
          </motion.div>
        ) : (
          /* Drop zone */
          <motion.button
            key="dropzone"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 transition-colors cursor-pointer ${
              dragOver
                ? 'border-champagne-500 bg-champagne-500/5'
                : 'border-noir-700 bg-noir-800/50 hover:border-champagne-600 hover:bg-noir-800'
            }`}
          >
            {uploading ? (
              <Loader2 size={20} className="text-champagne-500 animate-spin" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-noir-700 flex items-center justify-center">
                <ImageIcon size={18} className="text-noir-400" />
              </div>
            )}
            <div className="text-center">
              <p className="font-sans text-sm text-noir-300">
                {uploading ? 'Uploading...' : placeholder}
              </p>
              <p className="font-sans text-xs text-noir-500 mt-0.5">
                JPG, PNG, WebP · Max 5MB
              </p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Error message */}
      {error && (
        <p className="font-sans text-xs text-rose-400 mt-1.5">{error}</p>
      )}
    </div>
  );
}
