// Utility function for merging Tailwind CSS classes with proper precedence
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// The cn (className) function combines clsx for conditional classes and twMerge for Tailwind conflict resolution
// This ensures that later classes override earlier ones properly (e.g., "bg-red-500 bg-blue-500" becomes "bg-blue-500")
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Utility function for formatting large numbers with commas
export function formatNumber(num) {
  // Convert to number if string is passed in
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  // Return formatted string with locale-specific separators
  return numValue.toLocaleString();
}

// Utility function for formatting currency in Philippine Peso
export function formatCurrency(amount) {
  // Convert to number and format with peso symbol
  const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `₱${numValue.toLocaleString()}`;
}

// Utility function for parsing payback period into years and months
export function parsePaybackPeriod(value) {
  // Convert string to float for calculation
  const floatVal = parseFloat(value);
  // Extract whole years
  const years = Math.floor(floatVal);
  // Calculate remaining months
  const months = Math.round((floatVal - years) * 12);
  // Format as human-readable string
  return `${years} yr${years !== 1 ? 's' : ''}${months ? ` & ${months} mo${months !== 1 ? 's' : ''}` : ''}`;
}

