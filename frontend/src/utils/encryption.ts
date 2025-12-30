/**
 * End-to-End Encryption utilities for private rooms
 * Uses Web Crypto API for AES-GCM encryption
 */

// Generate a symmetric encryption key from room code
export async function deriveKeyFromRoomCode(
    roomCode: string
): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(roomCode.padEnd(32, "0")),
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: encoder.encode("private-room-salt"),
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

// Encrypt a message
export async function encryptMessage(
    message: string,
    key: CryptoKey
): Promise<{ encrypted: string; iv: string }> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        data
    );

    return {
        encrypted: arrayBufferToBase64(encrypted),
        iv: arrayBufferToBase64(iv.buffer),
    };
}

// Decrypt a message
export async function decryptMessage(
    encryptedData: string,
    ivString: string,
    key: CryptoKey
): Promise<string> {
    const encrypted = base64ToArrayBuffer(encryptedData);
    const iv = base64ToArrayBuffer(ivString);

    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}

// Helper: Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Helper: Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// High-level wrapper for encrypting room messages
export async function encryptRoomMessage(
    message: string,
    roomCode: string
): Promise<{ encrypted: string; iv: string }> {
    const key = await deriveKeyFromRoomCode(roomCode);
    return encryptMessage(message, key);
}

// High-level wrapper for decrypting room messages
export async function decryptRoomMessage(
    encryptedData: string,
    ivString: string,
    roomCode: string
): Promise<string> {
    const key = await deriveKeyFromRoomCode(roomCode);
    return decryptMessage(encryptedData, ivString, key);
}
