"use client";

import { useState } from "react";
import { PlayCircle } from "lucide-react";
import Image from "next/image";

export default function TestimonialVideo() {
    const [isPlaying, setIsPlaying] = useState(false);

    // Video ID: DIFCMtzg7xg
    const videoId = "DIFCMtzg7xg"; 
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    if (isPlaying) {
        return (
            <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-primary/10 w-full h-full bg-black animate-in fade-in duration-500">
                <iframe 
                    width="100%" 
                    height="100%" 
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`} 
                    title="Testimonial Video" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                ></iframe>
            </div>
        );
    }

    return (
        <div 
            className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-primary/10 group cursor-pointer transform hover:scale-[1.02] transition-all duration-500 w-full h-full"
            onClick={() => setIsPlaying(true)}
        >
             {/* Thumbnail */}
             <img 
                  src={thumbnailUrl} 
                  alt="Student Success Story" 
                  className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
             />
             <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
             
             {/* Play Button Overlay */}
             <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-primary/90 rounded-full flex items-center justify-center text-primary-foreground shadow-[0_0_30px_rgba(212,175,55,0.4)] group-hover:scale-110 transition-transform backdrop-blur-sm">
                      <PlayCircle className="w-10 h-10 fill-current" />
                  </div>
             </div>
        </div>
    );
}
