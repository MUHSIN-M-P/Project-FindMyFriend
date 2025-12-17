"use client";
import Link from "next/link";
import RetroButton from "./retroButton";
interface NavbarProps {
    currentPath: string;
}

const Navbar = ({ currentPath }: NavbarProps) => {
    const navLinks = [
        { name: "Find", href: "/find" },
        { name: "Questions", href: "/quiz" },
        { name: "Profile", href: "/profile" },
    ];
    const res = { data: { msgNo: 5, notifNo: 1 } }; // await axios.get("___")
    const msgNo = res.data.msgNo;
    const notifNo = res.data.notifNo;

    // Determine title based on current path
    const getNavTitle = () => {
        if (currentPath === "/") return "UniSphere";
        if (currentPath === "/find") return "Find Your Tribe";
        if (currentPath === "/quiz") return "Answer Questions";
        if (currentPath === "/profile" || currentPath.startsWith("/profile/"))
            return "Your Profile";
        if (currentPath === "/chat") return "Your Messages";
        if (currentPath === "/activity") return "Your Activity";
        if (currentPath === "/settings") return "Your Settings";
        return "UniSphere";
    };

    return (
        <div className="flex">
            <div className="h-[27px]"></div>
            <nav className="min-h-[10vh] bg-background md:py-8 flex items-center justify-around w-full ">
                <Link href="/">
                    <div className="main_title font-bungee text-2xl md:text-4xl text-secondary cursor-pointer">
                        {getNavTitle()}
                    </div>
                </Link>
                <div className="navButtons hidden lg:flex px-[21px] grow lg:grow-0 flex-row">
                    {navLinks.map((link) => {
                        const isActive = currentPath === link.href;
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
                    <Link href="/chat">
                        <RetroButton
                            text="Messages"
                            icon={null}
                            onClick={() => {}}
                            isActive={true}
                            msgNo={msgNo}
                            extraClass=""
                        />
                    </Link>
                </div>
                <div className="block lg:hidden relative">
                    <div className="flex items-center gap-5">
                        <Link
                            href="/activity"
                            className={`relative ${
                                currentPath === "/profile" ||
                                currentPath === "/settings"
                                    ? "hidden"
                                    : ""
                            }`}
                        >
                            <img
                                src={
                                    currentPath === "/activity"
                                        ? `/icons/heart_outline.svg`
                                        : `/icons/heart_outline_active.svg`
                                }
                                alt="heart h-8"
                                width={30}
                            />
                            <div
                                className={`${
                                    notifNo == 0 ? "hidden" : ""
                                } redDot bg-primary p-1 h-6 w-6 border border-retro_border rounded-full absolute top-0 right-0 translate-x-3 -translate-y-3 flex justify-center items-center text-white text-sm`}
                            >
                                {notifNo}
                            </div>
                        </Link>
                        <Link
                            href="/chat"
                            className={`relative ${
                                currentPath === "/profile" ||
                                currentPath === "/settings"
                                    ? "hidden"
                                    : ""
                            }`}
                        >
                            <img
                                src="/icons/msg_icon.svg"
                                alt="paper_plane"
                                className="object-contain h-8"
                                width={30}
                            />
                            <div
                                className={`${
                                    msgNo == 0 ? "hidden" : ""
                                } redDot bg-primary p-1 h-6 w-6 border border-retro_border rounded-full absolute top-0 right-0 translate-x-2 -translate-y-3 flex justify-center items-center text-white text-sm`}
                            >
                                {msgNo}
                            </div>
                        </Link>
                        <Link
                            href="/settings"
                            className={`relative ${
                                currentPath === "/profile" ? "" : "hidden"
                            }`}
                        >
                            <img
                                src="/icons/settings.svg"
                                alt="settings"
                                className="object-contain h-8"
                                width={30}
                            />
                        </Link>
                    </div>
                </div>
            </nav>
            {/* <div className="bg-secondary h-[3px] w-full"></div> */}
        </div>
    );
};

export default Navbar;
