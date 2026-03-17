import app from './app';
import { prisma } from './config/database.config';
import { env } from './config/env.config';

async function startServer() {
  try {
    // Test kết nối Database
    await prisma.$connect();
    console.log('✅ Đã kết nối thành công tới Database (MongoDB url: ' + env.MONGODB_URI + ')');

    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Server đang chạy tại: http://localhost:${env.PORT}`);
    });

    // Handle Unhandled Rejections
    process.on('unhandledRejection', (err: any) => {
      console.error('UNHANDLED REJECTION! 💥mkdir emptymkdir empty Đang tắt server...');
      console.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

  } catch (error) {
    console.error('❌ Lỗi kết nối Database:', error);
    process.exit(1);
  }
}

startServer();
