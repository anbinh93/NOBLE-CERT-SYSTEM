"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface Section3DRevealProps {
  children: ReactNode;
  className?: string;
  threshold?: number;
}

export default function Section3DReveal({
  children,
  className = "",
  threshold = 0.1,
}: Section3DRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("revealed");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
        } else {
          // Remove when out of view → re-animates on next scroll (up or down)
          el.classList.remove("revealed");
        }
      },
      { threshold, rootMargin: "0px 0px -30px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={ref} className={`section-3d-reveal ${className}`}>
      {children}
    </div>
  );
}

