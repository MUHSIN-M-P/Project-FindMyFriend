/**
 * Offline Message Handler
 * - If offline: queue messages locally (localStorage)
 * - When back online: flush queued messages to backend
 * - Emit status updates so UI can reconcile: pending -> sent -> delivered
 */

import { sendMessage } from "./messageSender";

export type DeliveryStatus = "pending" | "sent" | "delivered";

export type OfflineStatusUpdate = {
    clientId: string;
    status: DeliveryStatus;
    serverId?: number;
    timestamp?: string;
    recipientId: number;
    conversationId?: number;
};

type QueuedMessage = {
    clientId: string;
    conversationId: number;
    recipientId: number;
    content: string;
    messageType: string;
    queuedAt: string;
};

const STORAGE_KEY = "offline_message_queue_v1";

function safeParseJson<T>(value: string | null): T | null {
    if (!value) return null;
    try {
        return JSON.parse(value) as T;
    } catch {
        return null;
    }
}

function generateClientId(): string {
    // Prefer built-in UUID when available
    try {
        // @ts-expect-error - older TS libs may not have randomUUID typed
        if (globalThis.crypto?.randomUUID)
            return globalThis.crypto.randomUUID();
    } catch {
        // ignore
    }
    return `cid_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

class OfflineMessageHandler {
    private isOnline: boolean = navigator.onLine;
    private flushing = false;
    private listeners = new Set<(u: OfflineStatusUpdate) => void>();

    constructor() {
        this.initNetworkListeners();
        // Best-effort flush at startup if already online
        if (this.isOnline) {
            void this.flushQueue();
        }
    }

    private initNetworkListeners() {
        window.addEventListener("online", () => {
            this.isOnline = true;
            void this.flushQueue();
        });

        window.addEventListener("offline", () => {
            this.isOnline = false;
        });
    }

    private emit(update: OfflineStatusUpdate) {
        for (const listener of this.listeners) listener(update);
    }

    subscribe(listener: (u: OfflineStatusUpdate) => void) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private loadQueue(): QueuedMessage[] {
        const parsed = safeParseJson<{ items: QueuedMessage[] }>(
            localStorage.getItem(STORAGE_KEY),
        );
        return Array.isArray(parsed?.items) ? parsed!.items : [];
    }

    private saveQueue(items: QueuedMessage[]) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
    }

    getQueuedMessagesForRecipient(recipientId: number): QueuedMessage[] {
        return this.loadQueue().filter((m) => m.recipientId === recipientId);
    }

    private enqueue(item: QueuedMessage) {
        const items = this.loadQueue();
        items.push(item);
        this.saveQueue(items);
    }

    private removeFromQueue(clientId: string) {
        const items = this.loadQueue().filter((m) => m.clientId !== clientId);
        this.saveQueue(items);
    }

    async flushQueue() {
        if (!this.isOnline) return;
        if (this.flushing) return;
        this.flushing = true;

        try {
            const items = this.loadQueue();
            for (const item of items) {
                try {
                    // Mark as "sent" once it reaches the server
                    const result = await sendMessage({
                        recipientId: item.recipientId,
                        content: item.content,
                        conversationId: item.conversationId,
                        messageType: item.messageType,
                        clientId: item.clientId,
                    });

                    this.emit({
                        clientId: item.clientId,
                        recipientId: item.recipientId,
                        conversationId: item.conversationId,
                        status:
                            result.status === "delivered"
                                ? "delivered"
                                : "sent",
                        serverId: result.message_id,
                        timestamp: result.timestamp,
                    });

                    // Once accepted by backend (delivered or queued), it's no longer a local-offline concern
                    this.removeFromQueue(item.clientId);
                } catch {
                    // Keep in queue; we'll retry next time we go online
                }
            }
        } finally {
            this.flushing = false;
        }
    }

    /**
     * Send message
     * - Offline: store locally (pending)
     * - Online: send to backend and return status (sent/delivered)
     */
    async sendMessage(params: {
        conversationId: number;
        recipientId: number;
        content: string;
        isRoom?: boolean;
        roomCode?: string;
        clientId?: string;
        messageType?: string;
    }): Promise<{
        clientId: string;
        status: DeliveryStatus;
        serverId?: number;
        timestamp?: string;
    }> {
        const clientId = params.clientId || generateClientId();

        // If offline, queue locally and return pending
        if (!this.isOnline) {
            this.enqueue({
                clientId,
                conversationId: params.conversationId,
                recipientId: params.recipientId,
                content: params.content,
                messageType: params.messageType || "text",
                queuedAt: new Date().toISOString(),
            });

            this.emit({
                clientId,
                recipientId: params.recipientId,
                conversationId: params.conversationId,
                status: "pending",
                timestamp: new Date().toISOString(),
            });

            return { clientId, status: "pending" };
        }

        try {
            const result = await sendMessage({
                recipientId: params.recipientId,
                content: params.content,
                conversationId: params.conversationId,
                isRoom: params.isRoom,
                roomCode: params.roomCode,
                messageType: params.messageType || "text",
                clientId,
            });

            const nextStatus: DeliveryStatus =
                result.status === "delivered" ? "delivered" : "sent";

            this.emit({
                clientId,
                recipientId: params.recipientId,
                conversationId: params.conversationId,
                status: nextStatus,
                serverId: result.message_id,
                timestamp: result.timestamp,
            });

            return {
                clientId,
                status: nextStatus,
                serverId: result.message_id,
                timestamp: result.timestamp,
            };
        } catch (error) {
            console.error("Failed to send message:", error);

            // If sending fails while online (transient), fall back to local queue
            this.enqueue({
                clientId,
                conversationId: params.conversationId,
                recipientId: params.recipientId,
                content: params.content,
                messageType: params.messageType || "text",
                queuedAt: new Date().toISOString(),
            });

            this.emit({
                clientId,
                recipientId: params.recipientId,
                conversationId: params.conversationId,
                status: "pending",
                timestamp: new Date().toISOString(),
            });

            return {
                clientId,
                status: "pending",
            };
        }
    }

    isUserOnline(): boolean {
        return this.isOnline;
    }

    async getPendingCount(): Promise<number> {
        // Backend tracks pending messages
        return 0; // Can fetch from backend if needed
    }
}

// Singleton instance
export const offlineMessageHandler = new OfflineMessageHandler();

// Export function for use in components
export async function sendOfflineMessage(
    conversationId: number,
    recipientId: number,
    content: string,
    isRoom?: boolean,
    roomCode?: string,
    clientId?: string,
): Promise<{
    clientId: string;
    status: DeliveryStatus;
    serverId?: number;
    timestamp?: string;
}> {
    return offlineMessageHandler.sendMessage({
        conversationId,
        recipientId,
        content,
        isRoom,
        roomCode,
        clientId,
    });
}
