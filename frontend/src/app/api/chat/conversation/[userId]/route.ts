import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        const authorizationHeader = request.headers.get("authorization");
        const cookieToken = request.cookies.get("auth_token")?.value;
        const authorization =
            authorizationHeader ||
            (cookieToken ? `Bearer ${cookieToken}` : null);

        if (!authorization) {
            return NextResponse.json(
                { error: "Authorization header required" },
                { status: 401 }
            );
        }

        const response = await fetch(
            `${BACKEND_URL}/api/chat/conversation/${userId}`,
            {
                method: "GET",
                headers: {
                    Authorization: authorization,
                    "Content-Type": "application/json",
                },
                cache: "no-store",
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(errorData, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data, {
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
