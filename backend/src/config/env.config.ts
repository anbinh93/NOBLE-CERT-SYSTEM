import dotenv from 'dotenv';

dotenv.config();

const NODE_ENV = process.env.NODE_ENV ?? 'development';

// MongoDB URI handling
// - Prefer explicit DB name via MONGODB_DB_NAME
// - Otherwise keep DB name from MONGODB_URI (do NOT override)
// - If MONGODB_URI has no db name, fall back by NODE_ENV
let mongoUri = process.env.MONGODB_URI?.trim();
const explicitDbName = process.env.MONGODB_DB_NAME?.trim();
const fallbackDbName = NODE_ENV === 'development' ? 'noble-cert-dev' : 'noble-cert-prod';

if (mongoUri) {
  if (/\s/.test(mongoUri)) {
    throw new Error(
      'MONGODB_URI đang chứa khoảng trắng (whitespace) nên sẽ gây lỗi xác thực MongoDB/Prisma. ' +
        'Vui lòng sửa lại MONGODB_URI trong backend/.env (không có dấu cách trong user/pass/host).'
    );
  }

  try {
    const url = new URL(mongoUri);
    const currentDb = (url.pathname || '').replace(/^\//, '');
    const desiredDb = explicitDbName || currentDb || fallbackDbName;

    // Only set pathname if missing OR explicit DB name provided
    if (explicitDbName || !currentDb) {
      url.pathname = `/${desiredDb}`;
      mongoUri = url.toString();
      process.env.MONGODB_URI = mongoUri;
    }

    // Some tooling expects DATABASE_URL; keep it in sync.
    process.env.DATABASE_URL = mongoUri;

    // eslint-disable-next-line no-console
    console.log(`Using MongoDB database: ${desiredDb}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Invalid MONGODB_URI', err);
  }
}

export const env = {
  NODE_ENV,
  PORT: Number(process.env.PORT) || 5000,
  CLIENT_URL: (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/+$/, ''),
  // Support multiple admin origins via comma-separated list in ADMIN_CLIENT_URL
  ADMIN_CLIENT_URL: (process.env.ADMIN_CLIENT_URL || 'http://localhost:3001')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/\/+$/, ''))
    .join(','),

  MONGODB_URI: mongoUri,

  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN!,

  PAYOS_CLIENT_ID: process.env.PAYOS_CLIENT_ID || 'client_id',
  PAYOS_API_KEY: process.env.PAYOS_API_KEY || 'api_key',
  PAYOS_CHECKSUM_KEY: process.env.PAYOS_CHECKSUM_KEY || 'checksum_key',
};

