/**
 * Generate a unique 6-character room code
 * Format: ABC123 (uppercase alphanumeric)
 */
export function generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Validate room code format (6 alphanumeric characters)
 */
export function isValidRoomCode(code: string): boolean {
    return /^[A-Z0-9]{6}$/i.test(code);
}

/**
 * Format room code with dashes for display: ABC-123
 */
export function formatRoomCode(code: string): string {
    if (code.length !== 6) return code;
    return `${code.substring(0, 3)}-${code.substring(3)}`;
}
