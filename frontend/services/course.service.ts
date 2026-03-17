import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { Course } from "@/types/course";

export class CourseService {
  /**
   * Fetch all public courses
   */
  static async getAllCourses(filters?: { topic?: string; goal?: string; search?: string }): Promise<Course[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.topic) queryParams.append("topic", filters.topic);
      if (filters?.goal) queryParams.append("goal", filters.goal);
      if (filters?.search) queryParams.append("search", filters.search);

      const url = `${API_ENDPOINTS.PUBLIC.COURSES}?${queryParams.toString()}`;
      console.log(`[CourseService] Fetching: ${url}`);
      
      const res = await fetch(url, {
        cache: "no-store", // Ensure fresh data
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[CourseService] API Error: ${res.status} ${res.statusText}`, errorText);
        throw new Error(`Failed to fetch courses: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      console.log(`[CourseService] Successfully fetched ${data.length} courses`);
      return data;
    } catch (error) {
      console.error("[CourseService] getAllCourses FETCH ERROR:", error);
      return [];
    }
  }

  /**
   * Fetch a single course by slug
   * @param slug 
   */
  static async getCourseBySlug(slug: string): Promise<Course | null> {
    try {
      const url = API_ENDPOINTS.PUBLIC.COURSE_DETAIL(slug);
      console.log(`[CourseService] Fetching: ${url}`);
      const res = await fetch(url, {
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`Failed to fetch course detail: ${res.status}`);
      }

      return await res.json();
    } catch (error) {
      console.error("[CourseService] getCourseBySlug error:", error);
      return null;
    }
  }
  /**
   * Fetch secure course content (requires auth)
   */
  static async getCourseContent(courseId: string, email: string): Promise<{ course: Course, progress: number, completedUnits: string[], examScore?: number, isCertified?: boolean, certificateSerial?: string } | null> {
    try {
      const url = `${API_ENDPOINTS.STUDENT.COURSE_CONTENT(courseId)}?email=${email}`;
      console.log(`[CourseService] Fetching secure content: ${url}`);
      const res = await fetch(url, {
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 403) throw new Error("Access denied. Please enroll first.");
        throw new Error(`Failed to fetch course content: ${res.status}`);
      }

      const json = await res.json();
      // Unwrap { status: 'success', data: {...} } envelope từ backend
      if (json && json.status === 'success' && json.data) {
        return json.data;
      }
      return json;
    } catch (error) {
      console.error("[CourseService] getCourseContent error:", error);
      return null;
    }
  }

}
