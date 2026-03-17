const isServer = typeof window === 'undefined';
let baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

// Fix for Node.js 18+ localhost resolution on server-side
if (isServer && baseUrl.includes("localhost")) {
   baseUrl = baseUrl.replace("localhost", "127.0.0.1");
}

export const API_BASE_URL = baseUrl + "/api";

export const API_ENDPOINTS = {
  PUBLIC: {
    COURSES: `${API_BASE_URL}/public/courses`,
    COURSE_DETAIL: (slug: string) => `${API_BASE_URL}/public/courses/${slug}`,
  },
  STUDENT: {
    MY_COURSES: `${API_BASE_URL}/student/my-courses`,
    MY_CERTIFICATES: `${API_BASE_URL}/student/my-certificates`,
    ENROLL: `${API_BASE_URL}/student/enroll`,
    CHECK_ENROLLMENT: `${API_BASE_URL}/student/check-enrollment`,
    COURSE_CONTENT: (courseId: string) => `${API_BASE_URL}/student/course-content/${courseId}`,
    COURSE_STATUS: (courseId: string) => `${API_BASE_URL}/student/${courseId}/status`,
    EXAM: (courseId: string) => `${API_BASE_URL}/v1/student/${courseId}/exam`,
    EXAM_SUBMIT: (courseId: string) => `${API_BASE_URL}/v1/student/${courseId}/exam/submit`,
    HEARTBEAT: (courseId: string, unitId: string) =>
      `${API_BASE_URL}/v1/student/${courseId}/unit/${unitId}/heartbeat`,
    COMPLETE_UNIT: (courseId: string, unitId: string) =>
      `${API_BASE_URL}/v1/student/${courseId}/unit/${unitId}/complete`,
  },
  PAYMENT: {
    CREATE_LINK: `${API_BASE_URL}/v1/payment/create-link`,
    CREATE_CERTIFICATE_LINK: `${API_BASE_URL}/v1/payment/certificate`,
    STATUS: (orderCode: string | number) => `${API_BASE_URL}/v1/payment/status/${orderCode}`,
  },
  AUTH: {
    LOGIN: `${API_BASE_URL}/v1/auth/login`,
    REGISTER: `${API_BASE_URL}/v1/auth/register`,
    GOOGLE_SYNC: `${API_BASE_URL}/v1/auth/google-sync`,
  },
};
