"use client";
import RetroButton from "./retroButton";

type View =
    | "find"
    | "chat"
    | "privateRooms"
    | "profile"
    | "activity"
    | "settings";

interface NavbarProps {
    currentView: View;
    onViewChange: (view: View) => void;
}

const Navbar = ({ currentView, onViewChange }: NavbarProps) => {
    const navLinks = [
        { name: "Find", view: "find" as View },
        { name: "Profile", view: "profile" as View },
        { name: "Private Rooms", view: "privateRooms" as View },
    ];
    const res = { data: { msgNo: 5, notifNo: 1 } }; // await axios.get("___")
    const msgNo = res.data.msgNo;
    const notifNo = res.data.notifNo;

    // Determine title based on current path
    const getNavTitle = () => {
        switch (currentView) {
            case "find":
                return "Find Your Tribe";
            case "privateRooms":
                return "Private Rooms";
            case "profile":
                return "Your Profile";
            case "chat":
                return "Your Messages";
            case "activity":
                return "Your Activity";
            case "settings":
                return "Your Settings";
            default:
                return "UniSphere";
        }
    };

    return (
        <div className="flex">
            <div className="h-[27px]"></div>
            <nav className="min-h-[10vh] bg-background md:py-8 flex items-center justify-between w-9/10 mx-auto">
                <div
                    onClick={() => onViewChange("find")}
                    className="main_title font-bungee text-2xl md:text-4xl text-secondary cursor-pointer"
                >
                    {getNavTitle()}
                </div>
                <div className="navButtons hidden lg:flex px-[21px] grow lg:grow-0 flex-row">
                    {navLinks.map((link) => {
                        const isActive = currentView === link.view;
                        return (
                            <div
                                key={link.name}
                                onClick={() => onViewChange(link.view)}
                            >
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
                            </div>
                        );
                    })}
                    <div onClick={() => onViewChange("chat")}>
                        <RetroButton
                            text="Messages"
                            icon={null}
                            onClick={() => {}}
                            isActive={currentView === "chat"}
                            msgNo={msgNo}
                            extraClass=""
                        />
                    </div>
                </div>
                <div className="block lg:hidden relative">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => onViewChange("activity")}
                            className={`relative ${
                                currentView === "profile" ||
                                currentView === "settings"
                                    ? "hidden"
                                    : ""
                            }`}
                        >
                            <img
                                src={
                                    currentView === "activity"
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
                        </button>
                        <button
                            onClick={() => onViewChange("chat")}
                            className={`relative ${
                                currentView === "profile" ||
                                currentView === "settings"
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
                        </button>
                        <button
                            onClick={() => onViewChange("settings")}
                            className={`relative ${
                                currentView === "profile" ? "" : "hidden"
                            }`}
                        >
                            <img
                                src="/icons/settings.svg"
                                alt="settings"
                                className="object-contain h-8"
                                width={30}
                            />
                        </button>
                    </div>
                </div>
            </nav>
        </div>
    );
};

export default Navbar;
