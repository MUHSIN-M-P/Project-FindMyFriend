/**
 * Simplified Message Sender
 * All encryption, queuing, retry logic handled by backend
 * Frontend just sends and displays
 */

import { apiPost } from "./api";

export interface SendMessageParams {
    recipientId: number;
    content: string;
    conversationId?: number;
    messageType?: string;
    isRoom?: boolean;
    roomCode?: string;
    clientId?: string;
}

export interface SendMessageResponse {
    success: boolean;
    message_id?: number;
    message_queue_id?: string;
    status: "delivered" | "queued";
    timestamp?: string;
    message?: string;
    client_id?: string;
}

/**
 * Send a message - backend handles everything
 * - Encryption at rest
 * - Delivery to online users
 * - Queuing for offline users
 * - Automatic retry with exponential backoff
 * - WebSocket real-time delivery
 */
export async function sendMessage(
    params: SendMessageParams,
): Promise<SendMessageResponse> {
    const response = await apiPost<SendMessageResponse>("/api/chat/send", {
        recipient_id: params.recipientId,
        receiver_id: params.recipientId, // Support both keys
        content: params.content,
        message_type: params.messageType || "text",
        client_id: params.clientId,
    });

    if (response.error) {
        throw new Error(response.error);
    }

    return response.data!;
}

/**
 * Get pending message count from backend queue
 */
export async function getPendingMessageCount(): Promise<number> {
    const response = await apiPost("/api/chat/pending-count");

    if (response.error) {
        console.error("Failed to get pending count:", response.error);
        return 0;
    }

    return response.data?.count || 0;
}

/**
 * Get failed messages (max retries exceeded)
 */
export async function getFailedMessages(): Promise<any[]> {
    const response = await apiPost("/api/chat/failed-messages");

    if (response.error) {
        console.error("Failed to get failed messages:", response.error);
        return [];
    }

    return response.data?.messages || [];
}
