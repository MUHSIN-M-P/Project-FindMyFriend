"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePrivateRoom } from "@/hooks/usePrivateRoom";
import { encryptRoomMessage, decryptRoomMessage } from "@/utils/encryption";
import { formatRoomCode } from "@/utils/roomCode";
import CreateRoomModal from "@/components/CreateRoomModal";
import JoinRoomModal from "@/components/JoinRoomModal";
import RetroButton from "@/components/retroButton";
import EmojiButtonPicker from "@/components/Chat_Components/EmojiButton";
import ChatList from "@/components/Chat_Components/ChatList";
import Message from "@/components/Chat_Components/Message";
import Image from "next/image";
import back_arrow from "../../public/icons/back_arrow.png";

type JoinedRoom = {
    code: string;
    mode: "create" | "join";
    pending?: boolean;
};

export default function PrivateRoomsView() {
    const [joinedRooms, setJoinedRooms] = useState<JoinedRoom[]>([]);
    const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [decryptedByRoom, setDecryptedByRoom] = useState<
        Record<
            string,
            Array<{
                id: string;
                text: string;
                timestamp: string;
                isSent: boolean;
                senderId?: number | null;
            }>
        >
    >({});

    const [profileByUserId, setProfileByUserId] = useState<
        Record<number, { pfp: string }>
    >({});

    const activeRoom = useMemo(() => {
        if (!activeRoomCode) return null;
        return joinedRooms.find((r) => r.code === activeRoomCode) ?? null;
    }, [activeRoomCode, joinedRooms]);

    const {
        messages,
        userCount,
        ttlStarted,
        expiresIn,
        isJoined,
        roomEnded,
        roomError,
        isCreator,
        connectionStatus,
        sendRoomMessage,
        endRoom,
        leaveRoom,
    } = usePrivateRoom(activeRoomCode, {
        mode: activeRoom?.mode ?? "join",
    });

    // Debug logging for creator status
    useEffect(() => {
        console.log('[PrivateRooms] isCreator:', isCreator, 'activeRoom:', activeRoomCode);
    }, [isCreator, activeRoomCode]);

    // Debug logging for user count changes
    useEffect(() => {
        console.log('[PrivateRooms] userCount updated:', userCount);
    }, [userCount]);

    // Decrypt messages as they arrive
    useEffect(() => {
        if (activeRoomCode && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.payload?.encrypted && lastMessage.payload?.iv) {
                decryptRoomMessage(
                    lastMessage.payload.encrypted,
                    lastMessage.payload.iv,
                    activeRoomCode
                )
                    .then((decrypted) => {
                        setDecryptedByRoom((prev) => {
                            const roomMessages = prev[activeRoomCode] ?? [];
                            const exists = roomMessages.some(
                                (m) => m.id === lastMessage.id
                            );
                            if (exists) return prev;
                            return {
                                ...prev,
                                [activeRoomCode]: [
                                    ...roomMessages,
                                    {
                                        id: lastMessage.id,
                                        text: decrypted,
                                        timestamp: lastMessage.timestamp,
                                        isSent: lastMessage.isSent,
                                        senderId: lastMessage.senderId ?? null,
                                    },
                                ],
                            };
                        });
                    })
                    .catch((err) => {
                        console.error("Decryption failed:", err);
                    });
            }
        }
    }, [activeRoomCode, messages]);

    // Keep "create" mode only until first successful join (then treat as join for later switching)
    useEffect(() => {
        if (!activeRoomCode) return;
        if (!isJoined) return;

        setJoinedRooms((prev) =>
            prev.map((r) =>
                r.code === activeRoomCode
                    ? { ...r, pending: false, mode: "join" }
                    : r
            )
        );
    }, [activeRoomCode, isJoined]);

    // Invalid code handling
    useEffect(() => {
        if (roomError && activeRoomCode) {
            alert(roomError);
            setJoinedRooms((prev) =>
                prev.filter(
                    (r) => !(r.code === activeRoomCode && r.pending === true)
                )
            );
            setActiveRoomCode(null);
            setShowChat(false);
            setDecryptedByRoom((prev) => {
                const next = { ...prev };
                delete next[activeRoomCode];
                return next;
            });
        }
    }, [roomError, activeRoomCode]);

    // If room ended, remove it from list + exit
    useEffect(() => {
        if (roomEnded && activeRoomCode) {
            setJoinedRooms((prev) =>
                prev.filter((r) => r.code !== activeRoomCode)
            );
            setActiveRoomCode(null);
            setShowChat(false);
            setDecryptedByRoom((prev) => {
                const next = { ...prev };
                delete next[activeRoomCode];
                return next;
            });
        }
    }, [roomEnded, activeRoomCode]);

    const handleCreateRoom = (roomCode: string) => {
        setJoinedRooms((prev) => {
            const exists = prev.some((r) => r.code === roomCode);
            if (!exists) {
                return [
                    ...prev,
                    { code: roomCode, mode: "create", pending: true },
                ];
            }

            // If it already exists, force it into create flow (prevents stale mode bugs)
            return prev.map((r) =>
                r.code === roomCode
                    ? { ...r, mode: "create", pending: true }
                    : r
            );
        });
        setActiveRoomCode(roomCode);
        setShowChat(true);
    };

    const handleJoinRoom = (roomCode: string) => {
        setJoinedRooms((prev) => {
            const exists = prev.some((r) => r.code === roomCode);
            if (!exists) {
                return [
                    ...prev,
                    { code: roomCode, mode: "join", pending: true },
                ];
            }

            // If it already exists (e.g. previously created), force join flow.
            // This prevents accidentally sending create_private_room when user intended join.
            return prev.map((r) =>
                r.code === roomCode ? { ...r, mode: "join", pending: true } : r
            );
        });
        setActiveRoomCode(roomCode);
        setShowChat(true);
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !activeRoomCode) return;

        try {
            const encrypted = await encryptRoomMessage(
                inputValue.trim(),
                activeRoomCode
            );
            sendRoomMessage(encrypted);
            setInputValue("");
        } catch (error) {
            console.error("Encryption failed:", error);
        }
    };

    const handleLeaveRoom = () => {
        if (!activeRoomCode) return;
        if (confirm("Are you sure you want to leave this room?")) {
            leaveRoom();
            setJoinedRooms((prev) =>
                prev.filter((r) => r.code !== activeRoomCode)
            );
            setActiveRoomCode(null);
            setShowChat(false);
            setDecryptedByRoom((prev) => {
                const next = { ...prev };
                delete next[activeRoomCode];
                return next;
            });
        }
    };

    const handleSelectRoom = (roomCode: string) => {
        setActiveRoomCode(roomCode);
        setShowChat(true);
    };

    const roomContacts = useMemo(() => {
        return joinedRooms.map((r) => {
            const lastMsg = (decryptedByRoom[r.code] ?? []).at(-1);
            const subtitle =
                r.pending && r.code === activeRoomCode
                    ? "Connecting..."
                    : lastMsg?.text ?? "No messages yet";

            return {
                id: r.code,
                conversation_id: 0,
                name: `Room ${formatRoomCode(r.code)}`,
                pfp_path: "/icons/msg_icon.svg",
                latest_msg: subtitle,
                latest_msg_time: null,
                unread_count: 0,
                is_online: true,
                last_online: "",
                number: 0,
            };
        });
    }, [joinedRooms, decryptedByRoom, activeRoomCode]);

    const activeDecryptedMessages = useMemo(() => {
        if (!activeRoomCode) return [];
        return decryptedByRoom[activeRoomCode] ?? [];
    }, [decryptedByRoom, activeRoomCode]);

    // Fetch profile pics for other users in the active room
    useEffect(() => {
        const missing = new Set<number>();
        for (const m of activeDecryptedMessages) {
            if (m.isSent) continue;
            const senderId = m.senderId;
            if (
                typeof senderId === "number" &&
                !(senderId in profileByUserId)
            ) {
                missing.add(senderId);
            }
        }
        if (missing.size === 0) return;

        let cancelled = false;

        (async () => {
            const entries = Array.from(missing);
            for (const senderId of entries) {
                try {
                    const res = await fetch(`/api/chat/profile/${senderId}`);
                    if (!res.ok) {
                        console.warn(`Failed to fetch profile for user ${senderId}`);
                        continue;
                    }
                    const data = await res.json();
                    console.log(`[Profile Fetch] User ${senderId}:`, data);
                    const pfp = data?.profile_pic || "/avatars/male_avatar.png";
                    if (!cancelled) {
                        setProfileByUserId((prev) => ({
                            ...prev,
                            [senderId]: { pfp },
                        }));
                    }
                } catch (err) {
                    console.error(`Error fetching profile for user ${senderId}:`, err);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [activeDecryptedMessages, profileByUserId]);

    return (
        <div className="flex h-full max-w-[1720px] w-full justify-center font-poppins">
            {/* Sidebar */}
            <div
                className={`${
                    showChat ? "hidden" : "block"
                } lg:block w-full lg:max-w-[20vw] h-full`}
            >
                <ChatList
                    contacts={roomContacts}
                    isLoading={false}
                    error={null}
                    onContactClick={(c) => handleSelectRoom(c.id)}
                    onErrorDismiss={() => {}}
                    connectionStatus={connectionStatus}
                    isRoomList
                    emptyText="No joined rooms yet"
                    onCreateRoomClick={() => setShowCreateModal(true)}
                    onJoinRoomClick={() => setShowJoinModal(true)}
                />
            </div>

            {/* Chat Area */}
            <div
                className={`${
                    showChat ? "flex" : "hidden"
                } fixed inset-0 z-50 lg:static lg:z-auto lg:flex flex-1 flex-col border-t-3 border-retro_border bg-background`}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-retro_border w-full py-2 px-3 gap-4">
                    <div className="flex items-center gap-4">
                        <div
                            className="header lg:hidden cursor-pointer"
                            onClick={() => setShowChat(false)}
                        >
                            <Image
                                src={back_arrow}
                                alt="back_arrow"
                                className="w-4"
                            />
                        </div>
                        <div className="flex flex-col">
                            <p className="text-xl">
                                {activeRoomCode
                                    ? `Room ${formatRoomCode(activeRoomCode)}`
                                    : "Private Rooms"}
                            </p>
                            {activeRoomCode ? (
                                <p className="text-sm opacity-70">
                                    {userCount} user{userCount !== 1 ? "s" : ""}{" "}
                                    {ttlStarted && expiresIn != null
                                        ? `• ${Math.floor(
                                              expiresIn / 60
                                          )}min left`
                                        : "• Waiting for 2nd user"}
                                </p>
                            ) : (
                                <p className="text-sm opacity-70">
                                    Select a room or create one
                                </p>
                            )}
                        </div>
                    </div>

                    {activeRoomCode ? (
                        <div className="flex gap-2">
                            {isCreator && (
                                <RetroButton
                                    text="End Room"
                                    icon={null}
                                    onClick={endRoom}
                                    isActive={false}
                                    msgNo={0}
                                    extraClass="bg-retro_red text-white"
                                />
                            )}
                            <RetroButton
                                text="Leave"
                                icon={null}
                                onClick={handleLeaveRoom}
                                isActive={false}
                                msgNo={0}
                                extraClass="bg-gray-200"
                            />
                        </div>
                    ) : null}
                </div>

                {/* Messages */}
                <div className="group h-[68vh] md:h-[71vh] overflow-y-scroll scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent px-5 flex flex-col-reverse">
                    <div className="flex flex-col">
                        {!activeRoomCode ? (
                            <div className="text-center py-4 opacity-70">
                                No room selected
                            </div>
                        ) : !isJoined ? (
                            <div className="text-center py-4 opacity-70">
                                Connecting to room...
                            </div>
                        ) : activeDecryptedMessages.length === 0 ? (
                            <div className="text-center py-4 opacity-70">
                                No messages yet. Start the conversation!
                            </div>
                        ) : (
                            activeDecryptedMessages.map((m, index) => (
                                <Message
                                    key={`pm-${m.id}-${index}`}
                                    message={{
                                        type: m.isSent ? "sent" : "received",
                                        msg: m.text,
                                    }}
                                    pfp={
                                        !m.isSent &&
                                        typeof m.senderId === "number"
                                            ? profileByUserId[m.senderId]
                                                  ?.pfp || ""
                                            : ""
                                    }
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Input */}
                {activeRoomCode && isJoined && !roomEnded ? (
                    <div className="bottom-0 self-center w-full">
                        <div className="flex items-center py-2 px-5 font-poppins">
                            <EmojiButtonPicker
                                onChange={setInputValue}
                                inputRef={inputRef}
                            />
                            <div className="flex items-center gap-0 sm:gap-3 rounded-full bg-primary/30 w-full">
                                <input
                                    type="text"
                                    ref={inputRef}
                                    className="p-3 rounded-lg outline-none w-full"
                                    placeholder="Type something..."
                                    value={inputValue}
                                    onChange={(e) =>
                                        setInputValue(e.target.value)
                                    }
                                    onKeyPress={(e) =>
                                        e.key === "Enter" && handleSendMessage()
                                    }
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!inputValue.trim()}
                                >
                                    <img
                                        src="/icons/send_icon.png"
                                        alt="Send"
                                        className={`${
                                            !inputValue.trim()
                                                ? "opacity-50 cursor-not-allowed"
                                                : "cursor-pointer hover:opacity-80"
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            <CreateRoomModal
                isVisible={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreateRoom={handleCreateRoom}
            />
            <JoinRoomModal
                isVisible={showJoinModal}
                onClose={() => setShowJoinModal(false)}
                onJoinRoom={handleJoinRoom}
            />
        </div>
    );
}
