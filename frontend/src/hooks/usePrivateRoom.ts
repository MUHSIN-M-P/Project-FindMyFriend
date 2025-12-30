import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "./useWebSocket";

interface RoomMessage {
    id: string;
    payload: any;
    timestamp: string;
    isSent: boolean;
    senderId?: number | null;
}

export function usePrivateRoom(
    roomId: string | null,
    options?: { mode?: "create" | "join" }
) {
    const [messages, setMessages] = useState<RoomMessage[]>([]);
    const [userCount, setUserCount] = useState(0);
    const [ttlStarted, setTtlStarted] = useState(false);
    const [expiresIn, setExpiresIn] = useState<number | null>(null);
    const [isJoined, setIsJoined] = useState(false);
    const [roomEnded, setRoomEnded] = useState(false);
    const [roomError, setRoomError] = useState<string | null>(null);
    const [isCreator, setIsCreator] = useState(false);

    const mode = options?.mode ?? "join";

    const handleRoomEvents = useCallback(
        (event: any) => {
            console.log("Room event received:", event);

            // Ignore events for other rooms; this hook is for a single active room
            if (roomId && event?.room_id && event.room_id !== roomId) {
                return;
            }

            switch (event.type) {
                case "room_created":
                    // purely informational
                    break;

                case "room_not_found":
                    setIsJoined(false);
                    setRoomEnded(false);
                    setRoomError("Room not found");
                    setIsCreator(false);
                    break;

                case "joined_room":
                    console.log("[usePrivateRoom] joined_room event:", event);
                    setIsJoined(true);
                    setUserCount(event.user_count);
                    setTtlStarted(event.ttl_started);
                    setExpiresIn(event.expires_in);
                    setRoomEnded(false);
                    setRoomError(null);
                    setIsCreator(Boolean(event.is_creator));
                    console.log(
                        "[usePrivateRoom] Set isCreator to:",
                        Boolean(event.is_creator)
                    );
                    break;

                case "user_joined_room":
                    setUserCount(event.user_count);
                    if (typeof event.ttl_started === "boolean") {
                        setTtlStarted(event.ttl_started);
                    }
                    if (event.expires_in != null) {
                        setExpiresIn(event.expires_in);
                    }
                    break;

                case "user_left_room":
                    console.log(
                        "[usePrivateRoom] user_left_room event:",
                        event
                    );
                    setUserCount(event.user_count);
                    if (typeof event.ttl_started === "boolean") {
                        setTtlStarted(event.ttl_started);
                    }
                    if (event.expires_in != null) {
                        setExpiresIn(event.expires_in);
                    }
                    break;

                case "room_message":
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: Date.now().toString(),
                            payload: event.payload,
                            timestamp:
                                typeof event.timestamp === "string"
                                    ? event.timestamp
                                    : new Date().toISOString(),
                            isSent: false,
                            senderId:
                                typeof event.sender_id === "number"
                                    ? event.sender_id
                                    : null,
                        },
                    ]);
                    break;

                case "left_room":
                    setIsJoined(false);
                    setUserCount(0);
                    setTtlStarted(false);
                    setExpiresIn(null);
                    setIsCreator(false);
                    break;

                case "room_expired":
                    setIsJoined(false);
                    setRoomEnded(true);
                    alert("Room has expired");
                    setIsCreator(false);
                    break;

                case "room_ended":
                    setIsJoined(false);
                    setRoomEnded(true);
                    alert("Room has been ended");
                    setIsCreator(false);
                    break;
            }
        },
        [roomId]
    );

    const { sendRawMessage, isAuthenticated, userId, connectionStatus } =
        useWebSocket({
            onRoomEvent: handleRoomEvents,
        });

    const createRoom = useCallback(() => {
        if (!roomId || !isAuthenticated) {
            console.warn(
                "Cannot create room: missing roomId or not authenticated"
            );
            return;
        }
        setRoomError(null);
        sendRawMessage({
            type: "create_private_room",
            room_id: roomId,
        });
    }, [roomId, isAuthenticated, sendRawMessage]);

    const joinRoom = useCallback(() => {
        if (!roomId || !isAuthenticated) {
            console.warn(
                "Cannot join room: missing roomId or not authenticated"
            );
            return;
        }

        console.log("Joining room:", roomId);
        setRoomError(null);
        sendRawMessage({
            type: "join_private_room",
            room_id: roomId,
        });
    }, [roomId, isAuthenticated, sendRawMessage]);

    const sendRoomMessage = useCallback(
        (payload: any) => {
            if (!isJoined || !roomId) {
                console.warn("Cannot send message: not joined to room");
                return;
            }

            console.log("Sending room message:", payload);

            // Add to local messages immediately (optimistic update)
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    payload: payload,
                    timestamp: new Date().toISOString(),
                    isSent: true,
                    senderId: userId ?? null,
                },
            ]);

            // Send via WebSocket
            sendRawMessage({
                type: "room_message",
                room_id: roomId,
                payload: payload,
            });
        },
        [isJoined, roomId, sendRawMessage, userId]
    );

    const endRoom = useCallback(() => {
        if (!roomId) {
            console.warn("Cannot end room: missing roomId");
            return;
        }

        console.log("Ending room:", roomId);
        sendRawMessage({
            type: "end_room",
            room_id: roomId,
        });
    }, [roomId, sendRawMessage]);

    const leaveRoom = useCallback(
        (roomIdOverride?: string) => {
            const targetRoomId = roomIdOverride ?? roomId;
            if (!targetRoomId) {
                console.warn("Cannot leave room: missing roomId");
                return;
            }

            sendRawMessage({
                type: "leave_private_room",
                room_id: targetRoomId,
            });
        },
        [roomId, sendRawMessage]
    );

    // Reset local state when switching rooms
    useEffect(() => {
        setMessages([]);
        setUserCount(0);
        setTtlStarted(false);
        setExpiresIn(null);
        setIsJoined(false);
        setRoomEnded(false);
        setRoomError(null);
        setIsCreator(false);
    }, [roomId]);

    // Auto-join when roomId changes and we're authenticated
    useEffect(() => {
        if (
            roomId &&
            isAuthenticated &&
            !isJoined &&
            !roomEnded &&
            !roomError
        ) {
            if (mode === "create") {
                createRoom();
            } else {
                joinRoom();
            }
        }
    }, [
        roomId,
        isAuthenticated,
        isJoined,
        roomEnded,
        roomError,
        mode,
        createRoom,
        joinRoom,
    ]);

    return {
        messages,
        userCount,
        ttlStarted,
        expiresIn,
        isJoined,
        roomEnded,
        roomError,
        isCreator,
        connectionStatus,
        isAuthenticated,
        createRoom,
        joinRoom,
        sendRoomMessage,
        endRoom,
        leaveRoom,
    };
}
