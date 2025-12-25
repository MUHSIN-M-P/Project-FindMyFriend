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

interface UseWebSocketProps {
    token?: string;
    onNewMessage?: (message: Message) => void;
    onContactUpdate?: (contact: Contact) => void;
}

export function useWebSocket({
    token,
    onNewMessage,
    onContactUpdate,
}: UseWebSocketProps) {
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<
        "connecting" | "connected" | "authenticated" | "disconnected"
    >("disconnected");
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 3;

    const connect = useCallback(async () => {
        if (!token) return;

        try {
            setConnectionStatus("connecting");

            // First, get WebSocket token from backend
            const tokenResponse = await fetch("/api/websocket/token", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
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
                            if (onNewMessage && data.data) {
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
                                onNewMessage(message);
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

                // Retry connection
                if (retryCount < maxRetries) {
                    setTimeout(() => {
                        console.log(
                            `Retrying connection (${
                                retryCount + 1
                            }/${maxRetries})...`
                        );
                        setRetryCount((prev) => prev + 1);
                        connect();
                    }, 2000 * (retryCount + 1)); // Exponential backoff
                }
            };

            ws.onclose = () => {
                setIsConnected(false);
                setIsAuthenticated(false);
                setUserId(null);
                setConnectionStatus("disconnected");
                console.log("Disconnected from WebSocket");

                // Reset retry count on clean disconnect
                setRetryCount(0);
            };
        } catch (error) {
            console.error("Failed to connect to WebSocket:", error);
            setConnectionStatus("disconnected");
        }
    }, [token, onNewMessage, onContactUpdate, retryCount]);

    const disconnect = useCallback(() => {
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

    useEffect(() => {
        if (token) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [token, connect, disconnect]);

    return {
        isConnected,
        isAuthenticated,
        userId,
        connectionStatus,
        sendMessage,
        markMessageDelivered,
        markMessageRead,
        sendTypingIndicator,
        connect,
        disconnect,
    };
}
