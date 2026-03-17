"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlayCircle, Clock, MoreVertical, Loader2, BookOpen, CheckCircle, Search, X, Tag } from "lucide-react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useDebounce } from "@/hooks/use-debounce";

import { API_ENDPOINTS } from "@/constants/api-endpoints";

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then((json) => (Array.isArray(json) ? json : (json?.data ?? [])));

// Mock tags for demo - ideal would be fetching from API
const AVAILABLE_TAGS = ["React", "Beginner", "Advanced", "Fullstack", "Design", "Business"];

export default function LearningPage() {
  const { data: session, status } = useSession();
  const email = session?.user?.email;
  const [activeTab, setActiveTab] = useState<'in-progress' | 'completed'>('in-progress');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Close suggestions on click outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
              setShowSuggestions(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Suggestions
  const { data: suggestions } = useSWR(
      debouncedSearch.length > 1 ? `/api/student/search-suggestions?q=${debouncedSearch}` : null,
      fetcher
  );

  // Build Query String
  const queryParams = new URLSearchParams();
  if (email) queryParams.append("email", email);
  if (debouncedSearch) queryParams.append("q", debouncedSearch);
  if (selectedTags.length > 0) queryParams.append("tags", selectedTags.join(","));

  const { data: enrollments, error, isLoading } = useSWR(
    email ? `${API_ENDPOINTS.STUDENT.MY_COURSES}?${queryParams.toString()}` : null,
    fetcher
  );

  if (status === "loading") return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (status === "unauthenticated") return <div className="p-20 text-center font-serif text-muted-foreground">Please log in to view your courses.</div>;

  const toggleTag = (tag: string) => {
      setSelectedTags(prev => 
          prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
      );
  };

  const clearSearch = () => {
      setSearchQuery("");
      setShowSuggestions(false);
  };

  // Verify data is array
  const safeEnrollments = Array.isArray(enrollments) ? enrollments : [];
  
  // Filter enrollments based on active tab
  // Note: Backend handles Search/Tags. Frontend handles Tab status (Completed/InProgress)
  const filteredEnrollments = safeEnrollments.filter((enrollment: any) => {
      if (!enrollment.courseId) return false;
      const isCertified = enrollment.isCertified || enrollment.progress === 100;
      return activeTab === 'completed' ? isCertified : !isCertified;
  });

  return (
    <div className="space-y-8 pb-20 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          
          {/* Header & Controls */}
          <div className="flex flex-col gap-6 mb-8">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <div>
                       <h1 className="text-3xl font-serif font-medium text-foreground">Học tập</h1>
                       <p className="text-muted-foreground mt-1">Truy cập tất cả các khóa học đã ghi danh của bạn.</p>
                   </div>
                   
                   <div className="flex bg-card p-1 rounded-full border border-border shadow-sm">
                       <Button 
                        variant="ghost" 
                        onClick={() => setActiveTab('in-progress')}
                        className={`rounded-full h-10 px-6 transition-all font-medium ${activeTab === 'in-progress' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'}`}
                       >
                        Đang học
                       </Button>
                       <Button 
                        variant="ghost" 
                        onClick={() => setActiveTab('completed')}
                        className={`rounded-full h-10 px-6 transition-all font-medium ${activeTab === 'completed' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'}`}
                       >
                        Đã xong
                       </Button>
                   </div>
               </div>

               {/* Smart Search Bar */}
               <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                   <div className="relative w-full max-w-md z-20" ref={searchContainerRef}>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Tìm kiếm khóa học..." 
                                className="pl-10 pr-10 rounded-full border-primary/20 bg-card focus-visible:ring-primary h-11"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                            />
                            {searchQuery && (
                                <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-muted rounded-full p-1">
                                    <X className="h-4 w-4 text-muted-foreground" />
                                </button>
                            )}
                        </div>

                        {/* Suggestions Dropdown */}
                        {showSuggestions && suggestions && suggestions.length > 0 && (
                            <div className="absolute top-full text-sm left-0 right-0 mt-2 bg-popover rounded-xl shadow-xl border border-border overflow-hidden animate-in fade-in zoom-in-95">
                                <div className="p-2">
                                    <p className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Gợi ý</p>
                                    {suggestions.map((s: any, idx: number) => (
                                        <button 
                                            key={idx}
                                            className="w-full text-left px-3 py-2.5 hover:bg-primary/5 rounded-lg flex items-center gap-2 text-foreground transition-colors"
                                            onClick={() => {
                                                setSearchQuery(s.text);
                                                setShowSuggestions(false);
                                            }}
                                        >
                                            <Search className="w-3.5 h-3.5 text-primary/60" />
                                            {s.text}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                   </div>

                   {/* Tag Filters */}
                   {/* <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 w-full no-scrollbar">
                        <Tag className="w-4 h-4 text-primary shrink-0" />
                        {AVAILABLE_TAGS.map(tag => (
                            <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                                    selectedTags.includes(tag) 
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                                    : "bg-white text-muted-foreground border-primary/10 hover:border-primary/30 hover:text-primary"
                                }`}
                            >
                                {tag}
                            </button>
                        ))}
                        {selectedTags.length > 0 && (
                            <button onClick={() => setSelectedTags([])} className="text-xs text-muted-foreground hover:text-red-500 underline ml-2 whitespace-nowrap">
                                Xóa lọc
                            </button>
                        )}
                   </div> */}
               </div>
          </div>

          {/* Loaders */}
          {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1,2,3].map(i => (
                      <div key={i} className="h-64 bg-card rounded-[24px] animate-pulse"></div>
                  ))}
              </div>
          )}

          {/* Results */}
          {!isLoading && (
              <div>
                {filteredEnrollments.length === 0 ? (
                    <div className="text-center py-20 bg-card/50 rounded-[32px] border border-dashed border-primary/10">
                        <div className="w-20 h-20 bg-primary/5 text-primary/40 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/10">
                            <BookOpen className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-serif font-medium text-foreground mb-2">
                             Không tìm thấy khóa học nào
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-8">
                            {searchQuery || selectedTags.length > 0 
                                ? "Không có kết quả nào phù hợp với tìm kiếm của bạn. Hãy thử từ khóa khác."
                                : (activeTab === 'completed' ? "Bạn chưa hoàn thành khóa học nào." : "Bạn chưa đăng ký khóa học nào.")}
                        </p>
                        {(!searchQuery && selectedTags.length === 0) && (
                            <Link href="/courses">
                                <Button className="rounded-full px-8 h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg shadow-primary/20">
                                    Khám phá khóa học mới
                                </Button>
                            </Link>
                        )}
                        {(searchQuery || selectedTags.length > 0) && (
                            <Button variant="outline" onClick={() => {clearSearch(); setSelectedTags([]);}} className="rounded-full border-primary/20 text-primary hover:bg-primary/5">
                                Xóa bộ lọc tìm kiếm
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {filteredEnrollments.map((enrollment: any) => {
                            const course = enrollment.courseId;
                            if (!course) return null;

                            return (
                            <div key={enrollment._id} className="group bg-card rounded-[32px] p-6 shadow-sm border border-primary/10 hover:shadow-[0_8px_30px_-10px_rgba(212,175,55,0.25)] hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                                <div className="aspect-video bg-secondary rounded-2xl mb-5 relative overflow-hidden">
                                    {course.thumbnail ? (
                                        <Image src={course.thumbnail} alt={course.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-primary/20 bg-primary/5">
                                            <BookOpen className="w-12 h-12" />
                                        </div>
                                    )}
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                        <PlayCircle className="h-16 w-16 text-white drop-shadow-xl scale-90 group-hover:scale-100 transition-transform duration-300" />
                                    </div>
                                    {/* Tags Overlay */}
                                    {course.tags && course.tags.length > 0 && (
                                        <div className="absolute top-3 left-3 flex gap-1">
                                            {course.tags.slice(0, 2).map((t: string) => (
                                                <span key={t} className="px-2 py-1 bg-background/85 backdrop-blur text-[10px] font-bold uppercase tracking-wider text-primary rounded-lg shadow-sm border border-border/50">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-serif font-medium text-xl text-foreground line-clamp-2 group-hover:text-primary transition-colors" title={course.name}>{course.name}</h3>
                                </div>
                                
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-5 font-medium uppercase tracking-wide">
                                    <Clock className="h-3.5 w-3.5 text-primary" /> 
                                    {enrollment.lastAccessedAt ? `Truy cập: ${new Date(enrollment.lastAccessedAt).toLocaleDateString("vi-VN")}` : "Chưa bắt đầu"}
                                </p>
            
                                {/* Progress Bar */}
                                <div className="w-full bg-secondary rounded-full h-2.5 mb-2 overflow-hidden border border-primary/5">
                                    <div className={`h-full rounded-full transition-all duration-1000 ${enrollment.progress === 100 ? "bg-green-500" : "bg-primary"}`} style={{ width: `${enrollment.progress}%` }}></div>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground mb-6 font-medium">
                                    <span>{Math.round(enrollment.progress)}% Complete</span>
                                    <span>{course.sections?.reduce((acc:any, sec:any) => acc + sec.units.length, 0) || 0} Lessons</span>
                                </div>
            
                                <Link href={`/student/learn/${course._id}`} className="block">
                                    <Button className={`w-full rounded-full h-11 font-bold text-base transition-all ${
                                        enrollment.progress === 100 
                                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/55 dark:border-emerald-900" 
                                        : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_15px_-3px_rgba(212,175,55,0.3)]"
                                    }`}>
                                        {enrollment.progress === 100 ? "Xem lại nội dung" : (enrollment.progress > 0 ? "Tiếp tục học ngay" : "Bắt đầu khóa học")}
                                    </Button>
                                </Link>
                            </div>
                        )})}
                    </div>
                )}
              </div>
          )}
      </div>
    </div>
  );
}
