import bcrypt from "bcryptjs";

const BCRYPT_COST = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function comparePassword(password: string, passwordHash: string): Promise<boolean> {
  if (!passwordHash) return false;
  return bcrypt.compare(password, passwordHash);
}

export function generateUsername(name: string): string {
  const base = (name || "user")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/(^\.|\.$)/g, "");
  const parts = base.split(".");
  return parts.length >= 2 ? `${parts[0]}.${parts[parts.length - 1]}` : base;
}

export function generateUniqueUsername(base: string): string {
  return `${base}${Math.floor(10 + Math.random() * 90)}`;
}

export function generatePassword(length: number = 16): string {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const symbols = "!$@#%^&*()-_=+[]{};:,.?";
  const all = lower + upper + digits + symbols;
  const parts = [
    lower[Math.floor(Math.random() * lower.length)],
    upper[Math.floor(Math.random() * upper.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];
  for (let i = parts.length; i < length; i++) {
    parts.push(all[Math.floor(Math.random() * all.length)]);
  }
  return parts.join("");
}
