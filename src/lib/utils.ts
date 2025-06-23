import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import PasswordGenerator from "generate-password";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const generateSecurePassword = () => {
  return PasswordGenerator.generate({
    length: 16,
    strict: true,
    numbers: true,
    symbols: true,
    uppercase: true,
    lowercase: true,
  });
};

export const formatEnumString = (value: string) => {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};
