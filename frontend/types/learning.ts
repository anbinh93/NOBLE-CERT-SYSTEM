export interface MissingRequirement {
    id: string;
    title: string;
    type: 'SECTION' | 'UNIT';
    completed: number;
    total: number;
}

export interface CourseStatus {
    progress: number;
    isCertified: boolean;
    isEligible: boolean; // Eligible to take exam
    isEligibleForCertificate: boolean; // Eligible to claim certificate
    examScore: number;
    passingScore?: number;
    missingRequirements: MissingRequirement[];
}

export interface ExamSubmission {
    courseId: string;
    answers: Record<string, string>;
    email: string;
}

export interface ExamResult {
    message: string;
    score: number;
    passed: boolean;
}
