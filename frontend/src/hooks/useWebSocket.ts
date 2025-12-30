import { useEffect, useRef, useState, useCallback } from "react";

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
}

export function useWebSocket({
    onNewMessage,
    onContactUpdate,
    onRoomEvent,
}: UseWebSocketProps) {
    const wsRef = useRef<WebSocket | null>(null);
    const onNewMessageRef = useRef<
        UseWebSocketProps["onNewMessage"] | undefined
    >(undefined);
    const onContactUpdateRef = useRef<
        UseWebSocketProps["onContactUpdate"] | undefined
    >(undefined);
    const onRoomEventRef = useRef<UseWebSocketProps["onRoomEvent"] | undefined>(
        undefined
    );
    const connectInFlightRef = useRef(false);
    const reconnectTimerRef = useRef<number | null>(null);
    const retryCountRef = useRef(0);
    const [isConnected, setIsConnected] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<
        "connecting" | "connected" | "authenticated" | "disconnected"
    >("disconnected");
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 3;

    useEffect(() => {
        onNewMessageRef.current = onNewMessage;
        onContactUpdateRef.current = onContactUpdate;
        onRoomEventRef.current = onRoomEvent;
    }, [onNewMessage, onContactUpdate, onRoomEvent]);

    const connect = useCallback(async () => {
        try {
            if (connectInFlightRef.current) return;
            if (
                wsRef.current &&
                (wsRef.current.readyState === WebSocket.OPEN ||
                    wsRef.current.readyState === WebSocket.CONNECTING)
            ) {
                return;
            }

            connectInFlightRef.current = true;

            setConnectionStatus("connecting");

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
            wsRef.current = ws;

            ws.onopen = () => {
                setIsConnected(true);
                setConnectionStatus("connected");
                console.log("Connected to WebSocket");

                // Cancel any scheduled reconnect attempts
                if (reconnectTimerRef.current != null) {
                    window.clearTimeout(reconnectTimerRef.current);
                    reconnectTimerRef.current = null;
                }
                retryCountRef.current = 0;
                setRetryCount(0);

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
                    console.log("WebSocket message received:", data);

                    switch (data.type) {
                        case "authenticated":
                            setIsAuthenticated(true);
                            setUserId(data.user_id);
                            setConnectionStatus("authenticated");
                            console.log("Authenticated as user:", data.user_id);
                            break;

                        case "new_message":
                            if (onNewMessageRef.current && data.data) {
                                const message: Message = {
                                    id: data.data.id.toString(),
                                    type: "received",
                                    msg: data.data.content,
                                    pfp: data.data.pfp,
                                    timestamp: data.data.created_at,
                                    message_type:
                                        data.data.message_type || "text",
                                    sender_id: data.data.sender_id,
                                };
                                onNewMessageRef.current(message);
                            }
                            break;

                        case "message_status_update":
                            console.log("Message status update:", data);
                            break;

                        case "typing_indicator":
                            console.log("Typing indicator:", data);
                            break;

                        case "error":
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
                            if (onRoomEventRef.current) {
                                onRoomEventRef.current(data as RoomEvent);
                            }
                            break;

                        default:
                            console.log("Unknown message type:", data.type);
                    }
                } catch (error) {
                    console.error("Error parsing WebSocket message:", error);
                }
            };

            ws.onerror = (error) => {
                console.error("WebSocket error:", error);
                setConnectionStatus("disconnected");

                // Avoid multiple concurrent reconnect timers
                if (reconnectTimerRef.current != null) return;

                // Force close so we don't keep a broken socket around
                try {
                    ws.close();
                } catch {
                    // ignore
                }

                const currentRetry = retryCountRef.current;
                if (currentRetry >= maxRetries) return;

                const nextRetry = currentRetry + 1;
                retryCountRef.current = nextRetry;
                setRetryCount(nextRetry);

                reconnectTimerRef.current = window.setTimeout(() => {
                    reconnectTimerRef.current = null;
                    console.log(
                        `Retrying connection (${nextRetry}/${maxRetries})...`
                    );
                    connect();
                }, 2000 * nextRetry);
            };

            ws.onclose = () => {
                setIsConnected(false);
                setIsAuthenticated(false);
                setUserId(null);
                setConnectionStatus("disconnected");
                console.log("Disconnected from WebSocket");

                // Clear ref so a new connection can be created
                if (wsRef.current === ws) {
                    wsRef.current = null;
                }

                // Reset retry count on clean disconnect
                retryCountRef.current = 0;
                setRetryCount(0);
            };
        } catch (error) {
            console.error("Failed to connect to WebSocket:", error);
            setConnectionStatus("disconnected");
        } finally {
            connectInFlightRef.current = false;
        }
    }, []);

    const disconnect = useCallback(() => {
        if (reconnectTimerRef.current != null) {
            window.clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    const sendMessage = useCallback(
        (
            recipientId: number,
            content: string,
            messageType: string = "text"
        ) => {
            if (wsRef.current && isAuthenticated) {
                const message = {
                    type: "send_message",
                    recipient_id: recipientId,
                    content: content,
                    message_type: messageType,
                };

                wsRef.current.send(JSON.stringify(message));
                console.log("Sent message:", message);
            } else {
                console.warn("WebSocket not connected or not authenticated");
            }
        },
        [isAuthenticated]
    );

    const markMessageDelivered = useCallback(
        (messageId: number) => {
            if (wsRef.current && isAuthenticated) {
                wsRef.current.send(
                    JSON.stringify({
                        type: "mark_delivered",
                        message_id: messageId,
                    })
                );
            }
        },
        [isAuthenticated]
    );

    const markMessageRead = useCallback(
        (messageId: number) => {
            if (wsRef.current && isAuthenticated) {
                wsRef.current.send(
                    JSON.stringify({
                        type: "mark_read",
                        message_id: messageId,
                    })
                );
            }
        },
        [isAuthenticated]
    );

    const sendTypingIndicator = useCallback(
        (recipientId: number, isTyping: boolean) => {
            if (wsRef.current && isAuthenticated) {
                wsRef.current.send(
                    JSON.stringify({
                        type: "typing",
                        recipient_id: recipientId,
                        is_typing: isTyping,
                    })
                );
            }
        },
        [isAuthenticated]
    );

    const sendRawMessage = useCallback(
        (message: Record<string, any>) => {
            if (wsRef.current && isAuthenticated) {
                wsRef.current.send(JSON.stringify(message));
                console.log("Sent raw message:", message);
            } else {
                console.warn("WebSocket not connected or not authenticated");
            }
        },
        [isAuthenticated]
    );

    useEffect(() => {
        // Auto-connect when component mounts
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        isConnected,
        isAuthenticated,
        userId,
        connectionStatus,
        sendMessage,
        markMessageDelivered,
        markMessageRead,
        sendTypingIndicator,
        sendRawMessage,
        connect,
        disconnect,
    };
}
