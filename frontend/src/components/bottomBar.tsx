"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import RetroButton from "./retroButton";

export default function BottomBar() {
    const pathname = usePathname();
    const navLinks = [
        { name: "Find", href: "/find" },
        { name: "Private Rooms", href: "/app" },
        { name: "Profile", href: "/profile" },
    ];

    // Hide bottom bar on landing page
    if (pathname === "/") {
        return null;
    }

    return (
        <div className="flex gap-2 fixed md:hidden bottom-0 w-full bg-background py-4 border-t border-secondary rounded-t-lg">
            <div className="flex grow lg:grow-0 flex-row w-full justify-around">
                {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link key={link.name} href={link.href}>
                            <RetroButton
                                text={link.name}
                                icon={null}
                                onClick={() => {}}
                                isActive={isActive}
                                msgNo={0}
                                extraClass={`${
                                    isActive
                                        ? "bg-primary text-white"
                                        : "text-secondary"
                                }`}
                            />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
