"use client";

import Image from "next/image";
import RetroButton from "@/components/retroButton";
import YourActivity from "@/components/yourActivity";
import SettingsView from "@/views/SettingsView";
import QuestionCard from "@/components/questionCard";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import OnboardingModal from "@/components/OnboardingModal";

interface ProfileViewProps {
    userId?: number;
}

export default function ProfileView({ userId }: ProfileViewProps) {
    const { user: currentUser, refreshUser } = useAuth();
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const res = {
        data: {
            user: {
                id: "1",
                name: "Ibinu Jaleel",
                age: 19,
                gender: "M",
                hobbies: ["Movies", "Eating", "Coding"],
                desc: `I'm one of those guys who lives to see movies - not because I'm hiding from the world, but because I genuinely love getting lost in great storytelling. I fall somewhere in that comfortable middle ground between introvert and extrovert, which means I'm equally happy having deep conversations over coffee or enjoying a quiet night in with a classic film. I think the best connections happen when you can appreciate both the energy of going out and the intimacy of staying in.`,
                pfp_path: "frontend/public/3d_avatar_6.png",
                score: 19,
                bestMatch: true,
                social_links: [
                    {
                        name: "Instagram",
                        link: "https://www.instagram.com/ibinujaleel/",
                    },
                    { name: "Whatsapp", link: "https://wa.me/919876543210" },
                    { name: "Github", link: "https://github.com/ibinujaleel" },
                ],
                topQuestions: [
                    {
                        id: 1,
                        question: "What is your favorite movie?",
                        options: [
                            {
                                option: "The Dark Knight",
                                value: 1,
                                isSelected: true,
                            },
                            {
                                option: "The Dark Knight Rises",
                                value: 2,
                                isSelected: false,
                            },
                            {
                                option: "The Dark Knight Returns",
                                value: 3,
                                isSelected: false,
                            },
                        ],
                    },
                    {
                        id: 2,
                        question: "What is your favorite food?",
                        options: [
                            { option: "Pizza", value: 1, isSelected: false },
                            { option: "Burger", value: 2, isSelected: true },
                            { option: "Pasta", value: 3, isSelected: false },
                        ],
                    },
                    {
                        id: 3,
                        question: "What is your favorite color?",
                        options: [
                            { option: "Blue", value: 1, isSelected: true },
                            { option: "Red", value: 2, isSelected: false },
                            { option: "Green", value: 3, isSelected: false },
                        ],
                    },
                    {
                        id: 4,
                        question: "What is your favorite sport?",
                        options: [
                            { option: "Cricket", value: 1, isSelected: true },
                            { option: "Football", value: 2, isSelected: false },
                            {
                                option: "Basketball",
                                value: 3,
                                isSelected: false,
                            },
                        ],
                    },
                    {
                        id: 5,
                        question: "What is your favorite hobby?",
                        options: [
                            { option: "Coding", value: 1, isSelected: true },
                            { option: "Reading", value: 2, isSelected: false },
                            { option: "Gaming", value: 3, isSelected: false },
                        ],
                    },
                ],
            },
        },
    };
    const placeholderUser = res.data.user;

    const isOwnProfile =
        !userId || (currentUser && Number(userId) === Number(currentUser.id));

    const user =
        isOwnProfile && currentUser
            ? {
                  id: String(currentUser.id),
                  name: currentUser.username,
                  age: currentUser.age ?? "",
                  gender: currentUser.sex ?? "",
                  hobbies: currentUser.hobbies ?? [],
                  desc: currentUser.bio ?? "",
                  pfp_path:
                      currentUser.profile_pic || "/avatars/male_avatar.png",
                  score: -1,
                  bestMatch: false,
                  social_links: Array.isArray(currentUser.social_links)
                      ? currentUser.social_links.filter(
                            (l) => l.link && l.link.trim() !== ""
                        )
                      : [],
                  topQuestions: placeholderUser.topQuestions,
              }
            : placeholderUser;

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
    console.log(user.social_links)
    return (
        <div className="flex h-full max-w-[1720px] w-full justify-center font-poppins px-5 md:px-10 xl:px-20 pb-20">
            <div className="lhs w-full lg:w-[65vw] px-5 max-sm:px-0! pb-5 flex flex-col gap-5 items-center border-t-3 lg:border-3 border-r-0! border-retro_border">
                <div
                    className={`relative font-poppins flex flex-col w-full justify-between md:flex-row gap-3 items-center text-secondary pt-5`}
                >
                    <div className="w-full flex justify-center items-center min-w-[80px] min-h-[80px] max-w-[120px] max-h-[120px]">
                        <Image
                            src={user.pfp_path}
                            alt={`${user.name}_pfp`}
                            width={120}
                            height={120}
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <div className="userInfo w-full flex flex-col gap-2 mb-2 md:mb-0">
                        <div className="intro_title font-semibold text-[22px] max-md:text-center">
                            {user.name} | {user.age} {user.gender}
                        </div>
                        <div className="Hobbies flex gap-2 lg:gap-3 text-secondary flex-wrap max-md:justify-center ">
                            {user.hobbies.map((hobby, index) => (
                                <span
                                    key={index}
                                    className="px-2 py-[4px] rounded-lg border-2 border-retro_border bg-background text-secondary text-xs font-poppins font-semibold tracking-wide"
                                >
                                    {hobby}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="md:absolute right-0 top-0 btns flex w-fit py-10 max-md:py-0! items-start gap-4 text-secondary">
                        <RetroButton
                            text="Edit profile"
                            icon={"/icons/edit_ic.svg"}
                            onClick={() => setIsEditingProfile(true)}
                            isActive={true}
                            msgNo={0}
                            extraClass="mx-0! w-full "
                        />
                    </div>
                </div>

                <div className="text-secondary text-[22px] text-left w-full flex flex-col gap-3 items-center">
                    <div className="flex flex-row justify-between w-full">
                        About me
                    </div>
                    <div className="desc text-[16px] w-full px-4 text-justify!">
                        {user.desc}
                    </div>
                </div>

                <div className="w-full flex flex-row flex-wrap gap-2 justify-around items-center">
                    {user.social_links &&
                        user.social_links.length > 0 &&
                        user.social_links.map((link, idx) => {
                            let icon = "/icons/link.svg";
                            if (link.name.toLowerCase().includes("insta"))
                                icon = "/icons/instagram.svg";
                            else if (
                                link.name.toLowerCase().includes("whatsapp")
                            )
                                icon = "/icons/whatsapp.svg";
                            else if (link.name.toLowerCase().includes("github"))
                                icon = "/icons/github.svg";
                            return (
                                <a
                                    key={idx}
                                    target="_blank"
                                    href={link.link}
                                    rel="noopener noreferrer"
                                >
                                    <RetroButton
                                        text={link.name}
                                        icon={icon}
                                        onClick={() => {}}
                                        isActive={false}
                                        msgNo={0}
                                        extraClass="mx-0! bg-retro_orange"
                                    />
                                </a>
                            );
                        })}
                </div>
                <RetroButton
                    text="Settings"
                    icon={"/icons/settings.svg"}
                    onClick={() => setShowSettings(true)}
                    isActive={showSettings}
                    msgNo={0}
                    extraClass="mx-0!"
                />

                <div className="topQuestions text-secondary text-[22px] text-left w-full flex flex-col gap-3 items-start pt-10">
                    Top Questions
                    <div className="flex flex-col w-full items-center gap-5 mt-2">
                        {user.topQuestions.map((question, index) => (
                            <QuestionCard key={index} question={question} />
                        ))}
                    </div>
                </div>
            </div>

            {isOwnProfile && currentUser && isEditingProfile && (
                <OnboardingModal
                    initialAge={currentUser.age}
                    initialSex={currentUser.sex}
                    initialBio={currentUser.bio}
                    initialHobbies={currentUser.hobbies}
                    onCompleted={async () => {
                        await refreshUser();
                        setIsEditingProfile(false);
                    }}
                />
            )}
            <div className="hidden lg:block bg-retro_border w-1"></div>
            {/* Desktop: show settings or activity on right. Mobile: show settings full view if open */}
            <div
                className={`rhs hidden lg:flex lg:w-[35vw] h-fit ${
                    showSettings ? "" : ""
                }`}
            >
                {showSettings ? (
                    <SettingsView />
                ) : (
                    <YourActivity notifications={notifications} />
                )}
            </div>
            {/* Mobile full settings view */}
            {showSettings && (
                <div className="fixed inset-0 z-50 bg-background flex flex-col lg:hidden">
                    <div className="flex justify-end p-4">
                        <button
                            onClick={() => setShowSettings(false)}
                            className="text-2xl"
                        >
                            ✕
                        </button>
                    </div>
                    <SettingsView />
                </div>
            )}
        </div>
    );
}
