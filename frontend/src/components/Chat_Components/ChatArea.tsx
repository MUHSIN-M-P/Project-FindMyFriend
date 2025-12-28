"use client";

import { useState, useRef, useEffect } from "react";
import Message from "@/components/Chat_Components/Message";
import EmojiButtonPicker from "@/components/Chat_Components/EmojiButton";
import Image from "next/image";
import back_arrow from "../../../public/icons/back_arrow.png";

interface MessageType {
    id: string;
    type: "sent" | "received";
    msg: string;
    pfp?: string;
    timestamp?: string;
    message_type?: string;
}

interface Contact {
    id: string;
    name: string;
    pfp_path: string;
    is_online: boolean;
}

interface ChatAreaProps {
    selectedContact: Contact | null;
    messages: MessageType[];
    isLoadingMessages: boolean;
    isAuthenticated: boolean;
    isConnected: boolean;
    lastOnlineMsg: string;
    pfp: string;
    onBack: () => void;
    onSendMessage: (message: string) => void;
    onProfileClick: () => void;
}

export default function ChatArea({
    selectedContact,
    messages,
    isLoadingMessages,
    isAuthenticated,
    isConnected,
    lastOnlineMsg,
    pfp,
    onBack,
    onSendMessage,
    onProfileClick,
}: ChatAreaProps) {
    const [inputValue, setInputValue] = useState<string>("");
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleSendMessage = () => {
        if (!inputValue.trim() || !selectedContact) return;
        onSendMessage(inputValue.trim());
        setInputValue("");
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (!selectedContact) {
        return (
            <div className="chat w-full border-t-3 border-retro_border bg-background">
                <div className="flex items-center justify-center h-full text-center px-5">
                    <div>
                        <p className="text-lg opacity-70">
                            Select a contact to start chatting
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="chat w-full flex flex-col border-t-3 border-retro_border bg-background">
            <div className="flex items-center border-b-2 border-retro_border w-full py-2 px-3 gap-4">
                <div
                    className="header lg:hidden cursor-pointer"
                    onClick={onBack}
                >
                    <Image src={back_arrow} alt="back_arrow" className="w-4" />
                </div>
                {pfp && (
                    <Image
                        src={pfp}
                        alt="their_pfp"
                        width={35}
                        height={35}
                        className="object-contain h-10 lg:h-full w-auto"
                    />
                )}
                <div
                    className="flex flex-col cursor-pointer hover:opacity-80"
                    onClick={onProfileClick}
                >
                    <p className="text-xl">{selectedContact.name}</p>
                    <p>
                        {selectedContact.is_online ? "Online" : lastOnlineMsg}
                    </p>
                </div>
            </div>

            <div className="group h-[68vh] md:h-[72vh] overflow-y-scroll scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent px-5 flex flex-col-reverse">
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
                        messages.map((message, index) => (
                            <Message
                                key={`msg-${message.id}-${index}`}
                                message={message}
                                pfp={pfp}
                            />
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

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
                            onChange={(e) => setInputValue(e.target.value)}
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
                                !inputValue.trim() ||
                                !selectedContact ||
                                (!isAuthenticated && !isConnected)
                            }
                        >
                            <img
                                src="/icons/send_icon.png"
                                alt="Send"
                                className={`${
                                    !inputValue.trim() ||
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
}
