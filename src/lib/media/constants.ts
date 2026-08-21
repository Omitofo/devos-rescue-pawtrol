/**
 * Media limits — WP-04 / FR-11.
 */

export const MEDIA_BUCKET = "animal-media";

/** Max images per animal (starting quota). */
export const MAX_IMAGES_PER_ANIMAL = 8;

/** Max original file size in bytes (8 MB). */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type AllowedMime = (typeof ALLOWED_MIME)[number];
