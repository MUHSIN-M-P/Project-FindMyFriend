"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import dynamic from "next/dynamic";
import NavbarWrapper from "@/components/NavBarWrapper";
import BottomBar from "@/components/bottomBar";
import OnboardingModal from "@/components/OnboardingModal";
import type { FindViewProps } from "@/views/FindView";

// Lazy load views for better performance
const FindView = dynamic<FindViewProps>(() => import("@/views/FindView"), {
    loading: () => (
        <div className="flex items-center justify-center h-screen">
            Loading...
        </div>
    ),
});
const ChatView = dynamic(() => import("@/views/ChatView"), {
    loading: () => (
        <div className="flex items-center justify-center h-screen">
            Loading...
        </div>
    ),
});
const QuizView = dynamic(() => import("@/views/QuizView"), {
    loading: () => (
        <div className="flex items-center justify-center h-screen">
            Loading...
        </div>
    ),
});
const ProfileView = dynamic(() => import("@/views/ProfileView"), {
    loading: () => (
        <div className="flex items-center justify-center h-screen">
            Loading...
        </div>
    ),
});
const ActivityView = dynamic(() => import("@/views/ActivityView"), {
    loading: () => (
        <div className="flex items-center justify-center h-screen">
            Loading...
        </div>
    ),
});
const SettingsView = dynamic(() => import("@/views/SettingsView"), {
    loading: () => (
        <div className="flex items-center justify-center h-screen">
            Loading...
        </div>
    ),
});

type View = "find" | "chat" | "quiz" | "profile" | "activity" | "settings";

export default function AppPage() {
    const { user, isLoading, refreshUser } = useAuth();
    const [currentView, setCurrentView] = useState<View>("find");
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

    // Prefetch adjacent views in background
    useEffect(() => {
        if (currentView === "find") {
            // Preload chat view when on find page
            import("@/views/ChatView");
        } else if (currentView === "chat") {
            // Preload profile when in chat
            import("@/views/ProfileView");
        }
    }, [currentView]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        window.location.href = "/";
        return null;
    }

    const needsOnboarding =
        user.age === null ||
        user.age === undefined ||
        !user.sex ||
        !user.bio ||
        !user.hobbies ||
        user.hobbies.length === 0;

    // Render current view
    const renderView = () => {
        switch (currentView) {
            case "find":
                return (
                    <FindView
                        onUserClick={(userId: number) => {
                            setSelectedUserId(userId);
                            setCurrentView("profile");
                        }}
                    />
                );
            case "chat":
                return <ChatView />;
            case "quiz":
                return <QuizView />;
            case "profile":
                return <ProfileView userId={selectedUserId || user.id} />;
            case "activity":
                return <ActivityView />;
            case "settings":
                return <SettingsView />;
            default:
                return (
                    <FindView
                        onUserClick={(userId: number) => {
                            setSelectedUserId(userId);
                            setCurrentView("profile");
                        }}
                    />
                );
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background w-full">
            <NavbarWrapper
                currentView={currentView}
                onViewChange={setCurrentView}
            />
            <main className="flex-grow pb-20 md:pb-0 flex justify-center">
                <Suspense fallback={<div>Loading...</div>}>
                    {renderView()}
                </Suspense>
            </main>
            <BottomBar />

            {needsOnboarding ? (
                <OnboardingModal
                    initialAge={user.age}
                    initialSex={user.sex}
                    initialBio={user.bio}
                    initialHobbies={user.hobbies}
                    onCompleted={refreshUser}
                />
            ) : null}
        </div>
    );
}
