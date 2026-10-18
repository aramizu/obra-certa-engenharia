import { describe, expect, it } from "vitest";
import {
  AVATAR_MAX_BYTES,
  AVATAR_SIZE,
  avatarImageSrc,
  firstNameFrom,
  initialsFrom,
  squareCropRect,
  validateAvatarUpload,
} from "@/lib/avatar";

describe("foto de perfil", () => {
  it("recorte central vira quadrado 96", () => {
    expect(squareCropRect(200, 100)).toEqual({ sx: 50, sy: 0, side: 100 });
    expect(squareCropRect(80, 200)).toEqual({ sx: 0, sy: 60, side: 80 });
    expect(squareCropRect(96, 96)).toEqual({ sx: 0, sy: 0, side: 96 });
    expect(AVATAR_SIZE).toBe(96);
  });

  it("servidor aceita webp/jpeg/png até ~12 KB", () => {
    expect(validateAvatarUpload("image/webp", 4000).ok).toBe(true);
    expect(validateAvatarUpload("image/jpeg", AVATAR_MAX_BYTES).ok).toBe(true);
    expect(validateAvatarUpload("image/png", 100).ok).toBe(true);
    expect(validateAvatarUpload("image/webp", AVATAR_MAX_BYTES + 1).ok).toBe(false);
    expect(validateAvatarUpload("image/svg+xml", 100).ok).toBe(false);
    expect(validateAvatarUpload("text/plain", 100).ok).toBe(false);
  });

  it("nome curto e iniciais para o fallback", () => {
    expect(firstNameFrom("Rafael Aramizu")).toBe("Rafael");
    expect(initialsFrom("Rafael Aramizu")).toBe("RA");
    expect(initialsFrom("Ana")).toBe("A");
    expect(avatarImageSrc("abc")).toBe("/api/perfil/avatar?v=abc");
    expect(avatarImageSrc(null)).toBeNull();
  });
});
