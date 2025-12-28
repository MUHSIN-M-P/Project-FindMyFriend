import Image from "next/image";
import Link from "next/link";
import type { MouseEvent } from "react";

import RetroButton from "./retroButton";

interface userProps {
    id: string; // Unique id
    name: string;
    age: number;
    gender: string; // M/F
    hobbies: string[]; // 3 hobbies
    desc: string; //description about self
    pfp_path: string;
    score: number;
    bestMatch: boolean;
}

interface props {
    user: userProps;
    onUserClick?: (userId: number) => void;
}

const Usercard = ({ user, onUserClick }: props) => {
    const handleProfileClick = (e: MouseEvent) => {
        if (!onUserClick) return;
        e.preventDefault();
        onUserClick(Number(user.id));
    };

    return (
        <div
            className={`px-2 md:px-5 py-6 lg:px-7 lg:py-8 font-poppins rounded-3xl shadow-3 flex flex-col w-full justify-between md:flex-row gap-3 items-start md:items-center text-secondary ${
                user.bestMatch ? "bg-primary text-white relative" : ""
            }`}
        >
            <div
                className={`bg-background absolute max-w-[167px] w-full max-h-[36px] h-full text-secondary flex justify-center items-center rounded-md shadow font-semibold top-[-18px] left-[36px] ${
                    user.bestMatch ? "" : "hidden"
                }`}
            >
                # BEST MATCH
            </div>
            <Link
                onClick={handleProfileClick}
                href={`/profile/${user.id}`}
                className="w-full flex justify-center items-center min-w-[80px] min-h-[80px] max-w-[120px] max-h-[120px]"
            >
                <Image
                    src={user.pfp_path || "/avatars/male_avatar.png"}
                    alt={`${user.name}_pfp`}
                    width={120}
                    height={120}
                    className="w-full h-full object-contain"
                />
            </Link>
            <div className="userInfo w-full flex flex-col gap-2 mb-2 md:mb-0">
                <Link
                    onClick={handleProfileClick}
                    href={`/profile/${user.id}`}
                    className="intro_title font-semibold text-[22px]"
                >
                    {user.name} | {user.age}
                    {user.gender}
                </Link>
                <div className="Hobbies flex gap-2 lg:gap-3 text-secondary flex-wrap">
                    {user.hobbies.map((hobby, index) => (
                        <span
                            key={index}
                            className="px-3 py-[6px] rounded-lg border-2 border-retro_border bg-background text-secondary text-sm font-poppins font-semibold tracking-wide"
                        >
                            {hobby}
                        </span>
                    ))}
                </div>
                <Link
                    onClick={handleProfileClick}
                    href={`/profile/${user.id}`}
                    className="desc text-[16px] text-left w-full"
                >
                    {user.desc}
                </Link>
            </div>
            <div className="btns flex w-full md:w-fit md:flex-col justify-around gap-4 md:gap-[61px] text-secondary">
                <RetroButton
                    text={`Score: ${user.score}fp`}
                    icon={null}
                    onClick={() => {}}
                    isActive={false}
                    msgNo={0}
                    extraClass="mx-0! bg-retro_orange w-full"
                />
                <Link href={`/chat/${user.id}`} className="mx-0! w-full">
                    <RetroButton
                        text="Connect"
                        icon={"/icons/conn_icon.svg"}
                        onClick={() => {}}
                        isActive={false}
                        msgNo={0}
                        extraClass="mx-0! w-full"
                    />
                </Link>
            </div>
        </div>
    );
};

export default Usercard;
