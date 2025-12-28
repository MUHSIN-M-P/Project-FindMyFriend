"use client";

import Image from "next/image";
import Link from "next/link";
import RetroButton from "@/components/retroButton";
import back_arrow from "../../../public/icons/back_arrow.png";

interface social_links {
    name: string;
    link: string;
}

interface ProfilePanelProps {
    isVisible: boolean;
    onClose: () => void;
    name: string;
    age: number;
    sex: string;
    score: number;
    pfp: string;
    hobbies: string[];
    socials: social_links[];
}

export default function ProfilePanel({
    isVisible,
    onClose,
    name,
    age,
    sex,
    score,
    pfp,
    hobbies,
    socials,
}: ProfilePanelProps) {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center lg:items-start lg:justify-end">
            <div className="bg-background w-full max-w-md lg:max-w-[30vw] h-full lg:h-full overflow-y-auto border-l-3 border-retro_border font-poppins flex flex-col items-center relative">
                <div
                    className="absolute top-3 left-3 z-30 cursor-pointer bg-background rounded-full p-2 shadow-md"
                    onClick={onClose}
                >
                    <Image src={back_arrow} alt="back_arrow" className="w-4" />
                </div>
                <div className="flex flex-col items-center py-4 px-3 gap-4">
                    {pfp && (
                        <Image
                            src={pfp}
                            alt="their_pfp"
                            width={50}
                            height={50}
                            className="object-contain h-[120px] w-auto"
                        />
                    )}
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
                <div className="hobbies flex flex-wrap justify-center gap-2 px-3">
                    {hobbies.map((hobby) => (
                        <span
                            key={hobby}
                            className="px-3 py-[6px] rounded-lg border-2 border-retro_border bg-background text-secondary text-sm font-poppins font-semibold tracking-wide"
                        >
                            {hobby}
                        </span>
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
                                />
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="danger_zone flex mt-10 gap-2 pb-6">
                    <RetroButton
                        text="Block"
                        icon={null}
                        msgNo={0}
                        isActive={false}
                        extraClass="bg-retro_red text-white"
                        onClick={() => {}}
                    />
                    <RetroButton
                        text="Report"
                        icon={null}
                        msgNo={0}
                        isActive={false}
                        extraClass="bg-primary text-white"
                        onClick={() => {}}
                    />
                </div>
            </div>
        </div>
    );
}
