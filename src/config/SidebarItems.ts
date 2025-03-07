// src/config/sidebarItems.ts

import {
  FiHome,
  FiUser,
  FiUsers,
  FiBook,
  FiSettings,
  FiFileText,
  FiMessageSquare,
  FiActivity,
  FiCalendar,
  FiCreditCard,
} from "react-icons/fi";
import { IconType } from "react-icons";
import { UserRole } from "@prisma/client";

type SidebarItem = {
  name: string;
  href: string;
  icon: IconType;
};

// Define the sidebar structure by role, using UserRole enum
export const sidebarItemsByRole: Record<UserRole, SidebarItem[]> = {
  ADMIN: [
    { name: "Dashboard", href: "/admin/dashboard", icon: FiHome },
    { name: "Manage Users", href: "/admin/users", icon: FiUsers },
    { name: "Reports & Analytics", href: "/admin/reports", icon: FiFileText },
    { name: "Settings", href: "/admin/settings", icon: FiSettings },
  ],
  TEACHER: [
    { name: "Dashboard", href: "/teacher/dashboard", icon: FiHome },
    { name: "Manage Students", href: "/teacher/students", icon: FiUser },
    { name: "Gradebook", href: "/teacher/grades", icon: FiFileText },
    { name: "Assignments", href: "/teacher/assignments", icon: FiBook },
    { name: "Attendance", href: "/teacher/attendance", icon: FiActivity },
  ],
  STUDENT: [
    { name: "Dashboard", href: "/student/dashboard", icon: FiHome },
    { name: "Courses", href: "/student/courses", icon: FiBook },
    { name: "Grades", href: "/student/grades", icon: FiFileText },
    { name: "Schedule", href: "/student/schedule", icon: FiCalendar },
    { name: "Messages", href: "/student/messages", icon: FiMessageSquare },
  ],
  PARENT: [
    { name: "Dashboard", href: "/parent/dashboard", icon: FiHome },
    { name: "Student Progress", href: "/parent/progress", icon: FiActivity },
    { name: "Messages", href: "/parent/messages", icon: FiMessageSquare },
    { name: "Fee Payments", href: "/parent/payments", icon: FiCreditCard },
    { name: "Events", href: "/parent/events", icon: FiCalendar },
  ],
  SUPPORT_STAFF: [
    { name: "Dashboard", href: "/support/dashboard", icon: FiHome },
    { name: "Inventory", href: "/support/inventory", icon: FiSettings },
    { name: "Maintenance", href: "/support/maintenance", icon: FiActivity },
  ],
  IT: [
    { name: "Dashboard", href: "/it/dashboard", icon: FiHome },
    { name: "System Users", href: "/it/schools", icon: FiUsers },
    { name: "Security", href: "/it/security", icon: FiSettings },
    { name: "Integrations", href: "/it/integrations", icon: FiFileText },
  ],
};
