import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Bungee, Poppins } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/components/NavBarWrapper";
import BottomBar from "@/components/bottomBar";
import { AuthProvider } from "@/hooks/useAuth";
const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const bungee = Bungee({
    subsets: ["latin"],
    weight: "400",
    variable: "--font-bungee",
});

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["100", "200", "300", "400", "500", "600", "700"],
    variable: "--font-poppins",
});

export const metadata: Metadata = {
    title: "UniSphere",
    description:
        "Connect with your campus community. Find your tribe at NIT Calicut.",
    keywords: "NIT Calicut, student network, campus friends, college community",
    authors: [{ name: "UniSphere Team" }],
    icons: {
        icon: "/favicon.ico",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} ${bungee.variable} ${poppins.variable} antialiased bg-background hide-scrollbar flex flex-col min-h-screen`}
            >
                <AuthProvider>
                    <Suspense fallback={<div>Loading navigation...</div>}>
                        <NavbarWrapper />
                    </Suspense>
                    <main className="flex justify-center flex-grow relative">
                        {children}
                    </main>
                    <BottomBar />
                </AuthProvider>
            </body>
        </html>
    );
}
