import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

// Lista de senhas comuns mais usadas (top 100)
const COMMON_PASSWORDS = new Set([
  "123456", "password", "123456789", "12345678", "12345", "1234567",
  "password1", "123123", "1234567890", "1234", "qwerty123", "1q2w3e",
  "1qaz2wsx", "qwertyuiop", "123321", "password123", "senha", "senha123",
  "admin", "admin123", "root", "root123", "test", "test123", "user",
  "user123", "welcome", "welcome123", "monkey", "dragon", "master",
  "sunshine", "princess", "football", "iloveyou", "shadow", "michael",
  "jennifer", "111111", "654321", "superman", "qwerty", "baseball",
]);

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Valida a senha contra os requisitos de segurança:
 * - Mínimo 8 caracteres
 * - Não pode ser uma senha comum
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("A senha deve ter no mínimo 8 caracteres");
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push("Esta senha é muito comum. Escolha uma senha mais segura");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Gera hash da senha usando bcrypt com custo adequado (12 rounds)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifica se a senha corresponde ao hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/**
 * Normaliza email para evitar duplicatas (lowercase + trim)
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}
