import { BookOpen, CreditCard, FileCheck2, LayoutDashboard, Receipt, Search, Users } from 'lucide-react';
import { COURSE_ROLES, FINANCE_ROLES, USER_MANAGEMENT_ROLES, type Role } from '@/types/auth';

export interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: Role[];
  badge?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Tổng quan',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: ['SUPER_ADMIN', 'INSTRUCTOR', 'STAFF'],
      },
    ],
  },
  {
    label: 'Nội dung',
    items: [
      {
        title: 'Khoá học',
        href: '/courses',
        icon: BookOpen,
        roles: COURSE_ROLES,
      },
      {
        title: 'Chứng chỉ',
        href: '/certificates',
        icon: FileCheck2,
        roles: COURSE_ROLES,
      },
      {
        title: 'Tra cứu',
        href: '/lookup',
        icon: Search,
        roles: [...COURSE_ROLES, ...USER_MANAGEMENT_ROLES],
      },
    ],
  },
  {
    label: 'Người dùng',
    items: [
      {
        title: 'Tài khoản',
        href: '/users',
        icon: Users,
        roles: USER_MANAGEMENT_ROLES,
      },
    ],
  },
  {
    label: 'Tài chính',
    items: [
      {
        title: 'Giao dịch',
        href: '/transactions',
        icon: Receipt,
        roles: FINANCE_ROLES,
      },
      {
        title: 'Doanh thu & Thanh toán',
        href: '/billing',
        icon: CreditCard,
        roles: FINANCE_ROLES,
      },
    ],
  },
  // Nhóm Hệ thống (Cài đặt) tạm thời ẩn đi
];

export function filterNavGroups(groups: NavGroup[], role: Role): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);
}
