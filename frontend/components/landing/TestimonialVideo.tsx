"use client";

import { useState } from "react";

export default function TestimonialVideo() {
  const [muted, setMuted] = useState(true);

  const videoId = "Jw7s42Op2ao";
  const baseUrl = `https://www.youtube.com/embed/${videoId}`;
  const params = new URLSearchParams({
    autoplay: "1",
    loop: "1",
    playlist: videoId,
    controls: "0",
    modestbranding: "1",
    rel: "0",
    playsinline: "1",
    mute: muted ? "1" : "0",
  });

  const src = `${baseUrl}?${params.toString()}`;

  return (
    <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-primary/10 w-full h-full bg-muted">
      {/* Video iframe: không cho tương tác ngoài mute */}
      <div className="absolute inset-0 pointer-events-none">
        <iframe
          src={src}
          title="Noble Cert Testimonial"
          className="w-full h-full"
          allow="autoplay; encrypted-media"
        />
      </div>

      {/* Overlay gradient nhẹ */}
      <div className="absolute inset-0 bg-gradient-to-tr from-background/20 via-transparent to-transparent pointer-events-none" />

      {/* Điều khiển mute duy nhất */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3 z-10 pointer-events-auto">
        <button
          type="button"
          onClick={() => setMuted((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 text-xs font-medium text-foreground border border-primary/40 shadow-sm hover:bg-background transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-primary" />
          {muted ? "Bật tiếng" : "Tắt tiếng"}
        </button>

        <span className="text-[11px] text-muted-foreground bg-background/60 rounded-full px-3 py-1 border border-border/60">
          Video giới thiệu học viên (YouTube)
        </span>
      </div>
    </div>
  );
}

