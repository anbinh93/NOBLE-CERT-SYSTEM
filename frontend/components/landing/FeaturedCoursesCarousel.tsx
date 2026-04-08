"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, PlayCircle } from "lucide-react";

interface Course {
  _id: string;
  name: string;
  slug: string;
  thumbnail: string;
  category: string;
  description: string;
  price: string | number;
  author: string;
}

export default function FeaturedCoursesCarousel({ courses }: { courses: Course[] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // buffer
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [courses]);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
        const { clientWidth } = scrollContainerRef.current;
        const scrollAmount = clientWidth * 0.8; // Scroll 80% of view
        scrollContainerRef.current.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
        // checkScroll will be called by onScroll event
    }
  };


  return (
    <div className="relative group/carousel">
        {/* Navigation Buttons */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 z-10 -ml-4 md:-ml-8 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300">
             <Button 
                variant="ghost" 
                size="icon"
                disabled={!canScrollLeft}
                onClick={() => scroll("left")}
                className={`h-12 w-12 rounded-full border border-border bg-card/80 backdrop-blur-sm shadow-lg text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-0 transition-all ${!canScrollLeft ? 'hidden' : ''}`}
             >
                 <ArrowLeft className="w-5 h-5" />
             </Button>
        </div>

        <div className="absolute top-1/2 -translate-y-1/2 right-0 z-10 -mr-4 md:-mr-8 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300">
             <Button 
                variant="ghost" 
                size="icon"
                disabled={!canScrollRight}
                onClick={() => scroll("right")}
                className={`h-12 w-12 rounded-full border border-border bg-card/80 backdrop-blur-sm shadow-lg text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-0 transition-all ${!canScrollRight ? 'hidden' : ''}`}
             >
                 <ArrowRight className="w-5 h-5" />
             </Button>
        </div>

        {/* Scroll Container */}
        <div 
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex gap-6 overflow-x-auto pb-8 -mx-4 px-4 scroll-smooth no-scrollbar snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
            {courses.map((course) => (
                <div key={course._id} className="min-w-[85%] sm:min-w-[45%] lg:min-w-[30%] snap-center">
                     <Link href={`/courses/${course.slug}`}>
                        <div className="group bg-card rounded-3xl overflow-hidden border border-primary/10 shadow-sm hover:shadow-[0_10px_40px_-10px_rgba(47,72,109,0.2)] hover:border-primary/50 hover:-translate-y-2 transition-all duration-500 h-full flex flex-col">
                            <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                                {course.thumbnail ? (
                                    <Image 
                                      src={course.thumbnail} 
                                      alt={course.name} 
                                      width={600}
                                      height={400}
                                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" 
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                                        <PlayCircle className="h-16 w-16 text-muted-foreground/30 group-hover:text-primary transition-colors duration-300" />
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-foreground shadow-sm border border-primary/20">
                                    {course.category || "Tổng quát"}
                                </div>
                            </div>
                            
                            <div className="p-6 flex flex-col flex-1">
                                <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors" title={course.name}>
                                    {course.name}
                                </h3>
                                <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">
                                    {course.description || "Tìm hiểu các nguyên tắc cơ bản và khái niệm nâng cao trong khóa học toàn diện này."}
                                </p>
                                
                                <div className="flex items-center justify-between pt-4 border-t border-primary/10 mt-auto">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase border border-primary/20">
                                            {course.author ? course.author[0] : "N"}
                                        </div>
                                        <span className="text-sm font-medium text-foreground truncate max-w-[100px]">{course.author || "Noble Language Academy"}</span>
                                    </div>
                                    <div className="text-lg font-bold text-primary">
                                            {/* Assuming price is string "$49" or number */}
                                            {typeof course.price === 'number' 
                                              ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price) 
                                              : course.price}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            ))}
            
            {/* "See More" Card at the end */}
            <div className="min-w-[40%] sm:min-w-[25%] lg:min-w-[20%] snap-center flex items-center justify-center">
                 <Link href="/courses" className="flex flex-col items-center gap-4 group">
                     <div className="w-16 h-16 rounded-full bg-card border-2 border-primary/20 flex items-center justify-center text-muted-foreground group-hover:border-primary group-hover:bg-primary/10 group-hover:text-primary transition-all">
                         <ArrowRight className="w-6 h-6" />
                     </div>
                     <span className="font-semibold text-muted-foreground group-hover:text-primary transition-colors">Xem tất cả</span>
                 </Link>
            </div>
        </div>
    </div>
  );
}
