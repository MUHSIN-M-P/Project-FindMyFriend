"use client";

import Image from "next/image";
import search_icon from "../../public/search_icon.svg";
import Usercard from "@/components/Usercard";
import RetroButton from "@/components/retroButton";
import YourActivity from "@/components/yourActivity";
import { useEffect, useState } from "react";

export interface FindViewProps {
    onUserClick?: (userId: number) => void;
}

export default function FindView({ onUserClick }: FindViewProps) {
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState<any[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [userError, setUserError] = useState<string | null>(null);

    const fetchUsers = async (q: string) => {
        try {
            setUserError(null);
            const response = await fetch(
                `/api/chat/search?q=${encodeURIComponent(q)}`
            );
            if (!response.ok) {
                throw new Error("Failed to fetch users");
            }
            const data = await response.json();
            const mapped = (data || []).map((u: any) => ({
                id: String(u.id),
                name: u.name,
                age: u.age ?? 0,
                gender: u.sex ?? "",
                hobbies: Array.isArray(u.hobbies) ? u.hobbies : [],
                desc: u.bio ?? "",
                pfp_path: u.pfp_path ?? "/avatars/male_avatar.png",
                score: 0,
                bestMatch: false,
            }));
            setUsers(mapped);
        } catch (e) {
            console.error(e);
            setUserError("Failed to load users");
        } finally {
            setIsLoadingUsers(false);
        }
    };

    useEffect(() => {
        // initial suggestions
        fetchUsers("");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const t = setTimeout(() => {
            setIsLoadingUsers(true);
            fetchUsers(query.trim());
        }, 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    const notifications_res = {
        data: {
            notifications: [
                {
                    type: "question_no",
                    no: 29,
                },
                {
                    type: "req_accepted",
                    name: "Sidsity",
                },
                {
                    type: "new_friends",
                    no: 25,
                },
                {
                    type: "req_accepted",
                    name: "Adolf Hitler",
                },
                {
                    type: "req_accepted",
                    name: "Muhsina",
                },
            ],
        },
    };
    const notifications = notifications_res.data.notifications;

    return (
        <div className="flex h-full max-w-[1720px] w-full justify-center font-poppins px-5 md:px-10 xl:px-20 pb-20">
            <div className="lhs w-full lg:w-[65vw] flex flex-col items-center lg:pr-20 border-t-3 border-retro_border">
                <div className="searchBar py-5 w-full flex items-center gap-2 md:gap-5 mb-3">
                    <div className="search_boundary w-full shadow-2 flex items-center text-xl gap-4 rounded-xl h-[3rem] p-3 px-3 md:px-6">
                        <Image
                            src={search_icon}
                            alt="magnifying glass"
                            className="object-cover w-5"
                        />
                        <input
                            type="text"
                            placeholder="Search"
                            className="border-0 w-full h-7 focus:outline-0 text-sm tracking-wide"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <RetroButton
                        text="Advanced Search"
                        icon={null}
                        onClick={() => {}}
                        isActive={true}
                        msgNo={0}
                        extraClass="h-full w-fit text-nowrap"
                    />
                </div>
                <div className="flex flex-col w-full items-center gap-[28px]">
                    {userError ? (
                        <div className="w-full text-center py-6">
                            {userError}
                        </div>
                    ) : isLoadingUsers ? (
                        <div className="w-full text-center py-6">
                            Loading...
                        </div>
                    ) : users.length === 0 ? (
                        <div className="w-full text-center py-6">
                            No users found
                        </div>
                    ) : (
                        users.map((user, index) => (
                            <Usercard
                                key={index}
                                user={user}
                                onUserClick={onUserClick}
                            />
                        ))
                    )}
                </div>
            </div>
            <div className="hidden lg:block bg-retro_border w-1"></div>
            <div className="rhs hidden lg:flex lg:w-[35vw] h-fit">
                <YourActivity notifications={notifications} />
            </div>
        </div>
    );
}
