'use client';

import { useAuthStore } from '@/store/auth.store';
import {
  COURSE_ROLES,
  FINANCE_ROLES,
  SENSITIVE_DATA_ROLES,
  SYSTEM_CONFIG_ROLES,
  USER_MANAGEMENT_ROLES,
  type Role,
} from '@/types/auth';

/**
 * Hook tập trung cho Auth state và kiểm tra quyền theo RBAC.
 * Encapsulates business logic tránh lặp lại role-check ở components.
 */
export function useAuth() {
  const { user, isAuthenticated, login, logout } = useAuthStore();

  const hasRole = (roles: Role[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return {
    user,
    isAuthenticated,
    login,
    logout,

    canViewSensitiveData: hasRole(SENSITIVE_DATA_ROLES),
    canManageFinance: hasRole(FINANCE_ROLES),
    canManageCourses: hasRole(COURSE_ROLES),
    canManageUsers: hasRole(USER_MANAGEMENT_ROLES),
    canConfigureSystem: hasRole(SYSTEM_CONFIG_ROLES),
  };
}
