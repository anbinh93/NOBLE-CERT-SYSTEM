/**
 * Script: Thay thế tất cả YouTube link trong tất cả Course.units
 *
 * Chạy: npx ts-node src/utils/replace-youtube.ts
 *       hoặc: yarn ts-node src/utils/replace-youtube.ts
 */

import dotenv from 'dotenv';
dotenv.config();

// Thiết lập database theo NODE_ENV (copy logic từ env.config)
const NODE_ENV = process.env.NODE_ENV ?? 'development';
let mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
  try {
    const url = new URL(mongoUri);
    url.pathname = NODE_ENV === 'development' ? '/noble-cert-dev' : '/noble-cert-prod';
    process.env.MONGODB_URI = url.toString();
  } catch {
    // giữ nguyên nếu parse lỗi
  }
}

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const REPLACEMENT_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

// Regex khớp mọi dạng YouTube URL
const YT_REGEX =
  /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)[\w\-?=&%]+/gi;

/**
 * Deep-replace mọi string khớp YT_REGEX trong bất kỳ JSON value nào.
 * Với unit có type VIDEO/video mà contentUrl rỗng → tự fill REPLACEMENT_URL.
 */
function deepReplace(value: unknown): unknown {
  if (typeof value === 'string') {
    return YT_REGEX.test(value) ? value.replace(YT_REGEX, REPLACEMENT_URL) : value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => {
      // Nếu item là một unit VIDEO có contentUrl rỗng → fill URL
      if (
        item !== null &&
        typeof item === 'object' &&
        !Array.isArray(item)
      ) {
        const unit = item as Record<string, unknown>;
        const isVideoUnit =
          typeof unit.type === 'string' &&
          unit.type.toUpperCase() === 'VIDEO';
        const hasEmptyUrl =
          unit.contentUrl === '' ||
          unit.contentUrl === null ||
          unit.contentUrl === undefined;

        if (isVideoUnit && hasEmptyUrl) {
          return { ...deepReplace(unit) as object, contentUrl: REPLACEMENT_URL };
        }
      }
      return deepReplace(item);
    });
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, deepReplace(v)])
    );
  }
  return value;
}

async function main() {
  console.log(`🔗 Database: ${process.env.MONGODB_URI?.replace(/\/\/.*@/, '//***@')}`);
  console.log(`🔄 Replacement URL: ${REPLACEMENT_URL}\n`);

  const courses = await prisma.course.findMany({
    select: { id: true, title: true, units: true },
  });

  console.log(`📚 Tìm thấy ${courses.length} khóa học\n`);

  let totalUpdated = 0;
  let totalLinksReplaced = 0;

  for (const course of courses) {
    const originalStr = JSON.stringify(course.units);

    // Đếm YouTube link có sẵn
    const ytCount = (originalStr.match(YT_REGEX) ?? []).length;

    // Đếm VIDEO unit có contentUrl rỗng
    const emptyVideoCount = (course.units as Record<string, unknown>[]).filter(
      (u) =>
        typeof u?.type === 'string' &&
        u.type.toUpperCase() === 'VIDEO' &&
        (u.contentUrl === '' || u.contentUrl === null || u.contentUrl === undefined)
    ).length;

    if (ytCount === 0 && emptyVideoCount === 0) {
      console.log(`  ⏭  [${course.id}] "${course.title}" — không có gì cần cập nhật`);
      continue;
    }

    // Thực hiện deep replace + fill empty VIDEO contentUrl
    const newUnits = deepReplace(course.units) as Prisma.InputJsonValue[];

    await prisma.course.update({
      where: { id: course.id },
      data: { units: newUnits },
    });

    totalUpdated++;
    totalLinksReplaced += ytCount + emptyVideoCount;

    const parts: string[] = [];
    if (ytCount > 0) parts.push(`thay ${ytCount} link`);
    if (emptyVideoCount > 0) parts.push(`fill ${emptyVideoCount} contentUrl trống`);
    console.log(`  ✅ [${course.id}] "${course.title}" — ${parts.join(', ')}`);
  }

  console.log(`\n✨ Xong! Đã cập nhật ${totalUpdated}/${courses.length} khóa học, tổng ${totalLinksReplaced} thay đổi.`);
}

main()
  .catch((err) => {
    console.error('❌ Lỗi:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
