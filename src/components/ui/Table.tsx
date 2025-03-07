"use client";

import { ReactNode } from "react";

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className = "" }: TableProps) {
  return (
    <table className={`w-full border-collapse ${className}`}>{children}</table>
  );
}

interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

export function TableHeader({ children, className = "" }: TableHeaderProps) {
  return <thead className={`bg-gray-100 ${className}`}>{children}</thead>;
}

interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

export function TableBody({ children, className = "" }: TableBodyProps) {
  return <tbody className={`${className}`}>{children}</tbody>;
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
}

export function TableRow({ children, className = "" }: TableRowProps) {
  return (
    <tr className={`border-b border-gray-200 ${className}`}>{children}</tr>
  );
}

interface TableHeadProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void; // Added onClick prop
}

export function TableHead({
  children,
  className = "",
  onClick,
}: TableHeadProps) {
  return (
    <th
      className={`p-2 text-left font-semibold text-[var(--color-foreground)] cursor-pointer ${className}`}
      onClick={onClick}
    >
      {children}
    </th>
  );
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
}

export function TableCell({ children, className = "" }: TableCellProps) {
  return (
    <td className={`p-2 text-[var(--color-foreground)] ${className}`}>
      {children}
    </td>
  );
}

interface TableCaptionProps {
  children: ReactNode;
  className?: string;
}

export function TableCaption({ children, className = "" }: TableCaptionProps) {
  return (
    <caption
      className={`p-2 text-[var(--color-foreground)] text-center ${className}`}
    >
      {children}
    </caption>
  );
}
