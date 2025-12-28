import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export async function PUT(request: NextRequest) {
    try {
        const authorizationHeader = request.headers.get("authorization");
        const cookieToken = request.cookies.get("auth_token")?.value;
        const authorization =
            authorizationHeader ||
            (cookieToken ? `Bearer ${cookieToken}` : null);

        if (!authorization) {
            return NextResponse.json(
                { error: "Missing authentication token" },
                { status: 401 }
            );
        }

        const bodyText = await request.text();

        const response = await fetch(`${BACKEND_URL}/api/auth/profile`, {
            method: "PUT",
            headers: {
                Authorization: authorization,
                "Content-Type": "application/json",
            },
            body: bodyText,
        });

        const contentType = response.headers.get("content-type") || "";
        const payload = contentType.includes("application/json")
            ? await response.json()
            : await response.text();

        if (!response.ok) {
            return NextResponse.json(
                typeof payload === "string" ? { error: payload } : payload,
                { status: response.status }
            );
        }

        return NextResponse.json(payload, { status: response.status });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
