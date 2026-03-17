import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { prisma } from '../config/database.config';
import { env } from '../config/env.config';

async function main() {
  console.log('--- Seeding Users (SUPER_ADMIN / Instructor / Student) ---');
  console.log('Database URI from env config:', env.MONGODB_URI);

  // 1. SUPER_ADMIN
  const superAdminPassword = await bcrypt.hash('noble@2026', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@noble.com' },
    update: {
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      email: 'admin@noble.com',
      password: superAdminPassword,
      name: 'Super Admin',
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });
  console.log('✅ SUPER_ADMIN:', superAdmin.email);

  // 2. Instructor mẫu
  const instructorPassword = await bcrypt.hash('admin123', 12);
  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@noblecert.com' },
    update: {},
    create: {
      email: 'instructor@noblecert.com',
      password: instructorPassword,
      name: 'Giảng viên Noble Cert',
      role: Role.INSTRUCTOR,
    },
  });
  console.log('✅ Instructor:', instructor.email);

  // 3. Student demo
  const studentPassword = await bcrypt.hash('student123', 12);
  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      password: studentPassword,
      name: 'Học viên Demo',
      role: Role.STUDENT,
    },
  });
  console.log('✅ Student:', student.email);

  console.log('--- Hoàn tất seeding users ---');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seeding users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

