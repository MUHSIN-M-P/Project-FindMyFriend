export default function About() {
    return (
       <div className="flex flex-col min-h-screen w-full bg-background font-poppins text-secondary">
            {/* Hero Section */}
            <div className="flex flex-col items-center justify-center px-4 py-12 lg:py-16">
                    <h1 className="text-center font-bungee text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-3 tracking-wider">
                        ABOUT UNISPHERE
                    </h1>
                   
            </div>

            <div className="flex-grow space-y-4 text-base sm:text-lg px-4 sm:px-6 md:px-8 lg:px-12 max-w-7xl mx-auto pb-12">
                <p className="text-center sm:text-left">
                    UniSphere is a campus networking platform designed
                    exclusively for NIT Calicut students to connect,
                    collaborate, and build meaningful friendships.
                </p>
                <p className="text-center sm:text-left">
                    Built by students, for students, UniSphere makes it easy to
                    find people who share your interests, hobbies, and values
                    within the NITC community.
                </p>
                <h2 className="font-bold text-xl sm:text-2xl mt-8 mb-4 text-center sm:text-left">Features</h2>
                <ul className="list-disc list-inside space-y-2 text-left pl-4 sm:pl-0">
                    <li>Personality-based matching algorithm</li>
                    <li>Real-time chat with WebSocket support</li>
                    <li>Secure Google OAuth authentication</li>
                    <li>Profile customization</li>
                    <li>Activity feed and social features</li>
                </ul>
            </div>

            {/* Footer */}
            <footer className="w-full bg-secondary text-white py-6 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        {/* Left - Branding */}
                        <div className="text-center md:text-left">
                            <h3 className="font-bungee text-lg sm:text-xl mb-1">
                                UNISPHERE
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-300">
                                Exclusively for NIT Calicut Students
                            </p>
                        </div>

                        {/* Center - Info */}
                        <div className="text-center text-xs sm:text-sm text-gray-300">
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
                        <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm">
                            <a
                                href="#"
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
                    <div className="mt-6 sm:mt-10 pt-4 border-t border-gray-600 text-center text-xs text-gray-400">
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
