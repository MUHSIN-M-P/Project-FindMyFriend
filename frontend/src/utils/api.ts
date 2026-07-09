/**
 * Centralized API utility for making requests to Flask backend
 * Backend now handles encryption, offline queuing, and retry logic
 * Frontend becomes thin client - just UI rendering
 */

const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

interface ApiOptions extends RequestInit {
    skipAuth?: boolean;
}

interface ApiResponse<T = any> {
    data?: T;
    error?: string;
    status: number;
}

/**
 * Generic API fetch wrapper with automatic auth handling
 * Simplified - backend handles all heavy lifting
 */
async function apiRequest<T = any>(
    endpoint: string,
    options: ApiOptions = {},
): Promise<ApiResponse<T>> {
    const { skipAuth = false, ...fetchOptions } = options;

    // Default headers
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...((fetchOptions.headers || {}) as Record<string, string>),
    };

    // Add JWT token from localStorage if present
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("auth_token");
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
    }

    // Cookies are automatically sent with credentials: "include"
    const config: RequestInit = {
        ...fetchOptions,
        headers,
        credentials: "include", // Send cookies (auth_token) with every request
    };

    try {
        const url = `${BACKEND_URL}${endpoint}`;
        const response = await fetch(url, config);

        // Parse response
        const contentType = response.headers.get("content-type");
        const isJson = contentType?.includes("application/json");

        let data: any;
        if (isJson) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            return {
                error:
                    typeof data === "string"
                        ? data
                        : data.error ||
                          `Request failed with status ${response.status}`,
                status: response.status,
            };
        }

        return {
            data,
            status: response.status,
        };
    } catch (error) {
        console.error("API Request Error:", error);
        return {
            error: error instanceof Error ? error.message : "Network error",
            status: 0,
        };
    }
}

/**
 * GET request
 */
export async function apiGet<T = any>(
    endpoint: string,
    options?: ApiOptions,
): Promise<ApiResponse<T>> {
    return apiRequest<T>(endpoint, {
        method: "GET",
        ...options,
    });
}

/**
 * POST request
 */
export async function apiPost<T = any>(
    endpoint: string,
    data?: any,
    options?: ApiOptions,
): Promise<ApiResponse<T>> {
    return apiRequest<T>(endpoint, {
        method: "POST",
        body: data ? JSON.stringify(data) : undefined,
        ...options,
    });
}

/**
 * PUT request
 */
export async function apiPut<T = any>(
    endpoint: string,
    data?: any,
    options?: ApiOptions,
): Promise<ApiResponse<T>> {
    return apiRequest<T>(endpoint, {
        method: "PUT",
        body: data ? JSON.stringify(data) : undefined,
        ...options,
    });
}

/**
 * DELETE request
 */
export async function apiDelete<T = any>(
    endpoint: string,
    options?: ApiOptions,
): Promise<ApiResponse<T>> {
    return apiRequest<T>(endpoint, {
        method: "DELETE",
        ...options,
    });
}

/**
 * Export backend URL for WebSocket connections
 */
export { BACKEND_URL };
