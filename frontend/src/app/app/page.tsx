"use client";

import { useState, useEffect, Suspense, startTransition } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
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
const PrivateRoomsView = dynamic(() => import("@/views/PrivateRoomsView"), {
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

type View =
    | "find"
    | "chat"
    | "privateRooms"
    | "quiz"
    | "profile"
    | "activity"
    | "settings";

export default function AppPage() {
    const { user, isLoading, refreshUser } = useAuth();
    const router = useRouter();
    const [currentView, setCurrentView] = useState<View>("find");
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

    // Keep the WebSocket warm in the background so view switches don't hitch.
    const { connect: connectWebSocket } = useWebSocket({ autoConnect: false });

    const handleViewChange = (view: View) => {
        startTransition(() => {
            setCurrentView(view);
        });
    };

    // Prefetch adjacent views in background
    useEffect(() => {
        if (currentView === "find") {
            // Preload chat view when on find page
            import("@/views/ChatView");

            // Also warm up the websocket connection off the critical path
            const timeout = window.setTimeout(() => {
                void connectWebSocket();
            }, 200);
            return () => window.clearTimeout(timeout);
        } else if (currentView === "chat") {
            // Preload profile when in chat
            import("@/views/ProfileView");
        }
    }, [currentView, connectWebSocket]);

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace("/");
        }
    }, [isLoading, user, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) return null;

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
            case "privateRooms":
                return <PrivateRoomsView />;
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
                onViewChange={handleViewChange}
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
