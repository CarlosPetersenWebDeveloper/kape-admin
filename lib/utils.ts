import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Helper para combinar clases de Tailwind de forma inteligente. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
