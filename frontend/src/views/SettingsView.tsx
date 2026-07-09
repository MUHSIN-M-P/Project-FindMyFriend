"use client";

import Link from "next/link";
import RetroButton from "@/components/retroButton";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { apiDelete } from "@/utils/api";

export default function SettingsView({ onClose }: { onClose?: () => void }) {
    const currentPath = usePathname();
    const { logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (isDeleting) return;

        const ok = window.confirm(
            "Delete your account permanently? This cannot be undone.",
        );
        if (!ok) return;

        setIsDeleting(true);
        try {
            const res = await apiDelete("/api/auth/delete");

            if (res.error) {
                alert(res.error || "Failed to delete account");
                return;
            }

            window.location.href = "/";
        } finally {
            setIsDeleting(false);
        }
    };

    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        await logout();
    };

    return (
        <div className="relative flex flex-col px-5 items-center w-full border-3 border-l-0 max-lg:border-b-0! max-lg:border-r-0! border-retro_border font-poppins">
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute left-4 top-4 lg:top-8 p-2 hover:bg-primary/10 rounded-lg transition-colors"
                    aria-label="Go back"
                >
                    <svg
                        className="w-6 h-6 text-secondary"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </button>
            )}
            <div className="flex justify-center items-center title w-full text-4xl max-lg:text-2xl font-medium text-secondary lg:py-8 py-4">
                Settings
            </div>
            <div className="w-full bg-retro_border h-[2px] max-lg:hidden"></div>
            <div className="lg:py-3">
                <div className="desc text-[16px] w-full px-4 text-justify!">
                    Disclaimer: We do not share any of your information outside
                    of this application. All chats are end-to-end encrypted and
                    no-one other than the sender and the receiver can read your
                    private chats. The entire source code for this project is
                    uploaded on Github. We do not take responsibility for any
                    means of uncivilized behavior from strangers on this
                    platform.
                </div>
            </div>
            <div className="flex flex-col w-full gap-4 py-5">
                <div className="flex flex-row w-full gap-2 justify-center">
                    <RetroButton
                        text="Change Password"
                        icon={null}
                        onClick={() => {}}
                        isActive={false}
                        msgNo={0}
                        extraClass="h-full w-fit text-nowrap"
                    />
                    <RetroButton
                        text="Change Visibility"
                        icon={null}
                        onClick={() => {}}
                        isActive={false}
                        msgNo={0}
                        extraClass="h-full w-fit text-nowrap"
                    />
                </div>
                <div className="flex flex-row w-full gap-2 justify-center">
                    <RetroButton
                        text={isLoggingOut ? "Logging out..." : "Logout"}
                        icon="/icons/logout.svg"
                        onClick={handleLogout}
                        isActive={false}
                        msgNo={0}
                        extraClass={`h-full w-fit text-nowrap bg-retro_orange ${
                            isLoggingOut ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                    />
                    <RetroButton
                        text={isDeleting ? "Deleting..." : "Delete Account"}
                        icon="/icons/delete.svg"
                        onClick={handleDelete}
                        isActive={true}
                        msgNo={0}
                        extraClass={`h-full w-fit text-nowrap bg-retro_red ${
                            isDeleting ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                    />
                </div>
            </div>
            <Link
                href="/profile"
                className={`absolute top-0 left-0 w-fit flex flex-row gap-1 items-center p-3 ${
                    currentPath === "/settings" ? "" : "hidden"
                }`}
            >
                <img
                    src="/icons/back.svg"
                    alt="back"
                    className="object-contain h-8"
                    width={10}
                />
                Back
            </Link>
        </div>
    );
}
