import { prisma } from './config/database.config';
async function main() {
  const courseId = '69ab4eed276e261a56c4140a';
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (course) {
    console.log(JSON.stringify(course.units, null, 2));
  } else {
    console.log("COURSE NOT FOUND");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
