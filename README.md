# Noble-Cert System

Hệ thống cấp chứng chỉ trực tuyến — gồm Backend (Express + Prisma + MongoDB), Frontend (Next.js) và Admin Frontend (Next.js).

## Yêu cầu

- **Node.js** >= 18
- **pnpm** >= 10 (`npm install -g pnpm`)
- **Docker** (cho MongoDB, PostgreSQL, Redis)

## 1. Khởi động Docker Services

```bash
# MongoDB
docker run -d --name noble-mongo -p 27017:27017 mongo:7

# Redis
docker run -d --name redis -p 6379:6379 redis:alpine

# PostgreSQL (nếu cần)
docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16-alpine
```

Kiểm tra containers đang chạy:

```bash
docker ps
```

## 2. Cấu hình Environment

Tạo file `.env` cho từng folder:

### `backend/.env`

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

MONGODB_URI=mongodb://localhost:27017/noble-cert-dev
REDIS_URL=redis://localhost:6379

JWT_SECRET=your_super_secret_access_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_REFRESH_EXPIRES_IN=7d

PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key

VIETQR_CLIENT_ID=your_vietqr_client_id
VIETQR_API_KEY=your_vietqr_api_key
```

### `frontend/.env`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000

AUTH_SECRET=your-auth-secret
AUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### `admin-frontend/.env`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## 3. Cài đặt Dependencies

```bash
# Cài tất cả workspace cùng lúc (từ thư mục root)
pnpm install

# Approve build scripts (Prisma, bcrypt, sharp, ...)
pnpm approve-builds
```

## 4. Khởi tạo Database (Prisma)

```bash
# Generate Prisma Client
pnpm --filter noble-cert-backend exec npx prisma generate

# (Tùy chọn) Seed dữ liệu mẫu
pnpm --filter noble-cert-backend run seed
```

## 5. Chạy dự án

### Chạy tất cả cùng lúc

```bash
pnpm dev
```

Lệnh này sẽ khởi động đồng thời:

| Service        | URL                   |
| -------------- | --------------------- |
| Frontend       | http://localhost:3000 |
| Backend API    | http://localhost:5000 |
| Admin Frontend | http://localhost:3001 |

### Chạy từng project riêng

```bash
# Backend
pnpm --filter noble-cert-backend dev

# Frontend
pnpm --filter frontend dev

# Admin Frontend
pnpm --filter admin-frontend dev
```

## 6. Các lệnh hữu ích

```bash
# Cài thêm package cho project cụ thể
pnpm --filter frontend add <package-name>
pnpm --filter noble-cert-backend add <package-name>
pnpm --filter admin-frontend add <package-name>

# Cài devDependencies
pnpm --filter frontend add -D <package-name>

# Chạy Prisma Studio (xem database trực quan)
pnpm --filter noble-cert-backend exec npx prisma studio

# Build production
pnpm --filter frontend build
pnpm --filter noble-cert-backend build
pnpm --filter admin-frontend build
```

## Cấu trúc dự án

```
NOBLE-CERT-SYSTEM/
├── backend/             # Express + Prisma + MongoDB
│   ├── prisma/          # Schema & migrations
│   └── src/             # Source code
├── frontend/            # Next.js (User-facing)
│   ├── app/             # App Router pages
│   └── components/      # UI components
├── admin-frontend/      # Next.js (Admin panel)
│   └── src/             # Source code
├── pnpm-workspace.yaml  # Workspace config
└── package.json         # Root scripts
```
