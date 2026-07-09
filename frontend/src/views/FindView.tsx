"use client";

import Image from "next/image";
import search_icon from "../../public/search_icon.svg";
import Usercard from "@/components/Usercard";
import RetroButton from "@/components/retroButton";
import YourActivity from "@/components/yourActivity";
import QuestionsModal from "@/components/QuestionsModal";
import { useEffect, useState } from "react";
import { FiTarget } from "react-icons/fi";
import { apiGet } from "@/utils/api";

export interface FindViewProps {
    onUserClick?: (userId: number) => void;
}

export default function FindView({ onUserClick }: FindViewProps) {
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState<any[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [userError, setUserError] = useState<string | null>(null);
    const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);

    // Sample questions - replace with actual questions from API
    const questions = [
        {
            id: 1,
            question: "What is your favorite movie?",
            options: [
                { option: "The Dark Knight", value: 1 },
                { option: "The Dark Knight Rises", value: 2 },
                { option: "The Dark Knight Returns", value: 3 },
            ],
        },
        {
            id: 2,
            question: "What is your favorite food?",
            options: [
                { option: "Pizza", value: 1 },
                { option: "Burger", value: 2 },
                { option: "Pasta", value: 3 },
            ],
        },
        {
            id: 3,
            question: "What is your favorite color?",
            options: [
                { option: "Blue", value: 1 },
                { option: "Red", value: 2 },
                { option: "Green", value: 3 },
            ],
        },
        {
            id: 4,
            question: "What is your favorite sport?",
            options: [
                { option: "Cricket", value: 1 },
                { option: "Football", value: 2 },
                { option: "Basketball", value: 3 },
            ],
        },
        {
            id: 5,
            question: "What is your favorite hobby?",
            options: [
                { option: "Coding", value: 1 },
                { option: "Reading", value: 2 },
                { option: "Gaming", value: 3 },
            ],
        },
    ];

    const fetchUsers = async (q: string) => {
        try {
            setUserError(null);
            const response = q
                ? await apiGet(`/api/chat/search?q=${encodeURIComponent(q)}`)
                : await apiGet(`/api/find/matches?limit=10`);
            if (response.error) {
                throw new Error(response.error);
            }
            const data = response.data;
            const mapped = (data || []).map((u: any) => ({
                id: String(u.id),
                name: u.name,
                age: u.age ?? 0,
                gender: u.sex ?? "",
                hobbies: Array.isArray(u.hobbies) ? u.hobbies : [],
                desc: u.bio ?? "",
                pfp_path: u.pfp_path ?? "/avatars/male_avatar.png",
                score: u.score ?? 0,
                bestMatch: Boolean(u.bestMatch),
            }));
            setUsers(mapped);
        } catch (e) {
            console.error(e);
            setUserError("Failed to load users");
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const fetchActivity = async () => {
        const res = await apiGet<{ notifications: any[] }>("/api/activity");
        if (res.data?.notifications) {
            setNotifications(res.data.notifications);
        }
    };

    useEffect(() => {
        // initial suggestions
        fetchUsers("");
        void fetchActivity();
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

    return (
        <div className="flex h-full max-w-[1720px] w-full justify-center font-poppins px-5 md:px-10 xl:px-20 pb-20">
            <div className="lhs w-full lg:w-[65vw] flex flex-col items-center lg:pr-6 border-t-3 border-retro_border">
                {/* Improve Matching Section */}
                <div className="w-full bg-gradient-to-br from-primary/10 to-retro_orange/10 border-3 border-retro_border rounded-2xl p-6 mt-4 shadow-2 mb-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                            <div className="p-3 bg-primary/20 rounded-xl">
                                <FiTarget className="w-8 h-8 text-primary" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <h3 className="text-xl font-semibold text-secondary font-poppins">
                                    Improve Your Matching
                                </h3>
                                <p className="text-secondary/70 text-sm">
                                    Answer a few questions to help us find
                                    better matches for you. Express your
                                    interests and preferences!
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsQuestionsModalOpen(true)}
                            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold font-poppins shadow-button hover:bg-primary/90 transition-all whitespace-nowrap"
                        >
                            Get Started
                        </button>
                    </div>
                </div>

                <div className="searchBar  w-full flex items-center mb-3">
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
                        text="Search"
                        icon={null}
                        onClick={() => {
                            setIsLoadingUsers(true);
                            void fetchUsers(query.trim());
                        }}
                        isActive={true}
                        msgNo={0}
                        extraClass="h-12 w-fit text-nowrap"
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

            {/* Questions Modal */}
            <QuestionsModal
                isOpen={isQuestionsModalOpen}
                onClose={() => setIsQuestionsModalOpen(false)}
                questions={questions}
            />
        </div>
    );
}
