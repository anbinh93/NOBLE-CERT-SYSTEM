import bcrypt from "bcrypt";
import { prisma } from "../config/database.config";

async function main() {
  console.log("--- Creating sample accounts ---");

  const existingAdmin = await prisma.user.findUnique({ where: { email: "admin@noblecert.com" } });
  if (!existingAdmin) {
    const pw = await bcrypt.hash("admin123", 12);
    await prisma.user.create({
      data: { email: "admin@noblecert.com", password: pw, name: "Super Admin Team", role: "SUPER_ADMIN", isEmailVerified: true, isActive: true },
    });
    console.log("Created admin@noblecert.com / admin123");
  } else {
    console.log("Admin already exists");
  }

  const existingInst = await prisma.user.findUnique({ where: { email: "instructor@noblecert.com" } });
  if (!existingInst) {
    const pw = await bcrypt.hash("admin123", 12);
    await prisma.user.create({
      data: { email: "instructor@noblecert.com", password: pw, name: "Giang vien Noble Cert", role: "INSTRUCTOR", isEmailVerified: true, isActive: true },
    });
    console.log("Created instructor@noblecert.com / admin123");
  } else {
    console.log("Instructor already exists");
  }

  const existingStudent = await prisma.user.findUnique({ where: { email: "student@example.com" } });
  if (!existingStudent) {
    const pw = await bcrypt.hash("student123", 12);
    await prisma.user.create({
      data: { email: "student@example.com", password: pw, name: "Hoc vien Demo", role: "STUDENT", isEmailVerified: true, isActive: true },
    });
    console.log("Created student@example.com / student123");
  } else {
    console.log("Student already exists");
  }

  console.log("--- Done ---");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
