"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar"; // Your actual Navbar component (can be server component)

export default function NavbarWrapper() {
    const pathname = usePathname();

    // Hide navbar on landing page
    if (pathname === "/") {
        return null;
    }

    return <Navbar currentPath={pathname} />;
}
