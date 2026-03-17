import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    
    // Get query params (like email)
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    
    // Backend Learning Route is mounted at /api in index.js
    // And learning.route.js has /courses/:courseId/status
    const backendUrl = `${apiUrl}/api/courses/${courseId}/status?email=${encodeURIComponent(email || "")}`;

    // console.log(`Proxying to: ${backendUrl}`);

    const res = await fetch(backendUrl, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
        return NextResponse.json(
            { message: "Failed to fetch status from backend" },
            { status: res.status }
        );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
