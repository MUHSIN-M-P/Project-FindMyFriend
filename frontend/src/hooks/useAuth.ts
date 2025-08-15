import { useState, useEffect, createContext, useContext } from "react";

interface User {
    id: number;
    username: string;
    email: string;
    name?: string;
    pfp_url?: string;
    age?: number;
    sex?: string;
    hobbies?: string;
    bio?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, userData: User) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load auth state from localStorage on mount
    useEffect(() => {
        try {
            const storedToken = localStorage.getItem("auth_token");
            const storedUser = localStorage.getItem("auth_user");

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Error loading auth state:", error);
            // Clear invalid data
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const login = (newToken: string, userData: User) => {
        setToken(newToken);
        setUser(userData);

        try {
            localStorage.setItem("auth_token", newToken);
            localStorage.setItem("auth_user", JSON.stringify(userData));
        } catch (error) {
            console.error("Error saving auth state:", error);
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);

        try {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
        } catch (error) {
            console.error("Error clearing auth state:", error);
        }
    };

    // Validate token periodically (optional)
    useEffect(() => {
        if (token && user) {
            const validateToken = async () => {
                try {
                    const response = await fetch("/api/auth/validate", {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    });

                    if (!response.ok) {
                        // Token is invalid, logout
                        logout();
                    }
                } catch (error) {
                    console.error("Token validation error:", error);
                    // Don't logout on network errors, only on auth errors
                }
            };

            // Validate token every 30 minutes
            const interval = setInterval(validateToken, 30 * 60 * 1000);

            return () => clearInterval(interval);
        }
    }, [token, user]);

    return {
        user,
        token,
        login,
        logout,
        isLoading,
    };
};
