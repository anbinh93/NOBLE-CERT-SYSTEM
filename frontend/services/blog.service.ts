const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface PostPublic {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  thumbnail: string | null;
  category: string | null;
  tags: string[];
  readTime: number;
  publishedAt: string | null;
  author: { name: string };
}

export interface PostDetail extends PostPublic {
  content: string;
}

const FALLBACK_POSTS: PostPublic[] = [
  {
    _id: 'mock-1',
    title: 'Lộ trình chinh phục IELTS 8.0 trong 6 tháng',
    slug: 'lo-trinh-chinh-phuc-ielts-8-0-trong-6-thang',
    excerpt: 'Chia sẻ phương pháp học tập hiệu quả và lộ trình cụ thể từ những học viên đã đạt điểm IELTS 8.0+. Từ nền tảng 5.5 lên 8.0 chỉ trong 6 tháng.',
    thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80',
    category: 'Hướng dẫn',
    tags: ['IELTS', 'Tiếng Anh'],
    readTime: 8,
    publishedAt: '2025-03-01T00:00:00.000Z',
    author: { name: 'Giảng viên Noble Cert' },
  },
  {
    _id: 'mock-2',
    title: 'Top 5 sai lầm phổ biến khi học tiếng Anh tự học',
    slug: 'top-5-sai-lam-pho-bien-khi-hoc-tieng-anh-tu-hoc',
    excerpt: 'Nhiều người học tiếng Anh năm này qua năm khác mà vẫn không tiến bộ. Hãy cùng tìm hiểu 5 sai lầm phổ biến nhất và cách khắc phục.',
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b6f18?w=800&q=80',
    category: 'Mẹo học tập',
    tags: ['Tiếng Anh', 'Tự học'],
    readTime: 6,
    publishedAt: '2025-03-05T00:00:00.000Z',
    author: { name: 'Giảng viên Noble Cert' },
  },
  {
    _id: 'mock-3',
    title: 'Chứng chỉ số Blockchain — Tương lai của xác thực học vấn',
    slug: 'chung-chi-so-blockchain-tuong-lai-xac-thuc-hoc-van',
    excerpt: 'Blockchain đang thay đổi cách chúng ta xác thực bằng cấp và chứng chỉ. Tìm hiểu tại sao công nghệ này sẽ trở thành chuẩn mực toàn cầu.',
    thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80',
    category: 'Công nghệ',
    tags: ['Blockchain', 'EdTech'],
    readTime: 5,
    publishedAt: '2025-03-10T00:00:00.000Z',
    author: { name: 'Noble Cert Team' },
  },
  {
    _id: 'mock-4',
    title: 'Data Science — Ngành nghề hot nhất thập kỷ và cách bắt đầu',
    slug: 'data-science-nganh-nghe-hot-nhat-thap-ky',
    excerpt: 'Data Scientist liên tục được xếp hạng là nghề tốt nhất của thế kỷ 21. Bài viết này sẽ chỉ bạn con đường ngắn nhất để bước vào ngành này.',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    category: 'Sự nghiệp',
    tags: ['Data Science', 'Machine Learning'],
    readTime: 10,
    publishedAt: '2025-03-12T00:00:00.000Z',
    author: { name: 'Giảng viên Noble Cert' },
  },
  {
    _id: 'mock-5',
    title: 'Noble Cert ra mắt chương trình học bổng 2025',
    slug: 'noble-cert-ra-mat-chuong-trinh-hoc-bong-2025',
    excerpt: 'Noble Cert chính thức công bố chương trình học bổng toàn phần dành cho 50 học viên xuất sắc. Đăng ký ngay hôm nay.',
    thumbnail: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80',
    category: 'Tin tức',
    tags: ['Học bổng', 'Noble Cert'],
    readTime: 4,
    publishedAt: '2025-03-15T00:00:00.000Z',
    author: { name: 'Noble Cert Team' },
  },
  {
    _id: 'mock-6',
    title: 'Kỹ năng mềm — Yếu tố quyết định 80% thành công trong sự nghiệp',
    slug: 'ky-nang-mem-yeu-to-quyet-dinh-thanh-cong',
    excerpt: 'Nghiên cứu từ Harvard chỉ ra rằng 85% thành công trong sự nghiệp đến từ kỹ năng mềm. Bạn đã chuẩn bị đủ chưa?',
    thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
    category: 'Kỹ năng',
    tags: ['Kỹ năng mềm', 'Sự nghiệp'],
    readTime: 7,
    publishedAt: '2025-03-18T00:00:00.000Z',
    author: { name: 'Giảng viên Noble Cert' },
  },
];

export const BlogService = {
  async getLatestPosts(limit = 6): Promise<PostPublic[]> {
    try {
      const res = await fetch(`${API_URL}/api/public/posts?limit=${limit}`, {
        cache: 'no-store',
      });
      if (!res.ok) return FALLBACK_POSTS.slice(0, limit);
      const json = await res.json();
      const data: PostPublic[] = json.data ?? [];
      return data.length > 0 ? data : FALLBACK_POSTS.slice(0, limit);
    } catch {
      return FALLBACK_POSTS.slice(0, limit);
    }
  },

  async getPostBySlug(slug: string): Promise<PostDetail | null> {
    try {
      const res = await fetch(`${API_URL}/api/public/posts/${slug}`, {
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? null;
    } catch {
      return null;
    }
  },
};
