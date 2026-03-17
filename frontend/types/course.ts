export interface QuizQuestion {
  id?: string;
  question: string;
  options: string[];
  correctAnswer: number | string;
  explanation?: string;
}

export interface Unit {
  _id?: string;
  title: string;
  type: "VIDEO" | "DOC" | "QUIZ" | "EXAM" | "DOCUMENT";
  contentUrl?: string;
  duration?: string;
  isFree?: boolean;
  questions?: QuizQuestion[];
}

export interface Section {
  title: string;
  units: Unit[];
}

export interface Course {
  _id: string;
  code: string;
  name: string;
  slug: string;
  description?: string;
  price?: string;
  duration?: string;
  category?: string;
  author?: string;
  thumbnail?: string;
  sections?: Section[];
  createdAt?: string;
  updatedAt?: string;
}
