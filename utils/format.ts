/**
 * Formats a number with thousand separators (e.g. 1000 -> "1,000")
 * Returns empty string if input is null or undefined.
 */
export const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null) return '';
    return num.toLocaleString('ko-KR');
};

/**
 * Parses a string with commas into a number (e.g. "1,000" -> 1000)
 * Uses parseFloat to support decimals (needed for exchange rates).
 * Returns 0 if parsing fails.
 */
export const parseNumber = (str: string): number => {
    return parseFloat(str.replace(/,/g, '')) || 0;
};
