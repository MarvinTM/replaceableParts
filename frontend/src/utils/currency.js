/**
 * Currency formatting utilities
 * Uses the credit symbol (₵) placed after the number
 */

export const CREDIT_SYMBOL = '₵';

/**
 * Format a number as credits with the credit symbol
 * @param {number} amount - The amount to format
 * @param {boolean} useLocale - Whether to use locale formatting for thousands separators
 * @returns {string} Formatted credit string (e.g., "1,000₵")
 */
export function formatCredits(amount, useLocale = true) {
  const formattedNumber = useLocale ? amount.toLocaleString() : String(amount);
  return `${formattedNumber}${CREDIT_SYMBOL}`;
}
