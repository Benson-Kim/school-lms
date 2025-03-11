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
  FiBookOpen,
  FiBriefcase,
  FiTruck,
  FiDollarSign,
  FiBell,
  FiDatabase,
  FiShield,
  FiTool,
  FiHeart,
  FiLifeBuoy,
} from "react-icons/fi";
import { IconType } from "react-icons";
import { UserRole } from "@prisma/client";

type SidebarItem = {
  name: string;
  href?: string;
  icon: IconType;
  subItems?: SidebarItem[];
};

// Define the sidebar structure by role, using UserRole enum
export const sidebarItemsByRole: Record<UserRole, SidebarItem[]> = {
  ADMIN: [
    { name: "Dashboard", href: "/admin/dashboard", icon: FiHome },
    { name: "Students", href: "/admin/students", icon: FiUser },
    { name: "Staff", href: "/admin/staff", icon: FiUsers },
    {
      name: "Academics",
      icon: FiBook,
      subItems: [
        {
          name: "Curriculum",
          href: "/admin/academics/curriculum",
          icon: FiBook,
        },
        { name: "Grades", href: "/admin/academics/grades", icon: FiFileText },
        { name: "Courses", href: "/admin/academics/courses", icon: FiBookOpen },
        {
          name: "Assessments",
          icon: FiActivity,
          subItems: [
            {
              name: "Assignments",
              href: "/admin/academics/assessments/assignments",
              icon: FiFileText,
            },
            {
              name: "Exams",
              href: "/admin/academics/assessments/exams",
              icon: FiFileText,
            },
            {
              name: "Quizzes",
              href: "/admin/academics/assessments/quizzes",
              icon: FiFileText,
            },
          ],
        },
      ],
    },
    {
      name: "Administration",
      href: "/admin/administrative",
      icon: FiBriefcase,
    },
    {
      name: "Finances",
      href: "/admin/finance",
      icon: FiDollarSign,
    },
    {
      name: "Communication",
      href: "/admin/communication",
      icon: FiMessageSquare,
    },
    { name: "Events", href: "/admin/events", icon: FiCalendar },
    { name: "Reports & Analytics", href: "/admin/reports", icon: FiFileText },
    { name: "Settings", href: "/admin/settings", icon: FiSettings },
  ],
  TEACHER: [
    { name: "Dashboard", href: "/teacher/dashboard", icon: FiHome },
    { name: "Students", href: "/teacher/students", icon: FiUser },
    { name: "Assignments", href: "/teacher/assignments", icon: FiBook },
    { name: "Gradebook", href: "/teacher/grades", icon: FiFileText },
    { name: "Attendance", href: "/teacher/attendance", icon: FiActivity },
    {
      name: "Communication",
      href: "/teacher/communication",
      icon: FiMessageSquare,
    },
    { name: "Reports & Analytics", href: "/teacher/reports", icon: FiFileText },
  ],
  STUDENT: [
    { name: "Dashboard", href: "/student/dashboard", icon: FiHome },
    { name: "Courses", href: "/student/courses", icon: FiBook },
    { name: "Assignments", href: "/student/assignments", icon: FiBookOpen },
    { name: "Grades", href: "/student/grades", icon: FiFileText },
    { name: "Schedule", href: "/student/schedule", icon: FiCalendar },
    { name: "Messages", href: "/student/messages", icon: FiMessageSquare },
    { name: "Notifications", href: "/student/notifications", icon: FiBell },
    { name: "Library", href: "/student/library", icon: FiBookOpen },
  ],
  PARENT: [
    { name: "Dashboard", href: "/parent/dashboard", icon: FiHome },
    { name: "Student Progress", href: "/parent/progress", icon: FiActivity },
    { name: "Messages", href: "/parent/messages", icon: FiMessageSquare },
    { name: "Fee Payments", href: "/parent/payments", icon: FiCreditCard },
    { name: "Events", href: "/parent/events", icon: FiCalendar },
    { name: "Notifications", href: "/parent/notifications", icon: FiBell },
  ],
  SUPPORT_STAFF: [
    { name: "Dashboard", href: "/support/dashboard", icon: FiHome },
    { name: "Library Management", href: "/support/library", icon: FiBook },
    { name: "Health & Wellness", href: "/support/health", icon: FiHeart },
    { name: "Inventory", href: "/support/inventory", icon: FiDatabase },
    { name: "Maintenance", href: "/support/maintenance", icon: FiTool },
    { name: "Transportation", href: "/support/transportation", icon: FiTruck },
  ],
  IT: [
    { name: "Dashboard", href: "/it/dashboard", icon: FiHome },
    { name: "User Management", href: "/it/schools", icon: FiUsers },
    { name: "System Configuration", href: "/it/config", icon: FiSettings },
    { name: "Security", href: "/it/security", icon: FiShield },
    { name: "Integrations", href: "/it/integrations", icon: FiFileText },
    { name: "Technical Support", href: "/it/support", icon: FiLifeBuoy },
  ],
};
