"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

type View = "find" | "chat" | "quiz" | "profile" | "activity" | "settings";

interface NavbarWrapperProps {
    currentView?: View;
    onViewChange?: (view: View) => void;
}

export default function NavbarWrapper({
    currentView,
    onViewChange,
}: NavbarWrapperProps) {
    const pathname = usePathname();

    // Hide navbar on landing page and about page
    if (pathname === "/" || pathname === "/about") {
        return null;
    }

    // If we're in the app page with view state, use that
    if (currentView && onViewChange) {
        return <Navbar currentView={currentView} onViewChange={onViewChange} />;
    }

    // Otherwise, this might be a standalone route (fallback)
    return null;
}
