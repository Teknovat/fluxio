/**
 * Category color utilities
 * Provides default colors for categories and helper functions
 */

export const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
    SALAIRES: "#10B981", // Green
    ACHATS_STOCK: "#F59E0B", // Amber
    FRAIS_GENERAUX: "#6366F1", // Indigo
    AVANCES_ASSOCIES: "#EC4899", // Pink
    VENTES: "#14B8A6", // Teal
    CHARGES_FIXES: "#EF4444", // Red
    AUTRES: "#6B7280", // Gray
};

/**
 * Get color for a category code
 * Returns default color if available, otherwise returns gray
 */
export function getCategoryColor(code: string): string {
    return DEFAULT_CATEGORY_COLORS[code] || "#6B7280";
}

/**
 * Get text color (white or black) based on background color for contrast
 */
export function getContrastTextColor(hexColor: string): string {
    // Remove # if present
    const hex = hexColor.replace("#", "");

    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black for light backgrounds, white for dark backgrounds
    return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

/**
 * Convert hex color to RGB with alpha
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
    const cleanHex = hex.replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
