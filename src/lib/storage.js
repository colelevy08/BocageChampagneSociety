/**
 * @file src/lib/storage.js
 * @description Supabase Storage helper utilities for uploading images to any bucket.
 * Handles file validation, unique path generation, and public URL retrieval.
 * @importedBy src/components/ui/ImageUpload.jsx, src/pages/AdminInventory.jsx, src/pages/AdminEvents.jsx
 * @imports src/lib/supabase.js
 */

import { supabase } from './supabase';

/** Max file size: 5MB */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Allowed image MIME types */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Validates an image file before upload.
 * @param {File} file - The file to validate
 * @returns {{ valid: boolean, error?: string }} Validation result
 */
export function validateImageFile(file) {
  if (!file) return { valid: false, error: 'No file selected' };
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only JPG, PNG, WebP, and GIF images are allowed' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Image must be under 5MB' };
  }
  return { valid: true };
}

/**
 * Uploads an image file to a Supabase storage bucket and returns its public URL.
 * Generates a unique filename using timestamp + random string to prevent collisions.
 *
 * @param {File} file - The image file to upload
 * @param {string} bucket - Supabase storage bucket name (e.g. 'wine-images', 'event-images')
 * @param {object} options
 * @param {string} [options.folder] - Optional subfolder within the bucket
 * @param {Function} [options.onProgress] - Progress callback (not supported by supabase-js yet, reserved)
 * @returns {Promise<{ url: string|null, error: string|null }>}
 */
export async function uploadImage(file, bucket, options = {}) {
  // Validate first
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return { url: null, error: validation.error };
  }

  // Generate unique path
  const ext = file.name.split('.').pop().toLowerCase();
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = options.folder ? `${options.folder}/${uniqueName}` : uniqueName;

  // Upload to Supabase Storage
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error(`Storage upload error (${bucket}):`, error);
    return { url: null, error: error.message || 'Upload failed' };
  }

  // Get public URL
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data?.publicUrl || null, error: null };
}

/**
 * Deletes an image from a Supabase storage bucket by its public URL.
 * Extracts the storage path from the full URL.
 *
 * @param {string} publicUrl - The full public URL of the image
 * @param {string} bucket - Supabase storage bucket name
 * @returns {Promise<{ error: string|null }>}
 */
export async function deleteImage(publicUrl, bucket) {
  if (!publicUrl) return { error: null };

  // Extract path from URL — format: .../storage/v1/object/public/{bucket}/{path}
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return { error: 'Could not parse image path from URL' };

  const path = publicUrl.slice(idx + marker.length);
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    console.error(`Storage delete error (${bucket}):`, error);
    return { error: error.message || 'Delete failed' };
  }
  return { error: null };
}
