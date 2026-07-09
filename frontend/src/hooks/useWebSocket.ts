import { useEffect, useMemo, useRef, useState, useCallback } from "react";

interface Message {
    id: string;
    type: "sent" | "received";
    msg: string;
    pfp?: string;
    timestamp: string;
    message_type?: string;
    sender_id?: number;
}

interface Contact {
    id: string;
    conversation_id: number;
    name: string;
    pfp_path: string;
    latest_msg: string;
    latest_msg_time: string | null;
    unread_count: number;
    is_online: boolean;
    last_online: string;
}

interface RoomEvent {
    type: string;
    room_id?: string;
    user_count?: number;
    ttl_started?: boolean;
    expires_in?: number | null;
    payload?: any;
    [key: string]: any;
}

interface UseWebSocketProps {
    onNewMessage?: (message: Message) => void;
    onContactUpdate?: (contact: Contact) => void;
    onRoomEvent?: (event: RoomEvent) => void;
    autoConnect?: boolean;
    disconnectOnUnmount?: boolean;
}

type ConnectionStatus =
    | "connecting"
    | "connected"
    | "authenticated"
    | "disconnected";

type Snapshot = {
    isConnected: boolean;
    isAuthenticated: boolean;
    userId: number | null;
    connectionStatus: ConnectionStatus;
    retryCount: number;
};

type WebSocketHandlers = {
    onNewMessage?: (message: Message) => void;
    onContactUpdate?: (contact: Contact) => void;
    onRoomEvent?: (event: RoomEvent) => void;
};

const DEBUG = process.env.NODE_ENV !== "production";

const defaultSnapshot: Snapshot = {
    isConnected: false,
    isAuthenticated: false,
    userId: null,
    connectionStatus: "disconnected",
    retryCount: 0,
};

class SharedWebSocketManager {
    private ws: WebSocket | null = null;
    private connectInFlight = false;
    private reconnectTimer: number | null = null;
    private retryCount = 0;
    private maxRetries = 3;

    private snapshot: Snapshot = { ...defaultSnapshot };
    private subscribers = new Set<(s: Snapshot) => void>();
    private handlers = new Set<WebSocketHandlers>();

    private setSnapshot(patch: Partial<Snapshot>) {
        this.snapshot = { ...this.snapshot, ...patch };
        for (const sub of this.subscribers) sub(this.snapshot);
    }

    getSnapshot(): Snapshot {
        return this.snapshot;
    }

    subscribe(fn: (s: Snapshot) => void) {
        this.subscribers.add(fn);
        fn(this.snapshot);
        return () => {
            this.subscribers.delete(fn);
        };
    }

    addHandlers(h: WebSocketHandlers) {
        this.handlers.add(h);
        return () => {
            this.handlers.delete(h);
        };
    }

    private clearReconnectTimer() {
        if (this.reconnectTimer != null) {
            window.clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    async connect() {
        if (this.connectInFlight) return;

        if (
            this.ws &&
            (this.ws.readyState === WebSocket.OPEN ||
                this.ws.readyState === WebSocket.CONNECTING)
        ) {
            return;
        }

        this.connectInFlight = true;
        this.setSnapshot({ connectionStatus: "connecting" });

        try {
            // Get WebSocket token from backend using HttpOnly cookie
            const tokenResponse = await fetch("/api/auth/websocket-token", {
                method: "POST",
            });

            if (!tokenResponse.ok) {
                throw new Error("Failed to get WebSocket token");
            }

            const tokenData = await tokenResponse.json();
            const wsToken = tokenData.token;
            const wsUrl =
                tokenData.websocket_url ||
                process.env.NEXT_PUBLIC_WEBSOCKET_URL ||
                "ws://localhost:8765";

            const ws = new WebSocket(wsUrl);
            this.ws = ws;

            ws.onopen = () => {
                this.setSnapshot({ isConnected: true, connectionStatus: "connected" });

                if (DEBUG) console.log("Connected to WebSocket");

                this.clearReconnectTimer();
                this.retryCount = 0;
                this.setSnapshot({ retryCount: 0 });

                // Send authentication with WebSocket token
                ws.send(
                    JSON.stringify({
                        type: "authenticate",
                        token: wsToken,
                    })
                );
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (DEBUG) console.log("WebSocket message received:", data);

                    switch (data.type) {
                        case "authenticated":
                            this.setSnapshot({
                                isAuthenticated: true,
                                userId: data.user_id,
                                connectionStatus: "authenticated",
                            });
                            if (DEBUG)
                                console.log("Authenticated as user:", data.user_id);
                            break;

                        case "new_message":
                            if (data.data) {
                                const message: Message = {
                                    id: data.data.id.toString(),
                                    type: "received",
                                    msg: data.data.content,
                                    pfp: data.data.pfp,
                                    timestamp: data.data.created_at,
                                    message_type: data.data.message_type || "text",
                                    sender_id: data.data.sender_id,
                                };
                                for (const h of this.handlers) {
                                    h.onNewMessage?.(message);
                                }
                            }
                            break;

                        case "message_status_update":
                        case "typing_indicator":
                            // no-op for now
                            break;

                        case "error":
                            if (DEBUG)
                                console.error("WebSocket error:", data.message);
                            break;

                        // Private room events
                        case "joined_room":
                        case "room_created":
                        case "room_not_found":
                        case "left_room":
                        case "user_joined_room":
                        case "user_left_room":
                        case "room_message":
                        case "room_expired":
                        case "room_ended":
                            for (const h of this.handlers) {
                                h.onRoomEvent?.(data as RoomEvent);
                            }
                            break;

                        default:
                            if (DEBUG) console.log("Unknown message type:", data.type);
                    }
                } catch (error) {
                    if (DEBUG)
                        console.error("Error parsing WebSocket message:", error);
                }
            };

            ws.onerror = (error) => {
                if (DEBUG) console.error("WebSocket error:", error);
                this.setSnapshot({ connectionStatus: "disconnected" });

                // Avoid multiple concurrent reconnect timers
                if (this.reconnectTimer != null) return;

                // Force close so we don't keep a broken socket around
                try {
                    ws.close();
                } catch {
                    // ignore
                }

                if (this.retryCount >= this.maxRetries) return;
                this.retryCount += 1;
                this.setSnapshot({ retryCount: this.retryCount });

                const nextRetry = this.retryCount;
                this.reconnectTimer = window.setTimeout(() => {
                    this.reconnectTimer = null;
                    if (DEBUG)
                        console.log(
                            `Retrying connection (${nextRetry}/${this.maxRetries})...`
                        );
                    void this.connect();
                }, 2000 * nextRetry);
            };

            ws.onclose = () => {
                this.setSnapshot({
                    isConnected: false,
                    isAuthenticated: false,
                    userId: null,
                    connectionStatus: "disconnected",
                });
                if (DEBUG) console.log("Disconnected from WebSocket");

                // Clear ref so a new connection can be created
                if (this.ws === ws) {
                    this.ws = null;
                }

                this.retryCount = 0;
                this.setSnapshot({ retryCount: 0 });
            };
        } catch (error) {
            if (DEBUG) console.error("Failed to connect to WebSocket:", error);
            this.setSnapshot({ connectionStatus: "disconnected" });
        } finally {
            this.connectInFlight = false;
        }
    }

    disconnect() {
        this.clearReconnectTimer();
        if (this.ws) {
            try {
                this.ws.close();
            } catch {
                // ignore
            }
            this.ws = null;
        }
        this.retryCount = 0;
        this.setSnapshot({ ...defaultSnapshot });
    }

    sendRawMessage(message: Record<string, any>) {
        if (!this.ws || !this.snapshot.isAuthenticated) {
            if (DEBUG) console.warn("WebSocket not connected or not authenticated");
            return;
        }
        this.ws.send(JSON.stringify(message));
        if (DEBUG) console.log("Sent raw message:", message);
    }

    sendMessage(recipientId: number, content: string, messageType: string = "text") {
        this.sendRawMessage({
            type: "send_message",
            recipient_id: recipientId,
            content,
            message_type: messageType,
        });
    }

    markMessageDelivered(messageId: number) {
        this.sendRawMessage({ type: "mark_delivered", message_id: messageId });
    }

    markMessageRead(messageId: number) {
        this.sendRawMessage({ type: "mark_read", message_id: messageId });
    }

    sendTypingIndicator(recipientId: number, isTyping: boolean) {
        this.sendRawMessage({
            type: "typing",
            recipient_id: recipientId,
            is_typing: isTyping,
        });
    }
}

const manager = new SharedWebSocketManager();

export function useWebSocket({
    onNewMessage,
    onContactUpdate,
    onRoomEvent,
    autoConnect = true,
    disconnectOnUnmount = false,
}: UseWebSocketProps) {
    const onNewMessageRef = useRef<UseWebSocketProps["onNewMessage"]>();
    const onContactUpdateRef = useRef<UseWebSocketProps["onContactUpdate"]>();
    const onRoomEventRef = useRef<UseWebSocketProps["onRoomEvent"]>();

    const [snapshot, setSnapshot] = useState<Snapshot>(() => manager.getSnapshot());

    useEffect(() => {
        onNewMessageRef.current = onNewMessage;
        onContactUpdateRef.current = onContactUpdate;
        onRoomEventRef.current = onRoomEvent;
    }, [onNewMessage, onContactUpdate, onRoomEvent]);

    const onNewMessageWrapper = useCallback((m: Message) => {
        onNewMessageRef.current?.(m);
    }, []);
    const onContactUpdateWrapper = useCallback((c: Contact) => {
        onContactUpdateRef.current?.(c);
    }, []);
    const onRoomEventWrapper = useCallback((e: RoomEvent) => {
        onRoomEventRef.current?.(e);
    }, []);

    const handlersObj = useMemo<WebSocketHandlers>(
        () => ({
            onNewMessage: onNewMessageWrapper,
            onContactUpdate: onContactUpdateWrapper,
            onRoomEvent: onRoomEventWrapper,
        }),
        [onNewMessageWrapper, onContactUpdateWrapper, onRoomEventWrapper]
    );

    useEffect(() => {
        const unsub = manager.subscribe(setSnapshot);
        const removeHandlers = manager.addHandlers(handlersObj);

        if (autoConnect) {
            void manager.connect();
        }

        return () => {
            removeHandlers();
            unsub();
            if (disconnectOnUnmount) {
                manager.disconnect();
            }
        };
    }, [autoConnect, disconnectOnUnmount, handlersObj]);

    const connect = useCallback(() => manager.connect(), []);
    const disconnect = useCallback(() => manager.disconnect(), []);

    const sendMessage = useCallback(
        (recipientId: number, content: string, messageType: string = "text") => {
            manager.sendMessage(recipientId, content, messageType);
        },
        []
    );

    const markMessageDelivered = useCallback((messageId: number) => {
        manager.markMessageDelivered(messageId);
    }, []);

    const markMessageRead = useCallback((messageId: number) => {
        manager.markMessageRead(messageId);
    }, []);

    const sendTypingIndicator = useCallback(
        (recipientId: number, isTyping: boolean) => {
            manager.sendTypingIndicator(recipientId, isTyping);
        },
        []
    );

    const sendRawMessage = useCallback((message: Record<string, any>) => {
        manager.sendRawMessage(message);
    }, []);

    return {
        isConnected: snapshot.isConnected,
        isAuthenticated: snapshot.isAuthenticated,
        userId: snapshot.userId,
        connectionStatus: snapshot.connectionStatus,
        sendMessage,
        markMessageDelivered,
        markMessageRead,
        sendTypingIndicator,
        sendRawMessage,
        connect,
        disconnect,
    };
}
