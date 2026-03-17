import { Role, CourseStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { prisma } from '../config/database.config';
import { env } from '../config/env.config';

async function main() {
  console.log('--- Đang bắt đầu quá trình Seeding dữ liệu ---');
  console.log('Database URI from env config:', env.MONGODB_URI);

  // 1. Tạo SUPER_ADMIN mẫu (phục vụ test admin-frontend)
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
  console.log('✅ Đã tạo/tìm thấy SUPER_ADMIN:', superAdmin.email);

  // 2. Tạo Instructor mẫu
  const adminPassword = await bcrypt.hash('admin123', 12);
  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@noblecert.com' },
    update: {},
    create: {
      email: 'instructor@noblecert.com',
      password: adminPassword,
      name: 'Giảng viên Noble Cert',
      role: Role.INSTRUCTOR,
    },
  });
  console.log('✅ Đã tạo/tìm thấy Instructor:', instructor.email);

  // 3. Tạo Student mẫu để demo
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
  console.log('✅ Đã tạo/tìm thấy Student:', student.email);

  // 4. Tạo Khóa học mẫu
  const courseData = [
    {
      title: 'Khóa học lập trình Fullstack Modern Web',
      description: 'Học cách xây dựng ứng dụng web hiện đại từ A-Z với React, Next.js và Node.js.',
      price: 1500000,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
      settings: {
        thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
        category: 'Development',
        passing_score: 80,
        is_sequential: true,
        slug: 'fullstack-modern-web'
      },
      units: [
        {
          unitId: 'unit-1',
          title: 'Giới thiệu về Modern Web Development',
          type: 'video',
          contentUrl: 'https://www.youtube.com/embed/SqcY0GlETPk', // Video YouTube mẫu
          duration: 300, // 5 phút
        },
        {
          unitId: 'unit-2',
          title: 'Cài đặt môi trường phát triển',
          type: 'video',
          contentUrl: 'https://www.youtube.com/embed/8pkI_v_vG0E',
          duration: 600, // 10 phút
        },
        {
          unitId: 'unit-3',
          title: 'Tài liệu hướng dẫn React Core',
          type: 'document',
          contentUrl: 'https://react.dev',
          estimatedTime: 1200, // 20 phút
        },
        {
          unitId: 'exam-1',
          title: 'Bài kiểm tra kiến thức cơ bản',
          type: 'exam',
          questions: [
            {
              id: 'q1',
              question: 'JSX là gì?',
              options: ['JavaScript XML', 'JSON XML', 'Java Syntax Extension'],
              correctAnswer: 'JavaScript XML'
            },
            {
              id: 'q2',
              question: 'React là thư viện của ngôn ngữ nào?',
              options: ['Python', 'JavaScript', 'Java'],
              correctAnswer: 'JavaScript'
            }
          ]
        }
      ]
    },
    {
      title: 'Thiết kế giao diện người dùng (UI/UX) cho người mới',
      description: 'Nắm vững các nguyên tắc thiết kế và sử dụng Figma để tạo ra giao diện chuyên nghiệp.',
      price: 950000,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
      settings: {
        thumbnail: 'https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?auto=format&fit=crop&w=800&q=80',
        category: 'Design',
        passing_score: 75,
        is_sequential: false,
        slug: 'ui-ux-design-basics'
      },
      units: [
        {
          unitId: 'design-unit-1',
          title: 'Nguyên lý màu sắc trong UI',
          type: 'video',
          contentUrl: 'https://www.youtube.com/embed/LAK9U18iT8s',
          duration: 450,
        },
        {
          unitId: 'design-exam',
          title: 'Trắc nghiệm màu sắc',
          type: 'exam',
          questions: [
            {
              id: 'dq1',
              question: 'Màu nào thường dùng cho thông báo lỗi?',
              options: ['Xanh lá', 'Đỏ', 'Vàng'],
              correctAnswer: 'Đỏ'
            }
          ]
        }
      ]
    },
    {
      title: 'Khoa học Dữ liệu (Data Science) Cơ bản',
      description: 'Nắm bắt các khái niệm cơ bản về Data Science, Machine Learning và cách sử dụng Python để phân tích dữ liệu.',
      price: 2000000,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
      settings: {
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
        category: 'Data Science',
        passing_score: 70,
        is_sequential: true,
        slug: 'data-science-basics'
      },
      units: [
        {
          unitId: 'ds-unit-1',
          title: 'Tổng quan về Data Science',
          type: 'video',
          contentUrl: 'https://www.youtube.com/embed/X3paOmcrTjQ', // Placeholder DS video
          duration: 600,
        },
        {
          unitId: 'ds-unit-2',
          title: 'Cài đặt Jupyter Notebook',
          type: 'document',
          contentUrl: 'https://jupyter.org/',
          estimatedTime: 1800,
        }
      ]
    },
    {
      title: 'Tiếng Anh Giao Tiếp Thuyết Trình',
      description: 'Cải thiện kỹ năng thuyết trình bằng tiếng Anh một cách tự tin và trôi chảy trước đám đông.',
      price: 1200000,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
      settings: {
        thumbnail: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?auto=format&fit=crop&w=800&q=80',
        category: 'Language',
        passing_score: 85,
        is_sequential: false,
        slug: 'english-presentation-skills'
      },
      units: [
        {
          unitId: 'eng-unit-1',
          title: 'Kỹ năng làm chủ sân khấu',
          type: 'video',
          contentUrl: 'https://www.youtube.com/embed/Pj15Ie_C-0k', // TED talk placeholder
          duration: 900,
        }
      ]
    },
    {
      title: 'Digital Marketing Thực Chiến',
      description: 'Tối ưu hóa chiến dịch Marketing trên các nền tảng Facebook, Google và TikTok.',
      price: 1800000,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
      settings: {
        thumbnail: 'https://images.unsplash.com/photo-1432888117426-1d37a2ccce88?auto=format&fit=crop&w=800&q=80',
        category: 'Marketing',
        passing_score: 80,
        is_sequential: true,
        slug: 'digital-marketing-practical'
      },
      units: [
        {
          unitId: 'dm-unit-1',
          title: 'Facebook Ads Cơ bản',
          type: 'video',
          contentUrl: 'https://www.youtube.com/embed/jZjb3t4hNXI',
          duration: 1200,
        }
      ]
    },
    {
      title: 'Lập trình Python cho người bắt đầu',
      description: 'Học lập trình Python từ con số không. Phù hợp cho mọi đối tượng chưa từng học code.',
      price: 850000,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
      settings: {
        thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bfce8?auto=format&fit=crop&w=800&q=80',
        category: 'Development',
        passing_score: 80,
        is_sequential: true,
        slug: 'python-for-beginners'
      },
      units: [
        {
          unitId: 'py-unit-1',
          title: 'Biến và các kiểu dữ liệu',
          type: 'video',
          contentUrl: 'https://www.youtube.com/embed/kqtD5dpn9C8',
          duration: 1500,
        }
      ]
    },
    {
      title: 'Khóa học Nhiếp ảnh Cơ bản',
      description: 'Làm chủ máy ảnh DSLR của bạn, hiểu về ISO, khẩu độ, tốc độ màn trập và bố cục hình ảnh.',
      price: 1100000,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
      settings: {
        thumbnail: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80',
        category: 'Photography',
        passing_score: 75,
        is_sequential: false,
        slug: 'photography-basics'
      },
      units: [
        {
          unitId: 'photo-unit-1',
          title: 'Tam giác phơi sáng',
          type: 'video',
          contentUrl: 'https://www.youtube.com/embed/Ixj5A04XkRk',
          duration: 800,
        }
      ]
    },
    {
      title: 'Quản lý Dự án với Agile/Scrum',
      description: 'Nắm bắt tư duy Agile và framework Scrum để quản lý dự án linh hoạt và hiệu quả.',
      price: 2500000,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
      settings: {
        thumbnail: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
        category: 'Business',
        passing_score: 80,
        is_sequential: true,
        slug: 'agile-scrum-management'
      },
      units: [
        {
          unitId: 'scrum-unit-1',
          title: 'Giới thiệu về Agile',
          type: 'video',
          contentUrl: 'https://www.youtube.com/embed/Z9QbYZh1YSk',
          duration: 1100,
        }
      ]
    },
    {
      title: 'Làm chủ Excel từ số 0',
      description: 'Khóa học toàn diện về Microsoft Excel. Từ cơ bản đến các hàm nâng cao và Pivot Table.',
      price: 650000,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
      settings: {
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80', // Using generic data image
        category: 'Office',
        passing_score: 85,
        is_sequential: true,
        slug: 'excel-masterclass'
      },
      units: [
        {
          unitId: 'excel-unit-1',
          title: 'Các hàm cơ bản trong Excel',
          type: 'video',
          contentUrl: 'https://www.youtube.com/embed/8L1OVkw2ZQ8',
          duration: 950,
        }
      ]
    },
    {
      title: 'Phát triển ứng dụng Di động với React Native',
      description: 'Sử dụng kiến thức React của bạn để xây dựng ứng dụng native cho cả iOS và Android.',
      price: 2200000,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
      settings: {
        thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
        category: 'Development',
        passing_score: 80,
        is_sequential: true,
        slug: 'react-native-apps'
      },
      units: [
        {
          unitId: 'rn-unit-1',
          title: 'Cài đặt môi trường React Native',
          type: 'video',
          contentUrl: 'https://www.youtube.com/embed/qSRrxpdMpVc',
          duration: 1400,
        },
        {
          unitId: 'rn-exam-1',
          title: 'Trắc nghiệm React Native',
          type: 'exam',
          questions: [
            {
              id: 'q1',
              question: 'React Native dùng để làm gì?',
              options: ['Web', 'Mobile', 'Desktop'],
              correctAnswer: 'Mobile'
            }
          ]
        }
      ]
    }
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
        status: 'ACTIVE',
      }
    });
    console.log(`✅ Đã ghi danh Student vào: ${course.title}`);
  }

  console.log('--- Hoàn tất Seeding ---');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
