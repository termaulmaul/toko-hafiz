/**
 * Format currency to Indonesian Rupiah
 * Converts number to string like "Rp 5.300.000"
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number, decimals: number = 0): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return 'Rp 0';
  }

  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return formatter.format(value);
};

/**
 * Format large numbers with K, M, B suffixes
 * @param value - The numeric value to format
 * @returns Formatted string like "5.3K", "1.2M"
 */
export const formatCompactNumber = (value: number): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0';
  }

  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(1) + 'B';
  } else if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(1) + 'M';
  } else if (value >= 1_000) {
    return (value / 1_000).toFixed(1) + 'K';
  }

  return value.toString();
};

/**
 * Parse currency string to number
 * Converts "Rp 5.300.000" to 5300000
 * @param currencyString - The currency string to parse
 * @returns Numeric value
 */
export const parseCurrency = (currencyString: string): number => {
  if (typeof currencyString !== 'string') {
    return 0;
  }

  // Remove "Rp", spaces, and dots (Indonesian thousand separator)
  const cleaned = currencyString
    .replace(/Rp\s?/g, '')
    .replace(/\./g, '')
    .trim();

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Format number as percentage
 * @param value - The numeric value (0-1 or 0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @param isDecimal - Whether value is in decimal format (0-1) or percentage (0-100)
 * @returns Formatted percentage string like "45.5%"
 */
export const formatPercentage = (
  value: number,
  decimals: number = 1,
  isDecimal: boolean = true
): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }

  const percentage = isDecimal ? value * 100 : value;
  return `${percentage.toFixed(decimals)}%`;
};
