import Image from "next/image";
import { FallbackImage } from "@/components/ui/fallback-image";
import EnrollButton from "@/components/course/EnrollButton";
import CourseSyllabus from "@/components/course/CourseSyllabus";
import PurchasedBadge from "@/components/course/PurchasedBadge";
import { Clock, BarChart, Users, CheckCircle } from "lucide-react";
import { CourseService } from "@/services/course.service";

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await CourseService.getCourseBySlug(slug);

  if (!course) {
    return <div className="p-20 text-center text-xl font-bold">Course not found</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      
      {/* 1. HERO SECTION */}
      <div className="bg-card border-b border-primary/10 pb-12 pt-8 lg:pt-12">
        <div className="container mx-auto px-4">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                  <PurchasedBadge courseId={course._id} />
                  <div className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-6">
                     {course.category || "General"}
                  </div>
                  <h1 className="text-4xl lg:text-6xl font-serif font-bold text-foreground tracking-tight leading-[1.1] mb-6">
                     {course.name}
                  </h1>
                  <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl">
                     {course.description || "No description available."}
                  </p>
                  <div className="flex flex-wrap gap-6 text-sm text-foreground font-medium">
                     <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-lg border border-primary/5">
                         <Clock className="w-4 h-4 text-primary" /> {course.duration || "Self-paced"}
                     </div>
                     <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-lg border border-primary/5">
                         <BarChart className="w-4 h-4 text-primary" /> Beginner to Advanced
                     </div>
                     <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-lg border border-primary/5">
                         <Users className="w-4 h-4 text-primary" /> {course.author || "Unknown Instructor"}
                     </div>
                  </div>
               </div>
               {/* Hero Image */}
               <div className="hidden lg:block relative rounded-[32px] overflow-hidden shadow-[0_20px_50px_-10px_hsl(var(--primary)/0.3)] border border-primary/20 transform rotate-1 hover:rotate-0 transition-transform duration-700 bg-foreground">
                   <div className="aspect-video relative">
                      <FallbackImage
                         src={course.thumbnail || null}
                         alt={course.name}
                         fill
                         className="object-cover opacity-90"
                      />
                   </div>
                   {/* Overlay Shine */}
                   <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent pointer-events-none mix-blend-overlay"></div>
               </div>
            </div>
         </div>
       </div>

       {/* 2. CONTENT GRID */}
       <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
             
             {/* LEFT COLUMN (Content) - Span 8 */}
             <div className="lg:col-span-8 space-y-10">
                
                {/* About */}
                <div className="bg-card rounded-[32px] p-8 md:p-10 shadow-sm border border-primary/10">
                   <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-3">
                       <span className="w-8 h-1 bg-primary rounded-full"></span>
                       About this course
                   </h2>
                   <div className="prose prose-lg prose-headings:font-serif prose-headings:text-foreground text-muted-foreground max-w-none">
                      <p>
                         {course.description || "Master the skills you need to succeed. This comprehensive course covers everything from the basics to advanced topics."}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 not-prose">
                         {["Lifetime Access", "Completion Certificate", "Project Files", "Expert Support"].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 text-foreground p-3 rounded-xl bg-secondary/30 border border-primary/5">
                               <CheckCircle className="w-5 h-5 text-primary fill-primary/10" /> 
                               <span className="font-medium">{item}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>

                {/* Syllabus */}
                <div className="bg-card rounded-[32px] p-8 md:p-10 shadow-sm border border-primary/10">
                   <h2 className="text-2xl font-serif font-bold text-foreground mb-8 flex items-center gap-3">
                       <span className="w-8 h-1 bg-primary rounded-full"></span>
                       Course Syllabus
                   </h2>
                   <CourseSyllabus sections={course.sections || []} />
                </div>

             </div>

             {/* RIGHT COLUMN (Sticky Sidebar) - Span 4 */}
             <div className="lg:col-span-4">
                 <div className="sticky top-24 space-y-8">
                     {/* Enrollment Card */}
                     <div className="bg-card rounded-[32px] p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-primary/20 relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                         
                         <div className="aspect-video relative rounded-2xl overflow-hidden bg-muted mb-6 lg:hidden shadow-inner">
                             <FallbackImage src={course.thumbnail || null} alt={course.name} fill className="object-cover" />
                         </div>
                         
                         <div className="mb-8 text-center">
                            <span className="text-muted-foreground line-through text-lg font-medium mr-3 opacity-60">$99.00</span>
                            <span className="text-5xl font-serif font-bold text-primary">{course.price || "Free"}</span>
                         </div>

                         <EnrollButton courseId={course._id} price={course.price || "Free"} />

                         <div className="mt-6 pt-6 border-t border-dashed border-primary/20 text-center">
                            <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                                <CheckCircle className="w-3 h-3 text-primary" /> 30-Day Money-Back Guarantee
                            </p>
                         </div>
                     </div>

                     {/* Instructor Info */}
                     <div className="bg-card rounded-[32px] p-6 shadow-sm border border-primary/10">
                         <h3 className="font-bold text-lg mb-4 text-foreground font-serif">Instructor</h3>
                         <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-muted overflow-hidden relative border-2 border-primary/20 p-0.5">
                               <div className="relative w-full h-full rounded-full overflow-hidden">
                                   <Image 
                                      src={`https://ui-avatars.com/api/?name=${course.author || "User"}&background=random`} 
                                      alt={course.author || "User"} 
                                      fill 
                                      className="object-cover" 
                                   />
                               </div>
                            </div>
                            <div>
                               <p className="font-bold text-foreground text-lg">{course.author || "Unknown"}</p>
                               <p className="text-xs text-primary font-bold uppercase tracking-wider">Industry Expert</p>
                            </div>
                         </div>
                     </div>
                 </div>
             </div>
          </div>
       </div>

    </div>
  );
}
