/**
 * Pricing utility module for DairyFlow
 * Provides fat-based milk pricing calculation and formatting utilities
 */

/**
 * Calculate price per liter based on fat percentage.
 * Fat pricing logic:
 *   < 3.5%  → ₹45
 *   3.5–4%  → ₹50
 *   4–5%    → ₹55
 *   5–6%    → ₹60
 *   > 6%    → ₹65
 *
 * @param {number} fat - Fat percentage of the milk
 * @returns {number} Price per liter in INR
 */
const calculatePricePerLiter = (fat) => {
  if (fat < 3.5) return 45;
  if (fat >= 3.5 && fat < 4) return 50;
  if (fat >= 4 && fat < 5) return 55;
  if (fat >= 5 && fat < 6) return 60;
  return 65; // fat >= 6
};

/**
 * Format a number as Indian currency string (₹ symbol + Indian locale)
 *
 * @param {number} n - The number to format as currency
 * @returns {string} Formatted currency string, e.g. "₹1,23,456"
 */
const formatCurrency = (n) => {
  return `₹${Number(n).toLocaleString('en-IN')}`;
};

/**
 * Format a number using Indian locale grouping
 *
 * @param {number} n - The number to format
 * @returns {string} Formatted number string, e.g. "1,23,456"
 */
const formatNum = (n) => {
  return Number(n).toLocaleString('en-IN');
};

export { calculatePricePerLiter, formatCurrency, formatNum };
