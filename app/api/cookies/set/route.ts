import { NextRequest, NextResponse } from "next/server";
import { serialize } from "cookie";

export async function POST(req: NextRequest) {
    try {
        const { auth_token,user_email,user_id,organization_id } = await req.json();

        if (!user_id || !auth_token || !user_email || !organization_id) {
            return NextResponse.json({ message: "user_id,user_email,auth_token, and organization_id are required" }, { status: 400 });
        }

        const response = NextResponse.json({ message: "Cookies set successfully" });

        // 🔹 Set HTTP-only secure cookies
        response.headers.set(
            "Set-Cookie",
            serialize("user_id", user_id, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 60 * 60 * 24 * 1,
                path: "/",
                sameSite: "strict",
            })
        );
        response.headers.append(
            "Set-Cookie",
            serialize("auth_token", auth_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 60 * 60 * 24 * 1,
                path: "/",
                sameSite: "strict",
            })
        );

        response.headers.append(
            "Set-Cookie",
            serialize("user_email", user_email, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 60 * 60 * 24 * 1,
                path: "/",
                sameSite: "strict",
            })
        );

        response.headers.append(
            "Set-Cookie",
            serialize("organization_id", organization_id, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 60 * 60 * 24 * 1,
                path: "/",
                sameSite: "strict",
            })
        );

        return response;
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// Handle other HTTP methods
export function GET() {
    return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}