/**
 * Room Code Utilities - Backend-First Architecture
 * All generation logic moved to backend for:
 * - Guaranteed uniqueness (no collisions)
 * - Centralized validation
 * - Better security
 */

import { apiPost, apiGet } from "./api";

/**
 * Generate a unique room code from backend
 * Backend ensures no collisions with active rooms
 */
export async function generateRoomCode(): Promise<string> {
    const response = await apiPost("/api/websocket/room/generate");

    if (response.error || !response.data?.room_code) {
        throw new Error(response.error || "Failed to generate room code");
    }

    return response.data.room_code;
}

/**
 * Validate room code format and check if it exists
 */
export async function validateRoomCode(code: string): Promise<{
    valid: boolean;
    exists: boolean;
    normalized: string;
    formatted: string;
    error?: string;
}> {
    const response = await apiPost("/api/websocket/room/validate", { code });

    if (response.error) {
        return {
            valid: false,
            exists: false,
            normalized: code,
            formatted: code,
            error: response.error,
        };
    }

    return response.data;
}

/**
 * Check if room exists (quick check)
 */
export async function checkRoomExists(code: string): Promise<boolean> {
    const response = await apiGet(`/api/websocket/room/${code}/exists`);
    return response.data?.exists || false;
}

/**
 * Get room information
 */
export async function getRoomInfo(code: string): Promise<{
    room_code: string;
    user_count: number;
    ttl_started: boolean;
    expires_in: number | null;
    creator_user_id: number | null;
} | null> {
    const response = await apiGet(`/api/websocket/room/${code}/info`);

    if (response.error) {
        return null;
    }

    return response.data;
}

/**
 * Validate room code format locally (client-side quick check)
 * For full validation with existence check, use validateRoomCode()
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

/**
 * Normalize room code: remove dashes, uppercase
 */
export function normalizeRoomCode(code: string): string {
    return code.replace(/[-\s]/g, "").toUpperCase();
}
