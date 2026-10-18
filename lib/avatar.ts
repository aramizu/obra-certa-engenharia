export const AVATAR_SIZE = 96;
export const AVATAR_TARGET_BYTES = 6 * 1024;
export const AVATAR_MAX_BYTES = 12 * 1024;
export const AVATAR_ALLOWED_MIMES = ["image/webp", "image/jpeg", "image/png"] as const;
export const AVATAR_OUTPUT_MIMES = ["image/webp", "image/jpeg"] as const;

export type AvatarMime = (typeof AVATAR_ALLOWED_MIMES)[number];

export function isAvatarMime(value: string): value is AvatarMime {
  return (AVATAR_ALLOWED_MIMES as readonly string[]).includes(value);
}

export function squareCropRect(width: number, height: number) {
  const side = Math.min(width, height);
  return {
    sx: Math.max(0, Math.floor((width - side) / 2)),
    sy: Math.max(0, Math.floor((height - side) / 2)),
    side,
  };
}

export function validateAvatarUpload(mime: string, byteLength: number) {
  if (!isAvatarMime(mime)) {
    return { ok: false as const, error: "Envie uma imagem WebP, JPEG ou PNG." };
  }
  if (byteLength <= 0) {
    return { ok: false as const, error: "Imagem vazia." };
  }
  if (byteLength > AVATAR_MAX_BYTES) {
    return { ok: false as const, error: "A foto processada deve ter no máximo 12 KB." };
  }
  return { ok: true as const };
}

export function firstNameFrom(fullName: string) {
  const trimmed = fullName.trim();
  if (!trimmed) return "Você";
  return trimmed.split(/\s+/)[0];
}

export function initialsFrom(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
}

export function avatarImageSrc(version: string | null | undefined) {
  if (!version) return null;
  return `/api/perfil/avatar?v=${encodeURIComponent(version)}`;
}
