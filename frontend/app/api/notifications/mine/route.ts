import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { message: "Missing email", unreadCount: 0, data: [] },
      { status: 200 },
    );
  }

  // Hiện tại chưa có bảng notifications ở backend,
  // nên tạm thời trả về danh sách rỗng để tránh 404.
  return NextResponse.json(
    {
      status: "success",
      unreadCount: 0,
      data: [],
    },
    { status: 200 },
  );
}

