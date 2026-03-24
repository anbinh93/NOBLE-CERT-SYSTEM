import { prisma } from '../config/database.config';

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

function mapPost(p: any): PostPublic {
  return {
    _id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    thumbnail: p.thumbnail ?? null,
    category: p.category ?? null,
    tags: p.tags ?? [],
    readTime: p.readTime ?? 5,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    author: { name: p.author?.name ?? 'Noble Cert' },
  };
}

export const PostService = {
  async getPublishedPosts(limit = 10): Promise<PostPublic[]> {
    const posts = await prisma.post.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      include: { author: { select: { name: true } } },
    });
    return posts.map(mapPost);
  },

  async getPostBySlug(slug: string): Promise<PostDetail | null> {
    const post = await prisma.post.findUnique({
      where: { slug },
      include: { author: { select: { name: true } } },
    });
    if (!post || !post.isPublished) return null;
    return { ...mapPost(post), content: post.content };
  },
};
