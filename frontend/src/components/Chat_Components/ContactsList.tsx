"use client";

import { useState, useEffect } from "react";
import Contact from "@/components/Chat_Components/Contact";

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
}

export default function ContactsList({
    contacts,
    isLoading,
    error,
    onContactClick,
    onErrorDismiss,
    connectionStatus,
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
        <div className="contacts w-full lg:max-w-[20vw] lg:border-r-3 border-t-3 border-retro_border h-full">
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
                    <button onClick={onErrorDismiss} className="ml-2 font-bold">
                        ×
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
                            placeholder="Search contacts"
                            className="border-0 w-full h-7 focus:outline-0 text-sm tracking-wide"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {searchQuery.trim() && filteredContacts.length === 0 ? (
                        <div className="border-t-2 border-retro_border text-sm py-2 text-center">
                            No contacts found
                        </div>
                    ) : null}
                </div>
            </div>

            {isLoading ? (
                <div className="px-3 py-4 text-center">Loading contacts...</div>
            ) : filteredContacts.length === 0 && !searchQuery.trim() ? (
                <div className="px-3 py-4 text-center">No contacts yet</div>
            ) : (
                filteredContacts.map((contact) => (
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
    );
}
