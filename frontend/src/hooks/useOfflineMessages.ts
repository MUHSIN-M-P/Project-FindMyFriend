/**
 * Offline messaging hook
 * - Tracks online/offline
 * - Sends messages with local offline queue fallback
 * - Optionally forwards status updates for UI reconciliation
 */

import { useState, useEffect, useCallback } from "react";
import {
    offlineMessageHandler,
    type OfflineStatusUpdate,
} from "@/utils/offlineMessageHandler";

type UseOfflineMessagesOptions = {
    onStatusUpdate?: (update: OfflineStatusUpdate) => void;
};

export function useOfflineMessages(options?: UseOfflineMessagesOptions) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    useEffect(() => {
        if (!options?.onStatusUpdate) return;
        return offlineMessageHandler.subscribe(options.onStatusUpdate);
    }, [options?.onStatusUpdate]);

    const sendMessage = useCallback(
        async (
            conversationId: number,
            recipientId: number,
            content: string,
            isRoom?: boolean,
            roomCode?: string,
            clientId?: string,
            messageType: string = "text",
        ) => {
            return offlineMessageHandler.sendMessage({
                conversationId,
                recipientId,
                content,
                isRoom,
                roomCode,
                clientId,
                messageType,
            });
        },
        [],
    );

    return {
        isOnline,
        sendMessage,
        getQueuedMessagesForRecipient:
            offlineMessageHandler.getQueuedMessagesForRecipient.bind(
                offlineMessageHandler,
            ),
        flushQueue: offlineMessageHandler.flushQueue.bind(
            offlineMessageHandler,
        ),
    };
}
