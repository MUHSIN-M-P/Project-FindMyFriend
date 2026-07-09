"use client";

import {
    useState,
    useEffect,
    createContext,
    useContext,
    type ReactNode,
} from "react";
import { apiGet, BACKEND_URL } from "@/utils/api";

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
            const response = await apiGet("/api/auth/me");

            if (response.status === 200 && response.data) {
                setUser(response.data);
            } else {
                setUser(null);
            }
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
            await fetch(`${BACKEND_URL}/logout`, { credentials: "include" });
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
