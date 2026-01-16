"use client";

import {
    useState,
    useEffect,
    createContext,
    useContext,
    type ReactNode,
} from "react";

interface User {
    id: number;
    username: string;
    email: string;
    name?: string;
    profile_pic?: string;
    age?: number;
    sex?: string;
    hobbies?: string[];
    bio?: string;
    last_seen?: string;
    social_links?: Array<{
        name: string;
        link: string;
    }>;
}

interface AuthContextType {
    user: User | null;
    logout: () => Promise<void>;
    isLoading: boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const backendUrl =
                process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
            const response = await fetch(`${backendUrl}/api/auth/me`, {
                credentials: "include",
            });

            setUser(response.ok ? await response.json() : null);
        } catch (error) {
            console.error("Error fetching the User: ", error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const logout = async () => {
        try {
            const backendUrl =
                process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
            await fetch(`${backendUrl}/logout`, { credentials: "include" });
        } catch (error) {
            console.error("Logout error: ", error);
        } finally {
            setUser(null);
            window.location.href = "/";
        }
    };

    const refreshUser = async () => {
        await fetchUser();
    };

    const value: AuthContextType = { user, logout, isLoading, refreshUser };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined)
        throw new Error("useAuth must be used within AuthProvider");
    return context;
};
