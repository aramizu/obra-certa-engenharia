import { describe, it, expect } from "vitest";
import {
  validatePassword,
  hashPassword,
  verifyPassword,
  normalizeEmail,
} from "@/lib/auth/password";

describe("Password Validation", () => {
  it("deve rejeitar senhas com menos de 8 caracteres", () => {
    const result = validatePassword("abc123");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("A senha deve ter no mínimo 8 caracteres");
  });

  it("deve rejeitar senhas comuns", () => {
    const result = validatePassword("password123");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Esta senha é muito comum. Escolha uma senha mais segura"
    );
  });

  it("deve aceitar senhas fortes", () => {
    const result = validatePassword("minhaS3nh@Forte!");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe("Password Hashing", () => {
  it("deve gerar hash diferente para a mesma senha", async () => {
    const password = "senhaSegura123";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
  });

  it("deve verificar senha correta", async () => {
    const password = "senhaSegura123";
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);

    expect(isValid).toBe(true);
  });

  it("deve rejeitar senha incorreta", async () => {
    const password = "senhaSegura123";
    const hash = await hashPassword(password);
    const isValid = await verifyPassword("senhaErrada", hash);

    expect(isValid).toBe(false);
  });
});

describe("Email Normalization", () => {
  it("deve converter email para lowercase", () => {
    expect(normalizeEmail("USER@EXAMPLE.COM")).toBe("user@example.com");
  });

  it("deve remover espaços", () => {
    expect(normalizeEmail("  user@example.com  ")).toBe("user@example.com");
  });

  it("deve normalizar email complexo", () => {
    expect(normalizeEmail("  UsEr@ExAmPlE.CoM  ")).toBe("user@example.com");
  });
});
