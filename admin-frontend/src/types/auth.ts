/** Role values thống nhất với backend Prisma enum */
export type BackendRole = 'SUPER_ADMIN' | 'INSTRUCTOR' | 'STAFF' | 'STUDENT';
export type Role = BackendRole;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: BackendRole;
  accessToken?: string;
  avatar?: string;
}

/** Quyền xem dữ liệu nhạy cảm theo Role */
export const SENSITIVE_DATA_ROLES: BackendRole[] = ['SUPER_ADMIN'];

/** Quyền quản lý tài chính */
export const FINANCE_ROLES: BackendRole[] = ['SUPER_ADMIN', 'INSTRUCTOR'];

/** Quyền quản lý khoá học */
export const COURSE_ROLES: BackendRole[] = ['SUPER_ADMIN', 'INSTRUCTOR', 'STAFF'];

/** Quyền quản lý người dùng */
export const USER_MANAGEMENT_ROLES: BackendRole[] = ['SUPER_ADMIN', 'STAFF'];

/** Quyền cấu hình hệ thống */
export const SYSTEM_CONFIG_ROLES: BackendRole[] = ['SUPER_ADMIN'];
