export interface Unit {
  _id?: string;
  title: string;
  type: "VIDEO" | "DOC" | "QUIZ";
  contentUrl?: string;
  duration?: string;
  isFree?: boolean;
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
