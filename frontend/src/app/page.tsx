"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    // Redirect to /app if user is already logged in
    useEffect(() => {
        if (user && !isLoading) {
            router.push("/app");
        }
    }, [user, isLoading, router]);

    const handleJoinNow = () => {
        const backendUrl =
            process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
        window.location.href = `${backendUrl}/login`;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }
    return (
        <div className="flex flex-col min-h-screen w-full bg-background font-poppins text-secondary">
            {/* Hero Section */}
            <div className="flex flex-col items-center justify-center px-4 py-12 lg:py-16">
                <div className="text-center">
                    <h1 className="font-bungee text-4xl md:text-5xl lg:text-6xl mb-3 tracking-wider">
                        UNISPHERE
                    </h1>
                    <p className="text-lg md:text-xl lg:text-2xl font-medium">
                        Connect. Belong. Find Your People.
                    </p>
                </div>
            </div>

            <div className="flex-grow flex flex-col items-center px-2 py-6 lg:pt-[10%] pb-8">
                {/* Main Content Section - 3 Column Layout */}
                <div className="relative flex items-start justify-center w-full max-w-[1450px] gap-2 lg:gap-6">
                    {/* Left Side Image */}
                    <div className="hidden lg:flex items-start justify-center w-[260px] xl:w-[500px] flex-shrink-0 pt-16">
                        {/* OUTER CARD */}
                        <div
                            className="
      bg-[#F7EFE4]
      rounded-[26px]
      p-0
      relative
    "
                            style={{
                                boxShadow: `
                                   0px 0px 21px 22px rgba(255,255,255,0.82)
                                `,
                            }}
                        >
                            {/* INNER WHITE FRAME */}
                            <div className="bg-white rounded-[20px] overflow-hidden relative">
                                <Image
                                    src="/cover 1.png"
                                    alt="User cards"
                                    width={600}
                                    height={900}
                                    priority
                                    className="object-contain"
                                />
                                {/* Gradient overlay on right edge */}
                                <div
                                    className="absolute top-0 right-0 h-full w-64 pointer-events-none"
                                    style={{
                                        background:
                                            "linear-gradient(240deg, rgba(247, 239, 228, 0.9) 0%, rgba(247, 239, 228, 0.6) 38%, transparent 80%)",
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Center - Main Illustration with people */}
                    <div className="flex flex-col items-center justify-center flex-grow max-w-3xl">
                        <div className="relative w-full h-[350px] md:h-[380px] lg:h-[300px] flex items-center justify-center mb-6 overflow-visible">
                            <Image
                                src="/cover main.png"
                                alt="Find your tribe community"
                                width={700}
                                height={500}
                                className="object-cover w-full h-full overflow-visible -translate-y-12 md:-translate-y-16 lg:-translate-y-24 scale-125 md:scale-125 lg:scale-130 z-10"
                                priority
                            />
                        </div>

                        {/* CTA Buttons */}
                        <div className="absolute left-1/2 top-[68%] md:top-[66%] lg:top-[70%] -translate-x-1/2 z-30 px-6 md:px-10 py-4 w-full max-w-md md:max-w-lg mb-4">
                            <button
                                onClick={handleJoinNow}
                                className="group relative w-full py-3 px-8 rounded-xl cursor-pointer tracking-wide text-xl font-poppins font-bold shadow-2 bg-primary text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all border-none overflow-hidden"
                            >
                                <span className="block transition-all duration-200 ease-out group-hover:opacity-0 group-hover:-translate-y-2">
                                    Join Now
                                </span>
                                <span className="absolute inset-0 flex items-center justify-center opacity-0 translate-y-2 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:translate-y-0">
                                    Sign in with Google
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Right Side Image */}
                    <div className="hidden lg:flex items-start justify-center w-[260px] xl:w-[500px] flex-shrink-0 pt-16">
                        {/* OUTER CARD */}
                        <div
                            className="
      bg-[#F7EFE4]
      rounded-[26px]
      p-0
      relative
    "
                            style={{
                                boxShadow: `
                                    0px 0px 21px 22px rgba(255,255,255,0.82);
                                `,
                            }}
                        >
                            {/* INNER WHITE FRAME */}
                            <div className="bg-white rounded-[20px] overflow-hidden relative">
                                <Image
                                    src="/cover 2.png"
                                    alt="User cards"
                                    width={600}
                                    height={900}
                                    priority
                                    className="object-contain"
                                />
                                {/* Gradient overlay on left edge */}
                                <div
                                    className="absolute top-0 left-0 h-full w-64 pointer-events-none"
                                    style={{
                                        background:
                                            "linear-gradient(120deg, rgba(247, 239, 228, 0.9) 0%, rgba(247, 239, 228, 0.6) 38%, transparent 80%)",
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <section className="w-full max-w-[1400px] mt-24 pt-16">
                    <h2 className="text-center font-bungee text-2xl md:text-3xl tracking-wider mb-6">
                        FEATURES
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-3xl shadow-3 bg-background p-6 flex flex-col gap-3">
                            <h3 className="font-poppins font-bold text-xl">
                                Find Matches
                            </h3>
                            <p className="text-sm text-secondary/80">
                                Discover people with shared interests.
                            </p>
                            <button
                                onClick={handleJoinNow}
                                className="mt-2 py-2 px-4 rounded-xl cursor-pointer tracking-wide text-sm font-poppins font-semibold shadow-button bg-background text-secondary hover:bg-secondary hover:text-white transition-all"
                            >
                                Open
                            </button>
                        </div>

                        <div className="rounded-3xl shadow-3 bg-background p-6 flex flex-col gap-3">
                            <h3 className="font-poppins font-bold text-xl">
                                Chat
                            </h3>
                            <p className="text-sm text-secondary/80">
                                Start conversations and build your tribe.
                            </p>
                            <button
                                onClick={handleJoinNow}
                                className="mt-2 py-2 px-4 rounded-xl cursor-pointer tracking-wide text-sm font-poppins font-semibold shadow-button bg-background text-secondary hover:bg-secondary hover:text-white transition-all w-fit"
                            >
                                Open
                            </button>
                        </div>

                        <div className="rounded-3xl shadow-3 bg-background p-6 flex flex-col gap-3">
                            <h3 className="font-poppins font-bold text-xl">
                                Quiz
                            </h3>
                            <p className="text-sm text-secondary/80">
                                Answer questions to improve your matches.
                            </p>
                            <button
                                onClick={handleJoinNow}
                                className="mt-2 py-2 px-4 rounded-xl cursor-pointer tracking-wide text-sm font-poppins font-semibold shadow-button bg-background text-secondary hover:bg-secondary hover:text-white transition-all w-fit"
                            >
                                Open
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {/* Footer */}
            <footer className="w-full bg-secondary text-white py-6 mt-4 ">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        {/* Left - Branding */}
                        <div className="text-center md:text-left">
                            <h3 className="font-bungee text-xl mb-1">
                                UNISPHERE
                            </h3>
                            <p className="text-sm text-gray-300">
                                Exclusively for NIT Calicut Students
                            </p>
                        </div>

                        {/* Center - Info */}
                        <div className="text-center text-sm text-gray-300">
                            <p className="mb-1">
                                Connect with your campus community
                            </p>
                            <p className="flex items-center justify-center gap-2">
                                <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                NIT Calicut, Kerala
                            </p>
                        </div>

                        {/* Right - Links */}
                        <div className="flex gap-6 text-sm">
                            <a
                                href="/about"
                                className="hover:text-primary transition-colors"
                            >
                                About
                            </a>
                            <a
                                href="#"
                                className="hover:text-primary transition-colors"
                            >
                                Contact
                            </a>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="mt-10 pt-4 border-t border-gray-600 text-center text-xs text-gray-400">
                        <p>
                            © 2025 UniSphere - NIT Calicut Student Network. All
                            rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
