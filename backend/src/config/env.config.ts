import dotenv from 'dotenv';

dotenv.config();

const NODE_ENV = process.env.NODE_ENV ?? 'development';

// Cấu hình tên database theo môi trường
// - development  -> noble-cert-dev
// - ngược lại   -> noble-cert-prod
let mongoUri = process.env.MONGODB_URI;
let databaseName = 'noble-cert-prod';

if (NODE_ENV === 'development') {
  databaseName = 'noble-cert-dev';
}

if (mongoUri) {
  try {
    const url = new URL(mongoUri);
    url.pathname = `/${databaseName}`;
    mongoUri = url.toString();
    // Ghi đè lại cho Prisma client sử dụng
    process.env.MONGODB_URI = mongoUri;
    // eslint-disable-next-line no-console
    console.log(`Using MongoDB database: ${databaseName}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Invalid MONGODB_URI, cannot set db name by NODE_ENV', err);
  }
}

export const env = {
  NODE_ENV,
  PORT: Number(process.env.PORT) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

  MONGODB_URI: mongoUri,

  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN!,

  PAYOS_CLIENT_ID: process.env.PAYOS_CLIENT_ID || 'client_id',
  PAYOS_API_KEY: process.env.PAYOS_API_KEY || 'api_key',
  PAYOS_CHECKSUM_KEY: process.env.PAYOS_CHECKSUM_KEY || 'checksum_key',
};

