"use client";

import { useState, useEffect } from "react";
import Contact from "@/components/Chat_Components/Contact";
import RetroButton from "@/components/retroButton";

interface ContactType {
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

interface ContactsListProps {
    contacts: ContactType[];
    isLoading: boolean;
    error: string | null;
    onContactClick: (contact: ContactType) => void;
    onErrorDismiss: () => void;
    connectionStatus: string;
    isRoomList?: boolean;
    onJoinRoomClick?: () => void;
    onCreateRoomClick?: () => void;
    emptyText?: string;
}

export default function ContactsList({
    contacts,
    isLoading,
    error,
    onContactClick,
    onErrorDismiss,
    connectionStatus,
    isRoomList = false,
    onJoinRoomClick,
    onCreateRoomClick,
    emptyText,
}: ContactsListProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredContacts, setFilteredContacts] =
        useState<ContactType[]>(contacts);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredContacts(contacts);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = contacts.filter((contact) =>
            contact.name.toLowerCase().includes(query)
        );
        setFilteredContacts(filtered);
    }, [searchQuery, contacts]);

    return (
        <div className="relative h-full">
            <div className="contacts w-full lg:max-w-[20vw] lg:border-r-3 border-t-3 border-retro_border h-full pb-20">
                <div className="px-3 py-1 text-sm mt-3">
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

                {error && (
                    <div className="mx-3 my-2 p-2 bg-red-100 text-red-700 text-sm rounded">
                        {error}
                        <button
                            onClick={onErrorDismiss}
                            className="ml-2 font-bold"
                        >
                            x
                        </button>
                    </div>
                )}

                <div className="px-3 pt-2">
                    <div className="w-full rounded-xl border-2 border-retro_border bg-background overflow-hidden">
                        <div className="flex items-center text-xl gap-3 h-[3rem] p-3 px-3">
                            <img
                                src="/search_icon.svg"
                                alt="search"
                                className="object-contain w-5"
                            />
                            <input
                                type="text"
                                placeholder={
                                    isRoomList
                                        ? "Search rooms"
                                        : "Search contacts"
                                }
                                className="border-0 w-full h-7 focus:outline-0 text-sm tracking-wide"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {searchQuery.trim() && filteredContacts.length === 0 ? (
                            <div className="border-t-2 border-retro_border text-sm py-2 text-center">
                                {isRoomList
                                    ? "No rooms found"
                                    : "No contacts found"}
                            </div>
                        ) : null}
                    </div>
                </div>

                {isLoading ? (
                    <div className="px-3 py-4 text-center">
                        Loading contacts...
                    </div>
                ) : filteredContacts.length === 0 && !searchQuery.trim() ? (
                    <div className="px-3 py-4 text-center">
                        {emptyText ??
                            (isRoomList ? "No rooms yet" : "No contacts yet")}
                    </div>
                ) : (
                    filteredContacts.map((contact: ContactType) => (
                        <div
                            key={contact.id}
                            onClick={() => onContactClick(contact)}
                            className="cursor-pointer"
                        >
                            <Contact contact={contact} />
                        </div>
                    ))
                )}
            </div>
            {isRoomList && (
                <div className="w-full flex justify-center items-center py-4 absolute bottom-0 left-0 bg-transparent z-10 border-r-3 border-retro_border">
                    <div className="flex gap-3">
                        <RetroButton
                            text="Create"
                            icon={null}
                            onClick={onCreateRoomClick || (() => {})}
                            isActive={false}
                            msgNo={0}
                            extraClass="bg-primary text-white px-[10%] py-[.5rem]!"
                        />
                        <RetroButton
                            text="Join"
                            icon={null}
                            onClick={onJoinRoomClick || (() => {})}
                            isActive={false}
                            msgNo={0}
                            extraClass="bg-retro_orange text-white px-[10%] py-[.5rem]!"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
