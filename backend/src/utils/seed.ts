import { Role, CourseStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import { prisma } from "../config/database.config";
import { env } from "../config/env.config";

async function main() {
  console.log("--- Đang bắt đầu quá trình Seeding dữ liệu ---");
  console.log("Database URI from env config:", env.MONGODB_URI);

  // 0. Tạo Super Admin
  const adminPassword = await bcrypt.hash("admin123", 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@noblecert.com" },
    update: { isEmailVerified: true },
    create: {
      email: "admin@noblecert.com",
      password: adminPassword,
      name: "Super Admin Team",
      role: Role.SUPER_ADMIN,
      isEmailVerified: true,
    },
  });
  console.log("✅ Đã tạo/tìm thấy Super Admin:", superAdmin.email);

  // 1. Tạo Instructor mẫu
  const instructor = await prisma.user.upsert({
    where: { email: "instructor@noblecert.com" },
    update: { isEmailVerified: true },
    create: {
      email: "instructor@noblecert.com",
      password: adminPassword,
      name: "Giảng viên Noble Cert",
      role: Role.INSTRUCTOR,
      isEmailVerified: true,
    },
  });
  console.log("✅ Đã tạo/tìm thấy Instructor:", instructor.email);

  // 2. Tạo Student mẫu để demo
  const studentPassword = await bcrypt.hash("student123", 12);
  const student = await prisma.user.upsert({
    where: { email: "student@example.com" },
    update: { isEmailVerified: true },
    create: {
      email: "student@example.com",
      password: studentPassword,
      name: "Học viên Demo",
      role: Role.STUDENT,
      isEmailVerified: true,
    },
  });
  console.log("✅ Đã tạo/tìm thấy Student:", student.email);

  // 3. Tạo Khóa học mẫu
  const courseData = [
    {
      title: "Khóa học lập trình Fullstack Modern Web",
      description:
        "Học cách xây dựng ứng dụng web hiện đại từ A-Z với React, Next.js và Node.js.",
      price: 1500000,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
      settings: {
        thumbnail:
          "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
        category: "Development",
        passing_score: 80,
        is_sequential: true,
        slug: "fullstack-modern-web",
      },
      units: [
        {
          unitId: "unit-1",
          title: "Giới thiệu về Modern Web Development",
          type: "video",
          contentUrl: "https://www.youtube.com/embed/SqcY0GlETPk", // Video YouTube mẫu
          duration: 300, // 5 phút
        },
        {
          unitId: "unit-2",
          title: "Cài đặt môi trường phát triển",
          type: "video",
          contentUrl: "https://www.youtube.com/embed/8pkI_v_vG0E",
          duration: 600, // 10 phút
        },
        {
          unitId: "unit-3",
          title: "Tài liệu hướng dẫn React Core",
          type: "document",
          contentUrl: "https://react.dev",
          estimatedTime: 1200, // 20 phút
        },
        {
          unitId: "exam-1",
          title: "Bài kiểm tra kiến thức cơ bản",
          type: "exam",
          questions: [
            {
              id: "q1",
              question: "JSX là gì?",
              options: ["JavaScript XML", "JSON XML", "Java Syntax Extension"],
              correctAnswer: "JavaScript XML",
            },
            {
              id: "q2",
              question: "React là thư viện của ngôn ngữ nào?",
              options: ["Python", "JavaScript", "Java"],
              correctAnswer: "JavaScript",
            },
          ],
        },
      ],
    },
    {
      title: "Thiết kế giao diện người dùng (UI/UX) cho người mới",
      description:
        "Nắm vững các nguyên tắc thiết kế và sử dụng Figma để tạo ra giao diện chuyên nghiệp.",
      price: 950000,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
      settings: {
        thumbnail:
          "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?auto=format&fit=crop&w=800&q=80",
        category: "Design",
        passing_score: 75,
        is_sequential: false,
        slug: "ui-ux-design-basics",
      },
      units: [
        {
          unitId: "design-unit-1",
          title: "Nguyên lý màu sắc trong UI",
          type: "video",
          contentUrl: "https://www.youtube.com/embed/LAK9U18iT8s",
          duration: 450,
        },
        {
          unitId: "design-exam",
          title: "Trắc nghiệm màu sắc",
          type: "exam",
          questions: [
            {
              id: "dq1",
              question: "Màu nào thường dùng cho thông báo lỗi?",
              options: ["Xanh lá", "Đỏ", "Vàng"],
              correctAnswer: "Đỏ",
            },
          ],
        },
      ],
    },
    {
      title: "Khoa học Dữ liệu (Data Science) Cơ bản",
      description:
        "Nắm bắt các khái niệm cơ bản về Data Science, Machine Learning và cách sử dụng Python để phân tích dữ liệu.",
      price: 2000000,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
      settings: {
        thumbnail:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
        category: "Data Science",
        passing_score: 70,
        is_sequential: true,
        slug: "data-science-basics",
      },
      units: [
        {
          unitId: "ds-unit-1",
          title: "Tổng quan về Data Science",
          type: "video",
          contentUrl: "https://www.youtube.com/embed/X3paOmcrTjQ", // Placeholder DS video
          duration: 600,
        },
        {
          unitId: "ds-unit-2",
          title: "Cài đặt Jupyter Notebook",
          type: "document",
          contentUrl: "https://jupyter.org/",
          estimatedTime: 1800,
        },
      ],
    },
    {
      title: "Tiếng Anh Giao Tiếp Thuyết Trình",
      description:
        "Cải thiện kỹ năng thuyết trình bằng tiếng Anh một cách tự tin và trôi chảy trước đám đông.",
      price: 1200000,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
      settings: {
        thumbnail:
          "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?auto=format&fit=crop&w=800&q=80",
        category: "Language",
        passing_score: 85,
        is_sequential: false,
        slug: "english-presentation-skills",
      },
      units: [
        {
          unitId: "eng-unit-1",
          title: "Kỹ năng làm chủ sân khấu",
          type: "video",
          contentUrl: "https://www.youtube.com/embed/Pj15Ie_C-0k", // TED talk placeholder
          duration: 900,
        },
      ],
    },
    {
      title: "Digital Marketing Thực Chiến",
      description:
        "Tối ưu hóa chiến dịch Marketing trên các nền tảng Facebook, Google và TikTok.",
      price: 1800000,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
      settings: {
        thumbnail:
          "https://images.unsplash.com/photo-1432888117426-1d37a2ccce88?auto=format&fit=crop&w=800&q=80",
        category: "Marketing",
        passing_score: 80,
        is_sequential: true,
        slug: "digital-marketing-practical",
      },
      units: [
        {
          unitId: "dm-unit-1",
          title: "Facebook Ads Cơ bản",
          type: "video",
          contentUrl: "https://www.youtube.com/embed/jZjb3t4hNXI",
          duration: 1200,
        },
      ],
    },
    {
      title: "Lập trình Python cho người bắt đầu",
      description:
        "Học lập trình Python từ con số không. Phù hợp cho mọi đối tượng chưa từng học code.",
      price: 850000,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
      settings: {
        thumbnail:
          "https://images.unsplash.com/photo-1526379095098-d400fd0bfce8?auto=format&fit=crop&w=800&q=80",
        category: "Development",
        passing_score: 80,
        is_sequential: true,
        slug: "python-for-beginners",
      },
      units: [
        {
          unitId: "py-unit-1",
          title: "Biến và các kiểu dữ liệu",
          type: "video",
          contentUrl: "https://www.youtube.com/embed/kqtD5dpn9C8",
          duration: 1500,
        },
      ],
    },
    {
      title: "Khóa học Nhiếp ảnh Cơ bản",
      description:
        "Làm chủ máy ảnh DSLR của bạn, hiểu về ISO, khẩu độ, tốc độ màn trập và bố cục hình ảnh.",
      price: 1100000,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
      settings: {
        thumbnail:
          "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80",
        category: "Photography",
        passing_score: 75,
        is_sequential: false,
        slug: "photography-basics",
      },
      units: [
        {
          unitId: "photo-unit-1",
          title: "Tam giác phơi sáng",
          type: "video",
          contentUrl: "https://www.youtube.com/embed/Ixj5A04XkRk",
          duration: 800,
        },
      ],
    },
    {
      title: "Quản lý Dự án với Agile/Scrum",
      description:
        "Nắm bắt tư duy Agile và framework Scrum để quản lý dự án linh hoạt và hiệu quả.",
      price: 2500000,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
      settings: {
        thumbnail:
          "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80",
        category: "Business",
        passing_score: 80,
        is_sequential: true,
        slug: "agile-scrum-management",
      },
      units: [
        {
          unitId: "scrum-unit-1",
          title: "Giới thiệu về Agile",
          type: "video",
          contentUrl: "https://www.youtube.com/embed/Z9QbYZh1YSk",
          duration: 1100,
        },
      ],
    },
    {
      title: "Làm chủ Excel từ số 0",
      description:
        "Khóa học toàn diện về Microsoft Excel. Từ cơ bản đến các hàm nâng cao và Pivot Table.",
      price: 650000,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
      settings: {
        thumbnail:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80", // Using generic data image
        category: "Office",
        passing_score: 85,
        is_sequential: true,
        slug: "excel-masterclass",
      },
      units: [
        {
          unitId: "excel-unit-1",
          title: "Các hàm cơ bản trong Excel",
          type: "video",
          contentUrl: "https://www.youtube.com/embed/8L1OVkw2ZQ8",
          duration: 950,
        },
      ],
    },
    {
      title: "Phát triển ứng dụng Di động với React Native",
      description:
        "Sử dụng kiến thức React của bạn để xây dựng ứng dụng native cho cả iOS và Android.",
      price: 2200000,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
      settings: {
        thumbnail:
          "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80",
        category: "Development",
        passing_score: 80,
        is_sequential: true,
        slug: "react-native-apps",
      },
      units: [
        {
          unitId: "rn-unit-1",
          title: "Cài đặt môi trường React Native",
          type: "video",
          contentUrl: "https://www.youtube.com/embed/qSRrxpdMpVc",
          duration: 1400,
        },
        {
          unitId: "rn-exam-1",
          title: "Trắc nghiệm React Native",
          type: "exam",
          questions: [
            {
              id: "q1",
              question: "React Native dùng để làm gì?",
              options: ["Web", "Mobile", "Desktop"],
              correctAnswer: "Mobile",
            },
          ],
        },
      ],
    },
  ];

  for (const data of courseData) {
    const course = await prisma.course.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        status: data.status,
        instructorId: data.instructorId,
        settings: data.settings as any,
        units: data.units as any,
      },
    });
    console.log(`✅ Đã nạp khóa học: ${course.title}`);

    // Tự động enroll cho student demo để thấy dữ liệu ngay
    await prisma.enrollment.create({
      data: {
        userId: student.id,
        courseId: course.id,
        status: "ACTIVE",
      },
    });
    console.log(`✅ Đã ghi danh Student vào: ${course.title}`);
  }

  // 4. Seed blog posts
  const mockPosts = [
    {
      title: "Lộ trình chinh phục IELTS 8.0 trong 6 tháng",
      slug: "lo-trinh-chinh-phuc-ielts-8-0-trong-6-thang",
      excerpt: "Chia sẻ phương pháp học tập hiệu quả và lộ trình cụ thể từ những học viên đã đạt điểm IELTS 8.0+. Từ nền tảng 5.5 lên 8.0 chỉ trong 6 tháng.",
      content: `<h2>Tại sao IELTS 8.0 không phải là giấc mơ?</h2><p>Nhiều học viên nghĩ rằng IELTS 8.0 là mục tiêu quá xa vời, nhưng thực tế với phương pháp đúng đắn và lộ trình bài bản, đây là điều hoàn toàn có thể đạt được trong 6 tháng.</p><h2>Giai đoạn 1: Xây dựng nền tảng (Tháng 1-2)</h2><p>Tập trung vào vocabulary và grammar căn bản. Học ít nhất 20 từ mới mỗi ngày và ôn luyện cấu trúc câu phức hợp.</p><h2>Giai đoạn 2: Kỹ năng tổng hợp (Tháng 3-4)</h2><p>Luyện tập 4 kỹ năng Listening, Reading, Writing, Speaking mỗi ngày. Đặt mục tiêu làm ít nhất 2 đề thi thử mỗi tuần.</p><h2>Giai đoạn 3: Hoàn thiện (Tháng 5-6)</h2><p>Tập trung vào điểm yếu, làm nhiều mock test và phân tích lỗi sai. Tham gia các buổi speaking club để nâng cao tự tin.</p>`,
      thumbnail: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80",
      category: "Hướng dẫn",
      tags: ["IELTS", "Tiếng Anh", "Học thuật"],
      readTime: 8,
      isPublished: true,
      publishedAt: new Date("2025-03-01"),
      authorId: instructor.id,
    },
    {
      title: "Top 5 sai lầm phổ biến khi học tiếng Anh tự học",
      slug: "top-5-sai-lam-pho-bien-khi-hoc-tieng-anh-tu-hoc",
      excerpt: "Nhiều người học tiếng Anh năm này qua năm khác mà vẫn không tiến bộ. Hãy cùng tìm hiểu 5 sai lầm phổ biến nhất và cách khắc phục.",
      content: `<h2>Sai lầm 1: Học ngữ pháp quá nhiều mà ít nói</h2><p>Ngữ pháp là công cụ, không phải mục tiêu. Hãy dành ít nhất 30 phút mỗi ngày để luyện speaking, dù chỉ là nói chuyện một mình.</p><h2>Sai lầm 2: Dịch từng từ trong đầu</h2><p>Não bộ cần được luyện tập để nghĩ trực tiếp bằng tiếng Anh. Hãy cố gắng đặt câu mà không dịch qua tiếng Việt.</p><h2>Sai lầm 3: Chỉ học vocabulary rời rạc</h2><p>Học từ theo chủ đề và trong ngữ cảnh cụ thể sẽ hiệu quả hơn nhiều so với việc học từ điển từng từ một.</p>`,
      thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b6f18?w=800&q=80",
      category: "Mẹo học tập",
      tags: ["Tiếng Anh", "Tự học", "Phương pháp"],
      readTime: 6,
      isPublished: true,
      publishedAt: new Date("2025-03-05"),
      authorId: instructor.id,
    },
    {
      title: "Chứng chỉ số Blockchain — Tương lai của xác thực học vấn",
      slug: "chung-chi-so-blockchain-tuong-lai-xac-thuc-hoc-van",
      excerpt: "Blockchain đang thay đổi cách chúng ta xác thực bằng cấp và chứng chỉ. Tìm hiểu tại sao công nghệ này sẽ trở thành chuẩn mực toàn cầu.",
      content: `<h2>Vấn đề với chứng chỉ truyền thống</h2><p>Hàng năm, hàng nghìn trường hợp bằng giả được phát hiện tại các doanh nghiệp lớn. Chi phí xác minh tốn kém và quy trình phức tạp khiến việc kiểm tra học vấn trở nên khó khăn.</p><h2>Blockchain giải quyết vấn đề như thế nào?</h2><p>Với công nghệ blockchain, mỗi chứng chỉ được mã hóa và lưu trữ phân tán trên mạng lưới toàn cầu. Không ai có thể làm giả hay chỉnh sửa mà không để lại dấu vết.</p><h2>Noble Cert và sứ mệnh minh bạch hóa giáo dục</h2><p>Tại Noble Cert, mỗi chứng chỉ hoàn thành khóa học đều được cấp kèm mã xác thực blockchain, cho phép bất kỳ ai cũng có thể verify ngay lập tức.</p>`,
      thumbnail: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80",
      category: "Công nghệ",
      tags: ["Blockchain", "Chứng chỉ", "EdTech"],
      readTime: 5,
      isPublished: true,
      publishedAt: new Date("2025-03-10"),
      authorId: superAdmin.id,
    },
    {
      title: "Data Science — Ngành nghề hot nhất thập kỷ và cách bắt đầu",
      slug: "data-science-nganh-nghe-hot-nhat-thap-ky",
      excerpt: "Data Scientist liên tục được xếp hạng là nghề tốt nhất của thế kỷ 21. Bài viết này sẽ chỉ bạn con đường ngắn nhất để bước vào ngành này.",
      content: `<h2>Data Science là gì?</h2><p>Data Science là lĩnh vực kết hợp thống kê, lập trình và domain knowledge để trích xuất insight có giá trị từ dữ liệu lớn.</p><h2>Kỹ năng cần có</h2><p>Python hoặc R, SQL, Machine Learning cơ bản, Data Visualization, và khả năng kể chuyện bằng dữ liệu là những kỹ năng thiết yếu.</p><h2>Lộ trình 12 tháng cho người mới bắt đầu</h2><p>Tháng 1-3: Python cơ bản và Pandas. Tháng 4-6: SQL và Data Analysis. Tháng 7-9: Machine Learning với Scikit-learn. Tháng 10-12: Deep Learning và xây dựng portfolio.</p>`,
      thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
      category: "Sự nghiệp",
      tags: ["Data Science", "Python", "Machine Learning"],
      readTime: 10,
      isPublished: true,
      publishedAt: new Date("2025-03-12"),
      authorId: instructor.id,
    },
    {
      title: "Noble Cert ra mắt chương trình học bổng 2025",
      slug: "noble-cert-ra-mat-chuong-trinh-hoc-bong-2025",
      excerpt: "Noble Cert chính thức công bố chương trình học bổng toàn phần dành cho 50 học viên xuất sắc trong năm 2025. Đăng ký ngay hôm nay.",
      content: `<h2>Noble Cert Scholarship 2025</h2><p>Với mong muốn mang cơ hội học tập chất lượng cao đến với tất cả mọi người, Noble Cert tự hào công bố chương trình học bổng toàn phần trị giá hàng trăm triệu đồng.</p><h2>Đối tượng tham gia</h2><p>Học sinh, sinh viên và người đi làm có hoàn cảnh khó khăn nhưng có tinh thần học tập xuất sắc. Không giới hạn độ tuổi và ngành nghề.</p><h2>Quyền lợi học bổng</h2><p>Miễn 100% học phí cho tất cả khóa học trên nền tảng, hỗ trợ mentoring 1-1 với giảng viên, và cơ hội thực tập tại các doanh nghiệp đối tác.</p><h2>Hạn đăng ký</h2><p>31/03/2025. Hồ sơ nộp qua email: scholarship@noblecert.edu.vn</p>`,
      thumbnail: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80",
      category: "Tin tức",
      tags: ["Học bổng", "Sự kiện", "Noble Cert"],
      readTime: 4,
      isPublished: true,
      publishedAt: new Date("2025-03-15"),
      authorId: superAdmin.id,
    },
    {
      title: "Kỹ năng mềm — Yếu tố quyết định 80% thành công trong sự nghiệp",
      slug: "ky-nang-mem-yeu-to-quyet-dinh-thanh-cong",
      excerpt: "Nghiên cứu từ Harvard chỉ ra rằng 85% thành công trong sự nghiệp đến từ kỹ năng mềm. Bạn đã chuẩn bị đủ chưa?",
      content: `<h2>Kỹ năng mềm quan trọng hơn bạn nghĩ</h2><p>Trong khi nhiều người tập trung vào bằng cấp và chứng chỉ kỹ thuật, các nhà tuyển dụng ngày càng coi trọng khả năng giao tiếp, làm việc nhóm và lãnh đạo.</p><h2>5 kỹ năng mềm thiết yếu</h2><p>1. Giao tiếp hiệu quả — 2. Tư duy phản biện — 3. Quản lý thời gian — 4. Làm việc nhóm — 5. Thích nghi với thay đổi</p><h2>Cách phát triển kỹ năng mềm</h2><p>Tham gia câu lạc bộ, nhận feedback thường xuyên, đọc sách về tâm lý học và lãnh đạo, và quan trọng nhất là thực hành trong môi trường thực tế.</p>`,
      thumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
      category: "Kỹ năng",
      tags: ["Kỹ năng mềm", "Sự nghiệp", "Phát triển bản thân"],
      readTime: 7,
      isPublished: true,
      publishedAt: new Date("2025-03-18"),
      authorId: instructor.id,
    },
  ];

  for (const postData of mockPosts) {
    await prisma.post.upsert({
      where: { slug: postData.slug },
      update: { isPublished: true },
      create: postData,
    });
    console.log(`✅ Đã nạp bài viết: ${postData.title}`);
  }

  console.log("--- Hoàn tất Seeding ---");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
