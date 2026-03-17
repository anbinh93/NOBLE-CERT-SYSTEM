import { CourseStatus, ExamResult, ExamSubmission } from "@/types/learning";
import { API_ENDPOINTS } from "@/constants/api-endpoints";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

class LearningService {
  /**
   * Fetch nội bộ: tự động unwrap `{ status, data }` từ backend.
   * Nếu response là dạng `{ status: 'success', data: T }` thì trả về `data`.
   */
  private async fetch<T>(endpoint: string, options?: RequestInit, token?: string): Promise<T> {
    const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;

    const authHeader: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
        ...(options?.headers as Record<string, string> | undefined),
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API Error ${res.status}: ${errorText}`);
    }

    const json = await res.json();

    // Tự động unwrap { status: 'success'|'fail', data: T }
    if (json && typeof json === "object" && "status" in json && "data" in json) {
      return json.data as T;
    }
    return json as T;
  }

  public async get<T>(endpoint: string, token?: string): Promise<T> {
    return this.fetch<T>(endpoint, undefined, token);
  }

  // ─── Public endpoints (dùng email, không cần JWT) ──────────────────────

  async getCourseContent(courseId: string, email: string): Promise<{
    course: Record<string, unknown>;
    completedUnits: string[];
    progress: number;
    examScore: number;
    isCertified: boolean;
    certificateSerial?: string;
  }> {
    return this.fetch(
      `${API_ENDPOINTS.STUDENT.COURSE_CONTENT(courseId)}?email=${encodeURIComponent(email)}`
    );
  }

  async getCourseStatus(courseId: string, email: string): Promise<CourseStatus> {
    return this.fetch<CourseStatus>(
      `${API_ENDPOINTS.STUDENT.COURSE_STATUS(courseId)}?email=${encodeURIComponent(email)}`
    );
  }

  // ─── Protected endpoints (cần JWT Bearer) ──────────────────────────────

  async getExam(courseId: string, token: string): Promise<{ questions: unknown[]; duration: number; passingScore: number }> {
    return this.fetch(API_ENDPOINTS.STUDENT.EXAM(courseId), undefined, token);
  }

  async submitExam(data: ExamSubmission, token: string): Promise<ExamResult> {
    return this.fetch<ExamResult>(
      API_ENDPOINTS.STUDENT.EXAM_SUBMIT(data.courseId),
      {
        method: "POST",
        body: JSON.stringify({ answers: data.answers }),
      },
      token
    );
  }

  async syncHeartbeat(
    courseId: string,
    unitId: string,
    currentPosition: number,
    timeAdded: number,
    token: string
  ): Promise<void> {
    return this.fetch(
      API_ENDPOINTS.STUDENT.HEARTBEAT(courseId, unitId),
      {
        method: "POST",
        body: JSON.stringify({ currentPosition, timeAdded }),
      },
      token
    );
  }

  async completeUnit(
    courseId: string,
    unitId: string,
    token: string,
    videoDuration?: number,
  ): Promise<void> {
    return this.fetch(
      API_ENDPOINTS.STUDENT.COMPLETE_UNIT(courseId, unitId),
      {
        method: "POST",
        body: JSON.stringify({ videoDuration }),
      },
      token
    );
  }

  /**
   * Alias dùng khi user bấm nút "Đánh dấu hoàn thành" thủ công.
   * Truyền forceComplete=true để backend bỏ qua chốt thời gian.
   */
  async updateProgress(courseId: string, unitId: string, token: string): Promise<void> {
    return this.fetch(
      API_ENDPOINTS.STUDENT.COMPLETE_UNIT(courseId, unitId),
      {
        method: "POST",
        body: JSON.stringify({ forceComplete: true }),
      },
      token
    );
  }

}

export const learningService = new LearningService();
