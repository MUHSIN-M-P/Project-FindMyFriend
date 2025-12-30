"use client";

import { useState, useEffect, useRef } from "react";
import ContactsList from "@/components/Chat_Components/ChatList";
import ChatArea from "@/components/Chat_Components/ChatArea";
import ProfilePanel from "@/components/Chat_Components/ProfilePanel";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";

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
    number: number;
}

interface MessageType {
    id: string;
    type: "sent" | "received";
    msg: string;
    pfp?: string;
    timestamp?: string;
    message_type?: string;
}

export default function ChatView() {
    const { user } = useAuth();
    const [showChat, setShowChat] = useState<boolean>(false);
    const [showProfile, setShowProfile] = useState<boolean>(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(
        null
    );
    const [isLoading, setIsLoading] = useState(true);
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

    const {
        isConnected,
        isAuthenticated,
        sendMessage: sendWebSocketMessage,
        connectionStatus,
        userId: wsUserId,
    } = useWebSocket({
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

            console.log("Received WS message:", newMessage);
            console.log("Current user ID:", user?.id);
            console.log("Message sender ID:", newMessage.sender_id);

            const senderId =
                newMessage.sender_id != null
                    ? Number(newMessage.sender_id)
                    : null;

            // Ignore messages sent by current user (already have optimistic update)
            if (user && senderId === user.id) {
                console.log(
                    "Ignoring own message - already added optimistically"
                );
                return;
            }

            if (
                selectedContact &&
                senderId &&
                senderId === Number(selectedContact.id)
            ) {
                console.log("Adding received message to chat");
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
                setContacts((prev) =>
                    prev.map((contact) =>
                        contact.id === selectedContact.id
                            ? {
                                  ...contact,
                                  latest_msg: newMessage.msg,
                                  latest_msg_time: newMessage.timestamp,
                                  unread_count: 0,
                              }
                            : contact
                    )
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
                            number: 1,
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
                                  number: (contact.number || 0) + 1,
                              }
                            : contact
                    );
                });
            }
        },
    });

    const fetchContacts = async () => {
        try {
            const response = await fetch("/api/chat/contacts");

            if (!response.ok) {
                const contentType = response.headers.get("content-type") || "";
                let errorText = `Failed to fetch contacts (${response.status})`;
                if (contentType.includes("application/json")) {
                    const j = await response.json().catch(() => null);
                    if (j?.error) errorText = String(j.error);
                } else {
                    const t = await response.text().catch(() => "");
                    if (t) errorText = t;
                }
                throw new Error(errorText);
            }

            const data = await response.json();
            const formattedContacts = data.map((contact: any) => ({
                id: contact.id,
                name: contact.name,
                pfp_path: contact.pfp_path,
                latest_msg: contact.latest_msg,
                number: contact.unread_count || 0,
                conversation_id: contact.conversation_id,
                latest_msg_time: contact.latest_msg_time,
                unread_count: contact.unread_count,
                is_online: contact.is_online,
                last_online: contact.last_online,
            }));
            setContacts(formattedContacts);
            return formattedContacts as Contact[];
        } catch (error) {
            console.error("Error fetching contacts:", error);
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to load contacts"
            );
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMessages = async (contactId: string) => {
        setIsLoadingMessages(true);
        try {
            const response = await fetch(`/api/chat/conversation/${contactId}`);

            if (!response.ok) throw new Error("Failed to fetch messages");

            const data = await response.json();
            const nextMessages = Array.isArray(data) ? data : [];
            setMessages(nextMessages);

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
            const response = await fetch(`/api/chat/profile/${contactId}`);

            if (!response.ok) throw new Error("Failed to fetch profile");

            const data = await response.json();
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
                    (now.getTime() - lastOnline.getTime()) / (1000 * 60)
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
                    } ago`
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
        fetchMessages(contact.id);
        fetchProfileData(contact.id);
        setContacts((prev) =>
            prev.map((c) =>
                c.id === contact.id ? { ...c, unread_count: 0, number: 0 } : c
            )
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

        const tempMessage: MessageType = {
            id: `temp-${Date.now()}`,
            type: "sent",
            msg: messageContent,
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, tempMessage]);

        try {
            if (isAuthenticated && isConnected) {
                sendWebSocketMessage(
                    parseInt(selectedContact.id),
                    messageContent,
                    "text"
                );
            } else {
                const response = await fetch(`/api/chat/send`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        recipient_id: parseInt(selectedContact.id),
                        content: messageContent,
                        message_type: "text",
                    }),
                });

                if (!response.ok) throw new Error("Failed to send message");
            }

            setContacts((prev) =>
                prev.map((contact) =>
                    contact.id === selectedContact.id
                        ? {
                              ...contact,
                              latest_msg: messageContent,
                              latest_msg_time: new Date().toISOString(),
                          }
                        : contact
                )
            );
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages((prev) =>
                prev.filter((msg) => msg.id !== tempMessage.id)
            );
            setError("Failed to send message");
        }
    };

    useEffect(() => {
        if (user) {
            fetchContacts();
        }
    }, [user]);

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
