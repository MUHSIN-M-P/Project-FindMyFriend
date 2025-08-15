"use client";
import { useState, useRef, useEffect } from "react";
import Contact from "@/components/Chat_Components/Contact";
import Message from "@/components/Chat_Components/Message";
import RetroButton from "@/components/retroButton";
import EmojiButtonPicker from "@/components/Chat_Components/EmojiButton";
import BottomBar from "@/components/bottomBar";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import back_arrow from "../../../public/icons/back_arrow.png";

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

interface ProfileData {
    name: string;
    age: number;
    gender: string;
    score: number;
    lastOnline: number;
    pfp: string;
    hobbies: string[];
    social_links: social_links[];
}

const page = () => {
    const { user, token } = useAuth();
    const [InputValue, setInputValue] = useState<string>("");
    const [showContacts, setShowContacts] = useState<Boolean>(true);
    const [showChat, setShowChat] = useState<Boolean>(false);
    const [showProfile, setShowProfile] = useState<Boolean>(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(
        null
    );
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // State for contacts and messages
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [messages, setMessages] = useState<MessageType[]>([]);

    // Profile state
    const [name, setName] = useState<string>("");
    const [age, setAge] = useState<number>(-1);
    const [score, setScore] = useState<number>(-1);
    const [sex, setSex] = useState<string>("");
    const [pfp, setPfp] = useState<string>("");
    const [hobbies, setHobbies] = useState<string[]>([]);
    const [lastOnlineMsg, setLastOnlineMsg] = useState<string>("");
    const [socials, setSocials] = useState<social_links[]>([]);

    // WebSocket hook for real-time messaging
    const {
        isConnected,
        isAuthenticated,
        sendMessage: sendWebSocketMessage,
        connectionStatus,
    } = useWebSocket({
        token: token ?? undefined, // This converts null to undefined
        onNewMessage: (newMessage) => {
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

            // Update latest message in contacts
            if (selectedContact) {
                setContacts((prev) =>
                    prev.map((contact) => {
                        if (contact.id === selectedContact.id) {
                            return {
                                ...contact,
                                latest_msg: newMessage.msg,
                                latest_msg_time: newMessage.timestamp,
                                unread_count: contact.unread_count + 1,
                            };
                        }
                        return contact;
                    })
                );
            }
        },
    });

    // Fetch contacts from API
    const fetchContacts = async () => {
        if (!token) return;

        try {
            const response = await fetch("/api/chat/contacts", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch contacts");
            }

            const data = await response.json();
            const formattedContacts = data.map((contact: any) => ({
                id: contact.id,
                name: contact.name,
                pfp_path: contact.pfp_path,
                latest_msg: contact.latest_msg,
                number: contact.unread_count || 0,
                // Keep all original fields for functionality
                conversation_id: contact.conversation_id,
                latest_msg_time: contact.latest_msg_time,
                unread_count: contact.unread_count,
                is_online: contact.is_online,
                last_online: contact.last_online,
            }));
            setContacts(formattedContacts);
        } catch (error) {
            console.error("Error fetching contacts:", error);
            setError("Failed to load contacts. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch messages for selected contact
    const fetchMessages = async (contactId: string) => {
        if (!token) return;

        setIsLoadingMessages(true);
        try {
            const response = await fetch(
                `/api/chat/conversation/${contactId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch messages");
            }

            const data = await response.json();
            setMessages(data);
        } catch (error) {
            console.error("Error fetching messages:", error);
            setError("Failed to load messages. Please try again.");
        } finally {
            setIsLoadingMessages(false);
        }
    };

    // Fetch profile data for selected contact
    const fetchProfileData = async (contactId: string) => {
        if (!token) return;

        try {
            const response = await fetch(`/api/chat/profile/${contactId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch profile");
            }

            const data = await response.json();

            // Update profile state
            setName(data.name || "");
            setAge(data.age || -1);
            setSex(data.sex || "");
            setScore(data.score || -1);
            setPfp(data.pfp_url || "");
            setHobbies(data.hobbies ? data.hobbies.split(",") : []);

            // Calculate last online message
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

            // Set social links (placeholder for now)
            setSocials([
                { name: "Instagram", link: "#" },
                { name: "Whatsapp", link: "#" },
                { name: "Github", link: "#" },
            ]);
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    // Handle contact click
    const handleContactClick = (contact: Contact) => {
        setSelectedContact(contact);
        fetchMessages(contact.id);
        fetchProfileData(contact.id);

        // Clear unread count for selected contact
        setContacts((prev) =>
            prev.map((c) =>
                c.id === contact.id ? { ...c, unread_count: 0, number: 0 } : c
            )
        );

        if (window.matchMedia("(min-width: 1024px)").matches) {
            setShowChat(true);
            setShowProfile(true);
        } else {
            setShowChat(true);
        }
    };

    // Handle sending messages
    const handleSendMessage = async () => {
        if (!InputValue.trim() || !selectedContact || !token) return;

        const messageContent = InputValue.trim();
        setInputValue("");

        // Optimistically add message to UI
        const tempMessage: MessageType = {
            id: `temp-${Date.now()}`,
            type: "sent",
            msg: messageContent,
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, tempMessage]);

        try {
            // Send via WebSocket if connected and authenticated
            if (isAuthenticated && isConnected) {
                sendWebSocketMessage(
                    parseInt(selectedContact.id),
                    messageContent,
                    "text"
                );
            } else {
                // Fallback to API call
                const response = await fetch("/api/chat/send", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        recipient_id: parseInt(selectedContact.id),
                        content: messageContent,
                        message_type: "text",
                    }),
                });

                if (!response.ok) {
                    throw new Error("Failed to send message");
                }
            }

            // Update latest message in contacts
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
            // Remove optimistic message on error
            setMessages((prev) =>
                prev.filter((msg) => msg.id !== tempMessage.id)
            );
            setError("Failed to send message. Please try again.");
        }
    };

    // Initialize data on component mount
    useEffect(() => {
        if (token) {
            fetchContacts();
        }
    }, [token]);

    const contacts_tab = () => {
        return (
            <div className="contacts w-full border-t-3 md:border-t-0 lg:max-w-[20vw] lg:border-r-3 border-retro_border">
                <Link href="/">
                    <div className="flex items-center gap-2 text-3xl py-2 px-3 font-poppins font-extralight text-secondary my-3">
                        <Image
                            src={back_arrow}
                            alt="back_arrow"
                            className="w-4"
                        ></Image>
                        Back
                    </div>
                </Link>

                {/* Connection Status */}
                <div className="px-3 py-1 text-sm">
                    <span
                        className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            connectionStatus === "authenticated"
                                ? "bg-green-500"
                                : connectionStatus === "connected"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                        }`}
                    ></span>
                    {connectionStatus === "authenticated"
                        ? "Connected"
                        : connectionStatus === "connected"
                        ? "Connecting..."
                        : "Offline"}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-3 my-2 p-2 bg-red-100 text-red-700 text-sm rounded">
                        {error}
                        <button
                            onClick={() => setError(null)}
                            className="ml-2 font-bold"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Loading or Contacts */}
                {isLoading ? (
                    <div className="px-3 py-4 text-center">
                        Loading contacts...
                    </div>
                ) : contacts.length === 0 ? (
                    <div className="px-3 py-4 text-center">
                        No contacts found
                    </div>
                ) : (
                    contacts.map((contact) => (
                        <div
                            key={contact.id}
                            onClick={() => handleContactClick(contact)}
                            className="cursor-pointer"
                        >
                            <Contact contact={contact} />
                        </div>
                    ))
                )}
            </div>
        );
    };

    const chat_tab = () => {
        return (
            <div className="chat w-full flex flex-col border-r-3 border-t-3 lg:border-t-0 border-retro_border absolute top-0 right-0 lg:relative bg-background">
                <div className="flex items-center border-b-2 border-retro_border w-full py-2 px-3 gap-4 cursor-pointer">
                    <div
                        className="header lg:hidden"
                        onClick={() => {
                            setShowChat(false);
                        }}
                    >
                        <Image
                            src={back_arrow}
                            alt="back_arrow"
                            className="w-4"
                        />
                    </div>
                    {pfp ? (
                        <Image
                            src={pfp}
                            alt="their_pfp"
                            width={20}
                            height={20}
                            className="object-contain h-10 lg:h-full w-auto"
                        />
                    ) : null}
                    <div
                        className="flex flex-col"
                        onClick={() => setShowProfile(true)}
                    >
                        <p className="text-xl">{name}</p>
                        <p>
                            {selectedContact?.is_online
                                ? "Online"
                                : lastOnlineMsg}
                        </p>
                    </div>
                </div>

                <div className="group h-[68vh] md:h-[72vh] overflow-y-scroll scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent transition-all duration-300 px-5 flex flex-col-reverse">
                    <div className="flex flex-col">
                        {isLoadingMessages ? (
                            <div className="text-center py-4">
                                Loading messages...
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center py-4">
                                No messages yet. Start the conversation!
                            </div>
                        ) : (
                            messages.map((message) => (
                                <Message
                                    key={message.id}
                                    message={message}
                                    pfp={pfp}
                                />
                            ))
                        )}
                    </div>
                </div>

                <div className="bottom-0 self-center w-full">
                    <div className="flex items-center py-2 px-5 font-poppins">
                        <EmojiButtonPicker
                            onChange={setInputValue}
                            inputRef={inputRef}
                        />
                        <div className="flex items-center gap-0 sm:gap-3 rounded-full bg-primary/30 w-[80vw] md:w-[90vw] lg:w-[50vw]">
                            <input
                                type="text"
                                ref={inputRef}
                                className="p-3 rounded-lg outline-none max-w-[88vw] w-full"
                                placeholder="Type something..."
                                value={InputValue}
                                onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>
                                ) => setInputValue(e.target.value)}
                                onKeyPress={(e) =>
                                    e.key === "Enter" && handleSendMessage()
                                }
                                disabled={
                                    !selectedContact ||
                                    (!isAuthenticated && !isConnected)
                                }
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={
                                    !InputValue.trim() ||
                                    !selectedContact ||
                                    (!isAuthenticated && !isConnected)
                                }
                            >
                                <img
                                    src="/icons/send_icon.png"
                                    alt="Send"
                                    className={`${
                                        !InputValue.trim() ||
                                        !selectedContact ||
                                        (!isAuthenticated && !isConnected)
                                            ? "opacity-50 cursor-not-allowed"
                                            : "cursor-pointer hover:opacity-80"
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const profile = () => {
        return (
            <div className="min-w-fill lg:w-[30vw] font-poppins h-full w-full border-t-3 lg:border-t-0 border-retro_border absolute top-0 right-0 bg-background lg:relative flex flex-col items-center">
                <div
                    className="header absolute top-2 left-2 lg:hidden"
                    onClick={() => setShowProfile(false)}
                >
                    <Image src={back_arrow} alt="back_arrow" className="w-4" />
                </div>
                <div
                    className="flex flex-col items-center py-4 px-3 gap-4 cursor-pointer"
                    onClick={() => setShowProfile(true)}
                >
                    {pfp ? (
                        <Image
                            src={pfp}
                            alt="their_pfp"
                            width={50}
                            height={50}
                            className="object-contain h-[120px] w-auto"
                        />
                    ) : null}
                    <div className="flex flex-col gap-2">
                        <p className="text-xl">{`${name} | ${age}${sex}`}</p>
                        <RetroButton
                            text={`score: ${score}fp`}
                            icon={null}
                            onClick={() => {}}
                            isActive={false}
                            msgNo={0}
                            extraClass="bg-retro_orange"
                        />
                    </div>
                </div>
                <div className="hobbies flex flex-wrap justify-center gap-2">
                    {hobbies.map((hobby) => (
                        <RetroButton
                            key={hobby}
                            text={hobby}
                            icon={null}
                            onClick={() => {}}
                            isActive={false}
                            msgNo={0}
                            extraClass=""
                        />
                    ))}
                </div>
                <div className="socials mt-20">
                    <div className="text-2xl text-center p-5">Socials</div>
                    <div className="buttons flex flex-col items-center gap-3">
                        {socials.map((social) => (
                            <Link
                                target="_blank"
                                href={social.link}
                                key={social.name}
                            >
                                <RetroButton
                                    text={social.name}
                                    icon={`icons/${social.name.toLowerCase()}.svg`}
                                    msgNo={0}
                                    isActive={false}
                                    extraClass="bg-retro_orange"
                                    onClick={() => {}}
                                ></RetroButton>
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="danger_zone flex mt-10 gap-2">
                    <RetroButton
                        text="Block"
                        icon={null}
                        msgNo={0}
                        isActive={false}
                        extraClass="bg-retro_red text-white"
                        onClick={() => {}}
                    ></RetroButton>
                    <RetroButton
                        text="Report"
                        icon={null}
                        msgNo={0}
                        isActive={false}
                        extraClass="bg-primary text-white"
                        onClick={() => {}}
                    ></RetroButton>
                </div>
            </div>
        );
    };

    // Show loading or redirect if not authenticated
    if (!user && !isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Link
                    href="/auth/login"
                    className="text-blue-500 hover:underline"
                >
                    Please login to access chat
                </Link>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen">
                Loading...
            </div>
        );
    }

    return (
        <div className="flex flex-col w-screen overflow-hidden">
            <div className="md:h-[3px] bg-retro_border w-full"></div>
            <div className="flex h-full w-screen">
                {showContacts && contacts_tab()}
                {showChat && chat_tab()}
                {showProfile && profile()}
            </div>
        </div>
    );
};

export default page;
