/**
 * Utility functions for handling monetary calculations
 * Prevents floating point precision errors
 */

/**
 * Round a number to 2 decimal places (for monetary values)
 * Prevents floating point errors like 4.980000000000018
 * 
 * @param value - The number to round
 * @returns The rounded number
 */
export function roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
}

/**
 * Add two monetary values with proper rounding
 * 
 * @param a - First value
 * @param b - Second value
 * @returns The sum rounded to 2 decimals
 */
export function addMoney(a: number, b: number): number {
    return roundToTwoDecimals(a + b);
}

/**
 * Subtract two monetary values with proper rounding
 * 
 * @param a - Value to subtract from
 * @param b - Value to subtract
 * @returns The difference rounded to 2 decimals
 */
export function subtractMoney(a: number, b: number): number {
    return roundToTwoDecimals(a - b);
}

/**
 * Multiply a monetary value with proper rounding
 * 
 * @param a - First value
 * @param b - Second value
 * @returns The product rounded to 2 decimals
 */
export function multiplyMoney(a: number, b: number): number {
    return roundToTwoDecimals(a * b);
}

/**
 * Divide a monetary value with proper rounding
 * 
 * @param a - Dividend
 * @param b - Divisor
 * @returns The quotient rounded to 2 decimals
 */
export function divideMoney(a: number, b: number): number {
    if (b === 0) {
        throw new Error('Division by zero');
    }
    return roundToTwoDecimals(a / b);
}
