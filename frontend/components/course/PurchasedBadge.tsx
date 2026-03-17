"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { API_ENDPOINTS } from "@/constants/api-endpoints";

export default function PurchasedBadge({ courseId }: { courseId: string }) {
  const { data: session, status } = useSession();
  const [isEnrolled, setIsEnrolled] = useState(false);

  const accessToken = session?.user?.accessToken;

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;

    fetch(`${API_ENDPOINTS.STUDENT.CHECK_ENROLLMENT}?courseId=${courseId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((json) => {
        // Backend trả { status: 'success', data: { isEnrolled: bool } }
        if (json?.data?.isEnrolled) setIsEnrolled(true);
      })
      .catch(console.error);
  }, [status, accessToken, courseId]);

  if (!isEnrolled) return null;

  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full font-bold text-sm mb-6 border border-green-200 shadow-sm animate-in fade-in slide-in-from-bottom-2">
      <CheckCircle2 className="w-5 h-5" />
      You own this course
    </div>
  );
}
