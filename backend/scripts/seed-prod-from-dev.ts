/**
 * Script: Sao chép khoá học từ DB dev sang DB prod.
 *
 * - Chỉ copy collection Course.
 * - Dùng slug (settings.slug) nếu có, fallback theo title để tránh nhân bản.
 * - Không copy enrollment/order... chỉ phục vụ seed catalogue khoá học.
 *
 * Chạy:
 *   npx ts-node scripts/seed-prod-from-dev.ts
 *   hoặc:
 *   yarn ts-node scripts/seed-prod-from-dev.ts
 */

import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

const BASE_URI = process.env.MONGODB_URI;

if (!BASE_URI) {
  // eslint-disable-next-line no-console
  console.error('❌ Thiếu MONGODB_URI trong .env');
  process.exit(1);
}

function buildDbUri(base: string, dbName: string): string {
  const url = new URL(base);
  url.pathname = `/${dbName}`;
  return url.toString();
}

const DEV_DB_NAME = 'noble-cert-dev';
const PROD_DB_NAME = 'noble-cert-prod';

const DEV_URI = buildDbUri(BASE_URI, DEV_DB_NAME);
const PROD_URI = buildDbUri(BASE_URI, PROD_DB_NAME);

async function main() {
  // eslint-disable-next-line no-console
  console.log('🚀 Bắt đầu seed khoá học từ DEV → PROD');
  // eslint-disable-next-line no-console
  console.log(`   DEV  URI: ${DEV_URI}`);
  // eslint-disable-next-line no-console
  console.log(`   PROD URI: ${PROD_URI}\n`);

  const client = new MongoClient(DEV_URI);

  try {
    await client.connect();
    const devDb = client.db(DEV_DB_NAME);
    const prodDb = client.db(PROD_DB_NAME);

    const devCourses = await devDb.collection('Course').find({}).toArray();

    // eslint-disable-next-line no-console
    console.log(`📚 Tìm thấy ${devCourses.length} khoá học trong DEV\n`);

    let upserted = 0;
    let skipped = 0;

    for (const c of devCourses) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const course = c as any;
      const settings = (course.settings as Record<string, unknown>) ?? {};
      const slug = (settings.slug as string | undefined)?.trim();
      const filter =
        slug && slug.length > 0
          ? { 'settings.slug': slug }
          : { title: course.title };

      const { _id, ...rest } = course;

      const existing = await prodDb.collection('Course').findOne(filter);
      if (existing) {
        await prodDb.collection('Course').updateOne(
          { _id: existing._id },
          {
            $set: {
              title: rest.title,
              description: rest.description,
              price: rest.price,
              instructorId: rest.instructorId,
              status: rest.status,
              settings: rest.settings,
              units: rest.units,
              updatedAt: new Date(),
            },
          },
        );
        // eslint-disable-next-line no-console
        console.log(`🔁 Update: ${course.title}`);
      } else {
        await prodDb.collection('Course').insertOne({
          ...rest,
          createdAt: rest.createdAt ?? new Date(),
          updatedAt: rest.updatedAt ?? new Date(),
        });
        // eslint-disable-next-line no-console
        console.log(`✅ Insert: ${course.title}`);
        upserted++;
        continue;
      }

      skipped++;
    }

    // eslint-disable-next-line no-console
    console.log(
      `\n✨ Hoàn thành. Đã insert mới ${upserted} khoá học, update ${skipped} khoá học ở PROD.`,
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('❌ Lỗi khi seed dữ liệu:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();

