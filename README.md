# Noble-Cert System

Hệ thống cấp chứng chỉ trực tuyến — gồm Backend (Express + Prisma + MongoDB), Frontend (Next.js) và Admin Frontend (Next.js).

## Yêu cầu

- **Node.js** >= 18
- **pnpm** >= 10 (`npm install -g pnpm`)
- **Docker** (cho MongoDB, Redis)

## 1. Khởi động Docker Services

```bash
# MongoDB (với Replica Set — bắt buộc cho Prisma + MongoDB)
docker run -d --name noble-mongo -p 27017:27017 mongo:7 --replSet rs0

# Khởi tạo Replica Set (chạy 1 lần duy nhất sau khi tạo container)
docker exec noble-mongo mongosh --eval 'rs.initiate()'

# Redis
docker run -d --name redis -p 6379:6379 redis:alpine
```

Kiểm tra containers:

```bash
docker ps
```

> **Lưu ý:** Prisma yêu cầu MongoDB chạy ở chế độ Replica Set. Nếu bỏ `--replSet rs0` và `rs.initiate()` thì sẽ bị lỗi kết nối.

## 2. Cấu hình Environment

Tạo file `.env` cho từng folder:

### `backend/.env`

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

MONGODB_URI=mongodb://localhost:27017/noble-cert-dev?directConnection=true
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

> **Quan trọng:** Phải có `?directConnection=true` trong `MONGODB_URI` khi kết nối MongoDB local với Replica Set.

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
# Cài tất cả workspace (từ thư mục root)
pnpm install

# Approve build scripts (Prisma, bcrypt, sharp, ...)
pnpm approve-builds
# → Nhấn "a" để chọn tất cả, Enter, rồi "y" để xác nhận
```

## 4. Khởi tạo Database

```bash
# Generate Prisma Client
pnpm --filter noble-cert-backend exec npx prisma generate

# Seed dữ liệu mẫu
pnpm --filter noble-cert-backend run seed
```

### Tài khoản mẫu sau khi seed

| Vai trò    | Email                    | Mật khẩu   |
| ---------- | ------------------------ | ---------- |
| Instructor | instructor@noblecert.com | admin123   |
| Student    | student@example.com      | student123 |

## 5. Chạy dự án

### Chạy tất cả cùng lúc

```bash
pnpm dev
```

| Service        | URL                   |
| -------------- | --------------------- |
| Frontend       | http://localhost:3000 |
| Admin Frontend | http://localhost:3001 |
| Backend API    | http://localhost:5000 |

### Chạy từng project riêng

```bash
pnpm --filter frontend dev            # Frontend
pnpm --filter noble-cert-backend dev   # Backend
pnpm --filter admin-frontend dev       # Admin
```

## 6. Các lệnh hữu ích

```bash
# Cài thêm package
pnpm --filter frontend add <package>
pnpm --filter noble-cert-backend add <package>
pnpm --filter admin-frontend add <package>

# Prisma Studio (xem database trực quan)
pnpm --filter noble-cert-backend exec npx prisma studio

# Build production
pnpm --filter frontend build
pnpm --filter noble-cert-backend build
pnpm --filter admin-frontend build
```

## Cấu trúc dự án

```
NOBLE-CERT-SYSTEM/
├── backend/              # Express + Prisma + MongoDB
│   ├── prisma/           # Schema
│   └── src/              # Source code
├── frontend/             # Next.js — User-facing (port 3000)
│   ├── app/              # App Router pages
│   └── components/       # UI components
├── admin-frontend/       # Next.js — Admin panel (port 3001)
│   └── src/              # Source code
├── .npmrc                # pnpm config (shamefully-hoist)
├── pnpm-workspace.yaml   # Workspace config
└── package.json          # Root scripts
```

## Troubleshooting

### Lỗi `Cannot find module '@tailwindcss/oxide-linux-x64-gnu'`

```bash
pnpm add -w @tailwindcss/oxide-linux-x64-gnu
```

### Lỗi `Cannot find module '.prisma/client/default'`

```bash
pnpm --filter noble-cert-backend exec npx prisma generate
```

### Lỗi `Server selection timeout` / `RsGhost` khi kết nối MongoDB

```bash
# Khởi tạo Replica Set
docker exec noble-mongo mongosh --eval 'rs.initiate()'

# Đảm bảo MONGODB_URI có ?directConnection=true
```
