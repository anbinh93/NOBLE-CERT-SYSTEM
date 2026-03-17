/**
 * RBAC Role Matrix (theo spec Quản Trị Hệ Thống):
 * - Super Admin: Toàn quyền
 * - Instructor: Quản lý khoá học và doanh thu cá nhân
 * - Support: Chỉ xem danh sách giao dịch, hỗ trợ học viên
 */
export type Role = 'Super Admin' | 'Instructor' | 'Support';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

/** Quyền xem dữ liệu nhạy cảm theo Role */
export const SENSITIVE_DATA_ROLES: Role[] = ['Super Admin'];

/** Quyền quản lý tài chính */
export const FINANCE_ROLES: Role[] = ['Super Admin', 'Instructor'];

/** Quyền quản lý khoá học */
export const COURSE_ROLES: Role[] = ['Super Admin', 'Instructor'];

/** Quyền quản lý người dùng */
export const USER_MANAGEMENT_ROLES: Role[] = ['Super Admin', 'Support'];

/** Quyền cấu hình hệ thống */
export const SYSTEM_CONFIG_ROLES: Role[] = ['Super Admin'];
