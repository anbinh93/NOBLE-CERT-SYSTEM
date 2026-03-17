import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PUT(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // const { id } = await params; // reserved for future use
  // Hiện tại chưa lưu notification thực sự, nên chỉ trả về thành công.
  return NextResponse.json({ status: "success" }, { status: 200 });
}

