"use client";

import { useState, useEffect, useRef } from "react";
import ContactsList from "@/components/Chat_Components/ChatList";
import ChatArea from "@/components/Chat_Components/ChatArea";
import ProfilePanel from "@/components/Chat_Components/ProfilePanel";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useOfflineMessages } from "@/hooks/useOfflineMessages";
import { apiGet, apiPost } from "@/utils/api";

interface social_links {
    name: string;
    link: string;
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

interface MessageType {
    id: string;
    type: "sent" | "received";
    msg: string;
    pfp?: string;
    timestamp?: string;
    message_type?: string;
    status?: "pending" | "sent" | "delivered";
    clientId?: string;
}

const CONTACTS_CACHE_TTL_MS = 15_000;
const MESSAGES_CACHE_TTL_MS = 15_000;

let contactsCache: { data: Contact[] | null; ts: number } = {
    data: null,
    ts: 0,
};

const messagesCache = new Map<string, { data: any[]; ts: number }>();

export default function ChatView() {
    const DEBUG = process.env.NODE_ENV !== "production";
    const { user } = useAuth();
    const { sendMessage: sendOfflineMessage, getQueuedMessagesForRecipient } =
        useOfflineMessages({
            onStatusUpdate: (u) => {
                // Reconcile optimistic/offline messages by clientId
                setMessages((prev) =>
                    prev.map((m) =>
                        m.clientId && m.clientId === u.clientId
                            ? {
                                  ...m,
                                  status: u.status,
                                  id:
                                      u.serverId != null
                                          ? String(u.serverId)
                                          : m.id,
                                  timestamp: u.timestamp || m.timestamp,
                              }
                            : m,
                    ),
                );
            },
        });
    const [showChat, setShowChat] = useState<boolean>(false);
    const [showProfile, setShowProfile] = useState<boolean>(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(!contactsCache.data);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [contacts, setContacts] = useState<Contact[]>([]);
    const [messages, setMessages] = useState<MessageType[]>([]);
    const seenMessageIdsRef = useRef<Set<string>>(new Set());

    const [name, setName] = useState<string>("");
    const [age, setAge] = useState<number>(-1);
    const [score, setScore] = useState<number>(-1);
    const [sex, setSex] = useState<string>("");
    const [pfp, setPfp] = useState<string>("");
    const [hobbies, setHobbies] = useState<string[]>([]);
    const [lastOnlineMsg, setLastOnlineMsg] = useState<string>("");
    const [socials, setSocials] = useState<social_links[]>([]);

    const { isConnected, isAuthenticated, connectionStatus } = useWebSocket({
        onNewMessage: (newMessage) => {
            // Guard against duplicate delivery (e.g. duplicate WS connections / retries)
            if (
                newMessage?.id &&
                seenMessageIdsRef.current.has(newMessage.id)
            ) {
                return;
            }
            if (newMessage?.id) {
                seenMessageIdsRef.current.add(newMessage.id);
            }

            if (DEBUG) {
                console.log("Received WS message:", newMessage);
            }

            const senderId =
                newMessage.sender_id != null
                    ? Number(newMessage.sender_id)
                    : null;

            // Ignore messages sent by current user (already have optimistic update)
            if (user && senderId === user.id) {
                return;
            }

            if (
                selectedContact &&
                senderId &&
                senderId === Number(selectedContact.id)
            ) {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: newMessage.id,
                        type: "received",
                        msg: newMessage.msg,
                        pfp: newMessage.pfp,
                        timestamp: newMessage.timestamp,
                    },
                ]);

                // If the chat is currently open, mark as read in backend
                // so unread counts remain accurate.
                void apiPost(
                    `/api/chat/conversation/${selectedContact.id}/read`,
                );

                if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("chat:unread-changed"));
                }

                setContacts((prev) =>
                    prev.map((contact) =>
                        contact.id === selectedContact.id
                            ? {
                                  ...contact,
                                  latest_msg: newMessage.msg,
                                  latest_msg_time: newMessage.timestamp,
                                  unread_count: 0,
                              }
                            : contact,
                    ),
                );
            } else {
                setContacts((prev) => {
                    if (!senderId) return prev;
                    const senderIdStr = String(senderId);
                    const exists = prev.some((c) => c.id === senderIdStr);
                    if (!exists) {
                        const placeholder: Contact = {
                            id: senderIdStr,
                            conversation_id: 0,
                            name: "Unknown",
                            pfp_path: "/avatars/male_avatar.png",
                            latest_msg: newMessage.msg,
                            latest_msg_time: newMessage.timestamp,
                            unread_count: 1,
                            is_online: true,
                            last_online: "",
                        };
                        return [placeholder, ...prev];
                    }
                    return prev.map((contact) =>
                        contact.id === senderIdStr
                            ? {
                                  ...contact,
                                  latest_msg: newMessage.msg,
                                  latest_msg_time: newMessage.timestamp,
                                  unread_count: (contact.unread_count || 0) + 1,
                              }
                            : contact,
                    );
                });

                if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("chat:unread-changed"));
                }
            }
        },
    });

    const fetchContacts = async () => {
        try {
            const response = await apiGet("/api/chat/contacts");

            if (response.error) {
                throw new Error(response.error);
            }

            const data = response.data;
            const formattedContacts = data.map((contact: any) => ({
                id: contact.id,
                name: contact.name,
                pfp_path: contact.pfp_path,
                latest_msg: contact.latest_msg,
                conversation_id: contact.conversation_id,
                latest_msg_time: contact.latest_msg_time,
                unread_count: contact.unread_count || 0,
                is_online: contact.is_online,
                last_online: contact.last_online,
            }));
            setContacts(formattedContacts);
            contactsCache = { data: formattedContacts, ts: Date.now() };
            return formattedContacts as Contact[];
        } catch (error) {
            console.error("Error fetching contacts:", error);
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to load contacts",
            );
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMessages = async (contactId: string) => {
        setIsLoadingMessages(true);
        try {
            const cached = messagesCache.get(contactId);
            const now = Date.now();

            // Always compute queued messages fresh
            let queued: MessageType[] = [];
            try {
                const recipientId = Number(contactId);
                if (!Number.isNaN(recipientId)) {
                    queued = getQueuedMessagesForRecipient(recipientId).map(
                        (q) => ({
                            id: `client-${q.clientId}`,
                            clientId: q.clientId,
                            type: "sent",
                            msg: q.content,
                            timestamp: q.queuedAt,
                            message_type: q.messageType,
                            status: "pending",
                        }),
                    );
                }
            } catch {
                // ignore local queue read errors
            }

            if (cached && now - cached.ts < MESSAGES_CACHE_TTL_MS) {
                const cachedMessages = Array.isArray(cached.data)
                    ? cached.data
                    : [];
                setMessages([...cachedMessages, ...queued]);
                return;
            }

            const response = await apiGet(
                `/api/chat/conversation/${contactId}`,
            );

            if (response.error) throw new Error(response.error);

            const data = response.data;
            const nextMessages = Array.isArray(data) ? data : [];

            messagesCache.set(contactId, { data: nextMessages, ts: Date.now() });
            setMessages([...nextMessages, ...queued]);

            // Seed dedupe set to avoid re-adding messages already loaded from DB
            const nextSeen = new Set<string>();
            for (const m of nextMessages) {
                if (m?.id != null) nextSeen.add(String(m.id));
            }
            seenMessageIdsRef.current = nextSeen;
        } catch (error) {
            console.error("Error fetching messages:", error);
            setError("Failed to load messages");
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const fetchProfileData = async (contactId: string) => {
        try {
            const response = await apiGet(`/api/chat/profile/${contactId}`);

            if (response.error) throw new Error(response.error);

            const data = response.data;
            setName(data.username || data.name || "");
            setAge(typeof data.age === "number" ? data.age : -1);
            setSex(data.sex || "");
            setScore(typeof data.score === "number" ? data.score : -1);
            setPfp(data.profile_pic || "");
            setHobbies(Array.isArray(data.hobbies) ? data.hobbies : []);

            const lastOnline = data.last_online
                ? new Date(data.last_online)
                : null;
            if (lastOnline) {
                const now = new Date();
                const diffInMinutes = Math.floor(
                    (now.getTime() - lastOnline.getTime()) / (1000 * 60),
                );
                setLastOnlineMsg(
                    `online ${
                        diffInMinutes >= 60
                            ? `${Math.floor(diffInMinutes / 60)} hours `
                            : ""
                    }${
                        diffInMinutes >= 60 && diffInMinutes % 60 != 0
                            ? "and "
                            : ""
                    } ${
                        diffInMinutes % 60 != 0
                            ? `${diffInMinutes % 60} mins`
                            : ""
                    } ago`,
                );
            } else {
                setLastOnlineMsg("Last seen unknown");
            }

            setSocials([
                { name: "Instagram", link: "#" },
                { name: "Whatsapp", link: "#" },
                { name: "Github", link: "#" },
            ]);
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    const handleContactClick = (contact: Contact) => {
        setSelectedContact(contact);
        // Best-effort: mark as read right away (backend), then refresh UI.
        void apiPost(`/api/chat/conversation/${contact.id}/read`);

        if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("chat:unread-changed"));
        }

        fetchMessages(contact.id);
        fetchProfileData(contact.id);
        setContacts((prev) =>
            prev.map((c) =>
                c.id === contact.id ? { ...c, unread_count: 0 } : c,
            ),
        );
        if (typeof window !== "undefined" && window.matchMedia) {
            if (window.matchMedia("(min-width: 1024px)").matches) {
                setShowChat(true);
                setShowProfile(true);
                return;
            }
        }
        setShowChat(true);
    };

    const handleSendMessage = async (messageContent: string) => {
        if (!messageContent.trim() || !selectedContact) return;

        const clientId =
            // @ts-expect-error - older TS libs may not have randomUUID typed
            globalThis.crypto?.randomUUID?.() ||
            `cid_${Date.now()}_${Math.random().toString(16).slice(2)}`;

        const tempMessage: MessageType = {
            id: `client-${clientId}`,
            clientId,
            type: "sent",
            msg: messageContent,
            timestamp: new Date().toISOString(),
            status: "pending",
        };

        // Optimistically add message to UI
        setMessages((prev) => [...prev, tempMessage]);

        try {
            // Use offline message handler with encryption
            const result = await sendOfflineMessage(
                selectedContact.conversation_id,
                parseInt(selectedContact.id),
                messageContent,
                false,
                undefined,
                clientId,
            );

            // Update message with server ID if sent successfully
            if (
                (result.status === "sent" || result.status === "delivered") &&
                result.serverId
            ) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.clientId === clientId
                            ? { ...msg, id: String(result.serverId) }
                            : msg,
                    ),
                );
            }

            // NOTE: Do not double-send via WebSocket here.
            // The backend already pushes real-time delivery to the recipient.

            // Update contact's latest message
            setContacts((prev) =>
                prev.map((contact) =>
                    contact.id === selectedContact.id
                        ? {
                              ...contact,
                              latest_msg: messageContent,
                              latest_msg_time: new Date().toISOString(),
                          }
                        : contact,
                ),
            );
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages((prev) =>
                prev.filter((msg) => msg.id !== tempMessage.id),
            );
            setError("Failed to send message");
        }
    };

    useEffect(() => {
        if (user) {
            const now = Date.now();
            if (
                contactsCache.data &&
                now - contactsCache.ts < CONTACTS_CACHE_TTL_MS
            ) {
                setContacts(contactsCache.data);
                setIsLoading(false);
                return;
            }
            fetchContacts();
        }
    }, [user]);

    useEffect(() => {
        // Keep cache in sync with local optimistic updates.
        if (contacts.length > 0) {
            contactsCache = { data: contacts, ts: contactsCache.ts };
        }
    }, [contacts]);

    return (
        <div className="flex h-full max-w-[1720px] w-full justify-center font-poppins">
            {/* Contacts Tab */}
            <div
                className={`w-full lg:max-w-[20vw] ${
                    showChat ? "hidden lg:block" : ""
                }`}
            >
                <ContactsList
                    contacts={contacts}
                    isLoading={isLoading}
                    error={error}
                    onContactClick={handleContactClick}
                    onErrorDismiss={() => setError(null)}
                    connectionStatus={connectionStatus}
                />
            </div>

            {/* Chat Tab */}
            <div
                className={`flex-1 ${
                    showChat && selectedContact ? "" : "hidden lg:flex"
                }`}
            >
                <ChatArea
                    selectedContact={selectedContact}
                    messages={messages}
                    isLoadingMessages={isLoadingMessages}
                    isAuthenticated={isAuthenticated}
                    isConnected={isConnected}
                    lastOnlineMsg={lastOnlineMsg}
                    pfp={pfp}
                    onBack={() => setShowChat(false)}
                    onSendMessage={handleSendMessage}
                    onProfileClick={() => setShowProfile(true)}
                />
            </div>

            {/* Profile Panel: overlay on mobile, inline on desktop */}
            <div className="lg:hidden">
                <ProfilePanel
                    isVisible={showProfile}
                    onClose={() => setShowProfile(false)}
                    name={name}
                    age={age}
                    sex={sex}
                    score={score}
                    pfp={pfp}
                    hobbies={hobbies}
                    socials={socials}
                />
            </div>

            <div className={`${showProfile ? "" : "hidden"} hidden lg:flex`}>
                <ProfilePanel
                    isVisible={showProfile}
                    inline={true}
                    onClose={() => setShowProfile(false)}
                    name={name}
                    age={age}
                    sex={sex}
                    score={score}
                    pfp={pfp}
                    hobbies={hobbies}
                    socials={socials}
                />
            </div>
        </div>
    );
}
