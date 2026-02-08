import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleString()
}

export function getRoleColor(role: string): string {
  switch (role.toLowerCase()) {
    case 'super_admin':
      return 'from-purple-500 to-pink-500'
    case 'operator':
      return 'from-blue-500 to-cyan-500'
    case 'viewer':
      return 'from-green-500 to-emerald-500'
    default:
      return 'from-gray-500 to-gray-600'
  }
}

