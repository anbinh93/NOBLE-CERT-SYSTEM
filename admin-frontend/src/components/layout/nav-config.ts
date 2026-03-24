import {
  BookOpen,
  CreditCard,
  FileCheck2,
  LayoutDashboard,
  Newspaper,
  Receipt,
  Settings,
  User,
  Users,
} from "lucide-react";
import { type Role } from "@/types/auth";

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
    label: "Tổng quan",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["Super Admin"],
      },
    ],
  },
  {
    label: "Nội dung",
    items: [
      {
        title: "Khoá học",
        href: "/courses",
        icon: BookOpen,
        roles: ["Super Admin", "Instructor"],
      },
      {
        title: "Chứng chỉ",
        href: "/certificates",
        icon: FileCheck2,
        roles: ["Super Admin", "Support"],
      },
      {
        title: "Bài viết / Blog",
        href: "/posts",
        icon: Newspaper,
        roles: ["Super Admin", "Instructor", "Support"],
      },
    ],
  },
  {
    label: "Người dùng",
    items: [
      {
        title: "Tài khoản",
        href: "/users",
        icon: Users,
        roles: ["Super Admin"],
      },
    ],
  },
  {
    label: "Tài chính",
    items: [
      {
        title: "Giao dịch",
        href: "/transactions",
        icon: Receipt,
        roles: ["Super Admin"],
      },
      {
        title: "Doanh thu & Payout",
        href: "/billing",
        icon: CreditCard,
        roles: ["Super Admin"],
      },
    ],
  },
  {
    label: "Cá nhân",
    items: [
      {
        title: "Hồ sơ cá nhân",
        href: "/profile",
        icon: User,
        roles: ["Super Admin", "Instructor", "Support"],
      },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      {
        title: "Cài đặt",
        href: "/settings",
        icon: Settings,
        roles: ["Super Admin"],
      },
    ],
  },
];

export function filterNavGroups(groups: NavGroup[], role: Role): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);
}
